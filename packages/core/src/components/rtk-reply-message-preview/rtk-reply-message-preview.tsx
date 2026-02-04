import { Component, Event, EventEmitter, Host, Prop, h } from '@stencil/core';
import { IconPack, defaultIconPack } from '../../exports';
import { ImageMessage, Message, TextMessage } from '@cloudflare/realtimekit';

@Component({
  tag: 'rtk-reply-message-preview',
  styleUrl: 'rtk-reply-message-preview.css',
  shadow: true,
})
export class RtkReplyMessagePreview {
  @Prop() replyMessage: Message;

  @Prop() iconPack: IconPack = defaultIconPack;

  @Event({ eventName: 'rtkReplyMessageDismiss' }) dismiss: EventEmitter<void>;

  @Prop() isDissmisable: boolean = false;

  render() {
    if (!this.replyMessage) {
      return null;
    }

    return (
      <Host>
        <div class="reply-box">
          <div class="reply-box-header">
            <div class="reply-box-user">
              <rtk-avatar
                size="sm"
                participant={{
                  name: this.replyMessage.displayName,
                  picture: '',
                }}
              />
              {this.replyMessage.displayName}
            </div>
            {this.isDissmisable ? (
              <rtk-icon
                icon={this.iconPack.dismiss}
                size="sm"
                onClick={() => {
                  this.dismiss.emit();
                }}
              />
            ) : null}
          </div>
          <div class="reply-box-content">
            {this.replyMessage.type === 'text' && (this.replyMessage as TextMessage).message}
            {this.replyMessage.type === 'image' && (
              <img src={(this.replyMessage as ImageMessage).link} />
            )}
            {this.replyMessage.type === 'file' && (
              <rtk-file-message-view
                name={this.replyMessage.name}
                url={this.replyMessage.link}
                size={this.replyMessage.size}
              ></rtk-file-message-view>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
