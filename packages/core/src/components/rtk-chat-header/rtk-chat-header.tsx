import { Component, h, Host } from '@stencil/core';

@Component({
  tag: 'rtk-chat-header',
  styleUrl: 'rtk-chat-header.css',
  shadow: true,
})
export class RtkChatHeader {
  private $pinnedSelector?: HTMLRtkPinnedMessageSelectorElement;
  private $chatSelector?: HTMLRtkChatSelectorElement;

  private onPinnedToggle = async (e: CustomEvent<{ open: boolean }>) => {
    if (e.detail?.open) {
      await this.$chatSelector?.close?.();
    }
  };

  private onChatToggle = async (e: CustomEvent<{ open: boolean }>) => {
    if (e.detail?.open) {
      await this.$pinnedSelector?.close?.();
    }
  };

  render() {
    return (
      <Host>
        <rtk-pinned-message-selector
          ref={(el) => (this.$pinnedSelector = el)}
          onRtkDropdownToggle={this.onPinnedToggle}
        ></rtk-pinned-message-selector>
        <rtk-chat-selector
          ref={(el) => (this.$chatSelector = el)}
          onRtkDropdownToggle={this.onChatToggle}
        ></rtk-chat-selector>
      </Host>
    );
  }
}
