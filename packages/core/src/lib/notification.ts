import { Meeting } from '../types/rtk-client';
import { isFirefox } from '../utils/browser';

export const SOUNDS = {
  joined: 'https://rtk-assets.realtime.cloudflare.com/ui-kit/sounds/notification_join.mp3',
  left: 'https://rtk-assets.realtime.cloudflare.com/ui-kit/sounds/notification_join.mp3',
  message: 'https://rtk-assets.realtime.cloudflare.com/ui-kit/sounds/notification_message.mp3',
};

export type Sound = keyof typeof SOUNDS;

/**
 * Checks that a value is the name of a built-in sound: `joined`, `left` or `message`.
 */
export function isBuiltInSoundName(value: unknown): value is Sound {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SOUNDS, value);
}

const AUDIO_FILE_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus', '.webm'];

/**
 * Checks that a value is a valid sound URL.
 * It must be an absolute URL that starts with `https://` or `http://` and ends with a
 * supported audio file extension: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.opus`
 * or `.webm`.
 * A query string after the extension is allowed.
 */
export function isAudioFileUrl(url: unknown): url is string {
  if (!url || typeof url !== 'string') return false;

  let parsedUrl: URL;
  try {
    // no base URL: a relative path is not a valid URL here
    parsedUrl = new URL(url);
  } catch (error) {
    return false;
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') return false;

  const path = parsedUrl.pathname.toLowerCase();
  return AUDIO_FILE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

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

  /**
   * Plays one of the built-in notification sounds: `joined`, `left` or `message`.
   * After a sound starts, no other sound can start for `duration` milliseconds.
   * A call during that time does nothing.
   * @param sound The name of the built-in sound
   * @param duration How long this sound plays before other sounds can start, in milliseconds
   */
  play(sound: Sound, duration: number = 3000) {
    this.playUrlSound(SOUNDS[sound], duration);
  }

  /**
   * Plays an audio file from a URL.
   * It must be an absolute URL that starts with `https://` or `http://` and ends with a
   * supported audio file extension: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.opus`
   * or `.webm`.
   * Any other URL is ignored.
   * @param url The URL of the audio file to play
   * @param duration How long this sound plays before other sounds can start, in milliseconds
   */
  playUrl(url: string, duration: number = 3000) {
    if (!isAudioFileUrl(url)) return;
    this.playUrlSound(url, duration);
  }

  private playUrlSound(source: string, duration: number) {
    if (this.playing) return;

    this.playing = true;

    this.audio.src = source;
    this.audio.volume = 0.3;
    this.audio.play()?.catch((_) => {});

    setTimeout(() => {
      this.playing = false;
    }, duration);
  }

  async setDevice(id: string) {
    if (isFirefox(this.meeting)) return;
    await (this.audio as any)?.setSinkId?.(id)?.catch((_) => {});
  }
}
