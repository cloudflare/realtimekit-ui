import type { LivestreamState } from '@cloudflare/realtimekit';
import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { Size, States } from '../../exports';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { isLiveStreamHost } from '../../utils/livestream';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';
import { SyncWithStore } from '../../utils/sync-with-store';

/**
 * A toggle button for starting/stopping livestream broadcasting.
 *
 * Only visible to users with livestream permissions. Allows hosts to
 * broadcast the meeting to external streaming platforms.
 */
@Component({
  tag: 'rtk-livestream-toggle',
  styleUrl: 'rtk-livestream-toggle.css',
  shadow: true,
})
export class RtkLivestreamToggle {
  /** Variant */
  @Prop({ reflect: true }) variant: ControlBarVariant = 'button';

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Is Livestream active */
  @State() livestreamState: LivestreamState = 'IDLE';

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  /**
   * Emit API error events
   */
  @Event({ eventName: 'rtkApiError', bubbles: true, composed: true }) apiError: EventEmitter<{
    trace: string;
    message: string;
  }>;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.clearListeners();
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    this.livestreamState = this.meeting.livestream?.state;
    this.meeting.livestream?.on('livestreamUpdate', this.livestreamStateListener);
  }

  private async toggleLivestream() {
    if (this.livestreamState === 'LIVESTREAMING') {
      try {
        await this.meeting.livestream?.stop();
      } catch {
        this.apiError.emit({
          trace: this.t('livestream.stop'),
          message: this.t('livestream.error.stop'),
        });
      }
    } else {
      try {
        await this.meeting.livestream?.start();
      } catch {
        this.apiError.emit({
          trace: this.t('livestream.start'),
          message: this.t('livestream.error.start'),
        });
      }
    }
  }

  private livestreamStateListener = (state: LivestreamState) => {
    this.livestreamState = state;
    if (state === 'LIVESTREAMING' || state === 'IDLE') {
      this.stateUpdate.emit({ activeMoreMenu: false });
    }
  };

  private clearListeners() {
    this.meeting.livestream?.removeListener('livestreamUpdate', this.livestreamStateListener);
  }

  private getLivestreamLabel() {
    switch (this.livestreamState) {
      case 'IDLE':
        return this.t('livestream.go_live');
      case 'LIVESTREAMING':
        return this.t('livestream.end_live');
      case 'WAITING_ON_MANUAL_INGESTION':
        return this.t('livestream.waiting_on_manual_ingestion');
      case 'STARTING':
        return this.t('livestream.starting');
      case 'STOPPING':
        return this.t('livestream.stopping');
      default:
        return this.t('livestream.error');
    }
  }

  private getLivestreamIcon() {
    switch (this.livestreamState) {
      case 'IDLE':
        return this.iconPack.start_livestream;
      case 'LIVESTREAMING':
        return this.iconPack.stop_livestream;
      case 'WAITING_ON_MANUAL_INGESTION':
        return this.iconPack.start_livestream;
      case 'STARTING':
      case 'STOPPING':
      default:
        return this.iconPack.stop_livestream;
    }
  }

  private isLoading = () => {
    return (
      !this.meeting || this.livestreamState === 'STARTING' || this.livestreamState === 'STOPPING'
    );
  };

  render() {
    if (!this.meeting) return null;
    if (!isLiveStreamHost(this.meeting)) return <Host data-hidden />;
    return (
      <Host>
        <rtk-controlbar-button
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          isLoading={this.isLoading()}
          class={{ 'active-livestream': this.livestreamState === 'LIVESTREAMING' }}
          onClick={() => this.toggleLivestream()}
          icon={this.getLivestreamIcon()}
          disabled={this.isLoading()}
          label={this.t(this.getLivestreamLabel())}
          variant={this.variant}
        />
      </Host>
    );
  }
}
