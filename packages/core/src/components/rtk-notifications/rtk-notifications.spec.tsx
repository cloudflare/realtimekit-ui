import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { createDefaultConfig } from '../../lib/default-ui-config';
import RTKNotificationsAudio from '../../lib/notification';
import { States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { sendNotification } from '../../utils/notification';
import { RtkNotifications } from './rtk-notifications';

const JOIN_SOUND_URL =
  'https://rtk-assets.realtime.cloudflare.com/ui-kit/sounds/notification_join.mp3';
const MESSAGE_SOUND_URL =
  'https://rtk-assets.realtime.cloudflare.com/ui-kit/sounds/notification_message.mp3';

/**
 * The default config hides some notifications and turns most sounds off.
 * This config turns every notification and every sound on, so that a test can check one key.
 */
function createConfigWithAllOn(): UIConfig {
  const config = createDefaultConfig();
  for (const key of Object.keys(config.config.notifications)) {
    config.config.notifications[key] = true;
    config.config.notification_sounds[key] = true;
  }
  return config;
}

async function createNotifications({
  config = createConfigWithAllOn(),
  participantCount = 1,
  states = undefined as States,
  canAcceptStageRequests = false,
  canAcceptWaitingRequests = false,
}: {
  config?: UIConfig;
  participantCount?: number;
  states?: States;
  canAcceptStageRequests?: boolean;
  canAcceptWaitingRequests?: boolean;
} = {}) {
  const joined = Object.assign(new EventEmitter(), {
    toArray: () => [{ id: 'sharing-peer', name: 'Ada', screenShareEnabled: true }],
  });
  const chat = new EventEmitter();
  const waitlisted = new EventEmitter();
  const acceptWaitingRoomRequest = jest.fn(async () => {});
  const polls = new EventEmitter();
  const selfEvents = new EventEmitter();
  const stage = Object.assign(new EventEmitter(), { grantAccess: jest.fn(async () => {}) });
  const meta = Object.assign(new EventEmitter(), {
    viewType: 'GROUP_CALL',
    socketState: { state: 'connected' },
  });
  const meeting = {
    self: Object.assign(selfEvents, {
      userId: 'self-user',
      videoEnabled: true,
      config: { viewType: 'GROUP_CALL' },
      permissions: {
        acceptWaitingRequests: canAcceptWaitingRequests,
        stageEnabled: canAcceptStageRequests,
        acceptStageRequests: canAcceptStageRequests,
      },
      getCurrentDevices: jest.fn(() => ({})),
    }),
    meta,
    chat,
    polls,
    stage,
    plugins: { active: { toArray: () => [{ id: 'whiteboard-plugin', name: 'Whiteboard' }] } },
    participants: { joined, waitlisted, acceptWaitingRoomRequest, count: participantCount },
  };
  const playSound = jest
    .spyOn(RTKNotificationsAudio.prototype, 'playUrl')
    .mockImplementation(() => {});
  const playSenderSound = jest
    .spyOn(RTKNotificationsAudio.prototype, 'play')
    .mockImplementation(() => {});
  const page = await newSpecPage({
    components: [RtkNotifications],
    template: () => h('rtk-notifications', { config, meeting, states }),
  });
  Object.defineProperty(page.doc, 'visibilityState', { configurable: true, value: 'visible' });

  return {
    page,
    joined,
    waitlisted,
    acceptWaitingRoomRequest,
    chat,
    polls,
    stage,
    meta,
    selfEvents,
    playSound,
    playSenderSound,
  };
}

describe('<rtk-notifications> participant changes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not notify or play a sound when a peer rejoins with a new ID', async () => {
    const { page, joined, playSound } = await createNotifications();

    joined.emit('participantJoined', {
      id: 'new-peer',
      name: 'Ada',
      peerIdBeforeReconnect: 'old-peer',
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('notifies and plays a sound when a new peer joins', async () => {
    const { page, joined, playSound } = await createNotifications();

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'new-peer-joined' }),
    ]);
    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('does not notify or play a sound when an old peer is replaced before leaving', async () => {
    const { page, joined, playSound } = await createNotifications();

    joined.emit('participantLeft', {
      id: 'old-peer',
      name: 'Ada',
      replacedByPeerId: 'new-peer',
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('notifies and plays a sound when a peer leaves normally', async () => {
    const { page, joined, playSound } = await createNotifications();

    joined.emit('participantLeft', { id: 'old-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'old-peer-left' }),
    ]);
    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });
});

describe('<rtk-notifications> tab sync duration', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the plugin switch message for the tab_sync_plugin_switched duration', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_duration.tab_sync_plugin_switched = 1000;
    const { page, meta } = await createNotifications({ config });

    meta.emit('activeTabUpdate', { type: 'plugin', id: 'whiteboard-plugin' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'activeTab', duration: 1000 }),
    ]);
    page.root.remove();
  });

  it('shows the screen share switch message for its own duration', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_duration.tab_sync_screen_share_switched = 1000;
    const { page, meta } = await createNotifications({ config });

    meta.emit('activeTabUpdate', { type: 'screenshare', id: 'sharing-peer' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'spotlight', duration: 1000 }),
    ]);
    page.root.remove();
  });
});

describe('<rtk-notifications> tab sync switches', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('hides only the plugin switch message when tab_sync_plugin_switched is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.tab_sync_plugin_switched = false;
    const { page, meta } = await createNotifications({ config });

    meta.emit('activeTabUpdate', { type: 'plugin', id: 'whiteboard-plugin' });
    meta.emit('activeTabUpdate', { type: 'screenshare', id: 'sharing-peer' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([expect.objectContaining({ id: 'spotlight' })]);
    page.root.remove();
  });

  it('hides only the screen share switch message when its key is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.tab_sync_screen_share_switched = false;
    const { page, meta } = await createNotifications({ config });

    meta.emit('activeTabUpdate', { type: 'plugin', id: 'whiteboard-plugin' });
    meta.emit('activeTabUpdate', { type: 'screenshare', id: 'sharing-peer' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([expect.objectContaining({ id: 'activeTab' })]);
    page.root.remove();
  });

  it('plays no sound for the plugin switch when its sound is off', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sounds.tab_sync_plugin_switched = false;
    const { page, meta, playSound } = await createNotifications({ config });

    meta.emit('activeTabUpdate', { type: 'plugin', id: 'whiteboard-plugin' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([expect.objectContaining({ id: 'activeTab' })]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('plays the sound of the screen share switch from its own URL', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sound_urls.tab_sync_screen_share_switched =
      'https://example.com/sounds/screen.mp3';
    const { page, meta, playSound } = await createNotifications({ config });

    meta.emit('activeTabUpdate', { type: 'screenshare', id: 'sharing-peer' });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith('https://example.com/sounds/screen.mp3');
    page.root.remove();
  });
});

describe('<rtk-notifications> sound limits', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not play the join sound above 3 participants with the default limit', async () => {
    const { page, joined, playSound } = await createNotifications({
      participantCount: 4,
    });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'new-peer-joined' }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('plays the join sound at 3 participants with the default limit', async () => {
    const { page, joined, playSound } = await createNotifications({
      participantCount: 3,
    });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('does not play the chat sound above 10 participants with the default limit', async () => {
    const { page, chat, playSound } = await createNotifications({
      participantCount: 11,
    });

    chat.emit('chatUpdate', {
      action: 'add',
      message: { type: 'text', userId: 'other-user', displayName: 'Ada', message: 'Hello' },
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada: Hello' }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('does not play the edited message sound above 10 participants', async () => {
    const { page, chat, playSound } = await createNotifications({ participantCount: 11 });

    chat.emit('chatUpdate', { action: 'edit', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada edited a message' }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('does not play the deleted message sound above 10 participants', async () => {
    const { page, chat, playSound } = await createNotifications({ participantCount: 11 });

    chat.emit('chatUpdate', { action: 'delete', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada deleted a message' }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('plays the chat sound at 10 participants with the default limit', async () => {
    const { page, chat, playSound } = await createNotifications({
      participantCount: 10,
    });

    chat.emit('chatUpdate', {
      action: 'add',
      message: { type: 'text', userId: 'other-user', displayName: 'Ada', message: 'Hello' },
    });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });
});

const chatMessage = { type: 'text', userId: 'other-user', displayName: 'Ada', message: 'Hello' };

describe('<rtk-notifications> chat messages', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a new message for the chat_new_message duration', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_duration.chat_new_message = 1000;
    const { page, chat } = await createNotifications({ config });

    chat.emit('chatUpdate', { action: 'add', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada: Hello', duration: 1000 }),
    ]);
    page.root.remove();
  });

  it('hides a new message when chat_new_message is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.chat_new_message = false;
    const { page, chat } = await createNotifications({ config });

    chat.emit('chatUpdate', { action: 'add', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('still shows a new message when the edited and deleted keys are false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.chat_message_edited = false;
    config.config.notifications.chat_message_deleted = false;
    const { page, chat } = await createNotifications({ config });

    chat.emit('chatUpdate', { action: 'add', message: chatMessage });
    chat.emit('chatUpdate', { action: 'edit', message: chatMessage });
    chat.emit('chatUpdate', { action: 'delete', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada: Hello' }),
    ]);
    page.root.remove();
  });

  it('shows an edited message and plays the message sound', async () => {
    const { page, chat, playSound } = await createNotifications();

    chat.emit('chatUpdate', { action: 'edit', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada edited a message', duration: 2000 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });

  it('hides an edited message when chat_message_edited is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.chat_message_edited = false;
    const { page, chat } = await createNotifications({ config });

    chat.emit('chatUpdate', { action: 'edit', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('shows a deleted message for the chat_message_deleted duration with a sound', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_duration.chat_message_deleted = 1000;
    const { page, chat, playSound } = await createNotifications({ config });

    chat.emit('chatUpdate', { action: 'delete', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada deleted a message', duration: 1000 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });

  it('hides a deleted message when chat_message_deleted is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.chat_message_deleted = false;
    const { page, chat } = await createNotifications({ config });

    chat.emit('chatUpdate', { action: 'delete', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('does not notify when the local user edits a message', async () => {
    const { page, chat } = await createNotifications();

    chat.emit('chatUpdate', {
      action: 'edit',
      message: { ...chatMessage, userId: 'self-user' },
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });
});

describe('<rtk-notifications> new poll message', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const pollFromAda = { id: 'poll-1', createdBy: 'Ada', createdByUserId: 'other-user' };

  it('shows the new poll message for 2 seconds and plays a sound', async () => {
    const { page, polls, playSound } = await createNotifications();

    polls.emit('pollsUpdate', { polls: [pollFromAda], newPoll: true });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'New poll created by Ada', duration: 2000 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });

  it('hides the new poll message when polls_new_poll is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.polls_new_poll = false;
    const { page, polls } = await createNotifications({ config });

    polls.emit('pollsUpdate', { polls: [pollFromAda], newPoll: true });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('does not play the new poll sound when the polls_new_poll sound is off', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sounds.polls_new_poll = false;
    const { page, polls, playSound } = await createNotifications({ config });

    polls.emit('pollsUpdate', { polls: [pollFromAda], newPoll: true });
    await page.waitForChanges();

    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('does not notify the user who created the poll', async () => {
    const { page, polls, playSound } = await createNotifications();

    polls.emit('pollsUpdate', {
      polls: [{ id: 'poll-1', createdBy: 'Me', createdByUserId: 'self-user' }],
      newPoll: true,
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });
});

describe('<rtk-notifications> maximum count on screen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const peerIds = ['peer-1', 'peer-2', 'peer-3', 'peer-4', 'peer-5', 'peer-6'];

  it('shows at most 5 notifications at one time by default', async () => {
    const { page, joined } = await createNotifications();

    peerIds.forEach((id) => joined.emit('participantJoined', { id, name: 'Ada' }));
    await page.waitForChanges();

    expect(page.rootInstance.notifications.map((notification) => notification.id)).toEqual([
      'peer-1-joined',
      'peer-2-joined',
      'peer-3-joined',
      'peer-4-joined',
      'peer-5-joined',
    ]);
    page.root.remove();
  });

  it('shows at most the number of notifications that visible_notifications_limit sets', async () => {
    const config = createConfigWithAllOn();
    config.config.visible_notifications_limit = 2;
    const { page, joined } = await createNotifications({ config });

    peerIds.forEach((id) => joined.emit('participantJoined', { id, name: 'Ada' }));
    await page.waitForChanges();

    expect(page.rootInstance.notifications.map((notification) => notification.id)).toEqual([
      'peer-1-joined',
      'peer-2-joined',
    ]);
    page.root.remove();
  });

  it('shows every notification when visible_notifications_limit is 0', async () => {
    const config = createConfigWithAllOn();
    config.config.visible_notifications_limit = 0;
    const { page, joined } = await createNotifications({ config });

    peerIds.forEach((id) => joined.emit('participantJoined', { id, name: 'Ada' }));
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toHaveLength(6);
    page.root.remove();
  });
});

describe('<rtk-notifications> config handling', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not carry the config of one instance over to the next instance', async () => {
    const configWithoutJoinMessage = createConfigWithAllOn();
    configWithoutJoinMessage.config.notifications.participant_joined = false;
    const first = await createNotifications({ config: configWithoutJoinMessage });
    first.page.root.remove();
    const { page, joined } = await createNotifications();

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'new-peer-joined' }),
    ]);
    page.root.remove();
  });

  it('applies a config that is set after the component is connected', async () => {
    const { page, joined } = await createNotifications();
    const configWithoutJoinMessage = createConfigWithAllOn();
    configWithoutJoinMessage.config.notifications.participant_joined = false;

    page.root.config = configWithoutJoinMessage;
    await page.waitForChanges();
    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('keeps notification sounds muted when the config changes', async () => {
    const { page, joined, playSound } = await createNotifications({
      states: { prefs: { muteNotificationSounds: true } },
    });

    page.root.config = createConfigWithAllOn();
    await page.waitForChanges();
    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'new-peer-joined' }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('plays sounds again when notification sounds are unmuted', async () => {
    const { page, joined, playSound } = await createNotifications({
      states: { prefs: { muteNotificationSounds: true } },
    });

    page.root.states = { prefs: { muteNotificationSounds: false } };
    await page.waitForChanges();
    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('uses the default notification settings when the UI config has none', async () => {
    const { page, joined, playSound } = await createNotifications({ config: {} });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'new-peer-joined', duration: 2100 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('does not change the config object when notification sounds are muted', async () => {
    const config = createConfigWithAllOn();
    const { page } = await createNotifications({
      config,
      states: { prefs: { muteNotificationSounds: true } },
    });

    expect(config.config.notification_sounds.participant_joined).toBe(true);
    page.root.remove();
  });
});

describe('<rtk-notifications> stage messages', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the requested to join stage message and plays a sound', async () => {
    const { page, joined, playSound } = await createNotifications();

    joined.emit('stageStatusUpdate', {
      id: 'requesting-peer',
      userId: 'requesting-user',
      name: 'Ada',
      stageStatus: 'REQUESTED_TO_JOIN_STAGE',
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'stage-request-requesting-peer', duration: 2000 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('grants stage access and removes the message when Accept is clicked', async () => {
    const { page, joined, stage } = await createNotifications();
    joined.emit('stageStatusUpdate', {
      id: 'requesting-peer',
      userId: 'requesting-user',
      name: 'Ada',
      stageStatus: 'REQUESTED_TO_JOIN_STAGE',
    });
    await page.waitForChanges();

    await page.rootInstance.notifications[0].button.onClick();
    await page.waitForChanges();

    expect(stage.grantAccess).toHaveBeenCalledWith(['requesting-user']);
    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('hides the requested to join stage message when stage_requested_to_join is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.stage_requested_to_join = false;
    const { page, joined } = await createNotifications({ config });

    joined.emit('stageStatusUpdate', {
      id: 'requesting-peer',
      userId: 'requesting-user',
      name: 'Ada',
      stageStatus: 'REQUESTED_TO_JOIN_STAGE',
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('shows the joined stage message for the stage_joined duration', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_duration.stage_joined = 1000;
    const { page, joined, playSound } = await createNotifications({ config });

    joined.emit('stageStatusUpdate', {
      id: 'stage-peer',
      userId: 'stage-user',
      name: 'Ada',
      stageStatus: 'ON_STAGE',
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'stage-joined-stage-peer', duration: 1000 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('hides the joined stage message when stage_joined is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.stage_joined = false;
    const { page, joined } = await createNotifications({ config });

    joined.emit('stageStatusUpdate', {
      id: 'stage-peer',
      userId: 'stage-user',
      name: 'Ada',
      stageStatus: 'ON_STAGE',
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('does not play the joined stage sound when the stage_joined sound is off', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sounds.stage_joined = false;
    const { page, joined, playSound } = await createNotifications({ config });

    joined.emit('stageStatusUpdate', {
      id: 'stage-peer',
      userId: 'stage-user',
      name: 'Ada',
      stageStatus: 'ON_STAGE',
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'stage-joined-stage-peer' }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('plays the requested to join stage sound when only the stage_joined sound is off', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sounds.stage_joined = false;
    const { page, joined, playSound } = await createNotifications({ config });

    joined.emit('stageStatusUpdate', {
      id: 'requesting-peer',
      userId: 'requesting-user',
      name: 'Ada',
      stageStatus: 'REQUESTED_TO_JOIN_STAGE',
    });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('stops showing stage messages after the component is removed', async () => {
    const { page, joined } = await createNotifications();

    page.root.remove();
    await page.waitForChanges();

    expect(joined.listenerCount('stageStatusUpdate')).toBe(0);
  });

  it('shows the request accepted message for 3 seconds by default', async () => {
    const { page, stage } = await createNotifications();

    stage.emit('stageRequestApproved');
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'stage-request-accepted', duration: 3000 }),
    ]);
    page.root.remove();
  });

  it('hides the request accepted message when stage_request_accepted is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.stage_request_accepted = false;
    const { page, stage } = await createNotifications({ config });

    stage.emit('stageRequestApproved');
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('shows the request rejected message for the stage_request_rejected duration', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_duration.stage_request_rejected = 1000;
    const { page, stage } = await createNotifications({ config });

    stage.emit('stageRequestRejected');
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'stage-request-rejected', duration: 1000 }),
    ]);
    page.root.remove();
  });

  it('hides the request rejected message when stage_request_rejected is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.stage_request_rejected = false;
    const { page, stage } = await createNotifications({ config });

    stage.emit('stageRequestRejected');
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('shows the new stage request message for 3 seconds by default', async () => {
    const { page, stage } = await createNotifications({ canAcceptStageRequests: true });

    stage.emit('newStageRequest', { count: 2 });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({
        id: 'new-stage-request',
        message: 'You have 2 pending requests',
        duration: 3000,
      }),
    ]);
    page.root.remove();
  });

  it('hides the new stage request message when stage_new_request_received is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.stage_new_request_received = false;
    const { page, stage } = await createNotifications({ config, canAcceptStageRequests: true });

    stage.emit('newStageRequest', { count: 2 });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });
});

describe('<rtk-notifications> sound settings', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('plays the audio file URL that the config sets for a notification', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sound_urls.participant_joined =
      'https://example.com/sounds/join.wav';
    const { page, joined, playSound } = await createNotifications({ config });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith('https://example.com/sounds/join.wav');
    page.root.remove();
  });

  it('plays the default sound when the configured URL is a script URL', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sound_urls.participant_joined = 'javascript:alert(1)';
    const { page, joined, playSound } = await createNotifications({ config });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('plays the default sound when the configured URL is not an audio file', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sound_urls.participant_joined = 'https://example.com/sounds/join.js';
    const { page, joined, playSound } = await createNotifications({ config });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('shows the notification without a sound when its sound is off', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sounds.participant_joined = false;
    const { page, joined, playSound } = await createNotifications({ config });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'new-peer-joined' }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('plays the sound without the notification when the notification is hidden', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.participant_joined = false;
    const { page, joined, playSound } = await createNotifications({ config });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('does not play the new message sound when the chat_new_message sound is off', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sounds.chat_new_message = false;
    const { page, chat, playSound } = await createNotifications({ config });

    chat.emit('chatUpdate', { action: 'add', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada: Hello' }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('plays the edited message sound when only the chat_new_message sound is off', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sounds.chat_new_message = false;
    const { page, chat, playSound } = await createNotifications({ config });

    chat.emit('chatUpdate', { action: 'edit', message: chatMessage });
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });
});

describe('<rtk-notifications> device, network and error messages', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const camera = { kind: 'videoinput', deviceId: 'camera-1', label: 'Front camera' };

  it('shows the camera switched message for 5 seconds and plays a sound', async () => {
    const { page, selfEvents, playSound } = await createNotifications();

    selfEvents.emit('deviceUpdate', { device: camera, preview: false });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'camera-switched', duration: 5000 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });

  it('hides the camera switched message when camera_switched is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.camera_switched = false;
    const { page, selfEvents } = await createNotifications({ config });

    selfEvents.emit('deviceUpdate', { device: camera, preview: false });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('keeps the reconnecting message on screen and plays a sound', async () => {
    const { page, meta, playSound } = await createNotifications();

    meta.emit('socketConnectionUpdate', { state: 'disconnected' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'socket', duration: undefined }),
    ]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });

  it('closes the reconnecting message after the duration that the config sets', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_duration.network_reconnecting = 1000;
    const { page, meta } = await createNotifications({ config });

    meta.emit('socketConnectionUpdate', { state: 'disconnected' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'socket', duration: 1000 }),
    ]);
    page.root.remove();
  });

  it('hides the reconnecting message when network_reconnecting is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.network_reconnecting = false;
    const { page, meta } = await createNotifications({ config });

    meta.emit('socketConnectionUpdate', { state: 'disconnected' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('shows the network restored message for 3 seconds after a reconnect', async () => {
    const { page, meta } = await createNotifications();

    meta.emit('socketConnectionUpdate', { state: 'connected', reconnected: true });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'socket', duration: 3000 }),
    ]);
    page.root.remove();
  });

  it('shows an API error for 2 seconds by default', async () => {
    const { page } = await createNotifications();
    const error = new CustomEvent('rtkApiError', {
      detail: { trace: 'recording-error', message: 'Could not start recording' },
    });

    page.win.dispatchEvent(error);
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'recording-error', duration: 2000 }),
    ]);
    page.root.remove();
  });

  it('hides an API error when api_error is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.api_error = false;
    const { page } = await createNotifications({ config });

    page.win.dispatchEvent(
      new CustomEvent('rtkApiError', {
        detail: { trace: 'recording-error', message: 'Could not start recording' },
      })
    );
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });
});

describe('<rtk-notifications> stage invite message', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const stageInvite = {
    trace: 'join-stage-invite-invited-peer',
    message: 'Ada has been invited to join stage.',
  };

  it('shows the stage invite message for 2 seconds and plays a sound', async () => {
    const { page, playSound } = await createNotifications();

    page.win.dispatchEvent(new CustomEvent('rtkSendNotification', { detail: stageInvite }));
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({
        id: 'join-stage-invite-invited-peer',
        message: 'Ada has been invited to join stage.',
        duration: 2000,
      }),
    ]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });

  it('hides the stage invite message when stage_invite_sent is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.stage_invite_sent = false;
    const { page } = await createNotifications({ config });

    page.win.dispatchEvent(new CustomEvent('rtkSendNotification', { detail: stageInvite }));
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('still shows the stage invite message when custom is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.custom = false;
    const { page } = await createNotifications({ config });

    page.win.dispatchEvent(new CustomEvent('rtkSendNotification', { detail: stageInvite }));
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'join-stage-invite-invited-peer' }),
    ]);
    page.root.remove();
  });
});

describe('<rtk-notifications> custom notifications', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const customNotification = { id: 'hand-raised', message: 'Ada raised a hand', duration: 4000 };

  it('shows a notification from sendNotification and plays the sound of the sender', async () => {
    const { page, playSenderSound } = await createNotifications();

    sendNotification(customNotification, 'joined');
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'hand-raised', duration: 4000 }),
    ]);
    expect(playSenderSound).toHaveBeenCalledWith('joined');
    page.root.remove();
  });

  it('plays the configured URL instead of the sound of the sender', async () => {
    const config = createConfigWithAllOn();
    config.config.notification_sound_urls.custom = 'https://example.com/sounds/custom.ogg';
    const { page, playSound, playSenderSound } = await createNotifications({ config });

    sendNotification(customNotification, 'joined');
    await page.waitForChanges();

    expect(playSound).toHaveBeenCalledWith('https://example.com/sounds/custom.ogg');
    expect(playSenderSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('hides a notification from sendNotification when custom is false', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.custom = false;
    config.config.notification_sounds.custom = false;
    const { page, playSenderSound } = await createNotifications({ config });

    sendNotification(customNotification, 'joined');
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSenderSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('shows a notification from the rtkSendNotification event without a sound', async () => {
    const { page, playSound, playSenderSound } = await createNotifications();

    page.win.dispatchEvent(
      new CustomEvent('rtkSendNotification', {
        detail: { trace: 'seat-change', message: 'Ada moved to the front row' },
      })
    );
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'seat-change', duration: 2000 }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    expect(playSenderSound).not.toHaveBeenCalled();
    page.root.remove();
  });
});

describe('<rtk-notifications> with the default config', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a joining participant and plays the join sound', async () => {
    const { page, joined, playSound } = await createNotifications({
      config: createDefaultConfig(),
    });

    joined.emit('participantJoined', { id: 'new-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'new-peer-joined', duration: 2100 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(JOIN_SOUND_URL);
    page.root.remove();
  });

  it('shows a leaving participant without a sound', async () => {
    const { page, joined, playSound } = await createNotifications({
      config: createDefaultConfig(),
    });

    joined.emit('participantLeft', { id: 'old-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'old-peer-left', duration: 2100 }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('shows a new chat message with a sound, and hides edited and deleted messages', async () => {
    const { page, chat, playSound } = await createNotifications({
      config: createDefaultConfig(),
    });

    chat.emit('chatUpdate', { action: 'edit', message: chatMessage });
    chat.emit('chatUpdate', { action: 'delete', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).not.toHaveBeenCalled();

    chat.emit('chatUpdate', { action: 'add', message: chatMessage });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ message: 'Ada: Hello', duration: 2000 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });

  it('hides the stage request and stage joined messages and plays no sound', async () => {
    const { page, joined, playSound } = await createNotifications({
      config: createDefaultConfig(),
    });

    joined.emit('stageStatusUpdate', {
      id: 'requesting-peer',
      userId: 'requesting-user',
      name: 'Ada',
      stageStatus: 'REQUESTED_TO_JOIN_STAGE',
    });
    joined.emit('stageStatusUpdate', {
      id: 'stage-peer',
      userId: 'stage-user',
      name: 'Ada',
      stageStatus: 'ON_STAGE',
    });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('shows the plugin switch message for 2100 ms without a sound', async () => {
    const { page, meta, playSound } = await createNotifications({
      config: createDefaultConfig(),
    });

    meta.emit('activeTabUpdate', { type: 'plugin', id: 'whiteboard-plugin' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'activeTab', duration: 2100 }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('shows the camera switched and reconnecting messages without a sound', async () => {
    const { page, selfEvents, meta, playSound } = await createNotifications({
      config: createDefaultConfig(),
    });

    selfEvents.emit('deviceUpdate', {
      device: { kind: 'videoinput', deviceId: 'camera-1', label: 'Front camera' },
      preview: false,
    });
    meta.emit('socketConnectionUpdate', { state: 'disconnected' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'camera-switched', duration: 5000 }),
      expect.objectContaining({ id: 'socket', duration: undefined }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('shows the stage invite message without a sound', async () => {
    const { page, playSound } = await createNotifications({ config: createDefaultConfig() });

    page.win.dispatchEvent(
      new CustomEvent('rtkSendNotification', {
        detail: {
          trace: 'join-stage-invite-invited-peer',
          message: 'Ada has been invited to join stage.',
        },
      })
    );
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'join-stage-invite-invited-peer', duration: 2000 }),
    ]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });
});

describe('<rtk-notifications> waiting room requests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const waitingParticipant = { id: 'waiting-peer', name: 'Ada' };

  it('shows the request for 4 seconds with a sound and accepts it from the button', async () => {
    const { page, waitlisted, acceptWaitingRoomRequest, playSound } = await createNotifications({
      canAcceptWaitingRequests: true,
    });

    waitlisted.emit('participantJoined', waitingParticipant);
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'waiting-peer-joined-waitlist', duration: 4000 }),
    ]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);

    await page.rootInstance.notifications[0].button.onClick();
    await page.waitForChanges();

    expect(acceptWaitingRoomRequest).toHaveBeenCalledWith('waiting-peer');
    expect(page.rootInstance.notifications).toEqual([]);
    page.root.remove();
  });

  it('plays the sound without the request when the request is hidden', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.participant_joined_waitlist = false;
    const { page, waitlisted, playSound } = await createNotifications({
      config,
      canAcceptWaitingRequests: true,
    });

    waitlisted.emit('participantJoined', waitingParticipant);
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).toHaveBeenCalledWith(MESSAGE_SOUND_URL);
    page.root.remove();
  });

  it('shows the request when a later config turns it on', async () => {
    const config = createConfigWithAllOn();
    config.config.notifications.participant_joined_waitlist = false;
    const { page, waitlisted } = await createNotifications({
      config,
      canAcceptWaitingRequests: true,
    });

    page.root.config = createConfigWithAllOn();
    await page.waitForChanges();
    waitlisted.emit('participantJoined', waitingParticipant);
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'waiting-peer-joined-waitlist' }),
    ]);
    page.root.remove();
  });

  it('does not show the request to a user who cannot accept waiting room requests', async () => {
    const { page, waitlisted, playSound } = await createNotifications();

    waitlisted.emit('participantJoined', waitingParticipant);
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });
});

describe('<rtk-notifications> listeners and replaced notifications', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('removes its listeners from a meeting when the meeting prop is cleared', async () => {
    const { page, waitlisted, meta, joined } = await createNotifications({
      canAcceptWaitingRequests: true,
    });

    page.root.meeting = undefined;
    await page.waitForChanges();

    expect(waitlisted.listenerCount('participantJoined')).toBe(0);
    expect(waitlisted.listenerCount('participantLeft')).toBe(0);
    expect(meta.listenerCount('activeTabUpdate')).toBe(0);
    expect(joined.listenerCount('stageStatusUpdate')).toBe(0);
  });

  it('shows one plugin switch message when the plugin switches twice', async () => {
    const { page, meta } = await createNotifications();

    meta.emit('activeTabUpdate', { type: 'plugin', id: 'whiteboard-plugin' });
    meta.emit('activeTabUpdate', { type: 'plugin', id: 'whiteboard-plugin' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([expect.objectContaining({ id: 'activeTab' })]);
    page.root.remove();
  });

  it('shows the network failed message when the visible limit is reached', async () => {
    const config = createConfigWithAllOn();
    config.config.visible_notifications_limit = 1;
    const { page, joined, meta } = await createNotifications({ config });

    joined.emit('participantJoined', { id: 'peer-1', name: 'Ada' });
    joined.emit('participantJoined', { id: 'peer-2', name: 'Grace' });
    meta.emit('socketConnectionUpdate', { state: 'failed' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications.map((notification) => notification.id)).toEqual([
      'peer-1-joined',
      'socket',
    ]);
    page.root.remove();
  });

  it('shows the could not reconnect message when the visible limit is reached', async () => {
    const config = createConfigWithAllOn();
    config.config.visible_notifications_limit = 1;
    const { page, joined, meta } = await createNotifications({ config });

    joined.emit('participantJoined', { id: 'peer-1', name: 'Ada' });
    meta.emit('socketConnectionUpdate', { state: 'reconnecting', reconnectionAttempt: 6 });
    await page.waitForChanges();

    expect(page.rootInstance.notifications.map((notification) => notification.id)).toEqual([
      'peer-1-joined',
      'socket',
    ]);
    page.root.remove();
  });

  it('does not show the reconnecting message when the visible limit is reached', async () => {
    const config = createConfigWithAllOn();
    config.config.visible_notifications_limit = 1;
    const { page, joined, meta } = await createNotifications({ config });

    joined.emit('participantJoined', { id: 'peer-1', name: 'Ada' });
    meta.emit('socketConnectionUpdate', { state: 'disconnected' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications.map((notification) => notification.id)).toEqual([
      'peer-1-joined',
    ]);
    page.root.remove();
  });

  it('does not show or play anything for a leaving participant while disconnected', async () => {
    const { page, joined, meta, playSound } = await createNotifications();
    meta.socketState = { state: 'disconnected' };

    joined.emit('participantLeft', { id: 'old-peer', name: 'Ada' });
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([]);
    expect(playSound).not.toHaveBeenCalled();
    page.root.remove();
  });

  it('shows a notification from sendNotification before the meeting is set', async () => {
    const page = await newSpecPage({
      components: [RtkNotifications],
      template: () => h('rtk-notifications', { config: createConfigWithAllOn() }),
    });
    Object.defineProperty(page.doc, 'visibilityState', { configurable: true, value: 'visible' });

    expect(() =>
      sendNotification({ id: 'hand-raised', message: 'Ada raised a hand' }, 'joined')
    ).not.toThrow();
    await page.waitForChanges();

    expect(page.rootInstance.notifications).toEqual([
      expect.objectContaining({ id: 'hand-raised' }),
    ]);
    page.root.remove();
  });
});
