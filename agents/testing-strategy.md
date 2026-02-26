# Testing Strategy

## Golden Rule: One Scenario File Per Page

Every page gets exactly **one** test file. All tests for that page live in that file.
Tests within a file should not relaunch the application — use `test.beforeEach` to navigate,
but avoid full-page reloads between tests where possible.

> **Adding a new test?** Find the existing file for that page and add your test there.
> Never create a second test file for a page that already has one.

## Human Mode

Set `TEST_RUNNER_HUMAN=1` to run tests with a visible browser, one at a time:
```bash
TEST_RUNNER_HUMAN=1 npx playwright test
```
Uses `breath()` pauses from `packages/test-runner/src/human.mjs`.

## Test Files → Pages

| File | Page | Description |
|------|------|-------------|
| `builder-simple.e2e.ts` | `?page=builder-simple` | Node CRUD, undo, grid sizing, minimap |
| `swipe-buttons.e2e.ts` | `?page=buttons-menu` | SwipeButtons activation modes + touch |
| `flow-studio.e2e.ts` | `/` (home/builder) | Drag-drop, edit mode, script execution, NodeButtonsMenu |
| `integrations.e2e.ts` | `?page=integrations` | GitHub token, Cursor mock, custom JSON integrations |
| `two-node.scenario.e2e.ts` | `?page=two-node` | Two-node scenario steps |
| `four-node.scenario.e2e.ts` | `?page=four-node` | Four-node concurrent scenario |
| `gallery.scenario.e2e.ts` | `?page=widgets` | Widget gallery smoke test |
| `pages-smoke.scenario.e2e.ts` | *(all pages)* | Smoke test — every page loads |
| `plugins.e2e.ts` | `?page=plugins` | Plugin toggle reactivity, permissions badge, source viewer |
| `plugins.integration.e2e.ts` | `?page=plugins` | **Integration** — AI chat with live Ollama |

## Running Tests

```bash
npx playwright test                          # all tests, headless (excludes *.integration.e2e.ts)
npx playwright test builder-simple           # single file
TEST_RUNNER_HUMAN=1 npx playwright test      # human mode (headed, sequential)
```

## Integration Tests

Integration tests (e.g. LLM communication) use the `*.integration.e2e.ts` suffix
and are **excluded from default runs and CI**.

```bash
npm run test:integration                                     # run integration tests
TEST_RUNNER_HUMAN=1 npm run test:integration                 # human mode
OLLAMA_URL=http://host:11434 npm run test:integration        # custom Ollama URL
```

Environment variables:
- `OLLAMA_URL` — Ollama base URL (default: `http://localhost:11434`)
- `OLLAMA_MODEL` — Ollama model name (default: `qwen2.5-coder:7b`)

