import { RTKPlugin } from '@cloudflare/realtimekit';
import type { ActiveTab, ActiveTabType } from '@cloudflare/realtimekit';
import { Component, Host, h, Prop, Element, State, Watch } from '@stencil/core';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { defaultGridSize } from '../../lib/grid';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Render } from '../../lib/render';
import { Meeting, Peer } from '../../types/rtk-client';
import { CustomPlugin, Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { GridLayout, GridSize } from '../rtk-grid/rtk-grid';
import { SyncWithStore } from '../../utils/sync-with-store';
import type { Tab } from '../rtk-tab-bar/rtk-tab-bar';

/**
 * A grid component which handles screenshares, plugins and participants.
 */
@Component({
  tag: 'rtk-mixed-grid',
  styleUrl: 'rtk-mixed-grid.css',
  shadow: true,
})
export class RtkMixedGrid {
  private activeTabUpdateListener: (data: ActiveTab) => void;
  private customPluginStoreSubscription: () => void;
  private customPluginStoreRetryInterval: ReturnType<typeof setInterval>;

  /** Grid Layout */
  @Prop({ reflect: true }) layout: GridLayout = 'row';

  /** Participants */
  @Prop() participants: Peer[] = [];

  /** Pinned Participants */
  @Prop() pinnedParticipants: Peer[] = [];

  /** Screenshare Participants */
  @Prop() screenShareParticipants: Peer[] = [];

  /** Active Plugins */
  @Prop() plugins: RTKPlugin[] = [];

  @State() activeCustomPlugins: CustomPlugin[] = [];

  /** Custom Plugins */
  @SyncWithStore()
  @Prop()
  customPlugins: CustomPlugin[] = [];

  /**
   * Aspect Ratio of participant tile
   *
   * Format: `width:height`
   */
  @Prop() aspectRatio: string = '16:9';

  /** Gap between participant tiles */
  @Prop() gap: number = 8;

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

  /** Icon Pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Grid size */
  @Prop() gridSize: GridSize = defaultGridSize;

  @State() activeTab: Tab;

  @State() initialised: boolean;

  @Element() host: HTMLRtkMixedGridElement;

  componentWillLoad() {
    // initialise states
    this.initialised = false;
    this.screenShareParticipantsChanged(this.screenShareParticipants);
    this.pluginsChanged(this.plugins);
    this.initialised = true;
  }

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting.meta?.removeListener('activeTabUpdate', this.activeTabUpdateListener);
    if (this.customPluginStoreRetryInterval) {
      clearInterval(this.customPluginStoreRetryInterval);
      this.customPluginStoreRetryInterval = null;
    }
    if (this.customPluginStoreSubscription) {
      const store = this.meeting?.stores?.stores?.get('__internal_rtk_custom_plugins');
      store?.unsubscribe('activePlugins', this.customPluginStoreSubscription);
      this.customPluginStoreSubscription = null;
    }
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting != null) {
      if (meeting.meta?.selfActiveTab != undefined) {
        this.onActiveTabUpdate(meeting.meta.selfActiveTab?.type, meeting.meta.selfActiveTab?.id);
      }

      this.activeTabUpdateListener = (activeTab) => {
        this.onActiveTabUpdate(activeTab?.type, activeTab?.id);
      };

      meeting.meta?.addListener('activeTabUpdate', this.activeTabUpdateListener);
      this.subscribeToCustomPluginStore(meeting);
    }
  }

  @Watch('screenShareParticipants')
  screenShareParticipantsChanged(participants: Peer[] = []) {
    // If active tab has already been initialised by spotlight then don't change tab.
    if (!this.initialised && this.activeTab != null) return;

    if (this.activeTab == null && participants.length > 0) {
      this.setActiveTab({ type: 'screenshare', participant: participants[0] });
    } else {
      this.revalidateActiveTab();
    }
  }

  @Watch('plugins')
  pluginsChanged(plugins: RTKPlugin[]) {
    // If active tab has already been initialised by spotlight then don't change tab.
    if (!this.initialised && this.activeTab != null) return;

    if (plugins.length > 0) {
      const lastIndex = plugins.length - 1;
      this.setActiveTab({ type: 'plugin', plugin: plugins[lastIndex] });
    } else {
      this.revalidateActiveTab();
    }
  }

  @Watch('activeCustomPlugins')
  activeCustomPluginsChanged(activeCustomPlugins: CustomPlugin[]) {
    if (!this.initialised && this.activeTab != null) return;

    if (activeCustomPlugins.length > 0) {
      const lastIndex = activeCustomPlugins.length - 1;
      this.setActiveTab({
        type: 'custom-plugin',
        customPlugin: activeCustomPlugins[lastIndex],
      });
    } else {
      this.revalidateActiveTab();
    }
  }

  private revalidateActiveTab() {
    if (this.activeTab != null) {
      if (this.activeTab.type === 'screenshare') {
        const { participant } = this.activeTab;
        if (!this.screenShareParticipants.some((p) => p.id === participant.id)) {
          this.reassignActiveTab();
        }
      } else if (this.activeTab.type === 'custom-plugin') {
        const { customPlugin } = this.activeTab;
        if (!this.activeCustomPlugins.some((cp) => cp.id === customPlugin.id)) {
          this.reassignActiveTab();
        }
      } else {
        const { plugin } = this.activeTab;
        if (!this.plugins.some((p) => p.id === plugin.id)) {
          this.reassignActiveTab();
        }
      }
    }
  }

  private setActiveTab(activeTab: Tab, shouldUpdateSelfActiveTab: boolean = true) {
    this.activeTab = activeTab;
    if (activeTab.type === 'custom-plugin') {
      // Custom plugins don't use meeting.meta.setSelfActiveTab
      return;
    }
    const id = activeTab.type === 'screenshare' ? activeTab.participant.id : activeTab.plugin.id;
    if (shouldUpdateSelfActiveTab)
      this.meeting.meta?.setSelfActiveTab({ type: activeTab.type as ActiveTabType, id }, 0);
  }

  private reassignActiveTab() {
    if (this.activeCustomPlugins.length > 0) {
      const lastIndex = this.activeCustomPlugins.length - 1;
      this.setActiveTab({
        type: 'custom-plugin',
        customPlugin: this.activeCustomPlugins[lastIndex],
      });
    } else if (this.screenShareParticipants.length > 0) {
      this.setActiveTab({ type: 'screenshare', participant: this.screenShareParticipants[0] });
    } else if (this.plugins.length > 0) {
      const lastIndex = this.plugins.length - 1;
      this.setActiveTab({ type: 'plugin', plugin: this.plugins[lastIndex] });
    }
  }

  private onActiveTabUpdate(type: ActiveTabType, id: string) {
    if (type == undefined) return;
    if (id == undefined) return;
    switch (type) {
      case 'plugin':
        const plugin = this.plugins.find((p) => p.id === id);
        if (plugin != undefined) this.setActiveTab({ type: 'plugin', plugin }, false);
        break;
      case 'screenshare':
        const participant = this.screenShareParticipants.find((ssp) => ssp.id === id);
        if (participant != undefined)
          this.setActiveTab({ type: 'screenshare', participant }, false);
    }
  }

  // NOTE(retry): The store should be available immediately since the SDK awaits
  // storesManager.create('__internal_rtk_custom_plugins') in Controller.init().
  // However, there is currently a timing issue where either the store or
  // customPlugins (via @SyncWithStore) may not be ready when meetingChanged fires.
  // Retry is a temporary workaround until the root cause is fixed.
  private subscribeToCustomPluginStore(meeting: Meeting) {
    const trySubscribe = () => {
      const store = meeting.stores?.stores?.get('__internal_rtk_custom_plugins');
      if (!store || !this.customPlugins?.length) return false;
      const activeIds: string[] = store.get('activePlugins') || [];
      this.activeCustomPlugins = (this.customPlugins || []).filter((cp) =>
        activeIds.includes(cp.id)
      );
      this.customPluginStoreSubscription = () => {
        const s = meeting.stores?.stores?.get('__internal_rtk_custom_plugins');
        const ids: string[] = s?.get('activePlugins') || [];
        this.activeCustomPlugins = (this.customPlugins || []).filter((cp) => ids.includes(cp.id));
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

  private getTabs() {
    const customPlugins = this.activeCustomPlugins.map((customPlugin) => ({
      type: 'custom-plugin',
      customPlugin,
    }));

    const screenshares = this.screenShareParticipants.map((participant) => ({
      type: 'screenshare',
      participant,
    }));

    const plugins = this.plugins.map((plugin) => ({ type: 'plugin', plugin }));
    return (customPlugins as any[]).concat(screenshares).concat(plugins);
  }

  render() {
    if (!this.meeting) return null;
    const defaults = {
      meeting: this.meeting,
      config: this.config,
      states: this.states,
      size: this.size,
      iconPack: this.iconPack,
      t: this.t,
    };

    return (
      <Host>
        <main id="main-view" part="main-view">
          {this.getTabs()?.length > 1 && (
            <rtk-tab-bar
              activeTab={this.activeTab}
              tabs={this.getTabs()}
              onTabChange={(e) => this.setActiveTab(e.detail)}
              {...defaults}
            />
          )}
          <div id="tabs" key="tabs">
            {this.activeCustomPlugins.map((cp) => (
              <rtk-plugin-main
                {...defaults}
                customPlugin={cp}
                key={cp.id}
                style={{
                  display:
                    this.activeTab?.type === 'custom-plugin' &&
                    this.activeTab?.customPlugin?.id === cp.id
                      ? 'flex'
                      : 'none',
                }}
              />
            ))}
            {this.screenShareParticipants.map((participant) => (
              <Render
                element="rtk-screenshare-view"
                defaults={defaults}
                props={{
                  participant,
                  key: participant.id,
                  style: {
                    display:
                      this.activeTab?.type === 'screenshare' &&
                      this.activeTab?.participant.id === participant.id
                        ? 'flex'
                        : 'none',
                  },
                }}
                childProps={{ participant, isScreenShare: true }}
                deepProps
              />
            ))}
            {this.plugins.map((plugin) => (
              <rtk-plugin-main
                {...defaults}
                plugin={plugin}
                key={plugin.id}
                style={{
                  display:
                    this.activeTab?.type === 'plugin' && this.activeTab?.plugin.id === plugin.id
                      ? 'flex'
                      : 'none',
                }}
              />
            ))}
          </div>
        </main>
        <Render
          element="rtk-mixed-grid"
          defaults={defaults}
          childProps={{
            part: 'participants-grid',
            class: this.gridSize.mixed ? `grid-width-${this.gridSize.mixed}` : 'grid-width-lg',
            participants: this.participants,
            pinnedParticipants: this.pinnedParticipants,
            screenShareParticipants: this.screenShareParticipants,
            plugins: this.plugins,
            aspectRatio: this.aspectRatio,
            gap: this.gap,
            size: this.meeting.meta?.viewType === 'AUDIO_ROOM' ? 'md' : 'sm',
            layout: 'row',
          }}
          onlyChildren
        />
      </Host>
    );
  }
}
