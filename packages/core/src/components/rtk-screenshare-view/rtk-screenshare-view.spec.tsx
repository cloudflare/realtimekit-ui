import { h } from '@stencil/core';
import { newSpecPage } from '@stencil/core/testing';
import { EventEmitter } from 'events';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Peer } from '../../types/rtk-client';
import { RtkButton } from '../rtk-button/rtk-button';
import { RtkIcon } from '../rtk-icon/rtk-icon';
import { RtkScreenshareView } from './rtk-screenshare-view';

const SCREEN_SHARE_VISIBILITY_MESSAGE = '__rtk_screenshare_visibility__';

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

function createVisibilityParticipant(participantId: string, name: string) {
  return {
    id: participantId,
    name,
    screenShareEnabled: false,
    screenShareTracks: { video: undefined as MediaStreamTrack | undefined },
    producers: [] as { producerId: string; kind: 'video'; screenShare: boolean }[],
    supportsRemoteControl: false,
    registerScreenshareVideoElement: jest.fn(),
    deregisterScreenshareVideoElement: jest.fn(),
  };
}

async function createVisibilityView({
  remote = false,
  viewerNames = [],
  maxVisibleViewerAvatars,
  t = useLanguage(),
}: {
  remote?: boolean;
  viewerNames?: string[];
  maxVisibleViewerAvatars?: number;
  t?: RtkI18n;
} = {}) {
  const screenShareTrack = { id: 'screen-track', kind: 'video' } as MediaStreamTrack;
  const self = Object.assign(new EventEmitter(), {
    id: 'self',
    screenShareEnabled: !remote,
    screenShareTracks: { video: remote ? undefined : screenShareTrack },
    producers: remote ? [] : [{ id: 'producer-1', kind: 'video', appData: { screenShare: true } }],
    supportsRemoteControl: false,
    registerScreenshareVideoElement: jest.fn(),
    deregisterScreenshareVideoElement: jest.fn(),
  });
  const sharer = createVisibilityParticipant('sharer', 'Sharer');
  sharer.screenShareEnabled = true;
  sharer.screenShareTracks.video = screenShareTrack;
  sharer.producers = [{ producerId: 'producer-1', kind: 'video', screenShare: true }];
  const joinedParticipants = new Map(
    remote
      ? [[sharer.id, sharer] as const]
      : viewerNames.map((name) => [name, createVisibilityParticipant(name, name)] as const)
  );
  const joined = Object.assign(new EventEmitter(), {
    get: (participantId: string) => joinedParticipants.get(participantId),
    has: (participantId: string) => joinedParticipants.has(participantId),
    keys: () => joinedParticipants.keys(),
    toArray: () => Array.from(joinedParticipants.values()),
  });
  Object.defineProperty(joined, 'size', { get: () => joinedParticipants.size });
  const broadcastMessage = jest.fn().mockResolvedValue(undefined);
  const participants = Object.assign(new EventEmitter(), { joined, broadcastMessage });
  const meta = Object.assign(new EventEmitter(), {
    selfActiveTab: { type: 'screenshare', id: sharer.id },
  });
  const logger = { error: jest.fn() };
  const meeting = { self, participants, meta, __internals__: { logger } };
  const participant = remote ? sharer : self;
  const page = await newSpecPage({
    components: [RtkScreenshareView, RtkButton, RtkIcon],
    template: () =>
      h('rtk-screenshare-view', {
        meeting: meeting as unknown as Meeting,
        participant: participant as unknown as Peer,
        t,
        ...(maxVisibleViewerAvatars === undefined ? {} : { maxVisibleViewerAvatars }),
      }),
  });
  const root = page.root;
  if (root?.shadowRoot == null) throw new Error('Screen-share view did not render');
  const video = root.shadowRoot.querySelector('video');
  if (video == null) throw new Error('Screen-share video did not render');

  return {
    page,
    root,
    self,
    sharer,
    meeting,
    joined,
    joinedParticipants,
    broadcastMessage,
    logger,
    screenShareTrack,
    video,
  };
}

function reportViewerVisibility(
  participants: EventEmitter,
  peerId: string,
  visible: boolean,
  producerId = 'producer-1'
) {
  participants.emit('broadcastedMessage', {
    type: SCREEN_SHARE_VISIBILITY_MESSAGE,
    peerId,
    timestamp: 1234,
    payload: { sharerId: 'self', producerId, visible },
  });
}

function setPlayingVideoTrack(video: HTMLVideoElement, screenShareTrack: MediaStreamTrack) {
  Object.defineProperties(video, {
    HAVE_CURRENT_DATA: { configurable: true, value: 2 },
    paused: { configurable: true, value: false },
    readyState: { configurable: true, value: 2 },
    srcObject: {
      configurable: true,
      writable: true,
      value: { getVideoTracks: () => [screenShareTrack] },
    },
  });
}

describe('<rtk-screenshare-view> video element registration', () => {
  it('does not deregister an absent video element when switching participants or disconnecting', () => {
    const previous = createRemoteParticipant('previous');
    const next = createRemoteParticipant('next');
    const joined = new EventEmitter();
    const view = new RtkScreenshareView();
    view.meeting = { self: { id: 'self' }, participants: { joined } } as unknown as Meeting;
    view.participant = previous as unknown as Peer;

    view.connectedCallback();
    expect(joined.listenerCount('screenShareUpdate')).toBe(1);

    view.participantChanged(next as unknown as Peer, previous as unknown as Peer);
    expect(previous.deregisterScreenshareVideoElement).not.toHaveBeenCalled();
    expect(next.registerScreenshareVideoElement).not.toHaveBeenCalled();
    expect(joined.listenerCount('screenShareUpdate')).toBe(1);

    view.participant = next as unknown as Peer;
    view.disconnectedCallback();
    expect(next.deregisterScreenshareVideoElement).not.toHaveBeenCalled();
    expect(joined.listenerCount('screenShareUpdate')).toBe(0);
  });

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

describe('<rtk-screenshare-view> local screen-share visibility', () => {
  it('hides visibility status when nobody else has joined', async () => {
    const { root } = await createVisibilityView();

    expect(root.shadowRoot.querySelector('.validation-status')).toBeNull();
    expect(root.shadowRoot.querySelector('.validation-border')).toBeNull();
  });

  it('shows only a red message and a full red border before anyone starts viewing', async () => {
    const { root } = await createVisibilityView({ viewerNames: ['alice', 'bob'] });
    const status = root.shadowRoot.querySelector('.validation-status');
    const border = root.shadowRoot.querySelector<HTMLElement>('.validation-border');

    expect(status.textContent.trim()).toBe('No one is viewing your screen.');
    expect(status.querySelector('.none-visible')).not.toBeNull();
    expect(status.querySelector('.pending-avatars')).toBeNull();
    expect(status.querySelector('.more-avatar')).toBeNull();
    expect(border.classList.contains('none-active')).toBe(true);
    expect(border.style.getPropertyValue('--validation-progress')).toBe('100%');
  });

  it('shows pending avatars for partial viewing, then the green message when all are viewing', async () => {
    const { page, root, meeting } = await createVisibilityView({ viewerNames: ['alice', 'bob'] });

    reportViewerVisibility(meeting.participants, 'alice', true);
    await page.waitForChanges();
    const status = root.shadowRoot.querySelector('.validation-status');
    const border = root.shadowRoot.querySelector<HTMLElement>('.validation-border');
    expect(status.textContent).toContain('Not currently viewing:');
    expect(status.querySelectorAll('.avatar-trigger')).toHaveLength(1);
    expect(status.querySelector('.avatar-trigger').getAttribute('aria-label')).toBe('bob');
    expect(border.classList.contains('none-active')).toBe(false);
    expect(border.style.getPropertyValue('--validation-progress')).toBe('50%');

    reportViewerVisibility(meeting.participants, 'bob', true);
    await page.waitForChanges();
    expect(status.textContent.trim()).toBe('Everyone is viewing your screen.');
    expect(status.querySelector('.all-visible')).not.toBeNull();
    expect(status.querySelector('.pending-avatars')).toBeNull();
    expect(border.classList.contains('complete')).toBe(true);
    expect(border.style.getPropertyValue('--validation-progress')).toBe('100%');

    reportViewerVisibility(meeting.participants, 'bob', false);
    await page.waitForChanges();
    expect(status.textContent).toContain('Not currently viewing:');
    expect(status.querySelector('.avatar-trigger').getAttribute('aria-label')).toBe('bob');
    expect(border.classList.contains('complete')).toBe(false);
    expect(border.style.getPropertyValue('--validation-progress')).toBe('50%');
  });

  it('ignores notifications for another share or for a participant who is not joined', async () => {
    const { page, root, meeting } = await createVisibilityView({ viewerNames: ['alice'] });

    reportViewerVisibility(meeting.participants, 'alice', true, 'previous-producer');
    reportViewerVisibility(meeting.participants, 'stranger', true);
    meeting.participants.emit('broadcastedMessage', {
      type: SCREEN_SHARE_VISIBILITY_MESSAGE,
      peerId: 'alice',
      timestamp: 1234,
      payload: {
        sharerId: 'someone-else',
        producerId: 'producer-1',
        visible: true,
      },
    });
    await page.waitForChanges();

    expect(root.shadowRoot.querySelector('.validation-status').textContent.trim()).toBe(
      'No one is viewing your screen.'
    );
    expect(
      root.shadowRoot.querySelector('.validation-border').classList.contains('none-active')
    ).toBe(true);
  });

  it('attributes a visibility report to its SDK sender rather than a viewer ID in the payload', async () => {
    const { page, root, meeting } = await createVisibilityView({
      viewerNames: ['alice', 'bob'],
    });

    meeting.participants.emit('broadcastedMessage', {
      type: SCREEN_SHARE_VISIBILITY_MESSAGE,
      peerId: 'alice',
      timestamp: 1234,
      payload: { sharerId: 'self', viewerId: 'bob', producerId: 'producer-1', visible: true },
    });
    await page.waitForChanges();

    const status = root.shadowRoot.querySelector('.validation-status');
    expect(status.textContent).toContain('Not currently viewing:');
    expect(status.querySelector('.avatar-trigger').getAttribute('aria-label')).toBe('bob');
    expect(
      root.shadowRoot
        .querySelector<HTMLElement>('.validation-border')
        .style.getPropertyValue('--validation-progress')
    ).toBe('50%');
  });

  it('updates visibility when viewers join, leave, and reconnect with the same ID', async () => {
    const { page, root, meeting, joined, joinedParticipants } = await createVisibilityView({
      viewerNames: ['alice'],
    });

    reportViewerVisibility(meeting.participants, 'alice', true);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.all-visible')).not.toBeNull();

    const rejoinedAlice = createVisibilityParticipant('alice', 'Alice rejoined');
    joinedParticipants.set('alice', rejoinedAlice);
    joined.emit('participantJoined', rejoinedAlice);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.none-visible').textContent).toBe(
      'No one is viewing your screen.'
    );

    reportViewerVisibility(meeting.participants, 'alice', true);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.all-visible')).not.toBeNull();

    joinedParticipants.delete('alice');
    joined.emit('participantLeft', rejoinedAlice);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.validation-status')).toBeNull();
    expect(root.shadowRoot.querySelector('.validation-border')).toBeNull();

    const bob = createVisibilityParticipant('bob', 'Bob');
    joinedParticipants.set('bob', bob);
    joined.emit('participantJoined', bob);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.none-visible')).not.toBeNull();
  });

  it('uses the current joined count when a confirmed viewer leaves', async () => {
    const { page, root, meeting, joined, joinedParticipants } = await createVisibilityView({
      viewerNames: ['alice', 'bob'],
    });
    reportViewerVisibility(meeting.participants, 'alice', true);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.avatar-trigger').getAttribute('aria-label')).toBe('bob');

    const departedViewer = joinedParticipants.get('alice');
    joinedParticipants.delete('alice');
    joined.emit('participantLeft', departedViewer);
    await page.waitForChanges();

    expect(root.shadowRoot.querySelector('.validation-status').textContent.trim()).toBe(
      'No one is viewing your screen.'
    );
    expect(
      root.shadowRoot.querySelector('.validation-border').classList.contains('none-active')
    ).toBe(true);

    reportViewerVisibility(meeting.participants, 'bob', true);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.all-visible')).not.toBeNull();
  });

  it('does not accept an acknowledgement from the previous screen after switching shares', async () => {
    const { page, root, self, meeting, screenShareTrack } = await createVisibilityView({
      viewerNames: ['alice'],
    });
    reportViewerVisibility(meeting.participants, 'alice', true);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.all-visible')).not.toBeNull();

    self.producers = [{ id: 'producer-2', kind: 'video', appData: { screenShare: true } }];
    self.emit('screenShareUpdate', {
      screenShareEnabled: true,
      screenShareTracks: { video: screenShareTrack },
    });
    reportViewerVisibility(meeting.participants, 'alice', true);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.none-visible')).not.toBeNull();

    reportViewerVisibility(meeting.participants, 'alice', true, 'producer-2');
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.all-visible')).not.toBeNull();
  });

  it('shows at most the configured avatar count and lets the sharer see participant names', async () => {
    const { page, root, meeting } = await createVisibilityView({
      viewerNames: ['alice', 'bob', 'charlie', 'dana', 'eve'],
      maxVisibleViewerAvatars: 2,
    });
    reportViewerVisibility(meeting.participants, 'alice', true);
    await page.waitForChanges();

    const status = root.shadowRoot.querySelector('.validation-status');
    expect(status.querySelectorAll('.avatar-trigger')).toHaveLength(2);
    expect(status.querySelector('.more-avatar').textContent.trim()).toBe('+2');

    status.querySelector<HTMLElement>('.avatar-trigger').click();
    await page.waitForChanges();
    expect(status.querySelector('.viewer-name').textContent).toBe('bob');

    status.querySelector<HTMLElement>('.more-avatar').click();
    await page.waitForChanges();
    expect(status.querySelectorAll('.remaining-viewer')).toHaveLength(2);
    expect(status.querySelector('.remaining-viewers').textContent).toContain('dana');
    expect(status.querySelector('.remaining-viewers').textContent).toContain('eve');
  });

  it('uses customized visibility labels for the no-viewer, partial, and all-viewing states', async () => {
    const { page, root, meeting } = await createVisibilityView({
      viewerNames: ['alice', 'bob'],
      t: useLanguage({
        'screenshare.visibility.none': 'Nobody watching',
        'screenshare.visibility.not_viewing': 'Still waiting:',
        'screenshare.visibility.all': 'All watching',
      }),
    });
    expect(root.shadowRoot.querySelector('.validation-status').textContent.trim()).toBe(
      'Nobody watching'
    );

    reportViewerVisibility(meeting.participants, 'alice', true);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.validation-status').textContent).toContain(
      'Still waiting:'
    );

    reportViewerVisibility(meeting.participants, 'bob', true);
    await page.waitForChanges();
    expect(root.shadowRoot.querySelector('.validation-status').textContent.trim()).toBe(
      'All watching'
    );
  });
});

describe('<rtk-screenshare-view> remote screen-share visibility', () => {
  it('notifies the sharer only after the current video track is mounted and playing', async () => {
    const { page, root, video, screenShareTrack, broadcastMessage } = await createVisibilityView({
      remote: true,
    });
    const oldVideoTrack = { id: 'previous-track', kind: 'video' } as MediaStreamTrack;
    setPlayingVideoTrack(video, oldVideoTrack);

    video.dispatchEvent(new Event('playing'));
    await page.waitForChanges();
    expect(broadcastMessage).not.toHaveBeenCalled();
    expect(root.shadowRoot.querySelector('.validation-status')).toBeNull();

    video.srcObject = { getVideoTracks: () => [screenShareTrack] } as unknown as MediaStream;
    video.dispatchEvent(new Event('loadeddata'));
    await page.waitForChanges();
    expect(broadcastMessage).toHaveBeenCalledTimes(1);
    expect(broadcastMessage).toHaveBeenLastCalledWith(
      SCREEN_SHARE_VISIBILITY_MESSAGE,
      { sharerId: 'sharer', producerId: 'producer-1', visible: true },
      { participantIds: ['sharer'] }
    );

    video.dispatchEvent(new Event('playing'));
    expect(broadcastMessage).toHaveBeenCalledTimes(1);
  });

  it('notifies the sharer when the selected tab changes and when video playback ends', async () => {
    const { video, screenShareTrack, meeting, broadcastMessage } = await createVisibilityView({
      remote: true,
    });
    setPlayingVideoTrack(video, screenShareTrack);
    video.dispatchEvent(new Event('playing'));
    expect(broadcastMessage).toHaveBeenCalledTimes(1);

    meeting.meta.selfActiveTab = { type: 'screenshare', id: 'different-share' };
    meeting.meta.emit('selfTabUpdate');
    expect(broadcastMessage).toHaveBeenLastCalledWith(
      SCREEN_SHARE_VISIBILITY_MESSAGE,
      { sharerId: 'sharer', producerId: 'producer-1', visible: false },
      { participantIds: ['sharer'] }
    );

    meeting.meta.selfActiveTab = { type: 'screenshare', id: 'sharer' };
    meeting.meta.emit('activeTabUpdate');
    expect(broadcastMessage).toHaveBeenCalledTimes(3);
    expect(broadcastMessage.mock.calls[2][1].visible).toBe(true);

    video.dispatchEvent(new Event('ended'));
    expect(broadcastMessage).toHaveBeenCalledTimes(4);
    expect(broadcastMessage.mock.calls[3][1].visible).toBe(false);
  });

  it('does not report the next share as visible until its video track replaces the old track', async () => {
    const { page, video, sharer, joined, broadcastMessage, screenShareTrack } =
      await createVisibilityView({ remote: true });
    setPlayingVideoTrack(video, screenShareTrack);
    video.dispatchEvent(new Event('playing'));
    expect(broadcastMessage.mock.calls[0][1].visible).toBe(true);

    const nextVideoTrack = { id: 'next-track', kind: 'video' } as MediaStreamTrack;
    sharer.producers = [{ producerId: 'producer-2', kind: 'video', screenShare: true }];
    sharer.screenShareTracks.video = nextVideoTrack;
    joined.emit('screenShareUpdate', sharer);
    await page.waitForChanges();
    expect(broadcastMessage.mock.calls[1][1]).toEqual({
      sharerId: 'sharer',
      producerId: 'producer-1',
      visible: false,
    });

    video.dispatchEvent(new Event('playing'));
    expect(broadcastMessage).toHaveBeenCalledTimes(2);

    video.srcObject = { getVideoTracks: () => [nextVideoTrack] } as unknown as MediaStream;
    video.dispatchEvent(new Event('loadeddata'));
    expect(broadcastMessage).toHaveBeenCalledTimes(3);
    expect(broadcastMessage.mock.calls[2][1]).toEqual({
      sharerId: 'sharer',
      producerId: 'producer-2',
      visible: true,
    });
  });

  it('sends a fresh visibility report when the remote sharer rejoins with the same ID', async () => {
    const { page, video, screenShareTrack, sharer, joined, joinedParticipants, broadcastMessage } =
      await createVisibilityView({ remote: true });
    setPlayingVideoTrack(video, screenShareTrack);
    video.dispatchEvent(new Event('playing'));
    expect(broadcastMessage).toHaveBeenCalledTimes(1);

    const rejoinedSharer = createVisibilityParticipant('sharer', 'Sharer rejoined');
    rejoinedSharer.screenShareEnabled = true;
    rejoinedSharer.screenShareTracks.video = screenShareTrack;
    rejoinedSharer.producers = sharer.producers;
    joinedParticipants.set('sharer', rejoinedSharer);
    joined.emit('participantJoined', rejoinedSharer);
    await page.waitForChanges();

    expect(broadcastMessage).toHaveBeenCalledTimes(2);
    expect(broadcastMessage.mock.calls[1][1]).toEqual({
      sharerId: 'sharer',
      producerId: 'producer-1',
      visible: true,
    });
  });

  it('reports visibility again after the sharer participant object is replaced', async () => {
    const { page, root, video, screenShareTrack, sharer, joinedParticipants, broadcastMessage } =
      await createVisibilityView({ remote: true });
    setPlayingVideoTrack(video, screenShareTrack);
    video.dispatchEvent(new Event('playing'));
    expect(broadcastMessage).toHaveBeenCalledTimes(1);

    const replacementSharer = createVisibilityParticipant('sharer', 'Sharer rejoined');
    replacementSharer.screenShareEnabled = true;
    replacementSharer.screenShareTracks.video = screenShareTrack;
    replacementSharer.producers = sharer.producers;
    joinedParticipants.set('sharer', replacementSharer);
    (root as HTMLRtkScreenshareViewElement).participant = replacementSharer as unknown as Peer;
    await page.waitForChanges();

    expect(broadcastMessage).toHaveBeenCalledTimes(2);
    expect(broadcastMessage.mock.calls[1][1]).toEqual({
      sharerId: 'sharer',
      producerId: 'producer-1',
      visible: true,
    });
  });

  it('retries a visibility report after the SDK rejects the broadcast', async () => {
    const { video, screenShareTrack, logger, broadcastMessage } = await createVisibilityView({
      remote: true,
    });
    const broadcastError = new Error('Meeting disconnected');
    broadcastMessage.mockRejectedValueOnce(broadcastError);
    setPlayingVideoTrack(video, screenShareTrack);
    video.dispatchEvent(new Event('playing'));
    await Promise.resolve();

    expect(logger.error).toHaveBeenCalledWith('rtkScreenshareView::validateScreenShare', {
      error: broadcastError,
    });
    video.dispatchEvent(new Event('playing'));
    expect(broadcastMessage).toHaveBeenCalledTimes(2);
    expect(broadcastMessage.mock.calls[1][1]).toEqual({
      sharerId: 'sharer',
      producerId: 'producer-1',
      visible: true,
    });
  });

  it('notifies the sharer that viewing stopped and removes listeners when the view disconnects', async () => {
    const { root, video, screenShareTrack, meeting, joined, broadcastMessage } =
      await createVisibilityView({ remote: true });
    setPlayingVideoTrack(video, screenShareTrack);
    video.dispatchEvent(new Event('playing'));
    root.remove();

    expect(broadcastMessage).toHaveBeenCalledTimes(2);
    expect(broadcastMessage.mock.calls[1][1].visible).toBe(false);
    expect(meeting.participants.listenerCount('broadcastedMessage')).toBe(0);
    expect(joined.listenerCount('participantJoined')).toBe(0);
    expect(joined.listenerCount('participantLeft')).toBe(0);
    expect(meeting.meta.listenerCount('selfTabUpdate')).toBe(0);
    expect(meeting.meta.listenerCount('activeTabUpdate')).toBe(0);
  });
});

describe('<rtk-screenshare-view> animated visibility border', () => {
  it('registers the animatable progress property only once across screen-share views', async () => {
    const originalCss = Object.getOwnPropertyDescriptor(globalThis, 'CSS');
    const registerProperty = jest.fn();
    Object.defineProperty(globalThis, 'CSS', {
      configurable: true,
      value: { registerProperty },
    });

    try {
      const firstView = await createVisibilityView({ viewerNames: ['alice'] });
      const secondView = await createVisibilityView({ viewerNames: ['bob'] });

      expect(firstView.root.shadowRoot.querySelector('.validation-border')).not.toBeNull();
      expect(secondView.root.shadowRoot.querySelector('.validation-border')).not.toBeNull();
      expect(registerProperty).toHaveBeenCalledTimes(1);
      expect(registerProperty).toHaveBeenCalledWith({
        name: '--rtk-screenshare-view-progress',
        syntax: '<percentage>',
        inherits: true,
        initialValue: '0%',
      });
    } finally {
      if (originalCss) {
        Object.defineProperty(globalThis, 'CSS', originalCss);
      } else {
        Reflect.deleteProperty(globalThis, 'CSS');
      }
    }
  });
});
