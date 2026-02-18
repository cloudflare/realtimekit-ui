import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { canViewPlugins } from '../../utils/sidebar';
import { SyncWithStore } from '../../utils/sync-with-store';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';

/**
 * A button which toggles visibility of plugins.
 *
 * When clicked it emits a `rtkStateUpdate` event with the data:
 *
 * ```ts
 * { activeSidebar: boolean; sidebar: 'plugins' }
 * ```
 */
@Component({
  tag: 'rtk-plugins-toggle',
  styleUrl: 'rtk-plugins-toggle.css',
  shadow: true,
})
export class RtkPluginsToggle {
  /** Variant */
  @Prop({ reflect: true }) variant: ControlBarVariant = 'button';

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

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

  @State() pluginsActive: boolean = false;

  @State() canViewPlugins: boolean = false;

  disconnectedCallback() {
    this.meeting?.stage?.removeListener('stageStatusUpdate', this.updateCanView);
    this.meeting?.self?.permissions.removeListener('pluginsUpdate', this.updateCanView);
  }

  connectedCallback() {
    this.statesChanged(this.states);
    this.meetingChanged(this.meeting);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    this.canViewPlugins = canViewPlugins(meeting);
    meeting?.stage?.on('stageStatusUpdate', this.updateCanView);
    meeting?.self?.permissions.addListener('pluginsUpdate', this.updateCanView);
  }

  @Watch('states')
  statesChanged(states?: States) {
    if (states != null) {
      this.pluginsActive = states.activeSidebar === true && states.sidebar === 'plugins';
    }
  }

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  private togglePlugins() {
    const states = this.states;
    this.pluginsActive = !(states?.activeSidebar && states?.sidebar === 'plugins');
    this.stateUpdate.emit({
      activeSidebar: this.pluginsActive,
      sidebar: this.pluginsActive ? 'plugins' : undefined,
      activeMoreMenu: false,
      activeAI: false,
    });
  }

  private updateCanView = () => {
    this.canViewPlugins = canViewPlugins(this.meeting);
  };

  @Watch('pluginsActive')
  handlePluginsActiveChange() {
    // Plugins sidebar closed without opening a different sidebar or AI panel
    if (!this.pluginsActive && !this.states.activeSidebar && !this.states.activeAI) {
      this.buttonEl.focus();
    }
  }

  private buttonEl: HTMLRtkControlbarButtonElement;

  render() {
    if (!this.canViewPlugins) return <Host data-hidden />;

    const text = this.t('plugins');

    return (
      <Host title={text}>
        <rtk-controlbar-button
          ref={(el) => (this.buttonEl = el)}
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          class={{ active: this.pluginsActive }}
          onClick={() => this.togglePlugins()}
          icon={this.iconPack.rocket}
          label={text}
          variant={this.variant}
        />
      </Host>
    );
  }
}
