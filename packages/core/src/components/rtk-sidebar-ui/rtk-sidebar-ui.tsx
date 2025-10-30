import { Component, Event, EventEmitter, Host, Prop, Watch, h } from '@stencil/core';
import { SyncWithStore } from '../../utils/sync-with-store';
import { RtkI18n, defaultIconPack, useLanguage } from '../../exports';

export interface RtkSidebarTab {
  id: string;
  name: string | HTMLElement;
}

export type RtkSidebarView = 'sidebar' | 'full-screen';

@Component({
  tag: 'rtk-sidebar-ui',
  styleUrl: 'rtk-sidebar-ui.css',
  shadow: true,
})
export class RtkSidebarUi {
  /** View */
  @Prop({ reflect: true }) view: RtkSidebarView = 'sidebar';

  /** Tabs */
  @Prop() tabs: RtkSidebarTab[] = [];

  /** Hide Main Header */
  @Prop() hideHeader: boolean = false;

  /** Hide Close Action */
  @Prop() hideCloseAction: boolean = false;

  /** Default tab to open */
  @Prop() currentTab: string;

  /** Icon Pack */
  @Prop() iconPack = defaultIconPack;

  /** Option to focus close button when opened */
  @Prop() focusCloseButton = true;

  /** Language */
  @SyncWithStore()
  @Prop()
  t: RtkI18n = useLanguage();

  /** Tab change event */
  @Event() tabChange: EventEmitter<string>;

  /** Tab change event */
  @Event() sidebarClose: EventEmitter<void>;

  private onClose = () => {
    this.sidebarClose.emit();
    /**
     * NOTE(ravindra-cloudflare):
     * If the sidebar was opened from a RealtimeKit component, apply a blur (remove focus/active class).
     * This helps remove the active border from RTK toggles, such as rtk-polls-toggle, rtk-chat-toggle, etc.
     */
    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.tagName?.includes('RTK-') &&
      document.activeElement.blur instanceof Function
    ) {
      document.activeElement.blur();
    }
  };

  private keydownListener: (e: KeyboardEvent) => void;
  private hostEl: HTMLElement;
  private closeButton: HTMLElement;

  componentDidLoad() {
    this.keydownListener = (e) => {
      if (e.key === 'Escape') {
        this.onClose();
      }
    };
    this.hostEl.addEventListener('keydown', this.keydownListener);
    this.handleFocusCloseButton();
  }

  @Watch('currentTab')
  handleFocusCloseButton() {
    if (this.currentTab !== 'chat' && !this.hideCloseAction) {
      this.closeButton.focus();
    }
  }

  disconnectedCallback() {
    this.hostEl.removeEventListener('keydown', this.keydownListener);
  }

  render() {
    const isFullScreen = this.view === 'full-screen';

    const activeTab = this.tabs.find((tab) => tab.id === this.currentTab);

    return (
      <Host ref={(el) => (this.hostEl = el)} class={this.view}>
        {/* Close button */}
        {!this.hideCloseAction && (
          <rtk-button
            ref={(el) => (this.closeButton = el)}
            variant="ghost"
            kind="icon"
            class="close"
            onClick={this.onClose}
            aria-label={this.t('close')}
          >
            <rtk-icon icon={this.iconPack.dismiss} />
          </rtk-button>
        )}

        {activeTab && !this.hideHeader && (
          <header class="main-header">
            <h3>{activeTab.name}</h3>
            <slot name="pinned-state" />
          </header>
        )}

        {isFullScreen && (
          <header class="mobile-tabs">
            {this.tabs.map((tab) => (
              <button
                onClick={() => {
                  this.tabChange.emit(tab.id);
                }}
                class={{
                  active: this.currentTab === tab.id,
                }}
              >
                {tab.name}
              </button>
            ))}
          </header>
        )}

        <slot name={this.currentTab} />
      </Host>
    );
  }
}
