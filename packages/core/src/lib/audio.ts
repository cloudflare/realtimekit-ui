import { Meeting } from '../types/rtk-client';
import { isFirefox } from '../utils/browser';

interface TrackOwners {
  track: MediaStreamTrack;
  audioIds: Set<string>;
}

/**
 * Handles audio from participants in a meeting
 */
export default class RTKAudio {
  private audio: HTMLAudioElement;
  private audioStream: MediaStream;
  private meeting: Meeting;

  /** Maps participant audio/screenshare track IDs to their physical MediaStreamTrack IDs. */
  private trackIdByAudioIdMap: Map<string, string>;

  /** Keeps the idempotent set of logical owners for each physical track. */
  private trackOwners: Map<string, TrackOwners>;

  private logger: Meeting['__internals__']['logger'];

  private _onError: () => void;

  constructor(meeting: Meeting, audio?: HTMLAudioElement) {
    this.meeting = meeting;
    this.audio = audio ?? document.createElement('audio');
    this.audio.autoplay = true;
    this.logger = meeting.__internals__.logger;

    this.audioStream = new MediaStream();
    this.audio.srcObject = this.audioStream;

    this.trackIdByAudioIdMap = new Map();
    this.trackOwners = new Map();
  }

  addTrack(audioId: string, track: MediaStreamTrack) {
    /**
     * NOTE(ravindra-cloudflare):
     * audioId format: audio-${peerId} or screenshare-${peerId}.
     *
     * During reconnection, the old and new peer IDs of the same participant
     * can temporarily co-own the same track.
     *
     * Before adding track, we should check if the track is already added with a different audio ID.
     */
    const currentTrackId = this.trackIdByAudioIdMap.get(audioId);

    // Track already added, just play it
    if (currentTrackId === track.id) {
      this.play();
      return;
    }

    // A logical audio ID owns one track. Release its previous track before replacing it.
    if (currentTrackId) this.removeTrack(audioId);

    this.trackIdByAudioIdMap.set(audioId, track.id);
    const owners = this.trackOwners.get(track.id);
    if (owners) {
      // Set membership is idempotent when reconnect events repeat or arrive out of order.
      owners.audioIds.add(audioId);
    } else {
      // If you are the first owner of this track, add it to the audio stream
      this.trackOwners.set(track.id, { track, audioIds: new Set([audioId]) });
      this.audioStream.addTrack(track);
    }
    this.play();
  }

  removeTrack(audioId: string) {
    /**
     * NOTE(ravindra-cloudflare):
     * audioId format: audio-${peerId} or screenshare-${peerId}.
     *
     * During reconnection, the old and new peer IDs of the same participant
     * can temporarily co-own the same track.
     *
     * Before removing track, we should check if the track is still owned by other audio IDs.
     */
    const trackId = this.trackIdByAudioIdMap.get(audioId);
    if (!trackId) return;

    this.trackIdByAudioIdMap.delete(audioId);
    const owners = this.trackOwners.get(trackId);
    if (!owners) return;

    owners.audioIds.delete(audioId);
    if (owners.audioIds.size > 0) return;

    // Remove the physical track only after its final logical owner is gone.
    this.audioStream.removeTrack(owners.track);
    this.trackOwners.delete(trackId);
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
