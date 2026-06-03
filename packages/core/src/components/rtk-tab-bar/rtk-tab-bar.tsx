import { Component, Host, h, Prop, Event, EventEmitter } from '@stencil/core';
import { RTKPlugin } from '@cloudflare/realtimekit';
import type { ActiveTabType } from '@cloudflare/realtimekit';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Peer } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { formatName, shorten } from '../../utils/string';
import { SyncWithStore } from '../../utils/sync-with-store';
import { GridLayout } from '../rtk-grid/rtk-grid';

export interface Tab {
  type: ActiveTabType;
  participant?: Peer;
  plugin?: RTKPlugin;
}

@Component({
  tag: 'rtk-tab-bar',
  styleUrl: 'rtk-tab-bar.css',
  shadow: true,
})
export class RtkTabBar {
  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** UI Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** Grid Layout */
  @Prop({ reflect: true }) layout: GridLayout = 'row';

  /** Icon Pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Active tab */
  @Prop() activeTab: Tab;

  /** Tabs */
  @Prop() tabs: Tab[] = [];

  /** Set active tab */
  @Event({ eventName: 'tabChange' }) tabChange: EventEmitter<Tab>;

  render() {
    return (
      <Host>
        <rtk-spotlight-indicator
          meeting={this.meeting}
          iconPack={this.iconPack}
          t={this.t}
          size={this.size}
        />
        {this.tabs.map((tab: Tab) => {
          let isActive = false;
          if (
            this.activeTab?.type === 'plugin' &&
            tab.plugin &&
            this.activeTab?.plugin.id === tab.plugin.id
          )
            isActive = true;
          else if (
            this.activeTab?.type === 'screenshare' &&
            tab.participant &&
            this.activeTab?.participant.id === tab.participant.id
          )
            isActive = true;
          if (tab.type === 'screenshare') {
            const participant = tab.participant;
            const name = formatName(participant.name);
            return (
              <rtk-button
                title={`${name}'s Screen Share`}
                key={tab.participant.id}
                kind="icon"
                variant={isActive ? 'primary' : 'secondary'}
                class={{
                  tab: true,
                  active: isActive,
                }}
                onClick={() => this.tabChange.emit(tab)}
              >
                <div class="center col">
                  <rtk-icon icon={this.iconPack.share_screen_person} />
                  <span class="name">
                    {participant.id === this.meeting?.self.id ? this.t('you') : shorten(name, 6)}
                  </span>
                </div>
              </rtk-button>
            );
          } else if (tab.type === 'plugin') {
            const plugin = tab.plugin;
            return (
              <rtk-button
                title={plugin.name}
                key={plugin.id}
                kind="icon"
                variant={isActive ? 'primary' : 'secondary'}
                class={{
                  tab: true,
                  active: isActive,
                }}
                onClick={() => this.tabChange.emit(tab)}
              >
                <div class="center col">
                  <img src={plugin.icon} alt={plugin.name} />
                  <span class="name">{shorten(plugin.name, 6)}</span>
                </div>
              </rtk-button>
            );
          }
        })}
      </Host>
    );
  }
}
