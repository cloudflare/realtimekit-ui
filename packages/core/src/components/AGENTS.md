# packages/core/src/components — 136 Stencil Web Components

One directory per component, named `rtk-<name>/`. Each contains `rtk-<name>.tsx` (class + JSX), `rtk-<name>.css` (scoped Shadow DOM styles), optional `*.spec.tsx` tests, and a `usage/` subdirectory with framework example markdown.

## COMPONENT CATEGORIES

| Category                  | Components                                                                                                                                                                  | Sub-namespace                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Meeting shell             | `rtk-meeting`, `rtk-ui-provider`, `rtk-dialog-manager`                                                                                                                      | —                                  |
| Video grid / layout       | `rtk-grid`, `rtk-simple-grid`, `rtk-mixed-grid`, `rtk-spotlight-grid`, `rtk-audio-grid`, `rtk-grid-pagination`                                                              | —                                  |
| Participant tile          | `rtk-participant-tile`, `rtk-participant`, `rtk-screenshare-view`, `rtk-audio-tile`, `rtk-audio-visualizer`                                                                 | —                                  |
| Chat                      | 17 components                                                                                                                                                               | `rtk-chat-*`                       |
| AI / transcription        | `rtk-ai`, `rtk-ai-toggle`, `rtk-ai-transcriptions`                                                                                                                          | `rtk-ai-*`                         |
| Participants panel        | 8 components                                                                                                                                                                | `rtk-participants-*`               |
| Control bar & toggles     | ~20 components                                                                                                                                                              | `rtk-*-toggle`                     |
| Breakout rooms            | `rtk-breakout-rooms-manager`, `rtk-breakout-room-manager`, `rtk-breakout-room-participants`, `rtk-breakout-room-toggle`                                                     | `rtk-breakout-*`                   |
| Settings / device pickers | `rtk-settings`, `rtk-settings-audio`, `rtk-settings-video`, `rtk-camera-selector`, `rtk-microphone-selector`, `rtk-speaker-selector`                                        | `rtk-settings-*`, `rtk-*-selector` |
| Polls                     | `rtk-polls`, `rtk-polls-toggle`, `rtk-poll`, `rtk-poll-form`                                                                                                                | `rtk-poll*`                        |
| Debugger                  | 6 components                                                                                                                                                                | `rtk-debugger-*`                   |
| Meeting state screens     | `rtk-setup-screen`, `rtk-idle-screen`, `rtk-ended-screen`, `rtk-waiting-screen`, `rtk-permissions-message`, `rtk-participant-setup`                                         | —                                  |
| Notifications / status    | `rtk-notifications`, `rtk-notification`, `rtk-network-indicator`, `rtk-recording-indicator`, `rtk-livestream-indicator`, `rtk-spotlight-indicator`                          | —                                  |
| UI primitives             | `rtk-button`, `rtk-icon`, `rtk-avatar`, `rtk-spinner`, `rtk-tooltip`, `rtk-dialog`, `rtk-menu`/`rtk-menu-item`/`rtk-menu-list`, `rtk-switch`, `rtk-tab-bar`, `rtk-name-tag` | —                                  |
| Livestream / media        | `rtk-livestream-player`, `rtk-livestream-toggle`, `rtk-viewer-count`, `rtk-image-viewer`                                                                                    | —                                  |

**Naming patterns:**

- `rtk-*-toggle` — every panel/feature has a dedicated toggle button.
- `rtk-*-view` suffix — presentational-only variant (no logic, just rendering): e.g., `rtk-text-message-view` vs. `rtk-text-message`.
- `rtk-*-ui` suffix — "dumb" UI layer that pairs with a smart container: e.g., `rtk-chat-selector-ui` + `rtk-chat-selector`.

## STANDARD COMPONENT ANATOMY

```ts
@Component({
  tag: 'rtk-foo',
  styleUrl: 'rtk-foo.css',
  shadow: true,             // always; some use { delegatesFocus: true }
})
export class RtkFoo {
  // 1. Private arrow-function handlers (never .bind())
  private onTrack = (track: MediaStreamTrack) => { ... };

  // 2. @Element() — host reference
  @Element() host: HTMLRtkFooElement;

  // 3. Standard store props — @SyncWithStore() BEFORE @Prop()
  @SyncWithStore() @Prop() meeting: Meeting;
  @SyncWithStore() @Prop() config: UIConfig = createDefaultConfig();
  @SyncWithStore() @Prop() iconPack: IconPack = defaultIconPack;
  @SyncWithStore() @Prop() t: RtkI18n = useLanguage();
  @SyncWithStore() @Prop() states: States;
  @SyncWithStore() @Prop() overrides: Overrides = defaultOverrides;

  // 4. Component-specific props (no @SyncWithStore)
  @Prop({ reflect: true }) size: Size;      // reflected → :host([size='sm'])
  @Prop({ mutable: true }) open: boolean;   // mutable → component can change it

  // 5. @State — internal reactive state
  @State() canSend: boolean = false;

  // 6. @Event — always named rtkStateUpdate for children (never rtkStatesUpdate)
  @Event({ eventName: 'rtkStateUpdate' }) stateUpdate: EventEmitter<States>;

  // 7. Lifecycle
  connectedCallback() { this.meetingChanged(this.meeting); }
  disconnectedCallback() { this.cleanupMeeting(this.meeting); }

  // 8. @Watch — call handler manually from connectedCallback too
  @Watch('meeting')
  meetingChanged(meeting: Meeting, oldMeeting?: Meeting) {
    if (oldMeeting) this.cleanupMeeting(oldMeeting);
    if (!meeting) return;
    meeting.self.on('trackUpdate', this.onTrack);     // addListener
  }
  private cleanupMeeting(meeting: Meeting) {
    meeting?.self.off('trackUpdate', this.onTrack);   // removeListener — always required
  }

  // 9. @Listen — for DOM custom events
  @Listen('rtkStateUpdate', { target: 'window' })
  onChildState(e: CustomEvent<States>) { ... }

  // 10. render() — use <Render> for UIConfig-driven components
  render() {
    const defaults = { meeting, config, size, states, iconPack, t };
    return <Render element="rtk-foo" defaults={defaults} asHost />;
  }
}
```

## SHADOW DOM VARIANTS

Three variants exist in this codebase:

| Variant                            | Usage                                                           | Components                                    |
| ---------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| `shadow: true`                     | Default — vast majority                                         | All feature components                        |
| `shadow: { delegatesFocus: true }` | Interactive elements needing focus delegation for keyboard a11y | `rtk-button`, `rtk-controlbar-button`         |
| `shadow: false`                    | Styles must propagate to children                               | `rtk-virtualized-participant-list` (only one) |

## UIConfig-DRIVEN RENDERING

Smart container components (`rtk-meeting`, `rtk-header`, etc.) delegate layout to `<Render>` from `lib/render/index.tsx`:

```tsx
<Render
  element="rtk-meeting"
  defaults={defaults}
  asHost
  elementProps={hostProps}
/>
```

`Render` looks up `element` in `config.root`, evaluates `computeSelectors` for active `states` + `size`, resolves children via `getComputedChildren`, and renders them. This is how `UIConfig` customizations (add/remove child components, state-conditional layouts) take effect without component code changes.

`lenChildren(element, config, states, size)` — use to conditionally omit a container when it has no children.

## STORE INTEGRATION

`@SyncWithStore()` wires props to the reactive store. On `connectedCallback` it:

1. Seeds the prop from the global store.
2. Dispatches `rtkRequestStore` event (bubbles through Shadow DOM) to find an ancestor `rtk-ui-provider`.
3. If a peer-specific store is provided (`rtkProvideStore` event), re-registers in that store.
4. On disconnect: removes from store's `elementsMap`, cleans up listeners.

**Never apply `@SyncWithStore()` to component-specific props** (e.g., `size`, `variant`). Only the standard six store props get this decorator.

## KNOWN DEVIATIONS IN EXISTING COMPONENTS

Some older components pre-date current conventions. Do not replicate these patterns in new code:

| Component                    | Deviation                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `rtk-participant-tile`       | Uses `constructor()` + `.bind()` (anti-pattern); emits non-`rtk`-prefixed events (`tileLoad`, `tileUnload`)                       |
| `rtk-chat-composer-view`     | Uses `constructor()` + `.bind()`; emits lowercase events without `rtk` prefix (`newMessage`, `editMessage`)                       |
| `rtk-paginated-list`         | Uses `.bind()` in constructor                                                                                                     |
| `rtk-tooltip`                | **Class is named `RtkMenu`** (naming bug — class name does not match tag); uses `componentDidLoad` instead of `connectedCallback` |
| `rtk-grid`                   | `overrides` prop typed as `any`, marked `@deprecated`, no `@SyncWithStore`                                                        |
| `rtk-breakout-rooms-manager` | Uses `.on()`/`.off()` instead of `addListener`/`removeListener`; no `@Watch('meeting')` guard                                     |

## KNOWN INCOMPLETE COMPONENTS

| Component                        | Issue                                                                     |
| -------------------------------- | ------------------------------------------------------------------------- |
| `rtk-broadcast-message-modal`    | `sendMessage()` is a stub — no real API call, just 2s fake success        |
| `rtk-breakout-room-manager`      | Active state is a workaround pending socket support                       |
| `rtk-chat-messages-ui-paginated` | Private message filtering is a client-side hack (backend bug)             |
| `rtk-chat-selector`              | `pageSize = 100000` — needs pagination API; initial dedup is a temp hack  |
| `rtk-pinned-message-selector`    | `reset()` called as hack because socket doesn't update `updatedAt` on pin |

## ADDING A NEW COMPONENT

1. `mkdir packages/core/src/components/rtk-<name>`
2. Create `rtk-<name>.tsx` with `@Component({ tag: 'rtk-<name>', styleUrl: 'rtk-<name>.css', shadow: true })`.
3. Create `rtk-<name>.css` (can be empty; Tailwind processes it).
4. Apply `@SyncWithStore() @Prop()` for any of the six standard store props needed.
5. Run `npm run build` — Stencil will auto-update `src/components.d.ts`, React wrapper, and Angular wrapper.
6. **Do NOT** add to `packages/vue-library/lib/components.ts` — the Vue library is deprecated and unsupported.
