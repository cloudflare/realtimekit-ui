import { Host, Component, Event, EventEmitter, Prop, State, h, Element } from '@stencil/core';
import { RtkI18n, IconPack, defaultIconPack, useLanguage } from '../../exports';
import { SyncWithStore } from '../../utils/sync-with-store';
import { debounce } from 'lodash-es';

export interface ChannelItem {
  id: string;
  name: string;
  avatarUrl?: string;
  icon?: keyof IconPack;
  latestMessage?: string;
  latestMessageTime?: Date;
  unreadCount?: number;
}

@Component({
  tag: 'rtk-channel-selector-view',
  styleUrl: 'rtk-channel-selector-view.css',
  shadow: true,
})
export class RtkChannelSelectorView {
  /** Channels */
  @Prop() channels!: {
    id: string;
    name: string;
    avatarUrl?: string;
    icon?: keyof IconPack;
    latestMessage?: string;
    latestMessageTime?: Date;
    unreadCount?: number;
  }[];

  /** Selected channel id */
  @Prop() selectedChannelId: string;

  /** Disables search bar (default = false) */
  @Prop() disableSearch: boolean = false;

  /** Hides avatar (default = false) */
  @Prop() hideAvatar: boolean = false;

  /** Icon Pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Render as dropdown or list (default = list) */
  @Prop() viewAs: 'dropdown' | 'list' = 'list';

  /** Event emitted when selected channel changes */
  @Event() channelChange: EventEmitter<{
    id: string;
    name: string;
    avatarUrl?: string;
    icon?: keyof IconPack;
    latestMessage?: string;
    latestMessageTime?: Date;
    unreadCount?: number;
  }>;

  @State() searchQuery = '';

  @State() showDropdown: boolean = false;

  @Element() $el: HTMLRtkChannelSelectorViewElement;

  private $searchEl: HTMLDivElement;

  private $listEl: HTMLDivElement;

  private resizeObserver: ResizeObserver;

  connectedCallback() {
    this.resizeObserver = new ResizeObserver(this.calculateListHeight);
  }

  componentDidLoad() {
    this.resizeObserver.observe(this.$el);
    this.calculateListHeight();
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    this.calculateListHeight.cancel();
  }

  private calculateListHeight = debounce(() => {
    if (this.viewAs === 'list' && this.$listEl) {
      let height = 0;
      const slotEl = this.$el.shadowRoot.querySelector('slot[name="header"]') as HTMLSlotElement;
      if (slotEl) {
        slotEl.assignedElements().forEach((e: HTMLElement) => (height += e.offsetHeight));
      }
      if (this.$searchEl) {
        height += this.$searchEl.offsetHeight;
      }
      this.$listEl.style.height = `${window.innerHeight - height - 16}px`;
    }
  }, 60);

  private getFilteredChannels = () => {
    if (this.searchQuery.trim() === '') {
      return this.channels;
    }

    return this.channels.filter((channel) => {
      return channel['name'].toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  };

  private getTimeLabel(messageDate: Date) {
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

  private toggleDropdown = () => {
    this.showDropdown = !this.showDropdown;
  };

  private getChannelById = (id: string) => {
    return this.channels.find((channel) => channel.id === id);
  };

  private getTotalUnreads = () => {
    return this.channels.reduce((acc, curr) => {
      return acc + curr.unreadCount;
    }, 0);
  };

  private onChannelClickHandler = (channel: ChannelItem) => {
    this.channelChange.emit(channel);
    if (this.viewAs === 'dropdown') {
      this.showDropdown = false;
    }
  };

  render() {
    const filteredChannels = this.getFilteredChannels();

    const shouldShowDropdown =
      this.viewAs === 'list' || (this.viewAs === 'dropdown' && this.showDropdown);
    return (
      <Host>
        {this.viewAs === 'list' && <slot name="header" />}
        {shouldShowDropdown && (
          <div
            class={{
              dropdown: this.viewAs === 'dropdown',
              scrollbar: this.viewAs === 'dropdown',
              list: this.viewAs === 'list',
            }}
          >
            {!this.disableSearch && (
              <div class="search-container" ref={(el) => (this.$searchEl = el)}>
                <input
                  type="text"
                  placeholder={this.t('chat.search_conversations')}
                  value={this.searchQuery}
                  onInput={(e) => (this.searchQuery = (e.target as HTMLInputElement).value)}
                />
                <rtk-icon icon={this.iconPack.search} />
              </div>
            )}

            <div class="channels-container scrollbar" ref={(el) => (this.$listEl = el)}>
              {filteredChannels.map((channel) => {
                return (
                  <button
                    class={{ channel: true, active: this.selectedChannelId === channel.id }}
                    onClick={() => this.onChannelClickHandler(channel)}
                  >
                    {!this.hideAvatar && (
                      <div>
                        {channel.icon ? (
                          <rtk-icon class="avatar-icon" icon={this.iconPack[channel.icon]} />
                        ) : (
                          <rtk-avatar
                            participant={{
                              name: channel.name,
                              picture: channel.avatarUrl,
                            }}
                          />
                        )}
                      </div>
                    )}

                    <div class="channel-data">
                      <div class="col">
                        <div class="name">{channel.name}</div>
                        {channel.latestMessage && (
                          <div
                            class={{
                              'last-message': true,
                              'no-message': !channel.latestMessage,
                            }}
                          >
                            <rtk-text-message-view
                              isMarkdown
                              text={channel.latestMessage}
                            ></rtk-text-message-view>
                          </div>
                        )}
                      </div>
                      <div class="col channel-meta">
                        {channel.latestMessageTime && (
                          <time class="time">{this.getTimeLabel(channel.latestMessageTime)}</time>
                        )}
                        {channel.unreadCount > 0 && (
                          <div class="unread-count">{channel.unreadCount}</div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {this.viewAs === 'dropdown' && (
          <button class="dropdown-trigger" onClick={this.toggleDropdown}>
            <span>
              <rtk-icon icon={this.iconPack.participants} />
              {this.selectedChannelId &&
                `${this.t('to')} ${this.getChannelById(this.selectedChannelId).name}`}

              {this.getTotalUnreads() > 0 && (
                <div class="unread-count">{this.getTotalUnreads()}</div>
              )}
            </span>
            <rtk-icon
              icon={this.showDropdown ? this.iconPack.chevron_up : this.iconPack.chevron_down}
            />
          </button>
        )}
      </Host>
    );
  }
}
