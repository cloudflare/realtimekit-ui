import { Component, Host, h, Prop, Watch, Event, EventEmitter } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import type { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKPermissionsPreset } from '@cloudflare/realtimekit';

export type AIView = 'default' | 'sidebar' | 'full-screen';

/**
 * An AI assistant component for meeting interactions.
 *
 * Provides AI-powered features like transcription, summarization, and
 * intelligent meeting assistance. Can be displayed in different view modes.
 */
@Component({
  tag: 'rtk-ai',
  styleUrl: 'rtk-ai.css',
  shadow: true,
})
export class RtkAi {
  private keydownListener: (e: KeyboardEvent) => void;

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

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  connectedCallback() {
    this.viewChanged(this.view);
  }

  disconnectedCallback() {
    this.keydownListener && document.removeEventListener('keydown', this.keydownListener);
  }

  @Watch('view')
  viewChanged(view: AIView) {
    if (view === 'full-screen') {
      this.keydownListener = (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      };
      document.addEventListener('keydown', this.keydownListener);
    }
  }

  private close = () => {
    this.stateUpdate.emit({ activeAI: false });
  };

  render() {
    if (!this.meeting) return null;
    if (
      !(this.meeting?.self?.permissions as RTKPermissionsPreset).transcriptionEnabled ||
      !this.states?.activeAI
    ) {
      return null;
    }

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
        {/* Full screen view, shows the navigation header */}
        <h3 class="title">{this.t('ai.transcriptions')}</h3>

        {/* Close button */}
        <rtk-button
          variant="ghost"
          kind="icon"
          class="close"
          onClick={this.close}
          aria-label={this.t('close')}
        >
          <rtk-icon icon={this.iconPack.dismiss} />
        </rtk-button>

        <rtk-ai-transcriptions {...defaults}></rtk-ai-transcriptions>
      </Host>
    );
  }
}
