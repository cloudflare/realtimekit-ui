---
name: realtimekit-sdk-map
description: Use for work in the realtimekit-ui repo. Map the public rtk-* components, UIConfig, exports, and generated React/Angular wrappers to their source. Reason from what an application renders and sees, not from one internal file.
---

# RealtimeKit UI Kit map

## Who the customer is

An application developer installs `@cloudflare/realtimekit-ui` or a framework wrapper. They use `rtk-*` components, props, events, `UIConfig`, design tokens, and exported helpers. The UI Kit consumes the separate `@cloudflare/realtimekit` SDK through its `meeting` prop. Do not change SDK source or promise SDK behavior here.

## Public surfaces and source

| Application uses | Source of truth |
| --- | --- |
| `<rtk-meeting>` shell and `rtkStatesUpdate` | `packages/core/src/components/rtk-meeting/rtk-meeting.tsx` |
| `<rtk-ui-provider>` and its store | `packages/core/src/components/rtk-ui-provider/rtk-ui-provider.tsx`, `packages/core/src/utils/sync-with-store/` |
| Another `<rtk-*>` component, its props and events | `packages/core/src/components/rtk-<name>/rtk-<name>.tsx` |
| Default layout and styles | `packages/core/src/lib/default-ui-config.ts`, `packages/core/src/types/ui-config/` |
| UI config rendering | `packages/core/src/lib/render/`, `packages/core/src/lib/builder/` |
| Theme and CSS variables | `packages/core/src/theme/`, component CSS, `packages/core/src/utils/provide-design-system.ts` |
| Package utilities and types | `packages/core/src/exports.ts`, re-exported by `packages/core/src/index.ts` |
| React/Angular wrappers | Generated from core by `packages/core/stencil.config.ts`; never edit `stencil-generated/` by hand |

`packages/core/package.json` defines package export paths. `packages/react-library/` and `packages/angular-library/` have their own package entries. Vue is deprecated; do not add components to it. Generated `packages/core/src/components.d.ts`, `dist/`, and `loader/` are not source files.

Read the component or helper source before relying on this table. Update the table when a new public surface needs a new row, not for each new prop.

## How an app uses the UI Kit

```text
app markup or JSX -> rtk-* props -> component render and handlers
                              -> UIConfig root/styles -> lib/render/
component state events -> rtk-meeting or rtk-ui-provider -> UI store
store props -> @SyncWithStore() -> child components
meeting prop -> component handlers -> separate core SDK
```

Add a component prop or event in its `.tsx` source. Add a shared helper under `packages/core/src/lib/` or `utils/` and export it through `packages/core/src/exports.ts` only when consumers need it. Update default layouts in `default-ui-config.ts` only when the requested change applies to every consumer of those defaults.

## Think like the UI Kit

Do these steps before you plan or edit.

If the task changes nothing a consumer can see (tests, CI, internal rename), say "No UI Kit consumer behavior changes" and skip the remaining steps.

1. **Say it in consumer terms.** For example: "An app renders `<rtk-meeting>` with `config` and expects this control to appear." If the request names an inner file, find the component or export that uses it.
2. **Trace from the public surface inward.** Start with the component prop, event, CSS variable, or export and follow the code path to the change.
3. **Check what else the customer sees.** Go through this list:
   - Other components using the same helper, `UIConfig` selector, store value, or design token.
   - Events: do `rtkStateUpdate` and `rtkStatesUpdate` still fire with the expected detail?
   - Default config and custom configs; small and large sizes; prejoin and joined screens.
   - Applications using the HTML custom elements, React wrapper, or Angular wrapper.
   - Whether meeting-dependent UI handles a missing or changed `meeting` prop as before.

   If this list shows many flows or areas that the request did not mention, the change is a big change under `minimal-changes`. Explain the impact and wait.
4. **Report in app terms.** Describe the prop, markup, config, visual result, or event to check.

## Keep internal things out of the public API

`@Prop()`, `@Event()`, `UIConfig`, `exports.ts`, CSS variables, and package export paths can all affect applications.

- Do not add `@Prop()` or `@Event()` to a component for an internal-only value. Use `@State()` or a private field for internal state.
- Use `rtkStateUpdate` for child state events; `rtk-meeting` and `rtk-ui-provider` emit `rtkStatesUpdate`.
- Before removing or changing a public surface, check `breaking-changes` and get explicit approval if it breaks existing apps.
- JSDoc on component props and events reaches consumers through generated Stencil types and docs. Follow `realtimekit-jsdoc`.
- Do not edit generated React or Angular proxies, generated declarations, or publish output to change an API.

## Words that already have a meaning

Use these words only with their existing meaning. Choose another word for anything else (see `strict-naming`).

| Word | Existing meaning |
| --- | --- |
| `meeting` | The core SDK object supplied as a component prop. Not the UI Kit itself. |
| `config` / `UIConfig` | The UI tree, styles, and design tokens used by the rendering engine. |
| `defaultConfig` | The shared default object. Do not mutate it directly. |
| `createDefaultConfig()` | Exported helper that clones `defaultConfig` for a new config. |
| `states` | UI state passed to components or held in the UI store. |
| `rtkStateUpdate` | State update event from child components. |
| `rtkStatesUpdate` | Aggregated state update event from the shell or provider. |
| `size` | Component size prop; its reflected attribute drives `size-*` styles. |

## More detail

- Folder rules: root `AGENTS.md` and the `AGENTS.md` files under `packages/core/`.
- Component tree: `packages/core/src/lib/default-ui-config.ts`.
- Package entries and commands: root and workspace `package.json` files.
