import {
  Component,
  Event,
  EventEmitter,
  Host,
  h,
  Prop,
  State,
  Watch,
  Element,
} from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { DefaultProps, lenChildren, Render } from '../../lib/render';
import { Meeting, Participant, Peer } from '../../types/rtk-client';
import { formatName, shorten } from '../../utils/string';
import { createDefaultConfig, States, UIConfig } from '../../exports';
import { autoPlacement, computePosition, hide, offset, shift } from '@floating-ui/dom';
import { SyncWithStore } from '../../utils/sync-with-store';
import type { RTKParticipant, RTKSelf } from '@cloudflare/realtimekit';

export type ParticipantViewMode = 'sidebar';

/**
 * A participant entry component used inside `rtk-participants` which shows data like:
 * name, picture and media device status.
 *
 * You can perform privileged actions on the participant too.
 */
@Component({
  tag: 'rtk-participant',
  styleUrl: 'rtk-participant.css',
  shadow: true,
})
export class RtkParticipant {
  private audioUpdateListener: (data: Pick<Peer, 'audioEnabled' | 'audioTrack'>) => void;
  private videoUpdateListener: (data: Pick<Peer, 'videoEnabled' | 'videoTrack'>) => void;

  private pinnedListener = ({ isPinned }: Peer) => {
    this.isPinned = isPinned;
  };

  private toggleTileListener = ({ hidden }: { hidden: boolean }) => {
    this.isHidden = hidden;
  };

  private stageListener = ({ stageStatus }: Peer) => {
    this.isOnStage = stageStatus === 'ON_STAGE';
  };

  @Element() host: HTMLRtkParticipantElement;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Show participant summary */
  @Prop() view: ParticipantViewMode = 'sidebar';

  /** Participant object */
  @Prop() participant: Peer;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Config object */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /**
   * Emit notifications
   */
  @Event({ bubbles: true, composed: true }) rtkSendNotification: EventEmitter<{
    trace: string;
    message: string;
  }>;

  @State() audioEnabled: boolean = false;
  @State() videoEnabled: boolean = false;
  @State() isPinned: boolean = false;
  @State() isHidden: boolean = false;
  @State() isOnStage: boolean = false;

  @State() canDisableParticipantAudio: boolean = false;
  @State() canDisableParticipantVideo: boolean = false;
  @State() canKickParticipant: boolean = false;
  @State() canPinParticipant: boolean = false;
  @State() canAllowParticipantOnStage: boolean = false;

  @State() menuOpen: boolean = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
    this.participantChanged(this.participant);
    document.addEventListener('click', this.handleOutsideClick);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.handleOutsideClick);
    this.meeting?.self.permissions.removeListener(
      'permissionsUpdate',
      this.permissionsUpdateListener
    );
    if (this.participant == null || this.participant.removeListener == undefined) return;
    this.audioUpdateListener &&
      (this.participant as RTKParticipant).removeListener('audioUpdate', this.audioUpdateListener);
    this.videoUpdateListener &&
      (this.participant as RTKParticipant).removeListener('videoUpdate', this.videoUpdateListener);
    (this.participant as RTKParticipant).removeListener('pinned', this.pinnedListener);
    (this.participant as RTKParticipant).removeListener('unpinned', this.pinnedListener);
    (this.participant as RTKParticipant).removeListener('stageStatusUpdate', this.stageListener);
    (this.participant as RTKSelf).removeListener('toggleTile', this.toggleTileListener);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting != null) {
      const { self } = meeting;
      this.canDisableParticipantAudio =
        self.permissions.canAllowParticipantAudio || self.permissions.canDisableParticipantAudio;
      this.canDisableParticipantVideo =
        self.permissions.canAllowParticipantVideo || self.permissions.canDisableParticipantVideo;
      this.canKickParticipant = self.permissions.kickParticipant;
      this.canPinParticipant = self.permissions.pinParticipant;
      this.canAllowParticipantOnStage =
        self.permissions.acceptStageRequests && self.permissions.stageEnabled;

      meeting.self.permissions.addListener('permissionsUpdate', this.permissionsUpdateListener);
    }
  }

  @Watch('participant')
  participantChanged(participant: Peer) {
    if (participant != null) {
      this.audioEnabled = participant.audioEnabled;
      this.videoEnabled = participant.videoEnabled;
      this.isPinned = participant.isPinned;
      this.isHidden = (participant as RTKSelf).hidden ?? false;
      this.isOnStage = participant.stageStatus === 'ON_STAGE';
      this.audioUpdateListener = ({ audioEnabled }) => {
        this.audioEnabled = audioEnabled;
      };
      this.videoUpdateListener = ({ videoEnabled }) => {
        this.videoEnabled = videoEnabled;
      };
      if (participant.addListener == undefined) return;
      (participant as RTKParticipant).addListener('audioUpdate', this.audioUpdateListener);
      (participant as RTKParticipant).addListener('videoUpdate', this.videoUpdateListener);
      (participant as RTKParticipant).addListener('pinned', this.pinnedListener);
      (participant as RTKParticipant).addListener('unpinned', this.pinnedListener);
      (participant as RTKParticipant).addListener('stageStatusUpdate', this.stageListener);
      (this.participant as RTKSelf).addListener('toggleTile', this.toggleTileListener);
    }
  }

  private permissionsUpdateListener = () => {
    this.meetingChanged(this.meeting);
  };

  private inviteToStageToggle = async () => {
    const p = this.participant as Participant;
    const { stage } = this.meeting;
    // If request has been sent once, do nothing.
    if (p.stageStatus === 'ACCEPTED_TO_JOIN_STAGE') {
      // Send a notification to host telling that the user has been invited.
      this.rtkSendNotification.emit({
        message: `${p.name} ${this.t('stage.invited_notification')}`,
        trace: `join-stage-${p.id}`,
      });
      return;
    }
    if (this.isOnStage) {
      // NOTE (@madhugb): when a pinned participnat is removed from stage, we need to unpin them manually
      if (p.isPinned) p.unpin();
      await stage.kick([p.userId]);
    } else {
      await stage.grantAccess([p.userId]);
      // Send a notification to host telling that the user has been invited.
      this.rtkSendNotification.emit({
        message: `${p.name} ${this.t('stage.invited_notification')}`,
        trace: `join-stage-invite-${p.id}`,
      });
    }
    this.isOnStage = p.stageStatus === 'ON_STAGE';
  };

  private handleOutsideClick = (event) => {
    const path = event.composedPath();
    const clickedOutside = !path.includes(this.host);

    // handles clicking on other menu triggers
    if (clickedOutside && this.menuOpen) {
      this.menuOpen = false;
    }
  };

  private update = () => {
    const triggerEl = this.host.shadowRoot.getElementById('trigger');
    const menuListEl = this.host.shadowRoot.getElementById('menu-list');
    computePosition(triggerEl, menuListEl, {
      placement: 'bottom-end', // Default placement
      middleware: [
        autoPlacement({
          allowedPlacements: ['bottom-end', 'top-end'], // Prioritize bottom alignment
          alignment: 'end', // Align to start of the trigger
        }),
        offset(4), // Add space between the trigger and menu
        shift({ padding: 8 }), // Adjust if the menu is too close to the viewport edges
        hide(),
      ],
    }).then(({ x, y, placement }) => {
      let position = null;
      if (placement === 'bottom-end') {
        position = {
          right: `${x}px`,
          top: `${y}px`,
        };
      } else {
        position = {
          right: `${x}px`,
          bottom: `${y}px`,
        };
      }
      Object.assign(menuListEl.style, position);
    });
  };

  private onMenuToggle = () => {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) {
      this.update();
    }
  };

  render() {
    const isAudioRoom = this.meeting?.meta.viewType === 'AUDIO_ROOM';
    const isSelf = this.meeting?.self.id === this.participant.id;

    const showMenu =
      (this.canDisableParticipantAudio && this.audioEnabled) ||
      (this.canDisableParticipantVideo && this.videoEnabled && !isAudioRoom) ||
      this.canKickParticipant ||
      (this.canPinParticipant && this.isOnStage) ||
      this.canAllowParticipantOnStage;

    const name = formatName(this.participant?.name || '');
    // NOTE(@madhugb): Show some actions for only on stage / non-webinar participants
    // NOTE(@vaibhavshn): Update check after listeners are implemented
    const isActiveParticipant =
      this.isOnStage || ['GROUP_CALL', 'AUDIO_ROOM'].includes(this.meeting?.meta.viewType);

    const defaults: DefaultProps = {
      meeting: this.meeting,
      size: 'sm',
      states: this.states,
      config: this.config,
      iconPack: this.iconPack,
      t: this.t,
    };
    return (
      <Host>
        <div class="left" key={this.participant?.id}>
          <rtk-avatar
            participant={this.participant}
            size="sm"
            iconPack={this.iconPack}
            t={this.t}
          />
          <p class="name" title={name}>
            {shorten(name, 16)} {this.meeting?.self.id === this.participant?.id && this.t('(you)')}
          </p>
        </div>
        {this.view === 'sidebar' && (
          <div class="right">
            {isActiveParticipant && (
              <rtk-icon
                class={{
                  red: !this.audioEnabled,
                }}
                icon={this.audioEnabled ? this.iconPack.mic_on : this.iconPack.mic_off}
              />
            )}

            {isActiveParticipant && !isAudioRoom && (
              <rtk-icon
                class={{
                  red: !this.videoEnabled,
                }}
                icon={this.videoEnabled ? this.iconPack.video_on : this.iconPack.video_off}
              />
            )}

            {(showMenu ||
              lenChildren({
                element: 'rtk-participant',
                defaults: defaults,
                childProps: {
                  participant: this.participant,
                },
              }) > 0) && (
              <div class="menu">
                <span id="trigger" onClick={this.onMenuToggle}>
                  <rtk-button variant="ghost" kind="icon" slot="trigger">
                    <rtk-icon class="more" icon={this.iconPack.more_vertical} />
                  </rtk-button>
                </span>
                <span id="menu-list">
                  {this.menuOpen && (
                    <rtk-menu-list iconPack={this.iconPack} t={this.t}>
                      {this.canPinParticipant && isActiveParticipant && !isAudioRoom && (
                        <rtk-menu-item
                          onClick={() => {
                            if (this.isPinned) {
                              this.participant.unpin();
                            } else {
                              this.participant.pin();
                            }
                          }}
                          iconPack={this.iconPack}
                          t={this.t}
                        >
                          <rtk-icon
                            icon={this.isPinned ? this.iconPack.pin_off : this.iconPack.pin}
                            slot="start"
                          />
                          {this.isPinned ? this.t('unpin') : this.t('pin')}
                        </rtk-menu-item>
                      )}
                      {isSelf && (
                        <rtk-menu-item
                          iconPack={this.iconPack}
                          t={this.t}
                          onClick={() => {
                            this.isHidden
                              ? (this.participant as RTKSelf).show()
                              : (this.participant as RTKSelf).hide();
                          }}
                        >
                          <rtk-icon
                            icon={this.isHidden ? this.iconPack.minimize : this.iconPack.maximize}
                            slot="start"
                          />
                          {!this.meeting.self.hidden ? this.t('minimize') : this.t('maximize')}
                        </rtk-menu-item>
                      )}
                      {this.canDisableParticipantAudio &&
                        isActiveParticipant &&
                        this.audioEnabled && (
                          <rtk-menu-item
                            iconPack={this.iconPack}
                            t={this.t}
                            onClick={() => {
                              this.participant.disableAudio();
                            }}
                          >
                            <rtk-icon icon={this.iconPack.mic_off} slot="start" />
                            {this.t('mute')}
                          </rtk-menu-item>
                        )}

                      {this.canDisableParticipantVideo &&
                        isActiveParticipant &&
                        this.videoEnabled && (
                          <rtk-menu-item
                            iconPack={this.iconPack}
                            t={this.t}
                            onClick={() => {
                              this.participant.disableVideo();
                            }}
                          >
                            <rtk-icon icon={this.iconPack.video_off} slot="start" />
                            {this.t('participants.turn_off_video')}
                          </rtk-menu-item>
                        )}

                      {this.canAllowParticipantOnStage &&
                        this.participant?.id !== this.meeting?.self.id && (
                          <rtk-menu-item
                            iconPack={this.iconPack}
                            t={this.t}
                            class={this.isOnStage ? 'red' : ''}
                            onClick={this.inviteToStageToggle}
                          >
                            <rtk-icon
                              icon={
                                this.isOnStage
                                  ? this.iconPack.leave_stage
                                  : this.iconPack.join_stage
                              }
                              slot="start"
                            />
                            {this.isOnStage
                              ? this.t('stage.remove_from_stage')
                              : this.t('stage.add_to_stage')}
                          </rtk-menu-item>
                        )}

                      {!isSelf && this.canKickParticipant && (
                        <rtk-menu-item
                          iconPack={this.iconPack}
                          t={this.t}
                          class="red"
                          onClick={() => {
                            this.meeting?.participants.joined.get(this.participant?.id)?.kick();
                          }}
                        >
                          <rtk-icon icon={this.iconPack.dismiss} slot="start" />
                          {this.t('kick')}
                        </rtk-menu-item>
                      )}
                      <slot>
                        <Render
                          element="rtk-participant"
                          defaults={defaults}
                          childProps={{
                            participant: this.participant,
                          }}
                          deepProps
                          onlyChildren
                        />
                      </slot>
                    </rtk-menu-list>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </Host>
    );
  }
}
