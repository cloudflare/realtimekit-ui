import { Component, Host, h, Prop } from '@stencil/core';
import type { FileMessage } from '@cloudflare/realtimekit';
import { ChatHead } from '../rtk-chat/components/ChatHead';
import { sanitizeLink } from '../../utils/string';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { downloadFile, getExtension, getFileSize } from '../../utils/file';
import { SyncWithStore } from '../../utils/sync-with-store';
import { useLanguage, RtkI18n } from '../../lib/lang';

/**
 * @deprecated `rtk-file-message` is deprecated and will be removed soon. Use `rtk-file-message-view` instead.
 * A component which renders a file message from chat.
 */
@Component({
  tag: 'rtk-file-message',
})
export class RtkFileMessage {
  /** Text message object */
  @Prop() message!: FileMessage;

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
    const link = sanitizeLink(this.message.link);

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
          <div class="file">
            <div class="file-data">
              <div class="name">{this.message.name}</div>
              <div class="file-data-split">
                <div class="ext">{getExtension(this.message.name)}</div>
                <span class="divider"></span>
                <div class="size">{getFileSize(this.message.size)}</div>
              </div>
            </div>
            <rtk-button
              variant="secondary"
              kind="icon"
              onClick={() => downloadFile(link, { name: this.message.name, fallbackName: 'file' })}
              part="button"
            >
              <rtk-icon icon={this.iconPack.download} />
            </rtk-button>
          </div>
        </div>
      </Host>
    );
  }
}
