import { Component, Host, h, Prop, State, Watch } from '@stencil/core';
import type { SocketConnectionState } from '@cloudflare/realtimekit';
import { Meeting } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Overrides, defaultOverrides } from '../../lib/overrides';
import { DefaultProps, Render } from '../../lib/render';
import { SyncWithStore } from '../../utils/sync-with-store';
import { formatName } from '../../utils/string';

const MIN_POLL_INTERVAL = 5000;

/** Regular participants carry recorderType 'NONE'; only RECORDER / LIVESTREAMER are bots */
const isRecorder = (recorderType?: string) => !!recorderType && recorderType !== 'NONE';

/** First word of the display name: "John Doe" -> "John" */
const firstName = (name: string) => formatName(name || '').split(/\s+/)[0];

interface PreviewPeer {
  userId: string;
  name: string;
  picture?: string;
}

/**
 * A component which shows the participants already in the meeting, before you join it.
 * Renders overlapping avatars with a caption like "John, Jane and 25 others in the meeting".
 */
@Component({
  tag: 'rtk-participants-preview',
  styleUrl: 'rtk-participants-preview.css',
  shadow: true,
})
export class RtkParticipantsPreview {
  private timer: ReturnType<typeof setInterval>;

  private inFlight = false;

  private destroyed = false;

  /** Maximum number of avatars to show; the rest collapse into a "+N" tile */
  @Prop() maxAvatars: number = 5;

  /** Poll interval in milliseconds (minimum 5000) */
  @Prop() pollInterval: number = 10000;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Config object */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

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

  /** UI Overrides */
  @SyncWithStore()
  @Prop()
  overrides: Overrides = defaultOverrides;

  @State() peers: PreviewPeer[] = [];

  @State() status: 'loading' | 'ready' | 'error' = 'loading';

  connectedCallback() {
    this.destroyed = false;
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.destroyed = true;
    this.disconnectMeeting(this.meeting);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting) {
      this.disconnectMeeting(oldMeeting);
      // Never show the previous meeting's participants while the new one connects
      this.peers = [];
      this.status = 'loading';
    }
    if (!meeting) return;

    meeting.meta?.addListener('socketConnectionUpdate', this.socketStateUpdate);
    meeting.self?.addListener('roomJoined', this.onRoomJoined);

    if (this.isConnected()) this.start();
  }

  @Watch('overrides')
  overridesChanged() {
    if (this.isDisabled()) {
      this.stopPolling();
    } else if (this.isConnected()) {
      this.start();
    }
  }

  @Watch('pollInterval')
  pollIntervalChanged() {
    if (this.timer) {
      this.stopPolling();
      this.startPolling();
    }
  }

  private disconnectMeeting = (meeting: Meeting) => {
    this.stopPolling();
    meeting?.meta?.removeListener('socketConnectionUpdate', this.socketStateUpdate);
    meeting?.self?.removeListener('roomJoined', this.onRoomJoined);
  };

  private isDisabled() {
    return !!this.overrides?.disableParticipantsPreview;
  }

  private isConnected() {
    return this.meeting?.meta?.socketState?.state === 'connected';
  }

  private socketStateUpdate = ({ state }: SocketConnectionState) => {
    if (state === 'connected') {
      this.start();
    } else {
      // Keep the last known list, just stop asking until we reconnect
      this.stopPolling();
    }
  };

  private onRoomJoined = () => {
    this.stopPolling();
  };

  private start() {
    if (this.isDisabled() || this.meeting?.self?.roomJoined) return;
    this.fetchPeers();
    this.startPolling();
  }

  private startPolling() {
    if (this.timer || this.destroyed || this.isDisabled()) return;
    const interval = Math.max(MIN_POLL_INTERVAL, this.pollInterval || 0);
    this.timer = setInterval(this.fetchPeers, interval);
  }

  private stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private fetchPeers = async () => {
    if (this.inFlight || this.destroyed || this.isDisabled() || !this.isConnected()) return;
    this.inFlight = true;
    try {
      const { meeting } = this;
      const res = await meeting.participants.getParticipantsInMeetingPreJoin();
      // Drop late responses (unmounted, disabled, meeting swapped); undecodable ones keep the list
      if (this.destroyed || this.isDisabled() || this.meeting !== meeting || !res) return;

      const seen = new Set<string>();
      this.peers = (res.peers ?? [])
        .filter(
          (p) => !p.waitlisted && !p.flags?.hiddenParticipant && !isRecorder(p.flags?.recorderType)
        )
        .filter((p) => {
          if (seen.has(p.userId)) return false;
          seen.add(p.userId);
          return true;
        })
        .map((p) => ({
          userId: p.userId,
          name: p.displayName ?? '',
          picture: p.displayPictureUrl,
        }));
      this.status = 'ready';
    } catch {
      if (this.status === 'loading') this.status = 'error';
    } finally {
      this.inFlight = false;
    }
  };

  /**
   * 1 -> "John is in the meeting"
   * 2 -> "John and Jane are in the meeting"
   * N -> "John, Jane and 25 others in the meeting"
   */
  private getCaption() {
    const { t, peers } = this;
    const [a, b] = peers.map((p) => firstName(p.name));
    if (peers.length === 1) return `${a} ${t('setup_screen.is_in_meeting')}`;
    if (peers.length === 2) {
      return `${a} ${t('setup_screen.and')} ${b} ${t('setup_screen.are_in_meeting')}`;
    }
    const rest = peers.length - 2;
    const others = rest === 1 ? t('setup_screen.other') : t('setup_screen.others');
    return `${a}, ${b} ${t('setup_screen.and')} ${rest} ${others} ${t('setup_screen.in_meeting')}`;
  }

  render() {
    if (this.isDisabled()) return <Host data-hidden />;

    if (!this.meeting) return null;

    // Not critical: stay out of the layout until we have data, so it does not jump
    if (this.status !== 'ready') return <Host data-hidden />;

    if (this.peers.length === 0) {
      return (
        <Host>
          <span part="empty">{this.t('setup_screen.no_one_here')}</span>
        </Host>
      );
    }

    const defaults: DefaultProps = {
      meeting: this.meeting,
      size: this.size,
      states: this.states,
      config: this.config,
      iconPack: this.iconPack,
      t: this.t,
    };

    const max = Math.max(0, this.maxAvatars ?? 5);
    const visible = this.peers.slice(0, max);
    const overflow = this.peers.length - visible.length;
    const moreLabel = `${overflow} ${this.t('setup_screen.more_in_meeting')}`;

    return (
      <Host
        role="group"
        aria-label={`${this.peers.length} ${this.t('setup_screen.participants_in_meeting')}`}
      >
        {(visible.length > 0 || overflow > 0) && (
          <div class="stack" part="stack">
            {visible.map((p, i) => (
              <rtk-tooltip
                key={p.userId}
                label={formatName(p.name)}
                placement="top"
                // later avatars stack on top; hover raises above all (see css)
                style={{ zIndex: `${i + 1}` }}
              >
                <Render
                  element="rtk-avatar"
                  defaults={defaults}
                  props={{ participant: p, size: 'sm', part: 'avatar' }}
                />
              </rtk-tooltip>
            ))}
            {overflow > 0 && (
              <rtk-tooltip
                label={moreLabel}
                placement="top"
                style={{ zIndex: `${visible.length + 1}` }}
              >
                <div class="more" part="more">
                  +{overflow}
                </div>
              </rtk-tooltip>
            )}
          </div>
        )}
        <p class="caption" part="caption">
          {this.getCaption()}
        </p>
      </Host>
    );
  }
}
