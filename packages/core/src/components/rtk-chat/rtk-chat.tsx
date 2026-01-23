import {
  Component,
  Host,
  h,
  Prop,
  State,
  Watch,
  Element,
  Listen,
  Event,
  EventEmitter,
} from '@stencil/core';
import { Meeting, Peer, Participant } from '../../types/rtk-client';
import { Chat, Size } from '../../types/props';
import { defaultIconPack, IconPack } from '../../lib/icons';
import type { Message, TextMessage } from '@cloudflare/realtimekit';
import { RtkI18n, useLanguage } from '../../lib/lang';
import {
  generateChatGroupKey,
  handleFilesDataTransfer,
  parseMessageForTarget,
} from '../../utils/chat';
import { chatUnreadTimestamps } from '../../utils/user-prefs';
import { FlagsmithFeatureFlags } from '../../utils/flags';
import { States, UIConfig, createDefaultConfig } from '../../exports';
import { SyncWithStore } from '../../utils/sync-with-store';
import { NewMessageEvent } from '../rtk-chat-composer-view/rtk-chat-composer-view';
import { Overrides, defaultOverrides } from '../../lib/overrides';

export type ChatFilter = (message: Message) => boolean;

/**
 * Fully featured chat component with image & file upload, emoji picker and auto-scroll.
 */
@Component({
  tag: 'rtk-chat',
  styleUrl: 'rtk-chat.css',
  shadow: true,
})
export class RtkChat {
  private chatUpdateListener = ({ message }) => {
    if (!this.displayFilter || this.displayFilter(message)) {
      this.addToChatGroup(message as Message);
      // shallow copy to trigger render
      this.chatGroups = { ...this.chatGroups };
    }
  };

  private chatPermissionUpdateListener = () => {
    this.canSend = this.meeting.self.permissions.chatPublic.canSend;
    this.canSendTextMessage = this.meeting.self.permissions.chatPublic.text;
    this.canSendFiles = this.meeting.self.permissions.chatPublic.files;
  };

  @Element() host: HTMLRtkChatElement;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

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

  /** UI Overrides */
  @SyncWithStore()
  @Prop()
  overrides: Overrides = defaultOverrides;

  /** disables private chat */
  @Prop() disablePrivateChat: boolean = false;

  /** Can current user pin/unpin messages */
  @State() canPinMessages: boolean = false;

  /**
   * @deprecated
   * Beta API, will change in future
   * List of target presets allowed as private chat recipient
   */
  @Prop() privatePresetFilter: String[] = [];

  /**
   * @deprecated
   * Beta API, will change in future
   * A filter function for messages to be displayed
   */
  @Prop() displayFilter: ChatFilter = undefined;

  @State() unreadCountGroups: Record<string, number> = {};

  @State() chatGroups: Record<string, Chat[]> = { everyone: [] };
  @State() selectedGroup: string = 'everyone';

  @State() now: Date = new Date();

  @State() dropzoneActivated: boolean = false;

  @State() showLatestMessageButton = false;

  @State() canSend: boolean = false;
  @State() canSendTextMessage: boolean = false;
  @State() canSendFiles: boolean = false;
  @State() canPrivateMessage: boolean = false;
  @State() canSendPrivateTexts: boolean = false;
  @State() canSendPrivateFiles: boolean = false;

  @State() emojiPickerEnabled: boolean = false;

  @State() chatRecipientId: string = 'everyone';

  @State() participants: Peer[] = [];

  @State() selectedParticipant: Peer;

  @State() editingMessage: TextMessage | null = null;

  @State() replyMessage: TextMessage | null = null;

  @State() searchQuery = '';

  @State() selectorState: 'desktop' | 'hide' | 'mobile' = 'hide';

  @State() isSendingMessage = false;

  @State() showPinnedMessages: boolean = false;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  private resizeObserver: ResizeObserver;

  private onDragOver = (e) => {
    e.preventDefault();
    this.dropzoneActivated = true;
  };

  private onDragLeave = () => {
    this.dropzoneActivated = false;
  };

  private onDrop = (e) => {
    e.preventDefault();
    this.dropzoneActivated = false;

    handleFilesDataTransfer(e.dataTransfer.items, (type, file) => {
      switch (type) {
        case 'image':
          if (this.isFileMessagingAllowed()) {
            this.meeting?.chat?.sendImageMessage(file, this.getRecipientPeerIds());
          }
          break;
        case 'file':
          if (this.isFileMessagingAllowed()) {
            this.meeting?.chat?.sendFileMessage(file, this.getRecipientPeerIds());
          }
          break;
      }
    });
  };

  connectedCallback() {
    if (!this.meeting) return;
    this.meetingChanged(this.meeting);

    if (this.meeting && !this.meeting.chat) {
      return;
    }

    if (this.isFileMessagingAllowed()) {
      this.host.addEventListener('dragover', this.onDragOver);
      this.host.addEventListener('dragleave', this.onDragLeave);
      this.host.addEventListener('drop', this.onDrop);
    }
  }

  @Listen('editMessageInit', { target: 'window' })
  onEditMessageInit(
    event: CustomEvent<{
      payload: TextMessage;
      flags: { isReply?: boolean; isEdit?: boolean };
    }>
  ) {
    if (event.detail.flags.isReply) {
      this.replyMessage = event.detail.payload;
    } else if (event.detail.flags.isEdit) {
      this.editingMessage = event.detail.payload;
    }
  }

  @Listen('rtkChatSelectorChange')
  onChatSelectorChange(event: CustomEvent<{ selectedUser?: Participant }>) {
    const selectedUser = event.detail?.selectedUser;

    // Everyone
    if (!selectedUser) {
      this.selectedParticipant = null;
      this.chatRecipientId = this.selectedGroup = 'everyone';
      return;
    }

    this.selectedParticipant = selectedUser;
    this.chatRecipientId = this.selectedGroup = selectedUser.userId;
  }

  private disconnectMeeting = (meeting: Meeting) => {
    if (this.isPrivateChatSupported()) {
      meeting?.participants.joined.removeListener('participantJoined', this.onParticipantUpdate);
      meeting?.participants.joined.removeListener('participantLeft', this.onParticipantUpdate);
    }
    meeting?.chat?.removeListener('chatUpdate', this.chatUpdateListener);
    meeting.self.permissions.removeListener('*', this.chatPermissionUpdateListener);
  };

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.disconnectMeeting(this.meeting);
    this.host.removeEventListener('dragover', this.onDragOver);
    this.host.removeEventListener('dragleave', this.onDragLeave);
    this.host.removeEventListener('drop', this.onDrop);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting != undefined) this.disconnectMeeting(oldMeeting);
    if (meeting && !meeting.chat) return;

    if (meeting != null) {
      this.canSend = meeting.self.permissions.chatPublic.canSend;
      this.canSendTextMessage = meeting.self.permissions.chatPublic.text;
      this.canSendFiles = meeting.self.permissions.chatPublic.files;
      this.canPrivateMessage = !!(
        meeting.self.permissions.chatPrivate?.canSend ||
        meeting.self.permissions.chatPrivate?.canReceive
      );
      this.canSendPrivateTexts = !!meeting.self.permissions.chatPrivate?.text;
      this.canSendPrivateFiles = !!meeting.self.permissions.chatPrivate?.files;
      this.canPinMessages =
        meeting?.__internals__?.features.hasFeature(FlagsmithFeatureFlags.PINNED_MESSAGES) &&
        meeting.self.permissions.pinParticipant;

      this.initializeChatGroups();
      // shallow copy to trigger render
      this.chatGroups = { ...this.chatGroups };

      meeting.self.permissions.on('*', this.chatPermissionUpdateListener);

      this.onParticipantUpdate();

      meeting.chat?.addListener('chatUpdate', this.chatUpdateListener);

      if (this.isPrivateChatSupported()) {
        meeting.participants.joined.addListener('participantJoined', this.onParticipantUpdate);
        meeting.participants.joined.addListener('participantLeft', this.onParticipantUpdate);
      }
    }
  }

  private onParticipantUpdate = () => {
    this.participants = this.meeting.participants.joined
      .toArray()
      .filter(
        (p: Peer) =>
          this.privatePresetFilter.length === 0 || this.privatePresetFilter.includes(p.presetName)
      );

    // if selected participant leaves, reset state to everyone
    if (this.selectedParticipant && !this.participants.includes(this.selectedParticipant)) {
      this.selectedParticipant = null;
      this.chatRecipientId = this.selectedGroup = 'everyone';
    }
  };

  @Watch('chatGroups')
  chatGroupsChanged(chatGroups: Record<string, Chat[]>) {
    if (!this.isPrivateChatSupported()) {
      return;
    }

    const unreadCounts = {};

    for (const key in chatGroups) {
      const lastReadTimestamp = chatUnreadTimestamps[key] ?? 0;

      unreadCounts[key] = chatGroups[key].filter(
        (c) =>
          c.type == 'chat' &&
          c.message.time > lastReadTimestamp &&
          c.message.userId !== this.meeting.self.userId
      ).length;

      if (
        key ===
          generateChatGroupKey([this.meeting.self.userId, this.selectedParticipant?.userId]) ||
        (key === 'everyone' && this.selectedParticipant === null)
      ) {
        unreadCounts[key] = 0;
        chatUnreadTimestamps[key] = new Date();
      }
    }

    this.updateUnreadCountGroups(unreadCounts);
  }

  private updateUnreadCountGroups = (obj: typeof this.unreadCountGroups) => {
    this.unreadCountGroups = {
      ...this.unreadCountGroups,
      ...obj,
    };
  };

  private initializeChatGroups() {
    this.meeting.chat?.messages.forEach((message) => {
      if (!this.displayFilter || this.displayFilter(message)) {
        this.addToChatGroup(message);
      }
    });
  }

  @Watch('displayFilter')
  // @ts-ignore
  private onDisplayFilterChanged(newFilter: ChatFilter, oldFilter: ChatFilter) {
    if (newFilter !== oldFilter) {
      this.chatGroups = {};
      this.initializeChatGroups();
    }
  }

  private addToChatGroup(message: Message) {
    const parsedMessage = parseMessageForTarget(message);
    let key = 'everyone';
    if (parsedMessage.targetUserIds?.length > 0) {
      const allParticipants = new Set<string>([
        parsedMessage.userId,
        ...parsedMessage.targetUserIds,
      ]);
      key = generateChatGroupKey(Array.from(allParticipants));
    }
    if (this.chatGroups[key] === undefined) this.chatGroups[key] = [];

    let isEditedMessage = false;
    let messages = [];
    this.chatGroups[key].forEach((chat) => {
      if (chat.type === 'chat' && chat.message.id === message.id) {
        isEditedMessage = true;
        messages.push({ type: 'chat' as const, message: parsedMessage });
      } else {
        messages.push(chat);
      }
    });

    if (!isEditedMessage) {
      messages.push({ type: 'chat' as const, message: parsedMessage });
    }

    this.chatGroups[key] = messages;
  }

  private getRecipientPeerIds() {
    let peerIds = [];
    if (this.chatRecipientId !== 'everyone') {
      peerIds = [this.selectedParticipant.id];
    }
    return peerIds;
  }

  private isPrivateChatSupported = () => {
    return this.canPrivateMessage && !this.disablePrivateChat;
  };

  private isTextMessagingAllowed = () => {
    if (this.chatRecipientId === 'everyone') {
      // public chat
      return this.canSend && this.canSendTextMessage;
    }

    // private chat
    return this.canPrivateMessage && this.canSendPrivateTexts;
  };

  private isFileMessagingAllowed = () => {
    if (this.chatRecipientId === 'everyone') {
      // public chat
      return this.canSend && this.canSendFiles;
    }

    // private chat
    return this.canPrivateMessage && this.canSendPrivateFiles;
  };

  private onQuotedMessageDismiss = () => {
    this.replyMessage = null;
  };

  private onNewMessageHandler = async (e: CustomEvent<NewMessageEvent>) => {
    const message = e.detail;
    this.isSendingMessage = true;
    try {
      await this.meeting.chat.sendMessage(message, this.getRecipientPeerIds());
    } finally {
      this.isSendingMessage = false;
    }
  };

  private onEditMessageHandler = async (e: CustomEvent<string>) => {
    this.isSendingMessage = true;
    try {
      await this.meeting?.chat?.editTextMessage(this.editingMessage.id, e.detail);
    } finally {
      this.isSendingMessage = false;
      this.editingMessage = null;
    }
  };

  private onEditCancel = () => {
    this.editingMessage = null;
  };

  private onPinMessage = (event: CustomEvent<Message>) => {
    const message = event.detail;
    if (message.pinned) {
      this.meeting.chat.unpin(message.id);
    } else {
      this.meeting.chat.pin(message.id);
    }
  };

  private onDeleteMessage = (event: CustomEvent<Message>) => {
    const message = event.detail;

    if (this.editingMessage?.id === message.id) {
      this.editingMessage = null;
    }

    try {
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('rtk-chat-edit-') && key.endsWith(`-${message.id}`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }
    } catch {
      // ignore storage access errors
    }

    this.meeting.chat.deleteMessage(message.id);
  };

  private onMessageEdit = (event: CustomEvent<Message>) => {
    const message = event.detail;
    if (message.type !== 'text') return;

    this.replyMessage = null;
    this.editingMessage = message as TextMessage;
  };

  private renderComposerUI() {
    if (this.chatRecipientId === 'everyone') {
      if (!this.canSendTextMessage && !this.canSendFiles) return null;
    } else {
      if (!this.canSendPrivateTexts && !this.canSendPrivateFiles) return null;
    }

    const uiProps = { iconPack: this.iconPack, t: this.t, size: this.size };
    const message = this.editingMessage ? this.editingMessage.message : '';
    const quotedMessage = this.replyMessage ? this.replyMessage.message : '';

    const draftStorageKey = 'rtk-chat-draft';
    const editStorageKey = this.editingMessage
      ? `rtk-chat-edit-${'no-channel'}-${this.editingMessage.id}`
      : 'rtk-chat-edit';
    const storageKey = this.editingMessage ? editStorageKey : draftStorageKey;

    return (
      <rtk-chat-composer-view
        message={message}
        storageKey={storageKey}
        quotedMessage={quotedMessage}
        isEditing={!!this.editingMessage}
        isSending={this.isSendingMessage}
        canSendTextMessage={this.isTextMessagingAllowed()}
        canSendFiles={this.isFileMessagingAllowed()}
        disableEmojiPicker={this.overrides.disableEmojiPicker}
        maxLength={this.meeting.chat.maxTextLimit}
        rateLimits={this.meeting.chat.rateLimits}
        inputTextPlaceholder={this.t('chat.message_placeholder')}
        onNewMessage={this.onNewMessageHandler}
        onEditMessage={this.onEditMessageHandler}
        onEditCancel={this.onEditCancel}
        onQuotedMessageDismiss={this.onQuotedMessageDismiss}
        {...uiProps}
      >
        <slot name="chat-addon" slot="chat-addon" />
      </rtk-chat-composer-view>
    );
  }

  private getPinnedMessageLabel = (message: Message) => {
    if (message.type === 'text') return message.message;
    if (message.type === 'image') return 'Image';
    if (message.type === 'file') return 'File';
    return '';
  };

  private renderPinnedMessagesHeader = () => {
    if (this.meeting.chat.pinned.length === 0) return null;

    /**
     * We do not display a picture against the avatar because the chatMessage API does not provide it.
     */
    return (
      <div class="pinned-messages">
        <div
          class="pinned-messages-header"
          onClick={() => (this.showPinnedMessages = !this.showPinnedMessages)}
        >
          <div>
            <rtk-icon icon={this.iconPack.pin} size="sm" />
            {this.t('chat.pinned_msgs')}
            {` (${this.meeting.chat.pinned.length})`}
          </div>
          <rtk-icon
            icon={this.showPinnedMessages ? this.iconPack.chevron_up : this.iconPack.chevron_down}
            size="sm"
          />
        </div>
        {this.showPinnedMessages && (
          <div class="pinned-messages-content scrollbar">
            {this.meeting.chat.pinned.map((message) => {
              const label = this.getPinnedMessageLabel(message as Message);
              return (
                <div class="pinned-message">
                  <rtk-avatar
                    class="pinned-message-avatar"
                    participant={{ name: message.displayName, picture: '' }}
                    size="sm"
                  />
                  <span>{label.length > 20 ? `${label.substring(0, 20)}...` : label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  render() {
    if (!this.meeting) {
      return null;
    }

    return (
      <Host>
        <div class="chat-container">
          <div class="chat">
            {this.isFileMessagingAllowed() && (
              <div id="dropzone" class={{ active: this.dropzoneActivated }} part="dropzone">
                <rtk-icon icon={this.iconPack.attach} />
                <p>{this.t('chat.send_attachment')}</p>
              </div>
            )}
            <rtk-chat-header></rtk-chat-header>
            {/* {this.renderPinnedMessagesHeader()} */}
            <rtk-chat-messages-ui-paginated
              meeting={this.meeting}
              onPinMessage={this.onPinMessage}
              onEditMessage={this.onMessageEdit}
              onDeleteMessage={this.onDeleteMessage}
              size={this.size}
              iconPack={this.iconPack}
              t={this.t}
            ></rtk-chat-messages-ui-paginated>

            {this.renderComposerUI()}
          </div>
        </div>
      </Host>
    );
  }
}
