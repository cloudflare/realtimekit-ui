import RTKNotificationsAudio, { isAudioFileUrl, isBuiltInSoundName } from './notification';

describe('isAudioFileUrl', () => {
  it.each([
    'https://example.com/sounds/join.mp3',
    'http://localhost:3000/sounds/join.wav',
    'https://example.com/sounds/JOIN.OGG',
    'https://example.com/sounds/join.m4a?version=2#start',
  ])('accepts %s', (url) => {
    expect(isAudioFileUrl(url)).toBe(true);
  });

  it.each(['/sounds/join.mp3', 'sounds/join.mp3', '../sounds/join.mp3', '//example.com/join.mp3'])(
    'rejects the relative path %s',
    (path) => {
      expect(isAudioFileUrl(path)).toBe(false);
    }
  );

  it.each([
    'javascript:alert(1)',
    'javascript:alert(1)//join.mp3',
    'data:audio/mp3;base64,AAAA',
    'data:text/html,<script>alert(1)</script>.mp3',
    'blob:https://example.com/7f3c1a52-join.mp3',
    'file:///sounds/join.mp3',
    'https://example.com/sounds/join.js',
    'https://example.com/sounds/join',
    'https://example.com/page.html?file=join.mp3',
    'not a url',
    'https://',
    'http://[bad-host/join.mp3',
    '',
  ])('rejects %s', (url) => {
    expect(isAudioFileUrl(url)).toBe(false);
  });

  it.each([undefined, null, 42, { url: 'https://example.com/join.mp3' }])(
    'rejects the non-string value %p',
    (value) => {
      expect(isAudioFileUrl(value)).toBe(false);
    }
  );
});

describe('isBuiltInSoundName', () => {
  it.each(['joined', 'left', 'message'])('accepts the built-in sound %s', (name) => {
    expect(isBuiltInSoundName(name)).toBe(true);
  });

  it.each(['toString', 'constructor', 'https://example.com/sounds/join.mp3', '', undefined, 42])(
    'rejects %p',
    (value) => {
      expect(isBuiltInSoundName(value)).toBe(false);
    }
  );
});

describe('RTKNotificationsAudio', () => {
  const JOIN_SOUND_URL =
    'https://rtk-assets.realtime.cloudflare.com/ui-kit/sounds/notification_join.mp3';
  const MESSAGE_SOUND_URL =
    'https://rtk-assets.realtime.cloudflare.com/ui-kit/sounds/notification_message.mp3';

  function createAudio(meeting = {}) {
    const audioElement = {
      src: '',
      volume: 1,
      play: jest.fn(() => Promise.resolve()),
      setSinkId: jest.fn(() => Promise.resolve()),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(audioElement as any);
    const audio = new RTKNotificationsAudio(meeting as any);
    return { audio, audioElement };
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('plays a built-in sound by its name', () => {
    const { audio, audioElement } = createAudio();

    audio.play('joined');

    expect(audioElement.src).toBe(JOIN_SOUND_URL);
    expect(audioElement.volume).toBe(0.3);
    expect(audioElement.play).toHaveBeenCalledTimes(1);
  });

  it('plays an audio file from a URL', () => {
    const { audio, audioElement } = createAudio();

    audio.playUrl('https://example.com/sounds/hand.mp3');

    expect(audioElement.src).toBe('https://example.com/sounds/hand.mp3');
    expect(audioElement.play).toHaveBeenCalledTimes(1);
  });

  it('does not play a URL that is not an audio file URL', () => {
    const { audio, audioElement } = createAudio();

    audio.playUrl('javascript:alert(1)');

    expect(audioElement.src).toBe('');
    expect(audioElement.play).not.toHaveBeenCalled();
  });

  it('does not start a second sound until the duration of the first sound is over', () => {
    const { audio, audioElement } = createAudio();

    audio.playUrl('https://example.com/sounds/hand.mp3', 1000);
    audio.play('message');

    expect(audioElement.src).toBe('https://example.com/sounds/hand.mp3');
    expect(audioElement.play).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    audio.play('message');

    expect(audioElement.src).toBe(MESSAGE_SOUND_URL);
    expect(audioElement.play).toHaveBeenCalledTimes(2);
  });

  it('plays sounds on the speaker that setDevice gets', async () => {
    const { audio, audioElement } = createAudio();

    await audio.setDevice('speaker-1');

    expect(audioElement.setSinkId).toHaveBeenCalledWith('speaker-1');
  });

  it('does not change the speaker in Firefox', async () => {
    const firefoxMeeting = { __internals__: { browserSpecs: { isFirefox: () => true } } };
    const { audio, audioElement } = createAudio(firefoxMeeting);

    await audio.setDevice('speaker-1');

    expect(audioElement.setSinkId).not.toHaveBeenCalled();
  });
});
