---
name: minimal-changes
description: Use before editing UI Kit components, shared config, exports, build files, or CI. Keep changes focused, protect existing component and config users, and ask before a change reaches unrelated screens or public APIs.
---

# Minimal changes

Make the smallest change that does what was asked. If the change is big, explain its impact and wait. Do not start it.

"UI Kit consumer" means an application developer using the web components, React or Angular wrappers, `UIConfig`, or exported helpers. They do not work on this repo.

## Rules for every edit

1. Every changed line must come from the request. If you cannot say which part of the request a line serves, remove the line.
2. Change the place the developer named. If shared code has many callers, change only the caller the request is about. If the bug is inside shared `UIConfig` or render code, do not hide it in one component. Check its other callers and explain the scope.
3. Prefer changing existing code. Add a new helper, variable, flag, or piece of state only when changing existing code cannot do the job.
4. Match the formatting of the code around your change: indentation, quotes, where things are placed in the file. Do not match its quality. See "Poor code around your change" below.
5. Leave unrelated lines as they are: formatting, import order, comments, names, trailing newlines. A comment that your change makes wrong is related. Update it.
6. Leave dependency, lockfile, and compiler config files as they are, unless the request needs them.
7. Add no options, abstractions, or wrapper methods "for later".
8. Add no guard for a case that cannot happen. For each guard you add, be ready to say when it triggers and how to reproduce it.
9. Delete only what the request asks you to delete, plus code that your own change made unused. Never remove existing files or data without the developer's explicit approval.
10. Finish what the request implies: every caller of a signature you changed, the types, the exports.

## Poor code around your change

Old code can be poor. Example: an old file has variables named `x`, `y`, `z`, and methods that do something other than what their name says.

That is never a reason to write poor code yourself. The code you add must be good code, also when it sits in the middle of poor code:

- Names you add follow `strict-naming`, even if every name around them is one letter.
- A method you add does exactly what its name says, and nothing more.
- You do not copy a wrong pattern because the file already uses it. Examples: a missing `await`, an error that is caught and ignored, logic copied a second time.
- You do not use "the rest of the file does it this way" as a reason in your report.

The limit: you make your own code good. You do not clean up the old code around it. Leave the old names and the old methods as they are, and list what you saw under "Noticed, not changed".

If good new code cannot work with the poor old code without changing the old code, do not force it. Say so, give the ways to do it, and ask.

## Problems outside the request

When you see a problem outside the request, do not fix it. List it at the end of your report under "Noticed, not changed". For each problem, say what is wrong, why it matters, the ways to fix it, and your suggestion (see "When you flag a problem" in `code-first-workflow`).

## What a big change is

A big change is a change that needs a lot of testing and reaches areas that nobody had in mind when the request was written.

The number of lines does not decide it. Example: the fix is 10 lines, but 20 different flows call that code. Every one of those flows can break and must be tested again. That is a big change.

A long change in one place that only the requested flow uses is not a big change.

## How to find out

Do this before you edit code that other code uses.

1. Search for every component and helper that uses the code you plan to change.
2. List the UI flows that run through it, for example "setup screen", "joined meeting grid", and "screen share tile".
3. Mark the flows that the request did not mention.
4. Ask: if this code behaves a little differently, which of these flows must be tested again?

It is a big change when any of these is true:

- Many flows run through the code, and most of them are not part of the request.
- The change alters behaviour in an area the request did not mention.
- Checking the change by hand needs many scenarios, devices, or setups.
- Other packages depend on what you change, for example generated React and Angular wrappers or public package exports.
- The change adds a new dependency (see "Rules for special kinds of change").

## Big change: explain the impact and wait

Change no file. Send this and end your turn.

```text
This change is bigger than it looks. I have not changed any file.

What you asked for: <one line>
Why it is big: <the code is used by N flows, or it reaches these areas>

Impact:
- Flows and areas that are affected: <list>
- What must be tested again: <list>
- Effect for app developers: <breaking or not, props, events, defaults>
- Risk: <what could go wrong>

Ways to do it:
1. <way> - what it affects, how much testing it needs
2. <a narrower or safer way, for example only for the flow you asked about> - what it affects, how much testing it needs

My suggestion: way <number>, because <reason>.

Which way do you want? If you want it done another way, tell me how.
```

Rules for this message:

- Always state the impact in plain words. The developer must see what can break before they decide.
- Always offer at least one other way when one exists, and say which one you suggest.
- Always ask whether the developer wants it done another way.
- After the answer, build exactly what was chosen. If the work grows beyond it, stop and say so.

## Breaking changes

A breaking change makes existing supported UI Kit usage stop type-checking or working as expected. A new feature can change behavior without breaking existing usage, especially when apps must opt in. Check default-on features for compatibility rather than calling every visible change breaking.

Breaking changes are not allowed unless the developer says in clear words that they want one. Load `breaking-changes` before you change a component prop, event, config, export, or package path.

## Rules for special kinds of change

| Change | Rule |
| --- | --- |
| A new optional prop, event, config key, or exported helper that keeps existing behavior | Not automatically a big change. Still discuss the fix and get approval before editing. List every new public name in your report. |
| A change to an existing prop, event, config key, exported helper, or CSS variable | Check it with `breaking-changes`. If it is breaking, stop and inform the developer. |
| A new dependency | A big change. First check whether the task can be done without it, with code or platform features that already exist. If you still think it is needed, ask. Say what you want to install, why, and what the cost is (size, upkeep, security). Do not install anything without explicit permission. |
| A dependency upgrade | Only when the developer asked for it. |
| Running a build or generator | Never run it yourself. Ask the developer to run it and share results if needed. |
| A change to a build script or build config | Only when the developer asked for it. Before you edit, check whether the change breaks anything for customers (see `breaking-changes`). If it does, stop and inform the developer before you edit. |
| A change to CI | Allowed when the task needs it. If the change removes or greatly reduces what CI tests or builds, say so and ask before you edit. |
| Removing a feature or a public component path | Never without explicit permission. If you think it should go, ask. Do not remove it. |

Use "Asking questions" in `code-first-workflow` for every question in this table: all questions in one message, each with your suggestion.

## Check before you report

Read your own change with `git diff HEAD`. If the change is already committed, use `git diff <base branch>...HEAD`. New untracked files are in neither output. Read them in full.

Remove:

- lines the request did not need,
- leftovers from an approach you dropped,
- debug code, unless the developer asked for logs.

## When the developer says the change is too much

Do not give in at once, and do not argue from pride. Check the facts first.

1. For each part of your change, ask: which case fails if this part is removed?
2. If a smaller version still fixes the root cause, make the smaller version.
3. If a part is needed, keep it and say why. Name the case that fails without it, with the file and the flow.
4. If the developer suggests another approach, check it against the code. If it does not fix the root cause, say so. Follow "When you do not agree with the developer" in `code-first-workflow`.
