import { Component, Watch, Host, h, Prop, Event, EventEmitter } from '@stencil/core';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { SyncWithStore } from '../../utils/sync-with-store';
import { Render } from '../../lib/render';

/**
 * A component which handles all dialog elements in a component such as:
 *
 * - rtk-settings
 * - rtk-leave-meeting
 * - rtk-permissions-message
 * - rtk-image-viewer
 * - rtk-breakout-rooms-manager
 *
 * This components depends on the values from `states` object.
 */
@Component({
  tag: 'rtk-dialog-manager',
  styleUrl: 'rtk-dialog-manager.css',
  shadow: true,
})
export class RtkDialogManager {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** UI Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

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

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.meeting.stage?.removeListener('stageStatusUpdate', this.stageStatusUpdateListener);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    const { stage } = meeting;
    stage?.addListener('stageStatusUpdate', this.stageStatusUpdateListener);
  }

  private updateStoreState = (state: keyof States, value: any) => {
    this.stateUpdate.emit({ [state]: value });
  };

  private cancelJoinStage = async () => {
    if (this.meeting.stage?.status === 'ACCEPTED_TO_JOIN_STAGE') {
      await this.meeting?.stage?.leave();
    }
    this.updateStoreState('activeJoinStage', false);
  };

  private joinStage = async () => {
    await this.meeting.stage.join();
    /** NOTE(ishita1805): We close the modal once the status has changed */
  };

  private stageStatusUpdateListener = (status) => {
    if (!this.states?.activeJoinStage) return;

    if (status === 'ON_STAGE') this.updateStoreState('activeJoinStage', false);
  };

  render() {
    if (!this.meeting) {
      return;
    }

    const defaults = {
      meeting: this.meeting,
      states: this.states,
      config: this.config,
      size: this.size,
      iconPack: this.iconPack,
      t: this.t,
    };
    const states = this.states;

    if (states?.image != null) {
      const image = states.image;
      const onImageClose = () => {
        this.stateUpdate.emit({ image: null });
      };

      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={onImageClose}
            hideCloseButton
            iconPack={this.iconPack}
            t={this.t}
          >
            <Render
              element="rtk-image-viewer"
              defaults={defaults}
              props={{ image, onClose: onImageClose }}
            />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeSettings === true) {
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={() => this.updateStoreState('activeSettings', false)}
            iconPack={this.iconPack}
            t={this.t}
          >
            <Render element="rtk-settings" defaults={defaults} />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeDebugger === true) {
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={() => this.updateStoreState('activeDebugger', false)}
            iconPack={this.iconPack}
            t={this.t}
          >
            <rtk-debugger {...defaults} />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeLeaveConfirmation === true) {
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={() => this.updateStoreState('activeLeaveConfirmation', false)}
            iconPack={this.iconPack}
            t={this.t}
          >
            <rtk-leave-meeting {...defaults} />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activePermissionsMessage?.enabled === true) {
      return (
        <Host>
          <rtk-dialog open hideCloseButton iconPack={this.iconPack} t={this.t}>
            <rtk-permissions-message {...defaults} />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeBreakoutRoomsManager?.active === true) {
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={() =>
              this.updateStoreState('activeBreakoutRoomsManager', {
                active: false,
                data: undefined,
              })
            }
            iconPack={this.iconPack}
            t={this.t}
          >
            <rtk-breakout-rooms-manager {...defaults} />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeConfirmationModal?.active === true) {
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={() => this.updateStoreState('activeConfirmationModal', false)}
            iconPack={this.iconPack}
            t={this.t}
          >
            <rtk-confirmation-modal {...defaults} />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeOverlayModal?.active === true) {
      return (
        <Host>
          <rtk-overlay-modal
            meeting={this.meeting}
            states={this.states}
            iconPack={this.iconPack}
            t={this.t}
          />
        </Host>
      );
    } else if (states?.activeBroadcastMessageModal) {
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={() => this.updateStoreState('activeBroadcastMessageModal', false)}
            iconPack={this.iconPack}
            t={this.t}
          >
            <rtk-broadcast-message-modal {...defaults} />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeJoinStage === true) {
      const dataState = {
        title: this.t('stage.join_title'),
        label: {
          accept: this.t('stage.join_confirm'),
          reject: this.t('stage.join_cancel'),
        },
        description: this.t('stage.join_summary'),
      };
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={this.cancelJoinStage}
            iconPack={this.iconPack}
            t={this.t}
          >
            <rtk-join-stage
              dataConfig={dataState}
              onRtkJoinStage={this.joinStage}
              onRtkLeaveStage={this.cancelJoinStage}
              {...defaults}
            />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeMuteAllConfirmation === true) {
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={() => {
              this.updateStoreState('activeMuteAllConfirmation', false);
            }}
            iconPack={this.iconPack}
            t={this.t}
          >
            <rtk-mute-all-confirmation {...defaults} />
          </rtk-dialog>
        </Host>
      );
    } else if (states?.activeChannelCreator) {
      return (
        <Host>
          <rtk-dialog
            open
            onRtkDialogClose={() => {
              this.updateStoreState('activeChannelCreator', false);
            }}
            iconPack={this.iconPack}
            t={this.t}
          >
            <rtk-channel-creator {...defaults} />
          </rtk-dialog>
        </Host>
      );
    }
    return null;
  }
}
