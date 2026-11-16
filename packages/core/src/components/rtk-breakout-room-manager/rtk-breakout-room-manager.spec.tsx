import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { RtkBreakoutRoomManager } from './rtk-breakout-room-manager';

interface RoomOptions {
  isParent?: boolean;
  isActive?: boolean;
  canEdit?: boolean;
  expanded?: boolean;
}

async function createRoom({
  isParent = false,
  isActive = true,
  canEdit = true,
  expanded = true,
}: RoomOptions = {}) {
  const participant = {
    id: 'peer-1',
    customParticipantId: 'user-1',
    displayName: 'Alex',
    displayPictureUrl: '',
  };
  const room = {
    id: isParent ? 'parent' : 'room-1',
    title: isParent ? 'Team Standup' : 'Planning',
    isParent,
    participants: [participant],
  };
  const permissions = Object.assign(new EventEmitter(), {
    connectedMeetings: {
      canAlterConnectedMeetings: canEdit,
      canSwitchConnectedMeetings: true,
      canSwitchToParentMeeting: true,
    },
  });
  const meeting = {
    meta: { meetingId: 'parent' },
    self: { userId: 'someone-else', customParticipantId: 'host', permissions },
    participants: { joined: { toArray: () => [] } },
    connectedMeetings: {
      isActive,
      parentMeeting: isParent ? room : { id: 'parent', participants: [] },
      meetings: isParent ? [] : [room],
    },
  };
  const page = await newSpecPage({
    components: [RtkBreakoutRoomManager],
    template: () =>
      h('rtk-breakout-room-manager', { meeting, room, defaultExpanded: expanded, mode: 'edit' }),
  });
  const root = page.root;
  if (root?.shadowRoot == null) throw new Error('Breakout room did not render');
  const shadow = root.shadowRoot;
  const updates = jest.fn();
  root.addEventListener('update', updates);
  const title = () => shadow.querySelector<HTMLElement>('.room-title');
  const input = () => shadow.querySelector<HTMLInputElement>('input');
  const action = () => shadow.querySelector<HTMLElement>('.title-action rtk-icon');
  return { page, root, shadow, room, updates, title, input, action };
}

describe('<rtk-breakout-room-manager>', () => {
  let inputPrototype: object;
  let selectDescriptor: PropertyDescriptor;
  let select: jest.Mock;

  beforeEach(() => {
    inputPrototype = Object.getPrototypeOf(document.createElement('input'));
    selectDescriptor = Object.getOwnPropertyDescriptor(inputPrototype, 'select');
    select = jest.fn();
    // Stencil's mock DOM does not implement input.select().
    Object.defineProperty(inputPrototype, 'select', { configurable: true, value: select });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (selectDescriptor) {
      Object.defineProperty(inputPrototype, 'select', selectDescriptor);
    } else {
      Reflect.deleteProperty(inputPrototype, 'select');
    }
  });

  it.each([false, true])(
    'shows the actual parent title when breakout is active=%s',
    async (isActive) => {
      const { title, shadow, input } = await createRoom({ isParent: true, isActive });
      expect(title().textContent.trim()).toBe('Team Standup');
      expect(title().title).toBe('Team Standup');
      expect(shadow.querySelector('.main-room-indicator').textContent.trim()).toBe('Main Room');
      expect(input()).toBeNull();
    }
  );

  it('does not label a breakout room as the main room', async () => {
    const { title, shadow, input } = await createRoom();
    expect(title().textContent.trim()).toBe('Planning');
    expect(shadow.querySelector('.main-room-indicator').textContent.trim()).toBe('');
    expect(input()).toBeNull();
  });

  it.each([
    [true, true],
    [true, false],
    [false, true],
    [false, false],
  ])('allows title editing for parent=%s and active=%s', async (isParent, isActive) => {
    const { page, action, input, title, room } = await createRoom({ isParent, isActive });
    expect(title().getAttribute('role')).toBe('button');
    action().click();
    await page.waitForChanges();
    expect(input().value).toBe(room.title);
    expect(input().disabled).toBe(false);
    expect(title()).toBeNull();
    expect(select).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('keeps parent=%s read-only without permission', async (isParent) => {
    const { page, title, action, input } = await createRoom({ isParent, canEdit: false });
    expect(title().hasAttribute('role')).toBe(false);
    expect(title().hasAttribute('tabindex')).toBe(false);
    expect(action()).toBeNull();
    title().click();
    title().dispatchEvent(Object.assign(new Event('keydown', { bubbles: true }), { key: 'Enter' }));
    await page.waitForChanges();
    expect(input()).toBeNull();
  });

  it('starts editing by clicking the title, without saving on repeated clicks', async () => {
    const { page, title, input, updates } = await createRoom();
    const label = title();
    expect(label.tabIndex).toBe(0);
    expect(label.getAttribute('aria-label')).toBe('Edit Room Name');
    label.click();
    label.click();
    await page.waitForChanges();
    expect(input().value).toBe('Planning');
    expect(updates).not.toHaveBeenCalled();
  });

  it.each(['Enter', ' '])('starts editing with the %s key', async (key) => {
    const { page, title, input } = await createRoom();
    const event = Object.assign(new Event('keydown', { bubbles: true, cancelable: true }), { key });
    title().dispatchEvent(event);
    await page.waitForChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(input().value).toBe('Planning');
  });

  it('ignores other keys on the title', async () => {
    const { page, title, input } = await createRoom();
    const event = Object.assign(new Event('keydown', { cancelable: true }), { key: 'ArrowRight' });
    title().dispatchEvent(event);
    await page.waitForChanges();
    expect(event.defaultPrevented).toBe(false);
    expect(input()).toBeNull();
  });

  it.each(['icon', 'Enter'])(
    'saves a parent title using %s and restores plain text',
    async (saveWith) => {
      const { page, title, input, action, updates, shadow } = await createRoom({ isParent: true });
      title().click();
      await page.waitForChanges();
      const editor = input();
      const blur = jest.spyOn(editor, 'blur');
      editor.value = 'Renamed Standup';
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      await page.waitForChanges();
      expect(input().value).toBe('Renamed Standup');
      expect(shadow.querySelector('.title-action').getAttribute('label')).toBe('Save Room Name');
      expect(shadow.querySelector('.participant-count').textContent.trim()).toBe('(1)');
      if (saveWith === 'icon') {
        action().click();
      } else {
        editor.dispatchEvent(
          Object.assign(new Event('keypress', { bubbles: true }), { key: 'Enter' })
        );
      }
      await page.waitForChanges();
      expect(updates).toHaveBeenCalledTimes(1);
      expect(updates).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { id: 'parent', title: 'Renamed Standup' } })
      );
      expect(blur).toHaveBeenCalledTimes(1);
      expect(input()).toBeNull();
      expect(title().textContent.trim()).toBe('Renamed Standup');
      expect(shadow.querySelector('.title-action').getAttribute('label')).toBe('Edit Room Name');
    }
  );

  it('can save an unchanged title', async () => {
    const { page, title, input, action, updates } = await createRoom();
    title().click();
    await page.waitForChanges();
    action().click();
    await page.waitForChanges();
    expect(input()).toBeNull();
    expect(updates).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: 'room-1', title: 'Planning' } })
    );
  });

  it.each([true, false])(
    'restores the displayed title when a parent=%s rename is discarded',
    async (isParent) => {
      const { page, root, room, title, input, action } = await createRoom({ isParent });
      title().click();
      await page.waitForChanges();
      input().value = 'Unsaved title';
      input().dispatchEvent(new Event('input', { bubbles: true }));
      action().click();
      await page.waitForChanges();
      expect(title().textContent.trim()).toBe('Unsaved title');

      root.room = { ...room };
      await page.waitForChanges();

      expect(title().textContent.trim()).toBe(room.title);
      expect(title().title).toBe(room.title);
    }
  );

  it('refreshes the displayed title after an external room update', async () => {
    const { page, root, room, title } = await createRoom({ isParent: true });
    root.room = { ...room, title: 'Server title' };
    await page.waitForChanges();
    expect(title().textContent.trim()).toBe('Server title');
    expect(title().title).toBe('Server title');
  });

  it('preserves an in-progress edit when room state changes', async () => {
    const { page, root, room, title, input, action, updates } = await createRoom({
      isParent: true,
    });
    title().click();
    await page.waitForChanges();
    input().value = 'My draft';
    input().dispatchEvent(new Event('input', { bubbles: true }));
    await page.waitForChanges();
    root.room = { ...room, title: 'Server title' };
    await page.waitForChanges();
    expect(input().value).toBe('My draft');
    action().click();
    await page.waitForChanges();
    expect(title().textContent.trim()).toBe('My draft');
    expect(updates).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: 'parent', title: 'My draft' } })
    );
  });

  it.each(['', 'ab'])('rejects the too-short title %j', async (value) => {
    const { page, title, input, action, updates } = await createRoom();
    title().click();
    await page.waitForChanges();
    input().value = value;
    input().dispatchEvent(new Event('input', { bubbles: true }));
    action().click();
    await page.waitForChanges();
    expect(input()).not.toBeNull();
    expect(updates).not.toHaveBeenCalled();
  });

  it('starts expanded and still allows collapsing and expanding', async () => {
    const { page, shadow } = await createRoom();
    const toggle = shadow.querySelector<HTMLElement>('.rooms-container > rtk-icon');
    expect(shadow.querySelector('.participant-list')).not.toBeNull();
    toggle.click();
    await page.waitForChanges();
    expect(shadow.querySelector('.participant-list')).toBeNull();
    toggle.click();
    await page.waitForChanges();
    expect(shadow.querySelector('.participant-list')).not.toBeNull();
  });
});
