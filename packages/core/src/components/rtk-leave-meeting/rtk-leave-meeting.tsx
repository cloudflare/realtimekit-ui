import { Component, Host, h, Prop, EventEmitter, Event, State, Watch } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { States } from '../../types/props';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { SyncWithStore } from '../../utils/sync-with-store';

/**
 * A component which allows you to leave a meeting or
 * end meeting for all, if you have the permission.
 */
@Component({
  tag: 'rtk-leave-meeting',
  styleUrl: 'rtk-leave-meeting.css',
  shadow: true,
})
export class RtkLeaveMeeting {
  private keyPressListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
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

  @State() canEndMeeting: boolean = false;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  private isBreakoutRoomsActive: boolean = false;

  private isChildMeeting: boolean = false;

  private canJoinMainRoom: boolean = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
    document.addEventListener('keydown', this.keyPressListener);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.keyPressListener);
    this.meeting?.self.permissions.removeListener(
      'permissionsUpdate',
      this.permissionsUpdateListener
    );
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting != null) {
      this.isBreakoutRoomsActive = this.meeting.connectedMeetings.isActive;

      this.isChildMeeting = this.meeting.connectedMeetings.meetings.some(
        (cMeet) => cMeet.id === meeting.meta.meetingId
      );

      this.meeting.self.permissions.addListener(
        'permissionsUpdate',
        this.permissionsUpdateListener
      );
      this.permissionsUpdateListener();
    }
  }

  private permissionsUpdateListener = () => {
    this.canEndMeeting = this.meeting.self.permissions.kickParticipant;
    this.canJoinMainRoom = this.meeting.self.permissions.connectedMeetings.canSwitchToParentMeeting;
  };

  private close = () => {
    this.stateUpdate.emit({ activeLeaveConfirmation: false });
  };

  private handleLeave = () => {
    this.meeting?.leave();
    this.close();
  };

  private handleJoinMainRoom = () => {
    this.meeting.connectedMeetings.moveParticipants(
      this.meeting.meta.meetingId,
      this.meeting.connectedMeetings.parentMeeting.id,
      [this.meeting.self.userId]
    );
    this.close();
  };

  private handleEndMeeting = () => {
    this.meeting?.participants.kickAll();
    this.close();
  };

  render() {
    return (
      <Host>
        <div class="leave-modal">
          <div class="header">
            <h2 class="title">{this.t('leave')}</h2>
          </div>
          <p class="message">
            {this.isBreakoutRoomsActive && this.isChildMeeting
              ? this.t('breakout_rooms.leave_confirmation')
              : this.t('leave_confirmation')}
          </p>
          <div class="content">
            <rtk-button variant="secondary" onClick={this.close} class="secondary-btn">
              {this.t('cancel')}
            </rtk-button>
            {this.isBreakoutRoomsActive && this.isChildMeeting && this.canJoinMainRoom && (
              <rtk-button
                variant="secondary"
                onClick={this.handleJoinMainRoom}
                class="secondary-btn"
              >
                {this.t('breakout_rooms.leave_confirmation.main_room_btn')}
              </rtk-button>
            )}
            <rtk-button variant="danger" title={this.t('leave')} onClick={this.handleLeave}>
              {this.t('leave')}
            </rtk-button>

            {this.canEndMeeting && (
              <rtk-button
                variant="danger"
                class="secondary-btn secondary-danger-btn"
                onClick={this.handleEndMeeting}
              >
                {this.t('end.all')}
              </rtk-button>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
