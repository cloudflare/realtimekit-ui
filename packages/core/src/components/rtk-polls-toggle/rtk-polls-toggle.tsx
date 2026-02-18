import { Component, Host, h, Prop, State, Watch, Event, EventEmitter } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { Size, States } from '../../types/props';
import { canViewPolls } from '../../utils/sidebar';
import { SyncWithStore } from '../../utils/sync-with-store';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';

/**
 * A button which toggles visibility of polls.
 *
 * You need to pass the `meeting` object to it to see the unread polls count badge.
 *
 * When clicked it emits a `rtkStateUpdate` event with the data:
 *
 * ```ts
 * { activeSidebar: boolean; sidebar: 'polls' }
 * ```
 */
@Component({
  tag: 'rtk-polls-toggle',
  styleUrl: 'rtk-polls-toggle.css',
  shadow: true,
})
export class RtkPollsToggle {
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

  @State() pollsActive: boolean = false;

  @State() unreadPollsCount: number = 0;

  @State() canViewPolls: boolean = false;

  private onPollsUpdate = ({ newPoll }) => {
    if (newPoll === true) this.unreadPollsCount += 1;
  };

  connectedCallback() {
    this.meetingChanged(this.meeting);
    this.statesChanged(this.states);
  }

  disconnectedCallback() {
    this.meeting?.polls?.removeListener('pollsUpdate', this.onPollsUpdate);
    this.meeting?.self?.permissions.removeListener('pollsUpdate', this.updateCanView);
    this.meeting?.stage?.removeListener('stageStatusUpdate', this.updateCanView);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting && meeting.polls) {
      this.unreadPollsCount = meeting.polls.items.length;

      this.meeting.polls.addListener('pollsUpdate', this.onPollsUpdate);
      meeting?.self?.permissions.addListener('pollsUpdate', this.updateCanView);
      this.canViewPolls = canViewPolls(meeting);
      meeting?.stage?.on('stageStatusUpdate', this.updateCanView);
    }
  }

  @Watch('states')
  statesChanged(states?: States) {
    if (states != null) {
      this.pollsActive = states.activeSidebar === true && states.sidebar === 'polls';
    }
  }

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  private togglePollsTab() {
    const states = this.states;
    this.unreadPollsCount = 0;
    this.pollsActive = !(states?.activeSidebar && states?.sidebar === 'polls');
    this.stateUpdate.emit({
      activeSidebar: this.pollsActive,
      sidebar: this.pollsActive ? 'polls' : undefined,
      activeMoreMenu: false,
      activeAI: false,
    });
  }

  private updateCanView = () => {
    this.canViewPolls = canViewPolls(this.meeting);
  };

  @Watch('pollsActive')
  handlePollsActiveChange() {
    // Polls sidebar closed without opening a different sidebar or AI panel
    if (!this.pollsActive && !this.states.activeSidebar && !this.states.activeAI) {
      this.buttonEl.focus();
    }
  }

  private buttonEl: HTMLRtkControlbarButtonElement;

  render() {
    if (!this.canViewPolls) return <Host data-hidden />;
    const text = this.t('polls');
    // TODO(callmetarush): Just showing polls for all V2 users irrespective of themes
    // untill we get ui theme for V2.

    return (
      <Host title={text}>
        {this.unreadPollsCount !== 0 && !this.pollsActive && (
          <div class="unread-count" part="unread-count">
            <span>{this.unreadPollsCount <= 100 ? this.unreadPollsCount : '99+'}</span>
          </div>
        )}
        <rtk-controlbar-button
          ref={(el) => (this.buttonEl = el)}
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          class={{ active: this.pollsActive }}
          onClick={() => this.togglePollsTab()}
          icon={this.iconPack.poll}
          label={text}
          variant={this.variant}
        />
      </Host>
    );
  }
}
