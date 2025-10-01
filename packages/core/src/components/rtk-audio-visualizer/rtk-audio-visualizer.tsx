import { Component, Host, h, Prop, State, Watch } from '@stencil/core';
import hark from 'hark';
import { Peer } from '../../types/rtk-client';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { Size } from '../../types/props';
import { drawBarsVisualizer } from '../../lib/visualizer';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKParticipant } from '@cloudflare/realtimekit';

export type AudioVisualizerVariant = 'bars';

/**
 * An audio visualizer component which visualizes a participants audio.
 *
 * Commonly used inside `rtk-name-tag`.
 */
@Component({
  tag: 'rtk-audio-visualizer',
  styleUrl: 'rtk-audio-visualizer.css',
  shadow: true,
})
export class RtkAudioVisualizer {
  private visualizer: HTMLCanvasElement;
  private hark: hark.Harker;

  private audioUpdateListener: (data: Pick<Peer, 'audioEnabled' | 'audioTrack'>) => void;
  private screenShareUpdateListener: (
    data: Pick<Peer, 'screenShareEnabled' | 'screenShareTracks'>
  ) => void;

  /** Variant */
  @Prop({ reflect: true }) variant: AudioVisualizerVariant = 'bars';

  /** Participant object */
  @Prop() participant: Peer;

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

  /** Hide when there is no audio / audio is muted */
  @Prop() hideMuted: boolean = false;

  /** Audio visualizer for screensharing, it will use screenShareTracks.audio instead of audioTrack */
  @Prop() isScreenShare: boolean = false;

  @State() audioEnabled: boolean;
  @State() volume: number = 0;

  connectedCallback() {
    this.participantChanged(this.participant);
  }

  componentDidLoad() {
    drawBarsVisualizer(this.visualizer, 0);
  }

  disconnectedCallback() {
    this.hark?.stop();
    this.audioUpdateListener &&
      (this.participant as RTKParticipant)?.removeListener('audioUpdate', this.audioUpdateListener);

    this.screenShareUpdateListener &&
      (this.participant as RTKParticipant)?.removeListener(
        'screenShareUpdate',
        this.screenShareUpdateListener
      );
  }

  @Watch('participant')
  participantChanged(participant: Peer) {
    if (participant != null) {
      this.audioUpdateListener = ({ audioEnabled, audioTrack }) => {
        this.hark?.stop();
        if (audioEnabled && audioTrack != null) {
          this.audioEnabled = true;
          const stream = new MediaStream();
          stream.addTrack(audioTrack);
          this.calcVolume(stream);
          // initial draw with volume: 0
          drawBarsVisualizer(this.visualizer, 0);
        } else {
          this.volume = 0;
          this.audioEnabled = false;
        }
      };

      if (this.isScreenShare) {
        this.screenShareUpdateListener = ({ screenShareEnabled, screenShareTracks }) => {
          this.audioUpdateListener({
            audioEnabled: screenShareEnabled && screenShareTracks.audio != null,
            audioTrack: screenShareTracks.audio,
          });
        };

        this.screenShareUpdateListener({
          screenShareEnabled: participant.screenShareEnabled,
          screenShareTracks: {
            audio: participant.screenShareTracks.audio,
            video: participant.screenShareTracks.video,
          },
        });
        (participant as RTKParticipant).addListener(
          'screenShareUpdate',
          this.screenShareUpdateListener
        );
      } else {
        this.audioUpdateListener(participant as Peer);

        (participant as RTKParticipant).addListener('audioUpdate', this.audioUpdateListener);
      }
    }
  }

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
        drawBarsVisualizer(this.visualizer, this.volume);
      }
    });
  }

  render() {
    if (this.hideMuted && !this.audioEnabled) return null;

    return (
      <Host>
        <div>
          <canvas
            width="24"
            height="24"
            class={{
              bars: true,
              visible: this.audioEnabled,
            }}
            ref={(el) => (this.visualizer = el)}
            part="canvas"
          ></canvas>
          {!this.isScreenShare && !this.audioEnabled && (
            <rtk-icon icon={this.iconPack.mic_off} part="mic-off-icon" />
          )}
        </div>
      </Host>
    );
  }
}
