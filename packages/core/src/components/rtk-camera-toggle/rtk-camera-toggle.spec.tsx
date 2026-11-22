import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { defaultIconPack } from '../../lib/icons';
import gracefulStorage from '../../utils/graceful-storage';
import { getPreference } from '../../utils/user-prefs';
import { RtkControlbarButton } from '../rtk-controlbar-button/rtk-controlbar-button';
import { RtkIcon } from '../rtk-icon/rtk-icon';
import { RtkMenu } from '../rtk-menu/rtk-menu';
import { RtkSwitch } from '../rtk-switch/rtk-switch';
import { RtkCameraToggle } from './rtk-camera-toggle';

const device = (kind: MediaDeviceKind, deviceId: string, label: string) =>
  ({ kind, deviceId, label, groupId: '' } as MediaDeviceInfo);

async function createToggle({
  devices = [],
  selected,
  hideDeviceSelectionMenu = false,
  mirrorVideo = false,
}: {
  devices?: MediaDeviceInfo[];
  selected?: MediaDeviceInfo;
  hideDeviceSelectionMenu?: boolean;
  mirrorVideo?: boolean;
} = {}) {
  let currentDevice = selected;
  const self = Object.assign(new EventEmitter(), {
    videoEnabled: true,
    mediaPermissions: { video: 'ACCEPTED' },
    permissions: Object.assign(new EventEmitter(), { canProduceVideo: 'ALLOWED' }),
    getVideoDevices: jest.fn(async () => devices),
    getCurrentDevices: jest.fn(() => ({ video: currentDevice })),
    setDevice: jest.fn(async (next: MediaDeviceInfo) => {
      currentDevice = next;
    }),
    enableVideo: jest.fn(),
    disableVideo: jest.fn(),
  });
  const meeting = {
    self,
    stage: Object.assign(new EventEmitter(), { status: 'ON_STAGE' }),
    meta: { viewType: 'GROUP_CALL' },
    __internals__: { logger: { info: jest.fn(), warn: jest.fn() } },
  };
  const page = await newSpecPage({
    components: [RtkCameraToggle, RtkControlbarButton, RtkIcon, RtkMenu, RtkSwitch],
    template: () =>
      h('rtk-camera-toggle', {
        meeting,
        hideDeviceSelectionMenu,
        states: { prefs: { mirrorVideo } },
      }),
  });
  await page.waitForChanges();
  return { page, self };
}

describe('<rtk-camera-toggle> device menu', () => {
  beforeEach(() => {
    gracefulStorage.removeItem('rtk-prefs');
  });

  afterEach(() => {
    gracefulStorage.removeItem('rtk-prefs');
  });

  it('lists only cameras with IDs, checks the selected one, and switches cameras', async () => {
    const first = device('videoinput', 'first', 'Front camera');
    const second = device('videoinput', 'second', 'External camera');
    const { page, self } = await createToggle({
      devices: [
        first,
        device('videoinput', '', 'Unavailable'),
        device('audioinput', 'mic', 'Mic'),
        second,
      ],
      selected: first,
    });
    const root = page.root.shadowRoot;
    const items = Array.from(root.querySelectorAll('rtk-menu-item[role=menuitemradio]'));

    expect(items.map((item) => item.textContent.trim())).toEqual([
      'Front camera',
      'External camera',
    ]);
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false']);
    expect(items[0].querySelector('rtk-icon[slot=end]')).not.toBeNull();
    expect(items[1].querySelector('rtk-icon[slot=end]')).toBeNull();

    (items[1] as HTMLElement).click();
    await self.setDevice.mock.results[0].value;
    await page.waitForChanges();

    expect(self.setDevice).toHaveBeenCalledWith(second);
    expect(self.disableVideo).not.toHaveBeenCalled();
    expect(root.querySelectorAll('rtk-menu-item[aria-checked=true]')).toHaveLength(1);
    expect(root.querySelector('rtk-menu-item[aria-checked=true]').textContent).toContain(
      'External camera'
    );
    page.root.remove();
  });

  it('shows the empty state and uses deviceListUpdate without refetching', async () => {
    const { page, self } = await createToggle();
    const root = page.root.shadowRoot;
    expect(root.querySelector('.empty-devices').textContent).toBe('No camera found');

    self.emit('deviceListUpdate', {
      devices: [device('videoinput', '', 'Unavailable'), device('videoinput', 'usb', 'USB camera')],
    });
    await page.waitForChanges();

    expect(root.querySelector('.empty-devices')).toBeNull();
    expect(root.querySelectorAll('rtk-menu-item[role=menuitemradio]')).toHaveLength(1);
    expect(self.getVideoDevices).toHaveBeenCalledTimes(1);
    page.root.remove();
  });

  it('hides only the menu, keeping the standalone camera button functional', async () => {
    const { page, self } = await createToggle({ hideDeviceSelectionMenu: true });
    const root = page.root.shadowRoot;
    const button = root.querySelector<HTMLElement>('rtk-controlbar-button');

    expect(root.querySelector('rtk-menu')).toBeNull();
    expect((button as HTMLRtkControlbarButtonElement).label).toBeTruthy();
    button.click();
    expect(self.disableVideo).toHaveBeenCalledTimes(1);
    page.root.remove();
  });

  it('keeps optional items with mirror and separates them from cameras only when present', async () => {
    const { page } = await createToggle();
    const root = page.root.shadowRoot;
    const extras = root.querySelector('.additional-menu-items');
    const slot = extras.querySelector('slot[name=additional-menu-items]') as HTMLSlotElement;

    expect(extras.querySelector('.menu-divider')).toBeNull();
    expect(root.querySelector('rtk-menu-list > .menu-divider')).not.toBeNull();

    const effect = page.doc.createElement('rtk-menu-item');
    effect.slot = 'additional-menu-items';
    page.root.append(effect);
    Object.defineProperty(slot, 'assignedElements', { configurable: true, value: () => [effect] });
    slot.dispatchEvent(new Event('slotchange'));
    await page.waitForChanges();

    expect(extras.querySelector('.menu-divider')).not.toBeNull();
    expect(root.querySelector('rtk-menu-list > .menu-divider')).toBeNull();
    expect(extras.nextElementSibling.classList.contains('mirror-option')).toBe(true);
    page.root.remove();
  });

  it('lets only the switch change mirror preference and closes the menu on click', async () => {
    const { page } = await createToggle();
    const root = page.root.shadowRoot;
    const updates = jest.fn();
    page.root.addEventListener('rtkStateUpdate', updates);
    const menu = root.querySelector('rtk-menu');
    const list = menu.shadowRoot.querySelector<HTMLElement>('#menu-list');
    const trigger = menu.shadowRoot.querySelector<HTMLElement>('#trigger');
    const mirror = root.querySelector<HTMLElement>('.mirror-option');
    const toggle = mirror.querySelector<HTMLRtkSwitchElement>('rtk-switch');

    expect(toggle.checked).toBe(false);
    expect(mirror.querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      defaultIconPack.mirror_off
    );
    mirror.querySelector('span').click();
    expect(updates).not.toHaveBeenCalled();

    trigger.click();
    expect(list.style.display).toBe('block');
    toggle.click();
    await page.waitForChanges();

    expect(getPreference('mirror-video')).toBe('true');
    expect(updates).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { prefs: { mirrorVideo: true } } })
    );
    expect(list.style.display).toBe('none');
    page.root.states = { prefs: { mirrorVideo: true } };
    await page.waitForChanges();
    expect(mirror.querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      defaultIconPack.mirror_on
    );
    page.root.remove();
  });
});
