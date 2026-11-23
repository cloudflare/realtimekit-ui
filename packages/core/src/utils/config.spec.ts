import { createDefaultConfig } from '../lib/default-ui-config';
import { extendConfig, generateConfig } from './config';

describe('setup media controls', () => {
  it('shows both device menus in the default and preset-generated configs', () => {
    const configs = [createDefaultConfig(), generateConfig({ designTokens: {} }, {} as any).config];

    for (const config of configs) {
      expect(config.root['div#setupcontrols-media']).toEqual([
        ['rtk-mic-toggle', { size: 'sm' }],
        ['rtk-camera-toggle', { size: 'sm' }],
      ]);
    }
  });
});

describe('extendConfig()', () => {
  it('should work with just designTokens', () => {
    const newConfig = extendConfig({ designTokens: { logo: 'new-logo' } });

    expect(newConfig.designTokens.logo).toBe('new-logo');
    expect(newConfig.designTokens.spacingBase).toBe(4);
    expect(newConfig.config.videoFit).toBe('cover');
  });

  it('should work with root property', () => {
    const newConfig = extendConfig({
      root: {
        'rtk-name-tag.someState': ['rtk-avatar'],
      },
    });

    expect(newConfig.designTokens.spacingBase).toBe(4);
    expect(newConfig.root['rtk-name-tag.someState'][0]).toBe('rtk-avatar');
  });
});
