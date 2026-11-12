import { Meeting } from '../../types/rtk-client';
import { Component, Host, h, Prop, State, Watch, writeTask } from '@stencil/core';
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
  private inputEl: HTMLInputElement;
  private titleEl: HTMLDivElement;
  private draftTitle: string;
  private isSaving = false;

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

  @State() meetingTitle: string;

  @State() canEdit = false;

  @State() isEditing = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    this.removeListeners(this.meeting);
  }

  private titleUpdateListener = ({ meetingTitle }: { meetingTitle: string }) => {
    this.meetingTitle = meetingTitle;
  };

  private updateCanEdit = () => {
    const permissions = this.meeting?.self?.permissions;
    this.canEdit = this.meeting?.connectedMeetings?.parentMeeting?.id
      ? !!permissions?.connectedMeetings?.canAlterConnectedMeetings
      : !!permissions?.canEditMeetingTitle;
    if (!this.canEdit) this.isEditing = false;
  };

  private removeListeners(meeting?: Meeting) {
    meeting?.meta?.removeListener('meetingTitleUpdate', this.titleUpdateListener);
    meeting?.self?.permissions?.removeListener('permissionsUpdate', this.updateCanEdit);
    meeting?.connectedMeetings?.removeListener('stateUpdate', this.updateCanEdit);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    this.removeListeners(oldMeeting);
    this.removeListeners(meeting);
    this.meetingTitle = meeting?.meta?.meetingTitle;
    this.isEditing = false;
    this.updateCanEdit();
    meeting?.meta?.addListener('meetingTitleUpdate', this.titleUpdateListener);
    meeting?.self?.permissions?.addListener('permissionsUpdate', this.updateCanEdit);
    meeting?.connectedMeetings?.addListener('stateUpdate', this.updateCanEdit);
  }

  private startEditing = () => {
    this.draftTitle = this.meetingTitle;
    this.isEditing = true;
    writeTask(() => {
      this.inputEl?.focus();
      this.inputEl?.select();
    });
  };

  private onTitleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this.startEditing();
  };

  // Returns focus to the title so keyboard users are not dropped on the page body.
  private stopEditing = () => {
    this.isEditing = false;
    writeTask(() => this.titleEl?.focus());
  };

  private save = async () => {
    if (this.isSaving) return;
    const title = this.inputEl?.value.trim();
    if (title && title !== this.meetingTitle) {
      this.isSaving = true;
      try {
        await this.meeting.meta.setMeetingTitle(title);
      } catch (error) {
        this.meeting.__internals__.logger.error('rtkMeetingTitle::setMeetingTitle failed', {
          error,
        });
      } finally {
        this.isSaving = false;
      }
    }
    // The title itself only changes through meetingTitleUpdate, so a failed save shows the old one.
    this.stopEditing();
  };

  private onKeyDown = (e: KeyboardEvent) => {
    // isComposing: Enter that confirms an IME candidate must not save.
    if (e.key === 'Enter' && !e.isComposing) this.save();
    if (e.key === 'Escape') this.stopEditing();
  };

  render() {
    const title = this.meetingTitle;

    if (title == null) return <Host data-hidden />;

    if (this.isEditing) {
      return (
        <Host role="banner" aria-label={title}>
          <input
            ref={(el) => (this.inputEl = el)}
            value={this.draftTitle}
            aria-label={this.t('meeting_title.edit')}
            onKeyDown={this.onKeyDown}
            part="input"
          />
          <rtk-tooltip label={this.t('meeting_title.save')}>
            <rtk-button
              kind="icon"
              variant="ghost"
              size="sm"
              aria-label={this.t('meeting_title.save')}
              onClick={this.save}
            >
              <rtk-icon icon={this.iconPack.checkmark} />
            </rtk-button>
          </rtk-tooltip>
          <rtk-tooltip label={this.t('cancel')}>
            <rtk-button
              kind="icon"
              variant="ghost"
              size="sm"
              aria-label={this.t('cancel')}
              onClick={this.stopEditing}
            >
              <rtk-icon icon={this.iconPack.dismiss} />
            </rtk-button>
          </rtk-tooltip>
        </Host>
      );
    }

    const editProps = this.canEdit && {
      role: 'button',
      tabIndex: 0,
      'aria-label': this.t('meeting_title.edit'),
      onClick: this.startEditing,
      onKeyDown: this.onTitleKeyDown,
    };

    return (
      <Host role="banner" aria-label={title}>
        <rtk-tooltip label={title} part="tooltip">
          <div class="title" part="title" ref={(el) => (this.titleEl = el)} {...editProps}>
            {title}
          </div>
        </rtk-tooltip>
      </Host>
    );
  }
}
