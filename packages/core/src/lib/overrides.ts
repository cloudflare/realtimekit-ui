/**
 * Initialisation overrides for UI component behavior.
 * These values are passed through rtk-ui-provider or rtk-meeting
 * and take effect across all child components.
 */
export interface Overrides {
  /**
   * Disables the emoji picker button in chat composer.
   * When true, users cannot insert emojis into chat messages.
   */
  disableEmojiPicker?: boolean;
  /**
   * Disables private chat even when allowed by the preset.
   * Recommended: Disable private chat via preset.
   */
  disablePrivateChat?: boolean;
}

/**
 * Default UI Kit Overrides
 */
export const defaultOverrides: Overrides = {
  disableEmojiPicker: false,
  disablePrivateChat: false,
};
