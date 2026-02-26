# packages/core/src/utils — Utilities + Store

~29 standalone utility files and the `sync-with-store/` subdirectory that owns the entire reactive state system.

## STORE SYSTEM (`sync-with-store/`)

### `ui-store.ts` — Store Definition

Built on `@stencil/store`'s `createStore`. Two modes:

| Store              | Variable                 | Scope                        | When used                                               |
| ------------------ | ------------------------ | ---------------------------- | ------------------------------------------------------- |
| Global (singleton) | `uiStore`                | Module-level export          | Backward-compat fallback; no `rtk-ui-provider` ancestor |
| Peer-specific      | `createPeerStore({...})` | Per `RtkUiProvider` instance | Multi-meeting (back-to-back or simultaneous) scenarios  |

**`RtkUiStore` shape:**

```ts
{
  meeting: Meeting | null;
  t: RtkI18n;
  iconPack: IconPack;
  states: States;
  config: UIConfig;
  overrides: Overrides;
  peerId: string | null;
  storeType: 'global' | 'peer';
  storeId: string;
}
```

**Mutation mechanism:** A `use({ set })` hook intercepts every property set and pushes the new value directly to all subscribed DOM elements:

```ts
uiStore.state.states = { activeSidebar: true };
// → elementsMap.get('states').forEach(el => el.states = newValue)
// → Stencil @Prop/@Watch triggers re-render automatically
```

**`appendElement(propName, el, store)` / `removeElement(propName, el, store)`** — register/unregister a DOM element for a given prop. Called by `@SyncWithStore()` decorator automatically.

### `index.ts` — `@SyncWithStore()` Decorator

Wraps `connectedCallback` / `disconnectedCallback` of any Stencil component property:

1. **Connect:** Seeds prop from global store → dispatches `rtkRequestStore` event (bubbles up Shadow DOM) → if peer store responds (`rtkProvideStore`), re-registers in peer store.
2. **Disconnect:** Removes element from store's `elementsMap`, cleans up all event listeners.

```ts
// Applied in component class:
@SyncWithStore() @Prop() meeting: Meeting;   // @SyncWithStore() MUST come first
```

**Store discovery events:**
| Event | Direction | Purpose |
|-------|-----------|---------|
| `rtkRequestStore` | child → ancestor | Ask for nearest peer store |
| `rtkProvideStore` | ancestor → child | Respond with peer store reference |
| `rtkPeerStoreReady` | ancestor → document | Signal that peer store is now available |

## UTILITY FILES

| File                       | Key Export(s)                                                                          | Purpose                                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---- | --------------------------------------------------------- |
| `config.ts`                | `generateConfig`, `extendConfig`                                                       | `generateConfig` converts legacy `RTKThemePreset` → `UIConfig`; `extendConfig` deep-merges partial config onto base            |
| `notification.ts`          | `sendNotification`                                                                     | Fires `rtkNotification` DOM event on `document` (composed: true) — picked up by `<rtk-notifications>`                          |
| `size.ts`                  | `getSize(width)`                                                                       | Maps px width → `'sm'                                                                                                          | 'md' | 'lg'`breakpoint string using`breakpoints.json` thresholds |
| `flags.ts`                 | `disableSettingSinkId`, `isBreakoutRoomsEnabled`, `usePaginatedChat`                   | Feature flags; `usePaginatedChat()` always returns `true` (hardcoded); `disableSettingSinkId` guards Firefox `setSinkId` calls |
| `sidebar.ts`               | `canViewChat`, `canViewPolls`, `canViewParticipants`, `canViewPlugins`                 | Permission checks consulting `meeting.self.permissions`                                                                        |
| `user-prefs.ts`            | `getUserPreferences`, `setPreference`, `chatUnreadTimestamps`                          | Reads/writes `mirrorVideo`, `muteNotificationSounds` to `localStorage` (via `graceful-storage`)                                |
| `chat.ts`                  | `generateChatGroupKey`, `getChatGroups`, `getUnreadChatCounts`, `getParticipantUserId` | Chat group key computation and unread count aggregation                                                                        |
| `provide-design-system.ts` | `provideRtkDesignSystem`                                                               | Registers custom elements via `defineCustomElements()` — use in non-framework contexts                                         |
| `breakout-rooms.ts`        | `BreakoutRoomsManager`                                                                 | Manages breakout room state and participant assignment                                                                         |
| `string.ts`                | `sanitizeLink`, `truncateString`, etc.                                                 | String helpers; `sanitizeLink()` is incomplete — "needs more work"                                                             |
| `date.ts`                  | `formatTime`, `formatDate`                                                             | Chat timestamp formatting                                                                                                      |
| `file.ts`                  | `getFileDetails`, `getFileIcon`                                                        | File attachment metadata helpers                                                                                               |

## KEY PATTERNS

### Sending a notification toast

```ts
import { sendNotification } from '../utils/notification';

sendNotification(
  {
    id: 'my-notification',
    message: 'Something happened',
    duration: 3000, // optional ms
    icon: 'warning', // optional icon name from iconPack
    button: { text: 'Undo', onClick: () => {} }, // optional CTA
  },
  /* playSound = */ true
);
```

### Converting legacy preset to UIConfig

```ts
import { generateConfig, extendConfig } from '../utils/config';

const config = generateConfig(legacyPreset, meeting);
const customConfig = extendConfig(
  { styles: { 'rtk-header': { display: 'none' } } },
  config
);
```

### Checking feature access

```ts
import { canViewChat, canViewPolls } from '../utils/sidebar';
import { isBreakoutRoomsEnabled } from '../utils/flags';

if (canViewChat(meeting) && isBreakoutRoomsEnabled(meeting)) { ... }
```

### Getting user preferences

```ts
import { getUserPreferences } from '../utils/user-prefs';

const { mirrorVideo, muteNotificationSounds } = getUserPreferences();
// Already loaded into States.prefs at store initialization — prefer reading from states.prefs
```

## ANTI-PATTERNS

- **Never** call `uiStore.state.X = ...` from within a component — mutate via emitting `rtkStateUpdate`; let `rtk-meeting`/`rtk-ui-provider` merge it.
- **Never** omit `@SyncWithStore()` before store props in new components — see `sync-with-store/index.ts`.
- **Never** access `localStorage` directly — use `user-prefs.ts` helpers (wrapped in `graceful-storage` for SSR/private-mode safety).
- **Never** create a second `uiStore` singleton — use `createPeerStore` for multi-instance scenarios.
- **Note:** `usePaginatedChat()` always returns `true` — the paginated chat path is the only active one; the feature flag infrastructure is a historical artifact.
