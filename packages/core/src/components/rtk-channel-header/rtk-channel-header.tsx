import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { ChatChannel } from '../../types/props';
import { RtkI18n, IconPack, defaultIconPack, useLanguage } from '../../exports';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKBasicParticipant } from '@cloudflare/realtimekit';

/** @deprecated `rtk-channel-header` is deprecated and will be removed soon. Use `rtk-channel-selector-view` instead. */
@Component({
  tag: 'rtk-channel-header',
  styleUrl: 'rtk-channel-header.css',
})
export class RtkChannelHeader {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Channel object */
  @Prop() channel: ChatChannel;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** event triggered for search */
  @Event() search: EventEmitter<string>;

  /** event triggered for search */
  @Event() searchDismissed: EventEmitter;

  @State() showChannelDetailsDialog: boolean = false;

  @State() showSearchBar: boolean = false;

  @State() members: RTKBasicParticipant[] = [];

  /** Show back button */
  @Prop() showBackButton = false;

  /** Event emitted when back button is clicked */
  @Event() back: EventEmitter<void>;

  @Watch('channel')
  onChannelChanged() {
    if (this.$searchInput) this.$searchInput.value = '';
    this.showSearchBar = false;

    if (!this.channel.isDirectMessage) {
      this.meeting.chat.getChannelMembers(this.channel.id).then((members) => {
        this.members = members;
      });
    }
  }

  connectedCallback() {
    this.onChannelChanged();
  }

  private $searchInput: HTMLInputElement;

  private renderChannelDetails() {
    return (
      <rtk-dialog
        open
        onRtkDialogClose={() => {
          this.showChannelDetailsDialog = false;
        }}
        iconPack={this.iconPack}
        t={this.t}
      >
        <rtk-channel-details members={this.members} channel={this.channel}></rtk-channel-details>
      </rtk-dialog>
    );
  }

  render() {
    if (!this.channel) {
      return null;
    }
    return (
      <Host>
        {this.showChannelDetailsDialog && this.renderChannelDetails()}
        <header
          class={{
            searching: this.showSearchBar,
          }}
        >
          {this.showBackButton && (
            <rtk-button
              kind="icon"
              variant="secondary"
              class="back-btn"
              onClick={() => {
                this.back.emit();
              }}
            >
              <rtk-icon icon={this.iconPack.chevron_left} />
            </rtk-button>
          )}

          <div class="channel-details">
            <span class="name">{this.channel.displayName}</span>
            {!this.channel.isDirectMessage && (
              <span class="members">{this.members.map((member) => member.name).join(', ')}</span>
            )}
          </div>
          <div class="channel-tools">
            {!this.channel.isDirectMessage && (
              <rtk-tooltip label={this.t('chat.channel_members')} variant="primary">
                <rtk-button
                  kind="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    this.showChannelDetailsDialog = !this.showChannelDetailsDialog;
                  }}
                  class="br-primary-btn"
                >
                  <rtk-icon icon={this.iconPack.people} />
                </rtk-button>
              </rtk-tooltip>
            )}
          </div>
        </header>
      </Host>
    );
  }
}
