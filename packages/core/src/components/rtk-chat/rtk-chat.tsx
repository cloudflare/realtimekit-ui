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
import { Size } from '../../types/props';
import { defaultIconPack, IconPack } from '../../lib/icons';
import type { Message, TextMessage } from '@cloudflare/realtimekit';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { handleFilesDataTransfer } from '../../utils/chat';
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

  /** Can current user pin/unpin messages */
  @State() canPinMessages: boolean = false;

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

  @State() participants: Peer[] = [];

  @State() selectedParticipant: Peer;

  @State() editingMessage: TextMessage | null = null;

  @State() searchQuery = '';

  @State() selectorState: 'desktop' | 'hide' | 'mobile' = 'hide';

  @State() isSendingMessage = false;

  @State() showPinnedMessages: boolean = false;

  @State() replyMessage: Message | undefined;

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

  @Listen('rtkChatSelectorChange')
  onChatSelectorChange(event: CustomEvent<{ selectedUser?: Participant }>) {
    this.replyMessage = undefined;
    const selectedUser = event.detail?.selectedUser;
    // Everyone
    if (!selectedUser) {
      this.selectedParticipant = null;
      return;
    }
    this.selectedParticipant = selectedUser;
  }

  private disconnectMeeting = (meeting: Meeting) => {
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

      meeting.self.permissions.on('*', this.chatPermissionUpdateListener);
    }
  }

  private getRecipientPeerIds() {
    if (!this.selectedParticipant) return [];
    return [this.selectedParticipant.id];
  }

  private isTextMessagingAllowed = () => {
    if (!this.selectedParticipant) {
      // public chat
      return this.canSend && this.canSendTextMessage;
    }

    // private chat
    return this.canPrivateMessage && this.canSendPrivateTexts;
  };

  private isFileMessagingAllowed = () => {
    if (!this.selectedParticipant) {
      // public chat
      return this.canSend && this.canSendFiles;
    }

    // private chat
    return this.canPrivateMessage && this.canSendPrivateFiles;
  };

  private onNewMessageHandler = async (e: CustomEvent<NewMessageEvent>) => {
    const message = e.detail;
    this.isSendingMessage = true;
    try {
      await this.meeting.chat.sendMessage(message as any, this.getRecipientPeerIds());
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
    this.editingMessage = message as TextMessage;
  };

  private onReplyMessage = (event: CustomEvent<Message>) => {
    const message = event.detail;
    this.replyMessage = message;
  };

  private renderComposerUI() {
    if (!this.selectedParticipant) {
      if (!this.canSendTextMessage && !this.canSendFiles) return null;
    } else {
      if (!this.canSendPrivateTexts && !this.canSendPrivateFiles) return null;
    }

    const uiProps = { iconPack: this.iconPack, t: this.t, size: this.size };
    const message = this.editingMessage ? this.editingMessage.message : '';

    const draftStorageKey = 'rtk-chat-draft';
    const editStorageKey = this.editingMessage
      ? `rtk-chat-edit-${'no-channel'}-${this.editingMessage.id}`
      : 'rtk-chat-edit';
    const storageKey = this.editingMessage ? editStorageKey : draftStorageKey;

    return (
      <rtk-chat-composer-view
        replyMessage={this.replyMessage}
        message={message}
        storageKey={storageKey}
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
        onReplyMessage={this.onReplyMessage}
        onEditCancel={this.onEditCancel}
        {...uiProps}
      >
        <slot name="chat-addon" slot="chat-addon" />
      </rtk-chat-composer-view>
    );
  }

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
            <rtk-chat-messages-ui-paginated
              meeting={this.meeting}
              privateChatRecipient={this.selectedParticipant}
              onPinMessage={this.onPinMessage}
              onEditMessage={this.onMessageEdit}
              onDeleteMessage={this.onDeleteMessage}
              onReplyMessage={this.onReplyMessage}
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
