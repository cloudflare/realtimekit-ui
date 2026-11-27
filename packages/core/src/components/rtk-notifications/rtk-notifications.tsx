import { Component, Host, h, Prop, State, Element, Watch, writeTask, Listen } from '@stencil/core';
import { Meeting, Participant, Peer, WaitlistedParticipant } from '../../types/rtk-client';
import { Size, Notification, States, Poll } from '../../types/props';
import RTKNotificationsAudio, { isAudioFileUrl, Sound } from '../../lib/notification';
import { formatName } from '../../utils/string';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { UIConfig } from '../../types/ui-config';
import { DEFAULT_NOTIFICATION_CONFIG, Config, NotificationKey } from '../../types/ui-config/config';
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
    this.peerStageStatusListener &&
      meeting.participants.joined.removeListener('stageStatusUpdate', this.peerStageStatusListener);
    this.waitlistedParticipantJoinedListener &&
      meeting.participants.waitlisted.removeListener(
        'participantJoined',
        this.waitlistedParticipantJoinedListener
      );
    this.waitlistedParticipantLeftListener &&
      meeting.participants.waitlisted.removeListener(
        'participantLeft',
        this.waitlistedParticipantLeftListener
      );
    this.activeTabUpdateListener &&
      meeting.meta?.removeListener('activeTabUpdate', this.activeTabUpdateListener);
    clearTimeout(this.disconnectTimeout);
    meeting.self.removeListener('deviceUpdate', this.deviceUpdateListener);
  }

  disconnectedCallback() {
    if (typeof document !== 'undefined') {
      document?.removeEventListener('rtkNotification', this.onNotification);
    }

    if (!this.meeting) return;
    this.clearListeners(this.meeting);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    clearTimeout(this.disconnectTimeout);
    if (oldMeeting) this.clearListeners(oldMeeting);
    if (!meeting) return;
    const isLivestream = meeting.meta.viewType === 'LIVESTREAM';
    this.audio = new RTKNotificationsAudio(meeting);
    this.participantJoinedListener = (participant: Participant) => {
      /**
       * NOTE(ravindra-cloudflare):
       * Participants that immediately reconnected,
       * due to Websocket disconnects with error code 1006,
       * will have a peerIdBeforeReconnect set.
       *
       * We don't want to show notifications for such participants
       * as they are not actually joining the meeting,
       * but rather reconnecting to it.
       */
      const isReconnectedParticipant = !!participant.peerIdBeforeReconnect;
      if (isReconnectedParticipant) {
        return;
      }
      this.showIfEnabled('participant_joined', {
        id: `${participant.id}-joined`,
        message: `${formatName(participant.name)} ${this.t('notifications.joined')}`,
        image: participant.picture,
      });
      if (this.canPlayParticipantJoinedSound()) {
        this.playSoundIfEnabled('participant_joined');
      }
    };

    this.participantLeftListener = (participant: Participant) => {
      /**
       * NOTE(ravindra-cloudflare):
       * A departing participant replaced after reconnecting has replacedByPeerId
       * set before its leave event. Suppress the leave notification and sound.
       */
      if (participant.replacedByPeerId) {
        return;
      }

      const {
        socketState: { state },
      } = this.meeting.meta;
      if (state === 'connected') {
        this.showIfEnabled('participant_left', {
          id: `${participant.id}-left`,
          message: `${formatName(participant.name)} ${this.t('notifications.left')}`,
          image: participant.picture,
        });
        if (this.canPlayParticipantJoinedSound()) {
          this.playSoundIfEnabled('participant_left');
        }
      }
    };

    this.waitlistedParticipantJoinedListener = (participant: WaitlistedParticipant) => {
      if (!this.canAcceptWaitingRequests()) return;
      const id = `${participant.id}-joined-waitlist`;
      this.showIfEnabled('participant_joined_waitlist', {
        id,
        message: `${formatName(participant.name)} ${this.t(
          'notifications.requesting_to_join_meeting'
        )}`,
        image: participant.picture,
        button: {
          text: this.t('notifications.accept'),
          variant: 'primary',
          onClick: async () => {
            await this.meeting.participants.acceptWaitingRoomRequest(participant.id);
            this.remove(id);
          },
        },
      });
      if (this.canPlayParticipantJoinedSound()) {
        this.playSoundIfEnabled('participant_joined_waitlist');
      }
    };

    this.waitlistedParticipantLeftListener = (participant: WaitlistedParticipant) => {
      this.remove(`${participant.id}-joined-waitlist`);
    };

    this.chatUpdateListener = ({ message, action }) => {
      const parsedMessage = parseMessageForTarget(message);
      if (parsedMessage != null) {
        if (parsedMessage.userId === meeting.self.userId) {
          return;
        }
        if (action === 'edit' || action === 'delete') {
          const notificationKey =
            action === 'edit' ? 'chat_message_edited' : 'chat_message_deleted';
          this.showIfEnabled(notificationKey, {
            id: `message-${Math.random().toString(36)}`,
            icon: this.iconPack.chat,
            message: `${parsedMessage.displayName} ${this.t(`notifications.${notificationKey}`)}`,
          });
          if (this.canPlayChatSound()) {
            this.playSoundIfEnabled(notificationKey);
          }
          return;
        }
        if (parsedMessage.type === 'text') {
          this.showIfEnabled('chat_new_message', {
            id: `message-${Math.random().toString(36)}`,
            icon: this.iconPack.chat,
            message: `${parsedMessage.displayName}: ${parsedMessage.message}`,
          });
          if (this.canPlayChatSound()) {
            this.playSoundIfEnabled('chat_new_message');
          }
        }
      }
    };

    this.pollUpdateListener = ({ polls, newPoll }) => {
      if (newPoll === false) return;
      if (this.meeting.self.userId === polls[polls.length - 1].createdByUserId) return;
      this.showIfEnabled('polls_new_poll', {
        id: `poll-${Math.random().toString(36)}`,
        icon: this.iconPack.poll,
        message: `${this.t('notifications.new_poll_created_by')} ${
          polls[polls.length - 1].createdBy
        }`,
      });
      if (this.canPlayChatSound()) {
        this.playSoundIfEnabled('polls_new_poll');
      }
    };

    this.deviceUpdateListener = ({ device, preview }) => {
      if (preview) return;
      if (device.kind === 'audiooutput') {
        this.audio.setDevice(device.deviceId);
        this.remove(`speaker-switched`);
        this.showIfEnabled('speaker_switched', {
          id: `speaker-switched`,
          message: `${this.t('notifications.connected_to')} ${device.label}`,
          icon: this.iconPack.speaker,
        });
        this.playSoundIfEnabled('speaker_switched');
      }
      if (device.kind === 'videoinput') {
        this.remove(`camera-switched`);
        this.showIfEnabled('camera_switched', {
          id: `camera-switched`,
          message: `${this.t('notifications.connected_to')} ${device.label}`,
          icon: this.meeting.self.videoEnabled ? this.iconPack.video_on : this.iconPack.video_off,
          iconVariant: this.meeting.self.videoEnabled ? 'primary' : 'danger',
        });
        this.playSoundIfEnabled('camera_switched');
      }
      if (device.kind === 'audioinput') {
        this.remove(`mic-switched`);
        this.showIfEnabled('microphone_switched', {
          id: `mic-switched`,
          message: `${this.t('notifications.connected_to')} ${device.label}`,
          icon: this.meeting.self.audioEnabled ? this.iconPack.mic_on : this.iconPack.mic_off,
          iconVariant: this.meeting.self.audioEnabled ? 'primary' : 'danger',
        });
        this.playSoundIfEnabled('microphone_switched');
      }
    };

    this.socketConnectionUpdateListener = ({ state, reconnectionAttempt, reconnected }) => {
      switch (state) {
        case 'connected':
          this.remove('socket');
          if (reconnected) {
            this.showIfEnabled('network_restored', {
              id: `socket`,
              icon: this.iconPack.wifi,
              message: this.t('network.restored'),
            });
            this.playSoundIfEnabled('network_restored');
          }
          break;
        case 'disconnected':
          this.remove('socket');
          this.showIfEnabled('network_reconnecting', {
            id: 'socket',
            icon: this.iconPack.disconnected,
            message: this.t('network.reconnecting'),
          });
          this.playSoundIfEnabled('network_reconnecting');
          break;
        case 'reconnecting':
          if (reconnectionAttempt >= 6) {
            this.remove('socket');
            this.showIfEnabled('network_disconnected', {
              id: 'socket',
              icon: this.iconPack.disconnected,
              message: this.t('network.disconnected'),
              button: {
                text: this.t('end'),
                variant: 'danger',
                onClick: () => this.meeting?.leave(),
              },
            });
            this.playSoundIfEnabled('network_disconnected');
          } else if (reconnectionAttempt >= 4) {
            this.remove('socket');
            this.showIfEnabled('network_delayed', {
              id: 'socket',
              icon: this.iconPack.disconnected,
              message: this.t('network.delay_extended'),
            });
            this.playSoundIfEnabled('network_delayed');
          }

          break;
        case 'failed':
          this.remove('socket');
          this.showIfEnabled('network_failed', {
            id: 'socket',
            icon: this.iconPack.disconnected,
            message: this.t('network.leaving'),
            button: {
              text: this.t('end'),
              variant: 'danger',
              onClick: () => this.meeting?.leave(),
            },
          });
          this.playSoundIfEnabled('network_failed');
          break;
        default:
          break;
      }
    };

    this.activeTabUpdateListener = (activeTab) => {
      switch (activeTab.type) {
        case 'plugin':
          const activePlugin = meeting.plugins.active
            .toArray()
            .find((plugin) => plugin.id == activeTab.id);

          if (activePlugin != undefined) {
            this.showIfEnabled('tab_sync_plugin_switched', {
              id: 'activeTab',
              message: `${this.t('notifications.plugin_switched_to')} ${activePlugin.name}`,
            });
            this.playSoundIfEnabled('tab_sync_plugin_switched');
          }
          break;
        case 'screenshare':
          const screenShareParticipant = meeting.participants.joined
            .toArray()
            .filter((participant) => participant.screenShareEnabled)
            .find((participant) => participant.id == activeTab.id);

          if (screenShareParticipant != undefined) {
            this.showIfEnabled('tab_sync_screen_share_switched', {
              id: 'spotlight',
              message: `Now watching ${screenShareParticipant.name}'s screen`,
            });
            this.playSoundIfEnabled('tab_sync_screen_share_switched');
          }
          break;
      }
    };

    this.peerStageStatusListener = (participant: Peer) => {
      if (participant.stageStatus === 'REQUESTED_TO_JOIN_STAGE') {
        this.showIfEnabled('stage_requested_to_join', {
          id: `stage-request-${participant.id}`,
          message: `${participant.name} ${this.t('notifications.requested_to_join_stage')}`,
          button: {
            text: this.t('notifications.accept'),
            variant: 'primary',
            onClick: async () => {
              await this.meeting.stage.grantAccess([participant.userId]);
              this.remove(`stage-request-${participant.id}`);
            },
          },
        });
        this.playSoundIfEnabled('stage_requested_to_join');
      }
      if (participant.stageStatus === 'ON_STAGE') {
        this.showIfEnabled('stage_joined', {
          id: `stage-joined-${participant.id}`,
          message: `${participant.name} ${this.t('notifications.joined_stage')}`,
        });
        this.playSoundIfEnabled('stage_joined');
      }
    };

    this.stageRequestAccepted = () => {
      this.showIfEnabled('stage_request_accepted', {
        id: 'stage-request-accepted',
        message: this.t('notifications.request_to_join_accepted'),
      });
      this.playSoundIfEnabled('stage_request_accepted');
    };

    this.stageRequestRejected = () => {
      this.showIfEnabled('stage_request_rejected', {
        id: 'stage-request-rejected',
        message: this.t('notifications.request_to_join_rejected'),
      });
      this.playSoundIfEnabled('stage_request_rejected');
    };

    this.newStageRequests = ({ count }) => {
      this.showIfEnabled('stage_new_request_received', {
        id: 'new-stage-request',
        message: `You have ${count < 0 ? 'new stage' : `${count} pending`} request${
          count === 1 ? '' : 's'
        }`,
      });
      this.playSoundIfEnabled('stage_new_request_received');
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
    meeting.participants.joined.addListener('stageStatusUpdate', this.peerStageStatusListener);
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

  /**
   * The notification settings of the `config` prop.
   * A UI config without notification settings uses the defaults.
   */
  private get notificationConfig(): Config {
    return this.config?.config ?? DEFAULT_NOTIFICATION_CONFIG;
  }

  @Listen('rtkApiError', { target: 'window' })
  apiErrorListener({ detail }) {
    const { trace, message } = detail;
    this.showIfEnabled('api_error', {
      id: trace,
      message,
      icon: this.iconPack.warning,
    });
    this.playSoundIfEnabled('api_error');
  }

  @Listen('rtkSendNotification', { target: 'window' })
  sendNotificationListener({ detail }) {
    const { trace, message } = detail;
    // rtk-participant sends the stage invite message with a trace that starts with `join-stage-`
    if (trace?.startsWith('join-stage-')) {
      this.showIfEnabled('stage_invite_sent', { id: trace, message });
      this.playSoundIfEnabled('stage_invite_sent');
      return;
    }
    this.showIfEnabled('custom', {
      id: trace,
      message,
    });
    this.playCustomSoundIfEnabled();
  }

  private onNotification = (e: CustomEvent<Notification & { playSound: Sound | undefined }>) => {
    if (this.isShown('custom')) this.add(e.detail);
    this.playCustomSoundIfEnabled(e.detail.playSound);
  };

  private onRecordingUpdate = (recordingState: RecordingState) => {
    if (recordingState === 'RECORDING') {
      this.showIfEnabled('recording_started', {
        id: 'recording-started',
        icon: this.iconPack.recording,
        message: this.t('recording.started'),
      });
      this.playSoundIfEnabled('recording_started');
    } else if (recordingState === 'STOPPING') {
      this.showIfEnabled('recording_stopped', {
        id: 'recording-stopped',
        icon: this.iconPack.stop_recording,
        message: this.t('recording.stopped'),
      });
      this.playSoundIfEnabled('recording_stopped');
    }
  };

  private isShown(key: NotificationKey): boolean {
    return !!this.notificationConfig.notifications[key];
  }

  private isSoundOn(key: NotificationKey): boolean {
    if (this.states?.prefs?.muteNotificationSounds) return false;
    return !!this.notificationConfig.notification_sounds[key];
  }

  private showIfEnabled(key: NotificationKey, notification: Omit<Notification, 'duration'>) {
    if (!this.isShown(key)) return;
    const duration = this.notificationConfig.notification_duration[key];
    // a duration of 0 keeps the notification until it is dismissed or replaced
    // these two carry the End Meeting button, so the visible limit does not apply to them
    const ignoreVisibleLimit = key === 'network_disconnected' || key === 'network_failed';
    this.add(
      { ...notification, duration: duration > 0 ? duration : undefined },
      ignoreVisibleLimit
    );
  }

  private playSoundIfEnabled(key: NotificationKey) {
    if (!this.isSoundOn(key)) return;
    const url = this.notificationConfig.notification_sound_urls[key];
    // the audio player exists only after the meeting is set
    this.audio?.playUrl(
      isAudioFileUrl(url) ? url : DEFAULT_NOTIFICATION_CONFIG.notification_sound_urls[key]
    );
  }

  /**
   * A custom notification plays the URL from the config when one is set.
   * Otherwise it plays the sound that its sender chose, if any.
   */
  private playCustomSoundIfEnabled(senderSound?: Sound) {
    if (!this.isSoundOn('custom')) return;
    const url = this.notificationConfig.notification_sound_urls.custom;
    if (isAudioFileUrl(url)) {
      this.audio?.playUrl(url);
    } else if (senderSound != undefined) {
      this.audio?.play(senderSound);
    }
  }

  private add(notification: Notification, ignoreVisibleLimit = false) {
    // a new notification replaces an earlier one that has the same id
    const otherNotifications = this.notifications.filter(({ id }) => id !== notification.id);
    // show notifications only if tab is in focus and the visible limit is not reached
    const visibleLimit = this.notificationConfig.visible_notifications_limit;
    const hasRoom =
      ignoreVisibleLimit || !(visibleLimit > 0) || otherNotifications.length < visibleLimit;
    if (document.visibilityState === 'visible' && hasRoom) {
      // adds new notification to start of array so they appear at the bottom
      this.notifications = [...otherNotifications, notification];
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
      this.notificationConfig.participant_joined_sound_notification_limit == undefined ||
      this.notificationConfig.participant_joined_sound_notification_limit <= 0 ||
      this.meeting.participants.count <=
        this.notificationConfig.participant_joined_sound_notification_limit
    );
  }

  private canPlayChatSound(): boolean {
    return (
      this.notificationConfig.participant_chat_message_sound_notification_limit == undefined ||
      this.notificationConfig.participant_chat_message_sound_notification_limit <= 0 ||
      this.meeting.participants.count <=
        this.notificationConfig.participant_chat_message_sound_notification_limit
    );
  }

  private canAcceptWaitingRequests(): boolean {
    return !!this.meeting.self.permissions.acceptWaitingRequests;
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
