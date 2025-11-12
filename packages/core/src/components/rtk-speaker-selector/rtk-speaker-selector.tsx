import { Component, Host, h, Prop, Watch, State, writeTask } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Size, States } from '../../types/props';

import { SyncWithStore } from '../../utils/sync-with-store';

import { disableSettingSinkId } from '../../utils/flags';

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
  tag: 'rtk-speaker-selector',
  styleUrl: 'rtk-speaker-selector.css',
  shadow: true,
})
export class RtkSpeakerSelector {
  private testAudioEl: HTMLAudioElement;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** variant */
  @Prop() variant: 'full' | 'inline' = 'full';

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

  @State() speakerDevices: MediaDeviceInfo[] = [];
  @State() currentDevices: {
    speaker: MediaDeviceInfo;
  } = { speaker: undefined };

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting?.self.removeListener('deviceListUpdate', this.deviceListUpdateListener);
    this.meeting?.self.removeListener('deviceUpdate', this.deviceUpdateListener);
    this.meeting?.self.addListener('mediaPermissionUpdate', this.mediaPermissionUpdate);
  }

  private deviceListUpdateListener = async () => {
    const devices = await this.meeting.self.getSpeakerDevices();
    this.speakerDevices = devices;
  };

  private deviceUpdateListener = ({ device }) => {
    if (device.kind === 'audiooutput') {
      this.currentDevices = {
        speaker: device,
      };
    }
  };

  private mediaPermissionUpdate = async ({ kind, message }) => {
    if (!this.meeting) return;
    if (kind === 'audio' && message === 'ACCEPTED') {
      this.speakerDevices = await this.meeting.self.getSpeakerDevices();
    }
  };

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;

    writeTask(async () => {
      const { self } = meeting;
      const speakerDevices = await meeting.self.getSpeakerDevices();
      const currentSpeakerDevice = meeting.self.getCurrentDevices()?.speaker;
      this.currentDevices = {
        speaker: currentSpeakerDevice,
      };

      self.addListener('deviceListUpdate', this.deviceListUpdateListener);
      self.addListener('deviceUpdate', this.deviceUpdateListener);
      self.addListener('mediaPermissionUpdate', this.mediaPermissionUpdate);

      if (currentSpeakerDevice != undefined) {
        this.speakerDevices = [
          speakerDevices.find((device) => device.deviceId === currentSpeakerDevice.deviceId) ??
            currentSpeakerDevice,
          ...speakerDevices.filter((device) => device.deviceId !== currentSpeakerDevice.deviceId),
        ];
      } else {
        this.speakerDevices = speakerDevices;
      }
    });
  }

  private testAudio() {
    this.testAudioEl?.play();
  }

  private setDevice(deviceId) {
    if (disableSettingSinkId(this.meeting)) return;
    const device = this.speakerDevices.find((d) => d.deviceId === deviceId);

    this.currentDevices = {
      speaker: device,
    };

    if (device != null) {
      this.meeting?.self.setDevice(device);
      (this.testAudioEl as any)?.setSinkId(device.deviceId);
    }
  }

  render() {
    if (!this.meeting) return null;

    let unnamedSpeakerCount = 0;
    return (
      <Host>
        <audio
          preload="auto"
          src="https://rtk-assets.realtime.cloudflare.com/ui-kit/speaker-test.mp3"
          ref={(el) => (this.testAudioEl = el)}
        />
        <div class={'group ' + this.variant} part="speaker-selection">
          {this.speakerDevices.length > 0 && !disableSettingSinkId(this.meeting) && (
            <div class="container">
              <label>
                {this.variant !== 'inline' && this.t('settings.speaker_output')}
                <rtk-icon icon={this.iconPack.speaker} size="sm" />
              </label>
              <div class="row">
                <select
                  class="rtk-select"
                  onChange={(e) => this.setDevice((e.target as HTMLSelectElement).value)}
                >
                  {this.speakerDevices.map(({ deviceId, label }) => (
                    <option
                      value={deviceId}
                      selected={this.currentDevices.speaker?.deviceId === deviceId}
                    >
                      {label || `Speaker ${++unnamedSpeakerCount}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {this.variant === 'full' && (
            <rtk-button variant="secondary" onClick={() => this.testAudio()}>
              <rtk-icon icon={this.iconPack.speaker} slot="start" />
              {this.t('test')}
            </rtk-button>
          )}
        </div>
      </Host>
    );
  }
}
