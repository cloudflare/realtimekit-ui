---
name: breaking-changes
description: Use before changing a public UI Kit component prop, event, CSS custom property, UIConfig key, exported helper or type, or published package entry. Check whether existing applications would break. Stop and ask the maintainer before making a breaking change.
---

# Breaking changes

## The rule

Do not make breaking changes without the maintainer's explicit approval.

Approval must name the breaking change. Examples: "yes, make the breaking change", "I know this breaks consumers, do it".

A request for a change is not that statement. The maintainer may not have seen that the change breaks something. Your job is to see it and tell them, every time.

Adding a new `defaultLanguage` key is an approved exception. Follow "Language dictionary additions" below.

## What a breaking change is

A UI Kit consumer builds an application with `@cloudflare/realtimekit-ui`, its React or Angular wrapper, or its custom elements. They pass props to `rtk-*` components, listen to their events, customize `UIConfig` and CSS variables, and import exported helpers. `meeting.*` belongs to the separate RealtimeKit core SDK; do not treat its methods as this repo's API.

A change is breaking when the consumer upgrades the UI Kit, changes nothing in their own code, and existing supported usage no longer works:

- **Type compatibility fails.** Existing TypeScript code no longer accepts a prop, event, export, or config value.
- **Runtime compatibility fails.** An existing supported use stops working as expected, for example because a required control disappears or an event carries incompatible data.

A visible change alone is not a breaking change. A new opt-in feature changes behavior for apps that enable it without breaking apps that do not. A feature enabled by default needs a compatibility check: does it invalidate an existing supported use, or only add behavior? Reason through both cases for every public surface your change touches. Use the repo's existing checks when applicable; a passing unit test alone does not prove that an upgrade is safe.

## Breaking

| Change | Why it breaks |
| --- | --- |
| Remove or rename a component tag, `@Prop()`, `@Event()` name, CSS custom property, `UIConfig` key, or exported helper/type | Existing markup, styles, imports, or TypeScript code stop working |
| Make an optional `UIConfig` field required | Existing custom configs no longer type-check |
| Narrow a prop type, for example remove a supported `size` value | Existing JSX or component assignments no longer type-check |
| Change a prop default or the output of `createDefaultConfig()` so an existing supported control stops working | Apps using the default UI lose that behavior without changing their code |
| Change when `rtkStateUpdate` or `rtkStatesUpdate` fires, or change its detail incompatibly | Existing state listeners miss updates or cannot use the detail they receive |
| Remove a child from the default `UIConfig.root` tree | The default UI no longer shows that control |
| Change an exported helper's required arguments, return type, or behavior incompatibly | Existing calls fail to type-check or no longer produce a usable result |
| Remove a package export path, generated wrapper entry, or supported runtime | Existing imports or component registration fail |

## Language dictionary additions

You may add a new key to `defaultLanguage` without asking for separate breaking-change approval. The exported `LangDict` type comes from `typeof defaultLanguage`. A complete dictionary typed as `LangDict` may need the new key to compile after an upgrade. State that impact and list the new keys in your report.

This exception covers additions only. Removing or renaming a published language key still needs explicit approval. Renaming a key introduced in the same unreleased change does not remove a published key.

## Not breaking

| Change | Why it is safe |
| --- | --- |
| Add an optional `@Prop()` without changing existing rendering | Existing component usage stays valid and looks the same |
| Add a feature behind a prop that is off by default | Apps without the prop keep their existing behavior; apps opting in get the new behavior |
| Add an optional `UIConfig` field with the same default behavior | Existing custom configs stay valid |
| Add a new component or exported helper without changing old entries | Existing imports and component usage stay valid |
| Broaden a prop type while preserving old behavior | Existing values remain valid |
| Mark a prop or export `@deprecated` and keep it working | Existing code still runs |
| Change internal code with the same DOM, events, styles, and results | Consumers see no difference |

```ts
// Today, in rtk-meeting
@Prop() leaveOnUnmount = false;
@Prop() gridLayout: GridLayout = 'row';

// Not breaking: the new UI appears only when an app opts in.
@Prop() showMeetingLabel = false;

// Breaking: existing JSX can no longer pass the old gridLayout value.
@Prop() gridLayout: Exclude<GridLayout, 'row'> = 'column';

// Breaking: existing custom UIConfig objects may omit designTokens.
// Changing the optional field to required rejects those objects.
interface UIConfig {
  designTokens: DesignTokens;
}

// Also breaking: changing createDefaultConfig() to remove a control
// from config.root changes apps that rely on the default layout.
```

## Not sure

If you cannot decide, treat the change as breaking and inform the developer. These cases often need the developer's decision:

- A bug fix that changes event timing or removes an old UI path. Check whether existing supported usage depends on it.
- A new value in a prop or state union. Consumer code may not handle it.
- A change in default layout, styling, or event order that may disrupt existing supported usage.

## How to stay non-breaking

Add. Do not change or remove.

- A new optional prop or config key whose default keeps today's behavior.
- A new exported helper next to the old one. Keep the old one working and mark it `@deprecated`.
- A new event next to the old one, without removing the old event.
- New behavior behind a prop that is off by default.

## What to do

1. Before you edit, list every public thing your change touches. Check `@Prop()` and `@Event()` in the component source, `packages/core/src/exports.ts`, `UIConfig`, and package export paths as needed.
2. Check whether existing JSX, markup, custom configs, imports, styles, and event listeners still work. Run applicable existing checks after the code change; do not run a build or generator yourself.
3. **Not breaking, or an allowed language dictionary addition:** continue. Write the result and any type impact in your report.
4. **Other breaking changes, or not sure:** change no file. Send the message below and end your turn. Do this even when the developer asked for exactly this change.
5. Continue only when the developer picks a non-breaking way, or says in clear words that they want the breaking change.
6. When the developer approves a breaking change: build exactly what was approved. In your report, list again what breaks, and say that the commit message and the release notes must mark it as a breaking change.

```text
STOP: this is a breaking change. I have not changed any file.

What you asked for: <one line>

What breaks for UI Kit consumers:
- `<public member>`: <how it is today> -> <how it would be>.
  Consumer code that <does what> will <not type-check / do this instead>.

Who is affected: <which consumers, for example users of this component prop>

Ways to do it without breaking:
1. <way> - <what the consumer sees>
2. <way> - <what the consumer sees>

My suggestion: way <number>, because <reason>.

This repo does not allow breaking changes. I will continue when you choose a
non-breaking way, or tell me in clear words that you want the breaking change.
```

## In every report

Add this line to the report you send after the code is written:

```text
Breaking change check: <"not breaking", with the reason in one line> or <"allowed language dictionary addition", with the new keys and type impact> or <"breaking, approved by you", with what breaks>
```

Never leave the line out. "Not checked" is not an allowed answer.
