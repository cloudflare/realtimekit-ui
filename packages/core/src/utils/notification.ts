import { Notification } from '../types/props';
import { Meeting } from '../types/rtk-client';
import { Sound } from '../lib/notification';

/**
 * Send notification which will be displayed in the `<rtk-notifications />` component.
 * @param notification Notification object
 * @param playSound The sound to play with the notification. Pass the name of a built-in sound
 * (`joined`, `left` or `message`) or the URL of an audio file. The URL must use `https:` or
 * `http:` and its path must end with an audio file extension. Any other URL is ignored.
 * @param meeting The meeting that the notification is for. Pass it when the page has more than
 * one meeting: only the `<rtk-notifications />` of this meeting shows the notification.
 * Without it, every `<rtk-notifications />` on the page shows the notification.
 * @returns Return value of emitting the event
 */
export const sendNotification = (
  notification: Notification,
  playSound: Sound | string | undefined = undefined,
  meeting: Meeting | undefined = undefined
) => {
  if (typeof document === 'undefined') return false;

  const event = new CustomEvent<Notification & { playSound: string; meetingId: string }>(
    'rtkNotification',
    {
      detail: {
        ...notification,
        playSound,
        meetingId: meeting?.meta?.meetingId,
      },
      composed: true,
    }
  );

  return document.dispatchEvent(event);
};
