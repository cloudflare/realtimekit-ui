import { Meeting } from '../types/rtk-client';
import { disableSettingSinkId } from '../utils/flags';

const SOUNDS = {
  joined: 'https://rtk-uploads.realtime.cloudflare.com/notification_join.mp3',
  left: 'https://rtk-uploads.realtime.cloudflare.com/notification_join.mp3',
  message: 'https://rtk-uploads.realtime.cloudflare.com/notification_message.mp3',
};

export type Sound = keyof typeof SOUNDS;

/**
 * Handles notification sounds in a meeting
 */
export default class RTKNotificationsAudio {
  private audio: HTMLAudioElement;
  private playing: boolean;
  private meeting: Meeting;

  constructor(meeting: Meeting) {
    this.meeting = meeting;
    this.audio = document.createElement('audio');
    this.audio.volume = 0.3;
  }

  play(sound: Sound, duration: number = 3000) {
    if (this.playing) return;

    this.playing = true;

    this.audio.src = SOUNDS[sound];
    this.audio.volume = 0.3;
    this.audio.play()?.catch((_) => {});

    setTimeout(() => {
      this.playing = false;
    }, duration);
  }

  async setDevice(id: string) {
    if (disableSettingSinkId(this.meeting)) return;
    await (this.audio as any)?.setSinkId?.(id)?.catch((_) => {});
  }
}
