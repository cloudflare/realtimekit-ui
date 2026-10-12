import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { States, Size, IconPack, defaultIconPack, RtkI18n } from '../../exports';
import { useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import {
  VideoProducerScoreStats,
  MediaKind,
  ProducerScoreStats,
  AudioProducerScoreStats,
} from '@cloudflare/realtimekit';

import { SyncWithStore } from '../../utils/sync-with-store';

import {
  FormattedStatsObj,
  getBitrateVerdict,
  getJitterVerdict,
  getNetworkBasedMediaHealth,
  getPacketLossVerdict,
  StatsHealth,
} from '../../utils/debugger-utils';

@Component({
  tag: 'rtk-debugger-screenshare',
  styleUrl: 'rtk-debugger-screenshare.css',
  shadow: true,
})
export class RtkDebuggerScreenShare {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Size */
  @Prop({ reflect: true }) size: Size;

  /** Icon pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Is Network section expanded */
  @State() isNetworkOpen: boolean = true;

  /** Is Devices section expanded */
  @State() isDevicesOpen: boolean = false;

  /** Stats as formatted array to display */
  @State() videoProducerFormattedStats: FormattedStatsObj[] = [];

  /** Last raw video score stats obj */
  @State() videoProducerScoreStats: VideoProducerScoreStats = null;

  /** Stats as formatted array to display */
  @State() audioProducerFormattedStats: FormattedStatsObj[] = [];

  /** Last raw video score stats obj */
  @State() audioProducerScoreStats: AudioProducerScoreStats = null;

  /** Summarised health of network stats */
  @State() networkBasedMediaHealth: StatsHealth = null;

  // private toggleSection(section: string) {
  //   if (section === 'network') this.isNetworkOpen = !this.isNetworkOpen;
  //   else if (section === 'devices') this.isDevicesOpen = !this.isDevicesOpen;
  // }

  private mediaScoreUpdateListener = ({
    kind,
    isScreenshare,
    scoreStats,
  }: {
    kind: MediaKind;
    isScreenshare: boolean;
    scoreStats: ProducerScoreStats;
  }) => {
    if (kind === 'video' && isScreenshare) {
      this.videoProducerScoreStats = scoreStats as VideoProducerScoreStats;
    }
    if (kind === 'audio' && isScreenshare) {
      this.audioProducerScoreStats = scoreStats as AudioProducerScoreStats;
    }
  };

  private screenShareUpdateListener = () => {
    if (!this.meeting.self.screenShareEnabled) {
      this.videoProducerScoreStats = null;
      this.audioProducerScoreStats = null;
    }
  };

  @Watch('videoProducerScoreStats')
  async videoProducerScoreStatsChanged(newVideoProducerScoreStats: VideoProducerScoreStats) {
    if (!newVideoProducerScoreStats) {
      this.videoProducerFormattedStats = [];
      return;
    }

    const statsObj = newVideoProducerScoreStats;

    const newStatsList: FormattedStatsObj[] = [];

    newStatsList.push({
      name: this.t('debugger.stats.cpu_limitations.label'),
      value: statsObj.cpuLimitations ? 'Yes' : 'No',
      description: this.t('debugger.stats.cpu_limitations.description'),
      verdict: statsObj.cpuLimitations ? 'Poor' : 'Good',
    });

    newStatsList.push({
      name: this.t('debugger.stats.bandwidth_limitations.label'),
      value: statsObj.bandwidthLimitations ? 'Yes' : 'No',
      description: this.t('debugger.stats.bandwidth_limitations.description'),
      verdict: statsObj.bandwidthLimitations ? 'Poor' : 'Good',
    });

    newStatsList.push({
      name: this.t('debugger.stats.bitrate.label'),
      value: `${Math.round(statsObj.bitrate / 1024)} kbps`,
      description: this.t('debugger.stats.bitrate.description'),
      verdict: getBitrateVerdict({
        bitrate: statsObj.bitrate,
        kind: 'video',
        isScreenshare: false,
      }),
    });

    newStatsList.push({
      name: this.t('debugger.stats.packet_loss.label'),
      value: `${statsObj.packetsLostPercentage}%`,
      description: this.t('debugger.stats.packet_loss.description'),
      verdict: getPacketLossVerdict({ packetLossPercentage: statsObj.packetsLostPercentage }),
    });
    newStatsList.push({
      name: this.t('debugger.stats.jitter.label'),
      value: `${Math.round(statsObj.jitter * 1000)} ms`,
      description: this.t('debugger.stats.jitter.description'),
      verdict: getJitterVerdict({ jitterInMS: statsObj.jitter * 1000 }),
    });

    this.videoProducerFormattedStats = newStatsList;
    this.networkBasedMediaHealth = getNetworkBasedMediaHealth({
      kind: 'video',
      isScreenshare: false,
      stats: newStatsList,
    });
  }

  @Watch('audioProducerScoreStats')
  async audioProducerScoreStatsChanged(newAudioProducerScoreStats: AudioProducerScoreStats) {
    if (!newAudioProducerScoreStats) {
      this.audioProducerFormattedStats = [];
      return;
    }

    const statsObj = newAudioProducerScoreStats;

    const newStatsList: FormattedStatsObj[] = [];
    newStatsList.push({
      name: this.t('debugger.stats.bitrate.label'),
      value: `${Math.round(statsObj.bitrate / 1024)} kbps`,
      description: this.t('debugger.stats.bitrate.description'),
      verdict: getBitrateVerdict({
        bitrate: statsObj.bitrate,
        kind: 'audio',
        isScreenshare: true,
      }),
    });

    newStatsList.push({
      name: this.t('debugger.stats.packet_loss.label'),
      value: `${statsObj.packetsLostPercentage}%`,
      description: this.t('debugger.stats.packet_loss.description'),
      verdict: getPacketLossVerdict({ packetLossPercentage: statsObj.packetsLostPercentage }),
    });
    newStatsList.push({
      name: this.t('debugger.stats.jitter.label'),
      value: `${Math.round(statsObj.jitter * 1000)} ms`,
      description: this.t('debugger.stats.jitter.description'),
      verdict: getJitterVerdict({ jitterInMS: statsObj.jitter * 1000 }),
    });

    this.audioProducerFormattedStats = newStatsList;
    /** Only screenshare video is deciding the media health currently */
    // this.networkBasedMediaHealth = getNetworkBasedMediaHealth({
    //   kind: 'audio',
    //   isScreenshare: true,
    //   stats: newStatsList,
    // });
  }

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    if (!this.meeting) {
      return;
    }
    this.meeting.self.off('mediaScoreUpdate', this.mediaScoreUpdateListener);
    this.meeting.self.off('screenShareUpdate', this.screenShareUpdateListener);
  }

  @Watch('meeting')
  async meetingChanged(meeting: Meeting) {
    if (!meeting) return;
    meeting.self.on('mediaScoreUpdate', this.mediaScoreUpdateListener);
    meeting.self.on('screenShareUpdate', this.screenShareUpdateListener);
  }

  render() {
    if (!this.meeting) {
      return;
    }

    return (
      <Host>
        <div class="tab-body">
          <div class="status-container">
            <div class="status-section">
              <div
                class={`section-header ${!this.networkBasedMediaHealth ? 'only-child' : ''}`}
                // onClick={() => this.toggleSection('network')}
              >
                <span>{this.t('debugger.screenshare.sections.network_media')}</span>
                {this.networkBasedMediaHealth && (
                  <span class={`status ${this.networkBasedMediaHealth?.toLowerCase()}`}>
                    {this.t(`debugger.quality.${this.networkBasedMediaHealth?.toLowerCase()}`)}
                  </span>
                )}
                {/* <span class="arrow">{this.isNetworkOpen ? '▾' : '▸'}</span> */}
              </div>
              {this.isNetworkOpen && !this.videoProducerFormattedStats.length && (
                <div class="section-body missing-stats">
                  {this.meeting.self.screenShareEnabled ? (
                    <span>{this.t('debugger.screenshare.messages.generating_report')}</span>
                  ) : (
                    <span>{this.t('debugger.screenshare.messages.enable_media')}</span>
                  )}
                </div>
              )}
              {this.isNetworkOpen && !!this.videoProducerFormattedStats.length && (
                <div class="section-body network-table">
                  {this.videoProducerFormattedStats.map((formattedStatsObj) => (
                    <div class="network-row">
                      <div class="network-cell label">
                        <strong>{formattedStatsObj.name}</strong>
                        <span class="description">{formattedStatsObj.description}</span>
                      </div>
                      <div class="network-cell value">
                        <span class={`status ${formattedStatsObj.verdict?.toLowerCase()}`}>
                          {this.t(`debugger.quality.${formattedStatsObj.verdict?.toLowerCase()}`)}
                        </span>
                        <span class="value">{formattedStatsObj.value}</span>
                      </div>
                    </div>
                  ))}
                  {/** Hiding Audio stats for now to declutter */}
                  {/* {this.audioProducerFormattedStats.map((formattedStatsObj) => (
                    <div class="network-row">
                      <div class="network-cell label">
                        <strong>{formattedStatsObj.name} (Audio)</strong>
                        <span class="description">{formattedStatsObj.description}</span>
                      </div>
                      <div class="network-cell value">
                        <span class={`status ${formattedStatsObj.verdict?.toLowerCase()}`}>
                          {formattedStatsObj.verdict}
                        </span>
                        <span class="value">{formattedStatsObj.value}</span>
                      </div>
                    </div>
                  ))} */}
                </div>
              )}
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
