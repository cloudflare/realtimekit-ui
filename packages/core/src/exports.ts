// utilities
import BreakoutRoomsManager from './utils/breakout-rooms-manager';
export { BreakoutRoomsManager };
export { provideRtkDesignSystem } from './utils/provide-design-system';
export { extendConfig, generateConfig } from './utils/config';
export { sendNotification } from './utils/notification';
export { RtkUiBuilder } from './lib/builder';
export {
  uiStore,
  uiState,
  getInitialStates,
  createPeerStore,
} from './utils/sync-with-store/ui-store';

// addons
export { registerAddons, Addon } from './lib/addons';

// types
export { UIConfig } from './types/ui-config';
export {
  States,
  Notification,
  Size,
  UserPreferences,
  PollObject,
  PartialStateEvent,
} from './types/props';
export { Peer } from './types/rtk-client';

// UIConfig, Icon Pack, i18n and Notification Sounds
export { defaultConfig, createDefaultConfig } from './lib/default-ui-config';
export { IconPack, defaultIconPack } from './lib/icons';
export { type Overrides, defaultOverrides } from './lib/overrides';
export { LangDict, defaultLanguage, RtkI18n, useLanguage } from './lib/lang';
export { Sound, default as RtkNotificationsAudio } from './lib/notification';

export {
  generateChatGroupKey,
  getChatGroups,
  getUnreadChatCounts,
  getParticipantUserId,
} from './utils/chat';

// NOTE(vaibhavshn): fixes angular output type errors
export type { RtkNewMessageEvent } from './components/rtk-chat-composer-ui/rtk-chat-composer-ui';
export type { NewMessageEvent } from './components/rtk-chat-composer-view/rtk-chat-composer-view';
export type { ChatGroupChangedType } from './components/rtk-chat-selector-ui/rtk-chat-selector-ui';
export type { Tab } from './components/rtk-tab-bar/rtk-tab-bar';
