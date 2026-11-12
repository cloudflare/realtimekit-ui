import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { RtkControlbarButton } from '../rtk-controlbar-button/rtk-controlbar-button';
import { RtkIcon } from '../rtk-icon/rtk-icon';
import { RtkMenu } from '../rtk-menu/rtk-menu';
import { RtkMenuItem } from '../rtk-menu-item/rtk-menu-item';
import { RtkMenuList } from '../rtk-menu-list/rtk-menu-list';
import { RtkScreenShareToggle } from './rtk-screen-share-toggle';

interface ToggleOptions {
  sharing?: boolean;
  maxShares?: number;
  remoteShares?: number;
  canShare?: boolean;
  stageStatus?: string;
  variant?: 'button' | 'horizontal';
  iconPack?: Partial<IconPack>;
  t?: RtkI18n;
}

async function createToggle({
  sharing = false,
  maxShares = -1,
  remoteShares = 0,
  canShare = true,
  stageStatus = 'ON_STAGE',
  variant = 'button',
  iconPack = defaultIconPack,
  t = useLanguage(),
}: ToggleOptions = {}) {
  const participants = Array.from({ length: remoteShares }, (_, id) => ({
    id: `remote-${id}`,
    screenShareEnabled: true,
  }));
  const self = Object.assign(new EventEmitter(), {
    screenShareEnabled: sharing,
    permissions: { canProduceScreenshare: canShare ? 'ALLOWED' : 'NOT_ALLOWED' },
    config: { maxScreenShareCount: maxShares },
    enableScreenShare: jest.fn(() => Promise.resolve()),
    disableScreenShare: jest.fn(() => Promise.resolve()),
  });
  const meeting = {
    self,
    participants: {
      joined: Object.assign(new EventEmitter(), { toArray: () => participants }),
      active: { toArray: () => participants },
    },
    stage: Object.assign(new EventEmitter(), { status: stageStatus }),
    __internals__: { logger: { info: jest.fn(), error: jest.fn() } },
  };
  const page = await newSpecPage({
    components: [
      RtkScreenShareToggle,
      RtkControlbarButton,
      RtkMenu,
      RtkMenuList,
      RtkMenuItem,
      RtkIcon,
    ],
    template: () => h('rtk-screen-share-toggle', { meeting, iconPack, t, variant }),
  });
  const root = page.root;
  if (root?.shadowRoot == null) throw new Error('Screen-share toggle did not render');

  const button = () =>
    root.shadowRoot.querySelector<HTMLRtkControlbarButtonElement>('rtk-controlbar-button');
  const items = () =>
    Array.from(root.shadowRoot.querySelectorAll<HTMLRtkMenuItemElement>('rtk-menu-item'));
  const updates = jest.fn();
  root.addEventListener('rtkStateUpdate', updates);

  return { page, root, meeting, self, button, items, updates };
}

describe('<rtk-screen-share-toggle>', () => {
  let mediaDevices: PropertyDescriptor;

  beforeEach(() => {
    mediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getDisplayMedia: jest.fn() },
    });
  });

  afterEach(() => {
    if (mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', mediaDevices);
    } else {
      Reflect.deleteProperty(navigator, 'mediaDevices');
    }
  });

  it('starts sharing directly without rendering a menu when not already sharing', async () => {
    const { page, root, self, button, updates } = await createToggle();

    expect(root.shadowRoot.querySelector('rtk-menu')).toBeNull();
    expect(button().label).toBe('Share Screen');
    expect(button().icon).toBe(defaultIconPack.share_screen_start);

    button().click();
    await page.waitForChanges();

    expect(self.enableScreenShare).toHaveBeenCalledTimes(1);
    expect(self.disableScreenShare).not.toHaveBeenCalled();
    expect(updates).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { activeMoreMenu: false } })
    );
  });

  it('opens the active-sharing menu without starting or stopping sharing', async () => {
    const { root, self, button, items } = await createToggle({ sharing: true });
    const menu = root.shadowRoot.querySelector<HTMLRtkMenuElement>('rtk-menu');
    const trigger = menu.shadowRoot.querySelector<HTMLElement>('#trigger');
    const list = menu.shadowRoot.querySelector<HTMLElement>('#menu-list');

    expect(button().label).toBe('Screen Sharing');
    expect(button().icon).toBe(defaultIconPack.share_screen_menu);
    expect(button().classList.contains('red-icon')).toBe(false);
    expect(menu.placement).toBe('top');

    trigger.click();

    expect(list.style.display).toBe('block');
    expect(items().map((item) => item.textContent.trim())).toEqual([
      'Share Different Screen',
      'Stop Sharing',
    ]);
    expect(self.enableScreenShare).not.toHaveBeenCalled();
    expect(self.disableScreenShare).not.toHaveBeenCalled();
  });

  it('gives the trigger and each menu action their own hover title', async () => {
    const { root, button, items } = await createToggle({ sharing: true });

    expect(root.hasAttribute('title')).toBe(false);
    expect(button().title).toBe('Screen Sharing');
    expect(items().map((item) => item.title)).toEqual(['Share Different Screen', 'Stop Sharing']);
  });

  it('uses a separate switch icon and makes only the stop icon red', async () => {
    const { button, items } = await createToggle({ sharing: true });
    const [switchItem, stopItem] = items();
    const switchIcon = switchItem.querySelector<HTMLRtkIconElement>('rtk-icon');
    const stopIcon = stopItem.querySelector<HTMLRtkIconElement>('rtk-icon');

    expect(switchIcon.icon).toBe(defaultIconPack.share_screen_different);
    expect(switchIcon.icon).not.toBe(defaultIconPack.share_screen_start);
    expect(stopIcon.icon).toBe(defaultIconPack.share_screen_stop);
    expect(stopIcon.variant).toBe('danger');
    expect(stopItem.classList.contains('red')).toBe(false);
    expect(button().icon).not.toBe(stopIcon.icon);
    expect(button().icon).not.toBe(defaultIconPack.share_screen_start);
  });

  it('switches the shared source without disabling the existing share', async () => {
    const { page, self, items, updates } = await createToggle({ sharing: true });

    items()[0].click();
    await page.waitForChanges();

    expect(self.enableScreenShare).toHaveBeenCalledTimes(1);
    expect(self.disableScreenShare).not.toHaveBeenCalled();
    expect(updates).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { activeMoreMenu: false } })
    );
  });

  it('stops sharing from the menu without opening another picker', async () => {
    const { self, items, updates } = await createToggle({ sharing: true });

    items()[1].click();

    expect(self.disableScreenShare).toHaveBeenCalledTimes(1);
    expect(self.enableScreenShare).not.toHaveBeenCalled();
    expect(updates).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { activeMoreMenu: false } })
    );
  });

  it.each([
    [false, 'AbortError'],
    [false, 'NotAllowedError'],
    [false, 'Error'],
    [true, 'AbortError'],
    [true, 'NotAllowedError'],
    [true, 'Error'],
  ])(
    'logs a rejected SDK call when sharing=%s (%s), restores the button, and allows retry',
    async (sharing: boolean, name: string) => {
      const { page, meeting, self, button, items, updates } = await createToggle({ sharing });
      const error = Object.assign(new Error('Screen selection failed or was dismissed'), { name });
      self.enableScreenShare.mockRejectedValueOnce(error);
      const action = () => (sharing ? items()[0] : button());

      action().click();
      await page.waitForChanges();

      expect(meeting.__internals__.logger.error).toHaveBeenCalledWith(
        'rtkScreenShare::enableScreenShare',
        { error }
      );
      expect(button().disabled).toBe(false);
      expect(self.disableScreenShare).not.toHaveBeenCalled();
      expect(updates).not.toHaveBeenCalled();

      action().click();
      await page.waitForChanges();
      expect(self.enableScreenShare).toHaveBeenCalledTimes(2);
      expect(updates).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { activeMoreMenu: false } })
      );
    }
  );

  it('handles a synchronous SDK error when switching and allows retry', async () => {
    const { page, meeting, self, button, items } = await createToggle({ sharing: true });
    const error = new Error('Unsupported concurrent call');
    self.enableScreenShare.mockImplementationOnce(() => {
      throw error;
    });

    items()[0].click();
    await page.waitForChanges();

    expect(meeting.__internals__.logger.error).toHaveBeenCalledWith(
      'rtkScreenShare::enableScreenShare',
      { error }
    );
    expect(button().disabled).toBe(false);
    items()[0].click();
    await page.waitForChanges();
    expect(self.enableScreenShare).toHaveBeenCalledTimes(2);
  });

  it.each([
    [0, 'Enter'],
    [0, ' '],
    [1, 'Enter'],
    [1, ' '],
  ])('activates menu action %s with the %p key', async (index: number, key: string) => {
    const { page, self, items } = await createToggle({ sharing: true });
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });

    items()[index].dispatchEvent(event);
    await page.waitForChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(self.enableScreenShare).toHaveBeenCalledTimes(index === 0 ? 1 : 0);
    expect(self.disableScreenShare).toHaveBeenCalledTimes(index === 1 ? 1 : 0);
  });

  it('does not activate a menu action for an unrelated key', async () => {
    const { self, items } = await createToggle({ sharing: true });
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true });

    items()[0].dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(self.enableScreenShare).not.toHaveBeenCalled();
    expect(self.disableScreenShare).not.toHaveBeenCalled();
  });

  it('allows switching when the existing self-share reaches the share limit', async () => {
    const { page, self, button, items } = await createToggle({ sharing: true, maxShares: 1 });
    self.emit('screenShareUpdate');
    await page.waitForChanges();

    expect(button().disabled).toBe(false);
    items()[0].click();
    await page.waitForChanges();

    expect(self.enableScreenShare).toHaveBeenCalledTimes(1);
    expect(self.disableScreenShare).not.toHaveBeenCalled();
  });

  it('blocks a new share when another participant has reached the share limit', async () => {
    const { page, self, button } = await createToggle({ maxShares: 1, remoteShares: 1 });

    expect(button().disabled).toBe(true);
    expect(button().showWarning).toBe(true);
    button().click();
    await page.waitForChanges();

    expect(self.enableScreenShare).not.toHaveBeenCalled();
  });

  it('does not apply a share limit when the preset specifies unlimited sharing', async () => {
    const { page, self, button } = await createToggle({ maxShares: -1, remoteShares: 2 });

    expect(button().disabled).toBe(false);
    button().click();
    await page.waitForChanges();

    expect(self.enableScreenShare).toHaveBeenCalledTimes(1);
  });

  it('keeps both menu actions guarded while the source picker is pending', async () => {
    const { page, self, items } = await createToggle({ sharing: true });
    let finish: () => void;
    const picker = new Promise<void>((resolve) => (finish = resolve));
    self.enableScreenShare.mockReturnValueOnce(picker);

    items()[0].click();
    await page.waitForChanges();
    expect(items()[0].hasAttribute('aria-disabled')).toBe(true);
    items()[0].click();
    items()[1].click();

    expect(self.enableScreenShare).toHaveBeenCalledTimes(1);
    expect(self.disableScreenShare).not.toHaveBeenCalled();

    finish();
    await picker;
    await page.waitForChanges();
    expect(items()[0].hasAttribute('aria-disabled')).toBe(false);
  });

  it('renders the menu and actions in the horizontal mobile-control variant', async () => {
    const { button, items } = await createToggle({ sharing: true, variant: 'horizontal' });

    expect(button().variant).toBe('horizontal');
    expect(items()).toHaveLength(2);
  });

  it('updates the trigger and action labels independently when language changes', async () => {
    const { page, root, button, items } = await createToggle({ sharing: true });
    root.t = useLanguage({
      'screenshare.menu': 'Presentation Controls',
      'screenshare.share_different_screen': 'Choose Another Display',
      'screenshare.stop': 'End Presentation',
    });
    await page.waitForChanges();

    expect(button().label).toBe('Presentation Controls');
    expect(button().title).toBe('Presentation Controls');
    expect(items().map((item) => item.textContent.trim())).toEqual([
      'Choose Another Display',
      'End Presentation',
    ]);
    expect(items().map((item) => item.title)).toEqual([
      'Choose Another Display',
      'End Presentation',
    ]);
  });

  it('updates independently customized trigger, switch, and stop icons', async () => {
    const { page, root, button, items } = await createToggle({ sharing: true });
    const icons = {
      ...defaultIconPack,
      share_screen_menu: '<svg id="custom-menu"></svg>',
      share_screen_different: '<svg id="custom-switch"></svg>',
      share_screen_stop: '<svg id="custom-stop"></svg>',
    };
    root.iconPack = icons;
    await page.waitForChanges();

    expect(button().icon).toBe(icons.share_screen_menu);
    expect(items()[0].querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      icons.share_screen_different
    );
    expect(items()[1].querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      icons.share_screen_stop
    );
  });

  it('falls back to legacy icons when the new icon-pack entries are missing', async () => {
    const icons: Partial<IconPack> = { ...defaultIconPack };
    delete icons.share_screen_menu;
    delete icons.share_screen_different;
    const { button, items } = await createToggle({ sharing: true, iconPack: icons });

    expect(button().icon).toBe(icons.share_screen_stop);
    expect(items()[0].querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      icons.share_screen_start
    );
  });

  it('returns to the first-time share button when the SDK reports that sharing stopped', async () => {
    const { page, root, self, button } = await createToggle({ sharing: true });
    self.screenShareEnabled = false;
    self.emit('screenShareUpdate');
    await page.waitForChanges();

    expect(root.shadowRoot.querySelector('rtk-menu')).toBeNull();
    expect(button().label).toBe('Share Screen');
    expect(button().icon).toBe(defaultIconPack.share_screen_start);
  });

  it('retains permission-error indicators and blocks sharing after a denial', async () => {
    const { page, self, button, updates } = await createToggle();
    self.emit('mediaPermissionUpdate', { kind: 'screenshare', message: 'SYSTEM_DENIED' });
    await page.waitForChanges();

    expect(button().classList.contains('red-icon')).toBe(true);
    expect(button().disabled).toBe(true);
    expect(updates).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { activePermissionsMessage: { enabled: true, kind: 'screenshare' } },
      })
    );
    button().click();
    expect(self.enableScreenShare).not.toHaveBeenCalled();
  });

  it.each(['OFF_STAGE', 'REQUESTED_TO_JOIN_STAGE'])(
    'does not expose the screen-sharing controls while %s',
    async (stageStatus) => {
      const { root } = await createToggle({ sharing: true, stageStatus });
      expect(root.hasAttribute('data-hidden')).toBe(true);
      expect(root.shadowRoot.querySelector('rtk-menu')).toBeNull();
    }
  );

  it('does not expose screen-sharing controls without production permission', async () => {
    const { root } = await createToggle({ canShare: false });
    expect(root.hasAttribute('data-hidden')).toBe(true);
  });
});
