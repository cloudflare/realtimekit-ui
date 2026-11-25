---
name: realtimekit-test-setup
description: Use with writing-tests for realtimekit-ui tests. Covers Stencil/Jest component specs, core e2e tests, script tests, workspace lint commands, and local test setup.
---

# UI Kit test setup

Read `writing-tests` for the rules. This skill gives the places and commands for this repo.

## Basics

- Core component and utility specs live next to source as `*.spec.tsx` or `*.spec.ts`. Example: `packages/core/src/components/rtk-meeting/rtk-meeting.spec.tsx`.
- Core e2e tests live in `packages/core/e2e/`. Script tests live in `scripts/*.test.js`.
- Stencil uses Jest. Import `newSpecPage` or `newE2EPage` from `@stencil/core/testing`; use `describe`, `it` or `test`, `expect`, and `jest.fn()` as in nearby specs.
- For component specs, render the real Stencil component with `newSpecPage({ components: [...], template: ... })`. Check props, shadow DOM, emitted events, and cleanup as needed.

## Commands

Commands are from the repo root unless noted. Check the root and workspace `package.json` before using a command.

| Goal | Command |
| --- | --- |
| Goal | Command |
| --- | --- |
| Lint core TypeScript | `npm run lint -w @cloudflare/realtimekit-ui` |
| Lint all workspaces with lint scripts | `npm run lint` |
| Run one core spec once | `npm exec -w @cloudflare/realtimekit-ui -- stencil test --spec --runInBand --testPathPattern=rtk-meeting.spec.tsx` (replace the filename) |
| Run core specs and e2e tests | `npm test -w @cloudflare/realtimekit-ui` |
| Run all workspace tests and script tests | `npm test` |
| Run core spec coverage (single run) | `npm run test:coverage -w @cloudflare/realtimekit-ui` |
| Run script tests only | `npm run test:scripts` |

- `npm run test:spec -w @cloudflare/realtimekit-ui` uses `--watchAll`. Do not use it for a single-run check.
- The core `test` script runs `stencil test --spec --e2e`; e2e tests may need a browser environment. Report environment failures instead of claiming tests pass.
- `packages/react-library` has a lint placeholder, not a real linter. `packages/angular-library` uses `node test.js`, which skips when it finds no Angular specs.
- There is no standalone root or core type-check script. Do not run `npm run build`, `npm run generate`, or `npm run docs:generate`; the developer runs builds and generators.
- Do not install packages just to make a test run without permission (see `minimal-changes`).

## Where shared mocks live

| You need | Use | How |
| --- | --- | --- |
| A Stencil component page | `newSpecPage` from `@stencil/core/testing` | Pass the real component class and render it with a template or HTML. |
| A browser-level component page | `newE2EPage` from `@stencil/core/testing` | Put e2e tests in `packages/core/e2e/`. |
| Meeting or device state | A small local fixture or an existing helper in the spec | Stub only the needed SDK boundary with `jest.fn()` and check what the component renders. |
| A common mock shared by several specs | A shared helper near the affected specs | Search existing specs before adding a new mock module or helper. |

## Add a new shared mock

1. Search nearby `*.spec.tsx` files for fixtures and stubs already in use.
2. If one spec needs a small fixture, keep it local. If several specs need the same setup, use or add a shared helper without moving unrelated tests.
3. Mock only the boundary that the UI needs, such as an SDK meeting method or a browser device API. Keep the component under test real.
4. Use Jest mocks (`jest.fn()`, `jest.spyOn()`, `jest.mock()`) where appropriate. Do not copy Vitest `vi` calls into this repo.

## Things that go wrong

- `newSpecPage` renders components in a test DOM; inspect `page.root` and `page.root.shadowRoot` rather than testing a private method when the DOM result is visible.
- After changing props or events, use `page.waitForChanges()` before checking updated DOM.
- A mocked helper does not run its real logic. Test shared `UIConfig` or utility changes through their real exported functions.
- Clean up listeners or page roots when the component registers browser or meeting listeners. Follow the nearby spec pattern.

## Think from the UI Kit

Load `realtimekit-sdk-map`. Name tests for what an app sees: the component's props, shadow DOM, emitted event detail, or exported helper result. Cover alternate states or sizes when the changed UI behaves differently there. Follow `AGENTS.md` for the component and package you change.
