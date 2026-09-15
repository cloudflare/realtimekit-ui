import { Component, Host, h, Prop, State, Element, Watch, writeTask } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';

import { Transcript, States } from '../../types/props';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { UIConfig } from '../../types/ui-config';
import { createDefaultConfig } from '../../exports';
import { SyncWithStore } from '../../utils/sync-with-store';
import clone from '../../utils/clone';

/** Maximum character length of a single rendered caption group. */
const MAX_GROUP_LENGTH = 400;

/**
 * A component which handles transcripts.
 *
 * You can configure which transcripts you want to see and which ones you want to hear.
 * There are also certain limits which you can set as well.
 */
@Component({
  tag: 'rtk-transcripts',
  styleUrl: 'rtk-transcripts.css',
  shadow: true,
})
export class RtkTranscripts {
  private disconnectTimeout: NodeJS.Timeout;

  @Element() host: HTMLRtkTranscriptsElement;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Config object */
  @SyncWithStore()
  @Prop()
  config: UIConfig = createDefaultConfig();

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  @State() transcripts: Array<Transcript & { renderedId?: string }> = [];

  @State() listenerAttached = false;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  private addListener(meeting: Meeting) {
    meeting?.ai?.addListener('transcript', this.onTranscript);
    this.listenerAttached = true;
  }

  private clearListeners(meeting: Meeting) {
    this.onTranscript && meeting?.ai?.removeListener('transcript', this.onTranscript);
    this.listenerAttached = false;
    clearTimeout(this.disconnectTimeout);
    this.transcripts = [];
  }

  disconnectedCallback() {
    if (!this.meeting) return;
    this.clearListeners(this.meeting);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    clearTimeout(this.disconnectTimeout);
    if (oldMeeting) this.clearListeners(oldMeeting);
    if (!meeting) return;

    if (this.states.activeCaptions) {
      this.addListener(meeting);
    }
  }

  @Watch('states')
  statesChanged(states?: States) {
    if (!states) return;

    if (states.activeCaptions && !this.listenerAttached) {
      this.addListener(this.meeting);
    }

    if (!states.activeCaptions && this.listenerAttached) {
      this.clearListeners(this.meeting);
    }
  }

  private onTranscript = (transcript: Transcript) => {
    if (transcript.transcript) {
      this.add(transcript);
    }
  };

  private transcriptionsReducer(acc: Transcript[], t: Transcript) {
    if (!acc.length) {
      return [t];
    }

    let lastElement = acc[acc.length - 1];

    if (lastElement.peerId !== t.peerId) {
      return acc.concat(t);
    }

    if (lastElement.id === t.id) {
      lastElement.transcript = t.transcript;
      acc.pop();
      return acc.concat(clone(lastElement));
    }

    return acc.concat(t);
  }

  private add(transcript: Transcript) {
    this.transcripts = this.transcriptionsReducer(this.transcripts, transcript);
    this.pruneToLatestTwoGroups();
  }

  /**
   * Groups raw transcript entries using the same merging rules as the renderer:
   * consecutive entries from the same peer are combined with a separator space
   * until the accumulated text exceeds MAX_GROUP_LENGTH, at which point a new
   * group begins. Assigns renderedId on each entry as a side effect so that
   * pruning and rendering stay in sync.
   */
  private buildGroups() {
    const groups: Array<{
      renderedId: string;
      peerId: string;
      combinedText: string;
      entries: Array<Transcript & { renderedId?: string }>;
    }> = [];

    this.transcripts.forEach((transcript) => {
      const last = groups[groups.length - 1];
      if (
        !last ||
        last.peerId !== transcript.peerId ||
        last.combinedText.length + transcript.transcript.length > MAX_GROUP_LENGTH
      ) {
        groups.push({
          renderedId: transcript.id,
          peerId: transcript.peerId,
          combinedText: transcript.transcript,
          entries: [transcript],
        });
        transcript.renderedId = transcript.id;
      } else {
        last.combinedText += ' ' + transcript.transcript;
        transcript.renderedId = last.renderedId;
        last.entries.push(transcript);
      }
    });

    return groups;
  }

  /**
   * Keeps only the raw entries that belong to the latest two rendered groups.
   * Entries that fall outside the visible two groups are removed immediately
   * so they cannot resurface after current captions expire.
   */
  private pruneToLatestTwoGroups() {
    const groups = this.buildGroups();
    if (groups.length <= 2) return;
    const visible = new Set(groups.slice(-2).flatMap((g) => g.entries));
    this.transcripts = this.transcripts.filter((t) => visible.has(t));
  }

  private remove(renderedId: string) {
    this.transcripts = this.transcripts.filter(
      (transcript) => transcript.renderedId !== renderedId
    );
  }

  private handleDismiss(e: CustomEvent<{ id: string; renderedId: string }>) {
    e.stopPropagation();

    const { id, renderedId } = e.detail;
    const el = this.host.shadowRoot.querySelector(`[data-id="${id}"]`);
    // exit animation
    el?.classList.add('exit');

    setTimeout(() => {
      writeTask(() => {
        this.remove(renderedId);
      });
    }, 400);
  }

  private renderTranscripts() {
    return this.buildGroups()
      .slice(-2)
      .map((group) => {
        const first = group.entries[0];
        const transcript = {
          name: first.name,
          date: first.date,
          peerId: group.peerId,
          userId: first.userId,
          customParticipantId: first.customParticipantId,
          transcript: group.combinedText,
          id: first.id,
          renderedId: group.renderedId,
        };
        return (
          <rtk-transcript
            key={first.id}
            data-id={first.id}
            transcript={transcript}
            onRtkTranscriptDismiss={(e: CustomEvent<{ id: string; renderedId: string }>) =>
              this.handleDismiss(e)
            }
            t={this.t}
          />
        );
      });
  }

  render() {
    if (!this.states.activeCaptions) return;
    return <Host>{this.renderTranscripts()}</Host>;
  }
}
