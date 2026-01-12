import {
  Component,
  Element,
  Event,
  EventEmitter,
  forceUpdate,
  h,
  Host,
  Prop,
  State,
  writeTask,
} from '@stencil/core';
import { defaultIconPack, RtkI18n, IconPack, States, useLanguage } from '../../exports';
import { Meeting } from '../../types/rtk-client';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKBasicParticipant } from '@cloudflare/realtimekit';

/**
 * @deprecated `rtk-channel-creator` is deprecated and will be removed soon.
 */
@Component({
  tag: 'rtk-channel-creator',
  styleUrl: 'rtk-channel-creator.css',
  shadow: true,
})
export class RtkChannelCreator {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  /** Emits event to switch channel */
  @Event() switchChannel: EventEmitter<string>;

  @State() channelName = '';

  @State() searchQuery = '';

  @State() step = 1;

  @State() loading = false;

  @State() selectedMemberIds: Set<string> = new Set();

  @State() focusedMemberIndex = -1;

  @State() showAllMembersList = false;

  @Element() $el: HTMLRtkChannelCreatorElement;

  private allMembers: Map<string, RTKBasicParticipant> = new Map();

  private inputTextRef: HTMLInputElement = null;

  private searchInputTextRef?: HTMLInputElement = null;

  componentDidLoad() {
    this.inputTextRef?.focus();
  }

  private focusOnSearch = (selectText = false) => {
    this.focusedMemberIndex = -1;
    writeTask(() => {
      this.searchInputTextRef?.focus();
      if (selectText) this.searchInputTextRef?.select();
    });
  };

  private onClickHandler = async () => {
    if (this.channelName.length === 0) return;

    if (this.step === 1) {
      const members = this.meeting.participants.all.toArray();
      const selfId = this.meeting.self.userId;
      const nonSelfMembers = members.filter((member) => member.userId !== selfId);
      nonSelfMembers.forEach((member) => this.allMembers.set(member.userId, member));
      this.step = 2;
      this.focusOnSearch();
      return;
    }
    // step 2 - add members and create channel
    await this.createChannel();
  };

  private createChannel = async () => {
    const members = Array.from(this.selectedMemberIds);
    const newChannel = await this.meeting.chat.createChannel(this.channelName, members, {
      displayPictureUrl: '',
      visibility: 'public',
      isDirectMessage: false,
    });
    this.switchChannel.emit(newChannel.id);
    this.stateUpdate.emit({ activeChannelCreator: false });
  };

  private onMemberAdd = (id: string) => {
    this.showAllMembersList = false;
    this.selectedMemberIds.add(id);
    this.searchQuery = '';
    this.focusOnSearch();
  };

  private keyDownHandler = (e: KeyboardEvent, filteredMembers: RTKBasicParticipant[]) => {
    if (e.key === 'ArrowDown') {
      this.focusedMemberIndex = Math.min(this.focusedMemberIndex + 1, filteredMembers.length - 1);
    } else if (e.key === 'ArrowUp') {
      if (this.focusedMemberIndex === -1) return;
      if (this.focusedMemberIndex === 0) {
        this.focusOnSearch(true);
        return;
      }
      this.focusedMemberIndex = Math.max(this.focusedMemberIndex - 1, 0);
    } else if (e.key === 'Enter') {
      this.onMemberAdd(filteredMembers[this.focusedMemberIndex].userId);
    } else if (e.key === 'Backspace') {
      this.focusedMemberIndex === -1;
      if (this.searchQuery.length !== 0) return;
      if (this.selectedMemberIds.size === 0) return;
      const lastMemberId = Array.from(this.selectedMemberIds.values()).at(-1);
      this.selectedMemberIds.delete(lastMemberId);
      forceUpdate(this.$el);
    }
  };

  private renderMemberSelector = () => {
    const filteredMembers = Array.from(this.allMembers.values()).filter(
      (member) =>
        !this.selectedMemberIds.has(member.userId) &&
        member.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    const selectedMembers = Array.from(this.selectedMemberIds.values()).map((id) =>
      this.allMembers.get(id)
    );
    const disableInput = this.selectedMemberIds.size === this.allMembers.size;
    return (
      <div class="input-container">
        <ul
          class="members scrollbar"
          onClick={() => {
            this.searchInputTextRef?.focus();
          }}
        >
          {selectedMembers.map((member) => (
            <li class="pill">
              <rtk-avatar
                participant={{
                  name: member.name,
                  picture: member.picture,
                }}
                size="sm"
              />
              <span>{member.name}</span>
              <rtk-icon
                icon={this.iconPack.dismiss}
                onClick={() => {
                  this.selectedMemberIds.delete(member.userId);
                  forceUpdate(this.$el);
                  this.focusOnSearch();
                }}
              />
            </li>
          ))}

          {!disableInput && (
            <input
              type="text"
              ref={(el) => (this.searchInputTextRef = el)}
              value={this.searchQuery}
              placeholder={this.selectedMemberIds.size === 0 ? this.t('chat.member_name') : ''}
              class={{
                'wide-input': this.selectedMemberIds.size === 0,
              }}
              onInput={(e) => {
                this.searchQuery = (e.target as HTMLInputElement).value.trim();
              }}
              onClick={() => {
                this.showAllMembersList = !this.showAllMembersList;
              }}
              onKeyDown={(e) => this.keyDownHandler(e, filteredMembers)}
            />
          )}
        </ul>
        {(this.searchQuery.length !== 0 || this.showAllMembersList) && (
          <ul class="search-results">
            {filteredMembers.map((member, index) => (
              <li
                class={{ member: true, selected: index === this.focusedMemberIndex }}
                onClick={() => this.onMemberAdd(member.userId)}
                ref={($li) => {
                  if (index === this.focusedMemberIndex) {
                    writeTask(() => {
                      if ($li)
                        $li.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
                    });
                  }
                }}
              >
                <rtk-avatar
                  participant={{
                    name: member.name,
                    picture: member.picture,
                  }}
                  size="sm"
                />
                <span>{member.name}</span>
              </li>
            ))}
            {filteredMembers.length === 0 && (
              <li class="member">
                <span>{this.t('chat.error.empty_results')}</span>
              </li>
            )}
          </ul>
        )}
      </div>
    );
  };

  render() {
    return (
      <Host>
        <header>{this.step === 1 ? this.t('chat.new_channel') : this.t('chat.add_members')}</header>
        {this.step === 1 && (
          <input
            class="channel-name-input"
            type="text"
            placeholder={this.t('chat.channel_name')}
            ref={(el) => (this.inputTextRef = el)}
            onInput={(e) => {
              this.channelName = (e.target as HTMLInputElement).value.trim();
            }}
          />
        )}
        {this.step === 2 && this.renderMemberSelector()}
        <footer>
          <rtk-button
            kind="button"
            size="lg"
            disabled={this.channelName.length === 0}
            onClick={this.onClickHandler}
          >
            {this.step === 1 ? this.t('chat.add_members') : this.t('create')}
          </rtk-button>
        </footer>
      </Host>
    );
  }
}
