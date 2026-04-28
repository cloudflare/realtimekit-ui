import { Component, Host, h, Prop, State, Watch } from '@stencil/core';
import { createDefaultConfig } from '../../exports';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { useLanguage, RtkI18n } from '../../lib/lang';
import { UIConfig } from '../../types/ui-config';
import { SyncWithStore } from '../../utils/sync-with-store';
import { Meeting } from '../../types/rtk-client';
import { SocketConnectionState } from '@cloudflare/realtimekit';
import { States } from '../../types/props';

/**
 * A screen that handles the idle state,
 * i.e; when you are waiting for data about the meeting, specifically the `meeting` object.
 */
@Component({
  tag: 'rtk-idle-screen',
  styleUrl: 'rtk-idle-screen.css',
  shadow: true,
})
export class RtkIdleScreen {
  /** Meeting */
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

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() joinError: string | undefined;

  @State() connectionState: SocketConnectionState['state'];

  connectedCallback() {
    this.meetingChanged(this.meeting, undefined);
    this.statesChanged(this.states);
  }

  disconnectedCallback() {
    this.meeting?.meta?.removeListener('socketConnectionUpdate', this.socketStateUpdate);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    oldMeeting?.meta?.removeListener('socketConnectionUpdate', this.socketStateUpdate);

    if (!meeting) return;

    this.connectionState = meeting.meta?.socketState?.state;
    meeting.meta?.addListener('socketConnectionUpdate', this.socketStateUpdate);
  }

  private socketStateUpdate = ({ state }: SocketConnectionState) => {
    this.connectionState = state;
    if (state === 'connected') {
      if (!this.states?.joinError) {
        this.joinError = undefined;
      }
    }
  };

  @Watch('states')
  statesChanged(states: States) {
    this.joinError = states?.joinError;
  }

  render() {
    const showSocketError =
      !!this.connectionState && this.connectionState !== 'connected' && !this.joinError;

    const errorText = this.joinError
      ? this.joinError
      : this.connectionState === 'failed'
      ? this.t('network.lost_extended')
      : this.t('network.lost');

    return (
      <Host>
        <slot>
          <div class="ctr" part="container">
            <rtk-logo meeting={this.meeting} config={this.config} t={this.t} part="logo" />
            {this.joinError || showSocketError ? (
              <div class="error-state">
                <div class="no-network-badge" part="network-badge">
                  <rtk-icon
                    size="md"
                    variant="danger"
                    icon={this.iconPack.disconnected}
                    part="network-badge-icon"
                  ></rtk-icon>
                  {errorText}
                </div>
                {this.meeting && this.joinError && (
                  <a
                    class="troubleshoot-link"
                    href={`https://test.realtime.cloudflare.com?authToken=${this.meeting.__internals__.authToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {this.t('network.troubleshoot')}
                  </a>
                )}
              </div>
            ) : (
              <rtk-spinner
                aria-label="Idle, waiting for meeting data"
                part="spinner"
                iconPack={this.iconPack}
              />
            )}
          </div>
        </slot>
      </Host>
    );
  }
}
