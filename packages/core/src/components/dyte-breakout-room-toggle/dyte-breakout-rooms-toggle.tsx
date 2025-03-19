import { Component, Host, h, Prop, Event, EventEmitter, State, Watch } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { DyteI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/dyte-client';
import { PartialStateEvent, Size, States } from '../../types/props';
import { ControlBarVariant } from '../dyte-controlbar-button/dyte-controlbar-button';
import storeState from '../../lib/store';
import { SyncWithStore } from '../../utils/sync-with-store';
import { canToggleBreakout } from '../../utils/breakout-rooms';

/**
 * A button which toggles visibility of breakout rooms.
 *
 * You need to pass the `meeting` object to it.
 */
@Component({
  tag: 'dyte-breakout-rooms-toggle',
  styleUrl: 'dyte-breakout-rooms-toggle.css',
  shadow: true,
})
export class DyteBreakoutRoomsToggle {
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
  t: DyteI18n = useLanguage();

  /** Emits updated state data */
  @Event({ eventName: 'dyteStateUpdate' }) stateUpdate: EventEmitter<PartialStateEvent>;

  @State() canToggle = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }
  disconnectedCallback() {
    this.meeting?.self?.permissions?.off('permissionsUpdate', this.permissionsUpdateListener);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    this.canToggle = canToggleBreakout(meeting);
    meeting.self.permissions.on('permissionsUpdate', this.permissionsUpdateListener);
  }

  private permissionsUpdateListener = () => {
    this.canToggle = canToggleBreakout(this.meeting);
  };

  private breakoutRoomToggle = () => {
    const mode = this.meeting.connectedMeetings.isActive ? 'view' : 'create';
    this.stateUpdate.emit({
      activeBreakoutRoomsManager: {
        active: !this.states?.activeBreakoutRoomsManager?.active,
        mode,
      },
    });
    storeState.activeBreakoutRoomsManager = {
      active: !storeState.activeBreakoutRoomsManager?.active,
      mode,
    };
  };

  render() {
    if (!this.canToggle) return;
    return (
      <Host title={this.t('breakout_rooms')}>
        <dyte-controlbar-button
          part="controlbar-button"
          size={this.size}
          iconPack={this.iconPack}
          onClick={this.breakoutRoomToggle}
          icon={this.iconPack.breakout_rooms}
          label={this.t('breakout_rooms')}
          variant={this.variant}
        />
      </Host>
    );
  }
}
