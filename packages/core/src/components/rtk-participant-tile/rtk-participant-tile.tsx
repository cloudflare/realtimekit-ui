import { Component, Host, h, Prop, Watch, State, Event, EventEmitter } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Peer } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { FlagsmithFeatureFlags } from '../../utils/flags';
import { createDefaultConfig } from '../../exports';
import { DefaultProps, Render } from '../../lib/render';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKParticipant } from '@cloudflare/realtimekit';

/**
 * A component which plays a participants video and allows for placement
 * of components like `rtk-name-tag`, `rtk-audio-visualizer` or any other component.
 */
@Component({
  tag: 'rtk-participant-tile',
  styleUrl: 'rtk-participant-tile.css',
  shadow: true,
})
export class RtkParticipantTile {
  private videoEl: HTMLVideoElement;

  private playTimeout: any;

  @State() isPinned: boolean = false;

  @State() mediaConnectionError: boolean = false;

  /** Position of name tag */
  @Prop({ reflect: true }) nameTagPosition:
    | 'bottom-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'top-left'
    | 'top-right'
    | 'top-center' = 'bottom-left';

  /** Whether tile is used for preview */
  @Prop() isPreview: boolean = false;

  /** Participant object */
  @Prop() participant!: Peer;

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

  /** Variant */
  @Prop({ reflect: true }) variant: 'solid' | 'gradient' = 'solid';

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

  /** Event triggered when tile is loaded */
  @Event() tileLoad: EventEmitter<{ participant: Peer; videoElement: HTMLVideoElement }>;

  /** Event triggered when tile is unloaded */
  @Event() tileUnload: EventEmitter<Peer>;

  private onVideoRef(el: HTMLVideoElement) {
    if (!this.participant || !this.meeting || el === this.videoEl) return;
    this.videoEl = el;
    this.participant.registerVideoElement(this.videoEl, this.isPreview);
    this.tileLoad.emit({ participant: this.participant, videoElement: this.videoEl });
  }

  connectedCallback() {
    // set videoState before initial render and initialize listeners
    if (this.meeting) this.meetingChanged(this.meeting);
    else this.participantsChanged(this.participant);
  }

  disconnectedCallback() {
    if (this.playTimeout) clearTimeout(this.playTimeout);
    if (this.participant == null) return;

    this.participant.deregisterVideoElement(this.videoEl, this.isPreview);
    (this.participant as RTKParticipant).removeListener('pinned', this.onPinned);
    (this.participant as RTKParticipant).removeListener('unpinned', this.onPinned);
    this.meeting.meta.off('mediaConnectionUpdate', this.mediaConnectionUpdateListener);
    this.tileUnload.emit(this.participant);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    this.participantsChanged(this.participant);
  }

  @Watch('participant')
  participantsChanged(participant: Peer) {
    if (!participant) return;

    if (!this.meeting) {
      if (this.isPreview) {
        this.videoEl && this.participant.registerVideoElement(this.videoEl, this.isPreview);
      }
      return;
    }

    this.isPinned = participant.isPinned;

    this.videoEl && this.participant.registerVideoElement(this.videoEl, this.isPreview);

    (participant as RTKParticipant).addListener('pinned', this.onPinned);
    (participant as RTKParticipant).addListener('unpinned', this.onPinned);
    this.meeting.meta.on('mediaConnectionUpdate', this.mediaConnectionUpdateListener.bind(this));
  }

  private mediaConnectionUpdateListener() {
    const { recv: consuming, send: producing } = this.meeting?.meta?.mediaState ?? {};

    if (consuming?.state !== 'connected' && !this.isSelf()) {
      this.mediaConnectionError = true;
    } else if (producing?.state !== 'connected' && this.isSelf()) {
      this.mediaConnectionError = true;
    } else this.mediaConnectionError = false;
  }

  private onPinned = ({ isPinned }: Peer) => {
    this.isPinned = isPinned;
  };

  private isSelf = () => this.isPreview || this.participant.id === this.meeting?.self.id;

  private isMirrored() {
    if (this.participant != null) {
      if (this.isSelf()) {
        const states = this.states;
        const mirrorVideo = states?.prefs?.mirrorVideo;
        if (typeof mirrorVideo === 'boolean') {
          return mirrorVideo;
        }
      }
    }
    return false;
  }

  private onPause = (event: Event) => {
    if (
      this.isSelf() &&
      this.meeting?.__internals__.features.hasFeature(
        FlagsmithFeatureFlags.PLAY_PARTICIPANT_TILE_VIDEO_ON_PAUSE
      )
    ) {
      this.meeting.__internals__.logger.warn(
        `Video player paused for ${this.participant.id} isSelf: ${this.isSelf()}`
      );
      // @ts-ignore
      event?.target?.play();
    }
  };
  private onPlaying = () => {
    if (this.playTimeout) clearTimeout(this.playTimeout);
  };

  render() {
    if (!this.meeting) return null;
    const defaults: DefaultProps = {
      meeting: this.meeting,
      size: this.size,
      states: this.states,
      config: this.config,
      iconPack: this.iconPack,
      t: this.t,
    };

    return (
      <Host>
        <video
          ref={(el) => this.onVideoRef(el)}
          class={{
            mirror: this.isMirrored(),
            [this.config?.config?.videoFit ?? 'cover']: true,
          }}
          onPlaying={this.onPlaying}
          onPause={this.onPause}
          autoPlay
          playsInline
          muted
          part="video"
        />
        {this.isPinned && (
          <rtk-icon
            class="pinned-icon"
            icon={this.iconPack.pin}
            aria-label={this.t('pinned')}
            part="pinned-icon"
          />
        )}
        {this.mediaConnectionError && (
          <div class="network-container" part="network-indicator">
            <rtk-icon
              class="network-icon"
              icon={this.iconPack.disconnected}
              aria-label={this.t('pinned')}
              part="pinned-icon"
            />
          </div>
        )}

        <slot>
          <Render
            element="rtk-participant-tile"
            defaults={defaults}
            childProps={{
              participant: this.participant,
            }}
            deepProps
            onlyChildren
          />
        </slot>
      </Host>
    );
  }
}
