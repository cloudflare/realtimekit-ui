---
name: code-first-workflow
description: Use for UI Kit code changes before editing tests or docs. Investigate, discuss fixes, get approval, change the code, and ask the developer to confirm it works before adding tests. For docs-only tasks, edit the requested docs directly. Never run builds or generators yourself.
---

# Code first, then confirm, then tests and docs

This repo does not work test-first. If another skill or habit says "write the test first", follow this skill, not the other one.

Use this with `no-guessing`, `minimal-changes`, `breaking-changes`, `strict-naming`, `writing-tests`, and `plain-markdown`. Use `realtimekit-sdk-map` for UI Kit paths and public surfaces.

## Words used here

| Word | Meaning |
| --- | --- |
| Code | Source files. Comments and doc comments (JSDoc) on the code you wrote are part of the code. |
| Tests | Test and spec files, test mocks, fixtures, test helpers. |
| Docs | Markdown and other documentation files: `README`, `AGENTS.md`, component usage examples, skills, and release notes. |
| Fast checks | `npm run lint` (or the core workspace lint) and a type check if one is defined. |
| Slow commands | Build, docs generation, code generation; only the developer runs these. |
| The Gate | The one point where you tell the developer that the code is done, ask them to check it, and end your turn. |
| Developer | The maintainer of this repo, who gave you the task. |
| UI Kit consumer | A developer who uses `@cloudflare/realtimekit-ui` or its React/Angular wrapper in an application. |

## The order

Follow the steps in order. Do not skip the Gate.

1. **Understand.** Read the code that the request touches.
   - If the message is a question ("why is this here?", "can we do X?"), answer it. Do not edit files.
   - Investigate, explain the possible fix, and ask for approval before changing code. Collect any other open questions in the same message (see "Asking questions").
2. **Check the size and the risk.** Load `minimal-changes` and `breaking-changes`.
   - If the change is a big one, explain the impact and wait.
   - If the change breaks code that UI Kit consumers already wrote, change no file. Inform the developer and wait.
   - Otherwise continue.
3. **Write the approved code.** Only code. Load `strict-naming` for every new name. Follow `no-guessing`: use only functions, APIs, and options that you have seen in this session. If you cannot find or reach one, say so. Do not write code that only looks right.
4. **Check the code.** Run the fast checks before the Gate. This step is required.
   - Run the linter (for example `npm run lint` or `eslint`). Fix every error in the files you changed. Run it again until those files are clean.
   - Run a type check only if the repo has a separate, non-build command for it. Do not run a build or generator as a substitute.
   - You may run existing tests to see what your change breaks. Do not edit them.
   - Put each command and its real result in the Gate report. Do not reach the Gate with a lint error in your own change.
5. **The Gate.** Send the Gate report below. It does two things in one message:
   - It tells the developer that the code is done and that they must check the change.
   - It asks: if the code is fine, can you go ahead with the tests and docs?

   Then end your turn.
6. **Leave slow checks to the developer.** Never run a build, `npm run docs:generate`, or a code generator yourself, even after the Gate. Ask the developer to share results if they want help with failures.
7. **Write the tests.** Load `writing-tests`. Run them and read the real output.
8. **Update the docs.** Load `plain-markdown`. Update only the docs that the code change made wrong or incomplete. Follow the repo's `AGENTS.md` for which docs must stay in sync.
9. **Send the final report.** See "Final report".

Hard limits before the developer answers yes at the Gate:

- Do not create, edit, or delete any test or doc.
- Run no slow command. This limit also applies after the developer confirms the code.

Never run a publish command.

## Asking questions

The developer's time is short. Ask all questions together, with your suggestions, and make sure none of them is lost.

1. **Find the answer yourself first.** Do not ask what the code, the docs, or the request already answer.
2. **Ask only when the answer changes what you build.** If both answers lead to the same code, it is not a question.
3. **Collect, then ask once.** Read everything the task touches before you ask. Put all questions, small and large, in one numbered message. Do not send questions one at a time.
4. **Give your suggestion with every question.** Add the reason in one line. If the choice has an effect the developer should know, say it. If you have no suggestion, write "no suggestion".
5. **Wait.** Do not start work that depends on an open question. Silence is not a yes.
6. **Keep the open questions visible.** When the developer answers only some questions, or writes about something else, repeat every unanswered question at the end of your next message, with the same number and your suggestion. Do this in every message until each question has an answer.
7. **Continue when all are answered.** Do not ask for one more confirmation.
8. **A new question during the work.** Finish the work that does not depend on it. Ask it together with any other new question at your next stop, for example in the Gate report. Ask at once only when nothing else can continue.

```text
I need answers to these questions before I continue.

1. <question>
   My suggestion: <answer>, because <reason>.
2. <question>
   My suggestion: <answer>, because <reason>.

Reply "ok" to accept all my suggestions, or answer by number.
```

```text
Still open. I am waiting for these:
2. <question>
   My suggestion: <answer>, because <reason>.
```

## When you flag a problem

You will notice problems: a bug next to your change, a doc that is wrong, text that breaks a rule. Do not only name the problem. The developer must be able to decide in one read, without asking you what you meant.

Every problem you flag has these parts:

1. **Where.** The file, and the member, heading, or quoted text.
2. **What is wrong.** The facts: quote the text, give the numbers. "It does not follow the rule" is not enough. Say which rule and how it fails.
3. **Why it matters.** What breaks, or who is affected.
4. **Ways to fix.** One or more, each with what it costs and what it changes.
5. **Your suggestion.** Which way you would take, and why.

Do not fix the problem yourself unless it is part of the request.

```text
Problem: <one line>
Where: `path/to/file` - <member, heading, or quoted text>
What is wrong: <facts, quotes, numbers>
Why it matters: <effect>
Ways to fix:
1. <way> - <cost and effect>
2. <way> - <cost and effect>
My suggestion: way <number>, because <reason>.
```

## When you do not agree with the developer

The developer can be wrong, and so can you. Do not accept a suggestion without checking it. Do not reject it without checking it. The goal is a fix for the root cause, not agreement.

1. **Check the suggestion against the code.** Read the code. Do not agree or disagree from memory.
2. **If the suggestion fixes the root cause,** do it. Do not argue about taste.
3. **If the suggestion does not fix the root cause, or it breaks something,** do not do it silently, and do not only say "you are right". Change no file. Tell the developer:
   - what you understood from the suggestion,
   - why it may not work: the case that still fails, with the file and the flow,
   - what you suggest, and why it fixes the root cause,
   - then ask which way they want.
4. **If the request is not clear, or it does not make sense to you,** say what you understood and ask. Do not guess the meaning, and do not build something you think is wrong without saying so.
5. **After the developer decides with these facts in front of them,** follow the decision. Say your concern once. Do not repeat it. The rules on breaking changes still apply.

```text
I checked your suggestion against the code. I do not think it fixes the root cause.
I have not changed any file.

What I understood: <the suggestion in one line>
Why it may not work: <the case that still fails, with file and flow>
What I suggest: <way>, because <reason>
Other way: <if one exists>

Which way do you want?
```

## Gate report

```text
The code change is done. Please check it.
I did not touch tests or docs. I did not run a build or a docs generator.

What changed:
- `path/to/file.ts`: what changed and why, in one line

Breaking change check: <"not breaking", with the reason> or <"breaking, approved by you", with what breaks>
New public names: <list, or "none">
Public doc comments added or changed: <the full text of each, or "none">
How to try it: <steps, or the public call that shows the change>
Lint: <command and its real result>
Other checks: <command and its real result, or "none">
Not checked: <what you could not verify>
Tests and docs that I will add or update: <list, or "none found">
Noticed, not changed: <each problem in the form of "When you flag a problem", or "nothing">
Questions still open: <numbered, each with your suggestion, or "none">

Is the code fine? If yes, can I go ahead with the tests and docs?
```

## How to read the developer's answer

| The developer says | What to do |
| --- | --- |
| "yes", "looks good", "go ahead" | The code is confirmed, and tests and docs are allowed. Continue with step 6. |
| "yes, but only tests" or "yes, but no docs" | Do only what is allowed. In your final report, say what is still missing. |
| "the code is fine, no tests now" | Do not write tests. Ask once: "Can I update the docs?" In your last message, say that the change has no tests and is not complete. |
| Asks for more code changes | Go back to step 3. Send the Gate report again. |
| Writes about something else | Answer it. Repeat the Gate question at the end of your message. Do not start tests or docs. |
| Nothing about the code | Silence is not a yes. Wait. |

## When the Gate is not needed, or is partly answered

| Situation | What to do |
| --- | --- |
| The request asks only for tests ("add tests for X") | Write the tests. Ask before touching docs. |
| The request asks only for docs ("fix the md files") | Investigate, propose the changes, and get approval. Then update the docs. Do not add tests. |
| The request asks for a code change and tests together | Stop at the Gate as usual. The developer must still check the code. After they confirm it, write the tests. Ask before touching docs if the request did not mention docs. |
| The change is only debug logs that the developer will remove, or only a demo or sample page | Send the Gate report without the question about tests and docs. Say why there is nothing to test or document. |
| The developer confirmed the code and then asks a follow-up change in the same task | Change the code first. Then bring the tests and docs of this task up to date. Report the change. |
| A new task starts | Start from step 1. Answers from an earlier task do not apply to the new task. |
| No developer can answer (you are a sub-agent, or you run in CI) | If you have open questions, return them as your final output. Otherwise stop at the Gate and return the Gate report. Do not write tests or docs. |

## When tests show that the code is wrong

Writing tests can show that the code you wrote for this task is wrong, or that it misses an edge case. The developer has already approved at the Gate. Do not go back to the Gate, and do not ask for approval again. The approval stays. Finish the work, then inform.

1. Fix the code. Then write or fix the test for it.
2. Do not leave an edge case out because the code does not handle it yet. Make the code handle it, and test it.
3. Run lint again on the files you changed.
4. Continue until the tests and the docs are complete.
5. Tell the developer in the final report, under "Code changed after you confirmed it". For each change say:
   - what you changed, with the file,
   - why: which test or which case showed the problem,
   - what the developer should check again.

Do not change the code silently. The developer checked the earlier version, not this one.

Stop and ask the developer first in two cases only. Compare the fix with the change that the developer approved:

- The fix would be a breaking change (`breaking-changes`).
- The fix would turn the approved change into a big change (`minimal-changes`).

All other fixes need no new approval.

If the problem is in code that is not part of this task, do not fix it. Flag it (see "When you flag a problem").

## Final report

```text
The approved tests and docs are done.

Tests added or changed: <files and what each covers>
Docs changed: <files and what changed>
Commands run: <command> -> <real result>
Build and generation: not run by the agent; <developer result if provided, or "not checked">

Code changed after you confirmed it: <"none">, or for each change:
- `path/to/file.ts`: <what changed>
  Why: <the test or case that showed the problem>
  Please check again: <what to look at or try>

New lines not covered by tests: <list with the reason, or "none">
Not checked: <what you could not verify>
Noticed, not changed: <each problem in the form of "When you flag a problem", or "nothing">
```

## Common mistakes

| Thought | Correct action |
| --- | --- |
| "I have one small question. I will ask it now and the next one later." | Collect all questions. Ask them in one message, each with your suggestion. |
| "The developer did not answer question 2. I will pick an answer." | Repeat question 2 in your next message until it is answered. |
| "The developer suggested it, so it must be right. I will do it." | Check it against the code first. If it does not fix the root cause, say why and what you suggest. |
| "The developer did not like my change. I will remove what they dislike." | Check which case fails without each part. Keep what is needed and say why. |
| "The change is small. I will skip lint." | Lint is a fast check. Run it before every Gate. |
| "I will mention that this paragraph is not good." | Say what is wrong, why it matters, the ways to fix it, and your suggestion. |
| "A failing test first will prove the bug." | Write the fix. Tests come after the developer confirms the code. |
| "My change breaks an existing test. I will fix the test now." | Leave the test. List it in the Gate report. |
| "The doc is now wrong. It is a one-line fix." | Leave the doc. List it in the Gate report. |
| "I will run the build or the docs generator to be sure before I report." | Never run these commands yourself; the developer runs them. |
| "I will add tests and docs now so the work looks complete." | Not before the developer confirms the code. Unasked tests and docs are extra work to review or revert. |
| "The test showed a bug in my code. I will fix it and say nothing." | Fix it, and tell the developer what changed, why, and what to check again. |
| "The test showed a bug in my code. I must send the Gate report again and wait." | No. The approval stays. Fix the code and the test, finish the work, then inform the developer in the final report. |
| "The code does not handle this edge case, so I will not test it." | Make the code handle it, test it, and report the change. |

## Done means

A code change is complete when the developer confirms it, tests cover it, and the docs match it. Tests are written only after the code is confirmed. A docs-only change needs no new code tests.

Some repos have a rule such as "tests and docs must be in the same pull request". That rule is about the finished pull request. It does not change the order above.
