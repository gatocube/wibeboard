# Testing Strategy

## Testing Pages
- Located at `src/pages/test-*.tsx` and `src/pages/*-scenario.tsx`
- Each page demonstrates a specific feature or component set
- Navigate via the top nav bar in the running app

## Current Testing Pages
1. **test-builder** — Builder demo with Agent, Script, Group nodes + ConnectorFlow
2. **test-widgets** — Widget gallery showing all widgets across templates
3. **test-icons** — Icon showcase
4. **ai-script-scenario** — Step-driven AI coding flow (Agent → Tests → Review → Deploy)
5. **two-node-scenario** — Minimal two-node scenario
6. **four-node-concurrent** — Four-node concurrent execution demo
7. **integrations** — API key management for external services

## E2E Tests
- Playwright-based, configured in `playwright.config.ts`
- Run with `npm run test:e2e`
- Test files: `tests/*.e2e.ts`

### Current E2E Tests
1. **flowbuilder.e2e.ts** — Drag-drop from WidgetSelector + ConnectorFlow handle click
2. **integrations.e2e.ts** — GitHub token from .env, mock integration with localStorage
3. **two-node.scenario.e2e.ts** — Two-node scenario steps
4. **four-node.scenario.e2e.ts** — Four-node concurrent scenario
5. **gallery.scenario.e2e.ts** — Widget gallery smoke test
6. **pages-smoke.scenario.e2e.ts** — Smoke test all pages load

## Scenario Tests
- Run with `npm run test:scenario`
- Managed by the test-runner package
