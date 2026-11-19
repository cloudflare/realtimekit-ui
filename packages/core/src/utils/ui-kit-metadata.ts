import type { Meeting } from '../types/rtk-client';

export type UiKitSdkName = 'html' | 'react' | 'angular';

/**
 * The literal below is replaced with the released package version by `prepublish.js`.
 * Builds that are not published (local, dev) report it as is.
 */
const UI_KIT_VERSION = 'UI_KIT_VERSION_PLACEHOLDER';

/**
 * The wrapper packages load components from the loader bundle, which carries its own copy of
 * this module, separate from the copy behind the main entry. The registered symbol is the one
 * slot both copies can see.
 */
const SDK_NAME_KEY = Symbol.for('rtk.uikit.sdkName');

const sdkNameSlot = globalThis as { [SDK_NAME_KEY]?: UiKitSdkName };

/**
 * Declares which UI Kit package is in use. Called by the React and Angular wrapper packages.
 * @internal
 */
export function setUiKitSdkName(name: UiKitSdkName) {
  sdkNameSlot[SDK_NAME_KEY] = name;
}

export function getUiKitSdkName(): UiKitSdkName {
  return sdkNameSlot[SDK_NAME_KEY] ?? 'html';
}

/** Tells the core SDK which UI Kit package and version is driving the meeting. */
export function reportUiKitMetadata(meeting: Meeting) {
  try {
    // Older core SDK versions do not have this method
    meeting?.__internals__?.setUiKitMetadata?.({
      sdkVersion: UI_KIT_VERSION,
      sdkName: getUiKitSdkName(),
    });
  } catch {
    // Reporting must never break the meeting
  }
}
