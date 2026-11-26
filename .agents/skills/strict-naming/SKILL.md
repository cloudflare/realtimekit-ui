---
name: strict-naming
description: Use when naming a new UI Kit component prop, event, state, config key, helper, variable, type, or file. Choose clear names; avoid new single-letter names while keeping existing public API names stable.
---

# Strict naming

A reader must understand a name without reading the lines above it. Long names are fine. Unclear names are not.

## Hard rules

1. **No single-letter names.** Not `i`, `j`, `k`, `a`, `b`, `x`, `y`, `n`, `e`, `t`, `v`, `p`, `s`, or any other. This covers variables, parameters, callback arguments, loop counters, `catch` parameters, destructured names, and generic type parameters. The only exception is `_` for an argument that you must accept but do not use (see "Patterns").
2. **No shortened words.** Not `idx`, `tmp`, `val`, `obj`, `arr`, `res`, `ret`, `cb`, `el`, `evt`. Write the full word. Allowed short forms: `id`, `url`, `config`, `params`, `args`, `min`, `max`, unit endings such as `Ms` and `Px`, and short forms that are product words in the repo.
3. **No name that says nothing.** `data`, `item`, `value`, `result`, `info`, `temp`, `flag`, `list`, `handler` alone do not say what the thing is. Add what it is: `chatMessage`, `pollOption`, `joinResponse`.
4. **No clash.** A new name must not be the same as, or easy to confuse with, another variable, method, public API name, event name, config key, or feature in the repo.
5. **Existing code is not a model.** Old code may contain `i`, `e`, `cb`, `x`, `y`. Do not copy that style into new code. Poor names around your change are never a reason to add one more.
6. **Do not rename old code on your own.** These rules are for the names you add. Rename existing names only when the developer asks. When your new or edited line must use an old short name that already exists there, keep it as it is.

## How to choose a name

Do this for every new name.

1. Write one sentence: what does it hold, or what does it do?
2. Build the name from the nouns and verbs of that sentence.
3. Search the repo for the name and for its main word. If the word already means something else, pick another word. If a similar name exists in the same scope, make the difference visible in the name.
4. Read the line alone. If the meaning is not clear, the name is not finished.

If you cannot find a good name, the thing itself is probably unclear. Describe what it does in two lines and rethink the code.

## Patterns

| Kind | Rule | Example |
| --- | --- | --- |
| Loop over a collection | Name the item. Prefer `for...of`. | `for (const controlName of controlNames)` |
| Loop that needs the position | Name the position after the item. | `for (const [tileIndex, videoTile] of videoTiles.entries())` |
| Callback argument | Name the item, same as a loop. | `controlNames.filter((controlName) => controlName !== 'rtk-mic-toggle')` |
| `catch` parameter | Say what failed. | `catch (deviceError)` |
| Event listener argument | Say which event. | `(stateUpdateEvent) => ...` |
| Promise executor | Say what settles. | `new Promise((resolveDeviceList, rejectDeviceList) => ...)` |
| `reduce` | Name the running total and the item. | `(visibleCount, controlName) => visibleCount + Number(controlName !== 'rtk-mic-toggle')` |
| Key and value pairs | Name both. | `for (const [selector, styles] of Object.entries(config.styles ?? {}))` |
| Coordinates and sizes | Say which point and the unit. | `tileLeftPx`, `canvasWidthPx` |
| Boolean | Start with `is`, `has`, `should`, `can`, `was` for internal names. | `shouldShowDeviceMenu` |
| Collection | Plural, and say what is inside. | `visibleControlNames` |
| Number with a unit | Put the unit in the name. | `notificationDurationMs` |
| Function or method | Verb plus object. The name covers everything the function does. | `filterVisibleControls()` |
| Generic type parameter | A word, not a letter. | `ItemType`, not `T` |
| Value with a generic field name | Rename while destructuring if it helps. | `const { id: notificationId } = notification` |
| One argument you must accept but do not use | Use `_`. | `(_, controlIndex) => controlIndex` |
| Two or more arguments you do not use | `_` cannot be used twice. Put `_` in front of what each one is. | `(_controlName, _controlIndex, allControls) => allControls.length` |

## Bad and good

```ts
// Bad
for (let i = 0; i < controls.length; i++) {
  const c = controls[i];
  if (c !== 'rtk-mic-toggle') visible.push(c);
}
const res = controls.filter((x) => !hidden.includes(x));

// Good
for (const controlName of controlNames) {
  if (controlName !== 'rtk-mic-toggle') {
    visibleControlNames.push(controlName);
  }
}
const availableControlNames = controlNames.filter(
  (controlName) => !hiddenControlNames.includes(controlName)
);
```

## Clashes

A word that already has a meaning in the repo keeps only that meaning. Examples of the mistake:

- Calling a set of CSS selectors `states` when `states` already means UI state.
- Naming a new flag `config` when it is not a `UIConfig`.
- Using `stateUpdate` as a new public event name when the emitted DOM name must be `rtkStateUpdate`.

Fix: use the existing domain word for its existing meaning, or add detail (`activeStateSelectors`, `shouldShowSetupScreen`).

If the repo has a skill or doc that lists its domain words, read it before naming.

## Public names

A public name (`@Prop()`, DOM event, CSS custom property, `UIConfig` key, helper, or exported type) needs extra care once released.

- Choose it with extra care.
- Follow nearby public props and events. For example, keep the existing `showSetupScreen` prop name; do not rename it solely to match an internal boolean pattern.
- List every new public name in your report, so the developer can change it before release.

## When the developer asks for a rename

1. Rename in all code and comments in the same change.
2. Tests and Markdown files follow the order of `code-first-workflow`. List the test and Markdown files that still contain the old name in the Gate report. Rename them after the developer confirms the code and allows tests and docs.
3. At the end of the task, the old word is in no file.

## Check before you report

Read every added line of your change. Use `git diff HEAD`. If the change is already committed, use `git diff <base branch>...HEAD`. New untracked files are in neither output. Read them in full.

This command is for JavaScript and TypeScript. It finds the common misses. It does not find all of them. It also prints old short names on lines you edited. Those stay (rule 6).

```bash
git diff HEAD -U0 | grep -E '^\+' | grep -nE '\b(const|let|var) [A-Za-z]\b|[(,[{] ?[A-Za-z] ?[],)}]|[(,] ?[A-Za-z]\??: |\b[A-Za-z] =>|<[A-Z][ ,>]|, ?[A-Z]>'
```
