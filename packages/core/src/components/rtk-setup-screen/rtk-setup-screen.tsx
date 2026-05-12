import {
  Component,
  Host,
  h,
  Prop,
  State,
  Watch,
  Event,
  EventEmitter,
  Fragment,
} from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { shorten } from '../../utils/string';
import { UIConfig } from '../../types/ui-config';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { Render } from '../../lib/render';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import gracefulStorage from '../../utils/graceful-storage';
import { SyncWithStore } from '../../utils/sync-with-store';
import { SocketConnectionState } from '@cloudflare/realtimekit';

/**
 * A screen shown before joining the meeting, where you can edit your display name,
 * and media settings.
 */
@Component({
  tag: 'rtk-setup-screen',
  styleUrl: './rtk-setup-screen.css',
  shadow: true,
})
export class RtkSetupScreen {
  private inputEl: HTMLInputElement;
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Config object */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() displayName: string;

  @State() isJoining: boolean = false;

  @State() joinError?: string;

  @State() canEditName: boolean = true;

  @State() canProduceAudio: boolean = true;

  @State() connectionState: SocketConnectionState['state'];

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting.meta.removeListener('socketConnectionUpdate', this.socketStateUpdate);
  }

  componentDidLoad() {
    this.inputEl?.focus();
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting) {
      this.connectionState = meeting.meta.socketState?.state;
      this.canEditName = meeting.self.permissions.canEditDisplayName ?? true;
      this.displayName = meeting.self.name?.trim() || (this.canEditName ? '' : 'Participant');
      meeting.meta.addListener('socketConnectionUpdate', this.socketStateUpdate);
    }
  }

  private socketStateUpdate = ({ state }: SocketConnectionState) => {
    this.connectionState = state;
    if (state === 'connected') {
      this.joinError = undefined;
    }
    if (state === 'failed') this.isJoining = false;
  };

  private join = async () => {
    if (this.displayName?.trim() !== '' && !this.isJoining) {
      if (this.connectionState !== 'connected') {
        if (this.connectionState) {
          this.joinError =
            this.connectionState === 'failed'
              ? this.t('network.lost_extended')
              : this.t('network.lost');
        }
        return;
      }

      this.isJoining = true;
      this.joinError = undefined;
      this.meeting?.self.setName(this.displayName);

      gracefulStorage.setItem('rtk-display-name', this.displayName);
      try {
        await this.meeting?.joinRoom();
      } catch (e) {
        this.isJoining = false;
        this.joinError = e?.message ? e.message : this.t('network.lost_extended');
      }
    }
  };

  render() {
    if (!this.meeting) {
      return;
    }

    const showSocketError =
      !!this.connectionState && this.connectionState !== 'connected' && !this.joinError;

    const errorText = this.joinError
      ? this.joinError
      : this.connectionState === 'failed'
      ? this.t('network.lost_extended')
      : this.t('network.lost');

    const disabled =
      this.displayName?.trim() === '' || this.connectionState !== 'connected' || this.isJoining;

    const defaults = {
      meeting: this.meeting,
      config: this.config,
      states: this.states,
      size: this.size,
      iconPack: this.iconPack,
      t: this.t,
    };

    const meetingTitle = this.meeting?.meta?.meetingTitle?.trim();

    return (
      <Host>
        <div class="container">
          <div class={'container-tile'}>
            <Render
              element="rtk-participant-tile"
              defaults={defaults}
              props={{ participant: this.meeting?.self, size: 'md', isPreview: true }}
              childProps={{ participant: this.meeting?.self, size: 'md' }}
              deepProps
            />
            <div class={'media-selectors'}>
              <rtk-microphone-selector {...defaults} variant="inline" />
              <rtk-camera-selector {...defaults} variant="inline" />
              <rtk-speaker-selector {...defaults} variant="inline" />
            </div>
          </div>
          <div class="metadata">
            {meetingTitle && meetingTitle !== '' && <div class="meeting-title">{meetingTitle}</div>}

            {this.canEditName ? (
              <Fragment>
                <div class="join-as">{this.t('setup_screen.join_in_as')}</div>

                <input
                  placeholder={this.t('setup_screen.your_name')}
                  value={this.displayName}
                  spellcheck={false}
                  autoFocus
                  ref={(el) => {
                    this.inputEl = el;
                  }}
                  onInput={(e) => {
                    this.displayName = (e.target as HTMLInputElement).value;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      this.join();
                    }
                  }}
                />
              </Fragment>
            ) : (
              <div class="uneditable-name">
                <span class="text">{this.t('setup_screen.join_in_as')} </span>{' '}
                <div class="name">{shorten(this.displayName, 20)}</div>
              </div>
            )}

            <rtk-button size="lg" kind="wide" onClick={this.join} disabled={disabled}>
              {this.isJoining ? <rtk-spinner iconPack={this.iconPack} /> : this.t('join')}
            </rtk-button>

            {(this.joinError || showSocketError) && (
              <div class="no-network-badge">
                <rtk-icon size="md" variant="danger" icon={this.iconPack.disconnected}></rtk-icon>
                {errorText}
              </div>
            )}
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
        </div>
      </Host>
    );
  }
}
