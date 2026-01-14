import RealtimeKitClient from '@cloudflare/realtimekit';

export const FlagsmithFeatureFlags = {
  PLAY_PARTICIPANT_TILE_VIDEO_ON_PAUSE: 'play_participant_tile_video_on_pause',
  FEAT_PAGINATED_CHAT: 'feat_paginated_chat',
  LOG_PLAYING_FAILURES: 'log_playing_failures',
  FEAT_CHANNEL_CHAT: 'feat_channel_chat',
  DISABLE_KICKING: 'disable_kicking',
  ADMIN_CANTREMOVE_ADMIN: 'admin_cantremove_admin',
  CANTINVITE_VIEWER: 'cantinvite_viewer',
  PINNED_MESSAGES: 'pinned_msgs',
};

export const isBreakoutRoomsEnabled = (meeting: RealtimeKitClient) =>
  meeting.connectedMeetings.supportsConnectedMeetings;

export const usePaginatedChat = () => true;

export const disableSettingSinkId = (meeting: RealtimeKitClient) =>
  meeting?.__internals__?.browserSpecs.isFirefox() &&
  meeting?.__internals__?.features.hasFeature('disable_firefox_setting_sink_id');
