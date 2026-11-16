import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { RtkBreakoutRoomManager } from '../rtk-breakout-room-manager/rtk-breakout-room-manager';
import { RtkButton } from '../rtk-button/rtk-button';
import { RtkBreakoutRoomsManager } from './rtk-breakout-rooms-manager';

interface ManagerOptions {
  canEdit?: boolean;
  isActive?: boolean;
  roomCount?: number;
  unassigned?: number;
}

async function createManager({
  canEdit = true,
  isActive = true,
  roomCount = 3,
  unassigned = 3,
}: ManagerOptions = {}) {
  const participant = (id: string) => ({
    id,
    customParticipantId: id,
    displayName: id,
    displayPictureUrl: '',
  });
  const state = {
    parentMeeting: {
      id: 'parent',
      title: 'Team Standup',
      participants: Array.from({ length: unassigned }, (_, i) => participant(`unassigned-${i}`)),
    },
    meetings: Array.from({ length: roomCount }, (_, i) => ({
      id: `room-${i}`,
      title: `Room ${i + 1}`,
      participants: [participant(`assigned-${i}`)],
    })),
  };
  const connectedMeetings = Object.assign(new EventEmitter(), {
    ...state,
    isActive,
    getConnectedMeetings: jest.fn(() => {
      connectedMeetings.emit('stateUpdate', state);
      return Promise.resolve();
    }),
    createMeetings: jest.fn(() => Promise.resolve([])),
    updateMeetings: jest.fn(() => Promise.resolve()),
    deleteMeetings: jest.fn(),
    moveParticipants: jest.fn(),
  });
  const permissions = Object.assign(new EventEmitter(), {
    connectedMeetings: {
      canAlterConnectedMeetings: canEdit,
      canSwitchConnectedMeetings: true,
      canSwitchToParentMeeting: true,
    },
  });
  const meeting = {
    meta: { meetingId: 'parent' },
    self: { userId: 'host', customParticipantId: 'host', permissions },
    participants: { joined: { toArray: () => [] } },
    connectedMeetings,
  };
  const page = await newSpecPage({
    components: [RtkBreakoutRoomsManager, RtkBreakoutRoomManager, RtkButton],
    template: () => h('rtk-breakout-rooms-manager', { meeting, states: {} }),
  });
  await page.waitForChanges();
  const instance: RtkBreakoutRoomsManager = page.rootInstance;
  if (!isActive) {
    instance.roomConfig = { ...instance.roomConfig, step: 'participants-config' };
    await page.waitForChanges();
  }
  const root = page.root;
  if (root?.shadowRoot == null) throw new Error('Breakout rooms manager did not render');
  const shadow = root.shadowRoot;
  const cards = () =>
    Array.from(
      shadow.querySelectorAll<HTMLRtkBreakoutRoomManagerElement>('rtk-breakout-room-manager')
    );
  const shuffle = () => shadow.querySelector<HTMLRtkButtonElement>('.shuffle-button');
  return { page, root, shadow, instance, state, connectedMeetings, cards, shuffle };
}

describe('<rtk-breakout-rooms-manager>', () => {
  it.each([true, false])('expands every room in the canEdit=%s view', async (canEdit) => {
    const { cards } = await createManager({ canEdit });
    const breakoutRooms = cards().filter((card) => !card.room.isParent);
    expect(breakoutRooms).toHaveLength(3);
    for (const room of breakoutRooms) {
      expect(room.defaultExpanded).toBe(true);
      expect(room.shadowRoot.querySelector('.participant-list')).not.toBeNull();
    }
  });

  it('expands rooms in create mode too', async () => {
    const { cards, instance } = await createManager({ isActive: false });
    expect(instance.roomConfig.mode).toBe('create');
    expect(cards()).toHaveLength(3);
    expect(cards().every((room) => room.shadowRoot.querySelector('.participant-list'))).toBe(true);
  });

  it.each([true, false])(
    'enables shuffle with available rooms in active=%s mode',
    async (isActive) => {
      const { shuffle } = await createManager({ isActive });
      expect(shuffle().disabled).toBe(false);
      expect(shuffle().shadowRoot.querySelector('button').hasAttribute('disabled')).toBe(false);
    }
  );

  it.each([
    [0, 3],
    [3, 0],
    [0, 0],
  ])(
    'disables shuffle with %s rooms and %s unassigned participants',
    async (roomCount, unassigned) => {
      const { shuffle } = await createManager({ roomCount, unassigned });
      expect(shuffle().disabled).toBe(true);
      expect(shuffle().shadowRoot.querySelector('button').hasAttribute('disabled')).toBe(true);
    }
  );

  it('shuffles unassigned participants during an active breakout without moving assigned peers', async () => {
    const { page, shuffle, cards, instance, state } = await createManager();
    shuffle().shadowRoot.querySelector('button').click();
    await page.waitForChanges();
    expect(instance.draftState.parentMeeting.participants).toEqual([]);
    const rooms = cards().filter((room) => !room.room.isParent);
    expect(rooms).toHaveLength(3);
    for (const [index, room] of rooms.entries()) {
      expect(room.room.participants.map((peer) => peer.id)).toEqual([
        state.meetings[index].participants[0].id,
        state.parentMeeting.participants[index].id,
      ]);
    }
    expect(shuffle().disabled).toBe(true);
  });

  it('keeps shuffle disabled when no destination rooms exist', async () => {
    const { shuffle, instance, state } = await createManager({ roomCount: 0 });
    shuffle().shadowRoot.querySelector('button').click();
    expect(instance.draftState.parentMeeting.participants).toEqual(
      state.parentMeeting.participants
    );
    expect(instance.draftState.meetings).toEqual([]);
  });

  it('passes parent renames through to the SDK update payload', async () => {
    const { page, cards, shadow, connectedMeetings } = await createManager();
    const parent = cards().find((room) => room.room.isParent);
    parent.dispatchEvent(
      new CustomEvent('update', {
        detail: { id: 'parent', title: 'Renamed Standup' },
        bubbles: true,
        composed: true,
      })
    );
    await page.waitForChanges();
    expect(parent.shadowRoot.querySelector('.room-title').textContent.trim()).toBe(
      'Renamed Standup'
    );
    const apply = shadow.querySelector<HTMLRtkButtonElement>('.update-breakout-button');
    expect(apply).not.toBeNull();
    apply.shadowRoot.querySelector('button').click();
    await page.waitForChanges();
    expect(connectedMeetings.updateMeetings).toHaveBeenCalledTimes(1);
    expect(connectedMeetings.updateMeetings).toHaveBeenCalledWith([
      { id: 'parent', title: 'Renamed Standup' },
    ]);
    expect(connectedMeetings.createMeetings).not.toHaveBeenCalled();
    expect(connectedMeetings.moveParticipants).not.toHaveBeenCalled();
  });

  it('restores the parent title in the UI after discarding changes', async () => {
    const { page, cards, shadow, connectedMeetings } = await createManager();
    const parent = cards().find((room) => room.room.isParent);
    parent.dispatchEvent(
      new CustomEvent('update', {
        detail: { id: 'parent', title: 'Unsaved Standup' },
        bubbles: true,
        composed: true,
      })
    );
    await page.waitForChanges();
    expect(parent.shadowRoot.querySelector('.room-title').textContent.trim()).toBe(
      'Unsaved Standup'
    );

    const discard = shadow.querySelector<HTMLRtkButtonElement>('rtk-button.color-danger');
    discard.shadowRoot.querySelector('button').click();
    await page.waitForChanges();

    expect(parent.shadowRoot.querySelector('.room-title').textContent.trim()).toBe('Team Standup');
    expect(connectedMeetings.updateMeetings).not.toHaveBeenCalled();
    expect(shadow.querySelector('.update-breakout-button')).toBeNull();
  });
});
