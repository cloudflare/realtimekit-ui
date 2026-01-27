import { Component, Event, EventEmitter, Method, h, Host, Prop, State, Watch } from '@stencil/core';
import { SyncWithStore } from '../../utils/sync-with-store';
import { Meeting, Participant } from '../../types/rtk-client';
import { Size } from '../../types/props';
import { Overrides, States, UIConfig, createDefaultConfig, defaultOverrides } from '../../exports';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';

@Component({
  tag: 'rtk-chat-selector',
  styleUrl: 'rtk-chat-selector.css',
  shadow: true,
})
export class RtkChatSelector {
  private $paginatedListRef: HTMLRtkPaginatedListElement;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** UI Overrides */
  @SyncWithStore()
  @Prop()
  overrides: Overrides = defaultOverrides;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  @State() isOpen = false;

  @State() showPrivateChat = false;

  @State() selectedUser: Participant | undefined = undefined;

  //NOTE(ikabra): Fix this value once backend supports pagination for participants
  @State() pageSize = 100000;

  @State() pagesAllowed = 3;

  /** */
  @Event({ eventName: 'rtkDropdownToggle' }) dropdownToggle: EventEmitter<{ open: boolean }>;

  /** */
  @Event({
    eventName: 'rtkChatSelectorChange',
    bubbles: true,
    composed: true,
  })
  chatSelectorChange: EventEmitter<{ selectedUser?: Participant | undefined }>;

  /** */
  @Method()
  async close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.dropdownToggle.emit({ open: false });
  }

  connectedCallback() {
    this.meetingChanged(this.meeting);
    this.overridesChanged(this.overrides);
  }

  disconnectedCallback() {
    if (!this.meeting) return;
    const { self, participants } = this.meeting;
    self?.permissions?.off('*', this.chatPermissionUpdateListener);
    participants?.joined?.off('participantJoined', this.participantJoinedListener);
    participants?.joined?.off('participantLeft', this.participantLeftListener);
  }

  @Watch('overrides')
  overridesChanged(overrides) {
    this.showPrivateChat =
      !!(
        this.meeting.self.permissions.chatPrivate?.canSend ||
        this.meeting.self.permissions.chatPrivate?.canReceive
      ) && !overrides.disablePrivateChat;
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting) this.disconnectMeeting(oldMeeting);
    if (!meeting || !meeting.chat) return;
    this.showPrivateChat =
      !!(
        meeting.self.permissions.chatPrivate?.canSend ||
        meeting.self.permissions.chatPrivate?.canReceive
      ) && !this.overrides.disablePrivateChat;
    this.onParticipantUpdate();
    meeting.self.permissions.on('*', this.chatPermissionUpdateListener);
    meeting?.participants?.joined?.on('participantJoined', this.participantJoinedListener);
    meeting?.participants?.joined?.on('participantLeft', this.participantLeftListener);
  }

  private disconnectMeeting = (meeting: Meeting) => {
    const { self, participants } = meeting || {};
    self?.permissions?.off('*', this.chatPermissionUpdateListener);
    participants?.joined?.off('participantJoined', this.participantJoinedListener);
    participants?.joined?.off('participantLeft', this.participantLeftListener);
  };

  private toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.isOpen = !this.isOpen;
    this.dropdownToggle.emit({ open: this.isOpen });
  };

  private selectUser = async (user?: Participant) => {
    this.selectedUser = user;
    this.chatSelectorChange.emit({ selectedUser: user });
    await this.close();
  };

  private chatPermissionUpdateListener = () => {
    this.showPrivateChat = !!(
      this.meeting.self.permissions.chatPrivate?.canSend ||
      this.meeting.self.permissions.chatPrivate?.canReceive
    );
    if (!this.showPrivateChat) {
      this.selectedUser = undefined;
      this.chatSelectorChange.emit({ selectedUser: undefined });
    }
  };

  private onParticipantUpdate = () => {
    if (!this.selectedUser) return;
    const participants = this.meeting?.participants?.joined?.toArray?.() || [];
    if (!participants.some((p) => p.id === this.selectedUser?.id)) {
      this.selectedUser = undefined;
      this.chatSelectorChange.emit({ selectedUser: undefined });
    }
  };

  private participantJoinedListener = (data) => {
    this.$paginatedListRef.onNewNode(data);
  };

  private participantLeftListener = (data) => {
    this.$paginatedListRef.onNodeDelete(data.id);
    this.onParticipantUpdate();
  };

  private getParticipants = async (timestamp: number, size: number, reversed: boolean) => {
    const meeting = this.meeting;
    if (!meeting) return [];
    /**
     * FIXME(ikabra): This is a temporary hack in place to handle the initial load
     * and not repeat participants when a user reaches the top of the list.
     * This must be replaced by actual pagination APIs from backend for participants.
     */
    if (!timestamp) return [];
    const participants = meeting.participants.joined.toArray();
    /**
     * TODO:
     * 1. filter and only show participants that can receive private chat messages
     * 2. show private chat when a user is selected
     */
    return participants;
  };

  private createPaticipantNodes = (data: Participant[]) => {
    return data.map((participant) => (
      <div class="private-chat-label" onClick={() => this.selectUser(participant)}>
        <rtk-avatar size="sm" participant={participant} />
        <span>{participant.name}</span>
      </div>
    ));
  };

  render() {
    if (!this.showPrivateChat) return null;
    return (
      <Host>
        <div class="chat-header" onClick={this.toggle}>
          <div class="chat-header-label">
            <rtk-icon icon={this.iconPack.participants} size="sm" />
            {!this.selectedUser ? 'Everyone' : this.selectedUser.name}
          </div>
          <div class="chevron">
            <rtk-icon
              icon={this.isOpen ? this.iconPack.chevron_up : this.iconPack.chevron_down}
              size="sm"
            />
          </div>
        </div>

        <div class={{ dropdown: true, open: this.isOpen, scrollbar: true }}>
          <div class="public-chat-group-label" onClick={() => this.selectUser(undefined)}>
            <div class="public-chat-icon">
              <rtk-icon icon={this.iconPack.participants} size="sm" />
            </div>
            Everyone
          </div>
          <rtk-paginated-list
            class="chat-selector-paginated-list"
            ref={(el) => (this.$paginatedListRef = el)}
            pageSize={this.pageSize}
            pagesAllowed={3}
            fetchData={this.getParticipants}
            createNodes={this.createPaticipantNodes}
            selectedItemId={this.selectedUser?.id || ''}
            emptyListLabel={this.t('participants.empty_list')}
          >
            <slot></slot>
          </rtk-paginated-list>
        </div>
      </Host>
    );
  }
}
