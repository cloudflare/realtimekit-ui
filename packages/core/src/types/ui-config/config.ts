import { SOUNDS } from '../../lib/notification';

export type NotificationKey =
  | 'participant_joined'
  | 'participant_left'
  | 'participant_joined_waitlist'
  | 'chat_new_message'
  | 'chat_message_edited'
  | 'chat_message_deleted'
  | 'polls_new_poll'
  | 'tab_sync_plugin_switched'
  | 'tab_sync_screen_share_switched'
  | 'recording_started'
  | 'recording_stopped'
  | 'stage_requested_to_join'
  | 'stage_joined'
  | 'stage_request_accepted'
  | 'stage_request_rejected'
  | 'stage_new_request_received'
  | 'stage_invite_sent'
  | 'speaker_switched'
  | 'camera_switched'
  | 'microphone_switched'
  | 'network_restored'
  | 'network_reconnecting'
  | 'network_delayed'
  | 'network_disconnected'
  | 'network_failed'
  | 'api_error'
  | 'custom';

export type NotificationType = Record<NotificationKey, boolean>;
export type NotificationSoundsType = Record<NotificationKey, boolean>;
export type NotificationDuration = Record<NotificationKey, number>;
export type NotificationSoundUrls = Record<NotificationKey, string>;

export interface NotificationConfig {
  /** Shows or hides each notification. */
  notifications: Partial<NotificationType>;
  /** Turns the sound of each notification on or off. */
  notification_sounds: Partial<NotificationSoundsType>;
  /**
   * How long each notification stays on screen, in milliseconds.
   * With `0`, a notification stays until it is dismissed or replaced.
   */
  notification_duration: Partial<NotificationDuration>;
  /**
   * The audio file that each notification plays.
   * A URL must use `https:` or `http:` and its path must end with an audio file
   * extension: `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.opus` or `.webm`.
   * Any other value is ignored and the default sound of that notification is played.
   * `custom` is empty by default: it plays the sound that the sender of the notification chose.
   */
  notification_sound_urls: Partial<NotificationSoundUrls>;

  /**
   * The participant limit for the sounds of participants who join or leave.
   *
   * These three sounds share this limit: `participant_joined`, `participant_left`
   * and `participant_joined_waitlist`.
   *
   * If the meeting has more participants than this number, these sounds do not play.
   * The notifications still show. The sounds play again when the number of
   * participants is at or below the limit.
   *
   * With `0`, these sounds have no limit.
   */
  participant_joined_sound_notification_limit: number;
  /**
   * The participant limit for the sounds of chat messages and polls.
   *
   * These four sounds share this limit: `chat_new_message`, `chat_message_edited`,
   * `chat_message_deleted` and `polls_new_poll`.
   *
   * If the meeting has more participants than this number, these sounds do not play.
   * The notifications still show. The sounds play again when the number of
   * participants is at or below the limit.
   *
   * With `0`, these sounds have no limit.
   */
  participant_chat_message_sound_notification_limit: number;

  /**
   * The maximum number of notifications on screen at one time.
   * While this many notifications are on screen, a new notification is not shown.
   * With `0`, there is no maximum.
   */
  visible_notifications_limit: number;
}

export type VideoFit = 'cover' | 'contain';

export type Config = Partial<NotificationConfig> & {
  videoFit?: VideoFit;
};

export const DEFAULT_NOTIFICATION_DURATION = 2000;

export const DEFAULT_NOTIFICATION_CONFIG: Readonly<NotificationConfig> = Object.freeze({
  notifications: {
    participant_joined: true,
    participant_left: true,
    participant_joined_waitlist: true,
    chat_new_message: true,
    chat_message_edited: false,
    chat_message_deleted: false,
    polls_new_poll: true,
    tab_sync_plugin_switched: true,
    tab_sync_screen_share_switched: true,
    recording_started: true,
    recording_stopped: true,
    stage_requested_to_join: false,
    stage_joined: false,
    stage_request_accepted: true,
    stage_request_rejected: true,
    stage_new_request_received: true,
    stage_invite_sent: true,
    speaker_switched: true,
    camera_switched: true,
    microphone_switched: true,
    network_restored: true,
    network_reconnecting: true,
    network_delayed: true,
    network_disconnected: true,
    network_failed: true,
    api_error: true,
    custom: true,
  },
  notification_sounds: {
    participant_joined: true,
    participant_left: false,
    participant_joined_waitlist: true,
    chat_new_message: true,
    chat_message_edited: false,
    chat_message_deleted: false,
    polls_new_poll: true,
    tab_sync_plugin_switched: false,
    tab_sync_screen_share_switched: false,
    recording_started: false,
    recording_stopped: false,
    stage_requested_to_join: false,
    stage_joined: false,
    stage_request_accepted: false,
    stage_request_rejected: false,
    stage_new_request_received: false,
    stage_invite_sent: false,
    speaker_switched: false,
    camera_switched: false,
    microphone_switched: false,
    network_restored: false,
    network_reconnecting: false,
    network_delayed: false,
    network_disconnected: false,
    network_failed: false,
    api_error: false,
    custom: true,
  },
  notification_duration: {
    participant_joined: 2100,
    participant_left: 2100,
    participant_joined_waitlist: 4000,
    chat_new_message: DEFAULT_NOTIFICATION_DURATION,
    chat_message_edited: DEFAULT_NOTIFICATION_DURATION,
    chat_message_deleted: DEFAULT_NOTIFICATION_DURATION,
    polls_new_poll: DEFAULT_NOTIFICATION_DURATION,
    tab_sync_plugin_switched: 2100,
    tab_sync_screen_share_switched: DEFAULT_NOTIFICATION_DURATION,
    recording_started: DEFAULT_NOTIFICATION_DURATION,
    recording_stopped: DEFAULT_NOTIFICATION_DURATION,
    stage_requested_to_join: DEFAULT_NOTIFICATION_DURATION,
    stage_joined: DEFAULT_NOTIFICATION_DURATION,
    stage_request_accepted: 3000,
    stage_request_rejected: 3000,
    stage_new_request_received: 3000,
    stage_invite_sent: DEFAULT_NOTIFICATION_DURATION,
    speaker_switched: 5000,
    camera_switched: 5000,
    microphone_switched: 5000,
    network_restored: 3000,
    network_reconnecting: 0,
    network_delayed: 0,
    network_disconnected: 0,
    network_failed: 0,
    api_error: DEFAULT_NOTIFICATION_DURATION,
    custom: DEFAULT_NOTIFICATION_DURATION,
  },
  notification_sound_urls: {
    participant_joined: SOUNDS.joined,
    participant_left: SOUNDS.left,
    participant_joined_waitlist: SOUNDS.message,
    chat_new_message: SOUNDS.message,
    chat_message_edited: SOUNDS.message,
    chat_message_deleted: SOUNDS.message,
    polls_new_poll: SOUNDS.message,
    tab_sync_plugin_switched: SOUNDS.message,
    tab_sync_screen_share_switched: SOUNDS.message,
    recording_started: SOUNDS.message,
    recording_stopped: SOUNDS.message,
    stage_requested_to_join: SOUNDS.joined,
    stage_joined: SOUNDS.joined,
    stage_request_accepted: SOUNDS.message,
    stage_request_rejected: SOUNDS.message,
    stage_new_request_received: SOUNDS.message,
    stage_invite_sent: SOUNDS.message,
    speaker_switched: SOUNDS.message,
    camera_switched: SOUNDS.message,
    microphone_switched: SOUNDS.message,
    network_restored: SOUNDS.message,
    network_reconnecting: SOUNDS.message,
    network_delayed: SOUNDS.message,
    network_disconnected: SOUNDS.message,
    network_failed: SOUNDS.message,
    api_error: SOUNDS.message,
    custom: '',
  },
  participant_joined_sound_notification_limit: 3,
  participant_chat_message_sound_notification_limit: 10,
  visible_notifications_limit: 5,
});
