import { isAudioFileUrl } from './notification';

describe('isAudioFileUrl', () => {
  it.each([
    'https://example.com/sounds/join.mp3',
    'http://localhost:3000/sounds/join.wav',
    'https://example.com/sounds/JOIN.OGG',
    'https://example.com/sounds/join.m4a?version=2#start',
  ])('accepts %s', (url) => {
    expect(isAudioFileUrl(url)).toBe(true);
  });

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
