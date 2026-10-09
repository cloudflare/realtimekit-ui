import { Component, Host, h, Prop, State, Event, EventEmitter, Listen } from '@stencil/core';
import { Meeting } from '../../types/rtk-client';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Size, States } from '../../types/props';
import { SyncWithStore } from '../../utils/sync-with-store';

export type DebuggerTab = 'audio' | 'video' | 'screenshare' | 'system';

/**
 * A troubleshooting component to identify and fix any issues in the meeting.
 */
@Component({
  tag: 'rtk-debugger',
  styleUrl: 'rtk-debugger.css',
  shadow: true,
})
export class RtkDebugger {
  private keyPressListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.close();
    }
  };
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

  @State() activeTab: DebuggerTab = 'audio';
  @State() isMobileMainVisible: boolean = false;
  @State() progress: number = 0;

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  connectedCallback() {
    document.addEventListener('keydown', this.keyPressListener);
  }

  disconnectedCallback() {
    this.keyPressListener && document.removeEventListener('keydown', this.keyPressListener);
  }

  @Listen('testProgress')
  progressUpdate(event: CustomEvent<number>) {
    this.progress = event.detail;
  }

  private changeTab(tab: DebuggerTab) {
    this.activeTab = tab;
    if (this.size === 'sm') {
      if (!this.isMobileMainVisible) {
        this.isMobileMainVisible = true;
      }
    }
  }

  private close() {
    this.stateUpdate.emit({ activeDebugger: false });
  }

  private getActiveTab() {
    switch (this.activeTab) {
      case 'audio':
        return this.t('debugger.audio.troubleshooting.label');
      case 'screenshare':
        return this.t('debugger.screenshare.troubleshooting.label');
      case 'video':
        return this.t('debugger.video.troubleshooting.label');
      case 'system':
        return this.t('debugger.system.troubleshooting.label');
      default:
        return this.t('debugger.troubleshooting.label');
    }
  }

  render() {
    if (!this.meeting) return null;

    const defaults = {
      meeting: this.meeting,
      states: this.states,
      iconPack: this.iconPack,
      t: this.t,
      size: this.size,
    };

    const tab = this.getActiveTab();

    const showSystemsTab = typeof (navigator as any).getBattery !== 'undefined';

    return (
      <Host>
        <aside class={{ hide: this.isMobileMainVisible }} part="menu">
          <header>
            <h3>{this.t('debugger.troubleshooting.label')}</h3>
          </header>
          <nav>
            <button
              type="button"
              class={{ active: this.activeTab === 'audio' }}
              onClick={() => this.changeTab('audio')}
            >
              {this.t('debugger.audio.label')}
              <div class="right">
                <rtk-icon icon={this.iconPack.mic_on} />
                {this.size === 'sm' && <rtk-icon icon={this.iconPack.chevron_right} />}
              </div>
            </button>
            <button
              type="button"
              class={{ active: this.activeTab === 'video' }}
              onClick={() => this.changeTab('video')}
            >
              {this.t('debugger.video.label')}
              <div class="right">
                <rtk-icon icon={this.iconPack.video_on} />
                {this.size === 'sm' && <rtk-icon icon={this.iconPack.chevron_right} />}
              </div>
            </button>
            <button
              type="button"
              class={{ active: this.activeTab === 'screenshare' }}
              onClick={() => this.changeTab('screenshare')}
            >
              {this.t('debugger.screenshare.label')}
              <div class="right">
                <rtk-icon icon={this.iconPack.share_screen_start} />
                {this.size === 'sm' && <rtk-icon icon={this.iconPack.chevron_right} />}
              </div>
            </button>
            <button
              type="button"
              class={{ active: this.activeTab === 'system', hidden: !showSystemsTab }}
              onClick={() => this.changeTab('system')}
            >
              {this.t('debugger.system.label')}
              <div class="right">
                <rtk-icon icon={this.iconPack.settings} />
                {this.size === 'sm' && <rtk-icon icon={this.iconPack.chevron_right} />}
              </div>
            </button>
          </nav>
        </aside>

        <main class={{ active: this.isMobileMainVisible }} part="main-content">
          {this.size === 'sm' && (
            <header>
              <rtk-button
                kind="icon"
                class="back-btn"
                onClick={() => (this.isMobileMainVisible = false)}
              >
                <rtk-icon icon={this.iconPack.chevron_left} />
              </rtk-button>
              <h4>{tab}</h4>
            </header>
          )}
          {this.activeTab === 'audio' && <rtk-debugger-audio {...defaults}></rtk-debugger-audio>}
          {this.activeTab === 'video' && <rtk-debugger-video {...defaults}></rtk-debugger-video>}
          {this.activeTab === 'screenshare' && (
            <rtk-debugger-screenshare {...defaults}></rtk-debugger-screenshare>
          )}
          {this.activeTab === 'system' && showSystemsTab && (
            <rtk-debugger-system {...defaults}></rtk-debugger-system>
          )}
        </main>
      </Host>
    );
  }
}
