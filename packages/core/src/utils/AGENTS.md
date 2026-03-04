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

| File                        | Key Export(s)                                                                                                                           | Purpose                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets.ts`                 | `fetchEmojis`                                                                                                                           | Fetches emoji metadata JSON from CDN; module-level cache (only fetches once)                                                                                                 |
| `breakout-rooms.ts`         | `createDraftRoom`, `createDraftRooms`, `isDraftRoom`, `splitCollection`, `canToggleBreakout`                                            | Pure helpers for draft breakout room state; participant random assignment                                                                                                    |
| `breakout-rooms-manager.ts` | `BreakoutRoomsManager` (default export, class)                                                                                          | Stateful manager for breakout room create/edit/delete/assign; `applyChanges(meeting)` flushes diffs to API                                                                   |
| `chat.ts`                   | `generateChatGroupKey`, `getChatGroups`, `getUnreadChatCounts`, `getParticipantUserId`, `parseRichText`, `tokenizeRichText`             | Chat grouping, unread counts, rich text tokenizer (bold `*`, italic `_`, strikethrough `~`, links)                                                                           |
| `clone.ts`                  | `clone` (default export)                                                                                                                | Deep clone via `structuredClone` with `lodash-es/cloneDeep` fallback                                                                                                         |
| `color.ts`                  | `hexToRGB`, `rgbToHsl`, `hslToRgb`, `rgbToHex`, `generateShades`, `isValidHexColor`, `getBrandColors`, `getBackgroundColors`            | Full HSL/RGB/Hex pipeline; `generateShades` produces 5-level palettes from one base hex                                                                                      |
| `config.ts`                 | `generateConfig`, `extendConfig`                                                                                                        | `generateConfig` converts legacy `RTKThemePreset` → full `UIConfig`; `extendConfig(partial, base)` deep-merges (note argument order)                                         |
| `date.ts`                   | `differenceInMinutes`, `elapsedDuration`, `formatDateTime`                                                                              | Human-readable elapsed time ("5m ago", "2h ago") and datetime formatting                                                                                                     |
| `debugger-utils.ts`         | `getPacketLossVerdict`, `getJitterVerdict`, `getBitrateVerdict`, `StatsHealth`                                                          | Verdict functions (`'Good'`/`'Average'`/`'Poor'`) for network/system stats in the debugger panel                                                                             |
| `file.ts`                   | `getExtension`, `getFileSize`, `getFileName`, `downloadFile`                                                                            | File attachment helpers; `downloadFile` creates blob URL + anchor click, falls back to `window.open` on CORS error                                                           |
| `flags.ts`                  | `isBreakoutRoomsEnabled`, `usePaginatedChat`, `disableSettingSinkId`, `FlagsmithFeatureFlags`                                           | Feature flags; **`usePaginatedChat()` always returns `true`** (hardcoded); `disableSettingSinkId` guards Firefox `setSinkId` calls                                           |
| `full-screen.ts`            | `requestFullScreen`, `exitFullSreen`, `isFullScreenEnabled`, `isFullScreenSupported`                                                    | Cross-browser fullscreen wrappers; **`exitFullSreen` is a typo** (missing `c`) — callers must use this exact misspelled name                                                 |
| `graceful-storage.ts`       | `gracefulStorage` (default export)                                                                                                      | `localStorage` wrapped in a `Proxy` that swallows all errors — SSR-safe, private-mode-safe                                                                                   |
| `livestream.ts`             | `isLiveStreamViewer`, `isLiveStreamHost`, `showLivestream`, `getLivestreamViewerAllowedQualityLevels`, `PlayerState`, `PlayerEventType` | Livestream role checks; AWS IVS player state/event enums                                                                                                                     |
| `notification.ts`           | `sendNotification`                                                                                                                      | Fires `rtkNotification` DOM event on `document` (`composed: true`) — picked up by `<rtk-notifications>`                                                                      |
| `provide-design-system.ts`  | `provideRtkDesignSystem`                                                                                                                | Writes all `DesignTokens` as `--rtk-*` CSS custom properties onto a given DOM element; handles Google Font injection                                                         |
| `scroll.ts`                 | `smoothScrollToBottom`                                                                                                                  | Scrolls element to its bottom; notes Safari degraded behavior                                                                                                                |
| `sidebar.ts`                | `canViewChat`, `canViewPolls`, `canViewParticipants`, `canViewPlugins`                                                                  | Permission checks consulting `meeting.self.permissions`                                                                                                                      |
| `size.ts`                   | `getSize(width)`                                                                                                                        | Maps px width → `'sm' \| 'md' \| 'lg'` using `breakpoints.json` thresholds                                                                                                   |
| `stage.ts`                  | `canJoinStage`, `canRequestToJoinStage`                                                                                                 | Stage access permission checks (`stageEnabled`, `stageAccess`)                                                                                                               |
| `string.ts`                 | `shorten`, `hasOnlyEmojis`, `sanitizeLink`, `formatName`, `getInitials`                                                                 | String helpers; `sanitizeLink()` is incomplete — only strips `javascript:` scheme                                                                                            |
| `time.ts`                   | `formatSecondsToHHMMSS`                                                                                                                 | Formats seconds into `'M:SS'` or `'H:MM:SS'` string                                                                                                                          |
| `troubleshooter.ts`         | `permissionPrompts`, `issueList`                                                                                                        | Static lookup tables for browser-specific troubleshooting steps used in `rtk-debugger-system`                                                                                |
| `user-prefs.ts`             | `getUserPreferences`, `setPreference`, `getPreference`, `chatUnreadTimestamps`                                                          | Reads/writes `mirrorVideo`, `muteNotificationSounds` via `graceful-storage`; `chatUnreadTimestamps` is a **module-level mutable `{}`** — not persisted, reset on page reload |

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
// Note: extendConfig(overlay, base) — first arg is the overlay, second is the base
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
- **Note:** `exitFullSreen` is a typo in the exported name — callers must spell it with the missing `c` to match.
