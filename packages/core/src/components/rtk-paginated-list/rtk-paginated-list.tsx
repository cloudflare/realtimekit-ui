import { Component, Host, h, VNode, Prop, writeTask, State, Method } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { SyncWithStore } from '../../utils/sync-with-store';
import { debounce } from 'lodash-es';
import { Meeting } from '../../components';

/**
 * HOW INFINITE SCROLL WORKS:
 *
 * We use intersectionObserver to scroll up.
 * We use scrollEnd listener to scroll down.
 *
 * Why?
 * intersectionObserver doesn't work reliably for 2 way scrolling but has great ux,
 * so we use it to smoothly scroll up.
 *
 * We have empty divs at the top and bottom ($topRef, $bottomRef)
 * which act as triggers to tell that we have reached the top or end of our messages and need to fetch new messages,
 *
 * When scrolling up, we can't remove pages as intersectionObserver relies on
 * the index of dom elements to work properly.
 * So instead, we fetch older messages and push them to the end of the 2d array
 * if length exceeds pagesAllowed, we free up the pages and keep the first empty index in memory (firstEmptyIndex).
 *
 * For scrolling down, when scroll ends we see if the bottomRef is in view.
 * If yes, we fetch the new page and insert it at the firstEmptyIndex.
 * We update timestamps and firstEmptyIndex, and rerender.
 *
 * If we have exceeded our page allowance we delete old pages.
 *
 * In this case deleting pages is okay as we are not relying on the index of dom elements to detect page end.
 *
 * This also works out for us because when a user scrolls up we do not need to manage a lastEmptyIndex.
 */

export interface DataNode {
  id: string;
  [key: string]: any;
}

@Component({
  tag: 'rtk-paginated-list',
  styleUrl: 'rtk-paginated-list.css',
  shadow: true,
})
export class RtkPaginatedList {
  private intersectionObserver: IntersectionObserver;

  private $containerRef: HTMLDivElement;

  private $topRef: HTMLDivElement;

  private $bottomRef: HTMLDivElement;

  /**
   * when scrolling up, we can't remove pages as intersectionObserver relies on
   * the index of dom elements to stay stable.
   * So, instead we free up the pages and keep the last empty index in memory.
   */
  private firstEmptyIndex: number = -1;

  private oldTS;

  private newTS;

  /** Page Size */
  @Prop() pageSize: number;

  // the length of pages will always be pageSize + 2
  private pages: any[][] = [];

  /**
   * Number of pages allowed to be shown
   */
  @Prop() pagesAllowed: number;

  /** label to show when empty */
  @Prop() emptyListLabel: string = null;

  /** Fetch the data */
  @Prop() fetchData: (timestamp: number, size: number, reversed: boolean) => Promise<unknown[]>;

  /** Create nodes */
  @Prop() createNodes: (data: unknown[]) => VNode[];

  /** Item id */
  @Prop() selectedItemId?: string;

  /** auto scroll list to bottom */
  @Prop() autoScroll: boolean;

  @State() rerenderBoolean: boolean = false;

  @State() showEmptyListLabel = false;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() isLoading: boolean = false;

  // WIP: Callback for adding a new node
  @Method()
  async onNewNode(node: DataNode) {}

  // WIP: Callback for deleting a node
  @Method()
  async onNodeDelete(id: string) {}

  // WIP: Callback for updating a node
  @Method()
  async onNodeUpdate(id: string, node: DataNode) {}

  private rerender() {
    this.rerenderBoolean = !this.rerenderBoolean;
  }

  connectedCallback() {
    this.rerender = debounce(this.rerender.bind(this), 50, { maxWait: 200 });
    this.intersectionObserver = new IntersectionObserver((entries) => {
      writeTask(() => {
        for (const entry of entries) {
          if (entry.target.id === 'top-scroll' && entry.isIntersecting) {
            this.loadOld();
          }
        }
      });
    });
  }

  componentDidLoad() {
    this.observe(this.$topRef);
    if (this.$containerRef) {
      this.$containerRef.onscrollend = () => {
        if (this.isAtBottom() && this.firstEmptyIndex > -1) {
          this.loadNew();
        }
      };
    }
  }

  private observe = (el: HTMLElement) => {
    if (!el) return;
    this.intersectionObserver.observe(el);
  };

  private async loadOld() {
    /**
     * NOTE(ikabra): this case also runs on initial load
     * if scrolling up ->
     * fetch older messages and push to the end of the array
     * cleanup 1st non empty page from the array if length exceeds pagesAllowed
     */

    // if no old timestamp, it means we are at initial state
    if (!this.oldTS) this.oldTS = new Date().getTime();

    // load data
    this.isLoading = true;
    const data = await this.fetchData(this.oldTS - 1, this.pageSize, true);
    this.isLoading = false;

    // no more old messages to show, we are at the top of the page
    if (!data.length) return;

    // add old data to the end of the array
    this.pages.push(data);

    // clear old pages when we reach the limit
    if (this.pages.length > this.pagesAllowed) {
      this.pages[this.pages.length - this.pagesAllowed - 1] = [];
      this.firstEmptyIndex = this.pages.length - this.pagesAllowed - 1;
    }

    // update the old timestamp
    const lastPage = this.pages[this.pages.length - 1];
    this.oldTS = (lastPage[lastPage.length - 1] as any).timeMs;

    // update the new timestamp
    this.newTS = this.pages[this.firstEmptyIndex + 1][0].timeMs;

    this.rerender();
  }

  private async loadNew() {
    // new timestamp needs to be assigned by loadOld method
    if (!this.newTS) return;

    // load data
    this.isLoading = true;
    const data = await this.fetchData(this.newTS + 1, this.pageSize, false);
    this.isLoading = false;

    // no more new messages to load
    if (!data.length) return;

    // index 0: oldest
    // index last: newest

    this.pages[this.firstEmptyIndex] = data.reverse();

    if (this.pages.length > this.pagesAllowed) {
      this.pages.pop();
    }

    this.newTS = this.pages[this.firstEmptyIndex][0].timeMs;

    // update the old timestamp
    const lastPage = this.pages[this.pages.length - 1];
    this.oldTS = (lastPage[lastPage.length - 1] as any).timeMs;
    // when scrolling too fast scroll a bit to the top to be able to load new messages when you scroll down
    if (this.$containerRef.scrollTop === 0) this.$containerRef.scrollTop = -60;

    this.firstEmptyIndex--;

    this.rerender();
  }

  private isAtBottom = () => {
    const rect = this.$bottomRef.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  };

  render() {
    /**
     * div.container is flex=column-reverse
     * which is why div#bottom-scroll comes before div#top-scroll
     * div.page-wrapper prevents reversal of messages
     */
    return (
      <Host>
        <div class="scrollbar container" part="container" ref={(el) => (this.$containerRef = el)}>
          <div class={'show-new-messages'}>
            <rtk-button
              class="show-new-messages"
              kind="icon"
              variant="secondary"
              part="show-new-messages"
            >
              <rtk-icon icon={this.iconPack.chevron_down} />
            </rtk-button>
          </div>
          <div
            class="smallest-dom-element"
            id="bottom-scroll"
            ref={(el) => (this.$bottomRef = el)}
          ></div>
          {this.isLoading && <rtk-spinner size="lg" />}
          {!this.isLoading && this.pages.flat().length === 0 ? (
            <div class="empty-list">{this.t('list.empty')}</div>
          ) : (
            <div class="page-wrapper">
              {this.pages.map((page, pageIndex) => (
                <div class="page" data-page-index={pageIndex}>
                  {this.createNodes([...page].reverse())}
                </div>
              ))}
            </div>
          )}
          <div class="smallest-dom-element" id="top-scroll" ref={(el) => (this.$topRef = el)}></div>
        </div>
      </Host>
    );
  }
}
