import { Component, Host, h, Event, EventEmitter, Prop, Watch, State } from '@stencil/core';
import {
  createDefaultConfig,
  defaultIconPack,
  IconPack,
  Size,
  States,
  UIConfig,
} from '../../exports';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';
import { SyncWithStore } from '../../utils/sync-with-store';

/**
 * A toggle button for enabling/disabling Picture-in-Picture mode.
 *
 * Allows users to switch the video display to a floating window that stays
 * on top of other applications.
 */
@Component({
  tag: 'rtk-pip-toggle',
  styleUrl: 'rtk-pip-toggle.css',
  shadow: true,
})
export class RtkPipToggle {
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

  /** Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  @State() pipSupported: boolean = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    // Check if PiP is supported and enabled
    this.pipSupported =
      meeting.participants.pip?.isSupported() &&
      meeting.self.config?.pipMode &&
      meeting.self.config?.viewType !== 'LIVESTREAM';
  }

  private togglePip() {
    if (!this.meeting.participants.pip) return;
    // Not active, activate
    if (this.meeting.participants.pip.isActive) {
      this.meeting.participants.pip.disable();
    } else {
      this.meeting.participants.pip.enable();
    }

    this.stateUpdate.emit({ activeMoreMenu: false });
  }

  render() {
    if (!this.meeting) return null;
    if (!this.pipSupported) return <Host data-hidden />;
    const pipEnabled = this.meeting.participants.pip.isActive;
    return (
      <Host role="log" aria-label={`Picture-in-Picture mode`}>
        <rtk-controlbar-button
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          onClick={() => this.togglePip()}
          icon={pipEnabled ? this.iconPack.pip_on : this.iconPack.pip_off}
          label={pipEnabled ? this.t('pip_off') : this.t('pip_on')}
          variant={this.variant}
        />
      </Host>
    );
  }
}
