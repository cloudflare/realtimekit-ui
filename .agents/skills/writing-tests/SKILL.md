---
name: writing-tests
description: Use when writing or fixing realtimekit-ui Stencil/Jest specs, e2e tests, and fixtures after the developer confirms the code works and allows tests. Check visible component behavior and exported helpers without mocking the code under test.
---

# Writing tests

Write tests only after the developer confirms the code works (see `code-first-workflow`). Do not add tests for a docs-only edit.

Goal: every new or changed line and branch runs inside a test, and the test checks what that line does.

If the repo has its own test setup skill or notes (commands, mock folders), read them first.

Use Stencil's Jest runner and `@stencil/core/testing` for component specs. Read `realtimekit-test-setup` for commands.

## 1. Test the real code

- Render the real component with `newSpecPage`, or call the real exported helper.
- Check what an app can see: shadow DOM, props, emitted event detail, or a returned `UIConfig`.
- Mock boundaries outside the UI Kit when needed: the `meeting` SDK object, browser/device APIs, timers, and network calls.
- Keep UI Kit render logic, state updates, and shared helpers real when those are the code under test.

Reason: a mocked function is a function the test never runs. Its lines stay unverified even when the coverage number looks good.

When you add tests to an existing spec, keep the mock level that spec already uses, as long as the lines you are testing still run for real. Do not rewrite existing tests to move the mock level. If the existing level stops your lines from running, say so and ask.

## 2. Reuse setup where it helps

A small fixture local to one spec is fine. Share a mock or builder when several specs need it.

1. Search nearby specs for usable setup before you create a new fixture.
2. Use an existing shared helper if it fits. Do not change unrelated tests just to move mocks.
3. Use `jest.fn()` for an SDK method the component calls. Keep the rest of the fake meeting as small as the component needs.
4. If the same setup repeats across several specs, extract it to a shared helper and check its existing users.

Inside a spec file:

| Allowed | Belongs in the shared location |
| --- | --- |
| `jest.fn()` for a meeting method called by the component | Replacing the component or helper being tested with a mock |
| `jest.spyOn()` on an edge such as a browser API | Mocking the UI Kit behavior whose result you need to check |
| A local `createMeeting()` fixture in one spec | Repeating the same large setup across many specs |
| `jest.useFakeTimers()` when timing matters | Advancing timers without asserting the visible effect |

## 3. Cover every new line, honestly

1. List the changed behaviors and branches from the diff: each visible state, prop default, event, or helper result. Include failure paths when they apply.
2. Write one test for each behaviour on that list. Include the failure paths.
3. Run the relevant specs once. Use the core `test:coverage` script when coverage is needed; do not use the watch-mode `test:spec` script for this.
4. For each uncovered new line, add a test. If no real input can reach the line, do not force it. Tell the developer the line may be dead code.

These tricks are not allowed:

- Coverage-ignore comments such as `/* istanbul ignore next */`.
- `test.skip`, `test.only`, `test.todo`, or commented-out tests left in the file.
- A test with no assertion, or one that only checks "does not throw", written to run lines.
- Checking only that a mock was called when the real effect can be checked.
- Assertions about what the mock itself does.
- Copying the production logic into the test to compute the expected value. Write the expected value by hand.
- Inputs that can never occur in the real flow.
- Reaching private state with `as any` when a public path exists.
- Making a failing test pass by weakening its assertion or deleting it.
- Changing production code only to make a test easier (test-only methods, exporting private things). Ask first.

## 4. Write clear tests

- The test name is the UI scenario in plain words: `shows the setup screen when showSetupScreen is true`.
- One behaviour per test.
- Test data has the same shape as real data. Use complete payloads.
- Follow `strict-naming` in test code as well.
- If mock setup is more than half of a test, you are mocking at the wrong level. Move the mock closer to the edge.

## 5. Prove the tests work

1. Run the tests in single-run mode, not watch mode. Read the full output.
2. Check that the assertion would catch the behavior it describes. Prefer a clear DOM, event, or config assertion over changing production code just to force a failure.
3. Run the other tests of the area you touched. Report failures you did not cause. Do not hide them.
4. Fix type and lint errors in the test files.

A test that does not check a visible result needs a stronger assertion. Rewrite it.

## 6. When something is wrong

When you must ask the developer, follow "Asking questions" in `code-first-workflow`: all questions in one message, each with your suggestion.

| Situation | What to do |
| --- | --- |
| A new test fails | Find which side is wrong, the code or the test. If the test is wrong, fix the test. |
| The code you wrote for this task is wrong, or misses a case | Fix the code, then the test. Tell the developer what you changed, why, and what to check again. Follow "When tests show that the code is wrong" in `code-first-workflow`. Never change the code only to make a test pass. |
| Code that is not part of this task looks like a bug | Do not fix it. Do not write a test that expects the suspected bug. Flag it with file and line, the ways to fix it, and your suggestion. |
| A line can be reached, but only with a side effect that breaks the test run | Do not force it. Report it. |
| One part of the task is blocked | Finish the part that is not blocked. Then stop and ask about the blocked part. |

## Report

Use the "Final report" of `code-first-workflow`. Add this line to it:

```text
Shared mocks added or changed: <list, or "none">
```
