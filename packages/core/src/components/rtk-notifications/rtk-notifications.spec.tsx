import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { createDefaultConfig } from '../../lib/default-ui-config';
import RTKNotificationsAudio from '../../lib/notification';
import { RtkNotifications } from './rtk-notifications';

async function createNotifications() {
  const joined = new EventEmitter();
  const config = createDefaultConfig();
  config.config.notification_sounds.participant_left = true;
  const meeting = {
    self: Object.assign(new EventEmitter(), {
      config: { viewType: 'GROUP_CALL' },
      permissions: { acceptWaitingRequests: false, stageEnabled: false },
      getCurrentDevices: jest.fn(() => ({})),
    }),
    meta: Object.assign(new EventEmitter(), {
      viewType: 'GROUP_CALL',
      socketState: { state: 'connected' },
    }),
    participants: { joined, waitlisted: new EventEmitter(), count: 1 },
  };
  const playSound = jest
    .spyOn(RTKNotificationsAudio.prototype, 'play')
    .mockImplementation(() => {});
  const page = await newSpecPage({
    components: [RtkNotifications],
    template: () => h('rtk-notifications', { config, meeting }),
  });
  Object.defineProperty(page.doc, 'visibilityState', { configurable: true, value: 'visible' });

  return { page, joined, playSound };
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
    expect(playSound).toHaveBeenCalledWith('joined');
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
    expect(playSound).toHaveBeenCalledWith('left');
    page.root.remove();
  });
});
