import { Component, Host, h, Prop, Watch, State, writeTask } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Size } from '../../types/props';
import { SyncWithStore } from '../../utils/sync-with-store';
import { isFirefox } from '../../utils/browser';

/**
 * A component which lets to manage your audio devices and audio preferences.
 *
 * Emits `rtkStateUpdate` event with data for muting notification sounds:
 * ```ts
 * {
 *  prefs: {
 *    muteNotificationSounds: boolean
 *  }
 * }
 * ```
 */
@Component({
  tag: 'rtk-microphone-selector',
  styleUrl: 'rtk-microphone-selector.css',
  shadow: true,
})
export class RtkMicrophoneSelector {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** variant */
  @Prop() variant: 'full' | 'inline' = 'full';

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() audioinputDevices: MediaDeviceInfo[] = [];
  @State() canProduceAudio: boolean = true;
  @State() currentDevices: {
    audio: MediaDeviceInfo;
  } = { audio: undefined };

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting?.stage?.removeListener('stageStatusUpdate', this.stageStateListener);
    this.meeting?.self.removeListener('deviceListUpdate', this.deviceListUpdateListener);
    this.meeting?.self.removeListener('deviceUpdate', this.deviceUpdateListener);
    this.meeting?.self.removeListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
  }

  private stageStateListener = () => {
    this.canProduceAudio = this.meeting.self.permissions.canProduceAudio === 'ALLOWED';
  };

  private deviceListUpdateListener = async () => {
    const devices = await this.meeting.self.getAudioDevices();
    this.audioinputDevices = devices;
  };

  private deviceUpdateListener = ({ device }) => {
    if (device.kind === 'audioinput') {
      this.currentDevices = {
        audio: device,
      };
    }
  };

  private mediaPermissionUpdateListener = async ({ kind, message }) => {
    if (!this.meeting) return;
    if (kind === 'audio' && message === 'ACCEPTED') {
      this.audioinputDevices = await this.meeting.self.getAudioDevices();
    }
  };

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;

    writeTask(async () => {
      const { self, stage } = meeting;
      const audioDevices = await meeting.self.getAudioDevices();
      const currentAudioDevice = meeting.self.getCurrentDevices()?.audio;
      this.currentDevices = {
        audio: currentAudioDevice,
      };
      this.canProduceAudio = meeting.self.permissions.canProduceAudio === 'ALLOWED';

      stage?.addListener('stageStatusUpdate', this.stageStateListener);
      self.addListener('deviceListUpdate', this.deviceListUpdateListener);
      self.addListener('deviceUpdate', this.deviceUpdateListener);
      self.addListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);

      if (currentAudioDevice != undefined) {
        this.audioinputDevices = [
          audioDevices.find((device) => device.deviceId === currentAudioDevice.deviceId) ??
            currentAudioDevice,
          ...audioDevices.filter((device) => device.deviceId !== currentAudioDevice.deviceId),
        ];
      } else {
        this.audioinputDevices = audioDevices;
      }
    });
  }

  private setDevice(deviceId: string) {
    if (isFirefox(this.meeting)) return;
    const device = this.audioinputDevices.find((d) => d.deviceId === deviceId);

    if (device != null) {
      this.currentDevices = {
        audio: device,
      };
      this.meeting?.self.setDevice(device);
    }
  }

  render() {
    if (!this.meeting) return null;

    let unnamedMicCount = 0;

    return (
      <Host>
        {this.canProduceAudio && (
          <div part="microphone-selection" class={'group container ' + this.variant}>
            <label slot="label">
              {this.variant !== 'inline' && this.t('settings.microphone_input')}
              <rtk-icon icon={this.iconPack.mic_on} size="sm" />
            </label>
            <div class="row">
              <select
                class="rtk-select"
                onChange={(e) => this.setDevice((e.target as HTMLSelectElement).value)}
              >
                {this.audioinputDevices.map(({ deviceId, label }) => (
                  <option
                    value={deviceId}
                    selected={this.currentDevices.audio?.deviceId === deviceId}
                  >
                    {label || `Microphone ${++unnamedMicCount}`}
                  </option>
                ))}
              </select>
              <slot name="indicator" />
            </div>
          </div>
        )}
      </Host>
    );
  }
}
