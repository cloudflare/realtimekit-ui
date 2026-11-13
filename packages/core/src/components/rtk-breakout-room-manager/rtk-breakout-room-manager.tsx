import {
  Component,
  h,
  Host,
  Prop,
  Event,
  EventEmitter,
  State,
  Watch,
  writeTask,
} from '@stencil/core';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { ConnectedMeetingParticipant, States } from '../../types/props';
import { Meeting } from '../../types/rtk-client';
import { getAllConnectedParticipants, participantIdentifier } from '../../utils/breakout-rooms';
import type { RTKConnectedMeetings, RTKPermissionsPreset } from '@cloudflare/realtimekit';
import { formatName, shorten } from '../../utils/string';
import { SyncWithStore } from '../../utils/sync-with-store';
import { DraftMeeting } from '../../utils/breakout-rooms-manager';

const ROOM_TITLE_MIN_CHARS = 3;

@Component({
  tag: 'rtk-breakout-room-manager',
  styleUrl: 'rtk-breakout-room-manager.css',
  shadow: true,
})
export class RtkBreakoutRoomManager {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Enable updating participants */
  @Prop() assigningParticipants: boolean;

  /** Mode in which selector is used */
  @Prop() mode: 'edit' | 'create';

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** allow room delete */
  @Prop() allowDelete: boolean = true;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Drag mode */
  @Prop() isDragMode: boolean = false;

  /** Connected Room Config Object */
  @Prop() room: DraftMeeting;

  /** display expanded card by default */
  @Prop() defaultExpanded: boolean = false;

  @State() editingTitleRoomId: string = null;

  @State() newTitle: string = null;

  @State() showExpandedCard: boolean = false;

  @State() glowingCard: boolean = false;

  /** Event for adding a participant */
  @Event({ eventName: 'participantsAdd' }) onParticipantsAdd: EventEmitter<null>;

  /** On Delete event emitter */
  @Event({ eventName: 'participantDelete' }) onParticipantDelete: EventEmitter<{
    customParticipantId: string;
  }>;

  /** Event for joining a room */
  @Event({ eventName: 'roomJoin' }) onRoomJoin: EventEmitter<null>;

  /** Event for deleting room */
  @Event({ eventName: 'delete' }) deleteRoom: EventEmitter<string>;

  /** Event for updating room details */
  @Event({ eventName: 'update' }) updateRoom: EventEmitter<{
    title: string | undefined;
    id: string;
  }>;

  private allParticipants: RTKConnectedMeetings['parentMeeting']['participants'];

  private permissions: RTKPermissionsPreset['connectedMeetings'];

  private roomTitle: string;

  private canEditMeetingTitle: boolean;

  private inputTextEl: HTMLInputElement;

  connectedCallback() {
    this.allParticipants = getAllConnectedParticipants(this.meeting);
    this.permissionsUpdateListener();
    this.showExpandedCard = this.defaultExpanded;
    this.roomChanged(this.room);
    this.canEditMeetingTitle = this.permissions.canAlterConnectedMeetings;

    this.meeting.self.permissions.on('permissionsUpdate', this.permissionsUpdateListener);
  }

  disconnectedCallback() {
    this.meeting.self.permissions.off('permissionsUpdate', this.permissionsUpdateListener);
  }

  @Watch('room')
  roomChanged(room: DraftMeeting) {
    this.roomTitle = room?.title;
  }

  private permissionsUpdateListener = () => {
    this.permissions = this.meeting.self.permissions.connectedMeetings;
  };

  private reset = () => {
    this.inputTextEl?.blur();
    this.editingTitleRoomId = null;
    this.newTitle = null;
  };

  private onEditClick = () => {
    if (this.editingTitleRoomId) {
      if (this.newTitle.length < ROOM_TITLE_MIN_CHARS) return;
      this.roomTitle = this.newTitle;
      this.updateRoom.emit({
        title: this.newTitle,
        id: this.editingTitleRoomId,
      });
      this.glowCard();
      this.reset();
    } else {
      this.newTitle = this.roomTitle;
      this.editingTitleRoomId = this.room.id;
      writeTask(() => {
        this.inputTextEl?.focus();
        this.inputTextEl?.select();
      });
    }
  };

  private onTitleClick = () => {
    if (!this.canEditMeetingTitle || this.editingTitleRoomId === this.room.id) return;
    this.onEditClick();
  };

  private onTitleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.onTitleClick();
  };

  private onDrop = (e: DragEvent) => {
    if (e.currentTarget instanceof HTMLParagraphElement) {
      e.currentTarget.classList.remove('drop-zone-active');
      this.onAssign();
    }
  };

  private onDragOver = (e: DragEvent) => {
    if (e.currentTarget instanceof HTMLParagraphElement) {
      e.currentTarget.classList.add('drop-zone-active');
      e.preventDefault();
    }
  };

  private onDragLeave(e: DragEvent) {
    if (e.currentTarget instanceof HTMLParagraphElement) {
      e.currentTarget.classList.remove('drop-zone-active');
    }
  }

  private getAssignmentHint() {
    if (this.assigningParticipants && this.isDragMode) {
      return this.t('breakout_rooms.drag_drop_participants');
    }
    if (this.assigningParticipants) {
      return this.t('breakout_rooms.click_drop_participants');
    }
    if (this.room.participants.length === 0) {
      return this.t('breakout_rooms.none_assigned');
    }
  }

  private toggleCardDisplay() {
    this.showExpandedCard = !this.showExpandedCard;
  }

  private glowCard() {
    this.glowingCard = true;
    setTimeout(() => {
      this.glowingCard = false;
    }, 2000);
  }

  private onAssign() {
    this.onParticipantsAdd.emit();
    this.glowCard();
  }

  private onJoin() {
    this.onRoomJoin.emit();
  }
  private onTitleChanged(e) {
    if (e.key === 'Enter') {
      this.newTitle = (e.target as HTMLInputElement).value;
      this.onEditClick();
    }
  }

  private renderPeer(participant: ConnectedMeetingParticipant) {
    const { displayPictureUrl: picture } = this.allParticipants.find(
      (p) => participantIdentifier(p) === participantIdentifier(participant)
    );
    const name = formatName(participant.displayName || '');
    return (
      <div class="peer-ui-container">
        <rtk-avatar participant={{ name, picture }} size="sm" />
        <p class="name" title={name}>
          {shorten(name, 16)}
          {this.meeting.self.userId === participant.id && ` (${this.t('you')})`}
        </p>
      </div>
    );
  }

  private renderExpandedCardMaybe() {
    if (!this.showExpandedCard) return;
    if (this.room.isParent) return;
    if (!this.getAssignmentHint()) return;
    if (!this.permissions.canAlterConnectedMeetings) return;

    return (
      <div class="message-container">
        <p
          class={{ 'compact-height': this.room.participants.length !== 0 }}
          onClick={() => this.onAssign()}
          onDragOver={this.onDragOver}
          onDragLeave={this.onDragLeave}
          onDrop={this.onDrop}
        >
          {this.getAssignmentHint()}
        </p>
      </div>
    );
  }

  private renderParticipantsMaybe() {
    if (!this.showExpandedCard) return;
    if (this.room.isParent) return;
    if (this.room.participants.length === 0) return;

    return (
      <div
        class="participant-list"
        onClick={() => {
          this.onAssign();
        }}
      >
        {this.room.participants.map((participant) => (
          <div class="participant-item" role="listitem" key={participant.id}>
            {this.renderPeer(participant)}
            {this.permissions.canAlterConnectedMeetings && (
              <rtk-icon
                class="show-on-hover"
                icon={this.iconPack.dismiss}
                onClick={() => {
                  this.onParticipantDelete.emit(participant);
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  render() {
    if (!this.meeting || !this.room || !this.permissions) return null;

    /* NOTE(ravindra-cloudflare):
     *  Checking if user can switch to this room
     *  Check 1: if user has full access.
     *  Check 2: For non-parent room, user has "switch meeting" access.
     *  Check 3: For parent room, user has "switch to parent meeting" access.
     */
    const canSwitchToThisRoom =
      this.permissions.canAlterConnectedMeetings ||
      (this.permissions.canSwitchConnectedMeetings && !this.room.isParent) ||
      (this.permissions.canSwitchToParentMeeting && this.room.isParent);

    return (
      <Host>
        <div
          class={{
            'assign-mode': this.assigningParticipants,
            'selector-mode': !this.assigningParticipants,
            'glowing-card': this.glowingCard,
          }}
        >
          <div class="header">
            {this.editingTitleRoomId === this.room.id ? (
              <input
                ref={(el) => (this.inputTextEl = el)}
                placeholder={this.t('breakout_rooms.room_name')}
                value={this.newTitle}
                minlength={ROOM_TITLE_MIN_CHARS}
                onInput={(e) => {
                  this.newTitle = (e.target as HTMLInputElement).value;
                }}
                onKeyPress={(e) => this.onTitleChanged(e)}
                style={{ width: `${this.roomTitle.length + 1}ch` }}
              />
            ) : (
              <span
                class="room-title"
                title={this.roomTitle}
                role={this.canEditMeetingTitle ? 'button' : undefined}
                tabIndex={this.canEditMeetingTitle ? 0 : undefined}
                aria-label={
                  this.canEditMeetingTitle ? this.t('breakout_rooms.edit_room_name') : undefined
                }
                onClick={this.canEditMeetingTitle ? this.onTitleClick : undefined}
                onKeyDown={this.canEditMeetingTitle ? this.onTitleKeyDown : undefined}
              >
                {this.roomTitle}
              </span>
            )}
            {this.canEditMeetingTitle && (
              <rtk-tooltip
                class="title-action"
                label={
                  this.editingTitleRoomId === this.room.id
                    ? this.t('breakout_rooms.save_room_name')
                    : this.t('breakout_rooms.edit_room_name')
                }
              >
                <rtk-icon
                  icon={
                    this.editingTitleRoomId === this.room.id
                      ? this.iconPack.checkmark
                      : this.iconPack.edit
                  }
                  class="show-on-hover"
                  onClick={this.onEditClick}
                />
              </rtk-tooltip>
            )}
            <span class="main-room-indicator">
              {this.room.isParent ? this.t('breakout_rooms.main_room') : ''}
            </span>
            <span class="participant-count">
              (<rtk-icon icon={this.iconPack.people} />
              {this.room?.participants?.length ?? '0'})
            </span>

            <div class="rooms-container">
              {this.permissions.canAlterConnectedMeetings &&
                !this.room.isParent &&
                this.allowDelete && (
                  <rtk-tooltip label={this.t('breakout_rooms.delete')} class="danger">
                    <rtk-icon
                      icon={this.iconPack.delete}
                      class="show-on-hover"
                      onClick={() => {
                        this.deleteRoom.emit();
                      }}
                    />
                  </rtk-tooltip>
                )}
              {this.assigningParticipants &&
                this.permissions.canAlterConnectedMeetings &&
                !this.room.isParent && (
                  <rtk-button
                    kind="button"
                    variant="ghost"
                    class="assign-button"
                    size="md"
                    onClick={() => this.onAssign()}
                  >
                    {this.t('breakout_rooms.assign')}
                  </rtk-button>
                )}
              {this.mode === 'edit' && !this.assigningParticipants && canSwitchToThisRoom && (
                <rtk-button
                  kind="button"
                  variant="ghost"
                  class="assign-button"
                  size="md"
                  disabled={this.room.id === this.meeting.meta.meetingId}
                  onClick={() => this.onJoin()}
                >
                  {this.room.id === this.meeting.meta.meetingId ? this.t('joined') : this.t('join')}
                </rtk-button>
              )}
              {!this.room.isParent && (
                <rtk-icon
                  icon={
                    this.showExpandedCard ? this.iconPack.chevron_up : this.iconPack.chevron_down
                  }
                  onClick={() => this.toggleCardDisplay()}
                />
              )}
            </div>
          </div>
          {this.renderExpandedCardMaybe()}
          {this.renderParticipantsMaybe()}
        </div>
      </Host>
    );
  }
}
