import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { usePaginatedChat } from '../../utils/flags';
import { canViewChat } from '../../utils/sidebar';
import { SyncWithStore } from '../../utils/sync-with-store';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';

/**
 * A button which toggles visibility of chat.
 *
 * You need to pass the `meeting` object to it to see the unread messages count badge.
 *
 * When clicked it emits a `rtkStateUpdate` event with the data:
 *
 * ```ts
 * { activeSidebar: boolean; sidebar: 'chat' }
 * ```
 */
@Component({
  tag: 'rtk-chat-toggle',
  styleUrl: 'rtk-chat-toggle.css',
  shadow: true,
})
export class RtkChatToggle {
  @State() unreadMessageCount: number = 0;

  /** Variant */
  @Prop({ reflect: true }) variant: ControlBarVariant = 'button';

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Size */
  @SyncWithStore() @Prop({ reflect: true }) size: Size;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() chatActive: boolean = false;

  @State() canViewChat: boolean = false;

  /**
   * Only used when paginated chat is enabled
   */
  @State() hasNewMessages: boolean = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
    this.statesChanged(this.states);
  }

  disconnectedCallback() {
    this.meeting?.chat?.removeListener('chatUpdate', this.onChatUpdate);
    this.meeting?.stage?.removeListener('stageStatusUpdate', this.updateCanView);
    this.meeting?.self?.permissions.removeListener('chatUpdate', this.updateCanView);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting == null) return;
    if (usePaginatedChat(meeting)) {
      meeting.chat?.getMessages(new Date().getTime(), 1, true).then((res) => {
        if (res?.messages?.length) this.hasNewMessages = true;
      });
    }

    const meetingStartedTimeMs = meeting.meta?.meetingStartedTimestamp.getTime() ?? 0;
    const newMessages = meeting.chat?.messages.filter((m) => m.timeMs > meetingStartedTimeMs);
    this.unreadMessageCount = newMessages.length || 0;
    meeting.chat?.addListener('chatUpdate', this.onChatUpdate);
    this.canViewChat = canViewChat(meeting);
    meeting?.stage?.on('stageStatusUpdate', this.updateCanView);
    meeting?.self?.permissions.on('chatUpdate', this.updateCanView);
  }

  @Watch('states')
  statesChanged(states: States) {
    if (states != null) {
      this.chatActive = states.activeSidebar === true && states.sidebar === 'chat';
    }
  }

  private onChatUpdate = ({ action, message }) => {
    if (this.chatActive) return;

    if (action === 'add' && message.userId !== this.meeting?.self.userId) {
      this.hasNewMessages = true;
      this.unreadMessageCount += 1;
    }
  };

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  private toggleChat = () => {
    const states = this.states;
    this.chatActive = !(states?.activeSidebar && states?.sidebar === 'chat');
    if (this.chatActive) {
      this.unreadMessageCount = 0;
      this.hasNewMessages = false;
    }
    this.stateUpdate.emit({
      activeSidebar: this.chatActive,
      sidebar: this.chatActive ? 'chat' : undefined,
      activeMoreMenu: false,
      activeAI: false,
    });
  };

  private updateCanView = () => {
    this.canViewChat = canViewChat(this.meeting);
  };

  @Watch('chatActive')
  handleChatActiveChange() {
    // Chat sidebar closed without opening a different sidebar
    if (!this.chatActive && !this.states.activeSidebar) {
      this.buttonEl.focus();
    }
  }

  private buttonEl: HTMLRtkControlbarButtonElement;

  render() {
    if (!this.canViewChat) return <Host data-hidden />;
    return (
      <Host title={this.t('chat')}>
        {usePaginatedChat(this.meeting)
          ? this.hasNewMessages && <div class="unread-count-dot" part="unread-count-dot"></div>
          : this.unreadMessageCount !== 0 &&
            !this.chatActive && (
              <div class="unread-count" part="unread-count">
                <span>{this.unreadMessageCount <= 100 ? this.unreadMessageCount : '99+'}</span>
              </div>
            )}
        <rtk-controlbar-button
          ref={(el) => (this.buttonEl = el)}
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          class={{ active: this.chatActive }}
          onClick={this.toggleChat}
          icon={this.iconPack.chat}
          label={this.t('chat')}
          variant={this.variant}
        />
      </Host>
    );
  }
}
