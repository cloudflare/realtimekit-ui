import { Component, Host, Prop, h } from '@stencil/core';
import { RtkI18n, IconPack, defaultIconPack, useLanguage } from '../../exports';
import { ChatChannel } from '../../types/props';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKBasicParticipant } from '@cloudflare/realtimekit';

/** @deprecated `rtk-channel-details` is deprecated and will be removed soon. */
@Component({
  tag: 'rtk-channel-details',
  styleUrl: 'rtk-channel-details.css',
  shadow: true,
})
export class RtkChannelDetails {
  /** Channel object */
  @Prop() channel!: ChatChannel;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** List of channel members */
  @Prop() members: RTKBasicParticipant[] = [];

  private renderMembers() {
    return (
      <ul class="scrollbar">
        {this.members.map((member) => {
          return (
            <li>
              <rtk-avatar participant={{ name: member.name, picture: member.picture }} size="sm" />
              <span>{member.name}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  render() {
    return (
      <Host>
        <header>{this.t('chat.channel_members')}</header>
        {this.renderMembers()}
      </Host>
    );
  }
}
