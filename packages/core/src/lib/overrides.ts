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
}

/**
 * Default UI Kit Overrides
 */
export const defaultOverrides: Overrides = {
  disableEmojiPicker: false,
};
