import { Component, Host, h, Prop } from '@stencil/core';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RtkI18n, useLanguage } from '../../lib/lang';

/**
 * A menu list component.
 *
 * @slot - Default slot
 */
@Component({
  tag: 'rtk-menu-list',
  styleUrl: 'rtk-menu-list.css',
  shadow: true,
})
export class RtkMenuList {
  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Variant */
  @Prop() menuVariant: 'primary' | 'secondary' = 'secondary';

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  render() {
    return (
      <Host class={{ [this.menuVariant]: true }}>
        <slot></slot>
      </Host>
    );
  }
}
