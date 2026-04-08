import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { CustomPlugin, Size, States } from '../../types/props';
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
  private updateActivePlugins: () => void;
  private customPluginStoreSubscription: () => void;
  private customPluginStoreRetryInterval: ReturnType<typeof setInterval>;

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

  /** States */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Custom Plugins */
  @SyncWithStore()
  @Prop()
  customPlugins: CustomPlugin[] = [];

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  @State() plugins: RTKPlugin[] = [];

  @State() canStartPlugins: boolean = false;

  @State() canClosePlugins: boolean = false;

  @State() activatedPluginsId: string[] = [];

  @State() activeCustomPluginIds: string[] = [];

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting?.plugins.all.removeListener('stateUpdate', this.updateActivePlugins);
    if (this.customPluginStoreRetryInterval) {
      clearInterval(this.customPluginStoreRetryInterval);
      this.customPluginStoreRetryInterval = null;
    }
    if (this.customPluginStoreSubscription) {
      const store = this.meeting?.stores?.stores?.get('__internal_rtk_custom_plugins');
      store?.unsubscribe('activePlugins', this.customPluginStoreSubscription);
    }
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting != null) {
      this.canStartPlugins = meeting.self.permissions.plugins.canStart;
      this.canClosePlugins = meeting.self.permissions.plugins.canClose;
      this.plugins = meeting.plugins.all
        .toArray()
        .filter((plugin) => !meeting.self.config.disabledPlugins?.includes(plugin.id));

      this.updateActivePlugins = () => {
        this.activatedPluginsId = meeting.plugins.active.toArray().map((p) => p.id);
      };
      this.updateActivePlugins();
      meeting.plugins.all.addListener('stateUpdate', this.updateActivePlugins);

      this.subscribeToCustomPluginStore(meeting);
    }
  }

  private activateCustomPlugin = (plugin: CustomPlugin) => {
    const store = this.meeting?.stores?.stores?.get('__internal_rtk_custom_plugins');
    if (!store) return;
    const current: string[] = store.get('activePlugins') || [];
    if (!current.includes(plugin.id)) {
      const newIds = [...current, plugin.id];
      store.set('activePlugins', newIds, true, true);
      this.activeCustomPluginIds = newIds;
    }
    this.close();
  };

  private deactivateCustomPlugin = (plugin: CustomPlugin) => {
    const store = this.meeting?.stores?.stores?.get('__internal_rtk_custom_plugins');
    if (!store) return;
    const current: string[] = store.get('activePlugins') || [];
    const newIds = current.filter((id) => id !== plugin.id);
    store.set('activePlugins', newIds, true, true);
    this.activeCustomPluginIds = newIds;
  };

  // NOTE(retry): The store should be available immediately since the SDK awaits
  // storesManager.create('__internal_rtk_custom_plugins') in Controller.init().
  // However, there is currently a timing issue where either the store or
  // customPlugins (via @SyncWithStore) may not be ready when meetingChanged fires.
  // Retry is a temporary workaround until the root cause is fixed.
  private subscribeToCustomPluginStore(meeting: Meeting) {
    const trySubscribe = () => {
      const store = meeting.stores?.stores?.get('__internal_rtk_custom_plugins');
      if (!store || !this.customPlugins?.length) return false;
      this.activeCustomPluginIds = store.get('activePlugins') || [];
      this.customPluginStoreSubscription = () => {
        const s = meeting.stores?.stores?.get('__internal_rtk_custom_plugins');
        this.activeCustomPluginIds = s?.get('activePlugins') || [];
      };
      store.subscribe('activePlugins', this.customPluginStoreSubscription);
      return true;
    };

    if (trySubscribe()) return;

    let attempts = 0;
    this.customPluginStoreRetryInterval = setInterval(() => {
      attempts++;
      if (trySubscribe() || attempts >= 20) {
        clearInterval(this.customPluginStoreRetryInterval);
        this.customPluginStoreRetryInterval = null;
      }
    }, 500);
  }

  private close = () => {
    this.stateUpdate.emit({ activeSidebar: false, sidebar: undefined });
  };

  render() {
    return (
      <Host>
        <ul class="scrollbar">
          {this.customPlugins?.map((cp) => (
            <li key={cp.id} class="plugin">
              <div class="metadata">
                <rtk-icon icon={cp.icon} size="md" />
                <div class="name">{cp.name}</div>
              </div>
              {!this.activeCustomPluginIds.includes(cp.id) && cp.canOpenPlugin && (
                <div class="buttons">
                  <rtk-button
                    kind="icon"
                    size="lg"
                    onClick={() => this.activateCustomPlugin(cp)}
                    aria-label={`${this.t('activate')} ${cp.name}`}
                  >
                    <rtk-icon icon={this.iconPack.rocket} tabIndex={-1} aria-hidden={true} />
                  </rtk-button>
                </div>
              )}
              {this.activeCustomPluginIds.includes(cp.id) && cp.canClosePlugin && (
                <div class="buttons">
                  <rtk-button
                    kind="icon"
                    size="lg"
                    onClick={() => this.deactivateCustomPlugin(cp)}
                    aria-label={`${this.t('close')} ${cp.name}`}
                  >
                    <rtk-icon icon={this.iconPack.dismiss} tabIndex={-1} aria-hidden={true} />
                  </rtk-button>
                </div>
              )}
            </li>
          ))}
          {this.plugins.map((plugin) => (
            <li key={plugin.name} class="plugin">
              <div class="metadata">
                <img src={plugin.picture} />
                <div class="name">{plugin.name}</div>
              </div>
              {!this.activatedPluginsId.includes(plugin.id) && this.canStartPlugins && (
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
              {this.activatedPluginsId.includes(plugin.id) && this.canClosePlugins && (
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
