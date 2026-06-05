import { Component, Host, Prop, State, Watch, h } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { ChatHead } from '../rtk-chat/components/ChatHead';
import { Meeting } from '../../types/rtk-client';
import { Transcript } from '../../types/props';
import { smoothScrollToBottom } from '../../utils/scroll';
import { SyncWithStore } from '../../utils/sync-with-store';
import clone from '../../utils/clone';

@Component({
  tag: 'rtk-ai-transcriptions',
  styleUrl: 'rtk-ai-transcriptions.css',
  shadow: true,
})
export class RtkAiTranscriptions {
  private contentContainer!: HTMLDivElement;

  @State() searchQuery = '';

  @State() isProcessing = false;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  @State() transcriptions: Transcript[] = [];

  /** Initial transcriptions */
  @Prop() initialTranscriptions: Transcript[];

  private autoScrollEnabled = true;

  // private transcriptionHandler(data: Transcript) {
  //   this.transcriptions = [...this.transcriptions, data];
  // }

  private transcriptionsReducer(acc: Transcript[], t: Transcript) {
    if (!acc.length || acc[acc.length - 1].peerId !== t.peerId) {
      return acc.concat(t);
    }

    const lastElement = acc[acc.length - 1];
    if (lastElement.id === t.id) {
      lastElement.transcript = t.transcript;
      acc.pop();
      return acc.concat(lastElement);
    }

    return acc.concat(t);
  }

  connectedCallback() {
    if (!this.meeting) return;

    this.meetingChanged(this.meeting);
  }

  componentDidLoad() {
    this.contentContainer?.addEventListener('scroll', this.onScroll);
  }

  disconnectedCallback() {
    this.meeting?.ai?.off('transcript', this.onTranscriptHandler);
    this.contentContainer?.removeEventListener('scroll', this.onScroll);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    this.transcriptions = clone(meeting?.ai?.transcripts);
    this.transcriptions = this.transcriptions.reduce(this.transcriptionsReducer, []);

    meeting?.ai?.on('transcript', this.onTranscriptHandler);
  }

  @Watch('transcriptions')
  transcriptionsChanged() {
    if (this.autoScrollEnabled) {
      setTimeout(() => {
        smoothScrollToBottom(this.contentContainer, false);
      }, 100);
    }
  }

  private onScroll = (e: Event) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target as HTMLDivElement;
    const fromTop = scrollTop + clientHeight;

    if (fromTop + 10 >= scrollHeight) {
      // at bottom
      this.autoScrollEnabled = true;
    } else {
      // not at bottom
      this.autoScrollEnabled = false;
    }
  };

  private onTranscriptHandler = (data: Transcript) => {
    this.transcriptions = this.transcriptionsReducer(this.transcriptions, data);
  };

  private renderTranscripts() {
    const query = this.searchQuery?.toLowerCase();
    const transcripts = this.transcriptions.filter((t) =>
      query
        ? t.name?.toLowerCase().includes(query) || t.transcript?.toLowerCase().includes(query)
        : true
    );

    const renderedTranscripts = [];
    transcripts.forEach((transcript) => {
      const t = {
        name: transcript.name,
        date: transcript.date,
        peerId: transcript.peerId,
        transcript: transcript.transcript,
      };

      if (!renderedTranscripts.length) {
        renderedTranscripts.push(t);
        return;
      }

      const lastTranscript = renderedTranscripts[renderedTranscripts.length - 1];

      if (transcript.peerId !== lastTranscript.peerId) {
        renderedTranscripts.push(t);
        return;
      }

      lastTranscript.transcript += ' ' + transcript.transcript;
    });

    return renderedTranscripts.map((transcription) => {
      return (
        <div class="message">
          <ChatHead
            name={transcription.name}
            time={new Date(transcription.date)}
            now={new Date()}
          />
          <div class="body">{transcription.transcript}</div>
        </div>
      );
    });
  }

  render() {
    return (
      <Host>
        <div class="search">
          <rtk-icon icon={this.iconPack.search} />
          <input
            type="search"
            autocomplete="off"
            placeholder={this.t('ai.transcriptions.search_placeholder')}
            value={this.searchQuery}
            onInput={(e) => (this.searchQuery = (e.target as HTMLInputElement).value)}
          />
        </div>

        {this.isProcessing && (
          <div class="processing">
            <p>Processing audio....</p>
          </div>
        )}

        {!this.isProcessing &&
          (() => {
            const transcripts = this.renderTranscripts();
            return (
              <div
                class="content scrollbar"
                ref={(el) => (this.contentContainer = el as HTMLDivElement)}
              >
                {this.transcriptions.length === 0 && (
                  <div class="started-message">
                    {this.t('ai.transcriptions.no_transcripts_yet')}
                  </div>
                )}

                {transcripts}

                {this.transcriptions.length > 0 && this.searchQuery && transcripts.length === 0 && (
                  <div class="started-message">
                    {this.t('ai.transcriptions.no_transcripts_found')}
                  </div>
                )}
              </div>
            );
          })()}
      </Host>
    );
  }
}
