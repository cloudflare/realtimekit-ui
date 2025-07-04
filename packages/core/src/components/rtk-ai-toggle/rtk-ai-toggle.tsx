import { Component, Host, h, Prop, State, Event, EventEmitter, Watch } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Size, States } from '../../types/props';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';
import { Meeting } from '../../types/rtk-client';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKPermissionsPreset } from '@cloudflare/realtimekit';

@Component({
  tag: 'rtk-ai-toggle',
  styleUrl: 'rtk-ai-toggle.css',
  shadow: true,
})
export class RtkAiToggle {
  /** Variant */
  @Prop({ reflect: true }) variant: ControlBarVariant = 'button';

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Size */
  @SyncWithStore() @Prop({ reflect: true }) size: Size;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() aiActive: boolean = false;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  @Watch('states')
  statesChanged(s?: States) {
    const states = s;
    this.aiActive = states.activeAI;
  }

  private toggleAI() {
    this.aiActive = !this.states?.activeAI;
    this.stateUpdate.emit({
      activeAI: this.aiActive,
      activeMoreMenu: false,
      activeSidebar: false,
    });
  }

  render() {
    if (!this.meeting) return null;
    const text = this.t('ai.meeting_ai');

    if (!(this.meeting?.self?.permissions as RTKPermissionsPreset).transcriptionEnabled) {
      return <Host data-hidden />;
    }

    return (
      <Host title={text}>
        <rtk-controlbar-button
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          class={{ active: this.aiActive }}
          onClick={() => this.toggleAI()}
          icon={this.iconPack.meeting_ai}
          label={text}
          variant={this.variant}
          brandIcon
        />
      </Host>
    );
  }
}
