# packages/core/src/utils/sync-with-store — Reactive Store System

The core reactive state system. Two files: `ui-store.ts` (store definition) and `index.ts` (`@SyncWithStore` decorator). Everything in this directory is high-centrality infrastructure — changes here affect all 136 components.

## `ui-store.ts` — Store Definition

### Store Shape (`RtkUiStore`)

```ts
interface RtkUiStore {
  meeting: Meeting | null;
  t: RtkI18n;
  iconPack: IconPack;
  states: States;
  config: UIConfig;
  overrides: Overrides;
  peerId: string | null;
  storeType: 'global' | 'peer';
  storeId: string; // 'store-global' or 'store-<providerId>'
}
```

### Two-Store Model

| Store  | Variable                                  | Scope                          | When used                                         |
| ------ | ----------------------------------------- | ------------------------------ | ------------------------------------------------- |
| Global | `uiStore` (module singleton)              | Process-wide                   | Fallback when no `rtk-ui-provider` ancestor found |
| Peer   | `createPeerStore({meeting, config, ...})` | Per `rtk-ui-provider` instance | Multi-meeting (back-to-back or simultaneous)      |

### Mutation Propagation

Built on `@stencil/store`'s `createStore`. A `use({ set })` hook is installed on every store:

```
store.state.X = newValue
  → hook fires
  → elementsMap.get('X').forEach(el => el.X = newValue)
  → Stencil @Prop + @Watch triggers re-render on each subscribed element
```

**`elementsMap`** is attached directly to the store object as a non-reactive side channel (`(store as any).elementsMap`). It is not part of `@stencil/store`'s API.

### Key Exports

| Export             | Type                            | Purpose                                                                            |
| ------------------ | ------------------------------- | ---------------------------------------------------------------------------------- |
| `uiStore`          | `RtkUiStoreExtended`            | Global singleton store                                                             |
| `uiState`          | `RtkUiStore`                    | Direct state reference of global store                                             |
| `createPeerStore`  | Function                        | Creates an independent peer-scoped store                                           |
| `getInitialStates` | `(peerId?) → States`            | Returns initial States: `{ meeting: 'idle', prefs: getUserPreferences(), peerId }` |
| `appendElement`    | `(propName, el, store?) → void` | Registers a DOM element for prop updates                                           |
| `removeElement`    | `(propName, el, store?) → void` | Unregisters a DOM element from prop updates                                        |

**`appendElement` defensively calls `removeElement` first** — handles remount-under-different-provider without a proper disconnect/reconnect cycle.

## `index.ts` — `@SyncWithStore()` Decorator

### Decorator Application

```ts
// MUST: @SyncWithStore() BEFORE @Prop() — decorators apply bottom-up
@SyncWithStore() @Prop() meeting: Meeting;   // correct
@Prop() @SyncWithStore() meeting: Meeting;   // wrong — store wiring won't attach
```

### Connect Phase (per decorated prop, on `connectedCallback`)

1. Get host element via `getElement(this)`.
2. Seed prop from global store default (if value not already set on the element).
3. Register element in global store's `elementsMap` via `appendElement`.
4. Listen on `document` for `rtkProvideStore` (peer store response).
5. Fire `rtkRequestStore` CustomEvent (`composed: true`, bubbles through Shadow DOM) — asking for a peer store.
6. Also listen for `rtkPeerStoreReady` — if a peer store becomes available later, re-fire the request.
7. If `rtkProvideStore` matches (by `requestId`): switch registration from global → peer store; seed prop value from peer store via `host.componentOnReady().then(...)`.

**Timing caveat:** Step 7 is async via `componentOnReady()`. There is a brief window after mount where the component holds global store values before switching to peer store values.

### Disconnect Phase

- Removes element from whichever store it ended up in (tracked in `_rtkStoreToCleanup-{propName}`).
- Removes all event listeners (`rtkProvideStore`, `rtkPeerStoreReady`) to prevent memory leaks.

### Three Custom DOM Events

| Event               | Fired by                          | `composed`                  | Purpose                                    |
| ------------------- | --------------------------------- | --------------------------- | ------------------------------------------ |
| `rtkRequestStore`   | `@SyncWithStore` on connect       | `true` (crosses Shadow DOM) | Child asks for nearest peer store          |
| `rtkProvideStore`   | `rtk-ui-provider` / `rtk-meeting` | broadcast on `document`     | Provider responds with its store reference |
| `rtkPeerStoreReady` | `rtk-ui-provider` / `rtk-meeting` | broadcast on `document`     | Provider signals its store is now ready    |

### Per-Prop Request IDs

Each `@SyncWithStore()` decoration generates a unique `requestId` per `propName` per element instance. A component with 6 decorated props fires **6 separate** `rtkRequestStore` events and registers 6 separate `rtkProvideStore` listeners.

## ANTI-PATTERNS

- **Never** mutate `uiStore.state.X` from inside a component — emit `rtkStateUpdate` instead and let `rtk-meeting`/`rtk-ui-provider` merge state.
- **Never** apply `@SyncWithStore()` to component-specific props (`size`, `variant`, `participant`, etc.) — only the six standard store props get this decorator.
- **Never** create a second `uiStore` module-level singleton — use `createPeerStore` for multi-instance.
- **Never** omit the `removeListener` / `removeElement` cleanup in `disconnectedCallback` — memory leaks in long-running sessions (back-to-back meetings).
- **Never** assume peer store values are immediately available after mount — the switch is async; use `@Watch` to react to the value arriving.
