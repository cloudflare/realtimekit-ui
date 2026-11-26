---
name: plain-markdown
description: Use whenever you write or edit Markdown in this repo or a pull request description. Write short, clear sentences for readers who might not be native English speakers.
---

# Plain Markdown

## Who reads it

A developer who might not be a native English speaker and is new to this repo. AI agents read the same files. Both should understand the text on the first read.

Write the way a careful engineer explains something to a new colleague. Do not try to sound smart.

## Rules

1. **Short sentences.** One idea in one sentence. If a sentence has more than about 20 words, split it.
2. **Common words.** Choose the word a beginner knows. See the table below.
3. **Say who does what.** Write "`rtk-meeting` shows the setup screen", not "The setup screen is shown".
4. **Present tense.** Write "`createDefaultConfig()` returns a new config", not "The method will return a config".
5. **Condition first, then the action.** Write "If `showSetupScreen` is true, `rtk-meeting` shows the setup screen."
6. **One name for one thing.** Use the exact name from the code, in backticks. Do not use two words for the same thing.
7. **Explain a technical term the first time you use it,** in a few plain words. Names from the code and the product are fine. Extra jargon is not.
8. **No idioms, no jokes, no metaphors.** They do not translate.
9. **No filler.** Remove "simply", "just", "basically", "note that", "it is important to note", "in order to".
10. **Short paragraphs.** Three sentences at most. Use a list for several items. Use numbered steps for an order. Use a table for cases and options.
11. **Start with what the thing is and why it exists.** Then give the details. Do not use a concept before you introduce it.
12. **Point to the file, not to a line number.** Line numbers change with every edit.
13. **For a flow, prefer a small Mermaid diagram.** One flow per diagram. One action per box.

## Words to replace

| Do not write | Write |
| --- | --- |
| utilize, leverage | use |
| facilitate | help, allow |
| in order to | to |
| prior to, subsequent to | before, after |
| subsequently | then, later |
| via | through, with |
| e.g., i.e., etc. | for example, that is, and so on |
| initiate, commence | start |
| terminate | stop, end |
| obtain | get |
| modify | change |
| perform | do, run |
| sufficient, numerous, additional | enough, many, more |
| thereby, whereby, henceforth, aforementioned | rewrite the sentence |
| atomically | in one step |
| idempotent | safe to run twice; the second run changes nothing |
| authoritative | the version from the server, which is the correct one |
| reconcile | compare and fix the differences |
| orchestrate | run in the right order |
| propagate | pass on |
| invariant | a rule that must always be true |
| no-op | does nothing |
| seamless, robust, comprehensive, powerful | remove the word, or say what really happens |

## Bad and good

```text
Bad:
The UI Kit leverages a robust configuration mechanism to facilitate seamless
customization of the component hierarchy.

Good:
Call `createDefaultConfig()` to get a new `UIConfig`.
Change its `root` to choose which child components the UI renders.
```

```text
Bad:
The state is propagated through the event infrastructure for consumers.

Good:
Child components emit `rtkStateUpdate`.
`rtk-meeting` emits `rtkStatesUpdate` after it updates the UI state.
```

## What to write, and what not

- Describe only what the code does. Read the code first (see `no-guessing`).
- Change only the text that the code change made wrong or incomplete. Do not rewrite other sections.
- When you edit a paragraph that is hard to read, rewrite that paragraph in plain words.
- No grand summaries, no praise, no stacked adjectives.
- Keep code names, event names, and links exactly as they are.

## Check before you report

1. Read every sentence you wrote once more. Split each long one.
2. Run this. It prints added Markdown lines that contain words from the table. Rewrite each line it prints, unless the word is in a quoted bad example or a code name.

   ```bash
   git diff HEAD -U0 -- '*.md' '*.mdx' | grep -E '^\+' | grep -niE '\b(utili[sz]e[sd]?|leverag(e|es|ed|ing)|facilitat(e|es|ed|ing)|aforementioned|thereby|whereby|henceforth|in order to|simply|basically|seamless(ly)?|robust|comprehensive|atomically|authoritative|idempotent|orchestrat(e|es|ed|ing)|subsequent(ly)?|prior to|e\.g\.|i\.e\.|via|etc\.)'
   ```

   If the change is already committed, use `git diff <base branch>...HEAD` in place of `git diff HEAD`. New untracked files are in neither output. Read them in full.
