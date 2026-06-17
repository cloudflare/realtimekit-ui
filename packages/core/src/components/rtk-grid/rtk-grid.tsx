import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Peer } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import debounce from 'lodash/debounce';
import { DefaultProps, Render } from '../../lib/render';
import { RTKPlugin, leaveRoomState } from '@cloudflare/realtimekit';
import { isLiveStreamViewer } from '../../utils/livestream';
import { SyncWithStore } from '../../utils/sync-with-store';
import { defaultGridSize } from '../../lib/grid';

export type GridLayout = 'row' | 'column';

export interface GridSize {
  spotlight?: Exclude<Size, 'xl'>;
  mixed?: Exclude<Size, 'xl'>;
}

const MASS_ACTIONS_DEBOUNCE_TIMER = 50; // In ms

type RoomState = 'init' | 'joined' | 'waitlisted' | leaveRoomState;

/**
 * The main grid component which abstracts all the grid handling logic and renders it for you.
 */
@Component({
  tag: 'rtk-grid',
  styleUrl: 'rtk-grid.css',
  shadow: true,
})
export class RtkGrid {
  private hideSelf = false;

  @State() participants: Peer[] = [];

  @State() pinnedParticipants: Peer[] = [];

  @State() screenShareParticipants: Peer[] = [];

  @State() plugins: RTKPlugin[] = [];

  @State() emptyStage: boolean = false;

  @State() showLiveStreamPlayer: boolean = false;

  @State() canCurrentPeerHost: boolean = false;

  @State() pipSupported: boolean = false;

  @State() pipEnabled: boolean = false;

  @State() hidden: boolean = false;

  @State() roomState: RoomState;

  /** Grid Layout */
  @Prop({ reflect: true }) layout: GridLayout = 'row';

  /** The aspect ratio of each participant */
  @Prop({ reflect: true }) aspectRatio: string = '16:9';

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Gap between participants */
  @Prop({ reflect: true }) gap: number = 8;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** States */
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

  /** Grid size */
  @Prop() gridSize: GridSize = defaultGridSize;

  /** @deprecated  */
  @Prop() overrides: any = {};

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.disconnectMeeting(this.meeting);
  }

  private disconnectMeeting(meeting: Meeting) {
    if (!meeting) return;
    this.participants = [];
    this.plugins = [];

    const { self, participants, plugins } = meeting;

    self.removeListener('pinned', this.onParticipantPinned);
    self.removeListener('unpinned', this.onParticipantUnpinned);
    self.removeListener('roomLeft', this.updateRoomStateListener);
    self.removeListener('roomJoined', this.updateRoomStateListener);
    self.removeListener('screenShareUpdate', this.onSelfScreenShareUpdate);
    self.removeListener('toggleTile', this.toggleTileListener);

    plugins?.all.removeListener('stateUpdate', this.onPluginStateUpdate);

    meeting.stage?.removeListener('stageStatusUpdate', this.stageStatusListener);

    participants.removeListener('viewModeChanged', this.onViewModeChanged);
    participants.active.removeListener('participantLeft', this.onParticipantLeft);
    participants.active.removeListener('participantJoined', this.onParticipantJoined);
    participants.pinned.removeListener('participantJoined', this.onParticipantPinned);
    participants.pinned.removeListener('participantLeft', this.onParticipantUnpinned);
    participants.joined.removeListener('screenShareUpdate', this.onScreenShareUpdate);
    participants.joined.removeListener('stageStatusUpdate', this.peerStageStatusListener);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting !== null) this.disconnectMeeting(oldMeeting);
    if (meeting != null) {
      const { self, participants, plugins, stage } = meeting;
      // Check if PiP is supported and enabled
      this.pipSupported =
        this.meeting.participants.pip?.isSupported() && meeting.self.config?.pipMode;
      if (this.pipSupported) {
        this.meeting.participants.pip.init();
      }
      // Initialize values
      const { permissions } = self;

      this.roomState = self.roomState;

      const isOffStage = this.meeting.stage.status !== 'ON_STAGE';
      const isRecorder = permissions?.isRecorder;

      this.hideSelf = isOffStage || isRecorder || permissions.hiddenParticipant;

      this.participants = this.filterParticipants([
        ...participants.active.toArray(),
        ...(!self.isPinned && !this.hideSelf ? [self] : []),
      ]);

      this.pinnedParticipants = [
        ...participants.pinned.toArray(),
        ...(self.isPinned && !this.hideSelf ? [self] : []),
      ];

      this.screenShareParticipants = participants.joined
        .toArray()
        .filter((participant) => participant.screenShareEnabled);

      this.plugins = plugins?.active.toArray() || [];

      if (permissions?.stageEnabled) {
        this.canCurrentPeerHost =
          permissions.acceptStageRequests ||
          permissions.canProduceAudio === 'ALLOWED' ||
          permissions.canProduceVideo === 'ALLOWED' ||
          permissions.canProduceScreenshare === 'ALLOWED';
        this.updateStage();
      }

      this.hidden = meeting.self.hidden;

      // Add all listeners
      self.addListener('roomLeft', this.updateRoomStateListener);
      self.addListener('roomJoined', this.updateRoomStateListener);
      self.addListener('screenShareUpdate', this.onSelfScreenShareUpdate);
      self.addListener('pinned', this.onParticipantPinned);
      self.addListener('unpinned', this.onParticipantUnpinned);
      self.addListener('toggleTile', this.toggleTileListener);

      stage?.addListener('stageStatusUpdate', this.stageStatusListener);

      plugins?.all.addListener('stateUpdate', this.onPluginStateUpdate);

      participants.addListener('viewModeChanged', this.onViewModeChanged);
      participants.active.addListener('participantLeft', this.onParticipantLeft);
      participants?.joined?.on('stageStatusUpdate', this.peerStageStatusListener);
      participants.joined.addListener('screenShareUpdate', this.onScreenShareUpdate);
      participants.active.addListener('participantJoined', this.onParticipantJoined);
      participants.pinned.addListener('participantJoined', this.onParticipantPinned);
      participants.pinned.addListener('participantLeft', this.onParticipantUnpinned);

      if (meeting.stage?.status) {
        this.stageStatusListener();
      }
    }
  }

  @Watch('overrides')
  overridesChanged(_overrides: any) {
    this.updateActiveParticipants();
  }

  @Watch('screenShareParticipants')
  screenShareParticipantsChanged(participants: Peer[]) {
    const activeScreenShare = participants.length > 0;
    if (!!this.states.activeScreenShare === activeScreenShare) return;

    this.stateUpdate.emit({ activeScreenShare });
    this.states.activeScreenShare = activeScreenShare;
  }

  @Watch('plugins')
  pluginsChanged(plugins: RTKPlugin[]) {
    const activePlugin = plugins.length > 0;
    if (!!this.states.activePlugin === activePlugin) return;

    this.stateUpdate.emit({ activePlugin });
    this.states.activePlugin = activePlugin;
  }

  @Watch('pinnedParticipants')
  pinnedParticipantsChanged(participants: Peer[]) {
    const activeSpotlight = participants.length > 0;
    if (!!this.states.activeSpotlight === activeSpotlight) return;

    this.stateUpdate.emit({ activeSpotlight });
    this.states.activeSpotlight = activeSpotlight;
  }

  private invalidRoomStates = ['init', 'waitlisted', 'ended', 'kicked', 'rejected'];

  private updateActiveParticipants() {
    const { self, participants, stage } = this.meeting;
    // NOTE(ishita1805): checking hiddenParticipant for v2 meetings.
    this.hideSelf =
      this.hidden ||
      stage.status !== 'ON_STAGE' ||
      self.permissions?.isRecorder ||
      self.permissions.hiddenParticipant;

    this.participants = this.filterParticipants([
      ...participants.active.toArray().filter((p) => p.id !== self.id),
      ...(participants.viewMode === 'ACTIVE_GRID' && !self.isPinned && !this.hideSelf
        ? [self]
        : []),
    ]);

    this.pinnedParticipants = [
      ...participants.pinned.toArray().filter((p) => p.id !== self.id),
      ...(self.isPinned && !this.hideSelf ? [self] : []),
    ];

    this.screenShareParticipants = participants.joined
      .toArray()
      .filter((participant) => participant.screenShareEnabled);

    if (self.screenShareEnabled) {
      this.screenShareParticipants = this.screenShareParticipants.concat([self]);
    }

    this.updateStage();
  }

  private updateStage() {
    const { self } = this.meeting;
    if (!this.meeting) return;
    if (self?.permissions?.stageEnabled) {
      this.emptyStage = this.participants.length === 0 && this.pinnedParticipants.length === 0;
    } else {
      this.emptyStage = false;
    }
  }

  // TODO(@madhugb): Temp hack, remove this when we ship manual subscription
  private filterParticipants = (participants: Peer[]) => {
    // Only filter for non recorders
    if (this.overrides && this.overrides?.videoUnsubscribed) {
      const presetFilters = this.overrides.videoUnsubscribed.preset;
      if (presetFilters.length > 0) {
        // Filter out unsubscribed participants
        participants = participants.filter((p) => {
          const unsubscribed = presetFilters.some((regex: string) => {
            if (p.presetName === undefined) return false;
            return p.presetName.match(regex);
          });
          return !unsubscribed;
        });
      }
    }
    return participants;
  };

  private onViewModeChanged = () => {
    if (!this.meeting) return;
    this.updateActiveParticipants();
  };

  private addScreenShare(participant: Peer) {
    if (!this.screenShareParticipants.some((p) => p.id === participant.id)) {
      this.screenShareParticipants = [...this.screenShareParticipants, participant];
    }
  }

  private removeScreenShare(participant: Peer) {
    this.screenShareParticipants = this.screenShareParticipants.filter(
      (p) => p.id !== participant.id
    );
  }

  private removePinned(participant: Peer) {
    this.pinnedParticipants = this.pinnedParticipants.filter((p) => p.id !== participant.id);
  }

  private onParticipantJoined = debounce(() => {
    this.updateActiveParticipants();
  }, MASS_ACTIONS_DEBOUNCE_TIMER);

  private onParticipantLeft = debounce(() => {
    this.updateActiveParticipants();
  }, MASS_ACTIONS_DEBOUNCE_TIMER);

  private stageStatusListener = () => {
    this.updateActiveParticipants();
    this.showLiveStreamPlayer = isLiveStreamViewer(this.meeting);
    if (this.meeting.stage.status !== 'ON_STAGE') {
      this.removeScreenShare(this.meeting.self);
    }
  };

  private peerStageStatusListener = (participant) => {
    this.updateActiveParticipants();
    if (this.meeting.stage.status !== 'ON_STAGE') {
      this.removePinned(participant);
      this.removeScreenShare(participant);
    }
  };

  private onScreenShareUpdate = (participant: Peer) => {
    if (participant.screenShareEnabled) {
      this.addScreenShare(participant);
    } else {
      this.removeScreenShare(participant);
    }
  };

  private onSelfScreenShareUpdate = ({
    screenShareEnabled,
  }: Pick<Peer, 'screenShareEnabled' | 'screenShareTracks'>) => {
    if (screenShareEnabled) {
      this.addScreenShare(this.meeting.self);
    } else {
      this.removeScreenShare(this.meeting.self);
    }
  };

  private toggleTileListener = ({ hidden }: { hidden: boolean }) => {
    this.hidden = hidden;
    this.updateActiveParticipants();
  };

  private onPluginStateUpdate = (plugin: RTKPlugin, { active }: { active: boolean }) => {
    if (active) {
      if (!this.plugins.some((p) => p.id === plugin.id)) {
        this.plugins = [...this.plugins, plugin];
      }
    } else {
      this.plugins = this.plugins.filter((p) => p.id !== plugin.id);
    }
  };

  private onParticipantPinned = () => {
    this.updateActiveParticipants();
  };

  private onParticipantUnpinned = () => {
    this.updateActiveParticipants();
  };

  private updateRoomStateListener = () => {
    this.roomState = this.meeting.self.roomState;
  };

  render() {
    const defaults: DefaultProps = {
      meeting: this.meeting,
      size: this.size,
      states: this.states,
      config: this.config,
      iconPack: this.iconPack,
      t: this.t,
    };

    if (this.invalidRoomStates.includes(this.roomState)) {
      return (
        <Host>
          <div class="offline-grid">
            <rtk-icon icon={this.iconPack.join_stage} size="xl" />
            <h3>{this.t('disconnected')}</h3>
            <p>{this.t('disconnected.description')}</p>
          </div>
        </Host>
      );
    }
    if (this.roomState === 'disconnected') {
      /**
       * NOTE(ravindra-cloudflare): When disconnected but WebRTC transports are
       * still healthy, skip the offline screen — media is still flowing.
       * The grid stays visible for seamless reconnection.
       */
      const mediaState = this.meeting?.meta?.mediaState;
      const transportsHealthy =
        mediaState?.send?.state === 'connected' && mediaState?.recv?.state === 'connected';

      if (!transportsHealthy) {
        return (
          <Host>
            <div class="offline-grid">
              <rtk-icon icon={this.iconPack.disconnected} size="xl" />
              <h3>{this.t('offline')}</h3>
              <p>{this.t('offline.description')}</p>
            </div>
          </Host>
        );
      }
    }
    if (this.roomState === 'failed') {
      return (
        <Host>
          <div class="offline-grid">
            <rtk-icon icon={this.iconPack.disconnected} size="xl" />
            <h3>{this.t('failed')}</h3>
            <p>{this.t('failed.description')}</p>
          </div>
        </Host>
      );
    }
    if (this.showLiveStreamPlayer) {
      return (
        <Host>
          <rtk-livestream-player meeting={this.meeting} size={this.size} />
          <rtk-livestream-indicator meeting={this.meeting} size="sm" t={this.t} />
          <rtk-viewer-count meeting={this.meeting} variant="embedded" t={this.t} />
        </Host>
      );
    }
    if (this.emptyStage) {
      return (
        <Host>
          <div class="webinar-stage">
            <div class="center">
              {this.canCurrentPeerHost && (
                <div class="ctr" part="container">
                  <p class="message" part="message">
                    {this.t('stage.empty_host')}
                  </p>
                  <span class="description" part="description">
                    {this.t('stage.empty_host_summary')}
                  </span>
                </div>
              )}
              {!this.canCurrentPeerHost && (
                <div class="ctr" part="container">
                  <p class="message" part="message">
                    {this.t('stage.empty_viewer')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Host>
      );
    }
    return (
      <Host>
        <Render
          element="rtk-grid"
          defaults={defaults}
          childProps={{
            participants: this.participants,
            screenShareParticipants: this.screenShareParticipants,
            plugins: this.plugins,
            pinnedParticipants: this.pinnedParticipants,
            aspectRatio: this.aspectRatio,
            gap: this.gap,
            layout: this.layout,
            gridSize: this.gridSize,
          }}
          onlyChildren
        />
        <rtk-livestream-indicator meeting={this.meeting} size="sm" t={this.t} />
        <rtk-viewer-count meeting={this.meeting} variant="embedded" t={this.t} />
      </Host>
    );
  }
}
