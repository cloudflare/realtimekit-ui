import type { Message, ChatUpdateParams, TextMessage } from '@cloudflare/realtimekit';
import {
  Component,
  Event,
  Element,
  EventEmitter,
  h,
  Host,
  State,
  Prop,
  Watch,
} from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { ChatChannel, Size, States } from '../../types/props';
import { SyncWithStore } from '../../utils/sync-with-store';

@Component({
  tag: 'rtk-chat-messages-ui-paginated',
  styleUrl: 'rtk-chat-messages-ui-paginated.css',
  shadow: true,
})
export class RtkChatMessagesUiPaginated {
  private $paginatedListRef: HTMLRtkPaginatedListElement;

  @Element() host: HTMLRtkChatMessagesUiPaginatedElement;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /**
   * Selected channel
   */
  @Prop() selectedChannel?: ChatChannel;

  /**
   * Selected channel id
   */
  @Prop() selectedChannelId?: string;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Event for editing a message */
  @Event({ bubbles: true, composed: true }) editMessageInit: EventEmitter<{
    payload: TextMessage;
    flags: { isReply?: boolean; isEdit?: boolean };
  }>;

  /** Event emitted when a message is pinned or unpinned */
  @Event({ eventName: 'pinMessage' }) onPinMessage: EventEmitter<Message>;

  /** Event emitted when a message is deleted */
  @Event({ eventName: 'deleteMessage' }) onDeleteMessage: EventEmitter<Message>;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  @State() children: HTMLElement;

  /** Whether to align chat bubbles to the left */
  @Prop() leftAlign = false;

  @State() permissionsChanged = false;

  private pageSize: number = 25;

  private lastReadMessageIndex = -1;

  componentDidLoad() {
    const slotted = this.host.shadowRoot.querySelector('slot') as HTMLSlotElement;
    if (!slotted) return;
    this.children = slotted.assignedElements()[0] as HTMLElement;
  }

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.disconnectMeeting(this.meeting);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting != undefined) this.disconnectMeeting(oldMeeting);
    if (meeting && !meeting.chat) return;
    if (meeting != null) {
      meeting.chat?.addListener('chatUpdate', this.chatUpdateListener);
      meeting.self.permissions.addListener('permissionsUpdate', this.permissionsUpdateListener);
    }
    this.permissionsUpdateListener();
  }

  @Watch('selectedChannelId')
  channelChanged() {
    this.lastReadMessageIndex = -1;
  }

  private permissionsUpdateListener = () => {
    this.permissionsChanged = !this.permissionsChanged;
  };

  private maybeMarkChannelAsRead = (messages: Message[]) => {
    if (!this.selectedChannelId) return;
    if (messages.length === 0) return;
    if (this.lastReadMessageIndex !== -1) return;
    const latestMsg = messages.at(0).time > messages.at(-1).time ? messages.at(0) : messages.at(-1);
    if (!latestMsg.channelIndex) return;
    this.lastReadMessageIndex = parseInt(latestMsg.channelIndex, 10);
    this.meeting.chat.markLastReadMessage(this.selectedChannelId, latestMsg);
  };

  private getChatMessages = async (timestamp: number, size: number, reversed: boolean) => {
    const { messages } = await this.meeting.chat.getMessages(
      timestamp,
      size,
      reversed,
      undefined,
      this.selectedChannelId
    );
    this.maybeMarkChannelAsRead(messages);

    return messages;
  };

  private createChatNodes = (data: Message[]) => {
    /**
     * NOTE(callmetarush): When between pages the message's isContinued
     * will fail in current implementation
     */
    return data.map((message, idx) => {
      const isContinued = message.userId === data[idx - 1]?.userId;
      return this.createChatNode(message, isContinued);
    });
  };

  private disconnectMeeting = (meeting) => {
    this.meeting?.self.permissions.removeListener(
      'permissionsUpdate',
      this.permissionsUpdateListener
    );
  };

  private getMessageActions = (message: Message) => {
    const actions = [];

    const isSelf = this.meeting.self.userId === message.userId;
    const chatMessagePermissions = this.meeting.self.permissions?.chatMessage;
    const canEdit =
      chatMessagePermissions === undefined
        ? isSelf
        : chatMessagePermissions.canEdit === 'ALL' ||
          (chatMessagePermissions.canEdit === 'SELF' && isSelf);

    const canDelete =
      chatMessagePermissions === undefined
        ? isSelf
        : chatMessagePermissions.canDelete === 'ALL' ||
          (chatMessagePermissions.canDelete === 'SELF' && isSelf);

    if (this.meeting.self.permissions.pinParticipant) {
      actions.push({
        id: 'pin_message',
        label: message.pinned ? this.t('unpin') : this.t('pin'),
        icon: this.iconPack.pin,
      });
    }

    if (canDelete) {
      actions.push({
        id: 'delete_message',
        label: this.t('chat.delete_msg'),
        icon: this.iconPack.delete,
      });
    }

    if (canEdit) {
      actions.push({
        id: 'edit_message',
        label: this.t('chat.edit_msg'),
        icon: this.iconPack.edit,
      });
    }

    return actions;
  };

  private onMessageActionHandler = (actionId: string, message: Message) => {
    switch (actionId) {
      case 'pin_message':
        this.onPinMessage.emit(message);
        break;
      case 'delete_message':
        this.onDeleteMessage.emit(message);
        break;
      default:
        break;
    }
  };

  private createChatNode = (message: Message, isContinued: boolean) => {
    if (message.targetUserIds.length !== 0) return null; // don't render private messages

    let displayPicture: string;

    if (this.meeting.meta.viewType === 'CHAT') {
      displayPicture = this.meeting.participants.all
        .toArray()
        .find((p) => p.userId === message.userId)?.picture;
    } else {
      if (this.meeting.self.userId === message.userId) {
        displayPicture = this.meeting.self.picture;
      } else {
        displayPicture =
          this.meeting.participants.joined
            .toArray()
            .find((member) => member.userId === message.userId)?.picture ??
          this.meeting.participants.waitlisted.toArray().find((p) => p.userId === message.userId)
            ?.picture;
      }
    }

    const isSelf = message.userId === this.meeting.self.userId;
    const viewType = isSelf ? 'outgoing' : 'incoming';
    return (
      <div class={{ pinned: message.pinned }}>
        <div class="message-wrapper">
          <rtk-message-view
            time={message.time}
            actions={this.getMessageActions(message)}
            authorName={message.displayName}
            isSelf={isSelf}
            avatarUrl={displayPicture}
            hideAuthorName={isContinued}
            viewType={viewType}
            variant="bubble"
            onAction={(event: CustomEvent<string>) =>
              this.onMessageActionHandler(event.detail, message)
            }
          >
            <div>
              <div class="body">
                {message.type === 'text' && (
                  <rtk-text-message-view text={message.message} isMarkdown></rtk-text-message-view>
                )}
                {message.type === 'file' && (
                  <rtk-file-message-view
                    name={message.name}
                    url={message.link}
                    size={message.size}
                  ></rtk-file-message-view>
                )}
                {message.type === 'image' && (
                  <rtk-image-message-view
                    url={message.link}
                    onPreview={() => {
                      this.stateUpdate.emit({ image: message });
                    }}
                  ></rtk-image-message-view>
                )}
              </div>
              {message.pinned && (
                <div class="pin-icon" part="pin-icon">
                  <rtk-icon icon={this.iconPack.pin} size="sm" />
                </div>
              )}
            </div>
          </rtk-message-view>
        </div>
      </div>
    );
  };

  private chatUpdateListener = (data: ChatUpdateParams) => {
    if (this.selectedChannelId && data.message.channelId !== this.selectedChannelId) return;

    if (data.action === 'add') {
      this.$paginatedListRef.onNewNode(data.message);
      this.lastReadMessageIndex = -1;
      this.maybeMarkChannelAsRead([data.message as Message]);
    } else if (data.action === 'delete') {
      this.$paginatedListRef.onNodeDelete(data.message.id);
    } else if (data.action === 'edit') {
      this.$paginatedListRef.onNodeUpdate(data.message.id, data.message);
    }
  };

  render() {
    return (
      <Host>
        <rtk-paginated-list
          ref={(el) => (this.$paginatedListRef = el)}
          pageSize={this.pageSize}
          pagesAllowed={3}
          fetchData={this.getChatMessages}
          createNodes={this.createChatNodes}
          selectedItemId={this.selectedChannelId}
          emptyListLabel={this.t('chat.empty_channel')}
        >
          <slot></slot>
        </rtk-paginated-list>
      </Host>
    );
  }
}
