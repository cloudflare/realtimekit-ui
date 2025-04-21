import { Meeting } from '../../types/rtk-client';
import { Component, Host, h, Prop } from '@stencil/core';
import { IconPack, defaultIconPack } from '../../lib/icons';
import { SyncWithStore } from '../../utils/sync-with-store';
import { useLanguage, RtkI18n } from '../../lib/lang';

/**
 * Displays the title of the meeting.
 */
@Component({
  tag: 'rtk-meeting-title',
  styleUrl: 'rtk-meeting-title.css',
  shadow: true,
})
export class RtkMeetingTitle {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  render() {
    const title = this.meeting?.meta.meetingTitle;

    if (title == null) return <Host data-hidden />;

    return (
      <Host role="banner" aria-label={title}>
        <rtk-tooltip label={title} part="tooltip">
          <div class="title" part="title">
            {title}
          </div>
        </rtk-tooltip>
      </Host>
    );
  }
}
