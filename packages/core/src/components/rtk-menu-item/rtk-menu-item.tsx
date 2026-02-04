import { Size } from '../../types/props';
import { Component, Host, h, Prop } from '@stencil/core';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { SyncWithStore } from '../../utils/sync-with-store';
import { useLanguage, RtkI18n } from '../../lib/lang';

/**
 * A menu item component.
 *
 * @slot - Default slot
 * @slot start - Slot for content you want at the start
 * @slot end - Slot for content you want at the end
 */
@Component({
  tag: 'rtk-menu-item',
  styleUrl: 'rtk-menu-item.css',
  shadow: true,
})
export class RtkMenuItem {
  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Variant */
  @Prop() menuVariant: 'primary' | 'secondary' = 'secondary';

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  render() {
    return (
      <Host class={{ [this.menuVariant]: true }}>
        <slot name="start" />
        <slot></slot>
        <slot name="end" />
      </Host>
    );
  }
}
