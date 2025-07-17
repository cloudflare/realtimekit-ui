import { Component, Element, Event, EventEmitter, h, Host, Prop, Watch } from '@stencil/core';
import { MeetingMode } from '../rtk-meeting/rtk-meeting';
import { Meeting, RoomLeftState } from '../../types/rtk-client';
import {
  createDefaultConfig,
  RtkI18n,
  IconPack,
  Size,
  States,
  UIConfig,
  useLanguage,
  defaultIconPack,
} from '../../exports';
import {
  uiStore as legacyGlobalUIStore,
  createPeerStore,
  type RtkUiStoreExtended,
} from '../../utils/sync-with-store/ui-store';
import deepMerge from 'lodash-es/merge';
import { PermissionSettings } from '../../types/props';
import { getSize } from '../../utils/size';

const LEAVE_ROOM_TIMER = 10000;

@Component({
  tag: 'rtk-ui-provider',
  styleUrl: 'rtk-ui-provider.css',
})
export class RtkUiProvider {
  @Element() host: HTMLRtkUiProviderElement;

  private peerStore: RtkUiStoreExtended | null = null;

  private providerId: string = 'provider-' + Math.floor(Math.random() * 100);

  private storeRequestListener: (event: CustomEvent) => void;
  private stateUpdateListener: (event: CustomEvent<States>) => void;

  /** Meeting */
  @Prop()
  meeting: Meeting | null = null;

  /** Icon pack */
  @Prop()
  iconPack: IconPack = defaultIconPack;

  /** Language utility */
  @Prop()
  t: RtkI18n = useLanguage();

  /** Config */
  @Prop() config: UIConfig = createDefaultConfig();

  /** Fill type */
  @Prop({ reflect: true }) mode: MeetingMode = 'fixed';

  /** Size */
  @Prop({ reflect: true, mutable: true }) size: Size;

  /** Whether to show setup screen or not */
  @Prop() showSetupScreen: boolean = false;

  /**
   * Emits `rtkStatesUpdate` so that developers can listen to onRtkStatesUpdate and update their own stores
   * Do not confuse this with `rtkStateUpdate` that other components emit
   */
  @Event({ eventName: 'rtkStatesUpdate' }) statesUpdate: EventEmitter<States>;

  private authErrorListener: (ev: CustomEvent<Error>) => void;

  private resizeObserver: ResizeObserver;

  connectedCallback() {
    if (typeof window !== 'undefined') {
      this.authErrorListener = (ev) => {
        if (ev.detail.message.includes('401')) {
          this.updateStates({ meeting: 'ended', roomLeftState: 'unauthorized' });
        }
      };
      window.addEventListener('rtkError', this.authErrorListener);
    }

    // Listen for store requests from child components
    this.setupStoreRequestListener();

    this.onMeetingChange(this.meeting);
    this.onIconPackChange(this.iconPack);
    this.onTChange(this.t);
    this.onConfigChange(this.config);
    this.onSizeChange(this.size);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.host);
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
    window.removeEventListener('rtkError', this.authErrorListener);

    // Remove event listeners
    if (this.storeRequestListener) {
      this.host.removeEventListener('rtkRequestStore', this.storeRequestListener);
    }
    if (this.stateUpdateListener) {
      this.host.removeEventListener('rtkStateUpdate', this.stateUpdateListener);
    }

    if (!this.meeting) return;
    this.meeting.self.removeListener('roomLeft', this.roomLeftListener);
    this.meeting.self.removeListener('roomJoined', this.roomJoinedListener);
    this.meeting.self.removeListener('waitlisted', this.waitlistedListener);
    this.meeting.self.removeListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
    this.meeting.meta.removeListener('socketConnectionUpdate', this.socketConnectionUpdateListener);
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

  private setupStateUpdateListener() {
    // Remove existing listener if any
    if (this.stateUpdateListener) {
      this.host.removeEventListener('rtkStateUpdate', this.stateUpdateListener);
    }

    // Create new listener
    this.stateUpdateListener = (event: CustomEvent<States>) => {
      this.updateStates(event.detail);
    };

    // Listen for both generic events (backward compatibility) and peer-specific events
    this.host.addEventListener('rtkStateUpdate', this.stateUpdateListener);
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
      if (!this.peerStore) return;
      // Provide the actual store object, not a wrapper

      const responseEvent = new CustomEvent('rtkProvideStore', {
        detail: { store: this.peerStore, requestId: event.detail.requestId },
      });
      document.dispatchEvent(responseEvent);

      // Stop the event from bubbling further to prevent other providers from handling it
      event.stopPropagation();
    };

    this.host.addEventListener('rtkRequestStore', this.storeRequestListener);
  }

  @Watch('meeting')
  onMeetingChange(meeting: Meeting) {
    if (meeting) {
      this.peerStore = createPeerStore({
        meeting,
        config: this.config,
        iconPack: this.iconPack,
        t: this.t,
        size: this.size,
        providerId: this.providerId,
      }) as RtkUiStoreExtended;

      // Notify components that peer specific store is now available
      document.dispatchEvent(
        new CustomEvent('rtkPeerStoreReady', {
          detail: {
            peerId: meeting.self.id,
          },
        })
      );
    }

    // Setup state update listener now that we have peerId
    this.setupStateUpdateListener();

    if (meeting) {
      const targetStore = this.peerStore || legacyGlobalUIStore;
      targetStore.state.meeting = meeting;

      this.updateStates({ viewType: meeting.meta.viewType });

      meeting.self.addListener('roomJoined', this.roomJoinedListener);
      meeting.self.addListener('waitlisted', this.waitlistedListener);
      meeting.self.addListener('roomLeft', this.roomLeftListener);
      meeting.self.addListener('mediaPermissionUpdate', this.mediaPermissionUpdateListener);
      meeting.meta.addListener('socketConnectionUpdate', this.socketConnectionUpdateListener);

      if (meeting.connectedMeetings.supportsConnectedMeetings) {
        meeting.connectedMeetings.once('changingMeeting', this.handleChangingMeeting);
      }

      if (meeting.self.roomJoined) {
        this.updateStates({ meeting: 'joined' });
      } else {
        if (this.showSetupScreen) {
          this.updateStates({ meeting: 'setup' });
        } else {
          meeting.joinRoom();
        }
      }

      window.removeEventListener('rtkError', this.authErrorListener);
    }
  }

  @Watch('iconPack')
  onIconPackChange(newIconPack: IconPack) {
    if (this.peerStore) {
      this.peerStore.state.iconPack = newIconPack;
    }
  }

  @Watch('t')
  onTChange(newT: RtkI18n) {
    if (this.peerStore) {
      this.peerStore.state.t = newT;
    }
  }

  @Watch('config')
  onConfigChange(config: UIConfig) {
    if (this.peerStore) {
      this.peerStore.state.config = config;
    }
  }

  @Watch('size')
  onSizeChange(newSize: Size) {
    if (this.peerStore) {
      this.peerStore.state.size = newSize;
    }
  }

  private handleResize = () => {
    this.size = getSize(this.host.clientWidth);
  };

  private roomJoinedListener = () => {
    this.updateStates({ meeting: 'joined' });
  };

  private waitlistedListener = () => {
    this.updateStates({ meeting: 'waiting' });
  };

  private roomLeftListener = ({ state }: { state: RoomLeftState }) => {
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
      }, LEAVE_ROOM_TIMER);
    }
  };

  private handleChangingMeeting = (destinationMeetingId: string) => {
    const currentStates = this.peerStore.state.states;
    this.updateStates({
      activeBreakoutRoomsManager: {
        ...currentStates.activeBreakoutRoomsManager,
        destinationMeetingId,
      },
    });
  };

  render() {
    // Don't render children until meeting is properly initialized
    if (!this.meeting) {
      return null;
    }

    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
