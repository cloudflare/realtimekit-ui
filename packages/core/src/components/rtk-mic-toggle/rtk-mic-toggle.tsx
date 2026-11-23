import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { Meeting, Peer, MediaPermission } from '../../types/rtk-client';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { PermissionSettings, Size, States } from '../../types/props';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';
import { SyncWithStore } from '../../utils/sync-with-store';
import { StageStatus } from '@cloudflare/realtimekit';
import { isFirefox } from '../../utils/browser';

/**
 * A button which toggles your microphone.
 *
 * @slot additional-menu-items - Additional menu entries displayed after the speaker devices.
 */
@Component({
  tag: 'rtk-mic-toggle',
  styleUrl: 'rtk-mic-toggle.css',
  shadow: true,
})
export class RtkMicToggle {
  private deviceListUpdateListener = ({ devices }: { devices: MediaDeviceInfo[] }) => {
    this.audioInputDevices = devices.filter(
      (device) => device.kind === 'audioinput' && !!device.deviceId
    );
    this.speakerDevices = devices.filter(
      (device) => device.kind === 'audiooutput' && !!device.deviceId
    );
  };

  private deviceUpdateListener = () => {
    this.currentDevices = { ...this.meeting.self.getCurrentDevices() };
  };

  private audioUpdateListener = ({ audioEnabled }: Peer) => {
    this.audioEnabled = audioEnabled;
    this.currentDevices = { ...this.meeting.self.getCurrentDevices() };
  };

  private stageStatusListener = () => {
    this.stageStatus = this.meeting.stage.status;
    this.canProduceAudio = this.meeting.self.permissions.canProduceAudio === 'ALLOWED';
  };

  private mediaPermissionUpdateListener = ({ kind, message }) => {
    if (kind === 'audio') {
      this.micPermission = message;
    }
  };

  private meetingPermissionsUpdateListener = (patch?: {
    media?: { audio?: { canProduce?: number } };
  }) => {
    if (patch?.media?.audio) {
      this.canProduceAudio = this.meeting.self.permissions.canProduceAudio === 'ALLOWED';
    }
  };

  /** Variant */
  @Prop({ reflect: true }) variant: ControlBarVariant = 'button';

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Hides the audio device menu, for setup and preview controls. */
  @Prop({ reflect: true }) hideDeviceSelectionMenu: boolean = false;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() audioEnabled: boolean = false;

  @State() canProduceAudio: boolean = false;

  @State() micPermission: MediaPermission = 'NOT_REQUESTED';

  @State() stageStatus: StageStatus = 'OFF_STAGE';

  @State() audioInputDevices: MediaDeviceInfo[] = [];

  @State() speakerDevices: MediaDeviceInfo[] = [];

  @State() currentDevices: ReturnType<Meeting['self']['getCurrentDevices']>;

  @State() hasAdditionalMenuItems: boolean = false;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.removeMeetingListeners(this.meeting);
  }

  private removeMeetingListeners(meeting: Meeting) {
    meeting?.self.removeListener('audioUpdate', this.audioUpdateListener);
    meeting?.self.removeListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
    meeting?.self.removeListener('deviceListUpdate', this.deviceListUpdateListener);
    meeting?.self.removeListener('deviceUpdate', this.deviceUpdateListener);
    meeting?.stage?.removeListener('stageStatusUpdate', this.stageStatusListener);
    meeting?.self?.permissions?.removeListener(
      'permissionsUpdate',
      this.meetingPermissionsUpdateListener
    );
  }

  private async refreshDevices(meeting: Meeting) {
    if (!meeting) return;
    const [audioDevices, speakerDevices] = await Promise.all([
      meeting.self.getAudioDevices(),
      meeting.self.getSpeakerDevices(),
    ]);
    if (meeting !== this.meeting) return;

    this.audioInputDevices = audioDevices.filter(
      (device) => device.kind === 'audioinput' && !!device.deviceId
    );
    this.speakerDevices = speakerDevices.filter(
      (device) => device.kind === 'audiooutput' && !!device.deviceId
    );
    this.currentDevices = { ...meeting.self.getCurrentDevices() };
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    this.removeMeetingListeners(oldMeeting);
    if (meeting != null) {
      const { self, stage } = meeting;

      this.canProduceAudio = this.meeting.self.permissions.canProduceAudio === 'ALLOWED';
      this.micPermission = meeting.self.mediaPermissions.audio || 'NOT_REQUESTED';
      this.audioEnabled = self.audioEnabled;

      this.stageStatus = meeting.stage.status;
      this.audioInputDevices = [];
      this.speakerDevices = [];
      this.currentDevices = { ...self.getCurrentDevices() };
      self.addListener('audioUpdate', this.audioUpdateListener);
      self.addListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
      self.addListener('deviceListUpdate', this.deviceListUpdateListener);
      self.addListener('deviceUpdate', this.deviceUpdateListener);
      stage?.addListener('stageStatusUpdate', this.stageStatusListener);
      meeting.self?.permissions?.addListener(
        'permissionsUpdate',
        this.meetingPermissionsUpdateListener
      );
      void this.refreshDevices(meeting);
    }
  }

  private setDevice = async (device: MediaDeviceInfo) => {
    const meeting = this.meeting;
    if (!meeting || (device.kind === 'audiooutput' && isFirefox(meeting))) return;
    try {
      await meeting.self.setDevice(device);
      if (meeting === this.meeting) {
        this.currentDevices = { ...meeting.self.getCurrentDevices() };
      }
    } catch (error) {
      meeting.__internals__.logger.warn('rtkMicToggle::setDevice', { error });
    }
  };

  private handleDeviceKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      (event.currentTarget as HTMLElement).click();
    }
  };

  private hasPermissionError() {
    return this.micPermission === 'DENIED' || this.micPermission === 'SYSTEM_DENIED';
  }

  private toggleMic = () => {
    this.meeting?.__internals__.logger.info('rtkMicToggle::toggleMic', {
      media: {
        audio: {
          enabled: Boolean(this.meeting?.self?.audioEnabled),
          permission: this.micPermission,
          canProduce: this.meeting?.self?.permissions?.canProduceAudio,
        },
      },
      webinar: {
        stageStatus: this.meeting?.stage?.status as any,
      },
      livestream: {
        stageStatus: this.meeting?.stage?.status,
      },
      moduleExists: {
        self: Boolean(this.meeting?.self),
      },
    });

    if (this.hasPermissionError()) {
      const permissionModalSettings: PermissionSettings = {
        enabled: true,
        kind: 'audio',
      };
      this.stateUpdate.emit({ activePermissionsMessage: permissionModalSettings });
      return false;
    }

    const self = this.meeting?.self;
    if (self == null || !this.canProduceAudio) {
      return;
    }
    if (self.audioEnabled) {
      self.disableAudio();
    } else {
      self.enableAudio();
    }
  };

  private getState() {
    let tooltipLabel = '';
    let label = '';
    let icon = '';
    let classList = {};
    let hasError = this.hasPermissionError();
    let couldNotStart = this.micPermission === 'COULD_NOT_START';

    if (this.audioEnabled && !hasError) {
      label = this.t('mic_on');
      icon = this.iconPack.mic_on;
    } else {
      label = this.t('mic_off');
      icon = this.iconPack.mic_off;
      classList['red-icon'] = true;
    }

    if (couldNotStart) {
      tooltipLabel = this.t('perm_could_not_start.audio');
    } else if (this.micPermission === 'SYSTEM_DENIED') {
      tooltipLabel = this.t('perm_sys_denied.audio');
    } else if (this.micPermission === 'DENIED') {
      tooltipLabel = this.t('perm_denied.audio');
    } else {
      tooltipLabel = this.audioEnabled ? this.t('disable_mic') : this.t('enable_mic');
    }

    return {
      tooltipLabel,
      label,
      icon,
      classList,
      showWarning: hasError || couldNotStart,
      disable: hasError,
    };
  }

  render() {
    if (!this.meeting) return null;
    if (
      !this.canProduceAudio ||
      ['OFF_STAGE', 'REQUESTED_TO_JOIN_STAGE'].includes(this.stageStatus)
    ) {
      return <Host data-hidden />;
    }

    const { tooltipLabel, label, icon, classList, showWarning, disable } = this.getState();

    return (
      <Host title={label}>
        <div class="mic-controls">
          <rtk-tooltip kind="block" label={tooltipLabel} part="tooltip">
            <rtk-controlbar-button
              part="controlbar-button"
              icon={icon}
              label={label}
              size={this.size}
              iconPack={this.iconPack}
              variant={this.variant}
              class={classList}
              onClick={this.toggleMic}
              showWarning={showWarning}
              disabled={disable}
            />
          </rtk-tooltip>
          {!this.hideDeviceSelectionMenu && (
            <rtk-menu
              placement="top"
              offset={4}
              size={this.size}
              iconPack={this.iconPack}
              t={this.t}
            >
              <button
                class="device-trigger"
                type="button"
                slot="trigger"
                aria-label={this.t('mic_toggle.audio_devices')}
                aria-haspopup="menu"
                title={this.t('mic_toggle.audio_devices')}
              >
                <rtk-icon icon={this.iconPack.chevron_up} size="sm" />
              </button>
              <rtk-menu-list role="menu" iconPack={this.iconPack} t={this.t}>
                {this.audioInputDevices.length === 0 && (
                  <div class="empty-devices">{this.t('not_found_microphone')}</div>
                )}
                {this.audioInputDevices.map((device) => (
                  <rtk-menu-item
                    role="menuitemradio"
                    aria-checked={String(this.currentDevices?.audio?.deviceId === device.deviceId)}
                    tabIndex={0}
                    title={device.label}
                    onClick={() => void this.setDevice(device)}
                    onKeyDown={this.handleDeviceKeyDown}
                  >
                    <span class="device-label">{device.label}</span>
                    {this.currentDevices?.audio?.deviceId === device.deviceId && (
                      <rtk-icon icon={this.iconPack.checkmark} size="sm" slot="end" />
                    )}
                  </rtk-menu-item>
                ))}
                <div class="menu-divider" role="separator" />
                {this.speakerDevices.length === 0 && (
                  <div class="empty-devices">{this.t('not_found_speaker')}</div>
                )}
                {this.speakerDevices.map((device) => (
                  <rtk-menu-item
                    role="menuitemradio"
                    aria-checked={String(
                      this.currentDevices?.speaker?.deviceId === device.deviceId
                    )}
                    aria-disabled={String(isFirefox(this.meeting))}
                    tabIndex={isFirefox(this.meeting) ? -1 : 0}
                    title={device.label}
                    onClick={() => void this.setDevice(device)}
                    onKeyDown={this.handleDeviceKeyDown}
                  >
                    <span class="device-label">{device.label}</span>
                    {this.currentDevices?.speaker?.deviceId === device.deviceId && (
                      <rtk-icon icon={this.iconPack.checkmark} size="sm" slot="end" />
                    )}
                  </rtk-menu-item>
                ))}
                <div
                  class={{
                    'additional-menu-items': true,
                    'has-items': this.hasAdditionalMenuItems,
                  }}
                >
                  {this.hasAdditionalMenuItems && <div class="menu-divider" role="separator" />}
                  <slot
                    name="additional-menu-items"
                    onSlotchange={(event) => {
                      this.hasAdditionalMenuItems =
                        (event.target as HTMLSlotElement).assignedElements().length > 0;
                    }}
                  />
                </div>
              </rtk-menu-list>
            </rtk-menu>
          )}
        </div>
      </Host>
    );
  }
}
