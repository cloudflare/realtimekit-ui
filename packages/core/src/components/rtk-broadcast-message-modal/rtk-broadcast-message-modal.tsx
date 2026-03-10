import { Component, h, Host, Prop, Event, EventEmitter, State } from '@stencil/core';
import { States } from '../../exports';
import { Meeting } from '../../types/rtk-client';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RtkI18n, useLanguage } from '../../lib/lang';

/**
 * A modal for sending broadcast messages to all meeting participants.
 *
 * Allows hosts and moderators to send important announcements that
 * appear prominently to all users in the meeting.
 */
@Component({
  tag: 'rtk-broadcast-message-modal',
  styleUrl: 'rtk-broadcast-message-modal.css',
  shadow: true,
})
export class RtkBroadcastMessageModal {
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
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  /** Broadcast message state */
  @State() messagePayload: {
    to: string;
    message: string;
  } = {
    to: 'Everyone',
    message: '',
  };

  @State() successMessage: boolean = false;

  private close() {
    this.stateUpdate?.emit({ activeBroadcastMessageModal: false });
  }

  private sendMessage() {
    // TODO:(ishita1805) Send this.messagePayload to webcore.
    this.successMessage = true;
    setTimeout(() => {
      this.close();
    }, 2000);
  }

  render() {
    return (
      <Host>
        <div class="content-col">
          <h2>Broadcast message to</h2>
          <select
            onChange={(e) => {
              this.messagePayload = {
                ...this.messagePayload,
                to: (e.target as HTMLSelectElement).value,
              };
            }}
          >
            <option>Everyone</option>
            <option>List of rooms</option>
          </select>
          <textarea
            placeholder="Type message here..."
            onInput={(e) => {
              this.messagePayload = {
                ...this.messagePayload,
                message: (e.target as HTMLTextAreaElement).value,
              };
            }}
          />
          {this.successMessage ? (
            <p>
              Message sent to {this.messagePayload.to}
              <rtk-icon icon={this.iconPack.checkmark} />
            </p>
          ) : (
            <div class="content-row">
              <rtk-button onClick={() => this.close()} variant="secondary">
                Cancel
              </rtk-button>
              &ensp;
              <rtk-button variant="primary" onClick={() => this.sendMessage()}>
                Send
              </rtk-button>
            </div>
          )}
        </div>
      </Host>
    );
  }
}
