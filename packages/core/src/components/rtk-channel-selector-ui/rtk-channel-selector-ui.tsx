import { Component, Host, h, Prop, Event, EventEmitter, State } from '@stencil/core';
import { RtkI18n, IconPack, defaultIconPack, useLanguage } from '../../exports';
import { ChatChannel } from '../../types/props';
import type { Message } from '@cloudflare/realtimekit';
import { SyncWithStore } from '../../utils/sync-with-store';
import { TextMessageView } from '../rtk-text-message/components/TextMessage';

/**
 * @deprecated `rtk-channel-selector-ui` is deprecated and will be removed soon.
 */
@Component({
  tag: 'rtk-channel-selector-ui',
  styleUrl: 'rtk-channel-selector-ui.css',
  shadow: true,
})
export class RtkChannelSelectorUi {
  /** Channels */
  @Prop() channels: ChatChannel[];

  /** On channel changed */
  @Event() channelChanged: EventEmitter<string>;

  /** Selected channel id */
  @Prop() selectedChannelId: string;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** show recent message in channel */
  @Prop() showRecentMessage = false;

  @State() isHidden = false;

  @State() searchQuery = '';

  private $el: HTMLDivElement;

  private matchMedia: MediaQueryList;

  connectedCallback() {
    this.matchMedia = window.matchMedia(`(orientation: landscape) and (min-width: 400px)`);
    this.matchMedia.addEventListener('change', this.handleResize);
    this.isHidden = !this.matchMedia.matches;
  }

  disconnectedCallback() {
    this.matchMedia.removeEventListener('change', this.handleResize);
  }

  componentDidRender() {
    this.$el.style.transform = this.isHidden ? 'translateX(-380px)' : 'translateX(0)';
  }

  private handleResize = (e: MediaQueryListEvent) => {
    this.isHidden = !e.matches;
  };

  private channelSelected = (channelId: string) => {
    this.channelChanged.emit(channelId);
    this.onRevealClicked();
  };

  private getTimeLabel(message: Message) {
    const messageDate = message.time;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return this.t('date.yesteday');
    } else if (messageDate > firstDayOfWeek) {
      const weekdays = [
        'date.sunday',
        'date.monday',
        'date.tuesday',
        'date.wednesday',
        'date.thursday',
        'date.friday',
        'date.saturday',
      ];
      return this.t(weekdays[messageDate.getDay()]);
    } else {
      return Intl.DateTimeFormat([], {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }).format(messageDate);
    }
  }

  private onSearchInput = (e: InputEvent) => {
    this.searchQuery = (e.target as HTMLInputElement).value;
  };

  private onRevealClicked = () => {
    if (this.matchMedia.matches) return;
    this.isHidden = !this.isHidden;
  };

  private renderChannelDisplayPic = (channel: ChatChannel) => {
    const hasDisplayPic = channel.displayPictureUrl && channel.displayPictureUrl.length !== 0;
    if (channel.isDirectMessage || hasDisplayPic) {
      return (
        <div class="channel-display">
          <rtk-avatar
            participant={{
              name: channel.displayName,
              picture: channel.displayPictureUrl,
            }}
          />
        </div>
      );
    } else {
      return (
        <div class="channel-display">
          <rtk-icon icon={this.iconPack.people} slot="start" />
        </div>
      );
    }
  };

  private renderRecentMessage = (channel: ChatChannel) => {
    if (!channel.latestMessage)
      return <p class="latest-msg new">{this.t('chat.start_conversation')}</p>;
    let senderFragment = channel.isDirectMessage ? '' : `${channel.latestMessage.displayName}: `;
    if (channel.latestMessage.type === 'text') {
      return (
        <p class="latest-msg">
          {senderFragment}
          <TextMessageView message={channel.latestMessage.message} />
        </p>
      );
    }

    // non text
    let messageFragment = '';
    if (channel.latestMessage.type === 'image') {
      messageFragment = this.t('image');
    } else if (channel.latestMessage.type === 'file') {
      messageFragment = this.t('file');
    }

    return <p class="latest-msg">{`${senderFragment}${messageFragment}`}</p>;
  };

  render() {
    return (
      <Host>
        <div class="container" ref={(el) => (this.$el = el)}>
          {this.isHidden && (
            <rtk-button
              kind="icon"
              variant="ghost"
              size="md"
              onClick={this.onRevealClicked}
              class="sidebar-btn"
            >
              <rtk-icon icon={this.isHidden ? this.iconPack.chevron_left : this.iconPack.dismiss} />
            </rtk-button>
          )}
          <slot name="header"></slot>
          <div class="search-wrapper">
            <div class="search">
              <input
                type="search"
                autocomplete="off"
                placeholder={this.t('chat.search_conversations')}
                onInput={this.onSearchInput}
              />
              <rtk-icon icon={this.iconPack.search} class="search-icon" />
            </div>
          </div>
          <div class="channel-container scrollbar" role="list">
            {this.channels
              .filter(
                (channel) =>
                  this.searchQuery === '' || channel.displayName.includes(this.searchQuery)
              )
              .map((channel) => {
                return (
                  <div
                    class={{
                      channel: true,
                      selected: channel.id === this.selectedChannelId,
                      highlight: !!channel.unreadCount,
                    }}
                    role="listitem"
                    onClick={() => {
                      this.channelSelected(channel.id);
                    }}
                  >
                    {this.renderChannelDisplayPic(channel)}
                    <div class="channel-card" is-direct-message={channel.isDirectMessage}>
                      <div class={'recent-message-row'}>
                        <span class="channel-name">{channel.displayName}</span>
                        {channel.latestMessage && (
                          <span class="latest-msg-time">
                            {this.getTimeLabel(channel.latestMessage)}
                          </span>
                        )}
                      </div>
                      <div class={'recent-message-row'}>
                        {this.renderRecentMessage(channel)}
                        {channel.unreadCount > 0 && channel.id !== this.selectedChannelId ? (
                          <span class="new-msgs-count">
                            {channel.unreadCount < 99 ? channel.unreadCount : '99+'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        {!this.isHidden && (
          <div class="overlay-container">
            <rtk-button
              kind="icon"
              variant="ghost"
              size="md"
              onClick={this.onRevealClicked}
              class="sidebar-btn"
            >
              <rtk-icon icon={this.isHidden ? this.iconPack.chevron_left : this.iconPack.dismiss} />
            </rtk-button>
          </div>
        )}
      </Host>
    );
  }
}
