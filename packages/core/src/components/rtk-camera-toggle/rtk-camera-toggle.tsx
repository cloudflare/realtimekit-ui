import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Peer, MediaPermission } from '../../types/rtk-client';
import { PermissionSettings, Size, States } from '../../types/props';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';
import { SyncWithStore } from '../../utils/sync-with-store';
import { StageStatus } from '@cloudflare/realtimekit';
import { getUserPreferences, setPreference } from '../../utils/user-prefs';

/**
 * A button which toggles your camera.
 *
 * @slot additional-menu-items - Additional menu entries displayed after the camera devices.
 */
@Component({
  tag: 'rtk-camera-toggle',
  styleUrl: 'rtk-camera-toggle.css',
  shadow: true,
})
export class RtkCameraToggle {
  private deviceListUpdateListener = ({ devices }: { devices: MediaDeviceInfo[] }) => {
    this.videoDevices = devices.filter(
      (device) => device.kind === 'videoinput' && !!device.deviceId
    );
  };

  private deviceUpdateListener = () => {
    this.currentDevice = this.meeting.self.getCurrentDevices()?.video;
  };

  private videoUpdateListener = ({ videoEnabled }: Peer) => {
    this.videoEnabled = videoEnabled;
  };

  private stageStatusListener = () => {
    this.stageStatus = this.meeting.stage.status;
    this.canProduceVideo = this.meeting.self.permissions.canProduceVideo === 'ALLOWED';
  };

  private mediaPermissionUpdateListener = ({ kind, message }) => {
    if (kind === 'video') {
      this.cameraPermission = message;
    }
  };

  private meetingPermissionsUpdateListener = (patch?: {
    media?: { video?: { canProduce?: number } };
  }) => {
    if (patch?.media?.video) {
      this.canProduceVideo = this.meeting.self.permissions.canProduceVideo === 'ALLOWED';
    }
  };

  /** Variant */
  @Prop({ reflect: true }) variant: ControlBarVariant = 'button';

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Hides the video device menu, for setup and preview controls. */
  @Prop({ reflect: true }) hideDeviceSelectionMenu: boolean = false;

  /** States */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() videoEnabled: boolean = false;

  @State() canProduceVideo: boolean = false;

  @State() cameraPermission: MediaPermission = 'NOT_REQUESTED';

  @State() stageStatus: StageStatus = 'OFF_STAGE';

  @State() videoDevices: MediaDeviceInfo[] = [];

  @State() currentDevice: MediaDeviceInfo;

  @State() hasAdditionalMenuItems: boolean = false;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.removeMeetingListeners(this.meeting);
  }

  private removeMeetingListeners(meeting: Meeting) {
    meeting?.self.removeListener('videoUpdate', this.videoUpdateListener);
    meeting?.self.removeListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
    meeting?.self.removeListener('deviceListUpdate', this.deviceListUpdateListener);
    meeting?.self.removeListener('deviceUpdate', this.deviceUpdateListener);
    meeting?.stage?.removeListener('stageStatusUpdate', this.stageStatusListener);
    meeting?.self?.permissions?.removeListener(
      'permissionsUpdate',
      this.meetingPermissionsUpdateListener
    );
  }

  private async refreshDevices(meeting: Meeting) {
    if (!meeting) return;
    const videoDevices = await meeting.self.getVideoDevices();
    if (meeting !== this.meeting) return;

    this.videoDevices = videoDevices.filter(
      (device) => device.kind === 'videoinput' && !!device.deviceId
    );
    this.currentDevice = meeting.self.getCurrentDevices()?.video;
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    this.removeMeetingListeners(oldMeeting);
    if (meeting != null) {
      const { self, stage } = meeting;
      this.canProduceVideo = this.meeting.self.permissions.canProduceVideo === 'ALLOWED';
      this.cameraPermission = self.mediaPermissions.video || 'NOT_REQUESTED';
      this.videoEnabled = self.videoEnabled;

      this.stageStatus = meeting.stage.status;
      this.videoDevices = [];
      this.currentDevice = self.getCurrentDevices()?.video;
      self.addListener('videoUpdate', this.videoUpdateListener);
      self.addListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
      self.addListener('deviceListUpdate', this.deviceListUpdateListener);
      self.addListener('deviceUpdate', this.deviceUpdateListener);
      stage?.addListener('stageStatusUpdate', this.stageStatusListener);
      meeting?.self?.permissions?.addListener(
        'permissionsUpdate',
        this.meetingPermissionsUpdateListener
      );
      void this.refreshDevices(meeting);
    }
  }

  private setDevice = async (device: MediaDeviceInfo) => {
    const meeting = this.meeting;
    if (!meeting) return;
    try {
      await meeting.self.setDevice(device);
      if (meeting === this.meeting) {
        this.currentDevice = meeting.self.getCurrentDevices()?.video;
      }
    } catch (error) {
      meeting.__internals__.logger.warn('rtkCameraToggle::setDevice', { error });
    }
  };

  private handleMenuKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      (event.currentTarget as HTMLElement).click();
    }
  };

  private handleMirrorChange = (event: CustomEvent<boolean>) => {
    const mirrorVideo = event.detail;
    if (mirrorVideo === (this.states?.prefs?.mirrorVideo ?? getUserPreferences().mirrorVideo)) {
      return;
    }
    setPreference('mirror-video', mirrorVideo);
    this.stateUpdate.emit({ prefs: { mirrorVideo } });
  };

  private hasPermissionError() {
    return this.cameraPermission === 'DENIED' || this.cameraPermission === 'SYSTEM_DENIED';
  }

  private toggleCamera = () => {
    this.meeting?.__internals__.logger.info('rtkCameraToggle::toggleCamera', {
      media: {
        video: {
          enabled: Boolean(this.meeting?.self?.videoEnabled),
          permission: this.cameraPermission,
          canProduce: this.meeting?.self?.permissions?.canProduceVideo,
        },
      },
      webinar: {
        stageStatus: this.meeting?.stage.status as any,
      },
      livestream: {
        stageStatus: this.meeting?.stage?.status,
      },
      moduleExists: {
        self: Boolean(this.meeting?.self),
      },
    });

    if (this.hasPermissionError()) {
      const permissionModalSettings: PermissionSettings = {
        enabled: true,
        kind: 'video',
      };
      this.stateUpdate.emit({ activePermissionsMessage: permissionModalSettings });
      return false;
    }

    const self = this.meeting?.self;
    if (self == null || !this.canProduceVideo) {
      return;
    }
    if (self.videoEnabled) {
      self.disableVideo();
    } else {
      self.enableVideo();
    }
  };

  private getState() {
    let tooltipLabel = '';
    let label = '';
    let icon = '';
    let classList = {};
    let hasError = this.hasPermissionError();
    let couldNotStart = this.cameraPermission === 'COULD_NOT_START';

    if (this.videoEnabled && !hasError) {
      label = this.t('video_on');
      icon = this.iconPack.video_on;
    } else {
      label = this.t('video_off');
      icon = this.iconPack.video_off;
      classList['red-icon'] = true;
    }

    if (couldNotStart) {
      tooltipLabel = this.t('perm_could_not_start.video');
    } else if (this.cameraPermission === 'SYSTEM_DENIED') {
      tooltipLabel = this.t('perm_sys_denied.video');
    } else if (this.cameraPermission === 'DENIED') {
      tooltipLabel = this.t('perm_denied.video');
    } else {
      tooltipLabel = this.videoEnabled ? this.t('disable_video') : this.t('enable_video');
    }

    return {
      tooltipLabel,
      label,
      icon,
      classList,
      showWarning: hasError || couldNotStart,
      disable: hasError,
    };
  }

  render() {
    if (!this.meeting) return null;
    if (
      !this.canProduceVideo ||
      this.meeting?.meta.viewType === 'AUDIO_ROOM' ||
      ['OFF_STAGE', 'REQUESTED_TO_JOIN_STAGE'].includes(this.stageStatus)
    ) {
      return <Host data-hidden />;
    }

    const { tooltipLabel, label, icon, classList, showWarning, disable } = this.getState();
    const mirrorVideo = this.states?.prefs?.mirrorVideo ?? getUserPreferences().mirrorVideo;

    return (
      <Host title={label}>
        <div class="camera-controls">
          <rtk-tooltip kind="block" label={tooltipLabel} part="tooltip">
            <rtk-controlbar-button
              part="controlbar-button"
              size={this.size}
              iconPack={this.iconPack}
              class={classList}
              variant={this.variant}
              label={label}
              icon={icon}
              onClick={this.toggleCamera}
              showWarning={showWarning}
              disabled={disable}
            />
          </rtk-tooltip>
          {!this.hideDeviceSelectionMenu && (
            <rtk-menu
              placement="top-end"
              offset={4}
              size={this.size}
              iconPack={this.iconPack}
              t={this.t}
            >
              <button
                class="device-trigger"
                type="button"
                slot="trigger"
                aria-label={this.t('camera_toggle.video_devices')}
                aria-haspopup="menu"
                title={this.t('camera_toggle.video_devices')}
              >
                <rtk-icon icon={this.iconPack.chevron_up} size="sm" />
              </button>
              <rtk-menu-list role="menu" iconPack={this.iconPack} t={this.t}>
                {this.videoDevices.length === 0 && (
                  <div class="empty-devices">{this.t('not_found_camera')}</div>
                )}
                {this.videoDevices.map((device) => (
                  <rtk-menu-item
                    role="menuitemradio"
                    aria-checked={String(this.currentDevice?.deviceId === device.deviceId)}
                    tabIndex={0}
                    title={device.label}
                    onClick={() => void this.setDevice(device)}
                    onKeyDown={this.handleMenuKeyDown}
                  >
                    <span class="device-label">{device.label}</span>
                    {this.currentDevice?.deviceId === device.deviceId && (
                      <rtk-icon icon={this.iconPack.checkmark} size="sm" slot="end" />
                    )}
                  </rtk-menu-item>
                ))}
                <div
                  class={{
                    'additional-menu-items': true,
                    'has-items': this.hasAdditionalMenuItems,
                  }}
                >
                  {this.hasAdditionalMenuItems && <div class="menu-divider" role="separator" />}
                  <slot
                    name="additional-menu-items"
                    onSlotchange={(event) => {
                      this.hasAdditionalMenuItems =
                        (event.target as HTMLSlotElement).assignedElements().length > 0;
                    }}
                  />
                </div>
                {!this.hasAdditionalMenuItems && <div class="menu-divider" role="separator" />}
                <div class="mirror-option">
                  <rtk-icon
                    icon={this.iconPack[mirrorVideo ? 'mirror_on' : 'mirror_off']}
                    size="sm"
                    aria-hidden={true}
                  />
                  <span>{this.t('camera_toggle.mirror_video')}</span>
                  <rtk-switch
                    checked={mirrorVideo}
                    iconPack={this.iconPack}
                    t={this.t}
                    aria-label={this.t('camera_toggle.mirror_video')}
                    onRtkChange={this.handleMirrorChange}
                  />
                </div>
              </rtk-menu-list>
            </rtk-menu>
          )}
        </div>
      </Host>
    );
  }
}
