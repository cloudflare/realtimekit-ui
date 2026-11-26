---
name: realtimekit-jsdoc
description: Use when adding or changing JSDoc for rtk-* components, @Prop(), @Event(), or exported UI Kit helpers. Keep public component descriptions clear for generated Stencil types and docs; put internal implementation notes near the code they explain. Never run a docs generator yourself.
---

# UI Kit JSDoc and implementation notes

Two kinds of comments, two readers, two places.

| Comment | Reader | Place |
| --- | --- | --- |
| JSDoc block `/** */` | An app developer who uses the UI Kit | Above `@Component`, `@Prop()`, `@Event()`, or an exported helper |
| Implementation comment | The next maintainer of the UI Kit | Next to the code it explains, not in public JSDoc |

Never mix them. `NOTE(name)` in a public JSDoc block can end up in generated docs.

## How JSDoc gets published

1. Stencil generates `packages/core/src/components.d.ts` from the `rtk-*` component source.
2. The docs script `scripts/docs.sh` reads that declaration file and component source.
3. Root `npm run docs:generate` writes MDX into `docs/core/`, `docs/react/`, and `docs/angular/`.
4. `.github/workflows/update-docs.yml` runs the generator on `main` when `components.d.ts` changes and opens a docs pull request.

Descriptions in source can reach the docs and editor tooltips. Keep internal reasoning out of public JSDoc.

## Rule 1: component and export JSDoc is consumer text

Treat JSDoc on `@Component`, `@Prop()`, and `@Event()` as text an app developer can read in editor tooltips and component docs. Treat JSDoc on exported helpers as public API guidance too.

The reader may be new to this repo and may not be a native English speaker.

Write these parts when they apply:

1. **Component:** what the element shows and when an app uses it.
2. **Prop:** what the value controls, its default if useful, and whether changing it changes a visible result.
3. **Event:** the exact event name, when it fires, and what its `detail` contains.
4. **Exported helper:** what it returns and what callers need to pass. TypeScript signatures already give types; do not invent required JSDoc tags for the docs script.
5. **Deprecation:** say which working API replaces it without removing the old one.

Writing rules:

- Plain words. Short sentences. Present tense.
- Describe what the app renders or receives, not how the UI Kit implements it.
- Use the exact prop and event names from the component source.
- Keep each sentence useful for someone using the component or helper.

## Rule 2: no internal notes in public JSDoc

This applies to components in `packages/core/src/components/` and helpers exported through `packages/core/src/exports.ts`.

A public JSDoc block never contains:

- `NOTE(name)`, `TODO`, `FIXME`, "we need to", "for now", "discussed with".
- Names of people or teams.
- Notes for reviewers or for AI tools.
- The reason for an implementation choice, history of the code, known bugs, workarounds.
- Links to internal pages: wiki, GitLab, Jira, chat.
- Internal store fields, private helper names, or backend details that do not help users.

Ask: **"Would this help an app developer use this UI element?"** If not, put it near the implementation instead.

## Rule 3: explain non-obvious code near the implementation

Add a short comment near the code when its reason is not clear, for example:

- The reason for the code is not clear from the code itself.
- The order of the lines matters.
- A store update or event order prevents a race.
- A browser or device needs a workaround.
- A cleanup step pairs with a listener registered elsewhere.

Do not add a note to code that is clear without one.

Use `//` or the repo's existing `NOTE(name)` style when it helps. Do not add a name or a long comment when one clear line is enough. Keep such comments out of JSDoc on public members.

## Bad and good

```ts
// Bad: an internal note in the description of a public prop.
/** NOTE(dev): Use this while the layout code is being rewritten. */
@Prop() gridLayout: GridLayout = 'row';

// Good: describe what the app controls.
/** Arranges the meeting grid in rows or columns. */
@Prop() gridLayout: GridLayout = 'row';
```

```ts
// Bad: describes implementation instead of the event's meaning.
/** We need this to sync the store after each child event. */
@Event({ eventName: 'rtkStatesUpdate' }) statesUpdate: EventEmitter<States>;

// Good: says when the app receives the event and what it contains.
/** Emits the current UI states when the meeting state changes. */
@Event({ eventName: 'rtkStatesUpdate' }) statesUpdate: EventEmitter<States>;
```

## Keep internal members internal

Use a private field or method for implementation details. Use `@State()` for internal reactive state. `@Prop()` and `@Event()` define component API; do not use them for an internal-only value. Do not rely on JSDoc tags to hide an exposed prop.

## Scope

- Write or fix comments on the component props, events, or helpers you change. Source comments are part of the code step (see `code-first-workflow`).
- Do not rewrite unrelated comments. Report internal text in unrelated public JSDoc under "Noticed, not changed".
- Do not edit `packages/core/src/components.d.ts`, generated wrappers, or `docs/` by hand.

## Check before you report (before the developer confirms the code)

Do not run a build or docs generator yourself.

1. Read each public comment as an app developer. Read each internal comment as the next maintainer.
2. Review the added JSDoc lines for internal words. A hit in a private code comment may be fine.

   ```bash
   git diff HEAD -U0 -- packages/core/src | grep -E '^\+\s*(/\*\*|\*)' | grep -niE 'NOTE\(|TODO|FIXME|HACK|XXX|workaround|discussed|we need|we should|for now|temporary|reviewer|socket|backend|wiki|gitlab|jira|slack'
   ```

   If the change is already committed, use `git diff <base branch>...HEAD` in place of `git diff HEAD`. New untracked files are in neither output. Read them in full.

3. In the Gate report, show the public JSDoc you added or changed so the developer can check the exact words.

## After the developer generates docs

The developer runs builds and generation commands, not the agent. If the developer shares generated output, check the changed component entry in `docs/core/`, `docs/react/`, or `docs/angular/`. Check for leaked internal notes and incorrect prop or event descriptions. If no output is available, say it was not checked.
