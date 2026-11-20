import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { RtkButton } from '../rtk-button/rtk-button';
import { RtkIcon } from '../rtk-icon/rtk-icon';
import { RtkScreenshareView } from './rtk-screenshare-view';

async function createView({
  remote = false,
  iconPack = defaultIconPack,
  t = useLanguage(),
}: { remote?: boolean; iconPack?: Partial<IconPack>; t?: RtkI18n } = {}) {
  const self = Object.assign(new EventEmitter(), {
    id: 'self',
    screenShareEnabled: true,
    screenShareTracks: { video: undefined },
    supportsRemoteControl: false,
    enableScreenShare: jest.fn(() => Promise.resolve()),
    disableScreenShare: jest.fn(() => Promise.resolve()),
    registerScreenshareVideoElement: jest.fn(),
    deregisterScreenshareVideoElement: jest.fn(),
  });
  const participant = remote ? createRemoteParticipant('remote') : self;
  const logger = { error: jest.fn() };
  const meeting = {
    self,
    participants: { joined: new EventEmitter() },
    __internals__: { logger },
  };
  const page = await newSpecPage({
    components: [RtkScreenshareView, RtkButton, RtkIcon],
    template: () => h('rtk-screenshare-view', { meeting, participant, iconPack, t }),
  });
  const root = page.root;
  if (root?.shadowRoot == null) throw new Error('Screen-share view did not render');

  const switchButton = () =>
    root.shadowRoot.querySelector<HTMLRtkButtonElement>('.actions rtk-button[variant="secondary"]');
  const stopButton = () =>
    root.shadowRoot.querySelector<HTMLRtkButtonElement>('.actions rtk-button[variant="danger"]');

  const videoEl = () => root.shadowRoot.querySelector('video');

  return { page, root, self, participant, meeting, logger, switchButton, stopButton, videoEl };
}

function createRemoteParticipant(id: string) {
  return {
    id,
    screenShareEnabled: true,
    screenShareTracks: {} as { video?: unknown },
    supportsRemoteControl: false,
    registerScreenshareVideoElement: jest.fn(),
    deregisterScreenshareVideoElement: jest.fn(),
  };
}

describe('<rtk-screenshare-view> video element registration', () => {
  it.each([false, true])(
    'registers its video element with the participant (remote: %s)',
    async (remote) => {
      const { participant, videoEl } = await createView({ remote });

      expect(participant.registerScreenshareVideoElement).toHaveBeenCalledTimes(1);
      expect(participant.registerScreenshareVideoElement).toHaveBeenCalledWith(videoEl());
      expect(participant.deregisterScreenshareVideoElement).not.toHaveBeenCalled();
    }
  );

  it('leaves the video source to the SDK when the screen share updates', async () => {
    const { page, participant, meeting, videoEl } = await createView({ remote: true });
    expect(videoEl().classList.contains('visible')).toBe(false);

    participant.screenShareTracks = { video: {} };
    meeting.participants.joined.emit('screenShareUpdate', participant);
    await page.waitForChanges();

    expect(videoEl().classList.contains('visible')).toBe(true);
    expect(videoEl().srcObject).toBeUndefined();
  });

  it('deregisters its video element and stops listening when removed', async () => {
    const { root, self, meeting, videoEl } = await createView();
    const element = videoEl();

    root.remove();

    expect(self.deregisterScreenshareVideoElement).toHaveBeenCalledTimes(1);
    expect(self.deregisterScreenshareVideoElement).toHaveBeenCalledWith(element);
    expect(self.listenerCount('screenShareUpdate')).toBe(0);
    expect(meeting.participants.joined.listenerCount('screenShareUpdate')).toBe(0);
  });

  it('registers its video element again when it is attached again', async () => {
    const { page, root, participant, meeting, videoEl } = await createView({ remote: true });
    const element = videoEl();

    root.remove();
    page.body.appendChild(root);
    await page.waitForChanges();

    expect(participant.registerScreenshareVideoElement).toHaveBeenCalledTimes(2);
    expect(participant.registerScreenshareVideoElement).toHaveBeenLastCalledWith(element);
    expect(meeting.participants.joined.listenerCount('screenShareUpdate')).toBe(1);
  });

  it('moves its video element to a new participant', async () => {
    const { page, root, self, meeting, videoEl } = await createView();
    const next = createRemoteParticipant('next');

    (root as HTMLRtkScreenshareViewElement).participant = next as any;
    await page.waitForChanges();

    expect(self.deregisterScreenshareVideoElement).toHaveBeenCalledWith(videoEl());
    expect(next.registerScreenshareVideoElement).toHaveBeenCalledWith(videoEl());
    expect(self.deregisterScreenshareVideoElement.mock.invocationCallOrder[0]).toBeLessThan(
      next.registerScreenshareVideoElement.mock.invocationCallOrder[0]
    );
    expect(self.listenerCount('screenShareUpdate')).toBe(0);
    expect(meeting.participants.joined.listenerCount('screenShareUpdate')).toBe(1);
  });
});

describe('<rtk-screenshare-view> screen-sharing actions', () => {
  it('shows separate stop and switch buttons alongside the self-share message', async () => {
    const { root, switchButton, stopButton } = await createView();

    expect(root.shadowRoot.querySelector('h3').textContent).toBe('Your screen is being shared.');
    expect(stopButton().textContent.trim()).toBe('Stop Sharing');
    expect(switchButton().textContent.trim()).toBe('Share Different Screen');
    expect(stopButton().nextElementSibling).toBe(switchButton());
    expect(switchButton().querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      defaultIconPack.share_screen_different
    );
    expect(switchButton().querySelector<HTMLRtkIconElement>('rtk-icon').icon).not.toBe(
      defaultIconPack.share_screen_start
    );
  });

  it('does not show self-share actions for another participant', async () => {
    const { root, switchButton, stopButton } = await createView({ remote: true });

    expect(root.shadowRoot.querySelector('#self-message')).toBeNull();
    expect(switchButton()).toBeNull();
    expect(stopButton()).toBeNull();
  });

  it('switches the source without first disabling the existing share', async () => {
    const { page, self, switchButton } = await createView();

    switchButton().shadowRoot.querySelector('button').click();
    await page.waitForChanges();

    expect(self.enableScreenShare).toHaveBeenCalledTimes(1);
    expect(self.disableScreenShare).not.toHaveBeenCalled();
    expect(switchButton().disabled).toBe(false);
  });

  it('stops sharing without opening another source picker', async () => {
    const { self, stopButton } = await createView();

    stopButton().shadowRoot.querySelector('button').click();

    expect(self.disableScreenShare).toHaveBeenCalledTimes(1);
    expect(self.enableScreenShare).not.toHaveBeenCalled();
  });

  it('blocks rapid repeated clicks, disables the pending action, and allows retry after success', async () => {
    const { page, self, switchButton } = await createView();
    let finish: () => void;
    const picker = new Promise<void>((resolve) => (finish = resolve));
    self.enableScreenShare.mockReturnValueOnce(picker);

    switchButton().click();
    switchButton().click();
    await page.waitForChanges();

    expect(self.enableScreenShare).toHaveBeenCalledTimes(1);
    expect(switchButton().disabled).toBe(true);
    expect(switchButton().shadowRoot.querySelector('button').hasAttribute('disabled')).toBe(true);

    finish();
    await picker;
    await page.waitForChanges();
    expect(switchButton().disabled).toBe(false);

    switchButton().click();
    await page.waitForChanges();
    expect(self.enableScreenShare).toHaveBeenCalledTimes(2);
  });

  it.each(['AbortError', 'NotAllowedError', 'Error'])(
    'logs a rejected SDK call (%s), clears the busy state, and allows another attempt',
    async (name) => {
      const { page, self, logger, switchButton } = await createView();
      const error = Object.assign(new Error('Screen selection failed or was dismissed'), { name });
      self.enableScreenShare.mockRejectedValueOnce(error);

      switchButton().shadowRoot.querySelector('button').click();
      await page.waitForChanges();

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('rtkScreenshareView::shareDifferentScreen', {
        error,
      });
      expect(switchButton().disabled).toBe(false);
      expect(self.disableScreenShare).not.toHaveBeenCalled();

      switchButton().click();
      await page.waitForChanges();
      expect(self.enableScreenShare).toHaveBeenCalledTimes(2);
    }
  );

  it('logs a synchronous SDK error and clears the busy guard', async () => {
    const { page, self, logger, switchButton } = await createView();
    const error = new Error('Unsupported concurrent call');
    self.enableScreenShare.mockImplementationOnce(() => {
      throw error;
    });

    switchButton().shadowRoot.querySelector('button').click();
    await page.waitForChanges();

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith('rtkScreenshareView::shareDifferentScreen', {
      error,
    });
    expect(switchButton().disabled).toBe(false);
    switchButton().click();
    await page.waitForChanges();
    expect(self.enableScreenShare).toHaveBeenCalledTimes(2);
  });

  it('uses independently customized switch and stop labels and icons', async () => {
    const icons = {
      ...defaultIconPack,
      share_screen_different: '<svg id="different-screen"></svg>',
      share_screen_stop: '<svg id="stop-screen"></svg>',
    };
    const { switchButton, stopButton } = await createView({
      iconPack: icons,
      t: useLanguage({
        'screenshare.share_different_screen': 'Choose Another Display',
        'screenshare.stop': 'End Presentation',
      }),
    });

    expect(switchButton().textContent.trim()).toBe('Choose Another Display');
    expect(stopButton().textContent.trim()).toBe('End Presentation');
    expect(switchButton().querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      icons.share_screen_different
    );
    expect(stopButton().querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      icons.share_screen_stop
    );
  });

  it('falls back to the start icon for a legacy icon pack without a switch icon', async () => {
    const icons: Partial<IconPack> = { ...defaultIconPack };
    delete icons.share_screen_different;
    const { switchButton } = await createView({ iconPack: icons });

    expect(switchButton().querySelector<HTMLRtkIconElement>('rtk-icon').icon).toBe(
      icons.share_screen_start
    );
  });
});
