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
  Listen,
} from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Participant } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
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

  /** Selected recipient for private chat; when unset, messages are loaded for public chat (Everyone). */
  @Prop() privateChatRecipient: Participant | null;

  /** Event for editing a message */
  @Event({ bubbles: true, composed: true }) editMessageInit: EventEmitter<{
    payload: TextMessage;
    flags: { isReply?: boolean; isEdit?: boolean };
  }>;

  /** Event emitted when a message is pinned or unpinned */
  @Event({ eventName: 'pinMessage' }) onPinMessage: EventEmitter<Message>;

  /** Event emitted when a message is edited */
  @Event({ eventName: 'editMessage' }) onEditMessage: EventEmitter<Message>;

  /** Event emitted when a message is deleted */
  @Event({ eventName: 'deleteMessage' }) onDeleteMessage: EventEmitter<Message>;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  @State() children: HTMLElement;

  @State() permissionsChanged = false;

  private pageSize: number = 25;

  componentDidLoad() {
    const slotted = this.host.shadowRoot.querySelector('slot') as HTMLSlotElement;
    if (!slotted) return;
    this.children = slotted.assignedElements()[0] as HTMLElement;
  }

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  @Listen('rtkPinnedMessageSelect', { target: 'window' })
  async onPinnedMessageSelect(event: CustomEvent<Message>) {
    const message = event.detail;
    if (!message) return;
    await this.$paginatedListRef?.reset?.(message.timeMs + 1);
  }

  disconnectedCallback() {
    this.disconnectMeeting(this.meeting);
  }

  @Watch('privateChatRecipient')
  privateChatRecipientChanged() {
    this.$paginatedListRef?.reset();
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

  private permissionsUpdateListener = () => {
    this.permissionsChanged = !this.permissionsChanged;
  };

  private getChatMessages = async (timestamp: number, size: number, reversed: boolean) => {
    if (this.privateChatRecipient) {
      try {
        const messages = await this.meeting.chat.fetchPrivateMessages({
          timestamp,
          offset: 0,
          limit: size,
          direction: reversed ? 'before' : 'after',
          userId: this.privateChatRecipient.id,
        });
        return messages;
      } catch (err) {
        return [];
      }
    }
    try {
      const messages = await this.meeting.chat.fetchMessages({
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
    meeting?.chat?.removeListener('chatUpdate', this.chatUpdateListener);
    this.meeting?.self.permissions.removeListener(
      'permissionsUpdate',
      this.permissionsUpdateListener
    );
  };

  private getMessageActions = (message: Message) => {
    const actions = [];

    const messageBelongsToSelf = message.userId === this.meeting.self.userId;

    actions.push({
      id: 'pin_message',
      label: message.pinned ? this.t('unpin') : this.t('pin'),
      icon: this.iconPack.pin,
    });

    if (messageBelongsToSelf) {
      actions.push({
        id: 'edit_message',
        label: this.t('chat.edit_msg'),
        icon: this.iconPack.edit,
      });

      actions.push({
        id: 'delete_message',
        label: this.t('chat.delete_msg'),
        icon: this.iconPack.delete,
      });
    }

    return actions;
  };

  private onMessageActionHandler = (actionId: string, message: Message) => {
    switch (actionId) {
      case 'pin_message':
        this.onPinMessage.emit(message);
        break;
      case 'edit_message':
        this.onEditMessage.emit(message);
        break;
      case 'delete_message':
        this.onDeleteMessage.emit(message);
        break;
      default:
        break;
    }
  };

  private createChatNode = (message: Message, isContinued: boolean) => {
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
      <div>
        <div class="message-wrapper" id={message.id}>
          <rtk-message-view
            messageType={message.type}
            pinned={message.pinned}
            isEdited={message.isEdited}
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
            </div>
          </rtk-message-view>
        </div>
      </div>
    );
  };

  private chatUpdateListener = (data: ChatUpdateParams) => {
    if (
      this.privateChatRecipient &&
      data.message.targetUserIds?.length > 0 &&
      !data.message.targetUserIds.includes(this.privateChatRecipient.id)
    ) {
      // private chat is selected and this event is not related to it
      return;
    }

    if (data.action === 'add') {
      this.$paginatedListRef.onNewNode(data.message);
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
          emptyListLabel={this.t('chat.empty_chat')}
        >
          <slot></slot>
        </rtk-paginated-list>
      </Host>
    );
  }
}
