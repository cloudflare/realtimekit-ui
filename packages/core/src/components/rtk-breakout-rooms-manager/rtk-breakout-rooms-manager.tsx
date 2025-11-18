import { Component, h, Host, Prop, Event, EventEmitter, State, Watch, Listen } from '@stencil/core';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { PartialStateEvent, States } from '../../types/props';
import { Meeting } from '../../types/rtk-client';
import { participantIdentifier, resetRoomCount } from '../../utils/breakout-rooms';
import { RTKPermissionsPreset } from '@cloudflare/realtimekit';
import { SyncWithStore } from '../../utils/sync-with-store';
import BreakoutRoomsManager, { DraftMeeting } from '../../utils/breakout-rooms-manager';

export type BreakoutManagerState = 'room-config' | 'participants-config';
export type BreakoutRoomConfig = {
  rooms: number; // Number of rooms to be created.
  step: BreakoutManagerState; // State in which manger is.
  mode: 'edit' | 'create'; // Mode in which the modal is used.
  applyingChanges: boolean; // Flag, true when changes are being applied.
};

const MIN_ROOMS = 1;

@Component({
  tag: 'rtk-breakout-rooms-manager',
  styleUrl: 'rtk-breakout-rooms-manager.css',
  shadow: true,
})
export class RtkBreakoutRoomsManager {
  private selectorRef: HTMLDivElement;

  private permissions: RTKPermissionsPreset['connectedMeetings'];

  /** Flag to indicate busy state */
  @State() loading: boolean = false;

  /** Breakout room config object */
  @State() roomConfig: BreakoutRoomConfig = {
    rooms: 2,
    step: 'room-config',
    mode: 'create',
    applyingChanges: false,
  };

  private stateManager: BreakoutRoomsManager;

  /** draft state */
  @State() draftState: {
    parentMeeting: DraftMeeting;
    meetings: DraftMeeting[];
  };

  /** List of assigned participants */
  // @State() unassignedParticipants: string[] = [];

  /** Flag that tells if participants are being assigned or not */
  @State() assigningParticipants: boolean = false;

  /** List of selected peers */
  @State() selectedParticipants: string[] = [];

  /** update about room changes */
  @State() ephemeralStatusText: string = '';

  /** Flag that tells if participants are being dragged */
  @State() isDragMode: boolean = false;

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

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<PartialStateEvent>;

  @Watch('selectedParticipants')
  onSelectedParticipantsChanged(participants) {
    if (participants.length > 0) this.assigningParticipants = true;
    else this.assigningParticipants = false;
  }

  connectedCallback() {
    this.permissionsUpdateListener();

    this.meeting.connectedMeetings.on('stateUpdate', this.updateLocalState);
    this.meeting.connectedMeetings.on('changingMeeting', this.close);
    this.meeting.self.permissions.on('permissionsUpdate', this.permissionsUpdateListener);

    this.stateManager = new BreakoutRoomsManager();

    this.fetchRoomState();
  }

  disconnectedCallback() {
    this.meeting.connectedMeetings.off('stateUpdate', this.updateLocalState);
    this.meeting.connectedMeetings.off('changingMeeting', this.close);
    this.meeting.self.permissions.off('permissionsUpdate', this.permissionsUpdateListener);
  }

  private permissionsUpdateListener = () => {
    this.permissions = this.meeting.self.permissions.connectedMeetings;
  };

  private async fetchRoomState() {
    this.loading = true;
    await this.meeting.connectedMeetings.getConnectedMeetings();
    this.loading = false;
  }

  private updateLocalState = (payload) => {
    this.stateManager.updateCurrentState(payload);
    this.draftState = this.stateManager.currentState;
    if (this.meeting.connectedMeetings.isActive) {
      this.roomConfig = { ...this.roomConfig, mode: 'edit' };
    }
    if (this.roomConfig.mode === 'create' && !this.meeting.connectedMeetings.isActive) {
      resetRoomCount();
    }

    if (['edit', 'view'].includes(this.roomConfig.mode)) {
      this.roomConfig = {
        ...this.roomConfig,
        rooms: payload.meetings.length,
        step: 'participants-config',
      };
      this.selectedParticipants = [];
    }
  };

  private setEphemeralStatus(text: string) {
    this.ephemeralStatusText = text;
    setTimeout(() => {
      this.ephemeralStatusText = '';
    }, 3000);
  }

  private onCreateRooms() {
    this.selectedParticipants = [];

    this.stateManager.addNewMeetings(this.roomConfig.rooms);
    this.draftState = this.stateManager.currentState;

    // move to next step -> participants-config
    this.roomConfig = { ...this.roomConfig, step: 'participants-config' };
  }

  private onAddNewRoom = () => {
    this.stateManager.addNewMeeting();
    this.draftState = this.stateManager.currentState;
    this.selectorRef.scrollTo({ top: this.selectorRef.scrollHeight, behavior: 'smooth' });
  };

  private onRoomUpdate = (event: CustomEvent) => {
    const { detail } = event;
    this.stateManager.updateMeetingTitle(detail.id, detail.title);
    this.draftState = this.stateManager.currentState;
  };

  private onRoomDelete = (id: string) => {
    const toDelete = this.stateManager.allConnectedMeetings.find((meeting) => meeting.id === id);
    if (toDelete) {
      this.stateManager.deleteMeeting(id);
      this.draftState = this.stateManager.currentState;
    }
  };

  @Listen('participantDelete')
  onParticipantDelete(event: CustomEvent) {
    const { detail } = event;

    const id = participantIdentifier(detail);
    if (id == null) return;

    this.unassignParticipant(id);
  }

  @Listen('participantsDragging')
  toggleDragMode(e: CustomEvent) {
    this.isDragMode = e.detail;
  }

  private assignParticipantsRandomly() {
    if (this.stateManager.unassignedParticipants.length === 0) return;
    this.stateManager.assignParticipantsRandomly();
    this.draftState = this.stateManager.currentState;
    this.setEphemeralStatus(
      this.t('breakout_rooms.ephemeral_status.participants_assigned_randomly')
    );
  }

  private unassignParticipant = (id: string) => {
    this.stateManager.unassignParticipants([id]);
    this.draftState = this.stateManager.currentState;
  };

  private onUnassignAll = () => {
    this.stateManager.unassignAllParticipants();
    this.draftState = this.stateManager.currentState;
  };

  private assignParticipantsToRoom = (destinationMeetingId: string) => {
    if (this.selectedParticipants.length === 0 || this.assigningParticipants == false) return;

    this.stateManager.assignParticipantsToMeeting(this.selectedParticipants, destinationMeetingId);
    this.draftState = this.stateManager.currentState;
    this.selectedParticipants = [];
    this.assigningParticipants = false;
    this.setEphemeralStatus(this.t('breakout_rooms.ephemeral_status.participants_assigned'));
  };

  private async joinRoom(destinationMeetingId: string) {
    const participantId = participantIdentifier(this.meeting.self);
    this.stateManager.assignParticipantsToMeeting([participantId], destinationMeetingId);
    await this.applyChanges();
  }

  private async closeBreakout() {
    this.stateManager.allConnectedMeetings.forEach((meeting) =>
      this.stateManager.deleteMeeting(meeting.id)
    );
    await this.applyChanges();
  }

  private handleClose = (stateUpdate: EventEmitter<PartialStateEvent>, store: States) => {
    stateUpdate.emit({
      activeBreakoutRoomsManager: {
        active: true,
      },
    });
    store.activeBreakoutRoomsManager = {
      active: true,
    };
  };

  private enableConfirmationModal = (
    modalType: 'start-breakout' | 'close-breakout' = 'start-breakout'
  ) => {
    let activeConfirmationModal: States['activeConfirmationModal'] = {
      active: true,
      header: 'breakout_rooms.confirm_modal.start_breakout.header',
      content: 'breakout_rooms.confirm_modal.start_breakout.content',
      variant: 'primary',
      cancelText: 'breakout_rooms.confirm_modal.start_breakout.cancelText',
      ctaText: 'breakout_rooms.confirm_modal.start_breakout.ctaText',
      onClick: () => this.applyChanges(),
      onClose: this.handleClose,
    };
    if (modalType === 'close-breakout') {
      activeConfirmationModal = {
        active: true,
        header: 'breakout_rooms.confirm_modal.close_breakout.header',
        content: 'breakout_rooms.confirm_modal.close_breakout.content',
        variant: 'danger',
        cancelText: 'cancel',
        ctaText: 'breakout_rooms.confirm_modal.close_breakout.ctaText',
        onClick: () => this.closeBreakout(),
        onClose: this.handleClose,
      };
    }

    this.stateUpdate.emit({
      activeBreakoutRoomsManager: { active: false },
      activeConfirmationModal,
    });
  };

  private close = () => {
    this.stateManager.discardChanges();
    this.stateUpdate.emit({
      activeBreakoutRoomsManager: {
        active: false,
      },
    });
  };

  private applyChanges = async () => {
    this.roomConfig = { ...this.roomConfig, applyingChanges: true };
    await this.stateManager.applyChanges(this.meeting);
    this.close();
    this.roomConfig = { ...this.roomConfig, applyingChanges: false };
  };

  @Listen('selectedParticipantsUpdate')
  updateSelectedParticipants(e: CustomEvent) {
    this.selectedParticipants = e.detail;
  }

  @Listen('allParticipantsToggleUpdate')
  updateAllParticipants(e: CustomEvent) {
    this.selectedParticipants = e.detail;
  }

  private getStatusText() {
    if (this.ephemeralStatusText !== '') return this.ephemeralStatusText;
    let statusText = '';

    if (this.roomConfig.mode === 'create') {
      statusText = this.t('breakout_rooms.status.assign_multiple');
      if (this.selectedParticipants.length !== 0) {
        statusText = this.t('breakout_rooms.status.select_room');
      }
    }

    return statusText;
  }

  private getApproxDistribution() {
    const num =
      this.stateManager.unassignedParticipants.length / (this.roomConfig.rooms || MIN_ROOMS);
    return Math.max(MIN_ROOMS, Math.round(num));
  }

  private deselectAll() {
    this.selectedParticipants = [];
  }

  private async discardChanges() {
    this.stateManager.discardChanges();
    await this.fetchRoomState();
    this.setEphemeralStatus(this.t('breakout_rooms.ephemeral_status.changes_discarded'));
  }

  private shouldShowOnlyRoomSwitcher() {
    return this.permissions.canAlterConnectedMeetings === false;
  }

  private getPermittedRooms() {
    if (this.permissions.canAlterConnectedMeetings || this.permissions.canSwitchConnectedMeetings) {
      return this.stateManager.allConnectedMeetings;
    }
    return this.stateManager.allConnectedMeetings.filter(
      (cMeeting) => cMeeting.id === this.meeting.meta.meetingId
    );
  }

  private renderMainRoomMaybe() {
    if (!(this.meeting.connectedMeetings.isActive && this.permissions.canSwitchToParentMeeting)) {
      return null;
    }

    return (
      <rtk-breakout-room-manager
        key={this.stateManager.currentState.parentMeeting['id']}
        assigningParticipants={this.assigningParticipants}
        isDragMode={this.isDragMode}
        meeting={this.meeting}
        mode={this.roomConfig.mode}
        onParticipantsAdd={() =>
          this.assignParticipantsToRoom(this.stateManager.currentState.parentMeeting['id'])
        }
        onRoomJoin={() => this.joinRoom(this.stateManager.currentState.parentMeeting['id'])}
        onUpdate={this.onRoomUpdate}
        states={this.states}
        room={{ ...this.stateManager.currentState.parentMeeting }}
        iconPack={this.iconPack}
        t={this.t}
      />
    );
  }

  private renderRoomSwitcher() {
    return (
      <Host>
        <div class="room-switcher-container">
          <header>
            <rtk-icon icon={this.iconPack.breakout_rooms} />
            <span>{this.t('breakout_rooms.join_breakout_header')}</span>
          </header>
          <div class="rooms" ref={(el) => (this.selectorRef = el)}>
            {this.renderMainRoomMaybe()}
            {this.getPermittedRooms().map((room, idx) => {
              return (
                <rtk-breakout-room-manager
                  key={room['id']}
                  assigningParticipants={this.assigningParticipants}
                  isDragMode={this.isDragMode}
                  defaultExpanded={idx === 0}
                  meeting={this.meeting}
                  mode={this.roomConfig.mode}
                  onDelete={() => this.onRoomDelete(room['id'])}
                  onParticipantsAdd={() => this.assignParticipantsToRoom(room['id'])}
                  onRoomJoin={() => this.joinRoom(room['id'])}
                  states={this.states}
                  room={{ ...room }} // NOTE(ravindra-cloudflare): this prevents cache
                  iconPack={this.iconPack}
                  t={this.t}
                  allowDelete={false}
                />
              );
            })}
          </div>
        </div>
      </Host>
    );
  }

  private renderLoading() {
    return (
      <Host>
        <div class="loading-content">
          <rtk-spinner size="xl" />
        </div>
      </Host>
    );
  }

  private renderRoomConfig() {
    return (
      <Host>
        <div class="room-config">
          <header>
            <rtk-icon icon={this.iconPack.breakout_rooms} />
            <span>{this.t('breakout_rooms.room_config_header')}</span>
          </header>
          <div class="create-room">
            <p>{this.t('breakout_rooms.num_of_rooms')}</p>
            <rtk-counter
              value={this.roomConfig.rooms}
              minValue={MIN_ROOMS}
              iconPack={this.iconPack}
              t={this.t}
              onValueChange={(val) => {
                this.roomConfig = {
                  ...this.roomConfig,
                  rooms: Math.max(+val.detail, MIN_ROOMS),
                };
              }}
            />
          </div>
          <span class="distribution-hint">
            {`${this.t('breakout_rooms.approx')}${' '}`}{' '}
            <em>
              {this.getApproxDistribution()} {this.t('breakout_rooms.participants_per_room')}
            </em>{' '}
            {this.t('breakout_rooms.division_text')}
          </span>
          <footer>
            <rtk-button
              kind="button"
              size="lg"
              title={this.t('create')}
              disabled={this.roomConfig.rooms === 0}
              onClick={() => this.onCreateRooms()}
            >
              {this.t('create')}
            </rtk-button>
          </footer>
        </div>
      </Host>
    );
  }

  render() {
    if (this.loading) {
      return this.renderLoading();
    }

    if (this.shouldShowOnlyRoomSwitcher()) {
      return this.renderRoomSwitcher();
    }

    if (this.roomConfig.step === 'room-config') {
      return this.renderRoomConfig();
    }

    // participant config
    return (
      <Host>
        <div class="participant-config-wrapper">
          <div class="participant-config">
            <aside part="menu">
              <header>{this.t('breakout_rooms.assign_participants')}</header>
              <rtk-breakout-room-participants
                meeting={this.meeting}
                iconPack={this.iconPack}
                t={this.t}
                participantIds={this.stateManager.unassignedParticipants.map(participantIdentifier)}
                selectedParticipantIds={this.selectedParticipants}
              >
                <rtk-tooltip
                  label={this.t('breakout_rooms.shuffle_participants')}
                  slot="shuffle-button"
                >
                  <rtk-button
                    disabled={
                      this.roomConfig.mode === 'edit' ||
                      this.stateManager.unassignedParticipants.length === 0
                    }
                    kind="button"
                    variant="secondary"
                    size="md"
                    onClick={() => this.assignParticipantsRandomly()}
                    class="shuffle-button br-primary-btn"
                  >
                    <rtk-icon icon={this.iconPack.shuffle} />
                  </rtk-button>
                </rtk-tooltip>
              </rtk-breakout-room-participants>
              {this.selectedParticipants.length !== 0 && (
                <div class="participants-assign-actions">
                  <span>{`${this.selectedParticipants.length} ${this.t(
                    'breakout_rooms.selected'
                  )}`}</span>
                  <rtk-button
                    disabled={this.roomConfig.mode === 'edit'}
                    kind="button"
                    variant="ghost"
                    size="md"
                    onClick={() => this.deselectAll()}
                    class="deselect-button color-danger"
                  >
                    {this.t('breakout_rooms.deselect')}
                  </rtk-button>
                </div>
              )}
            </aside>

            <div class="assign-rooms">
              <div class="row">
                <p class="row-header">
                  {this.t('breakout_rooms.rooms')} ({this.stateManager.allConnectedMeetings.length})
                </p>

                {!this.assigningParticipants && (
                  <div class="cta-buttons">
                    <rtk-button kind="button" variant="secondary" class="br-primary-btn">
                      <div onClick={this.onAddNewRoom}>
                        <rtk-icon icon={this.iconPack.add} />
                        {this.t('breakout_rooms.add_room')}
                      </div>
                    </rtk-button>
                    {this.stateManager.allConnectedMeetings.flatMap((m) => m.participants)
                      .length !== 0 && (
                      <rtk-button kind="button" variant="ghost" onClick={this.onUnassignAll}>
                        {this.t('breakout_rooms.unassign_all')}
                      </rtk-button>
                    )}
                  </div>
                )}
              </div>

              <div class="rooms" ref={(el) => (this.selectorRef = el)}>
                {this.renderMainRoomMaybe()}
                {this.getPermittedRooms().map((room, idx) => {
                  return (
                    <rtk-breakout-room-manager
                      key={room['id']}
                      assigningParticipants={this.assigningParticipants}
                      isDragMode={this.isDragMode}
                      defaultExpanded={idx === 0}
                      meeting={this.meeting}
                      mode={this.roomConfig.mode}
                      onDelete={() => this.onRoomDelete(room['id'])}
                      onParticipantsAdd={() => this.assignParticipantsToRoom(room['id'])}
                      onRoomJoin={() => this.joinRoom(room['id'])}
                      onUpdate={this.onRoomUpdate}
                      states={this.states}
                      room={{ ...room }} // NOTE(ravindra-cloudflare): this prevents cache
                      iconPack={this.iconPack}
                      t={this.t}
                      allowDelete={this.stateManager.allConnectedMeetings.length > MIN_ROOMS}
                    />
                  );
                })}
                <rtk-button
                  kind="button"
                  variant="secondary"
                  onClick={this.onAddNewRoom}
                  class="add-room-jumbo-btn br-secondary-btn"
                >
                  <div>
                    <rtk-icon icon={this.iconPack.add} />
                    <span>{this.t('breakout_rooms.add_room_brief')}</span>
                  </div>
                </rtk-button>
              </div>
            </div>
          </div>
          <div class="participant-config-actions">
            <div
              class={{ 'status-bar': true, 'ephemeral-status': this.ephemeralStatusText !== '' }}
            >
              {this.ephemeralStatusText !== '' && <rtk-icon icon={this.iconPack.checkmark} />}
              {this.getStatusText()}
            </div>
            <div class="breakout-actions">
              {this.roomConfig.mode === 'create' && this.permissions.canAlterConnectedMeetings && (
                <rtk-button
                  size="md"
                  class="start-breakout-button"
                  onClick={() => this.enableConfirmationModal('start-breakout')}
                >
                  {this.t('breakout_rooms.start_breakout')}
                </rtk-button>
              )}
              {this.roomConfig.mode === 'edit' &&
                this.stateManager.hasLocalChanges &&
                this.permissions.canAlterConnectedMeetings && (
                  <rtk-button
                    size="md"
                    class="color-danger"
                    variant="ghost"
                    onClick={() => this.discardChanges()}
                  >
                    {this.t('breakout_rooms.discard_changes')}
                  </rtk-button>
                )}
              {this.roomConfig.mode === 'edit' &&
                this.stateManager.hasLocalChanges &&
                this.permissions.canAlterConnectedMeetings && (
                  <rtk-button size="md" class="update-breakout-button" onClick={this.applyChanges}>
                    {this.t('breakout_rooms.update_breakout')}
                  </rtk-button>
                )}
              {this.roomConfig.mode === 'edit' &&
                !this.stateManager.hasLocalChanges &&
                this.permissions.canAlterConnectedMeetings && (
                  <rtk-button
                    size="md"
                    class="close-breakout-button"
                    onClick={() => this.enableConfirmationModal('close-breakout')}
                  >
                    {this.t('breakout_rooms.close_breakout')}
                  </rtk-button>
                )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
