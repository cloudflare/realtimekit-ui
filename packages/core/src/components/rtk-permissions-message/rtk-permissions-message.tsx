import { Component, Host, h, Prop, Watch, State, Event, EventEmitter } from '@stencil/core';
import type { DeviceConfig } from '@cloudflare/realtimekit';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Meeting } from '../../types/rtk-client';
import { States } from '../../types/props';
import { SyncWithStore } from '../../utils/sync-with-store';

const steps = {
  'Chrome.Desktop.audio': ['Chrome1.svg', 'Chrome2.svg', 'Chrome3.svg'],
  'Chrome.Desktop.video': ['Chrome1.svg', 'Chrome2.svg', 'Chrome3.svg'],
};

/**
 * A component which shows permission related troubleshooting
 * information.
 */
@Component({
  tag: 'rtk-permissions-message',
  styleUrl: 'rtk-permissions-message.css',
  shadow: true,
})
export class RtkPermissionsMessage {
  /** Meeting object */
  @SyncWithStore()
  @Prop()
  meeting: Meeting;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Icon Pack */
  @SyncWithStore()
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  @State() device: DeviceConfig;

  @State() currentStep: number = 0;

  @State() svgSteps: string[] = [];

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  connectedCallback() {
    this.meetingChanged(this.meeting);
  }

  disconnectedCallback() {
    if (this.stepsTimer) clearTimeout(this.stepsTimer);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting) {
    if (meeting != null) {
      this.device = meeting.self.device;
      const deviceType = this.device?.isMobile ? 'Mobile' : 'Desktop';
      const currentSteps =
        steps[`${this.device?.browserName}.${deviceType}.${this.mediaType}`] ?? [];

      Promise.all(currentSteps.map(this.getImage)).then((currentImages) => {
        this.svgSteps = currentImages;
      });
    }
  }

  private getLink(media: 'audio' | 'video' | 'screenshare') {
    let kind;
    switch (media) {
      case 'audio':
        kind = 'microphone';
        break;
      case 'video':
        kind = 'camera';
        break;
      default:
        kind = 'screenshare';
        break;
    }
    const GOOGLE_SEARCH_BASE = 'https://www.google.com/search?q=';
    let query = `Allow+${kind}+access`;

    if (this.device != null) {
      const { browserName, isMobile } = this.device;

      query += '+' + browserName;

      if (isMobile) {
        query += '+mobile';
      }
    }

    return GOOGLE_SEARCH_BASE + query;
  }

  private continue = () => {
    this.stateUpdate.emit({
      activePermissionsMessage: { enabled: false },
    });
  };

  private reload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private isDeniedBySystem() {
    const permissionsMessage = this.meeting?.self.mediaPermissions;
    if (permissionsMessage == null) return false;

    if (permissionsMessage[this.mediaType] === 'SYSTEM_DENIED') {
      return true;
    }

    return false;
  }

  private getTitle() {
    const isDeniedBySystem = this.isDeniedBySystem();
    if (isDeniedBySystem) {
      return this.t(`perm_sys_denied.${this.mediaType}`);
    }
    return this.t(`perm_denied.${this.mediaType}`);
  }

  private get mediaType() {
    return this.states?.activePermissionsMessage?.kind ?? 'audio';
  }

  private getMessage() {
    const { browserName, osName } = this.meeting.self.device;
    const isDeniedBySystem = this.isDeniedBySystem();
    const browser = browserName.toLowerCase() ?? 'others';
    const os = osName ?? 'others';

    /* NOTE(ravindra-cloudflare):
      If in case a unknown browser or os doesn't have a translation,
      use the translation for `others`, instead of showing ugly error string,
      such as `perm_denied.video.yandex browser.message`.
    */
    if (isDeniedBySystem) {
      const systemErrorKey = `perm_sys_denied.${this.mediaType}.${os.toLowerCase()}.message`;
      return this.t(systemErrorKey) === systemErrorKey
        ? this.t(`perm_sys_denied.${this.mediaType}.others.message`)
        : this.t(systemErrorKey);
    }

    const browserErrorKey = `perm_denied.${this.mediaType}.${browser}.message`;
    return this.t(browserErrorKey) === browserErrorKey
      ? this.t(`perm_denied.${this.mediaType}.others.message`)
      : this.t(browserErrorKey);
  }

  private getImage = async (stepURL: string) => {
    function replaceAll(target, search, replacement) {
      return target.split(search).join(replacement);
    }
    const svgReq = await fetch(
      `https://rtk-assets.realtime.cloudflare.com/ui-kit/permissions/${stepURL}`
    );
    let svg = await svgReq.text();
    svg = replaceAll(svg, 'yoursite.com', location.host);
    svg = replaceAll(
      svg,
      'Yoursite',
      document.title.length > 14 ? `${document.title.slice(0, 14)}...` : document.title
    );
    return svg;
  };

  private nextStep = () => {
    this.currentStep = (this.currentStep + 1) % this.svgSteps.length;
  };

  private openMacSystemSettings = () => {
    const l = document.createElement('a');
    switch (this.mediaType) {
      case 'audio':
        l.href = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';
        break;
      case 'screenshare':
        l.href = 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture';
        break;
      case 'video':
        l.href = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Camera';
        break;
    }
    l.click();
  };

  private stepsTimer: NodeJS.Timeout;

  render() {
    const isDeniedBySystem = this.isDeniedBySystem();
    if (this.svgSteps.length > 0) {
      if (this.stepsTimer) clearTimeout(this.stepsTimer);
      this.stepsTimer = setTimeout(this.nextStep, 2500);
    }

    const showMacDeepLink = isDeniedBySystem && this.meeting.self.device.osName == 'macOS';

    return (
      <Host>
        <h2>
          <rtk-icon class="text-icon" icon={this.iconPack.warning} />
          {this.getTitle()}
        </h2>
        {this.svgSteps.length > 0 && (
          <div class={'svg-container'}>
            {this.svgSteps.map((e, index) => (
              <p
                innerHTML={e}
                class="svg-ins"
                key={this.currentStep}
                hidden={index !== this.currentStep}
              ></p>
            ))}
          </div>
        )}
        <div>{this.getMessage()}</div>
        {!isDeniedBySystem && (
          <a
            class="need-help-link"
            href={this.getLink(this.states?.activePermissionsMessage?.kind ?? 'audio')}
            target="_blank"
            rel="noreferrer external noreferrer noopener"
          >
            <rtk-icon class="text-icon" icon={this.iconPack.attach} />
            {this.t('cta.help')}
          </a>
        )}

        <div class="actions">
          <rtk-button size="lg" kind="wide" variant="secondary" onClick={this.continue}>
            {this.t('cta.continue')}
          </rtk-button>
          {showMacDeepLink ? (
            <rtk-button size="lg" kind="wide" onClick={this.openMacSystemSettings}>
              {this.t('cta.system_settings')}
            </rtk-button>
          ) : (
            <rtk-button size="lg" kind="wide" onClick={this.reload}>
              {this.t('cta.reload')}
            </rtk-button>
          )}
        </div>

        <slot></slot>
      </Host>
    );
  }
}
