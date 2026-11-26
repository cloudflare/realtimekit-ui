---
name: no-guessing
description: Use for every UI Kit task. Check component props, events, UIConfig keys, exported helpers, SDK types, commands, and browser APIs before using or documenting them. Never invent an API or a behavior.
---

# No guessing

Write and say only what you have checked in this session. When you cannot check something, say that. Do not fill the gap with something that looks right.

Reason: code that looks right but is wrong costs the developer more time than an honest "I could not find it".

## What "checked" means

| Checked | Not checked |
| --- | --- |
| You opened the file in this session and read it | You remember how this library usually works |
| You ran a command and read its output | The name sounds like it should exist |
| You loaded the official docs page and read it | Another library or another version has a similar API |
| The developer told you in this conversation | A comment or doc says so, but the code is there to read and you did not read it |

When code and docs disagree, the code is correct.

## Check before you use it

| You want to use | How to check |
| --- | --- |
| A component prop, event, `UIConfig` key, or exported helper | Open its `.tsx` source, type, or helper file. Read the declaration and usage. |
| An API of a library | Read its type definitions or source in `node_modules`, for the version that is installed. Or read the official docs for that version. |
| A browser or platform API | Read the official docs or the spec. Check that the browsers this code supports have it. |
| A `meeting.*` API from the core SDK | Check the installed `@cloudflare/realtimekit` types or source. If its behavior matters and is not visible, ask where to find the SDK source. |
| A backend API or socket message | Check the contract or generated types available here. If the task depends on details not present here, ask where to find them. |
| A config key, command, command option, file path, or environment variable | Find it in source, the root or workspace `package.json`, or the tool's own help. Do not run a build or generator to check it. |
| A fact about behaviour, such as "this method emits that event" | Read the code path from start to end. |
| A number, a count, a version, a date | Count it or read it. Do not estimate. |

## Ask for other code only when the task needs it

Most UI Kit changes need only this repo. Do not ask for the SDK or backend source when the UI change does not depend on it.

Before you ask, answer this: does the code I must write change depending on what that other code does?

- **No.** The change stays inside this repo and works the same whatever the other code does. Do not ask. Do not go looking for the other code.
- **Yes.** You must call it, send it a message, or rely on what it returns, and this repo does not show you how. Then ask.

Wanting to understand the whole system is not a reason to ask. Check what the task needs, not everything around it.

## When you cannot check

1. Stop that part of the work. Continue only with parts that do not depend on it.
2. Do not write code for it. No placeholder, no likely signature, no likely payload.
3. If the task needs it (see the section above), ask the developer where you can find it. The source may be in another folder on this machine, in another repo, or behind a link that the developer can open for you. Say exactly which code or document you need, so the developer can point you to it or paste it.
4. Use this form:

```text
I could not verify this, so I did not write code for it.

What I needed: <the fact, API, or document>
Where I looked: <files, packages, pages>
What happened: <not found / only built output / the page did not load / I have no access>

Where can I find it? Any of these helps:
- the folder or repo that has the source,
- a link to the docs or the code,
- the code or the message format pasted here.
```

5. If you have more than one such point, put them in one message (see "Asking questions" in `code-first-workflow`).
6. When the developer gives you the place, read it there. Then continue.

If a tool, a link, or a permission is blocked, say exactly what was blocked and stop. Do not try to reach the same thing another way.

## Never

- Invent a function name, a signature, a payload shape, an error code, a URL, a file path, or a config key.
- Write code against an API you have not seen, and hope it exists.
- Use `as any` or a similar cast to make an assumed API compile.
- Put made-up data, numbers, or quotes into code, tests, or docs.
- Say "tests pass", "lint is clean", or "it works" without the output of the command in this session.
- Describe behaviour in docs that you did not find in the code.

## How to say it

- Say "I could not find ...", "I could not reach ...", "Not verified: ...".
- Do not use "probably", "should", "I believe", or "it seems" for a fact. Check it, or say it is not verified.
- In every report, list what you did not verify under "Not checked".
- When the developer asks "are you sure?", check again in the code. Do not repeat the earlier answer from memory.
