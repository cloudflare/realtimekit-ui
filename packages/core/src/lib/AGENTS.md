# packages/core/src/lib — Shared Library Modules

Non-component logic consumed by multiple components. All modules have an `index.ts` entry point.

## MODULES AT A GLANCE

| Module                 | Key Export(s)                                | Purpose                                                                                  |
| ---------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `audio.ts`             | `RTKAudio`                                   | Manages a single `MediaStream` + `HTMLAudioElement` for all participant audio tracks     |
| `grid.ts`              | `useGrid`, `useGridItemDimensions`           | Pure math — computes tile dimensions + CSS `{top, left}` positions for N participants    |
| `notification.ts`      | `RTKNotificationsAudio`                      | Plays join/leave/message notification sounds; respects `setSinkId` for speaker routing   |
| `visualizer.ts`        | `drawBarsVisualizer`                         | Canvas-based 3-bar audio waveform; reads bar color from computed CSS `color`             |
| `overrides.ts`         | `Overrides`, `defaultOverrides`              | UI override flags passed via store (`disableEmojiPicker`, `disablePrivateChat`)          |
| `default-ui-config.ts` | `defaultConfig`, `createDefaultConfig()`     | Canonical default `UIConfig` component tree; `createDefaultConfig()` deep-clones it      |
| `addons/`              | `registerAddons`, `Addon`                    | Plugin interface + sequential application of addons to a `UIConfig`                      |
| `builder/`             | `RtkUiBuilder`, `UIElemEditor`               | Fluent API for mutating `UIConfig`; used by addons and direct config customization       |
| `icons/`               | `defaultIconPack`, `getIconPack`, `IconPack` | ~70 inline SVG strings; `getIconPack(url)` fetches + merges over defaults                |
| `lang/`                | `useLanguage`, `defaultLanguage`, `RtkI18n`  | ~400-string English dictionary; `useLanguage(partial?)` returns a locale-aware lookup fn |
| `render/`              | `Render`, `RenderChildren`, `lenChildren`    | UIConfig-driven JSX rendering engine — bridges `config.root` to Stencil JSX              |

## KEY APIs

### `RTKAudio` (`audio.ts`)

```ts
const audio = new RTKAudio(meeting, optionalAudioEl?);
audio.addTrack(participantId, mediaStreamTrack);
audio.removeTrack(participantId);
audio.setDevice(deviceId);     // setSinkId — guarded by disableSettingSinkId()
audio.play();                  // triggers playback; handles autoplay NotAllowedError
audio.onError((err) => {});    // register error callback
```

Used only by `rtk-participants-audio` — instantiated per meeting, tracks added/removed as participants join/leave.

### `useGrid` / grid math (`grid.ts`)

```ts
const { width, height, getPosition } = useGrid({
  dimensions: { width, height }, // container px
  count: N,
  aspectRatio: '16:9',
  gap: 8,
});
const { top, left } = getPosition(index); // CSS position for tile i
```

Pure functions — no side effects, no store access. Safe to call in `render()`.

### `createDefaultConfig` / `defaultConfig` (`default-ui-config.ts`)

`defaultConfig` is a singleton constant — **never mutate directly**. Always call `createDefaultConfig()` which returns a deep clone. The `UIConfig.root` tree defines which child web components each parent renders, including state-conditional variants using CSS-selector-style keys:

- `'rtk-controlbar'` — default children
- `'rtk-controlbar.sm'` — small-size override
- `'rtk-meeting[meeting=joined].activeSidebar'` — state-conditional variant

### `RtkUiBuilder` + `UIElemEditor` (`builder/index.ts`)

```ts
const builder = new RtkUiBuilder(existingConfig?);
const editor = builder.find('rtk-controlbar', { activeBreakoutRoom: true });
editor?.add('rtk-breakout-room-toggle');
editor?.remove('rtk-plugins-toggle');
const config = builder.build();
```

`builder.find(elem, states?)` synthesizes the config key automatically (`'rtk-controlbar.activeBreakoutRoom'`).

**STUB WARNING:** `editor.style()`, `editor.setChildrenProps()`, `editor.getChildrenProps()`, `editor.replace()` are all unimplemented — they only `console.log`. Do not rely on them.

### `registerAddons` (`addons/index.ts`)

```ts
const config = registerAddons([myAddon, anotherAddon], meeting, baseConfig?);
```

Each `Addon.register(config, meeting, getBuilder)` receives the threaded config and returns an updated one. If no `baseConfig` is supplied, `generateConfig(meeting)` synthesizes one from the meeting preset.

### `useLanguage` + i18n (`lang/index.ts`)

```ts
const t = useLanguage({ 'mic-on': 'Microphone On' }); // partial override
t('mic-on'); // → 'Microphone On'
t('unknown-key'); // → 'unknown-key' (key as fallback)
```

`RtkI18n` type: `(key: keyof LangDict | (string & {})) => string`

`defaultLanguage` has ~400 keys covering every UI string. Merge any subset to localize.

### `defaultIconPack` + `getIconPack` (`icons/index.ts`)

```ts
const icons = await getIconPack('https://cdn.example.com/my-icons.json');
// Returns merged pack — missing icons fall back to defaultIconPack
```

Icon values are raw SVG strings (injected via `innerHTML` in `rtk-icon`). The `IconPack` type is structurally derived from `defaultIconPack`.

### `Render` / `RenderChildren` (`render/index.tsx`)

```tsx
// Inside a component's render():
const defaults = { meeting, config, size, states, iconPack, t };

// Render one element (asHost = render as <Host> not wrapper div)
<Render element="rtk-meeting" defaults={defaults} asHost />

// Render an array of elements
<RenderChildren elements={children} defaults={defaults} />

// Count children without rendering (for conditional logic)
const count = lenChildren('rtk-sidebar', config, states, size);
```

`Render` resolves `computeSelectors` → `getComputedChildren` + `getComputedStyles` internally. For non-`rtk-*` tags, `div#my-id` syntax sets the element's `id` attribute.

## RENDER ENGINE INTERNALS (`render/utils.ts`)

| Function                                            | What it does                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `computeSelectors({element, states, size, config})` | Builds priority-ordered selector list: `['rtk-stage', 'rtk-stage.sm', 'rtk-stage.activeSidebar', ...]` |
| `getComputedStyles({selectors, styles})`            | Merges matched `StyleProps` objects; later selectors win                                               |
| `getComputedChildren({selectors, root})`            | Layers children operations in order: set base → `remove[]` → `addBefore{}` → `add[]` → `prepend[]`     |

## ANTI-PATTERNS

- **Never** mutate `defaultConfig` directly — call `createDefaultConfig()` for a fresh mutable copy.
- **Never** use `UIElemEditor.style/setChildrenProps/getChildrenProps/replace` — stubs, not implemented.
- **Never** instantiate `RTKAudio` outside the component that owns the meeting listener — create in `@Watch('meeting')`, destroy in `disconnectedCallback`.
- **Prefer preset** over `Overrides.disablePrivateChat` for controlling private chat access.
