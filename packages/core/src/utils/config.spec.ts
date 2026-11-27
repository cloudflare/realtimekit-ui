import { createDefaultConfig } from '../lib/default-ui-config';
import { extendConfig, generateConfig } from './config';

describe('setup media controls', () => {
  it('shows both device menus in the default and preset-generated configs', () => {
    const configs = [createDefaultConfig(), generateConfig({ designTokens: {} as any }, {} as any).config];

    for (const config of configs) {
      expect(config.root['div#setupcontrols-media']).toEqual([
        ['rtk-mic-toggle', { size: 'sm' }],
        ['rtk-camera-toggle', { size: 'sm' }],
      ]);
    }
  });
});

describe('generateConfig() notification config', () => {
  it('returns the default notification settings', () => {
    const { config } = generateConfig({ designTokens: {} as any }, {} as any).config;

    expect(config.notifications.participant_joined).toBe(true);
    expect(config.notifications.chat_message_edited).toBe(false);
    expect(config.notification_sounds.chat_new_message).toBe(true);
    expect(config.notification_duration.participant_joined_waitlist).toBe(4000);
    expect(config.notification_sound_urls.chat_new_message).toBe(
      'https://rtk-assets.realtime.cloudflare.com/ui-kit/sounds/notification_message.mp3'
    );
    expect(config.participant_joined_sound_notification_limit).toBe(3);
    expect(config.participant_chat_message_sound_notification_limit).toBe(10);
    expect(config.visible_notifications_limit).toBe(5);
    expect(config.videoFit).toBe('cover');
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
