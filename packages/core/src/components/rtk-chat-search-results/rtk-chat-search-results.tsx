import { h, Component, Prop, Host } from '@stencil/core';
import { RtkI18n, IconPack, defaultIconPack, useLanguage } from '../../exports';
import { Meeting } from '../../types/rtk-client';
import { SyncWithStore } from '../../utils/sync-with-store';
import type { Message } from '@cloudflare/realtimekit';

/** @deprecated `rtk-chat-search-results` is deprecated and will be removed soon. Use `rtk-chat-messages-ui-paginated` instead. -*/
@Component({
  tag: 'rtk-chat-search-results',
  styleUrl: 'rtk-chat-search-results.css',
  shadow: true,
})
export class RtkChatSearchResults {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Search query */
  @Prop() query: string;

  /** Channel id */
  @Prop() channelId: string;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  private pageSize = 50;

  /** NOTE(ikabra): Core APIs need to be implemented for this, this component is not being used inside chat UI and was broken as standalone. */
  private searchMessages = async () => {
    return [];
  };

  private nodeRenderer = (messages: Message[]) => {
    return messages.map((message) => (
      <rtk-chat-message
        key={message.id}
        message={message}
        disableControls={true}
      ></rtk-chat-message>
    ));
  };

  render() {
    return (
      <Host>
        <rtk-paginated-list
          pageSize={this.pageSize}
          pagesAllowed={3}
          fetchData={this.searchMessages}
          createNodes={this.nodeRenderer}
        />
      </Host>
    );
  }
}
