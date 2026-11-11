import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Peer, MediaPermission } from '../../types/rtk-client';
import { PermissionSettings, Size, States } from '../../types/props';
import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';
import { SyncWithStore } from '../../utils/sync-with-store';
import { StageStatus } from '@cloudflare/realtimekit';

const deviceCanScreenShare = () => {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined' &&
    'getDisplayMedia' in navigator.mediaDevices
  );
};

interface ScreenShareState {
  tooltipLabel: string;
  label: string;
  icon: string;
  classList: { [key: string]: boolean };
  showWarning: boolean;
  disable: boolean;
}

/**
 * A button which toggles your screenshare.
 */
@Component({
  tag: 'rtk-screen-share-toggle',
  styleUrl: 'rtk-screen-share-toggle.css',
  shadow: true,
})
export class RtkScreenShareToggle {
  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

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

  /**
   * Maximum screen share count (value from preset)
   * -1 denotes there is no limit on maximum
   */
  @State() maxScreenShareCount: number = -1;

  @State() screenShareCount: number = 0;

  @State() screenShareEnabled: boolean = false;

  @State() canScreenShare: boolean = false;

  @State() shareScreenPermission: MediaPermission = 'NOT_REQUESTED';

  @State() screenShareState: ScreenShareState = {
    tooltipLabel: this.t('screenshare.start'),
    label: this.t('screenshare.start'),
    icon: this.iconPack.share_screen_start,
    classList: {},
    showWarning: false,
    disable: false,
  };

  @State() stageStatus: StageStatus = 'OFF_STAGE';

  /**
   * Emit api error events
   */
  @Event({ eventName: 'rtkApiError', bubbles: true, composed: true }) apiError: EventEmitter<{
    trace: string;
    message: string;
  }>;

  private screenShareListener = () => {
    const activeScreenShares = this.meeting.participants.active
      .toArray()
      .filter((p) => p.screenShareEnabled).length;
    const selfScreenShare = this.meeting.self.screenShareEnabled ? 1 : 0;
    this.screenShareCount = activeScreenShares + selfScreenShare;
    this.screenShareEnabled = this.meeting.self.screenShareEnabled;

    this.getState();
    this.meeting.__internals__.logger.info('rtkScreenShare::screenShareUpdate', {
      media: {
        screenshare: {
          enabled: this.screenShareEnabled,
          count: this.screenShareCount,
        },
      },
    });
  };

  private participantLeftListener = ({ screenShareEnabled }: Peer) => {
    if (screenShareEnabled) {
      // decrement count if participant who left had screenShareEnabled
      // and don't let it go below 0 (just a failsafe)
      this.screenShareCount = Math.max(this.screenShareCount - 1, 0);
      this.getState();
      this.meeting.__internals__.logger.info('rtkScreenShare::screenShareUpdate', {
        media: {
          screenshare: {
            enabled: this.screenShareEnabled,
            count: this.screenShareCount,
          },
        },
      });
    }
  };

  private stageStatusListener = () => {
    this.stageStatus = this.meeting.stage.status;
    this.canScreenShare = this.meeting.self.permissions.canProduceScreenshare === 'ALLOWED';
  };

  private mediaPermissionUpdateListener = ({ kind, message }) => {
    if (kind === 'screenshare') {
      this.shareScreenPermission = message;
      this.getState();
      if (message === 'COULD_NOT_START') {
        this.apiError.emit({
          trace: this.t('screenshare.permissions'),
          message: this.t('screenshare.error.unknown'),
        });
      }
      if (this.hasPermissionError()) {
        const permissionModalSettings: PermissionSettings = {
          enabled: true,
          kind: 'screenshare',
        };
        this.stateUpdate.emit({ activePermissionsMessage: permissionModalSettings });
      }
    }
  };

  connectedCallback() {
    if (!deviceCanScreenShare()) {
      this.meeting.__internals__.logger.error(
        '[rtk-screenshare-toggle] Device does not support screensharing.'
      );
      return;
    }
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting?.participants.joined.removeListener('screenShareUpdate', this.screenShareListener);
    this.meeting?.participants.joined.removeListener(
      'participantLeft',
      this.participantLeftListener
    );
    this.meeting?.self.removeListener('screenShareUpdate', this.screenShareListener);
    this.meeting?.self.removeListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
    this.meeting?.stage?.removeListener('stageStatusUpdate', this.stageStatusListener);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting != null) {
      const { self, stage } = meeting;
      this.canScreenShare = this.meeting.self.permissions.canProduceScreenshare === 'ALLOWED';
      this.maxScreenShareCount = self.config.maxScreenShareCount;
      this.screenShareEnabled = self.screenShareEnabled;

      let screenShareCount = 0;

      for (const participant of meeting.participants.joined.toArray()) {
        if (participant.screenShareEnabled) {
          screenShareCount++;
        }
      }

      this.screenShareCount = screenShareCount;
      this.getState();
      meeting.__internals__.logger.info('rtkScreenShare::initialise', {
        media: {
          screenshare: {
            enabled: this.screenShareEnabled,
            count: this.screenShareCount,
            maxAllowedCount: this.maxScreenShareCount,
          },
        },
      });

      this.stageStatus = meeting.stage.status;
      meeting.participants.joined.addListener('screenShareUpdate', this.screenShareListener);
      meeting.participants.joined.addListener('participantLeft', this.participantLeftListener);
      self.addListener('screenShareUpdate', this.screenShareListener);
      self.addListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
      stage?.addListener('stageStatusUpdate', this.stageStatusListener);
    }
  }

  @Watch('t')
  @Watch('iconPack')
  screenShareAppearanceChanged() {
    this.getState();
  }

  private hasPermissionError() {
    return (
      this.shareScreenPermission === 'SYSTEM_DENIED' || this.shareScreenPermission === 'DENIED'
    );
  }

  private reachedMaxScreenShares = () => {
    // checks if a limit exists, and if limit is reached
    return this.maxScreenShareCount > 0 && this.screenShareCount >= this.maxScreenShareCount;
  };

  private stopScreenShare = () => {
    if (this.screenShareState.disable) return;
    this.meeting?.self.disableScreenShare();
    this.stateUpdate.emit({ activeMoreMenu: false });
  };

  private enableScreenShare = async () => {
    if (this.screenShareState.disable) return;
    if (this.hasPermissionError()) {
      const permissionModalSettings: PermissionSettings = {
        enabled: true,
        kind: 'screenshare',
      };
      this.stateUpdate.emit({ activePermissionsMessage: permissionModalSettings });
      return false;
    }

    const self = this.meeting?.self;
    if (
      self == null ||
      !this.canScreenShare ||
      (this.reachedMaxScreenShares() && !this.screenShareEnabled) ||
      this.hasPermissionError()
    )
      return;

    this.screenShareState = { ...this.screenShareState, disable: true };
    try {
      await self.enableScreenShare();
      this.stateUpdate.emit({ activeMoreMenu: false });
    } finally {
      this.getState();
    }
  };

  private handleMenuItemKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.click();
      }
    }
  };

  private getState() {
    let tooltipLabel = '';
    let label = '';
    let icon = '';
    let classList = {};
    const hasError = this.hasPermissionError() && !this.screenShareEnabled;
    const limitReached = this.reachedMaxScreenShares() && !this.screenShareEnabled;
    const couldNotStart = this.shareScreenPermission === 'COULD_NOT_START';

    if (this.screenShareEnabled && !hasError) {
      label = this.t('screenshare.menu') ?? this.t('screenshare.stop');
      icon = this.iconPack.share_screen_menu ?? this.iconPack.share_screen_stop;
      classList['red-icon'] = true;
    } else {
      label = this.t('screenshare.start');
      icon = this.iconPack.share_screen_start;
    }

    if (this.shareScreenPermission === 'SYSTEM_DENIED') {
      tooltipLabel = this.t('perm_sys_denied.screenshare');
      classList['red-icon'] = true;
    } else if (this.shareScreenPermission === 'DENIED') {
      tooltipLabel = this.t('perm_denied.screenshare');
      classList['red-icon'] = true;
    } else {
      tooltipLabel = label;
    }

    if (limitReached) {
      tooltipLabel = this.t('screenshare.error.max_count');
    }

    if (couldNotStart) {
      tooltipLabel = this.t('screenshare.error.unknown');
    }

    this.screenShareState = {
      tooltipLabel,
      label,
      icon,
      classList,
      disable: hasError || limitReached,
      showWarning: hasError || limitReached || couldNotStart,
    };
  }

  render() {
    if (
      !deviceCanScreenShare() ||
      !this.canScreenShare ||
      ['OFF_STAGE', 'REQUESTED_TO_JOIN_STAGE'].includes(this.stageStatus)
    ) {
      return <Host data-hidden />;
    }

    const screenShareButton = (
      <rtk-tooltip
        slot={this.screenShareEnabled ? 'trigger' : undefined}
        placement="top"
        kind="block"
        label={this.screenShareState.tooltipLabel}
        delay={600}
        part="tooltip"
      >
        <rtk-controlbar-button
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          variant={this.variant}
          label={this.screenShareState.label}
          icon={this.screenShareState.icon}
          class={this.screenShareState.classList}
          onClick={this.screenShareEnabled ? undefined : this.enableScreenShare}
          disabled={this.screenShareState.disable}
          showWarning={this.screenShareState.showWarning}
        />
      </rtk-tooltip>
    );

    return (
      <Host title={this.screenShareState.label}>
        {this.screenShareEnabled ? (
          <rtk-menu placement="top" size={this.size} iconPack={this.iconPack} t={this.t}>
            {screenShareButton}
            <rtk-menu-list iconPack={this.iconPack} t={this.t}>
              <rtk-menu-item
                size={this.size}
                iconPack={this.iconPack}
                t={this.t}
                role="button"
                tabIndex={0}
                aria-disabled={this.screenShareState.disable}
                onClick={this.enableScreenShare}
                onKeyDown={this.handleMenuItemKeyDown}
              >
                <rtk-icon
                  icon={this.iconPack.share_screen_different ?? this.iconPack.share_screen_start}
                  slot="start"
                />
                {this.t('screenshare.share_different_screen')}
              </rtk-menu-item>
              <rtk-menu-item
                size={this.size}
                iconPack={this.iconPack}
                t={this.t}
                role="button"
                tabIndex={0}
                aria-disabled={this.screenShareState.disable}
                onClick={this.stopScreenShare}
                onKeyDown={this.handleMenuItemKeyDown}
              >
                <rtk-icon icon={this.iconPack.share_screen_stop} slot="start" />
                {this.t('screenshare.stop')}
              </rtk-menu-item>
            </rtk-menu-list>
          </rtk-menu>
        ) : (
          screenShareButton
        )}
      </Host>
    );
  }
}
