import { parseRichText } from './chat';

describe('util:chat:parseRichText()', () => {
  test('should keep a ">" that is not at the start of the line', () => {
    expect(parseRichText('5 > 3')).toEqual([{ type: 'plain_text', content: '5 > 3' }]);
    expect(parseRichText('a > b > c')).toEqual([{ type: 'plain_text', content: 'a > b > c' }]);
  });

  test('should turn a leading ">" into a quote marker', () => {
    expect(parseRichText('> hello')).toEqual([
      { type: 'q', content: [] },
      { type: 'plain_text', content: ' hello' },
    ]);
  });
});
