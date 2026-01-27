import { Component, Event, EventEmitter, Method, Watch, h, Host, Prop, State } from '@stencil/core';
import { SyncWithStore } from '../../utils/sync-with-store';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Message } from '@cloudflare/realtimekit';
import type { Meeting } from '../../types/rtk-client';
import { elapsedDuration } from '../../utils/date';

@Component({
  tag: 'rtk-pinned-message-selector',
  styleUrl: 'rtk-pinned-message-selector.css',
  shadow: true,
})
export class RtkPinnedMessageSelector {
  @State() isOpen = false;

  /** */
  @Event({ eventName: 'rtkDropdownToggle' }) dropdownToggle: EventEmitter<{ open: boolean }>;

  /** Emits when a pinned message is selected */
  @Event({ eventName: 'rtkPinnedMessageSelect', bubbles: true, composed: true })
  pinnedMessageSelect: EventEmitter<Message>;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  //NOTE(ikabra): Fix this value once backend supports pagination for participants
  @State() pageSize = 25;

  @State() pagesAllowed = 3;

  connectedCallback() {}

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    this.$paginatedListRef?.reset();
  }

  /** */
  @Method()
  async close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dropdownToggle.emit({ open: false });
  }

  private toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.isOpen = !this.isOpen;
    this.dropdownToggle.emit({ open: this.isOpen });
  };

  private $paginatedListRef: HTMLRtkPaginatedListElement;

  private getPinnedChatMessages = async (timestamp: number, size: number, reversed: boolean) => {
    const localMeeting = this.meeting;
    if (!localMeeting) return [];
    try {
      const messages = await localMeeting.chat.fetchPinnedMessages({
        timestamp,
        offset: 0,
        limit: size,
        direction: reversed ? 'before' : 'after',
      });
      return messages;
    } catch (err) {
      return [];
    }
  };

  private createPinnedChatNodes = (messages: Message[]) => {
    return messages.map((message) => {
      const preview =
        message.type === 'text'
          ? (message.message || '').replace(/\s+/g, ' ').trim()
          : message.type === 'file'
          ? 'File Attachment'
          : message.type === 'image'
          ? 'Image Attachment'
          : '';

      return (
        <div
          class="pinned-message"
          id={message.id}
          onClick={() => {
            this.pinnedMessageSelect.emit(message);
            this.close();
          }}
        >
          <rtk-avatar
            size="sm"
            participant={{
              name: message.displayName,
              picture: '',
            }}
          />
          <div class="pinned-message-content">
            <div class="pinned-message-preview" title={preview}>
              {preview}
            </div>
            <div class="pinned-message-meta">
              <span class="pinned-message-time">
                {elapsedDuration(message.time, new Date(Date.now()))}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  render() {
    return (
      <Host>
        <div class="chat-header" onClick={this.toggle}>
          <div class="chat-header-label">
            <rtk-icon icon={this.iconPack.pin} size="sm" />
            {this.t('chat.pinned_msgs')}
          </div>
          <div class="chevron">
            <rtk-icon
              icon={this.isOpen ? this.iconPack.chevron_up : this.iconPack.chevron_down}
              size="sm"
            />
          </div>
        </div>

        <div class={{ dropdown: true, open: this.isOpen, scrollbar: true }}>
          <rtk-paginated-list
            class="pinned-message-selector-paginated-list"
            ref={(el) => (this.$paginatedListRef = el)}
            pageSize={this.pageSize}
            pagesAllowed={3}
            fetchData={this.getPinnedChatMessages}
            createNodes={this.createPinnedChatNodes}
            emptyListLabel={this.t('chat.empty_search')}
          >
            <slot></slot>
          </rtk-paginated-list>
        </div>
      </Host>
    );
  }
}
