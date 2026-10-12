import clone from './clone';

describe('util:clone()', () => {
  const original = globalThis.structuredClone;

  afterEach(() => {
    globalThis.structuredClone = original;
  });

  test('should deep clone an object', () => {
    const source = { a: { b: [1, 2, 3] } };
    const copy = clone(source);

    expect(copy).toEqual(source);
    expect(copy.a).not.toBe(source.a);
  });

  test('should fall back to a deep clone when structuredClone is not available', () => {
    delete (globalThis as any).structuredClone;

    const source = { a: { b: [1, 2, 3] } };
    const copy = clone(source);

    expect(copy).toEqual(source);
    expect(copy.a).not.toBe(source.a);
  });
});
