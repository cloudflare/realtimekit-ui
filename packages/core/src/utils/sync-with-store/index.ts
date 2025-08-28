import { getElement, ComponentInterface } from '@stencil/core';
import {
  uiStore as legacyGlobalUIStore,
  appendElement,
  removeElement,
  type RtkUiStore,
  type RtkUiStoreExtended,
} from './ui-store';

export function SyncWithStore() {

  return function (proto: ComponentInterface, propName: keyof RtkUiStore) {
    const { connectedCallback, disconnectedCallback } = proto;

    proto.connectedCallback = function () {
      const host = getElement(this);
      const value = host[propName as string];
      host[`_rtkStoreToCleanup-${propName}`] = legacyGlobalUIStore;

      /**
       * NOTE(ravindra-dyte):
       * For backward compatibility, let's use global store.
       * If rtk-ui-provider in parent hierarchy is available, we will use peer specific store.
       * If provider is found, All states will be solely controlled by RtkUiProvider.
       */
      if (!value) {
        const storeValue = legacyGlobalUIStore.state[propName];
        host[propName as string] = storeValue;
        appendElement(propName, host, legacyGlobalUIStore as RtkUiStoreExtended);
      }

      // Listen for provider response
      const storeResponseListener = (
        event: CustomEvent<{ store: RtkUiStoreExtended; requestId: string }>
      ) => {
        const requestId = (host as any)._storeRequestId;
        if (event.detail.requestId === requestId) {
          
          // Blindly put peer specific store's value for propName in host propName
          const storeValue = event.detail.store.state[propName];
          host.componentOnReady().then(() => {
            /**
             * NOTE(ravindra-dyte):
             * https://stenciljs.com/docs/api#componentonready
             * This psudo ready callback is to ensure that the component is ready to accept props
             * Without this, changing the prop would not trigger @Watch of prop in the initial mount phase
             *  */
            host[propName as string] = storeValue;
          });
          appendElement(propName, host, event.detail.store);
          host[`_rtkStoreToCleanup-${propName}`] = event.detail.store;
          // Since peer specific store is available, remove element prop from global store
          removeElement(propName, host, legacyGlobalUIStore as RtkUiStoreExtended)
        }
      };

      // Store listener reference for cleanup
      host[`_rtkStoreResponseListener-${propName}`] = storeResponseListener;
      document.addEventListener('rtkProvideStore', storeResponseListener);

      // Generate unique request ID
      const requestId = `${host.tagName}-${Date.now()}-${Math.random()}`;
      (host as any)._storeRequestId = requestId;

      // Request store from provider

      const requestEvent = new CustomEvent('rtkRequestStore', {
        detail: { element: host, propName, requestId },
        bubbles: true,
        composed: true, // Allow event to cross shadow DOM boundaries
      });

      host.dispatchEvent(requestEvent);
      
      // Listen for peer specific store ready event to use the correct store
      const storeReadyListener = () => {
        // Re-request store (peer specific store should now be available)
        const newRequestId = `${host.tagName}-${Date.now()}-${Math.random().toString(36)}`;
        (host as any)._storeRequestId = newRequestId;
        const retryRequestEvent = new CustomEvent('rtkRequestStore', {
          detail: { element: host, propName, requestId: newRequestId },
          bubbles: true,
          composed: true,
        });
        
        host.dispatchEvent(retryRequestEvent);
      };

      // Store listener reference for cleanup
      host[`_rtkStoreReadyListener-${propName}`] = storeReadyListener;
      document.addEventListener('rtkPeerStoreReady', storeReadyListener);

      return connectedCallback?.call(this);
    };

    proto.disconnectedCallback = function () {
      const host = getElement(this);

      removeElement(propName, host, host[`_rtkStoreToCleanup-${propName}`] as RtkUiStoreExtended);

      // Clean up event listeners to prevent memory leaks
      const storeResponseListener = host[`_rtkStoreResponseListener-${propName}`];
      if (storeResponseListener) {
        document.removeEventListener('rtkProvideStore', storeResponseListener);
        delete host[`_rtkStoreResponseListener-${propName}`];
      }

      const storeReadyListener = host[`_rtkStoreReadyListener-${propName}`];
      if (storeReadyListener) {
        document.removeEventListener('rtkPeerStoreReady', storeReadyListener);
        delete host[`_rtkStoreReadyListener-${propName}`];
      }

      return disconnectedCallback?.call(this);
    };
  };
}
