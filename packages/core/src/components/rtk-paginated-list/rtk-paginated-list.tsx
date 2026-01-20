/**
 * NOTE(ikabra): INFINITE SCROLL IMPLEMENTATION:
 *
 * Uses scrollend listener for 2way scrolling.
 * Empty divs ($topRef, $bottomRef) act as scroll triggers to fetch new messages.
 *
 * UPWARD SCROLLING:
 * - Fetch top anchor (element currently visible to the user near top)
 * - Fetch older messages, push to end of 2D array
 * - When exceeding pagesAllowed, delete pages and scroll back to anchor
 *
 * DOWNWARD SCROLLING:
 * - Fetch bottom anchor (element currently visible to the user near bottom)
 * - Fetch new page, insert at the start
 * - Update timestamps & firstEmptyIndex, then rerender
 * - When exceeding pagesAllowed, delete pages and scroll back to anchor
 *
 * ADDING NEW NODES:
 * - If no pages exist, load old page
 * - If on 1st page, append messages till page size is full and then load new page
 *
 * DELETE NODE:
 * - If deleting the only available node, reset to initial state
 * - If page is empty, delete it
 * - Update timestamp curors
 */

import { Component, Host, h, VNode, Prop, State, Method } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { SyncWithStore } from '../../utils/sync-with-store';
import { debounce } from 'lodash-es';
export interface DataNode {
  id: string;
  [key: string]: any;
}

type ScrollAnchorEdge = 'top' | 'bottom';

type ScrollAnchor =
  | { id: string; edge: 'top'; offsetTop: number }
  | { id: string; edge: 'bottom'; offsetBottom: number };

@Component({
  tag: 'rtk-paginated-list',
  styleUrl: 'rtk-paginated-list.css',
  shadow: true,
})
export class RtkPaginatedList {
  private $containerRef: HTMLDivElement;

  private $topRef: HTMLDivElement;

  private $bottomRef: HTMLDivElement;

  private oldTS;

  private newTS;

  private maxTS;

  // the length of pages will always be pageSize + 2
  private pages: any[][] = [];

  // Controls whether to keep auto-scrolling when a new page load.
  private shouldScrollToBottom: boolean = false;

  // Shows "scroll to bottom" button when new nodes arrive and autoscroll is off.
  private showNewMessagesCTR: boolean = false;

  /** Page Size */
  @Prop() pageSize: number;

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

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() rerenderBoolean: boolean = false;

  @State() showEmptyListLabel = false;

  @State() isLoading: boolean = false;

  @State() isLoadingTop: boolean = false;

  @State() isLoadingBottom: boolean = false;

  /**
   * Adds a new node to the beginning of the paginated list
   * @param {DataNode} node - The data node to add to the beginning of the list
   */
  @Method()
  async onNewNode(node: DataNode) {
    // if there are no pages, append to the first page
    if (this.pages.length < 1) {
      this.oldTS = node.timeMs;
      this.pages.unshift([node]);
      this.newTS = node.timeMs;
      this.maxTS = node.timeMs;
      this.rerender();
    } else if (this.maxTS === this.newTS) {
      this.maxTS = node.timeMs;
      // append messages to the page if page has not reached full capacity
      if (this.pages[0].length < this.pageSize) {
        this.pages[0].unshift(node);
        this.newTS = node.timeMs;
        this.rerender();
      } else {
        // if page is at full capacity, load next page
        this.pages.unshift([node]);
        this.newTS = node.timeMs;
        // remove pages if out of bounds
        if (this.pages.length > this.pagesAllowed) this.pages.pop();
        // update timestamps
        const lastPage = this.pages[this.pages.length - 1];
        this.oldTS = (lastPage[lastPage.length - 1] as any).timeMs;
        this.newTS = this.pages[0][0].timeMs;
        this.rerender();
      }
    }
    this.pendingScrollAnchor = null;
  }

  /**
   * Deletes a node anywhere from the list
   * @param {string} id - The id of the node to delete
   * */
  @Method()
  async onNodeDelete(id: string) {
    for (let i = this.pages.length - 1; i >= 0; i--) {
      const index = this.pages[i].findIndex((node) => node.id === id);
      // if message not found, move on
      if (index === -1) continue;
      // delete message
      this.pages[i].splice(index, 1);
      // if page is empty, delete it
      if (this.pages[i].length === 0) this.pages.splice(i, 1);
      // update timestamps
      const firstPage = this.pages[0];
      const lastPage = this.pages[this.pages.length - 1];
      this.newTS = firstPage?.[0]?.timeMs;
      this.oldTS = lastPage?.[lastPage.length - 1]?.timeMs;
      // if I have deleted the latest message, update maxTS
      if (index === 0 && i === 0) this.maxTS = this.newTS;
      this.rerender();
      break;
    }
  }

  /**
   * Updates a new node anywhere in the list
   * @param {string} id - The id of the node to update
   * @param {DataNode} node - The updated data node
   * */
  @Method()
  async onNodeUpdate(id: string, node: DataNode) {
    for (let i = this.pages.length - 1; i >= 0; i--) {
      const index = this.pages[i].findIndex((node) => node.id === id);
      // if message not found, move on
      if (index === -1) continue;
      // edit message
      this.pages[i][index] = node;
      this.rerender();
      break;
    }
  }

  // Tells us if we need to scroll to a specific anchor after a rerender
  private pendingScrollAnchor: ScrollAnchor | null = null;

  connectedCallback() {
    this.rerender = debounce(this.rerender.bind(this), 50, { maxWait: 200 });
  }

  componentDidLoad() {
    // initial load
    this.loadPrevPage();
    if (this.$containerRef) {
      this.$containerRef.onscrollend = async () => {
        if (this.isInView(this.$bottomRef)) {
          await this.loadNextPage();
        } else if (this.isInView(this.$topRef)) {
          this.showNewMessagesCTR = true;
          await this.loadPrevPage();
        }
      };
    }
  }

  componentDidRender() {
    if (!this.pendingScrollAnchor) return;
    const anchor = this.pendingScrollAnchor;
    this.pendingScrollAnchor = null;
    this.restoreScrollToAnchor(anchor);
  }

  private async loadPrevPage() {
    if (this.isLoading) return;

    const scrollAnchor = this.getScrollAnchor('top');

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
    if (this.pages.length > this.pagesAllowed) this.pages.shift();

    // update timestamps
    const lastPage = this.pages[this.pages.length - 1];
    this.oldTS = (lastPage[lastPage.length - 1] as any).timeMs;
    this.newTS = this.pages[0][0].timeMs;
    if (!this.maxTS) this.maxTS = this.newTS;

    this.rerender();

    // fix scroll position
    if (scrollAnchor) this.pendingScrollAnchor = scrollAnchor;
  }

  private async loadNextPage() {
    if (this.isLoading) return;

    // Do nothing. New timestamp needs to be assigned by loadPrevPage method
    if (!this.newTS) {
      this.showNewMessagesCTR = false;
      this.shouldScrollToBottom = false;
      return;
    }

    this.isLoading = true;
    this.isLoadingBottom = true;

    const scrollAnchor = this.getScrollAnchor('bottom');

    const data = await this.fetchData(this.newTS + 1, this.pageSize, false);
    this.isLoading = false;
    this.isLoadingBottom = false;

    // no more new messages to load
    if (!data.length) {
      this.maxTS = this.newTS;
      this.showNewMessagesCTR = false;
      this.shouldScrollToBottom = false;
      return;
    }

    // load new messages and append to the start
    this.pages.unshift(data.reverse());

    // remove pages if out of bounds
    if (this.pages.length > this.pagesAllowed) this.pages.pop();

    // update timestamps
    const lastPage = this.pages[this.pages.length - 1];
    this.oldTS = (lastPage[lastPage.length - 1] as any).timeMs;
    this.newTS = this.pages[0][0].timeMs;

    this.rerender();
    this.pendingScrollAnchor = scrollAnchor;
  }

  // Find the element that is closest to the top/bottom of the container
  private getScrollAnchor(edge: ScrollAnchorEdge = 'top') {
    if (!this.$containerRef) return null;

    const containerRect = this.$containerRef.getBoundingClientRect();
    const candidates = Array.from(this.$containerRef.querySelectorAll<HTMLElement>('[id]')).filter(
      (el) => el.id !== 'top-scroll' && el.id !== 'bottom-scroll'
    );

    let best: ScrollAnchor | null = null;
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const isVisibleInContainer =
        rect.bottom > containerRect.top && rect.top < containerRect.bottom;
      if (!isVisibleInContainer) continue;

      if (edge === 'top') {
        const offsetTop = rect.top - containerRect.top;
        if (best == null || (best.edge === 'top' && offsetTop < best.offsetTop)) {
          best = { id: el.id, edge: 'top', offsetTop };
        }
      } else {
        const offsetBottom = containerRect.bottom - rect.bottom;
        if (best == null || (best.edge === 'bottom' && offsetBottom < best.offsetBottom)) {
          best = { id: el.id, edge: 'bottom', offsetBottom };
        }
      }
    }
    return best;
  }

  //instant scroll to anchor to make sure we are at the same position after a rerender
  private restoreScrollToAnchor(anchor: ScrollAnchor) {
    if (!this.$containerRef) return;

    // make element id safe to use inside a CSS selector
    const escapeId = (id: string) => {
      const cssEscape = (globalThis as any).CSS?.escape;
      return typeof cssEscape === 'function'
        ? cssEscape(id)
        : id.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    };

    const el = this.$containerRef.querySelector<HTMLElement>(`#${escapeId(anchor.id)}`);
    if (!el) return;

    const containerRect = this.$containerRef.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    if (anchor.edge === 'top') {
      const newOffsetTop = rect.top - containerRect.top;
      this.$containerRef.scrollTop += newOffsetTop - anchor.offsetTop;
    } else {
      const newOffsetBottom = containerRect.bottom - rect.bottom;
      this.$containerRef.scrollTop += anchor.offsetBottom - newOffsetBottom;
    }
  }

  private isInView = (el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  };

  // this method is called recursively based on shouldScrollToBottom (see loadNextPage)
  private scrollToBottom() {
    this.$bottomRef.scrollIntoView({ behavior: 'smooth' });
  }

  private rerender() {
    this.rerenderBoolean = !this.rerenderBoolean;
  }

  render() {
    /**
     * div.container is flex=column-reversewhich is why div#bottom-scroll comes before div#top-scroll
     */
    return (
      <Host>
        <div class="scrollbar container" part="container" ref={(el) => (this.$containerRef = el)}>
          <div class={{ 'show-new-messages-ctr': true, active: this.showNewMessagesCTR }}>
            <rtk-button
              class="show-new-messages"
              kind="icon"
              variant="secondary"
              part="show-new-messages"
              onClick={() => {
                this.shouldScrollToBottom = true;
                this.scrollToBottom();
              }}
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
