import { Component, Host, h, VNode, Prop, writeTask, State, Watch } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { SyncWithStore } from '../../utils/sync-with-store';
import { debounce } from 'lodash-es';
import { Meeting } from '../../components';
import { ChatUpdateParams } from '@cloudflare/realtimekit';

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

  private $topRef: HTMLDivElement;

  private $bottomRef: HTMLDivElement;

  /** Page Size */
  @Prop() pageSize: number;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

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

  private rerender() {
    this.rerenderBoolean = !this.rerenderBoolean;
  }

  private oldestTimestamp;
  private newestTimestamp;

  connectedCallback() {
    this.meetingChanged(this.meeting);
    this.rerender = debounce(this.rerender.bind(this), 50, { maxWait: 200 });
    this.intersectionObserver = new IntersectionObserver((entries) => {
      writeTask(() => {
        for (const entry of entries) {
          if (entry.target.id === 'bottom-scroll' && entry.isIntersecting) {
            this.load(false);
          }
          if (entry.target.id === 'top-scroll' && entry.isIntersecting) {
            this.load(true);
          }
        }
      });
    });
  }

  disconnectedCallback() {
    this.disconnectMeeting(this.meeting);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting) this.disconnectMeeting(oldMeeting);
    if (!meeting || !meeting.chat) return;
    meeting.chat?.addListener('chatUpdate', this.chatUpdateListener);
  }

  private disconnectMeeting = (meeting) => {
    meeting?.chat?.removeListener('chatUpdate', this.chatUpdateListener);
  };

  private chatUpdateListener = ({ action, message }: ChatUpdateParams) => {
    if (action === 'add') {
      console.log('here: new message added', message);
    }
  };

  componentDidLoad() {
    /**
     * Adding observes here so that on the first render we scroll down
     * and shouldRenderNewNodes remains true
     */
    this.observe(this.$topRef);
    this.observe(this.$bottomRef);
  }

  componentDidRender() {
    // TODO: auto scroll to bottom
  }

  private observe = (el: HTMLElement) => {
    if (!el) return;
    this.intersectionObserver.observe(el);
  };

  private async load(older: boolean = true) {
    if (older) {
      /**
       * NOTE(ikabra): this case also runs on initial load
       * if scrolling up ->
       * fetch older messages and push to the end of the array
       * remove 1st element from the array if length exceeds pagesAllowed
       */

      // if no oldestTimestamp, it means we are at initial state
      if (!this.oldestTimestamp) this.oldestTimestamp = new Date().getTime();

      // load data
      this.isLoading = true;
      const data = await this.fetchData(this.oldestTimestamp - 1, this.pageSize, older);
      this.isLoading = false;

      // no more old messages to show, we are at the top of the page
      if (!data.length) return;

      // add old data to the end of the array
      this.pages.push(data);

      // update the oldest timestamp, if data exists
      const lastPage = this.pages[this.pages.length - 1];
      this.oldestTimestamp = (lastPage[lastPage.length - 1] as any).timeMs;

      // set the newest timestamp, if it does not exist
      if (!this.newestTimestamp) this.newestTimestamp = (this.pages[0][0] as any).timeMs;
    } else {
      // if initial state, do nothing
      if (!this.pages.length) return;

      // fetch data after the newest timestamp
      this.isLoading = true;
      const data = await this.fetchData(this.newestTimestamp + 1, this.pageSize, older);
      this.isLoading = false;

      // no more new messages, we are at the end of the page
      if (!data.length) return;

      // add data to the start of the array
      this.pages.unshift(data.reverse());

      // update the newest timestamp to the 1st message of the 1st page
      if (this.pages[0]?.[0])
        this.newestTimestamp = this.newestTimestamp = (this.pages[0][0] as any).timeMs;
    }
    console.log('here: pages', this.pages);
    this.rerender();
  }

  render() {
    /**
     * div.container is flex=column-reverse
     * which is why div#bottom-scroll comes before div#top-scroll
     * div.page-wrapper prevents reversal of messages
     */
    return (
      <Host>
        <div class="scrollbar container" part="container">
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
