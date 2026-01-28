import {
  Component,
  Event,
  EventEmitter,
  Method,
  Watch,
  h,
  Host,
  Prop,
  State,
  Listen,
} from '@stencil/core';
import { SyncWithStore } from '../../utils/sync-with-store';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { ChatUpdateParams, Message } from '@cloudflare/realtimekit';
import type { Meeting, Participant } from '../../types/rtk-client';
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

  @State() showPinnedMessages = true;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.disconnectMeeting(this.meeting);
  }

  private disconnectMeeting(meeting: Meeting) {
    meeting.chat?.removeListener('pinMessage', this.pinChatListener);
    meeting.chat?.removeListener('unpinMessage', this.unpinChatListener);
    meeting.chat?.removeListener('chatUpdate', this.chatUpdateListener);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting) this.disconnectMeeting(oldMeeting);
    if (!meeting) return;
    this.$paginatedListRef?.reset();
    meeting.chat?.addListener('pinMessage', this.pinChatListener);
    meeting.chat?.addListener('unpinMessage', this.unpinChatListener);
    meeting.chat?.addListener('chatUpdate', this.chatUpdateListener);
  }

  /** */
  @Method()
  async close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dropdownToggle.emit({ open: false });
  }

  @Listen('rtkChatSelectorChange', { target: 'window' })
  async onChatSelectorChange(event: CustomEvent<{ selectedUser?: Participant }>) {
    const selectedUser = event.detail?.selectedUser;
    // Everyone
    if (!selectedUser) {
      this.showPinnedMessages = true;
    } else {
      this.showPinnedMessages = false;
    }
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

  private pinChatListener = (data: ChatUpdateParams) => {
    if (data.message.targetUserIds?.length > 0) {
      // pinned messages are not supported for private chat
      return;
    }
    this.$paginatedListRef?.onNewNode(data.message);
  };

  private unpinChatListener = async (data: ChatUpdateParams) => {
    if (data.message.targetUserIds?.length > 0) {
      // pinned messages are not supported for private chat
      return;
    }
    this.$paginatedListRef?.onNodeDelete(data.message.id);
  };

  private chatUpdateListener = async (data: ChatUpdateParams) => {
    if (data.action !== 'delete') return;
    this.unpinChatListener(data);
  };

  render() {
    if (!this.showPinnedMessages) return null;
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
