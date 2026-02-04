import type { Message } from '@cloudflare/realtimekit';
import {
  Build,
  Component,
  Host,
  h,
  Prop,
  State,
  writeTask,
  Watch,
  Event,
  EventEmitter,
} from '@stencil/core';
import { defaultIconPack, IconPack, Size } from '../../exports';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Chat, ChatMessage, States } from '../../types/props';
import { differenceInMinutes, elapsedDuration, formatDateTime } from '../../utils/date';
import { smoothScrollToBottom } from '../../utils/scroll';
import { chatUnreadTimestamps } from '../../utils/user-prefs';
import { SyncWithStore } from '../../utils/sync-with-store';

let hasShownDeprecationWarning = false;

/**
 * @deprecated Use `rtk-chat-messages-ui-paginated` instead.
 */
@Component({
  tag: 'rtk-chat-messages-ui',
  styleUrl: 'rtk-chat-messages-ui.css',
  shadow: true,
})
export class RtkChatMessagesUi {
  private $chat: HTMLDivElement;

  private intersectionObserver: IntersectionObserver;

  private lastReadTimestamp: Date;
  private observingEl: HTMLElement[] = [];

  private request: number;
  private timeout: NodeJS.Timeout;

  private autoScrollEnabled: boolean = true;

  /** Selected group key */
  @Prop() selectedGroup: string;

  /** Chat Messages */
  @Prop() messages: Chat[] = [];

  /** User ID of self user */
  @Prop() selfUserId: string;

  /** Can current user pin/unpin messages */
  @Prop() canPinMessages: boolean = false;

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

  /** Event emitted when a message is pinned or unpinned */
  @Event({ eventName: 'pinMessage' }) onPinMessage: EventEmitter<Message>;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  @State() now: Date = new Date();

  @State() showLatestMessageButton = false;

  connectedCallback() {
    if (Build.isDev && !hasShownDeprecationWarning) {
      hasShownDeprecationWarning = true;
      // eslint-disable-next-line no-console
      console.warn(
        '[realtimekit-ui] `rtk-chat-messages-ui` is deprecated and will be removed in a future release. Use `rtk-chat-messages-ui-paginated` instead.'
      );
    }

    this.lastReadTimestamp = chatUnreadTimestamps['everyone'] ?? new Date('0001-01-01T00:00:00Z');

    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (!document.hasFocus()) return;
      writeTask(() => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const currTimestamp = parseInt(entry.target.getAttribute('data-timestamp'));
            if (currTimestamp > this.lastReadTimestamp.getTime()) {
              // this.lastReadTimestamp = new Date();
              chatUnreadTimestamps[this.selectedGroup] = new Date();
            }
          }
        }
      });
    });

    // update current time every minute
    const updateNow = () => {
      this.now = new Date();
      this.timeout = setTimeout(() => {
        if (this.request != null) {
          this.request = requestAnimationFrame(updateNow);
        }
      }, 60 * 1000);
    };
    this.request = requestAnimationFrame(updateNow);
    this.chatChanged(this.messages as ChatMessage[]);
  }

  componentDidLoad() {
    this.$chat.addEventListener('scroll', this.onScroll);
    this.$chat.scrollTop = this.$chat.scrollHeight;
  }

  componentDidRender() {
    if (this.autoScrollEnabled) {
      smoothScrollToBottom(this.$chat);
    } else if (this.autoScrollEnabled == null) {
      // scroll to bottom on first render
      smoothScrollToBottom(this.$chat, false);
    }
  }

  @Watch('messages')
  chatChanged(messages: ChatMessage[]) {
    if (this.$chat == null) return;
    if (this.autoScrollEnabled || this.$chat.clientHeight === this.$chat.scrollHeight) return;

    for (let i = messages.length - 1; i >= 0; i--) {
      if (
        messages[i].message.time > this.lastReadTimestamp &&
        messages[i].message.userId !== this.selfUserId
      ) {
        // show latest message button when you have new messages
        // and chat container is scrollable and autoscroll is not enabled
        this.showLatestMessageButton = true;
        break;
      }
    }
  }

  @Watch('selectedGroup')
  selectedBucketChanged() {
    this.autoScrollEnabled = undefined;
    this.observingEl.forEach((el) => {
      this.intersectionObserver.unobserve(el);
    });
    this.observingEl = [];
  }

  disconnectedCallback() {
    this.$chat.removeEventListener('scroll', this.onScroll);

    this.intersectionObserver.disconnect();
    clearTimeout(this.timeout);
    cancelAnimationFrame(this.request);
  }

  private onScroll = (e: Event) => {
    const target = e.target;
    writeTask(() => {
      const { scrollTop, clientHeight, scrollHeight } = target as HTMLDivElement;
      const fromTop = scrollTop + clientHeight;

      if (fromTop + 10 >= scrollHeight) {
        // at bottom
        this.autoScrollEnabled = true;
        this.showLatestMessageButton = false;
      } else {
        // not at bottom
        this.autoScrollEnabled = false;
      }
    });
  };

  private scrollToBottom = () => {
    smoothScrollToBottom(this.$chat);
  };

  private observeMessage = (el: HTMLElement) => {
    if (el) {
      this.observingEl.push(el);
    }
    try {
      this.intersectionObserver.observe(el);
    } catch {}
  };

  private getMessageActions = (message: Message) => {
    const actions = [];

    if (!message.pinned && this.canPinMessages) {
      actions.push({
        id: 'pin_message',
        label: this.t('pin'),
        icon: this.iconPack.pin,
      });
    }

    return actions;
  };

  private onMessageActionHandler = (actionId: string, message: Message) => {
    switch (actionId) {
      case 'pin_message':
        this.onPinMessage.emit(message);
        break;

      default:
        break;
    }
  };

  render() {
    let prevMessage: Message = null;
    let reachedFirstUnread = false;

    return (
      <Host>
        <div class="chat-container scrollbar" ref={(el) => (this.$chat = el)} part="container">
          <div class="spacer" part="spacer"></div>
          <div class="chat" part="chat">
            {this.messages?.map((item) => {
              if (item.type === 'chat') {
                const { message } = item;

                const isSelfMessage = message.userId === this.selfUserId;

                const isUnread =
                  !isSelfMessage &&
                  !this.autoScrollEnabled &&
                  !reachedFirstUnread &&
                  message.time > this.lastReadTimestamp;

                if (isUnread) reachedFirstUnread = isUnread;

                const isContinued =
                  !isUnread &&
                  message.userId === prevMessage?.userId &&
                  differenceInMinutes(message.time, prevMessage?.time) < 2;
                prevMessage = message;

                return (
                  <div
                    is-continued={isContinued}
                    key={item.message.id}
                    ref={this.observeMessage}
                    data-timestamp={message.time.getTime()}
                    class={message.pinned ? 'pinned' : ''}
                  >
                    {isUnread && (
                      <div class="new-chat-marker" part="new-chat-marker">
                        {this.t('chat.new')}
                      </div>
                    )}
                    <div class="message-wrapper">
                      <rtk-message-view
                        time={message.time}
                        actions={this.getMessageActions(message)}
                        authorName={message.displayName}
                        hideAuthorName={true}
                        hideAvatar={true}
                        hideMetadata={true}
                        viewType={'incoming'}
                        variant="bubble"
                        onAction={(event: CustomEvent<string>) =>
                          this.onMessageActionHandler(event.detail, message)
                        }
                      >
                        {!isContinued && (
                          <div class="head">
                            <div class="name">{message.displayName}</div>
                            {!!message.time && (
                              <div class="time" title={formatDateTime(message.time)}>
                                {elapsedDuration(message.time, new Date(Date.now()))}
                              </div>
                            )}
                          </div>
                        )}
                        <div class="body">
                          {message.type === 'text' && (
                            <rtk-text-message-view
                              text={message.message}
                              isMarkdown
                            ></rtk-text-message-view>
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
                      </rtk-message-view>
                      {message.pinned && (
                        <div class="pin-button" part="pin-button">
                          <rtk-tooltip label={this.t('unpin')}>
                            <rtk-button
                              kind="icon"
                              variant="ghost"
                              onClick={() => this.onMessageActionHandler('pin_message', message)}
                              disabled={!this.canPinMessages}
                            >
                              <rtk-icon icon={this.iconPack.pin} size="sm" />
                            </rtk-button>
                          </rtk-tooltip>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        <div class="show-new-messages-ctr">
          <rtk-button
            class={{
              'show-new-messages': true,
              active: this.showLatestMessageButton,
            }}
            kind="icon"
            part="show-new-messages"
            onClick={this.scrollToBottom}
          >
            <rtk-icon icon={this.iconPack.chevron_down} />
          </rtk-button>
        </div>
      </Host>
    );
  }
}
