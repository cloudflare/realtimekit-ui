import { Component, Host, h, Prop } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import type { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { SyncWithStore } from '../../utils/sync-with-store';

export type AIView = 'default' | 'sidebar' | 'full-screen';

/**
 * The AI panel shows meeting transcriptions. For example, participants can
 * read the conversation in the sidebar during a meeting.
 */
@Component({
  tag: 'rtk-ai',
  styleUrl: 'rtk-ai.css',
  shadow: true,
})
export class RtkAi {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** View type */
  @Prop({ reflect: true }) view: AIView = 'sidebar';

  render() {
    if (!this.meeting) return null;

    const defaults = {
      meeting: this.meeting,
      config: this.config,
      states: this.states,
      size: this.size,
      t: this.t,
      iconPack: this.iconPack,
    };

    return (
      <Host>
        <rtk-ai-transcriptions {...defaults}></rtk-ai-transcriptions>
      </Host>
    );
  }
}
