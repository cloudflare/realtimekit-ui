import { defaultIconPack, IconPack } from '../../lib/icons';
import { RTKPlugin } from '@cloudflare/realtimekit';
import { Component, Host, h, Prop, Watch, State } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RtkI18n, useLanguage } from '../../lib/lang';

/**
 * A component which renders a plugin's view.
 */
@Component({
  tag: 'rtk-plugin-main',
  styleUrl: 'rtk-plugin-main.css',
  shadow: true,
})
export class RtkPluginMain {
  private viewContainerEl: HTMLDivElement;

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

  @State() canDeactivatePlugin: boolean = false;

  componentDidLoad() {
    this.pluginChanged(this.plugin);
  }

  @Watch('plugin')
  pluginChanged(plugin: RTKPlugin) {
    if (plugin == null) return;

    this.canDeactivatePlugin = plugin.permissions?.canDeactivate ?? false;
    this.attachView(plugin);
  }

  private onViewContainerRef = (el: HTMLDivElement) => {
    if (el === this.viewContainerEl) return;
    this.viewContainerEl = el;
    if (this.plugin) {
      this.attachView(this.plugin);
    }
  };

  private attachView(plugin: RTKPlugin) {
    if (!this.viewContainerEl) return;

    // Clear any existing children
    while (this.viewContainerEl.firstChild) {
      this.viewContainerEl.removeChild(this.viewContainerEl.firstChild);
    }

    const view = (plugin as any).view;
    if (view instanceof HTMLElement) {
      this.viewContainerEl.appendChild(view);
    }
  }

  disconnectedCallback() {
    // Remove the view element from the container on cleanup
    if (this.viewContainerEl) {
      while (this.viewContainerEl.firstChild) {
        this.viewContainerEl.removeChild(this.viewContainerEl.firstChild);
      }
    }
  }

  render() {
    if (this.plugin == null) return null;

    return (
      <Host>
        <header part="header">
          <div>{this.plugin.name}</div>
          {this.canDeactivatePlugin && (
            <div>
              <rtk-button kind="icon" onClick={() => this.plugin.deactivate()} part="button">
                <rtk-icon icon={this.iconPack.dismiss} />
              </rtk-button>
            </div>
          )}
        </header>
        <div class="view-container" ref={(el) => this.onViewContainerRef(el)} />
      </Host>
    );
  }
}
