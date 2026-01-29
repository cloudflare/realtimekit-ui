import { Component, Event, EventEmitter, Method, h, Host, Prop, State } from '@stencil/core';
import { SyncWithStore } from '../../utils/sync-with-store';
import { IconPack, defaultIconPack } from '../../lib/icons';

@Component({
  tag: 'rtk-pinned-message-selector',
  styleUrl: 'rtk-pinned-message-selector.css',
  shadow: true,
})
export class RtkPinnedMessageSelector {
  @State() isOpen = false;

  /** */
  @Event({ eventName: 'rtkDropdownToggle' }) dropdownToggle: EventEmitter<{ open: boolean }>;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** */
  @Method()
  async close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dropdownToggle.emit({ open: false });
  }

  private toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.isOpen = !this.isOpen;
    this.dropdownToggle.emit({ open: this.isOpen });
  };

  render() {
    return (
      <Host>
        <div class="chat-header" onClick={this.toggle}>
          <div class="chat-header-label">
            <rtk-icon icon={this.iconPack.pin} size="sm" />
            Pinned Messages
          </div>
          <div class="chevron">
            <rtk-icon
              icon={this.isOpen ? this.iconPack.chevron_up : this.iconPack.chevron_down}
              size="sm"
            />
          </div>
        </div>

        <div class={{ dropdown: true, open: this.isOpen }}>Show Pinned Messages Here</div>
      </Host>
    );
  }
}
