import type { LivestreamState } from '@cloudflare/realtimekit';
import Hls from 'hls.js';
import {
  Component,
  h,
  Host,
  Prop,
  Element,
  State,
  Watch,
  Event,
  EventEmitter,
} from '@stencil/core';
import { Size, RtkI18n, IconPack, defaultIconPack } from '../../exports';
import { useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import {
  showLivestream,
  PlayerEventType,
  PlayerState,
  getLivestreamViewerAllowedQualityLevels,
} from '../../utils/livestream';
import { SyncWithStore } from '../../utils/sync-with-store';
import { formatSecondsToHHMMSS } from '../../utils/time';

@Component({
  tag: 'rtk-livestream-player',
  styleUrl: 'rtk-livestream-player.css',
  shadow: true,
})
export class RtkLivestreamPlayer {
  private videoRef: HTMLVideoElement;

  private videoContainerRef: HTMLDivElement;

  @Element() el: HTMLRtkLivestreamPlayerElement;

  private hls: Hls;

  private statsIntervalTimer = null;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  @State() playbackUrl: string;

  @State() isSupported: boolean = true;

  @State() playerState: PlayerState | PlayerEventType = PlayerState.IDLE;

  @State() livestreamState: LivestreamState = 'IDLE';

  @State() playerError: any;

  @State() livestreamId: string = null;

  @State() audioPlaybackError: boolean = false;

  @State() qualityLevels: Array<{ level: number; resolution: string }> = [];

  @State() selectedQuality: number = -1; // -1 for auto

  @State() currentTime: number = 0;

  @State() duration: number = 0;

  @State() hideControls: boolean = true;

  @State() isDragging: boolean = false;

  @State() seekPosition: number = 0;

  @State() isSeeking: boolean = false;

  private hideControlsTimeout: NodeJS.Timeout = null;

  private seekingTimeout: NodeJS.Timeout = null;

  /**
   * Emit API error events
   */
  @Event({ bubbles: true, composed: true, eventName: 'rtkApiError' }) apiError: EventEmitter<{
    trace: string;
    message: string;
  }>;

  private livestreamUpdateListener = (state: LivestreamState) => {
    this.playbackUrl = this.meeting.livestream.playbackUrl;
    this.livestreamState = state;
  };

  private updateProgress = () => {
    // During seeking, avoid updating currentTime to prevent fluctuations
    if (!this.isSeeking) {
      this.currentTime = this.videoRef.currentTime;
    }
  };

  private updateHlsStatsPeriodically = () => {
    // Use HLS seekable ranges to get actual duration instead of currentTime + latency
    // This prevents duration from fluctuating when seeking
    if (this.videoRef?.seekable && this.videoRef.seekable.length > 0) {
      this.duration = this.videoRef.seekable.end(this.videoRef.seekable.length - 1);
    } else {
      // Fallback to currentTime + latency if seekable ranges aren't available
      this.duration = (this.videoRef?.currentTime || 0) + (this.hls?.latency || 0);
    }
  };

  private fastForwardToLatest = () => {
    // Use seekable range for more accurate live edge positioning
    if (this.videoRef?.seekable && this.videoRef.seekable.length > 0) {
      this.videoRef.currentTime = this.videoRef.seekable.end(this.videoRef.seekable.length - 1) - 1;
    } else {
      this.videoRef.currentTime = this.duration - 1; // Fallback
    }
  };

  @Watch('livestreamState')
  // @ts-ignore
  private async updateLivestreamId() {
    const url = this.meeting.livestream.playbackUrl;
    if (!url || this.livestreamState !== 'LIVESTREAMING') {
      // If there was a player, clean that up, cleanup all stencil states
      this.playbackUrl = null;
      this.livestreamId = null;
      this.cleanupPlayer();
      return;
    }

    const parts = url.split('/');
    const manifestIndex = parts.findIndex((part) => part === 'manifest');
    const streamId = parts[manifestIndex - 1];
    this.livestreamId = streamId;
    await this.conditionallyStartLivestreamViewer();
  }

  private async conditionallyStartLivestreamViewer() {
    if (this.videoRef && this.playbackUrl && !this.hls) {
      await this.initialiseAndPlayStream();
    }
  }

  private togglePlay = () => {
    if (this.videoRef.paused) {
      this.videoRef.play();
      this.playerState = PlayerState.PLAYING;
    } else {
      this.videoRef.pause();
      this.playerState = PlayerState.IDLE;
    }
  };

  private changeQuality = (level: number) => {
    this.selectedQuality = level;
    if (this.hls) {
      this.hls.currentLevel = level;
    }
  };

  private cleanupPlayer = () => {
    this.playerState = PlayerState.IDLE;
    if (this.videoRef) {
      this.hls?.destroy();
      this.hls = null;
    }
  };

  private onMouseMovePlayer = () => {
    this.hideControls = false;
    clearTimeout(this.hideControlsTimeout);
    this.hideControlsTimeout = setTimeout(() => {
      this.hideControls = true;
    }, 5000);
  };

  private seekToPosition = (position: number) => {
    if (!this.videoRef) return;

    // Clamp position to valid range
    const clampedPosition = Math.max(0, Math.min(position, this.duration));

    // Set seeking state to prevent currentTime fluctuations
    this.isSeeking = true;

    // Update currentTime immediately for UI feedback
    this.currentTime = clampedPosition;

    try {
      this.videoRef.currentTime = clampedPosition;

      // Clear any existing timeout
      if (this.seekingTimeout) {
        clearTimeout(this.seekingTimeout);
      }

      // Reset seeking state after a short delay to allow video to stabilize
      this.seekingTimeout = setTimeout(() => {
        this.isSeeking = false;
        // Update currentTime one final time to ensure accuracy
        this.currentTime = this.videoRef.currentTime;
      }, 200);
    } catch (error) {
      this.isSeeking = false;
      this.meeting.__internals__.logger.warn('rtk-livestream-player:: Seek failed', { error });
    }
  };

  private onSeekbarMouseDown = (event: MouseEvent) => {
    event.preventDefault();
    this.isDragging = true;
    this.updateSeekPosition(event);

    document.addEventListener('mousemove', this.onSeekbarMouseMove);
    document.addEventListener('mouseup', this.onSeekbarMouseUp);
  };

  private onSeekbarMouseMove = (event: MouseEvent) => {
    if (!this.isDragging) return;
    this.updateSeekPosition(event);
  };

  private onSeekbarMouseUp = (event: MouseEvent) => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.updateSeekPosition(event);
    this.seekToPosition(this.seekPosition);

    document.removeEventListener('mousemove', this.onSeekbarMouseMove);
    document.removeEventListener('mouseup', this.onSeekbarMouseUp);
  };

  private onSeekbarClick = (event: MouseEvent) => {
    if (this.isDragging) return;

    this.updateSeekPosition(event);
    this.seekToPosition(this.seekPosition);
  };

  private updateSeekPosition = (event: MouseEvent) => {
    const seekbar = event.currentTarget as HTMLElement;
    const rect = seekbar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));

    // Map progress to duration
    this.seekPosition = progress * this.duration;
  };

  private getSeekbarProgress = (): number => {
    if (this.isDragging) {
      return this.duration > 0 ? this.seekPosition / this.duration : 0;
    }

    return this.duration > 0 ? this.currentTime / this.duration : 0;
  };

  private getLoadingState = () => {
    let loadingMessage = '';
    let isLoading = false;
    let showIcon = false;
    switch (this.livestreamState) {
      case 'IDLE':
        loadingMessage = this.t('livestream.idle');
        isLoading = true;
        showIcon = false;
        break;
      case 'STARTING':
        loadingMessage = this.t('livestream.starting');
        isLoading = true;
        showIcon = true;
        break;
      case 'STOPPING':
        loadingMessage = this.t('livestream.stopping');
        isLoading = true;
        showIcon = true;
        break;
      case 'LIVESTREAMING':
        if (this.playerState !== PlayerState.PLAYING && this.playerState !== PlayerState.PAUSED) {
          loadingMessage = this.t('livestream.starting');
          showIcon = true;
          isLoading = true;
        }
        break;
      default:
        isLoading = false;
        loadingMessage = this.t('');
        showIcon = true;
        break;
    }
    return { isLoading, loadingMessage, showIcon };
  };

  private getErrorState = () => {
    let isError = false;
    let errorMessage = '';
    if (this.livestreamState !== 'LIVESTREAMING') {
      isError = false;
      errorMessage = this.t('');
      return { isError, errorMessage };
    }
    if (!this.isSupported) {
      isError = true;
      errorMessage = this.t('livestream.error.not_supported');
    }
    if (!this.playbackUrl) {
      isError = true;
      errorMessage = this.t('livestream.error.not_found');
    }
    if (this.playerError) {
      isError = true;
      errorMessage = this.t(this.playerError?.message ?? 'livestream.error.unknown');
    }
    return { isError, errorMessage };
  };

  private initialiseAndPlayStream = async () => {
    try {
      this.meeting.__internals__.logger.info(
        `rtk-livestream-player:: About to initialise HLS. VideoRef? ${!!this
          .videoRef} playbackUrl: ${this.playbackUrl}`
      );
      if (Hls.isSupported()) {
        this.meeting.__internals__.logger.info(
          `rtk-livestream-player:: Initialising HLS. HLS is Supported`
        );

        this.hls = new Hls({
          lowLatencyMode: false,
        });

        (window as any).rtk_hls = this.hls;

        this.meeting.__internals__.logger.info(`rtk-livestream-player:: Loading source`);
        this.hls.loadSource(this.playbackUrl + '?dvrEnabled=true');
        this.meeting.__internals__.logger.info(
          `rtk-livestream-player:: Attaching video element to HLS`
        );
        this.hls.attachMedia(this.videoRef);

        this.meeting.__internals__.logger.info(
          `rtk-livestream-player:: Waiting async for HLS manifest parsing`
        );

        this.hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            this.meeting.__internals__.logger.error(
              `rtk-livestream-player:: fatal error: ${data.details}`,
              {
                error: data.error,
              }
            );
            if (this.playbackUrl && this.livestreamState === 'LIVESTREAMING') {
              /*
                NOTE(ravindra-cloudflare): Maybe manifest is not ready,
                maybe levels are not available yet.
                Keep on retrying every 5 seconds till either livestream is stopped or error is resolved.
              */
              setTimeout(() => {
                if (this.playbackUrl && this.livestreamState === 'LIVESTREAMING') {
                  this.meeting.__internals__.logger.info(
                    'rtk-livestream-player:: Retrying playbackUrl'
                  );
                  this.hls.loadSource(this.playbackUrl + '?dvrEnabled=true');
                }
              }, 5000);
              return;
            }
          } else {
            this.meeting.__internals__.logger.warn(
              `rtk-livestream-player:: non-fatal error: ${data.details}`,
              {
                error: data.error,
              }
            );
          }
        });

        this.hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          this.meeting.__internals__.logger.info('rtk-livestream-player:: media attached');
        });

        this.hls.on(Hls.Events.MEDIA_DETACHED, () => {
          this.meeting.__internals__.logger.info('rtk-livestream-player:: media detached');
        });

        this.hls.on(Hls.Events.DESTROYING, () => {
          this.meeting.__internals__.logger.info(
            'rtk-livestream-player:: hls is getting destroyed'
          );
        });

        // Listen for manifest parsed to populate quality levels
        this.hls.on(Hls.Events.MANIFEST_PARSED, async (_, data) => {
          this.meeting.__internals__.logger.info(`rtk-livestream-player:: HLS manifest parsed`);
          const { levels: levelsToUse, autoLevelChangeAllowed } =
            getLivestreamViewerAllowedQualityLevels({
              meeting: this.meeting,
              hlsLevels: data.levels,
            });

          this.qualityLevels = levelsToUse.map((level, index) => ({
            level: index,
            resolution: level.height ? `${level.height}p` : 'auto',
          }));
          if (autoLevelChangeAllowed) {
            this.qualityLevels = [{ level: -1, resolution: 'Auto' }, ...this.qualityLevels];
          }
          // Set a reasonable starting quality
          this.hls.currentLevel = this.qualityLevels[0].level;

          try {
            this.meeting.__internals__.logger.info('rtk-livestream-player:: About to start video.');
            await this.videoRef.play(); // Starts playing the video after it is ready
            this.meeting.__internals__.logger.info(
              'rtk-livestream-player:: Video has started playing.'
            );
            this.playerState = PlayerState.PLAYING;
          } catch (error) {
            this.audioPlaybackError = true;
            this.meeting.__internals__.logger.error(
              `rtk-livestream-player:: Video couldn't start. Trying with user gesture again.`,
              {
                error,
              }
            );
          }
        });

        // Setup listeners to show current time and total duration
        this.videoRef.addEventListener('timeupdate', this.updateProgress);
        this.statsIntervalTimer = setInterval(this.updateHlsStatsPeriodically, 1000);
      } else {
        this.isSupported = false;
      }
    } catch (error) {
      this.meeting.__internals__.logger.error(`rtk-livestream-player:: HLS couldn't initialise.`, {
        error,
      });
      // Retry with user gesture
    }
  };

  async connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting.livestream.removeListener('livestreamUpdate', this.livestreamUpdateListener);
    this.videoRef.removeEventListener('timeupdate', this.updateProgress);
    clearInterval(this.statsIntervalTimer);
    if (this.seekingTimeout) {
      clearTimeout(this.seekingTimeout);
    }
    this.videoRef = null;
    if (this.hls) {
      this.hls.destroy();
    }
    (window as any).rtk_hls = null;
  }

  @Watch('meeting')
  meetingChanged(meeting) {
    if (!meeting) return;
    this.playbackUrl = this.meeting.livestream.playbackUrl;
    this.livestreamState = this.meeting.livestream.state;
    this.meeting.livestream.on('livestreamUpdate', this.livestreamUpdateListener);
  }

  render() {
    if (!showLivestream(this.meeting)) return;
    const { isError, errorMessage } = this.getErrorState();
    const { isLoading, loadingMessage, showIcon } = this.getLoadingState();

    return (
      <Host>
        <div class="player-container h-full max-h-full min-h-full w-full min-w-full max-w-full">
          <div
            ref={async (el) => {
              this.videoContainerRef = el;
            }}
            class="video-container relative flex h-full w-full flex-col items-center justify-center"
          >
            <video
              onMouseMove={this.onMouseMovePlayer}
              ref={async (el) => {
                this.videoRef = el;
                await this.conditionallyStartLivestreamViewer();
              }}
              id="livestream-video"
              class="livestream-video"
              controls={false} // Custom controls
              onPlay={() => {
                if (this.playerState === PlayerState.PAUSED) {
                  this.playerState = PlayerState.PLAYING;
                }
              }}
              onPause={() => (this.playerState = PlayerState.PAUSED)}
            ></video>
            {this.playerState !== PlayerState.IDLE && !this.hideControls && (
              // <!-- Control Bar -->
              <div class="control-bar">
                <div class="control-groups">
                  {/* <!-- Play/Pause Button --> */}
                  <rtk-icon
                    id="playPause"
                    onClick={this.togglePlay}
                    size="lg"
                    class="control-btn"
                    icon={
                      this.playerState === PlayerState.PLAYING
                        ? this.iconPack.pause
                        : this.iconPack.play
                    }
                  />

                  <rtk-icon
                    size="lg"
                    class="control-btn"
                    icon={this.iconPack.fastForward}
                    onClick={this.fastForwardToLatest}
                  />
                  <span class="timings">
                    {formatSecondsToHHMMSS(this.currentTime)} /{' '}
                    {formatSecondsToHHMMSS(this.duration)}
                  </span>
                </div>

                {/* <!-- Seekbar --> */}
                <div class="seekbar-container">
                  <div
                    class="seekbar"
                    onMouseDown={this.onSeekbarMouseDown}
                    onClick={this.onSeekbarClick}
                  >
                    <div class="seekbar-track">
                      <div
                        class="seekbar-progress"
                        style={{ width: `${this.getSeekbarProgress() * 100}%` }}
                      ></div>
                      <div
                        class="seekbar-handle"
                        style={{ left: `${this.getSeekbarProgress() * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div class="control-groups">
                  {/* <!-- Quality --> */}
                  <select
                    class="level-select"
                    onChange={(e) =>
                      this.changeQuality(parseInt((e.target as HTMLSelectElement).value))
                    }
                  >
                    {this.qualityLevels.map((level) => (
                      <option value={level.level} selected={this.selectedQuality === level.level}>
                        {level.resolution}
                      </option>
                    ))}
                  </select>

                  {/* <!-- Fullscreen Button --> */}
                  <rtk-fullscreen-toggle
                    id="fullscreen"
                    class="control-btn fullscreen-btn"
                    targetElement={this.videoContainerRef}
                    size="sm"
                    iconPack={this.iconPack}
                    t={this.t}
                    ref={(fullScreenToggle) => {
                      // Create a <style> element
                      const style = document.createElement('style');

                      // Add CSS rules
                      style.textContent = `
                        rtk-controlbar-button {
                          display: contents;
                          background-color: var(--bg-brand-500);
                          color: var(--text-text-on-brand);
                        }
                      `;

                      // Append the <style> to the Shadow DOM
                      fullScreenToggle?.shadowRoot?.appendChild(style);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {this.audioPlaybackError && (
            <div class="unmute-popup">
              <h3>{this.t('audio_playback.title')}</h3>
              <p>{this.t('audio_playback.description')}</p>
              <rtk-button
                kind="wide"
                onClick={() => {
                  this.audioPlaybackError = false;
                  if (this.videoRef) {
                    this.videoRef.muted = false;
                    this.videoRef.play();
                    this.playerState = PlayerState.PLAYING;
                  }
                }}
                title={this.t('audio_playback')}
              >
                {this.t('audio_playback')}
              </rtk-button>
            </div>
          )}
          {isError && (
            <div class="loader">
              <rtk-icon icon={this.iconPack.warning} />
              <p>{errorMessage}</p>
            </div>
          )}
          {!isError && isLoading && (
            <div class="loader">
              {showIcon && (
                <rtk-spinner id="icon" part="spinner" iconPack={this.iconPack} size="md" />
              )}
              <p>{loadingMessage}</p>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
