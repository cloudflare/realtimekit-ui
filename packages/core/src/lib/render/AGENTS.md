# packages/core/src/lib/render — UIConfig-Driven Rendering Engine

Three files: `index.tsx` (public API), `utils.ts` (selector + children resolution), `utils.spec.ts` (tests). This module bridges `UIConfig.root` to Stencil JSX — it is the mechanism behind all runtime component tree customization.

## PUBLIC API (`index.tsx`)

| Export           | Type                                       | Purpose                                                                          |
| ---------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| `Render`         | `FunctionalComponent<RenderProps>`         | Renders a single element from UIConfig — resolves selectors, styles, children    |
| `RenderChildren` | `FunctionalComponent<RenderChildrenProps>` | Renders an array of elements — maps each to `<Render>`                           |
| `lenChildren`    | `(element, config, states, size) → number` | Counts computed children **without rendering** — for conditional display logic   |
| `DefaultProps`   | Interface                                  | Standard prop signature (`meeting`, `config`, `size`, `states`, `iconPack`, `t`) |

### Usage in component `render()`

```tsx
const defaults = { meeting, config, size, states, iconPack, t };

// Most common: render this component as the Stencil <Host> root
<Render element="rtk-meeting" defaults={defaults} asHost />

// With extra static props on the host
<Render element="rtk-meeting" defaults={defaults} asHost elementProps={{ class: 'foo' }} />

// Render a list of elements
<RenderChildren elements={children} defaults={defaults} />

// Conditional: only render wrapper if it has children
const count = lenChildren('rtk-sidebar', config, states, size);
if (count === 0) return null;
```

## RESOLUTION PIPELINE (`utils.ts`)

### 1. `computeSelectors({element, states, size, config})`

Builds a **priority-ordered** selector list from least to most specific. Later selectors win when merging styles or children:

```
['rtk-stage']                              // base
['rtk-stage.sm']                           // size variant (if size set)
['rtk-stage.activeSidebar']               // single boolean state
['rtk-stage.activeAI.activeSidebar']      // compound: alphabetically sorted
['rtk-stage[meeting=joined]']             // key-value state
['rtk-stage[meeting=joined].activeSidebar'] // combined
```

**Boolean states in compound keys are always sorted alphabetically** — the order they appear in `states: []` in `UIRoot` does not matter; the key is sorted before lookup.

### 2. `getComputedStyles({selectors, styles})`

Iterates selectors in priority order, merging all matched `StyleProps` from `config.styles`. Uses `Object.assign` — later selectors overwrite earlier ones for the same CSS property.

### 3. `getComputedChildren({selectors, root})`

Applies children operations from each matching selector **in order**:

```
set base array     (first matching selector with Element[] or children[])
→ remove[]         (remove named elements)
→ addBefore{}      (insert before a named element)
→ add[]            (append to end)
→ prepend[]        (insert at start)
```

**Each subsequent matching selector mutates the array from the previous.** An early selector providing a base array can be completely overwritten by a later selector that also provides `children`.

### `lenChildren`

Runs the full `computeSelectors` → `getComputedChildren` pipeline on every call — it is a pure function, not a hook. Avoid calling it in hot render paths; it re-computes each time.

## RENDERING RULES

- `element` as string `'rtk-mic-toggle'` → rendered as a Stencil web component, receives all `defaults` plus computed styles and props.
- `element` as tuple `['rtk-mic-toggle', { size: 'sm' }]` → second element is extra props merged onto defaults.
- Non-`rtk-*` tags use `div#my-id` syntax → the `#my-id` part becomes the `id` attribute.
- `asHost=true` → renders as Stencil `<Host>` (used by outermost `render()` call).
- `disableRender={true}` is automatically injected for `rtk-header` and `rtk-controlbar` to prevent double-render recursion.
- `configChildren` (extra children from tuple form) are appended after `RenderChildren`.

## ANTI-PATTERNS

- **Never** mutate the array returned by `getComputedChildren` — it is a computed snapshot; mutations do not persist to `config.root`.
- **Never** rely on boolean state order in compound selector keys — they are always sorted alphabetically; the lookup key will not match if you construct it manually in a different order.
- **Never** call `lenChildren` inside a tight render loop — it re-runs the full resolution pipeline on every call.
- **Never** add a new component to `defaultConfig.root` as a static string if it needs conditional visibility — use state-keyed selectors (`'rtk-foo[meeting=joined]'`) instead.
