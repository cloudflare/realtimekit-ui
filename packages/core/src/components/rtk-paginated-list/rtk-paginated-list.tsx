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
 * We update timestamps & firstEmptyIndex, then we rerender.
 *
 * If we have exceeded our page allowance we delete old pages.
 *
 * In this case deleting pages is okay as we are not relying on the index of dom elements to detect page end.
 *
 * This also simplifies the code because when a user scrolls up we do not need to manage a lastEmptyIndex.
 */

import { Component, Host, h, VNode, Prop, writeTask, State, Method } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { SyncWithStore } from '../../utils/sync-with-store';
import { debounce } from 'lodash-es';
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

  private maxTS = 0;

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

  @State() isLoadingTop: boolean = false;

  @State() isLoadingBottom: boolean = false;

  /**
   * Even when auto scroll is enabled, we only want to scroll if a new realtime message has arrived
   * This variable tells us if we should respect auto scroll after a new page has been loaded.
   * It is also used by the manual scroll to bottom button.
   *  */
  private shouldScrollToBottom: boolean = false;

  /**
   * Adds a new node to the beginning of the paginated list
   * @param {DataNode} node - The data node to add to the beginning of the list
   */
  @Method()
  async onNewNode(node: DataNode) {
    // if we are at the bottom of the page
    if (this.firstEmptyIndex === -1) {
      // just append messages to the page if page has not reached full capacity
      if (this.pages[0].length < this.pageSize) {
        this.pages[0].unshift(node);
        this.newTS = node.timeMs;
        this.rerender();
      } else {
        // if page is at full capacity, load next page
        this.loadNextPage();
      }
    }
    // Always update the maxTS. New messages will load automatically based on this setting.
    this.maxTS = Math.max(this.maxTS, node.timeMs);

    // If autoscroll is enabled this function will scroll to the bottom
    if (this.autoScroll) {
      this.shouldScrollToBottom = true;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    this.$bottomRef.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Deletes a node anywhere from the list
   * @param {string} id - The id of the node to delete
   * */
  @Method()
  async onNodeDelete(id: string) {}

  /**
   * Updates a new node anywhere in the list
   * @param {string} id - The id of the node to update
   * @param {DataNode} node - The updated data node
   * */
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
            this.loadPrevPage();
          }
        }
      });
    });
  }

  componentDidLoad() {
    this.observe(this.$topRef);
    if (this.$containerRef) {
      this.$containerRef.onscrollend = async () => {
        /**
         * Load new page if:
         * if there are nodes to load at the bottom (maxTS > newTS)
         * or if there are pages to fill at the bottom (firstEmptyIndex > -1)
         */
        if (this.isAtBottom() && (this.maxTS > this.newTS || this.firstEmptyIndex > -1)) {
          await this.loadNextPage();
          if (this.shouldScrollToBottom) this.scrollToBottom();
        }
      };
    }
  }

  private observe = (el: HTMLElement) => {
    if (!el) return;
    this.intersectionObserver.observe(el);
  };

  private async loadPrevPage() {
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
    this.isLoadingTop = true;
    const data = await this.fetchData(this.oldTS - 1, this.pageSize, true);
    this.isLoading = false;
    this.isLoadingTop = false;

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

  private async loadNextPage() {
    // new timestamp needs to be assigned by loadOld method
    if (!this.newTS) {
      this.shouldScrollToBottom = false;
      return;
    }

    // load data
    this.isLoading = true;
    this.isLoadingBottom = true;
    const data = await this.fetchData(this.newTS + 1, this.pageSize, false);
    this.isLoading = false;
    this.isLoadingBottom = false;

    // no more new messages to load
    if (!data.length) {
      this.shouldScrollToBottom = false;
      return;
    }

    // when filling empty pages
    if (this.firstEmptyIndex > -1) {
      this.pages[this.firstEmptyIndex] = data.reverse();
    } else {
      // when already at the bottom and loading messages in realtime
      this.pages.unshift(data.reverse());
    }

    if (this.pages.length > this.pagesAllowed) {
      this.pages.pop();
    }

    // smallest value for firstEmptyIndex can be -1, so we cap the index at 0
    this.newTS = this.pages[Math.max(0, this.firstEmptyIndex)][0].timeMs;

    // update the old timestamp
    const lastPage = this.pages[this.pages.length - 1];
    this.oldTS = (lastPage[lastPage.length - 1] as any).timeMs;
    // when scrolling too fast scroll a bit to the top to be able to load new messages when you scroll down
    if (this.$containerRef.scrollTop === 0) this.$containerRef.scrollTop = -60;

    // smallest value for this index can be -1 (indicates we are at the bottom of the page).
    this.firstEmptyIndex = Math.max(-1, this.firstEmptyIndex - 1);

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
     */
    return (
      <Host>
        <div class="scrollbar container" part="container" ref={(el) => (this.$containerRef = el)}>
          <div class={{ 'show-new-messages-ctr': true }}>
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
          {/* Loader for next page */}
          {this.isLoadingBottom && this.pages.length > 0 && <rtk-spinner size="sm" />}
          {/* Initial data loader */}
          {this.isLoading && this.pages.length < 1 && <rtk-spinner size="lg" />}
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
          {/* Loader for previous page */}
          {this.isLoadingTop && this.pages.length > 0 && <rtk-spinner size="sm" />}
          <div class="smallest-dom-element" id="top-scroll" ref={(el) => (this.$topRef = el)}></div>
        </div>
      </Host>
    );
  }
}
