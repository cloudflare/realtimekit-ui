import { defaultIconPack, IconPack } from '../../lib/icons';
import { RTKPlugin } from '@cloudflare/realtimekit';
import { Component, Host, h, Prop, Watch, State, Element } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RtkI18n, useLanguage } from '../../lib/lang';

/**
 * A component which renders a plugin's UI.
 *
 * The plugin's `component` (an HTMLElement) is placed into this element's
 * light DOM and projected into the shadow DOM layout via a `<slot>`.
 * This ensures external CSS from the consuming application continues
 * to apply to the plugin content.
 */
@Component({
  tag: 'rtk-plugin-main',
  styleUrl: 'rtk-plugin-main.css',
  shadow: true,
})
export class RtkPluginMain {
  @Element() host: HTMLRtkPluginMainElement;

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

  connectedCallback() {
    this.pluginChanged(this.plugin);
  }

  @Watch('plugin')
  pluginChanged(plugin: RTKPlugin) {
    if (plugin == null) return;
    this.canDeactivatePlugin = plugin.permissions?.canDeactivate ?? false;
    this.attachView(plugin);
  }

  private attachView(plugin: RTKPlugin) {
    const component = plugin.component;
    if (!(component instanceof HTMLElement)) return;

    // Avoid unnecessary DOM churn if the same element is already mounted
    if (this.host.firstElementChild === component) return;

    // Clear any existing light DOM children
    while (this.host.firstChild) {
      this.host.removeChild(this.host.firstChild);
    }

    // Place in light DOM — the <slot> projects it into the shadow DOM layout
    this.host.appendChild(component);
  }

  disconnectedCallback() {
    while (this.host.firstChild) {
      this.host.removeChild(this.host.firstChild);
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
        <div class="view-container">
          <slot></slot>
        </div>
      </Host>
    );
  }
}
