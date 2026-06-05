import { Meeting } from '../types/rtk-client';
import { isFirefox } from '../utils/browser';

interface PeerAudio {
  id: string;
  track: MediaStreamTrack;
}

/**
 * Handles audio from participants in a meeting
 */
export default class RTKAudio {
  private audio: HTMLAudioElement;
  private audioStream: MediaStream;
  private meeting: Meeting;

  private audioTracks: PeerAudio[];

  private logger: Meeting['__internals__']['logger'];

  private _onError: () => void;

  constructor(meeting: Meeting, audio?: HTMLAudioElement) {
    this.meeting = meeting;
    this.audio = audio ?? document.createElement('audio');
    this.audio.autoplay = true;
    this.logger = meeting.__internals__.logger;

    this.audioStream = new MediaStream();
    this.audio.srcObject = this.audioStream;

    this.audioTracks = [];
  }

  addTrack(id: string, track: MediaStreamTrack) {
    // Remove the track if it already exists, with the same id
    this.removeTrack(id);
    this.audioTracks.push({ id, track });
    this.audioStream.addTrack(track);
    this.play();
  }

  removeTrack(id: string) {
    const track = this.audioTracks.find((a) => a.id === id);
    if (track != null) {
      this.audioStream.removeTrack(track.track);
      this.audioTracks = this.audioTracks.filter((a) => a.id !== id);
    }
  }

  async play() {
    this.audio.srcObject = this.audioStream;

    await this.audio.play()?.catch((err) => {
      if (err.name === 'NotAllowedError') {
        if (this._onError != null) {
          this._onError();
        }
      } else if (err.name !== 'AbortError') {
        this.logger.error('[rtk-audio] play() error\n', err);
      }
    });
  }

  async setDevice(id: string) {
    if (isFirefox(this.meeting)) return;
    await (this.audio as any).setSinkId?.(id)?.catch((err) => {
      this.logger.error('[rtk-audio] setSinkId() error\n', err);
    });
  }

  onError(onError: () => void) {
    this._onError = onError;
  }
}
