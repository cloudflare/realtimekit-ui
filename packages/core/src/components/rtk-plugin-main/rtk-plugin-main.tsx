import { defaultIconPack, IconPack } from '../../lib/icons';
import { RTKPermissionsPreset, RTKPlugin } from '@cloudflare/realtimekit';
import { Component, Host, h, Prop, Watch, State, writeTask } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RtkI18n, useLanguage } from '../../lib/lang';

/**
 * A component which loads a plugin.
 */
@Component({
  tag: 'rtk-plugin-main',
  styleUrl: 'rtk-plugin-main.css',
  shadow: true,
})
export class RtkPluginMain {
  private iframeEl: HTMLIFrameElement;
  private toggleViewModeListener: (data: boolean) => void;

  /** Meeting */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Plugin */
  @Prop() plugin!: RTKPlugin;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() canClosePlugin: boolean = false;

  @State() viewModeEnabled: boolean = false;

  componentDidLoad() {
    this.meetingChanged(this.meeting);
    this.pluginChanged(this.plugin);
  }

  private onIframeRef = (el: HTMLIFrameElement) => {
    if (el === this.iframeEl) return;
    this.iframeEl = el;
    this.plugin?.addPluginView(el, 'plugin-main');
  };

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    const enabled = this.canInteractWithPlugin();
    this.viewModeEnabled = !enabled;
    writeTask(() => {
      this.canClosePlugin =
        meeting.self.permissions.plugins.canClose || this.plugin.enabledBy === meeting.self.id;
    });
  }

  @Watch('plugin')
  pluginChanged(plugin: RTKPlugin) {
    this.toggleViewModeListener = (enable: boolean) => {
      const enabled = this.canInteractWithPlugin();
      if (enabled) return;
      this.viewModeEnabled = enable;
    };
    if (plugin != null) {
      this.iframeEl && plugin.addPluginView(this.iframeEl, 'plugin-main');
      plugin.addListener('toggleViewMode', this.toggleViewModeListener);
    }
  }

  disconnectedCallback() {
    this.plugin?.removePluginView('plugin-main');
    this.plugin?.removeListener('toggleViewMode', this.toggleViewModeListener);
  }

  private canInteractWithPlugin = () => {
    const pluginId = this.plugin.id;
    if (!pluginId) return true;

    /**
     * For v1 canStartPlugins is the controller
     * For v2 the controller is within plugin config
     */

    const pluginConfig = (this.meeting.self.permissions.plugins as RTKPermissionsPreset['plugins'])
      .config[pluginId];
    /**
     * In some cases plugin config is undefined, specifically seen in cases of self
     * hosted plugins, in that case just return true
     */
    if (!pluginConfig) return true;
    /**
     * In V2 config currently in dev portal when a preset is saved without opening the
     * config menu then it gets added with access control undefined, to handle this case
     * the following has been done
     */
    if (!pluginConfig.accessControl) return true;
    /**
     * If access conrol is defined then return the permission
     */
    return pluginConfig.accessControl === 'FULL_ACCESS';
  };

  render() {
    if (this.plugin == null) return null;

    return (
      <Host>
        <header part="header">
          <div>{this.plugin.name}</div>
          {this.canClosePlugin && (
            <div>
              <rtk-button kind="icon" onClick={() => this.plugin.deactivate()} part="button">
                <rtk-icon icon={this.iconPack.dismiss} />
              </rtk-button>
            </div>
          )}
        </header>
        <div class={'iframe-container'}>
          {!(this.canInteractWithPlugin() || !this.viewModeEnabled) ? (
            <div class="block-inputs" />
          ) : null}
          <iframe ref={(el) => this.onIframeRef(el)} part="iframe" />
        </div>
      </Host>
    );
  }
}
