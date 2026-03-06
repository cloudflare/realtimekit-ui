import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { Size, States } from '../../types/props';
import {
  exitFullScreen,
  isFullScreenEnabled,
  isFullScreenSupported,
  requestFullScreen,
} from '../../utils/full-screen';
import { ControlBarVariant } from '../rtk-controlbar-button/rtk-controlbar-button';
import { SyncWithStore } from '../../utils/sync-with-store';

/**
 * A button which toggles full screen mode for any
 * existing `rtk-meeting` component in the DOM.
 */
@Component({
  tag: 'rtk-fullscreen-toggle',
  styleUrl: 'rtk-fullscreen-toggle.css',
  shadow: true,
})
export class RtkFullscreenToggle {
  /** States object */
  @SyncWithStore()
  @Prop()
  states: States;

  /** Target Element to fullscreen */
  @Prop() targetElement: HTMLElement;

  /** Variant */
  @Prop({ reflect: true }) variant: ControlBarVariant = 'button';

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

  /** Emits updated state data */
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  @State() fullScreenActive: boolean = false;
  @State() isFullScreenSupported: boolean = true;

  connectedCallback() {
    this.isFullScreenSupported = isFullScreenSupported();
    this.onFullScreenchange();
    window.addEventListener('webkitfullscreenchange', this.onFullScreenchange);
    window.addEventListener('fullscreenchange', this.onFullScreenchange);
  }

  disconnectedCallback() {
    window.removeEventListener('webkitfullscreenchange', this.onFullScreenchange);
    window.removeEventListener('fullscreenchange', this.onFullScreenchange);
  }

  private onFullScreenchange = () => {
    this.fullScreenActive = isFullScreenEnabled();
  };

  private toggleFullScreen = () => {
    let fullScreenElement = this.targetElement || document.querySelector('rtk-meeting');
    if (!fullScreenElement) return;

    if (!this.fullScreenActive) {
      requestFullScreen(fullScreenElement);
      this.fullScreenActive = true;
    } else {
      exitFullScreen();
      this.fullScreenActive = false;
    }
    this.stateUpdate.emit({ activeMoreMenu: false });
  };

  render() {
    if (!this.isFullScreenSupported) {
      return <Host data-hidden />;
    }

    return (
      <Host title={this.t('full_screen')}>
        <rtk-controlbar-button
          size={this.size}
          iconPack={this.iconPack}
          onClick={this.toggleFullScreen}
          icon={
            this.fullScreenActive
              ? this.iconPack.full_screen_minimize
              : this.iconPack.full_screen_maximize
          }
          label={this.fullScreenActive ? this.t('full_screen.exit') : this.t('full_screen')}
          variant={this.variant}
        />
      </Host>
    );
  }
}
