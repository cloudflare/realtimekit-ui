/**
 * INFINITE SCROLL IMPLEMENTATION:
 *
 * Uses IntersectionObserver for upward scrolling and scrollend listener for downward scrolling.
 * IntersectionObserver provides smooth UX but isn't reliable for bidirectional scrolling.
 * Empty divs ($topRef, $bottomRef) act as scroll triggers to fetch new messages.
 *
 * UPWARD SCROLLING:
 * - Can't remove pages (IntersectionObserver needs stable DOM indices)
 * - Fetch older messages, push to end of 2D array
 * - When exceeding pagesAllowed, free pages and track firstEmptyIndex
 *
 * DOWNWARD SCROLLING:
 * - On scrollend, check if bottomRef is visible
 * - Fetch new page, insert at firstEmptyIndex
 * - Update timestamps & firstEmptyIndex, then rerender
 * - Safe to delete old pages (no DOM index dependency)
 *
 * ADDING NEW NODES:
 * - If no pages exist, load old page
 * - If on 1st page, append messages till page size is full and then load new page
 *
 * DELETE NODE:
 * - If deleting the only available node, reset to initial state
 * - If 1st page is empty, update first empty index
 * - If last page is empty, delete it
 * - Update timestamp curors
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

  /** When scrolling up, pages can't be removed as intersectionObserver requires stable DOM element indices.
   * So, we free pages and track the last empty index. */
  private firstEmptyIndex: number = -1;

  private oldTS;

  private newTS;

  private maxTS = 0;

  /** Page Size */
  @Prop() pageSize: number;

  // the length of pages will always be pageSize + 2
  private pages: any[][] = [];

  // Controls whether to keep auto-scrolling when a new page load.
  private shouldScrollToBottom: boolean = false;

  // Shows "scroll to bottom" button when new nodes arrive and autoscroll is off.
  @State() showNewMessagesCTR: boolean = false;

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
   * Adds a new node to the beginning of the paginated list
   * @param {DataNode} node - The data node to add to the beginning of the list
   */
  @Method()
  async onNewNode(node: DataNode) {
    // Always update the maxTS. New messages will load on scroll till the end cursor (newTS) reaches this value.
    this.maxTS = Math.max(this.maxTS, node.timeMs);

    // if we are at the bottom of the page
    if (this.firstEmptyIndex === -1) {
      // if there are no pages, load the first page
      if (this.pages.length < 1) {
        // update old timer to 1ms ahead of the latest message as we subtract this value to avoid loading duplicate messages when scrolling
        this.oldTS = node.timeMs + 1;
        this.loadPrevPage();
      } else {
        // append messages to the page if page has not reached full capacity
        if (this.pages[0].length < this.pageSize) {
          this.pages[0].unshift(node);
          this.newTS = node.timeMs;
          this.rerender();
        } else {
          // if page is at full capacity, load next page
          this.loadNextPage();
        }
      }
    }

    // If autoscroll is enabled, this method will scroll to the bottom
    if (this.autoScroll) {
      this.shouldScrollToBottom = true;
      this.scrollToBottom();
    }
  }

  /**
   * Deletes a node anywhere from the list
   * @param {string} id - The id of the node to delete
   * */
  @Method()
  async onNodeDelete(id: string) {
    // Iterate only over pages that have content (not empty)
    for (let i = this.pages.length - 1; i > this.firstEmptyIndex; i--) {
      const index = this.pages[i].findIndex((node) => node.id === id);
      // message in view
      if (index !== -1) {
        // delete message
        this.pages[i].splice(index, 1);
        // if we are on the first page and it's now empty, we need to go back to initial state
        if (i === 0 && this.pages[i].length === 0) {
          this.pages.shift();
          this.firstEmptyIndex = -1;
        } else if (i === this.firstEmptyIndex + 1) {
          //  if newest page is empty, update first empty index
          if (this.pages[i].length === 0) this.firstEmptyIndex++;
          // update timestamp, first empty index could be -1, so we need to cap it at 0
          this.newTS = this.pages[Math.max(this.firstEmptyIndex, 0)][0].timeMs;
        } else if (i === this.firstEmptyIndex + this.pagesAllowed) {
          //  if oldest page is empty, remove it
          if (this.pages[i].length === 0) this.pages.pop();
          // update timestamp
          const lastPage = this.pages[this.firstEmptyIndex + this.pagesAllowed];
          this.oldTS = lastPage[lastPage.length - 1].timeMs;
        }
        this.rerender();
      }
    }
  }

  /**
   * Updates a new node anywhere in the list
   * @param {string} _id - The id of the node to update
   * @param {DataNode} _node - The updated data node
   * */
  @Method()
  async onNodeUpdate(_id: string, _node: DataNode) {}

  connectedCallback() {
    this.rerender = debounce(this.rerender.bind(this), 50, { maxWait: 200 });
    this.intersectionObserver = new IntersectionObserver((entries) => {
      writeTask(async () => {
        for (const entry of entries) {
          if (entry.target.id === 'top-scroll' && entry.isIntersecting) {
            this.isLoadingTop = true;
            await this.loadPrevPage();
            this.isLoadingTop = false;
          }
        }
      });
    });
  }

  disconnectedCallback() {
    this.intersectionObserver.disconnect();
  }

  componentDidLoad() {
    this.observe(this.$topRef);
    if (this.$containerRef) {
      this.$containerRef.onscrollend = async () => {
        const isAtBottom = this.isAtBottom();
        /**
         * Load new page if:
         * if there are nodes to load at the bottom (maxTS > newTS)
         * or if there are pages to fill at the bottom (firstEmptyIndex > -1)
         */
        if (isAtBottom && (this.maxTS > this.newTS || this.firstEmptyIndex > -1)) {
          this.isLoadingBottom = true;
          await this.loadNextPage();
          this.isLoadingBottom = false;
          if (this.shouldScrollToBottom) this.scrollToBottom();
        }

        // if bottom is not visible, show new message ctr
        if (!isAtBottom) {
          this.showNewMessagesCTR = true;
        }
      };
    }
  }

  private async loadPrevPage() {
    if (this.isLoading) return;

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
      // Find the first empty page index. Middle pages can be empty due to message deletion.
      for (let i = this.firstEmptyIndex + 1; i < this.pages.length; i++) {
        if (this.pages[i].length > 0) break;
        this.firstEmptyIndex = i;
      }
    }

    // update the old timestamp
    const lastPage = this.pages[this.pages.length - 1];
    this.oldTS = (lastPage[lastPage.length - 1] as any).timeMs;

    // update the new timestamp
    this.newTS = this.pages[this.firstEmptyIndex + 1][0].timeMs;

    this.rerender();
  }

  private async loadNextPage() {
    if (this.isLoading) return;
    // new timestamp needs to be assigned by loadPrevPage method
    if (!this.newTS) {
      this.stopScrolling();
      return;
    }

    // load data
    this.isLoading = true;
    const data = await this.fetchData(this.newTS + 1, this.pageSize, false);
    this.isLoading = false;

    // no more new messages to load
    if (!data.length) {
      this.stopScrolling();
      // remove any extra pages at the top due to deleted messages
      this.pages = this.pages.filter((page) => page.length > 0);
      this.firstEmptyIndex = -1;
      return;
    }

    // when filling empty pages
    if (this.firstEmptyIndex > -1) {
      this.pages[this.firstEmptyIndex] = data.reverse();
    } else {
      // when already at the bottom and loading messages in realtime
      this.pages.unshift(data.reverse());
    }

    if (this.pages.length > this.pagesAllowed) this.pages.pop();

    // smallest value for firstEmptyIndex can be -1, so we cap the index at 0
    this.newTS = this.pages[Math.max(0, this.firstEmptyIndex)][0].timeMs;

    // remove all empty pages from the end
    for (let i = this.pages.length - 1; i > this.firstEmptyIndex; i--) {
      if (this.pages[i].length > 0) break;
      // if page is empty, remove it
      this.pages.pop();
    }
    // update the old timestamp
    const lastPage = this.pages[this.pages.length - 1];
    this.oldTS = (lastPage[lastPage.length - 1] as any).timeMs;
    // Adjust scrollbar position to be able to load new messages when scrolling down
    if (this.$containerRef.scrollTop === 0) this.$containerRef.scrollTop = -60;

    // smallest value can be -1 (indicating bottom of the list).
    this.firstEmptyIndex = Math.max(-1, this.firstEmptyIndex - 1);

    this.rerender();
  }

  private isAtBottom = () => {
    const rect = this.$bottomRef.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  };

  private stopScrolling() {
    this.showNewMessagesCTR = false;
    this.shouldScrollToBottom = false;
  }

  private observe = (el: HTMLElement) => {
    if (!el) return;
    this.intersectionObserver.observe(el);
  };

  private rerender() {
    this.rerenderBoolean = !this.rerenderBoolean;
  }

  private scrollToBottom() {
    this.$bottomRef.scrollIntoView({ behavior: 'smooth' });
    this.showNewMessagesCTR = false;
  }

  render() {
    // div.container is flex=column-reverse hence div#bottom-scroll comes before div#top-scroll
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
