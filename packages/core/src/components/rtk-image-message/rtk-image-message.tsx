import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import type { ImageMessage } from '@cloudflare/realtimekit';
import { ChatHead } from '../rtk-chat/components/ChatHead';
import { sanitizeLink } from '../../utils/string';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { downloadFile } from '../../utils/file';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { States } from '../../types/props';
import { SyncWithStore } from '../../utils/sync-with-store';

/**
 * @deprecated `rtk-image-message` is deprecated and will be removed soon. Use `rtk-image-message-view` instead.
 * A component which renders an image message from chat.
 */
@Component({
  tag: 'rtk-image-message',
  styleUrl: 'rtk-image-message.css',
})
export class RtkImageMessage {
  /** Text message object */
  @Prop() message!: ImageMessage;

  /** Date object of now, to calculate distance between dates */
  @Prop() now: Date = new Date();

  /** Whether the message is continued by same user */
  @Prop({ reflect: true }) isContinued: boolean = false;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** show message in bubble */
  @Prop() showBubble: boolean = false;

  @State() status: 'loading' | 'loaded' | 'errored' = 'loading';

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  render() {
    return (
      <Host>
        {!this.isContinued && (
          <ChatHead name={this.message.displayName} time={this.message.time} now={this.now} />
        )}
        <div
          class={{
            body: true,
            bubble: this.showBubble,
          }}
          part="body"
        >
          <div class={{ image: true, loaded: this.status === 'loaded' }}>
            <img
              src={sanitizeLink(this.message.link)}
              onLoad={() => {
                this.status = 'loaded';
              }}
              onError={() => {
                this.status = 'errored';
              }}
              onClick={() => {
                if (this.status === 'loaded') {
                  this.stateUpdate.emit({ image: this.message });
                }
              }}
            />
            {this.status === 'loading' && (
              <div
                class="image-spinner"
                title={this.t('chat.img.loading')}
                aria-label={this.t('chat.img.loading')}
              >
                <rtk-spinner iconPack={this.iconPack} />
              </div>
            )}
            {this.status === 'errored' && (
              <div
                class="image-errored"
                title={this.t('chat.error.img_not_found')}
                aria-label={this.t('chat.error.img_not_found')}
              >
                <rtk-icon icon={this.iconPack.image_off} />
              </div>
            )}
            {this.status === 'loaded' && (
              <div class="actions">
                <rtk-button
                  class="action"
                  variant="secondary"
                  kind="icon"
                  onClick={() => {
                    this.stateUpdate.emit({ image: this.message });
                  }}
                >
                  <rtk-icon icon={this.iconPack.full_screen_maximize} />
                </rtk-button>
                <rtk-button
                  class="action"
                  variant="secondary"
                  kind="icon"
                  onClick={() => downloadFile(this.message.link, { fallbackName: 'image' })}
                >
                  <rtk-icon icon={this.iconPack.download} />
                </rtk-button>
              </div>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
