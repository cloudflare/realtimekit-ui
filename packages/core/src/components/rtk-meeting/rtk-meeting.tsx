import { Component, h, Element, Prop, Watch, Event, EventEmitter } from '@stencil/core';
import deepMerge from 'lodash-es/merge';
import { PermissionSettings, Size, States } from '../../types/props';
import { getSize } from '../../utils/size';
import { Meeting, RoomLeftState } from '../../types/rtk-client';
import { RtkI18n, useLanguage } from '../../lib/lang';
import { defaultIconPack, IconPack } from '../../lib/icons';
import { UIConfig } from '../../types/ui-config';
import { createDefaultConfig } from '../../lib/default-ui-config';
import { Render } from '../../lib/render';
import { provideRtkDesignSystem } from '../../index';
import { generateConfig } from '../../utils/config';
import { GridLayout } from '../rtk-grid/rtk-grid';
import ResizeObserver from 'resize-observer-polyfill';
import {
  createPeerStore,
  uiStore as legacyGlobalUIStore,
  type RtkUiStoreExtended,
} from '../../utils/sync-with-store/ui-store';
import { Overrides, defaultOverrides } from '../../lib/overrides';
import { getJoinErrorInfo } from '../../utils/join-error';

export type MeetingMode = 'fixed' | 'fill';

/**
 * A single component which renders an entire meeting UI.
 *
 * It loads your preset and renders the UI based on it.
 * With this component, you don't have to handle all the states,
 * dialogs and other smaller bits of managing the application.
 */
@Component({
  tag: 'rtk-meeting',
  styleUrl: 'rtk-meeting.css',
  shadow: true,
})
export class RtkMeeting {
  private resizeObserver: ResizeObserver;

  private leaveRoomTimer: number;

  /** Since RtkMeeting by design works as a provider for component, to be in sync with other providers, added provider id */
  private providerId: string = 'provider-' + Math.floor(Math.random() * 100);

  private roomJoinedListener = () => {
    this.updateStates({ meeting: 'joined', joinError: undefined, joinErrorCode: undefined });
  };

  private waitlistedListener = () => {
    this.updateStates({ meeting: 'waiting' });
  };

  private roomLeftListener = ({ state }: { state: RoomLeftState }) => {
    // Let socketConnectionUpdate listener handle this case.
    if (state === 'disconnected' || state === 'failed') return;
    this.updateStates({ meeting: 'ended', roomLeftState: state });
  };

  private mediaPermissionUpdateListener = ({ kind, message }) => {
    if (['audio', 'video'].includes(kind)) {
      if (
        (message === 'DENIED' || message === 'SYSTEM_DENIED') &&
        (this.peerStore || legacyGlobalUIStore).state.states.activeDebugger !== true
      ) {
        const permissionModalSettings: PermissionSettings = {
          enabled: true,
          kind,
        };
        this.updateStates({ activePermissionsMessage: permissionModalSettings });
      }
    }
  };

  private socketConnectionUpdateListener = ({ state }) => {
    if (state === 'failed') {
      setTimeout(() => {
        this.meeting.leave('disconnected');
      }, this.leaveRoomTimer);
    }
  };

  @Element() host: HTMLRtkMeetingElement;

  private stateUpdateListener: (event: CustomEvent<States>) => void;
  private storeRequestListener: (event: CustomEvent) => void;
  private peerStore: RtkUiStoreExtended | null = null; // peer specific store for this meeting peer instance

  /** Whether to load config from preset */
  @Prop({ mutable: true }) loadConfigFromPreset: boolean = false;

  /** Whether to apply the design system on the document root from config */
  @Prop({ mutable: true }) applyDesignSystem: boolean = false;

  /** Fill type */
  @Prop({ reflect: true }) mode: MeetingMode = 'fixed';

  /** Whether participant should leave when this component gets unmounted */
  @Prop() leaveOnUnmount = false;

  /** Meeting object */
  @Prop()
  meeting: Meeting;

  /** Whether to show setup screen or not */
  @Prop({ mutable: true }) showSetupScreen: boolean;

  /** Language */
  @Prop()
  t: RtkI18n = useLanguage();

  /** UI Config */
  @Prop({ mutable: true }) config: UIConfig = createDefaultConfig();

  /** Size */
  @Prop({ reflect: true, mutable: true }) size: Size;

  /** Grid layout */
  @Prop() gridLayout: GridLayout = 'row';

  /** Icon pack */
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** UI Kit Overrides */
  @Prop()
  overrides: Overrides = defaultOverrides;

  /**
   * Emits `rtkStatesUpdate` so that developers can listen to onRtkStatesUpdate and update their own stores
   * Do not confuse this with `rtkStateUpdate` that other components emit
   */
  @Event({ eventName: 'rtkStatesUpdate' }) statesUpdate: EventEmitter<States>;

  private authErrorListener: (ev: CustomEvent<Error>) => void;

  connectedCallback() {
    if (typeof window !== 'undefined') {
      this.authErrorListener = (ev) => {
        if (ev.detail.message.includes('401')) {
          this.updateStates({ meeting: 'ended', roomLeftState: 'unauthorized' });
        }
      };
      window.addEventListener('rtkError', this.authErrorListener);
    }

    // Initialize default values
    this.leaveRoomTimer = 10000;
    this.loadConfigFromPreset = true;
    this.applyDesignSystem = true;

    // Setup event listeners
    this.setupStoreRequestListener();
    this.setupStateUpdateListener();

    this.meetingChanged(this.meeting);
    this.iconPackChanged(this.iconPack);
    this.tChanged(this.t);
    this.configChanged(this.config);
    this.overridesChanged(this.overrides);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.host);
    if (
      this.applyDesignSystem &&
      this.config?.designTokens != null &&
      typeof document !== 'undefined' &&
      (this.peerStore || legacyGlobalUIStore).state.states.activeDebugger !== true
    ) {
      provideRtkDesignSystem(document.documentElement, this.config.designTokens);
    }
  }

  disconnectedCallback() {
    if (this.leaveOnUnmount) {
      this.meeting?.leave();
    }
    this.resizeObserver.disconnect();
    window.removeEventListener('rtkError', this.authErrorListener);

    // Remove event listeners
    if (this.storeRequestListener) {
      this.host.removeEventListener('rtkRequestStore', this.storeRequestListener);
      this.storeRequestListener = null;
    }
    if (this.stateUpdateListener) {
      this.host.removeEventListener('rtkStateUpdate', this.stateUpdateListener);
      this.stateUpdateListener = null;
    }

    // Clear meeting listeners
    if (this.meeting) {
      this.clearListeners(this.meeting);
    }
  }

  private setupStoreRequestListener() {
    // Remove existing listener if any
    if (this.storeRequestListener) {
      this.host.removeEventListener('rtkRequestStore', this.storeRequestListener);
    }

    // Listen for store requests from child components
    this.storeRequestListener = (
      event: CustomEvent<{ element: HTMLElement; propName: string; requestId: string }>
    ) => {
      // Provide peer specific store if available, otherwise fall back to global store
      if (!this.peerStore) return;

      const storeToProvide = this.peerStore;

      const responseEvent = new CustomEvent('rtkProvideStore', {
        detail: { store: storeToProvide, requestId: event.detail.requestId },
      });
      document.dispatchEvent(responseEvent);

      // Stop the event from bubbling further to prevent other meetings from handling it
      event.stopPropagation();
    };

    this.host.addEventListener('rtkRequestStore', this.storeRequestListener);
  }

  private setupStateUpdateListener() {
    if (this.stateUpdateListener) {
      this.host.removeEventListener('rtkStateUpdate', this.stateUpdateListener);
    }

    this.stateUpdateListener = (event: CustomEvent<States>) => {
      const eventTarget = event.target as HTMLElement;
      if (!this.host.contains(eventTarget)) {
        return;
      }

      this.updateStates(event.detail);
    };

    this.host.addEventListener('rtkStateUpdate', this.stateUpdateListener);
  }

  private clearListeners(meeting: Meeting) {
    if (!meeting) return;
    meeting.self.removeListener('roomLeft', this.roomLeftListener);
    meeting.self.removeListener('roomJoined', this.roomJoinedListener);
    meeting.self.removeListener('waitlisted', this.waitlistedListener);
    meeting.self.removeListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
    meeting.meta.removeListener('socketConnectionUpdate', this.socketConnectionUpdateListener);
  }

  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (!meeting) return;

    // Create peer specific store for this meeting peer instance
    if (meeting) {
      this.peerStore = createPeerStore({
        meeting,
        config: this.config,
        iconPack: this.iconPack,
        t: this.t,
        providerId: this.providerId,
        overrides: deepMerge({ ...defaultOverrides }, this.overrides) as Overrides,
      }) as RtkUiStoreExtended;

      // Notify components that peer specific store is now available
      document.dispatchEvent(
        new CustomEvent('rtkPeerStoreReady', {
          detail: {
            peerId: meeting.self.id,
          },
        })
      );
    } else {
      this.peerStore = null;
    }

    const targetStore = this.peerStore || legacyGlobalUIStore;
    /** Honor user's explicit choice for captions, but respect preset default if no explicit choice */
    const desiredActiveCaptionsState = !oldMeeting
      ? !!meeting.self.permissions.transcriptionEnabled
      : !!targetStore.state.states.activeCaptions;

    this.updateStates({
      viewType: meeting.meta.viewType,
      activeCaptions: desiredActiveCaptionsState,
    });

    if (this.loadConfigFromPreset && meeting.self.config != null) {
      const theme = meeting.self.config;
      const { config, data } = generateConfig(theme, meeting);

      this.config = config;

      if (this.showSetupScreen == null) {
        this.showSetupScreen = data.showSetupScreen;
      }

      if (targetStore.state.states.activeBreakoutRoomsManager?.destinationMeetingId) {
        this.showSetupScreen = false;
      }
    }

    if (
      this.applyDesignSystem &&
      this.config?.designTokens != null &&
      typeof document !== 'undefined' &&
      targetStore.state.states.activeDebugger !== true
    ) {
      provideRtkDesignSystem(document.documentElement, this.config.designTokens);
    }
    meeting.self.addListener('roomJoined', this.roomJoinedListener);
    meeting.self.addListener('waitlisted', this.waitlistedListener);
    meeting.self.addListener('roomLeft', this.roomLeftListener);
    meeting.self.addListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
    meeting.meta.addListener('socketConnectionUpdate', this.socketConnectionUpdateListener);
    meeting.connectedMeetings.once('changingMeeting', this.handleChangingMeeting);

    if (meeting.self.roomJoined) {
      this.updateStates({ meeting: 'joined' });
    } else {
      if (this.showSetupScreen) {
        this.updateStates({ meeting: 'setup' });
      } else {
        meeting
          .join()
          .then(() => {
            this.updateStates({ joinError: undefined, joinErrorCode: undefined });
          })
          .catch((err) => {
            const { message, code } = getJoinErrorInfo(this.t, err);
            this.updateStates({ joinError: message, joinErrorCode: code });
          });
      }
    }

    window.removeEventListener('rtkError', this.authErrorListener);
  }

  private handleChangingMeeting = (destinationMeetingId: string) => {
    const currentStates = (this.peerStore || legacyGlobalUIStore).state.states;
    this.updateStates({
      activeBreakoutRoomsManager: {
        ...currentStates.activeBreakoutRoomsManager,
        destinationMeetingId,
      },
    });
  };

  @Watch('iconPack')
  iconPackChanged(newIconPack: IconPack) {
    if (this.peerStore) {
      this.peerStore.state.iconPack = newIconPack;
    }
  }

  @Watch('t')
  tChanged(newT: RtkI18n) {
    if (this.peerStore) {
      this.peerStore.state.t = newT;
    }
  }

  @Watch('config')
  configChanged(config: UIConfig) {
    if (this.peerStore) {
      this.peerStore.state.config = config;
    }

    if (
      config?.designTokens &&
      typeof document !== 'undefined' &&
      (this.peerStore || legacyGlobalUIStore).state.states.activeDebugger !== true
    ) {
      provideRtkDesignSystem(document.documentElement, config.designTokens);
    }
  }

  @Watch('overrides')
  overridesChanged(overrides: Overrides) {
    if (this.peerStore) {
      this.peerStore.state.overrides = deepMerge({ ...defaultOverrides }, overrides) as Overrides;
    }
  }

  private handleResize() {
    this.size = getSize(this.host.clientWidth);
  }

  private updateStates(states: Partial<States>) {
    // Use peer specific store if available, otherwise fall back to global store
    const targetStore = this.peerStore || legacyGlobalUIStore;
    const newStates = Object.assign({}, targetStore.state.states);
    targetStore.state.states = deepMerge(newStates, states);

    // Emit unscoped event for backward compatibility
    this.statesUpdate.emit(targetStore.state.states);

    // Also emit a scoped event that only this meeting's components should listen to
    const scopedEvent = new CustomEvent('rtkStatesUpdate', {
      detail: targetStore.state.states,
      bubbles: true,
      composed: true,
    });
    this.host.dispatchEvent(scopedEvent);
  }

  render() {
    const defaults = {
      meeting: this.meeting,
      size: this.size,
      states: (this.peerStore || legacyGlobalUIStore).state.states,
      config: this.config || createDefaultConfig(),
      iconPack: this.iconPack,
      t: this.t,
    };

    if ((this.peerStore || legacyGlobalUIStore).state.states.viewType === 'CHAT') {
      return <rtk-chat {...defaults} />;
    }

    const elementProps = {
      'rtk-grid': {
        layout: this.gridLayout,
      },
    };

    return <Render element="rtk-meeting" defaults={defaults} asHost elementProps={elementProps} />;
  }
}
