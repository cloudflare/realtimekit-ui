import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { elapsedDuration, formatDateTime } from '../../utils/date';
import { SyncWithStore } from '../../utils/sync-with-store';
import { IconPack, defaultIconPack } from '../../exports';

export interface MessageAction {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  tag: 'rtk-message-view',
  styleUrl: 'rtk-message-view.css',
  shadow: true,
})
export class RtkMessageView {
  /** List of actions to show in menu */
  @Prop() actions: MessageAction[] = [];

  /** Appearance */
  @Prop() variant: 'plain' | 'bubble' = 'bubble';

  /** Render */
  @Prop() viewType: 'incoming' | 'outgoing' = 'outgoing';

  /** Avatar image url */
  @Prop() avatarUrl: string;

  /** Hides avatar */
  @Prop() hideAvatar: boolean = false;

  /** Author display label */
  @Prop() authorName: string;

  /** Is the message sent by the current user */
  @Prop() isSelf: boolean = false;

  /** Hides author display label */
  @Prop() hideAuthorName: boolean = false;

  /** Hides metadata (time) */
  @Prop() hideMetadata: boolean = false;

  /** Time when message was sent */
  @Prop() time: Date;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** action event */
  @Event({ eventName: 'action' }) onAction: EventEmitter<string>;

  private renderActions() {
    return (
      <rtk-menu placement={this.isSelf ? 'bottom-start' : 'bottom-end'} offset={1}>
        <button slot="trigger" class="actions">
          <rtk-icon icon={this.iconPack.chevron_down} />
        </button>
        <rtk-menu-list menuVariant={this.isSelf ? 'primary' : 'secondary'}>
          {this.actions.map((action) => (
            <rtk-menu-item
              menuVariant={this.isSelf ? 'primary' : 'secondary'}
              onClick={() => this.onAction.emit(action.id)}
            >
              {action.icon && <rtk-icon icon={action.icon} slot="start" />}
              {action.label}
            </rtk-menu-item>
          ))}
        </rtk-menu-list>
      </rtk-menu>
    );
  }

  render() {
    return (
      <Host>
        <div class={{ 'message-wrapper': true, [this.viewType]: true }}>
          {!this.hideAvatar && (
            <aside class="avatar" part="avatar">
              <rtk-avatar
                participant={{ name: this.authorName, picture: this.avatarUrl }}
                size="sm"
              />
            </aside>
          )}
          <div class="message" part="message">
            {!this.hideAuthorName && (
              <div class="header">
                {this.authorName} {this.isSelf ? ' (You)' : ''}
              </div>
            )}
            <div class={{ body: true, bubble: this.variant === 'bubble' }}>
              <slot></slot>
              {!this.hideMetadata && !!this.time && (
                <div class="metadata" title={formatDateTime(this.time)}>
                  {elapsedDuration(this.time, new Date(Date.now()))}
                </div>
              )}
              {this.actions.length !== 0 && this.renderActions()}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
