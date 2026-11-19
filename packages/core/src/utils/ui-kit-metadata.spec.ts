import { getUiKitSdkName, reportUiKitMetadata, setUiKitSdkName } from './ui-kit-metadata';

const SDK_NAME_KEY = Symbol.for('rtk.uikit.sdkName');

const sdkNameSlot = globalThis as { [SDK_NAME_KEY]?: string };

function createMeeting(setUiKitMetadata?: jest.Mock) {
  return { __internals__: { setUiKitMetadata } } as any;
}

describe('util:ui-kit-metadata', () => {
  afterEach(() => {
    delete sdkNameSlot[SDK_NAME_KEY];
  });

  test('should report html when no wrapper package has declared itself', () => {
    const setUiKitMetadata = jest.fn();

    reportUiKitMetadata(createMeeting(setUiKitMetadata));

    expect(getUiKitSdkName()).toBe('html');
    expect(setUiKitMetadata).toHaveBeenCalledTimes(1);
    expect(setUiKitMetadata).toHaveBeenCalledWith({
      sdkName: 'html',
      sdkVersion: 'UI_KIT_VERSION_PLACEHOLDER',
    });
  });

  test.each(['react', 'angular'] as const)('should report %s once the wrapper sets it', (name) => {
    const setUiKitMetadata = jest.fn();

    setUiKitSdkName(name);
    reportUiKitMetadata(createMeeting(setUiKitMetadata));

    expect(setUiKitMetadata).toHaveBeenCalledWith(expect.objectContaining({ sdkName: name }));
  });

  test('should read the name from the registered symbol shared across module copies', () => {
    const setUiKitMetadata = jest.fn();

    sdkNameSlot[SDK_NAME_KEY] = 'react';
    reportUiKitMetadata(createMeeting(setUiKitMetadata));

    expect(setUiKitMetadata).toHaveBeenCalledWith(expect.objectContaining({ sdkName: 'react' }));
  });

  test('should not throw when the core SDK does not support the method', () => {
    expect(() => reportUiKitMetadata(createMeeting())).not.toThrow();
    expect(() => reportUiKitMetadata({} as any)).not.toThrow();
    expect(() => reportUiKitMetadata(null as any)).not.toThrow();
  });

  test('should not throw when the core SDK method throws', () => {
    const setUiKitMetadata = jest.fn(() => {
      throw new Error('boom');
    });

    expect(() => reportUiKitMetadata(createMeeting(setUiKitMetadata))).not.toThrow();
  });
});
