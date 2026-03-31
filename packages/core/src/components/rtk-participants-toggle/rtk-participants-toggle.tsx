import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting, Peer, WaitlistedParticipant } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { canViewParticipants } from '../../utils/sidebar';
import { SyncWithStore } from '../../utils/sync-with-store';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';

/**
 * A button which toggles visibility of participants.
 *
 * When clicked it emits a `rtkStateUpdate` event with the data:
 *
 * ```ts
 * { activeSidebar: boolean; sidebar: 'participants' }
 * ```
 */
@Component({
  tag: 'rtk-participants-toggle',
  styleUrl: 'rtk-participants-toggle.css',
  shadow: true,
})
export class RtkParticipantsToggle {
  private waitlistedParticipantJoinedListener: (participant: WaitlistedParticipant) => void;
  private waitlistedParticipantLeftListener: (participant: WaitlistedParticipant) => void;

  /** Variant */
  @Prop({ reflect: true }) variant: ControlBarVariant = 'button';

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

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() participantsActive: boolean = false;

  @State() waitlistedParticipants: WaitlistedParticipant[] = [];
  @State() stageRequestedParticipants: Peer[] = [];
  @State() badgeCount: number = 0;

  @State() canViewParticipants: boolean = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
    this.statesChanged(this.states);
  }

  disconnectedCallback() {
    if (!this.meeting) return;
    this.meeting?.stage?.removeListener('stageStatusUpdate', this.updateCanView);
    this.waitlistedParticipantJoinedListener &&
      this.meeting.participants.waitlisted.removeListener(
        'participantJoined',
        this.waitlistedParticipantJoinedListener
      );
    this.waitlistedParticipantLeftListener &&
      this.meeting.participants.waitlisted.removeListener(
        'participantLeft',
        this.waitlistedParticipantLeftListener
      );
    this.meeting.stage?.removeListener('stageAccessRequestUpdate', this.updateStageRequests);
  }

  private updateStageRequests = async (stageRequests?: any[]) => {
    if (!stageRequests) {
      stageRequests = this.meeting.stage?.getAccessRequests()?.stageRequests ?? [];
    }
    this.stageRequestedParticipants = stageRequests;

    this.stageRequestedParticipants =
      this.meeting.stage.status === 'REQUESTED_TO_JOIN_STAGE'
        ? [this.meeting.self, ...stageRequests]
        : stageRequests;

    this.updateBadgeCount();
  };

  private updateBadgeCount = () => {
    this.badgeCount = this.waitlistedParticipants.length + this.stageRequestedParticipants.length;
  };

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    this.canViewParticipants = canViewParticipants(meeting);
    meeting?.stage?.on('stageStatusUpdate', this.updateCanView);
    if (meeting.self.permissions.acceptWaitingRequests) {
      this.waitlistedParticipants = meeting.participants.waitlisted.toArray();
      this.waitlistedParticipantJoinedListener = (participant: WaitlistedParticipant) => {
        if (!this.waitlistedParticipants.some((p) => p.id === participant.id)) {
          this.waitlistedParticipants = [...this.waitlistedParticipants, participant];
          this.updateBadgeCount();
        }
      };
      this.waitlistedParticipantLeftListener = (participant: WaitlistedParticipant) => {
        this.waitlistedParticipants = this.waitlistedParticipants.filter(
          (p) => p.id !== participant.id
        );
        this.updateBadgeCount();
      };
      meeting.participants.waitlisted.addListener(
        'participantJoined',
        this.waitlistedParticipantJoinedListener
      );
      meeting.participants.waitlisted.addListener(
        'participantLeft',
        this.waitlistedParticipantLeftListener
      );
    }

    if (
      this.meeting.self.permissions.stageEnabled &&
      this.meeting.self.permissions.acceptStageRequests
    ) {
      this.updateStageRequests();
      meeting?.stage.on('stageAccessRequestUpdate', this.updateStageRequests);
    }
    this.updateBadgeCount();
  }

  @Watch('states')
  statesChanged(states?: States) {
    if (states != null) {
      this.participantsActive = states.activeSidebar === true && states.sidebar === 'participants';
    }
  }

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  private toggleParticipantsTab() {
    const states = this.states;
    this.participantsActive = !(states?.activeSidebar && states?.sidebar === 'participants');
    this.stateUpdate.emit({
      activeSidebar: this.participantsActive,
      sidebar: this.participantsActive ? 'participants' : undefined,
      activeMoreMenu: false,
    });
  }

  private updateCanView = () => {
    this.canViewParticipants = canViewParticipants(this.meeting);
  };

  @Watch('participantsActive')
  handleParticipantsActiveChange() {
    // Participants sidebar closed without opening a different sidebar
    if (!this.participantsActive && !this.states.activeSidebar) {
      this.buttonEl.focus();
    }
  }

  private buttonEl: HTMLRtkControlbarButtonElement;

  render() {
    if (!this.canViewParticipants) return <Host data-hidden />;
    const text = this.t('participants');
    return (
      <Host title={text}>
        {this.badgeCount !== 0 && !this.participantsActive && (
          <div class="waiting-participants-count" part="waiting-participants-count">
            <span>{this.badgeCount <= 100 ? this.badgeCount : '99+'}</span>
          </div>
        )}
        <rtk-controlbar-button
          ref={(el) => (this.buttonEl = el)}
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          class={{ active: this.participantsActive }}
          onClick={() => this.toggleParticipantsTab()}
          icon={this.iconPack.participants}
          label={text}
          variant={this.variant}
        />
      </Host>
    );
  }
}
