import RealtimeKitClient from '@cloudflare/realtimekit';

export const isFirefox = (meeting: RealtimeKitClient) =>
  meeting?.__internals__?.browserSpecs.isFirefox();
