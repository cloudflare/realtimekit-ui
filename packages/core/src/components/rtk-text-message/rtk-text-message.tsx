import type { TextMessage } from '@cloudflare/realtimekit';
import { Component, Host, h, Prop } from '@stencil/core';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { useLanguage, RtkI18n } from '../../lib/lang';
import { hasOnlyEmojis } from '../../utils/string';
import { ChatHead } from '../rtk-chat/components/ChatHead';
import { SyncWithStore } from '../../utils/sync-with-store';
import { TextMessageView } from './components/TextMessage';

/**
 * @deprecated `rtk-text-message` is deprecated and will be removed soon. Use `rtk-text-message-view` instead.
 * A component which renders a text message from chat.
 */
@Component({
  tag: 'rtk-text-message',
})
export class RtkTextMessage {
  /** Text message object */
  @Prop() message!: TextMessage;

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
          <div class={{ text: true, emoji: hasOnlyEmojis(this.message.message) }}>
            <TextMessageView message={this.message.message} />
          </div>
        </div>
      </Host>
    );
  }
}
