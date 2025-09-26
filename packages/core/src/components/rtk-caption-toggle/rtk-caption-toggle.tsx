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
import { RTKPermissionsPreset } from '@cloudflare/realtimekit';

@Component({
  tag: 'rtk-caption-toggle',
  styleUrl: 'rtk-caption-toggle.css',
  shadow: true,
})
export class RtkCaptionToggle {
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

  @State() captionEnabled: boolean = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    this.permissionsUpdateListener();

    this.meeting.self.permissions.addListener('permissionsUpdate', this.permissionsUpdateListener);
  }

  disconnectedCallback() {
    this.meeting?.self.permissions.removeListener(
      'permissionsUpdate',
      this.permissionsUpdateListener
    );
  }

  private permissionsUpdateListener = () => {
    this.captionEnabled =
      (this.meeting.self.permissions as RTKPermissionsPreset).transcriptionEnabled ?? false;
  };

  private toggleCaptions() {
    this.stateUpdate.emit({ activeCaptions: !this.states.activeCaptions, activeMoreMenu: false });
  }

  render() {
    if (!this.meeting) return null;
    if (!this.captionEnabled) return null;
    const captionsEnabled = this.states.activeCaptions;
    return (
      <Host tabIndex={0} role="log" aria-label={`Picture-in-Picture mode`}>
        <rtk-controlbar-button
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          onClick={() => this.toggleCaptions()}
          icon={captionsEnabled ? this.iconPack.captionsOff : this.iconPack.captionsOn}
          label={captionsEnabled ? this.t('transcript.off') : this.t('transcript.on')}
          variant={this.variant}
        />
      </Host>
    );
  }
}
