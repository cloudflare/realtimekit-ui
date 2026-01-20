import { Component, Host, h, Prop, State, Element, Watch, writeTask, Listen } from '@stencil/core';
import { Meeting, Participant, Peer, WaitlistedParticipant } from '../../types/rtk-client';
import { Size, Notification, States, Poll } from '../../types/props';
import RTKNotificationsAudio, { Sound } from '../../lib/notification';
import { formatName } from '../../utils/string';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { UIConfig } from '../../types/ui-config';
import {
  Config,
  DEFAULT_NOTIFICATION_CONFIG,
  DEFAULT_NOTIFICATION_DURATION,
  NotificationConfig,
  NotificationSoundsType,
} from '../../types/ui-config/config';
import type {
  ActiveTab,
  RecordingState,
  ChatUpdateParams,
  SocketConnectionState,
} from '@cloudflare/realtimekit';
import { createDefaultConfig } from '../../exports';
import { parseMessageForTarget } from '../../utils/chat';
import { SyncWithStore } from '../../utils/sync-with-store';
import { showLivestream } from '../../utils/livestream';

function parseConfig(config: Config) {
  const permissions: NotificationConfig = Object.assign({}, DEFAULT_NOTIFICATION_CONFIG);

  if (config == null) return permissions;

  Object.assign(permissions.notification_sounds, config.notification_sounds);
  Object.assign(permissions.notifications, config.notifications);
  Object.assign(permissions.notification_duration, config.notification_duration);

  permissions.participant_chat_message_sound_notification_limit =
    config.participant_chat_message_sound_notification_limit;

  permissions.participant_joined_sound_notification_limit =
    config.participant_joined_sound_notification_limit;

  return permissions;
}

function getEnabledSounds(sounds: Partial<NotificationSoundsType>) {
  return Object.keys(sounds).filter((key) => sounds[key]);
}

/**
 * A component which handles notifications.
 *
 * You can configure which notifications you want to see and which ones you want to hear.
 * There are also certain limits which you can set as well.
 */
@Component({
  tag: 'rtk-notifications',
  styleUrl: 'rtk-notifications.css',
  shadow: true,
})
export class RtkNotifications {
  private audio: RTKNotificationsAudio;

  private permissions: NotificationConfig = DEFAULT_NOTIFICATION_CONFIG;
  private enabledSounds: string[] = getEnabledSounds(
    DEFAULT_NOTIFICATION_CONFIG.notification_sounds
  );

  private participantJoinedListener: (participant: Peer) => void;
  private participantLeftListener: (participant: Peer) => void;
  private waitlistedParticipantJoinedListener: (participant: WaitlistedParticipant) => void;
  private waitlistedParticipantLeftListener: (participant: WaitlistedParticipant) => void;
  private chatUpdateListener: (data: ChatUpdateParams) => void;
  private pollUpdateListener: ({ polls }: { polls: Poll[]; newPoll: boolean }) => void;
  private deviceUpdateListener: (data: { device: MediaDeviceInfo; preview: boolean }) => void;
  private socketConnectionUpdateListener: (data: SocketConnectionState) => void;
  private activeTabUpdateListener: (spotlightTab: ActiveTab) => void;
  private peerStageStatusListener: (participant: Peer) => void;
  private stageRequestAccepted: () => void;
  private stageRequestRejected: () => void;
  private newStageRequests: (data: { count: number }) => void;
  private stageStatusUpdateListener: (status: string) => void;
  private disconnectTimeout: NodeJS.Timeout;

  @Element() host: HTMLRtkNotificationsElement;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Config object */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  @State() notifications: Notification[] = [];

  connectedCallback() {
    if (typeof document !== 'undefined') {
      document?.addEventListener('rtkNotification', this.onNotification);
    }
    this.meetingChanged(this.meeting);
    this.configChanged(this.config);
    this.statesChanged(this.states);
  }

  private clearListeners(meeting: Meeting) {
    const isLivestream = meeting.meta.viewType === 'LIVESTREAM';

    if ((isLivestream && meeting.stage?.status === 'ON_STAGE') || !isLivestream) {
      this.removeStagePeersListeners(meeting);
    }
    this.chatUpdateListener && meeting.chat?.removeListener('chatUpdate', this.chatUpdateListener);
    this.pollUpdateListener &&
      meeting.polls?.removeListener('pollsUpdate', this.pollUpdateListener);
    meeting.meta.removeListener('socketConnectionUpdate', this.socketConnectionUpdateListener);
    this.stageRequestAccepted &&
      meeting.stage?.removeListener('stageRequestApproved', this.stageRequestAccepted);
    this.stageRequestRejected &&
      meeting.stage?.removeListener('stageRequestRejected', this.stageRequestRejected);
    this.newStageRequests &&
      meeting.stage?.removeListener('newStageRequest', this.newStageRequests);
    this.stageStatusUpdateListener &&
      meeting.stage?.removeListener('stageStatusUpdate', this.stageStatusUpdateListener);
    meeting.recording?.removeListener('recordingUpdate', this.onRecordingUpdate);
    clearTimeout(this.disconnectTimeout);
    meeting.self.removeListener('deviceUpdate', this.deviceUpdateListener);
  }

  disconnectedCallback() {
    if (typeof document !== 'undefined') {
      document?.removeEventListener('rtkNotification', this.onNotification);
    }

    if (!this.meeting) return;
    this.clearListeners(this.meeting);
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

    this.activeTabUpdateListener &&
      this.meeting.meta?.removeListener('activeTabUpdate', this.activeTabUpdateListener);
    this.peerStageStatusListener &&
      this.meeting.participants.joined.removeListener(
        'stageStatusUpdate',
        this.peerStageStatusListener
      );
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    clearTimeout(this.disconnectTimeout);
    if (oldMeeting) this.clearListeners(oldMeeting);
    if (!meeting) return;
    const isLivestream = meeting.meta.viewType === 'LIVESTREAM';
    this.audio = new RTKNotificationsAudio(meeting);
    const { notifications, notification_duration, notification_sounds } = this.permissions;
    this.participantJoinedListener = (participant: Participant) => {
      if (notifications.participant_joined) {
        this.add({
          id: `${participant.id}-joined`,
          message: `${formatName(participant.name)} ${this.t('notifications.joined')}`,
          image: participant.picture,
          duration: notification_duration.participant_joined,
        });
      }
      if (notification_sounds.participant_joined && this.canPlayParticipantJoinedSound()) {
        this.audio.play('joined');
      }
    };

    this.participantLeftListener = (participant: Participant) => {
      const {
        socketState: { state },
      } = this.meeting.meta;
      if (notifications.participant_left && state !== 'connected') {
        this.add({
          id: `${participant.id}-left`,
          message: `${formatName(participant.name)} ${this.t('notifications.left')}`,
          image: participant.picture,
          duration: notification_duration.participant_left,
        });
      }
      if (notification_sounds.participant_left && this.canPlayParticipantJoinedSound()) {
        this.audio.play('left');
      }
    };

    this.waitlistedParticipantJoinedListener = (participant: WaitlistedParticipant) => {
      if (!this.canAcceptWaitingRequests()) return;
      const id = `${participant.id}-joined-waitlist`;
      this.add({
        id,
        message: `${formatName(participant.name)} ${this.t(
          'notifications.requesting_to_join_meeting'
        )}`,
        image: participant.picture,
        duration: notification_duration.participant_joined_waitlist,
        button: {
          text: this.t('notifications.accept'),
          variant: 'primary',
          onClick: async () => {
            await this.meeting.participants.acceptWaitingRoomRequest(participant.id);
            this.remove(id);
          },
        },
      });
      if (notification_sounds.participant_joined_waitlist && this.canPlayParticipantJoinedSound()) {
        this.audio.play('message');
      }
    };

    this.waitlistedParticipantLeftListener = (participant: WaitlistedParticipant) => {
      this.remove(`${participant.id}-joined-waitlist`);
    };

    this.chatUpdateListener = ({ message, action }) => {
      // NOTE(ikabra): we only want notifications for new messages
      if (action !== 'add') return;
      const parsedMessage = parseMessageForTarget(message);
      if (parsedMessage != null) {
        if (parsedMessage.userId === meeting.self.userId) {
          return;
        }
        if (parsedMessage.type === 'text') {
          if (notifications.chat) {
            this.add({
              id: `message-${Math.random().toString(36)}`,
              icon: this.iconPack.chat,
              message: `${parsedMessage.displayName}: ${parsedMessage.message}`,
              duration: notification_duration.chat,
            });
          }
          if (notification_sounds.chat && this.canPlayChatSound()) {
            this.audio.play('message');
          }
        }
      }
    };

    this.pollUpdateListener = ({ polls, newPoll }) => {
      if (newPoll === false) return;
      if (
        notifications.polls &&
        this.meeting.self.userId !== polls[polls.length - 1].createdByUserId
      ) {
        this.add({
          id: `poll-${Math.random().toString(36)}`,
          icon: this.iconPack.poll,
          message: `${this.t('notifications.new_poll_created_by')} ${
            polls[polls.length - 1].createdBy
          }`,
          duration: notification_duration.polls,
        });
      }
      if (
        notification_sounds.polls &&
        this.meeting.self.userId !== polls[polls.length - 1].createdByUserId &&
        this.canPlayChatSound()
      ) {
        this.audio.play('message');
      }
    };

    this.deviceUpdateListener = ({ device, preview }) => {
      if (preview) return;
      if (device.kind === 'audiooutput') {
        this.audio.setDevice(device.deviceId);
        this.remove(`speaker-switched`);
        this.add({
          id: `speaker-switched`,
          message: `${this.t('notifications.connected_to')} ${device.label}`,
          icon: this.iconPack.speaker,
          duration: 5000,
        });
      }
      if (device.kind === 'videoinput') {
        this.remove(`camera-switched`);
        this.add({
          id: `camera-switched`,
          message: `${this.t('notifications.connected_to')} ${device.label}`,
          icon: this.meeting.self.videoEnabled ? this.iconPack.video_on : this.iconPack.video_off,
          iconVariant: this.meeting.self.videoEnabled ? 'primary' : 'danger',
          duration: 5000,
        });
      }
      if (device.kind === 'audioinput') {
        this.remove(`mic-switched`);
        this.add({
          id: `mic-switched`,
          message: `${this.t('notifications.connected_to')} ${device.label}`,
          icon: this.meeting.self.audioEnabled ? this.iconPack.mic_on : this.iconPack.mic_off,
          iconVariant: this.meeting.self.audioEnabled ? 'primary' : 'danger',
          duration: 5000,
        });
      }
    };

    this.socketConnectionUpdateListener = ({ state, reconnectionAttempt, reconnected }) => {
      switch (state) {
        case 'connected':
          this.remove('socket');
          if (reconnected)
            this.add({
              id: `socket`,
              icon: this.iconPack.wifi,
              message: this.t('network.restored'),
              duration: 3000,
            });
          break;
        case 'disconnected':
          this.remove('socket');
          this.add({
            id: 'socket',
            icon: this.iconPack.disconnected,
            message: this.t('network.reconnecting'),
          });
          break;
        case 'reconnecting':
          if (reconnectionAttempt >= 6) {
            this.remove('socket');
            this.add({
              id: 'socket',
              icon: this.iconPack.disconnected,
              message: this.t('network.disconnected'),
              button: {
                text: this.t('end'),
                variant: 'danger',
                onClick: () => this.meeting?.leaveRoom(),
              },
            });
          } else if (reconnectionAttempt >= 4) {
            this.remove('socket');
            this.add({
              id: 'socket',
              icon: this.iconPack.disconnected,
              message: this.t('network.delay_extended'),
            });
          }

          break;
        case 'failed':
          this.remove('socket');
          this.add({
            id: 'socket',
            icon: this.iconPack.disconnected,
            message: this.t('network.leaving'),
            button: {
              text: this.t('end'),
              variant: 'danger',
              onClick: () => this.meeting?.leaveRoom(),
            },
          });
          break;
        default:
          break;
      }
    };

    this.activeTabUpdateListener = (activeTab) => {
      if (!notifications.tab_sync) return;
      switch (activeTab.type) {
        case 'plugin':
          const activePlugin = meeting.plugins.active
            .toArray()
            .find((plugin) => plugin.id == activeTab.id);

          if (activePlugin != undefined) {
            this.add({
              id: 'activeTab',
              message: `${this.t('notifications.plugin_switched_to')} ${activePlugin.name}`,
              duration: notification_duration.participant_joined,
            });
          }
          break;
        case 'screenshare':
          const screenShareParticipant = meeting.participants.joined
            .toArray()
            .filter((participant) => participant.screenShareEnabled)
            .find((participant) => participant.id == activeTab.id);

          if (screenShareParticipant != undefined) {
            this.add({
              id: 'spotlight',
              message: `Now watching ${screenShareParticipant.name}'s screen`,
              duration: notification_duration.webinar,
            });
          }
          break;
      }
    };

    this.peerStageStatusListener = (participant: Peer) => {
      if (participant.stageStatus === 'REQUESTED_TO_JOIN_STAGE') {
        this.add({
          id: `stage-request-${participant.id}`,
          message: `${participant.name} ${this.t('notifications.requested_to_join_stage')}`,
          duration: notification_duration.webinar,
          button: {
            text: this.t('notifications.accept'),
            variant: 'primary',
            onClick: async () => {
              await this.meeting.stage.grantAccess([participant.userId]);
              this.remove(`stage-request-${participant.id}`);
            },
          },
        });
        if (notification_sounds.webinar) {
          this.audio.play('joined');
        }
      }
      if (participant.stageStatus === 'ON_STAGE') {
        this.add({
          id: `stage-joined-${participant.id}`,
          message: `${participant.name} ${this.t('notifications.joined_stage')}`,
          duration: notification_duration.webinar,
        });
        if (notification_sounds.webinar) {
          this.audio.play('joined');
        }
      }
    };

    this.stageRequestAccepted = () => {
      this.add({
        id: 'stage-request-accepted',
        message: this.t('notifications.request_to_join_accepted'),
        duration: 3000,
      });
    };

    this.stageRequestRejected = () => {
      this.add({
        id: 'stage-request-rejected',
        message: this.t('notifications.request_to_join_rejected'),
        duration: 3000,
      });
    };

    this.newStageRequests = ({ count }) => {
      this.add({
        id: 'new-stage-request',
        message: `You have ${count < 0 ? 'new stage' : `${count} pending`} request${
          count === 1 ? '' : 's'
        }`,
        duration: 3000,
      });
    };

    this.stageStatusUpdateListener = (status) => {
      if (status === 'ON_STAGE') this.addStagePeersListeners(meeting);
      else this.removeStagePeersListeners(meeting);
    };

    !showLivestream(meeting) && meeting.chat?.addListener('chatUpdate', this.chatUpdateListener);

    // temp fix for viewType mismatch with CHAT
    if (meeting.self.config.viewType?.toString() === 'CHAT') {
      return;
    }

    // all non Chat viewtype code from here
    const currentDevices = meeting.self.getCurrentDevices();
    if (currentDevices.speaker != null) {
      this.audio.setDevice(currentDevices.speaker.deviceId);
    }

    if (isLivestream) meeting.stage?.on('stageStatusUpdate', this.stageStatusUpdateListener);
    else this.addStagePeersListeners(meeting);
    if (this.canAcceptWaitingRequests()) {
      meeting.participants.waitlisted.addListener(
        'participantJoined',
        this.waitlistedParticipantJoinedListener
      );
      meeting.participants.waitlisted.addListener(
        'participantLeft',
        this.waitlistedParticipantLeftListener
      );
    }

    meeting.polls?.addListener('pollsUpdate', this.pollUpdateListener);
    meeting.self.addListener('deviceUpdate', this.deviceUpdateListener);
    meeting.meta.addListener('socketConnectionUpdate', this.socketConnectionUpdateListener);
    meeting.meta?.addListener('activeTabUpdate', this.activeTabUpdateListener);
    meeting.recording?.addListener('recordingUpdate', this.onRecordingUpdate);
    meeting.stage?.addListener('stageRequestApproved', this.stageRequestAccepted);
    meeting.stage?.addListener('stageRequestRejected', this.stageRequestRejected);
    if (meeting.self.permissions.stageEnabled && meeting.self.permissions.acceptStageRequests) {
      meeting.stage?.addListener('newStageRequest', this.newStageRequests);
    }
  }

  private addStagePeersListeners = (meeting: Meeting) => {
    meeting.participants.joined.addListener('participantJoined', this.participantJoinedListener);
    meeting.participants.joined.addListener('participantLeft', this.participantLeftListener);
  };

  private removeStagePeersListeners = (meeting: Meeting) => {
    meeting.participants.joined.removeListener('participantJoined', this.participantJoinedListener);
    meeting.participants.joined.removeListener('participantLeft', this.participantLeftListener);
  };

  @Watch('config')
  configChanged(config: UIConfig) {
    if (config != null) {
      if (config?.config != null) {
        this.permissions = parseConfig(config.config);
        this.enabledSounds = getEnabledSounds(this.permissions.notification_sounds);
      }
    }
  }

  @Watch('states')
  statesChanged(states: States) {
    if (states != null) {
      const notificationSoundsEnabled = !states?.prefs?.muteNotificationSounds;

      // toggle only the notification sounds values which were enabled in the first place
      for (const permission of this.enabledSounds) {
        if (permission in this.permissions.notification_sounds) {
          this.permissions.notification_sounds[permission] = notificationSoundsEnabled;
        }
      }
    }
  }

  @Listen('rtkApiError', { target: 'window' })
  apiErrorListener({ detail }) {
    const { trace, message } = detail;
    this.add({
      id: trace,
      message,
      duration: DEFAULT_NOTIFICATION_DURATION,
      icon: this.iconPack.warning,
    });
  }

  @Listen('rtkSendNotification', { target: 'window' })
  sendNotificationListener({ detail }) {
    const { trace, message } = detail;
    this.add({
      id: trace,
      message,
      duration: DEFAULT_NOTIFICATION_DURATION,
    });
  }

  private onNotification = (e: CustomEvent<Notification & { playSound: Sound | undefined }>) => {
    this.add(e.detail);
    const playSound = e.detail.playSound;
    if (playSound != undefined) this.audio.play(playSound);
  };

  private onRecordingUpdate = (recordingState: RecordingState) => {
    if (
      recordingState === 'RECORDING' &&
      this.permissions.notifications.recording_started !== false
    ) {
      this.add({
        id: 'recording-started',
        icon: this.iconPack.recording,
        message: this.t('recording.started'),
        duration:
          this.permissions.notification_duration.recording_started ?? DEFAULT_NOTIFICATION_DURATION,
      });
    } else if (
      recordingState === 'STOPPING' &&
      this.permissions.notifications.recording_stopped !== false
    ) {
      this.add({
        id: 'recording-stopped',
        icon: this.iconPack.stop_recording,
        message: this.t('recording.stopped'),
        duration:
          this.permissions.notification_duration.recording_stopped ?? DEFAULT_NOTIFICATION_DURATION,
      });
    }
  };

  private add(notification: Notification) {
    // show notifications only if tab is in focus and a maximum of 5 at a time
    if (document.visibilityState === 'visible' && this.notifications.length < 5) {
      // adds new notification to start of array so they appear at the bottom
      this.notifications = [...this.notifications, notification];
    }
  }

  private remove(id: string) {
    this.notifications = this.notifications.filter((notification) => notification.id !== id);
  }

  private handleDismiss(e: CustomEvent<string>) {
    e.stopPropagation();

    const id = e.detail;
    const el = this.host.shadowRoot.querySelector(`[data-id="${id}"]`);
    // exit animation
    el?.classList.add('exit');

    setTimeout(() => {
      writeTask(() => {
        this.remove(id);
      });
    }, 400);
  }

  private canPlayParticipantJoinedSound(): boolean {
    return (
      this.permissions.participant_joined_sound_notification_limit == undefined ||
      this.permissions.participant_joined_sound_notification_limit <= 0 ||
      this.meeting.participants.count <=
        this.permissions.participant_joined_sound_notification_limit
    );
  }

  private canPlayChatSound(): boolean {
    return (
      this.permissions.participant_chat_message_sound_notification_limit == undefined ||
      this.permissions.participant_chat_message_sound_notification_limit <= 0 ||
      this.meeting.participants.count <=
        this.permissions.participant_chat_message_sound_notification_limit
    );
  }

  private canAcceptWaitingRequests(): boolean {
    return (
      this.permissions.notifications.participant_joined_waitlist &&
      this.meeting.self.permissions.acceptWaitingRequests
    );
  }

  @State()
  paused = false;

  render() {
    if (!this.meeting) {
      return;
    }

    return (
      <Host>
        <div
          onMouseEnter={() => (this.paused = true)}
          onFocusin={() => (this.paused = true)}
          onMouseLeave={() => (this.paused = false)}
          onFocusout={() => (this.paused = false)}
        >
          {this.notifications.map((notification) => (
            <rtk-notification
              size={this.size}
              key={notification.id}
              data-id={notification.id}
              notification={notification}
              onRtkNotificationDismiss={(e: CustomEvent<string>) => this.handleDismiss(e)}
              iconPack={this.iconPack}
              paused={this.paused}
              t={this.t}
            />
          ))}
        </div>
      </Host>
    );
  }
}
