import { Component, Event, EventEmitter, Prop, State, h, Host, writeTask } from '@stencil/core';
import { RtkI18n, IconPack, defaultIconPack, useLanguage } from '../../exports';
import gracefulStorage from '../../utils/graceful-storage';
import { SyncWithStore } from '../../utils/sync-with-store';
import { MAX_TEXT_LENGTH } from '../../utils/chat';
import { Message } from '@cloudflare/realtimekit';

export type NewMessageEvent =
  | {
      type: 'text';
      message: string;
      replyTo?: Message;
    }
  | {
      type: 'file';
      file: File;
      replyTo?: Message;
    }
  | {
      type: 'image';
      image: File;
      replyTo?: Message;
    };

const messageLimits = {
  messagesSent: 0,
  startTime: 0,
};

/**
 * A component which renders a chat composer
 */
@Component({
  tag: 'rtk-chat-composer-view',
  styleUrl: 'rtk-chat-composer-view.css',
  shadow: true,
})
export class RtkChatComposerView {
  /** Whether user can send text messages */
  @Prop() canSendTextMessage = true;

  @Prop() isSending: boolean = false;

  /** Whether user can send file messages */
  @Prop() canSendFiles = true;

  /** Message to be pre-populated */
  @Prop() message: string = '';

  /** Key for storing message in localStorage */
  @Prop() storageKey: string = 'rtk-text-message';

  /** Placeholder for text input */
  @Prop() inputTextPlaceholder: string = 'Enter your message';

  /** Sets composer to edit mode */
  @Prop() isEditing: boolean = false;

  /** If a message is being replied to */
  @Prop() replyMessage: Message | undefined;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Max length for text input */
  @Prop() maxLength: number;

  /** Whether to show emoji picker */
  @Prop() disableEmojiPicker? = false;

  /** Rate limits */
  @Prop() rateLimits = {
    period: 60,
    maxInvocations: 60,
  };

  @State() fileToUpload = null;

  @State() isEmojiPickerOpen = false;

  @State() disableSendButton = false;

  @State() rateLimitsBreached = false;

  /** Event emitted when new message is submitted */
  @Event({ eventName: 'newMessage' }) onNewMessage: EventEmitter<NewMessageEvent>;

  /** Event emitted when message is edited */
  @Event({ eventName: 'editMessage' }) onEditMessage: EventEmitter<string>;

  /** Event emitted when message is replied to */
  @Event({ eventName: 'replyMessage' }) onReplyMessage: EventEmitter<Message>;

  /** Event emitted when message editing is cancelled */
  @Event({ eventName: 'editCancel' }) onEditCancel: EventEmitter<void>;

  private textMessage: string = '';

  private $textComposer: HTMLRtkTextComposerViewElement;

  constructor() {
    this.onKeyDownHandler = this.onKeyDownHandler.bind(this);
  }

  connectedCallback() {
    this.textMessage = this.message || gracefulStorage.getItem(this.storageKey) || '';
    this.checkRateLimitBreached(Date.now());
  }
  componentWillUpdate() {
    this.textMessage = this.message || gracefulStorage.getItem(this.storageKey) || '';
  }

  componentDidLoad() {
    if (this.message) {
      writeTask(() => this.$textComposer.setText(this.message, true));
    }
  }

  private sendFile = () => {
    if (!this.canSendFiles) {
      return;
    }

    if (this.fileToUpload.type === 'image') {
      this.onNewMessage.emit({
        type: 'image',
        image: this.fileToUpload.file,
        replyTo: this.replyMessage,
      });
    } else {
      this.onNewMessage.emit({
        type: 'file',
        file: this.fileToUpload.file,
        replyTo: this.replyMessage,
      });
    }

    this.fileToUpload = null;
  };

  private handleSendMessage = () => {
    if (!this.canSendTextMessage || this.rateLimitsBreached) {
      return;
    }
    if (this.fileToUpload !== null) {
      this.sendFile();
      this.onReplyMessage.emit(undefined);
      return;
    }

    const message = this.textMessage;
    const currentTime = Date.now();
    if (currentTime - messageLimits.startTime > this.rateLimits.period * 1000) {
      messageLimits.startTime = currentTime;
      messageLimits.messagesSent = 0;
    }

    messageLimits.messagesSent += 1;
    this.checkRateLimitBreached(currentTime);

    if (message.length > 0) {
      this.onNewMessage.emit({ type: 'text', message, replyTo: this.replyMessage });
      this.onReplyMessage.emit(undefined);
      this.cleanup();
    }
  };

  private checkRateLimitBreached(currentTime: number) {
    // Check if the function call is within limits
    if (messageLimits.messagesSent >= this.rateLimits.maxInvocations) {
      this.disableSendButton = true;
      this.rateLimitsBreached = true;
      const timeRemainingForReset =
        currentTime - messageLimits.startTime + this.rateLimits.period * 1000;
      setTimeout(() => {
        messageLimits.messagesSent = 0;
        messageLimits.startTime = Date.now();
        this.disableSendButton = false;
        this.rateLimitsBreached = false;
      }, timeRemainingForReset);
    }
  }

  private handleEditMessage = () => {
    this.onEditMessage.emit(this.textMessage);
    this.cleanup();
  };

  private handleEditCancel = () => {
    this.onEditCancel.emit();
    this.cleanup();
  };

  private onTextChangeHandler = (event: CustomEvent) => {
    this.textMessage = event.detail;
    if (this.textMessage.length >= (this.maxLength ?? MAX_TEXT_LENGTH)) {
      this.disableSendButton = true;
    } else if (this.disableSendButton) {
      this.disableSendButton = false;
    }
    gracefulStorage.setItem(this.storageKey, event.detail);
  };

  private onKeyDownHandler = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && event.shiftKey) {
      return;
    }
    if (this.disableSendButton) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.isEditing) {
        this.handleEditMessage();
      } else {
        this.handleSendMessage();
      }
    }
  };

  private onFileUploadHandler = (type: string, file: File) => {
    this.fileToUpload = { type, file };
  };

  private cleanup = () => {
    this.textMessage = '';
    this.fileToUpload = null;
    gracefulStorage.setItem(this.storageKey, '');
    this.$textComposer.setText('', true);
    this.isEmojiPickerOpen = false;
  };

  render() {
    const uiProps = { iconPack: this.iconPack, t: this.t };
    return (
      <Host>
        {this.canSendTextMessage && this.isEmojiPickerOpen && (
          <rtk-emoji-picker
            part="emoji-picker"
            onPickerClose={() => {
              this.isEmojiPickerOpen = false;
            }}
            onRtkEmojiClicked={(e) => {
              this.textMessage += e.detail;
              this.$textComposer.setText(this.textMessage, true);
            }}
            {...uiProps}
          />
        )}

        <slot name="chat-addon"></slot>
        <div class="composer-container">
          {this.replyMessage ? (
            <rtk-reply-message-preview
              isDissmisable
              replyMessage={this.replyMessage}
              iconPack={this.iconPack}
              onRtkReplyMessageDismiss={() => {
                this.onReplyMessage.emit(undefined);
              }}
            ></rtk-reply-message-preview>
          ) : null}
          {/* <div class="composers"> */}
          {this.fileToUpload && (
            <rtk-draft-attachment-view
              {...uiProps}
              attachment={this.fileToUpload}
              onDeleteAttachment={() => (this.fileToUpload = null)}
            ></rtk-draft-attachment-view>
          )}
          {!this.fileToUpload && (
            <rtk-text-composer-view
              value={this.textMessage}
              placeholder={this.inputTextPlaceholder}
              onTextChange={this.onTextChangeHandler}
              keyDownHandler={this.onKeyDownHandler}
              maxLength={this.maxLength ?? MAX_TEXT_LENGTH}
              rateLimitBreached={this.rateLimitsBreached}
              t={this.t}
              iconPack={this.iconPack}
              ref={(el) => (this.$textComposer = el)}
            ></rtk-text-composer-view>
          )}
          {/* </div> */}

          <div class="chat-buttons" part="chat-buttons">
            <div class="left" part="chat-buttons-left">
              {!this.fileToUpload && !this.isEditing && (
                <div>
                  {this.canSendFiles && [
                    <rtk-file-picker-button
                      {...uiProps}
                      onFileChange={(event) => this.onFileUploadHandler('file', event.detail)}
                    ></rtk-file-picker-button>,
                    <rtk-file-picker-button
                      filter="image/*"
                      label={this.t('chat.send_img')}
                      icon="image"
                      onFileChange={(event) => this.onFileUploadHandler('image', event.detail)}
                      {...uiProps}
                    ></rtk-file-picker-button>,
                  ]}
                  {this.canSendTextMessage && !this.disableEmojiPicker && (
                    <rtk-emoji-picker-button
                      isActive={this.isEmojiPickerOpen}
                      onClick={() => {
                        this.isEmojiPickerOpen = !this.isEmojiPickerOpen;
                      }}
                      {...uiProps}
                    ></rtk-emoji-picker-button>
                  )}
                  <slot name="chat-buttons"></slot>
                </div>
              )}
            </div>
            <div class="right" part="chat-buttons-right">
              {!this.isEditing && (
                <rtk-tooltip variant="primary" label={this.t('chat.send_msg')} delay={2000}>
                  <rtk-button
                    kind="icon"
                    disabled={this.disableSendButton || this.isSending}
                    onClick={() => this.handleSendMessage()}
                    title={this.t('chat.send_msg')}
                  >
                    {this.isSending ? (
                      <rtk-spinner size="sm" />
                    ) : (
                      <rtk-icon icon={this.iconPack.send} />
                    )}
                  </rtk-button>
                </rtk-tooltip>
              )}
              {this.isEditing && (
                <div class="edit-buttons">
                  <rtk-tooltip variant="secondary" label={this.t('cancel')} delay={2000}>
                    <rtk-button
                      kind="icon"
                      variant="secondary"
                      onClick={() => this.handleEditCancel()}
                      title={this.t('cancel')}
                    >
                      <rtk-icon icon={this.iconPack.dismiss} />
                    </rtk-button>
                  </rtk-tooltip>
                  <rtk-tooltip variant="primary" label={this.t('chat.update_msg')} delay={2000}>
                    <rtk-button
                      kind="icon"
                      onClick={() => this.handleEditMessage()}
                      title={this.t('chat.send_msg')}
                    >
                      {this.isSending ? (
                        <rtk-spinner size="sm" />
                      ) : (
                        <rtk-icon icon={this.iconPack.checkmark} />
                      )}
                    </rtk-button>
                  </rtk-tooltip>
                </div>
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
