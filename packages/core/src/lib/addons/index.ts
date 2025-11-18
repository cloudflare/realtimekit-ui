import { Meeting } from '../../types/rtk-client';
import type { UIConfig } from '../../types/ui-config';
import { generateConfig } from '../../utils/config';
import { RtkUiBuilder } from '../builder';

export type ExtendConfig = (config: Partial<UIConfig>, baseConfig: UIConfig) => UIConfig;
export interface Addon {
  /**
   * Register the addon, add event listeners, etc.
   * @param config The current UIConfig
   * @param meeting The meeting object
   * @param getBuilder A function to get the RtkUiBuilder instance for the meeting UI config
   * @returns The updated UIConfig
   */
  register: (
    config: UIConfig,
    meeting: Meeting,
    getBuilder: (config: UIConfig) => RtkUiBuilder
  ) => UIConfig;
  /**
   * Unregister the addon, cleanup any event listeners, etc.
   * @returns void
   */
  unregister: () => void;
}

/**
 * Register addons to the meeting
 * @param addons The list of addons to register
 * @param meeting The meeting object
 * @param config The current UIConfig
 * @returns The updated UIConfig
 */
export function registerAddons(addons: Addon[], meeting: Meeting, config?: UIConfig) {
  if (!config) {
    const generated = generateConfig(meeting.self.config, meeting);
    config = generated.config as UIConfig;
  }

  addons.map((addon) => {
    config = addon.register(
      config as UIConfig,
      meeting,
      (c) => new RtkUiBuilder(c) as RtkUiBuilder
    );
  });

  return config;
}
