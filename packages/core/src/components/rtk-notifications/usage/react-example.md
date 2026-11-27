`rtk-notifications` shows the notifications of a meeting and plays their sounds.

`createDefaultConfig()` returns a UI config. In the examples below it is named `uiConfig`. The notification settings are in `uiConfig.config`.

To change a notification setting, call `createDefaultConfig()`, change the setting, and pass the UI config to `rtk-notifications`.

## Config groups

`uiConfig.config` has four groups of notification settings. Every group has the same keys, one for each notification.

| Group                     | What it controls                             | Value                                                                                             |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `notifications`           | Shows or hides the notification.             | `true` or `false`                                                                                 |
| `notification_sounds`     | Plays a sound with the notification, or not. | `true` or `false`                                                                                 |
| `notification_duration`   | How long the notification stays on screen.   | Milliseconds. With `0`, it stays until the user dismisses it or another notification replaces it. |
| `notification_sound_urls` | The audio file of the sound.                 | A URL. See "Sound files".                                                                         |

Start from `createDefaultConfig()`, so that you can see and change every key. If a group or a key is missing from the config, `rtk-notifications` uses its default value.

The groups work on their own. If you hide a notification, its sound still plays unless you also set its key in `notification_sounds` to `false`.

## Example

This example hides one notification, turns off one sound, and changes one duration.

```jsx
import {
  RtkNotifications,
  createDefaultConfig,
} from '@cloudflare/realtimekit-react-ui';

const uiConfig = createDefaultConfig();
uiConfig.config.notifications.participant_joined = false;
uiConfig.config.notification_sounds.chat_new_message = false;
uiConfig.config.notification_duration.recording_started = 5000;

function Notifications({ meeting }) {
  return <RtkNotifications meeting={meeting} config={uiConfig} />;
}
```

## Default values

The default config shows every notification except these:

- `chat_message_edited`
- `chat_message_deleted`
- `stage_requested_to_join`
- `stage_joined`

The default config turns the sound on for these notifications only:

- `participant_joined`
- `participant_joined_waitlist`
- `chat_new_message`
- `polls_new_poll`
- `custom`

To see every default value, read the object that `createDefaultConfig()` returns.

## Notification keys

| Key                              | When `rtk-notifications` shows it                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `participant_joined`             | A participant joins the meeting.                                                                                            |
| `participant_left`               | A participant leaves the meeting.                                                                                           |
| `participant_joined_waitlist`    | A participant asks to join from the waiting room. Only users who can accept these requests see it. It has an Accept button. |
| `chat_new_message`               | Another participant sends a text message.                                                                                   |
| `chat_message_edited`            | Another participant edits a message.                                                                                        |
| `chat_message_deleted`           | Another participant deletes a message.                                                                                      |
| `polls_new_poll`                 | Another participant creates a poll.                                                                                         |
| `tab_sync_plugin_switched`       | The meeting switches to a plugin.                                                                                           |
| `tab_sync_screen_share_switched` | The meeting switches to the screen share of a participant.                                                                  |
| `recording_started`              | The recording starts.                                                                                                       |
| `recording_stopped`              | The recording stops.                                                                                                        |
| `stage_requested_to_join`        | A participant asks to join the stage. Only users who can accept these requests see it. It has an Accept button.             |
| `stage_joined`                   | A participant joins the stage.                                                                                              |
| `stage_request_accepted`         | Your request to join the stage is accepted.                                                                                 |
| `stage_request_rejected`         | Your request to join the stage is rejected.                                                                                 |
| `stage_new_request_received`     | New requests to join the stage are waiting. Only users who can accept these requests see it.                                |
| `stage_invite_sent`              | You invite a participant to the stage.                                                                                      |
| `speaker_switched`               | The speaker changes to another device.                                                                                      |
| `camera_switched`                | The camera changes to another device.                                                                                       |
| `microphone_switched`            | The microphone changes to another device.                                                                                   |
| `network_reconnecting`           | The connection is lost and the meeting tries to reconnect.                                                                  |
| `network_delayed`                | Reconnecting takes a long time.                                                                                             |
| `network_disconnected`           | The meeting could not reconnect. It has an End Meeting button.                                                              |
| `network_failed`                 | The connection failed. It has an End Meeting button.                                                                        |
| `network_restored`               | The connection is back after a reconnect.                                                                                   |
| `api_error`                      | Starting or stopping a recording or a livestream fails, or a screen share fails to start.                                   |
| `custom`                         | Your app sends a notification with `sendNotification()`.                                                                    |

If you hide `network_disconnected` or `network_failed`, the user does not get the End Meeting button from `rtk-notifications`.

## Show or hide a notification

Set the key in `notifications` to `false` to hide a notification.

```js
const uiConfig = createDefaultConfig();
uiConfig.config.notifications.participant_joined = false;
uiConfig.config.notifications.chat_message_edited = false;
```

## Notification duration

Set the key in `notification_duration` to the time in milliseconds.

```js
const uiConfig = createDefaultConfig();
uiConfig.config.notification_duration.participant_joined = 5000; // 5 seconds
uiConfig.config.notification_duration.recording_started = 60 * 1000; // 1 minute
uiConfig.config.notification_duration.chat_new_message = 0; // stays until dismissed
```

A notification from `sendNotification()` keeps the duration that your app gives it.

## Notification sound

Set the key in `notification_sounds` to `false` to turn off the sound of a notification.

```js
const uiConfig = createDefaultConfig();
uiConfig.config.notification_sounds.participant_joined = false;
uiConfig.config.notification_sounds.polls_new_poll = false;
```

After a sound starts, `rtk-notifications` does not start another sound for 3 seconds.

## Sound files

Set the key in `notification_sound_urls` to the URL of your own audio file.

```js
const uiConfig = createDefaultConfig();
uiConfig.config.notification_sound_urls.participant_joined =
  'https://example.com/sounds/join.mp3';
```

`rtk-notifications` plays a URL only if both of these are true:

- The URL is absolute and starts with `https:` or `http:`. A relative path, such as `/sounds/join.mp3`, does not pass.
- The path of the URL ends with `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.opus` or `.webm`.

If a URL does not pass this check, `rtk-notifications` plays the default sound of that notification. The `custom` key is the exception, because it has no default sound.

## Sounds of your own notifications

`sendNotification()` takes the sound as its second argument. Pass the name of a built-in sound (`joined`, `left` or `message`) or the URL of your own audio file. The URL follows the same check as above.

```js
sendNotification(
  { id: 'hand-raised', message: 'Ada raised a hand' },
  'https://example.com/sounds/hand.mp3'
);
sendNotification(
  { id: 'vote-closed', message: 'The vote is closed' },
  'message'
);
```

The `custom` key in `notification_sound_urls` is the sound for a notification that your app sends without a sound. It is empty by default, so such a notification plays no sound. A URL that does not pass the check counts as no sound.

## More than one meeting on a page

If a page has more than one meeting, every `rtk-notifications` on the page shows a notification from `sendNotification()`. To send a notification to one meeting only, pass that meeting as the third argument.

```js
sendNotification(
  { id: 'hand-raised', message: 'Ada raised a hand' },
  'message',
  meeting
);
```

`rtk-notifications` then compares `meeting.meta.meetingId` with the ID of its own meeting. If the IDs are different, it does not show the notification and does not play its sound.

If you do not pass a meeting, every `rtk-notifications` on the page shows the notification, as before.

## Sound limits by participant count

Two keys turn sounds off in large meetings. If the meeting has more participants than the limit, the sound does not play. The notification still shows.

| Key                                                 | Default | Sounds that follow it                                                               |
| --------------------------------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `participant_joined_sound_notification_limit`       | 3       | `participant_joined`, `participant_left`, `participant_joined_waitlist`             |
| `participant_chat_message_sound_notification_limit` | 10      | `chat_new_message`, `chat_message_edited`, `chat_message_deleted`, `polls_new_poll` |

```js
const uiConfig = createDefaultConfig();
uiConfig.config.participant_joined_sound_notification_limit = 20;
uiConfig.config.participant_chat_message_sound_notification_limit = 0; // no limit
```

Set a limit to `0` to remove it. The other sounds have no limit.

## Maximum number of notifications on screen

`visible_notifications_limit` sets how many notifications can be on screen at one time. The default is 5.

While this many notifications are on screen, `rtk-notifications` does not show a new notification. It does not show that notification later. Its sound still plays.

```js
const uiConfig = createDefaultConfig();
uiConfig.config.visible_notifications_limit = 3;
```

The limit does not apply to `network_disconnected` and `network_failed`. `rtk-notifications` always shows them, because they have the End Meeting button.

Set `visible_notifications_limit` to `0` to remove the maximum.
