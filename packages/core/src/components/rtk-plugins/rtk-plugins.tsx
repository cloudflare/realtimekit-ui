import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RTKPlugin } from '@cloudflare/realtimekit';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { SyncWithStore } from '../../utils/sync-with-store';
import { createDefaultConfig } from '../../exports';

/**
 * A component which lists all available plugins from their preset,
 * and ability to enable or disable plugins.
 */
@Component({
  tag: 'rtk-plugins',
  styleUrl: 'rtk-plugins.css',
  shadow: true,
})
export class RtkPlugins {
  private updateActivePlugins = () => {
    if (!this.meeting) return;
    this.activatedPluginsId = this.meeting.plugins.active.toArray().map((p) => p.id);
  };
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

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  @State() plugins: RTKPlugin[] = [];

  @State() activatedPluginsId: string[] = [];

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting?.plugins.all.removeListener('stateUpdate', this.updateActivePlugins);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting) {
      oldMeeting.plugins.all.removeListener('stateUpdate', this.updateActivePlugins);
    }
    if (meeting != null) {
      this.plugins = meeting.plugins.all.toArray();

      this.updateActivePlugins();
      meeting.plugins.all.addListener('stateUpdate', this.updateActivePlugins);
    }
  }

  private close = () => {
    this.stateUpdate.emit({ activeSidebar: false, sidebar: undefined });
  };

  render() {
    return (
      <Host>
        <ul class="scrollbar">
          {this.plugins.map((plugin) => (
            <li key={plugin.name} class="plugin">
              <div class="metadata">
                <img src={plugin.icon} alt={plugin.name} />
                <div class="name">{plugin.name}</div>
              </div>
              {!this.activatedPluginsId.includes(plugin.id) && plugin?.permissions?.canActivate && (
                <div class="buttons">
                  <rtk-button
                    kind="icon"
                    size="lg"
                    onClick={() => {
                      plugin.activate();
                      this.close();
                    }}
                    aria-label={`${this.t('activate')} ${plugin.name}`}
                  >
                    <rtk-icon icon={this.iconPack.rocket} tabIndex={-1} aria-hidden={true} />
                  </rtk-button>
                </div>
              )}
              {this.activatedPluginsId.includes(plugin.id) &&
                plugin?.permissions?.canDeactivate && (
                  <div class="buttons">
                    <rtk-button
                      kind="icon"
                      size="lg"
                      onClick={() => {
                        plugin.deactivate();
                      }}
                      aria-label={`${this.t('close')} ${plugin.name}`}
                    >
                      <rtk-icon icon={this.iconPack.dismiss} tabIndex={-1} aria-hidden={true} />
                    </rtk-button>
                  </div>
                )}
            </li>
          ))}
        </ul>
      </Host>
    );
  }
}
