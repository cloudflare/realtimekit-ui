import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import { Meeting, Peer } from '../../types/rtk-client';
import { UIConfig } from '../../types/ui-config';
import { Size } from '../../types/props';
import { RtkI18n, IconPack, States, defaultIconPack, useLanguage } from '../../exports';
import hark from 'hark';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKParticipant } from '@cloudflare/realtimekit';

@Component({
  tag: 'rtk-audio-tile',
  styleUrl: 'rtk-audio-tile.css',
  shadow: true,
})
export class RtkAudioTile {
  private hark: hark.Harker;

  /** Meeting */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** States */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Participant object */
  @Prop() participant: Peer;

  @State() audioEnabled = false;

  @State() volume = 0;

  connectedCallback() {
    this.participantChanged(this.participant);
  }

  disconnectedCallback() {
    this.hark?.stop();
    (this.participant as RTKParticipant)?.removeListener('audioUpdate', this.onAudioUpdate);
  }

  @Watch('participant')
  participantChanged(participant: Peer) {
    if (!participant) {
      return;
    }

    this.audioEnabled = participant.audioEnabled;

    (participant as RTKParticipant).addListener('audioUpdate', this.onAudioUpdate);
  }

  private onAudioUpdate = ({
    audioEnabled,
    audioTrack,
  }: Pick<Peer, 'audioEnabled' | 'audioTrack'>) => {
    if (!this.participant) return;
    // stop the analyser of the previous track so it does not keep polling
    this.hark?.stop();
    if (audioEnabled && audioTrack) {
      const stream = new MediaStream();
      stream.addTrack(audioTrack);
      this.calcVolume(stream);

      this.audioEnabled = true;
    } else {
      this.volume = 0;
      this.audioEnabled = false;
    }
  };

  /**
   * Determines the volume from a given MediaStream and updates the components state
   * @param stream A MediaStream with AudioTrack(s) added
   */
  private calcVolume(stream: MediaStream) {
    this.hark = hark(stream, {
      play: false,
      interval: 1000 / 10,
    });

    this.hark.on('volume_change', (dBs) => {
      const prevVolume = this.volume;

      // The exact formula to convert from dBs (-100..0) to linear (0..1) is:
      //   Math.pow(10, dBs / 20)
      // However it does not produce a visually useful output, so let exagerate
      // it a bit. Also, let convert it from 0..1 to 0..10 and avoid value 1 to
      // minimize component renderings.

      // if dBs is -Inifnity, set vol to 0
      let audioVol = Math.round(10 ** (dBs / 115) * 10);
      if (audioVol < 3) audioVol = 0;
      let volume = Math.round((prevVolume * 2 + audioVol) / 3);

      if (prevVolume !== volume) {
        this.volume = volume;
      }
    });
  }

  render() {
    if (!this.meeting) return null;
    const defaults = {
      meeting: this.meeting,
      size: this.size,
      config: this.config,
      states: this.states,
      iconPack: this.iconPack,
      t: this.t,
    };

    let shadowClass = 'bar-0';

    if (this.volume > 5) {
      shadowClass = 'bar-5';
    } else if (this.volume < 0) {
      shadowClass = 'bar-0';
    } else {
      shadowClass = 'bar-' + this.volume;
    }

    return (
      <Host>
        <div class={{ 'avatar-ctr': true, speaking: this.audioEnabled, [shadowClass]: true }}>
          <rtk-avatar participant={this.participant} size={this.size}>
            {!this.audioEnabled && (
              <div class="mic-icon">
                <rtk-icon icon={defaultIconPack.mic_off} />
              </div>
            )}
          </rtk-avatar>
        </div>

        <rtk-name-tag variant="text" participant={this.participant} {...defaults} />

        <slot></slot>
      </Host>
    );
  }
}
