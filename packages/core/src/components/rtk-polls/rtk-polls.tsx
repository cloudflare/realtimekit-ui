import { Component, Host, h, Prop, Watch, State } from '@stencil/core';
import { createDefaultConfig } from '../../exports';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { PollObject, Size, Poll } from '../../types/props';
import { UIConfig } from '../../types/ui-config';
import { smoothScrollToBottom } from '../../utils/scroll';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RTKPermissionsPreset } from '@cloudflare/realtimekit';

/**
 * A component which lists all available plugins a user can access with
 * the ability to enable or disable them as per their permissions.
 */
@Component({
  tag: 'rtk-polls',
  styleUrl: 'rtk-polls.css',
  shadow: true,
})
export class RtkPolls {
  private onCreate: (data: PollObject) => void;
  private onVote: (id: string, index: number) => void;
  private pollEl: HTMLDivElement;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Config */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

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

  /** Create State */
  @State() create: boolean = false;

  /** Polls */
  @State() polls: Poll[] = [];

  @State() permissions: RTKPermissionsPreset;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    if (!this.meeting) return;
    this.meeting.polls?.removeListener('pollsUpdate', this.onPollsUpdate);
    this.meeting.self.permissions.removeListener('pollsUpdate', this.onUpdatePermissions);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;

    if (!meeting.polls) return;

    this.permissions = this.meeting.self.permissions;
    this.polls = [...meeting.polls.items];
    meeting.polls.addListener('pollsUpdate', this.onPollsUpdate);
    this.meeting.self.permissions.addListener('pollsUpdate', this.onUpdatePermissions);

    this.onCreate = async (data: PollObject) => {
      this.create = false;
      await meeting.polls.create(data.question, data.options, data.anonymous, data.hideVotes);
    };

    this.onVote = async (id: string, index: number) => {
      await meeting.polls.vote(id, index);
    };
  }

  private toggleCreateState() {
    this.create = !this.create;
  }

  private onPollsUpdate = (data) => {
    this.polls = [...data.polls];
  };

  private onUpdatePermissions = () => {
    this.permissions = this.meeting.self.permissions;
  };

  componentDidRender() {
    smoothScrollToBottom(this.pollEl);
  }

  render() {
    return (
      <Host>
        <div class="ctr" part="container">
          <div class="polls-view scrollbar" ref={(el) => (this.pollEl = el)} part="polls">
            {this.polls.length == 0 && this.create !== true && (
              <div class="empty-polls">{this.t('polls.empty')}</div>
            )}
            {this.polls.map((item) => (
              <rtk-poll
                key={item.id}
                poll={item}
                onRtkVotePoll={(e) => {
                  this.onVote(e.detail.id, e.detail.index);
                }}
                self={this.meeting?.self.userId}
                iconPack={this.iconPack}
                t={this.t}
                permissions={this.permissions}
              />
            ))}
            {this.create && (
              <rtk-poll-form
                part="poll-form"
                onRtkCreatePoll={(e) => {
                  this.onCreate(e.detail);
                }}
                iconPack={this.iconPack}
                t={this.t}
              />
            )}
          </div>
          {this.permissions?.polls?.canCreate && (
            <rtk-button
              kind="wide"
              onClick={() => this.toggleCreateState()}
              variant={this.create ? 'secondary' : 'primary'}
              part="button"
            >
              {this.create ? this.t('polls.cancel') : this.t('polls.create')}
            </rtk-button>
          )}
        </div>
      </Host>
    );
  }
}
