import {
  Component,
  Host,
  h,
  Prop,
  Watch,
  State,
  writeTask,
  Element,
  Event,
  EventEmitter,
} from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Peer } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import {
  exitFullScreen,
  isFullScreenEnabled,
  isFullScreenSupported,
  requestFullScreen,
} from '../../utils/full-screen';
import { SyncWithStore } from '../../utils/sync-with-store';
import { BroadcastMessagePayload, RTKSelf } from '@cloudflare/realtimekit';

const SCREEN_SHARE_VISIBILITY_MESSAGE = '__rtk_screenshare_visibility__';
let isScreenShareProgressRegistered = false;

/**
 * Displays a participant's shared screen.
 *
 * For a local share, shows which joined participants are not currently viewing it.
 */
@Component({
  tag: 'rtk-screenshare-view',
  styleUrl: 'rtk-screenshare-view.css',
  shadow: true,
})
export class RtkScreenshareView {
  private videoEl: HTMLVideoElement;

  private trackedScreenShareProducerId?: string;

  private lastNotifiedVisibility?: { producerId: string; visible: boolean };

  private pendingViewerIds = new Set<string>();

  // Stencil batches state assignments, but does not observe Set mutations.
  @State() viewerVisibilityRevision = 0;

  private handleScreenShareUpdate = ({
    screenShareEnabled,
    screenShareTracks,
  }: Pick<Peer, 'screenShareEnabled' | 'screenShareTracks'>) => {
    const hasScreenShareVideo = screenShareEnabled && screenShareTracks?.video != null;

    if (this.participant?.id === this.meeting?.self.id) {
      this.updateLocalScreenShareVisibilityTracking(hasScreenShareVideo);
    } else {
      this.prepareRemoteScreenShareVisibilityNotification(hasScreenShareVideo);
    }

    writeTask(() => {
      this.screenShareEnabled = hasScreenShareVideo;
    });
  };

  private getLocalScreenShareVideoProducerId(): string | undefined {
    return this.meeting?.self?.producers?.find(
      (producer) => producer?.kind === 'video' && producer?.appData?.screenShare === true
    )?.id;
  }

  private getRemoteScreenShareVideoProducerId(): string | undefined {
    const remotePeer = this.participant;
    if (!remotePeer?.id) {
      return;
    }

    return this.meeting?.participants?.joined
      ?.get?.(remotePeer.id)
      ?.producers?.find((producer) => producer?.kind === 'video' && producer?.screenShare === true)
      ?.producerId;
  }

  private updateLocalScreenShareVisibilityTracking(enabled: boolean) {
    const producerId = enabled ? this.getLocalScreenShareVideoProducerId() : undefined;
    if (producerId === this.trackedScreenShareProducerId) {
      return;
    }
    if (!producerId) {
      this.resetScreenShareVisibilityTracking();
      return;
    }
    this.startTrackingScreenShareVisibility(producerId);
  }

  private prepareRemoteScreenShareVisibilityNotification(enabled: boolean) {
    const producerId = enabled ? this.getRemoteScreenShareVideoProducerId() : undefined;
    if (producerId === this.trackedScreenShareProducerId) {
      return;
    }

    this.notifySharerOfScreenShareVisibility(false);
    this.trackedScreenShareProducerId = producerId;
    this.lastNotifiedVisibility = undefined;
  }

  private startTrackingScreenShareVisibility(producerId: string) {
    this.resetScreenShareVisibilityTracking();
    this.trackedScreenShareProducerId = producerId;
    // Each viewer must report seeing the current screen-share producer.
    for (const viewerId of this.meeting.participants.joined.keys()) {
      this.pendingViewerIds.add(viewerId);
    }
    this.viewerVisibilityRevision++;
  }

  private resetScreenShareVisibilityTracking() {
    this.trackedScreenShareProducerId = undefined;
    this.lastNotifiedVisibility = undefined;
    this.pendingViewerIds.clear();
    this.viewerVisibilityRevision++;
    this.previewedViewerId = undefined;
    this.showRemainingViewers = false;
  }

  private handleViewerJoined = (peer: Peer) => {
    if (this.participant?.id === this.meeting?.self?.id) {
      this.trackJoinedViewerScreenshareVisibility(peer);
    } else if (peer.id === this.participant?.id) {
      // The sharer may have lost our earlier visibility report during reconnect.
      this.lastNotifiedVisibility = undefined;
      this.notifySharerOfScreenShareVisibility(true);
    }
  };

  private trackJoinedViewerScreenshareVisibility(peer: Peer) {
    const meeting = this.meeting;
    if (!meeting || !this.trackedScreenShareProducerId) {
      return;
    }

    // A rejoined viewer needs to confirm the current share again.
    this.pendingViewerIds.add(peer.id);
    this.viewerVisibilityRevision++;
  }

  private handleViewerLeft = (peer: Peer) => {
    if (this.participant?.id === this.meeting?.self?.id) {
      this.removeDepartedViewerVisibility(peer);
    }
  };

  private removeDepartedViewerVisibility(peer: Peer) {
    const meeting = this.meeting;
    if (!meeting || !this.trackedScreenShareProducerId) {
      return;
    }

    if (meeting.participants.joined.has(peer.id)) {
      return;
    }
    this.pendingViewerIds.delete(peer.id);
    this.viewerVisibilityRevision++;
    this.hidePendingViewerDetailsWhenEmpty();
  }

  private hidePendingViewerDetailsWhenEmpty() {
    if (this.pendingViewerIds.size > 0) {
      return;
    }
    this.previewedViewerId = undefined;
    this.showRemainingViewers = false;
  }

  private handleScreenShareVisibilityNotification = ({
    type,
    payload,
    peerId,
  }: {
    type: string;
    payload: BroadcastMessagePayload;
    peerId: string;
    timestamp: number;
  }) => {
    const meeting = this.meeting;
    if (
      type !== SCREEN_SHARE_VISIBILITY_MESSAGE ||
      meeting == null ||
      this.participant?.id !== meeting.self.id ||
      payload == null ||
      typeof payload !== 'object'
    ) {
      return;
    }

    const { sharerId, producerId, visible } = payload;
    if (
      sharerId !== meeting.self.id ||
      typeof producerId !== 'string' ||
      typeof visible !== 'boolean' ||
      producerId !== this.trackedScreenShareProducerId ||
      !meeting.participants.joined.has(peerId)
    ) {
      return;
    }

    if (visible) {
      if (!this.pendingViewerIds.delete(peerId)) {
        return;
      }
    } else {
      if (this.pendingViewerIds.has(peerId)) {
        return;
      }
      this.pendingViewerIds.add(peerId);
    }
    this.viewerVisibilityRevision++;
    this.hidePendingViewerDetailsWhenEmpty();
  };

  private notifySharerOfScreenShareVisibility = (
    visible: boolean,
    meeting = this.meeting,
    sharerId = this.participant?.id
  ) => {
    if (!meeting?.participants?.broadcastMessage || !sharerId || sharerId === meeting.self.id) {
      return;
    }

    const producerId = this.trackedScreenShareProducerId;
    if (!producerId || (visible && !this.isActivelyViewingScreenShare())) {
      return;
    }
    const last = this.lastNotifiedVisibility;
    if (
      (!visible && !last?.visible) ||
      (last?.producerId === producerId && last.visible === visible)
    ) {
      return;
    }

    const notification = { producerId, visible };
    this.lastNotifiedVisibility = notification;
    void meeting.participants
      .broadcastMessage(
        SCREEN_SHARE_VISIBILITY_MESSAGE,
        { sharerId, producerId, visible },
        { participantIds: [sharerId] }
      )
      .catch((error) => {
        if (this.lastNotifiedVisibility === notification) {
          this.lastNotifiedVisibility = undefined;
        }
        meeting.__internals__?.logger?.error('rtkScreenshareView::validateScreenShare', { error });
      });
  };

  private isActivelyViewingScreenShare(): boolean {
    const tab = this.meeting?.meta?.selfActiveTab;
    const video = this.videoEl;
    const participantId = this.participant?.id;
    const screenShareTrack = participantId
      ? this.meeting?.participants.joined.get(participantId)?.screenShareTracks?.video
      : undefined;
    const videoSource = video?.srcObject;
    const attachedVideoTrack =
      videoSource && 'getVideoTracks' in videoSource ? videoSource.getVideoTracks()[0] : undefined;

    // An already-playing element can still hold a frame from the previous share.
    return (
      screenShareTrack != null &&
      attachedVideoTrack === screenShareTrack &&
      video != null &&
      !video.paused &&
      video.readyState >= video.HAVE_CURRENT_DATA &&
      (tab == null || (tab.type === 'screenshare' && tab.id === this.participant?.id))
    );
  }

  private handleActiveTabUpdate = () => {
    this.notifySharerOfScreenShareVisibility(this.isActivelyViewingScreenShare());
  };

  private handleVideoPause = () => {
    this.notifySharerOfScreenShareVisibility(false);
  };

  private onVideoRef = (el: HTMLVideoElement) => {
    if (el == null || el === this.videoEl) {
      return;
    }
    this.videoEl = el;
    this.participant?.registerScreenshareVideoElement(el);
  };

  private fullScreenListener = () => {
    this.isFullScreen = isFullScreenEnabled();
  };

  private handleRemoteParticipantScreenShareUpdate = (p: Peer) => {
    if (!p || p.id !== this.participant?.id) {
      return;
    }
    this.handleScreenShareUpdate(p);
  };

  @Element() host: HTMLRtkScreenshareViewElement;

  /** Hide full screen button */
  @Prop() hideFullScreenButton: boolean = false;

  /** Maximum number of pending viewer avatars shown before the overflow count */
  @Prop() maxVisibleViewerAvatars: number = 3;

  /** Position of name tag */
  @Prop({ reflect: true }) nameTagPosition:
    | 'bottom-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'top-left'
    | 'top-right'
    | 'top-center' = 'bottom-left';

  /** Participant object */
  @Prop() participant!: Peer;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

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

  @State() videoExpanded: boolean = false;

  @State() screenShareEnabled: boolean = false;

  @State() isSwitchingScreen: boolean = false;

  @State() isFullScreen: boolean = false;

  @State() remoteControlInfo: string;

  @State() previewedViewerId?: string;

  @State() showRemainingViewers = false;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  /** Emits on the screen-share video's play event */
  @Event({ eventName: 'screensharePlay' }) play: EventEmitter<{
    participant: Peer;
    screenshareParticipant: Peer;
  }>;

  connectedCallback() {
    if (
      !isScreenShareProgressRegistered &&
      typeof CSS !== 'undefined' &&
      typeof CSS.registerProperty === 'function'
    ) {
      // Shadow-root @property rules do not register in Chromium.
      try {
        CSS.registerProperty({
          name: '--rtk-screenshare-view-progress',
          syntax: '<percentage>',
          inherits: true,
          initialValue: '0%',
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'InvalidModificationError')) {
          throw error;
        }
      }
      isScreenShareProgressRegistered = true;
    }

    window?.addEventListener('fullscreenchange', this.fullScreenListener);
    window?.addEventListener('webkitfullscreenchange', this.fullScreenListener);

    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.notifySharerOfScreenShareVisibility(false);
    this.cleanupParticipant(this.participant);
    this.cleanupMeeting(this.meeting);

    window?.removeEventListener('fullscreenchange', this.fullScreenListener);
    window?.removeEventListener('webkitfullscreenchange', this.fullScreenListener);
  }

  @Watch('participant')
  participantChanged(participant: Peer, oldParticipant?: Peer) {
    // The SDK ignores a video element that another participant still manages
    this.cleanupParticipant(oldParticipant);
    if (oldParticipant?.id !== participant?.id) {
      this.notifySharerOfScreenShareVisibility(false, this.meeting, oldParticipant?.id);
      this.resetScreenShareVisibilityTracking();
    } else if (oldParticipant && oldParticipant !== participant) {
      // A fresh participant object can reattach the same producer to a new video track.
      this.lastNotifiedVisibility = undefined;
    }
    if (participant == null) {
      return;
    }

    // On first load the video element is registered once it renders, see onVideoRef
    if (this.videoEl) {
      participant.registerScreenshareVideoElement(this.videoEl);
    }
    if (!this.meeting) {
      return;
    }

    this.handleScreenShareUpdate(participant);
    if (oldParticipant && oldParticipant !== participant) {
      this.notifySharerOfScreenShareVisibility(true);
    }

    if (participant.id === this.meeting.self.id) {
      (participant as RTKSelf).addListener('screenShareUpdate', this.handleScreenShareUpdate);
    } else {
      this.meeting.participants.joined.addListener(
        'screenShareUpdate',
        this.handleRemoteParticipantScreenShareUpdate
      );
    }
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting) {
      this.notifySharerOfScreenShareVisibility(false, oldMeeting);
      this.cleanupParticipant(this.participant, oldMeeting);
      this.cleanupMeeting(oldMeeting);
    }
    this.resetScreenShareVisibilityTracking();
    if (!meeting) {
      return;
    }

    meeting.participants.addListener?.(
      'broadcastedMessage',
      this.handleScreenShareVisibilityNotification
    );
    meeting.participants.joined.addListener('participantJoined', this.handleViewerJoined);
    meeting.participants.joined.addListener('participantLeft', this.handleViewerLeft);
    meeting.meta?.addListener('selfTabUpdate', this.handleActiveTabUpdate);
    meeting.meta?.addListener('activeTabUpdate', this.handleActiveTabUpdate);
    this.participantChanged(this.participant);
  }

  private cleanupMeeting(meeting: Meeting) {
    this.resetScreenShareVisibilityTracking();
    if (!meeting) {
      return;
    }
    meeting.participants.removeListener?.(
      'broadcastedMessage',
      this.handleScreenShareVisibilityNotification
    );
    meeting.participants.joined.removeListener('participantJoined', this.handleViewerJoined);
    meeting.participants.joined.removeListener('participantLeft', this.handleViewerLeft);
    meeting.meta?.removeListener('selfTabUpdate', this.handleActiveTabUpdate);
    meeting.meta?.removeListener('activeTabUpdate', this.handleActiveTabUpdate);
  }

  private cleanupParticipant(participant: Peer, meeting = this.meeting) {
    if (participant == null) {
      return;
    }

    if (this.videoEl) {
      participant.deregisterScreenshareVideoElement(this.videoEl);
    }
    if (!meeting) {
      return;
    }

    if (participant.id === meeting.self.id) {
      (participant as RTKSelf).removeListener('screenShareUpdate', this.handleScreenShareUpdate);
    } else {
      meeting.participants.joined.removeListener(
        'screenShareUpdate',
        this.handleRemoteParticipantScreenShareUpdate
      );
    }
  }

  private shareDifferentScreen = async () => {
    const meeting = this.meeting;
    if (meeting == null || this.isSwitchingScreen) {
      return;
    }

    this.isSwitchingScreen = true;
    try {
      await meeting.self.enableScreenShare();
    } catch (error) {
      meeting.__internals__.logger.error('rtkScreenshareView::shareDifferentScreen', { error });
    } finally {
      this.isSwitchingScreen = false;
    }
  };

  private toggleFullScreen = () => {
    if (!this.isFullScreen) {
      requestFullScreen(this.host);
      this.isFullScreen = true;
    } else {
      exitFullScreen();
      this.isFullScreen = false;
    }
  };

  render() {
    const isSelf = this.participant?.id === this.meeting?.self.id;
    const trackedViewerCount =
      this.trackedScreenShareProducerId && this.meeting ? this.meeting.participants.joined.size : 0;
    const pendingViewerCount = this.pendingViewerIds.size;
    const noViewersActive = trackedViewerCount > 0 && pendingViewerCount === trackedViewerCount;
    const confirmationProgress =
      trackedViewerCount > 0
        ? ((trackedViewerCount - pendingViewerCount) / trackedViewerCount) * 100
        : 0;
    const showVisibilityStatus = isSelf && trackedViewerCount > 0;
    const allViewersConfirmed = pendingViewerCount === 0;
    const displayedPendingViewers: Peer[] = [];
    const additionalPendingViewers: Peer[] = [];
    if (showVisibilityStatus && !noViewersActive && !allViewersConfirmed) {
      for (const viewerId of this.pendingViewerIds) {
        const viewer = this.meeting.participants.joined.get(viewerId);
        if (!viewer) {
          continue;
        }
        if (displayedPendingViewers.length < this.maxVisibleViewerAvatars) {
          displayedPendingViewers.push(viewer);
        } else if (this.showRemainingViewers) {
          additionalPendingViewers.push(viewer);
        }
      }
    }
    const additionalPendingViewerCount = Math.max(
      0,
      pendingViewerCount - displayedPendingViewers.length
    );

    const text = this.isFullScreen ? this.t('full_screen.exit') : this.t('full_screen');
    const icon = this.isFullScreen
      ? this.iconPack.full_screen_minimize
      : this.iconPack.full_screen_maximize;

    return (
      <Host class={{ isSelf }}>
        <div key="video-container" id="video-container" class={{ expand: this.videoExpanded }}>
          <video
            ref={this.onVideoRef}
            class={{
              visible: this.screenShareEnabled,
              'fit-in-container': this.participant.supportsRemoteControl,
            }}
            playsInline
            onPlay={() => {
              this.play.emit({
                screenshareParticipant: this.participant,
                participant: this.meeting.self,
              });
            }}
            onPlaying={() => this.notifySharerOfScreenShareVisibility(true)}
            onLoadedData={() => {
              if (this.videoEl && !this.videoEl.paused) {
                this.notifySharerOfScreenShareVisibility(true);
              }
            }}
            onPause={this.handleVideoPause}
            onEnded={this.handleVideoPause}
            autoPlay
            muted
            id={`screen-share-video-${this.participant.id}`}
          />
        </div>

        {/* Screen share controls */}
        <div id="controls" key="controls">
          {/* Full screen button */}
          {!this.hideFullScreenButton && !isSelf && isFullScreenSupported() && (
            <rtk-tooltip label={text}>
              <rtk-button
                id="full-screen-btn"
                kind="icon"
                onClick={this.toggleFullScreen}
                title={text}
              >
                <rtk-icon icon={icon} aria-hidden={true} tabIndex={-1} />
              </rtk-button>
            </rtk-tooltip>
          )}
        </div>

        {/* Self screen share view */}
        {isSelf && (
          <div id="self-message" key="self-message">
            <h3>{this.t('screenshare.shared')}</h3>
            <div class="actions">
              {this.meeting != null && (
                <rtk-button
                  variant="danger"
                  onClick={() => {
                    this.meeting.self.disableScreenShare();
                  }}
                >
                  <rtk-icon icon={this.iconPack.share_screen_stop} slot="start" />
                  {this.t('screenshare.stop')}
                </rtk-button>
              )}
              {this.meeting != null && (
                <rtk-button
                  variant="secondary"
                  disabled={this.isSwitchingScreen}
                  onClick={this.shareDifferentScreen}
                >
                  <rtk-icon
                    icon={this.iconPack.share_screen_different ?? this.iconPack.share_screen_start}
                    slot="start"
                  />
                  {this.t('screenshare.share_different_screen')}
                </rtk-button>
              )}
              <rtk-button
                variant="secondary"
                id="expand-btn"
                onClick={() => {
                  this.videoExpanded = !this.videoExpanded;
                }}
              >
                <rtk-icon
                  icon={
                    this.videoExpanded
                      ? this.iconPack.full_screen_minimize
                      : this.iconPack.full_screen_maximize
                  }
                  slot="start"
                />
                {this.videoExpanded
                  ? this.t('screenshare.min_preview')
                  : this.t('screenshare.max_preview')}
              </rtk-button>
            </div>
          </div>
        )}
        {showVisibilityStatus && (
          <div class="validation-status" role="status" aria-live="polite">
            {allViewersConfirmed ? (
              <span class="all-visible">{this.t('screenshare.visibility.all')}</span>
            ) : noViewersActive ? (
              <span class="none-visible">{this.t('screenshare.visibility.none')}</span>
            ) : (
              <div class="waiting-viewers">
                <span>{this.t('screenshare.visibility.not_viewing')}</span>
                <div class="pending-avatars">
                  {displayedPendingViewers.map((peer) => (
                    <button
                      key={peer.id}
                      class="avatar-trigger"
                      type="button"
                      aria-label={peer.name}
                      onMouseEnter={() => (this.previewedViewerId = peer.id)}
                      onMouseLeave={() => (this.previewedViewerId = undefined)}
                      onFocus={() => (this.previewedViewerId = peer.id)}
                      onBlur={() => (this.previewedViewerId = undefined)}
                      onClick={() => (this.previewedViewerId = peer.id)}
                    >
                      <rtk-avatar
                        participant={peer}
                        size="sm"
                        iconPack={this.iconPack}
                        t={this.t}
                      />
                      {this.previewedViewerId === peer.id && (
                        <span class="viewer-name" aria-hidden="true">
                          {peer.name}
                        </span>
                      )}
                    </button>
                  ))}
                  {additionalPendingViewerCount > 0 && (
                    <button
                      class="more-avatar"
                      type="button"
                      aria-label={`${this.t(
                        'screenshare.visibility.more'
                      )} ${additionalPendingViewerCount}`}
                      aria-expanded={this.showRemainingViewers}
                      aria-controls={this.showRemainingViewers ? 'remaining-viewers' : undefined}
                      onClick={() => (this.showRemainingViewers = !this.showRemainingViewers)}
                      onBlur={() => (this.showRemainingViewers = false)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          this.showRemainingViewers = false;
                        }
                      }}
                    >
                      +{additionalPendingViewerCount}
                    </button>
                  )}
                </div>
                {this.showRemainingViewers && additionalPendingViewerCount > 0 && (
                  <div id="remaining-viewers" class="remaining-viewers" role="list">
                    {additionalPendingViewers.map((peer) => (
                      <div class="remaining-viewer" role="listitem" key={peer.id}>
                        <rtk-avatar
                          participant={peer}
                          size="sm"
                          iconPack={this.iconPack}
                          t={this.t}
                        />
                        <span>{peer.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {showVisibilityStatus && (
          <div
            class={{
              'validation-border': true,
              'none-active': noViewersActive,
              complete: allViewersConfirmed,
            }}
            style={{ '--validation-progress': `${noViewersActive ? 100 : confirmationProgress}%` }}
            aria-hidden="true"
          />
        )}
        <slot />
      </Host>
    );
  }
}
