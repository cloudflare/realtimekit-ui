import { createStore, ObservableMap } from '@stencil/store';
import { Meeting, RealtimeKitClient } from '../../types/rtk-client';
import { useLanguage, type RtkI18n } from '../../lib/lang';
import { defaultIconPack, type IconPack } from '../../lib/icons';
import { type States } from '../../types/props';
import { getUserPreferences } from '../user-prefs';
import { createDefaultConfig, UIConfig } from '../../exports';

export const getInitialStates = (peerId?: string): States => ({
  meeting: 'idle',
  prefs: getUserPreferences(),
  peerId: peerId || 'LEGACY_GLOBAL_PEER',
});

export interface RtkUiStore {
  meeting: Meeting | undefined | null;
  t: RtkI18n;
  iconPack: IconPack;
  states: States;
  config: UIConfig;
  peerId: string | null;
  storeType: 'global' | 'peer';
  storeId: string;
}

// Extended type for stores that have elementsMap attached
export type RtkUiStoreExtended = ObservableMap<RtkUiStore> & {
  elementsMap: Map<string, HTMLElement[]>;
};

const uiStore = createStore<RtkUiStore>({
  meeting: null,
  t: useLanguage(),
  iconPack: defaultIconPack,
  states: getInitialStates(),
  config: createDefaultConfig(),
  peerId: 'global',
  storeType: 'global',
  storeId: 'store-global',
}) as RtkUiStoreExtended;

const elementsMap = new Map<string, any[]>();

// Attach elementsMap to global store for consistency
(uiStore as any).elementsMap = elementsMap;

uiStore.use({
  set: (propName, newValue) => {
    const elements = elementsMap.get(propName as string);
    if (elements) {
      elementsMap.set(
        propName as string,
        elements.filter((element) => {
          const currentValue = element[propName];
          if (currentValue !== newValue) {
            element[propName] = newValue;
            return true;
          } else {
            return false;
          }
        })
      );
    }
  },
});

const uiState = uiStore.state;

export { uiStore, uiState };

// Function to create a new store instance for peer-specific stores
export function createPeerStore({
  meeting,
  config,
  providerId,
  iconPack,
  t
}: {
  meeting: RealtimeKitClient;
  config?: UIConfig;
  providerId: string;
  iconPack: IconPack;
  t: RtkI18n;
}): RtkUiStoreExtended {
  const store = createStore<RtkUiStore>({
    meeting: meeting,
    t,
    iconPack,
    states: getInitialStates(meeting.self.peerId),
    config: config || createDefaultConfig(),
    peerId: meeting.self.id,
    storeType: 'peer',
    // Use provider id's numeric portion as store id for easier debugging
    storeId: 'store-' + providerId.replace('provider-', ''),
  });

  const peerElementsMap = new Map<string, any[]>();

  // Attach elementsMap to store so appendElement/removeElement can access it
  (store as RtkUiStoreExtended).elementsMap = peerElementsMap;

  store.use({
    set: (propName, newValue) => {
      const elements = peerElementsMap.get(propName as string);
      if (elements) {
        peerElementsMap.set(
          propName as string,
          elements.filter((element) => {
            const currentValue = element[propName];
            if (currentValue !== newValue) {
              element[propName] = newValue;
              return true;
            } else {
              return false;
            }
          })
        );
      }
    },
  });

  return store as RtkUiStoreExtended;
}

function appendElement(
  propName: string,
  element: HTMLElement,
  targetStore: RtkUiStoreExtended = uiStore as RtkUiStoreExtended
) {
  const elementsMapToUse = targetStore.elementsMap;

  if (!elementsMapToUse) {
    console.error(`appendElement: No elementsMap found on store`, targetStore);
    return;
  }

  const elements = elementsMapToUse.get(propName);

  if (!elements) {
    try {
      elementsMapToUse.set(propName, [element]);
    } catch (error) {
      console.error(`appendElement: Error setting new array:`, error);
    }
  } else {
    try {
      /**
       * NOTE(ravindra-dyte):
       * If the element+propName exists already, remove it first
       * This could happen in https://github.com/dyte-io/react-samples/tree/main/samples/back-to-back-meetings,
       * where the same component is re-rendered multiple times under different providers
       *  */
      removeElement(propName, element, targetStore);
      elements.push(element);
    } catch (error) {
      console.error(`appendElement: Error adding element:`, error);
    }
  }
}

function removeElement(
  propName: string,
  element: HTMLElement,
  targetStore: RtkUiStoreExtended = uiStore as RtkUiStoreExtended
) {
  const elementsMapToUse = targetStore.elementsMap;

  if (!elementsMapToUse) {
    console.error(`removeElement: No elementsMap found on store`, targetStore);
    return;
  }

  const elements = elementsMapToUse.get(propName);
  if (elements) {
    const index = elements.indexOf(element);
    if (index > -1) {
      elements.splice(index, 1);
    }
  }
}

export { appendElement, removeElement };
