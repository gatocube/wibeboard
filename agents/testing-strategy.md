# Testing Strategy

## Testing Pages
- Located at `src/pages/test-*.tsx`
- Each page demonstrates a specific feature or component set
- Navigate via the top nav bar in the running app

## Current Testing Pages
1. **test-builder** — Builder demo with Agent, Script, Group nodes
2. **test-widgets** — Widget gallery showing all widgets across templates

## E2E Tests
- Playwright-based, configured in `playwright.config.ts`
- Run with `npm run test:e2e`

## Scenario Tests
- Run with `npm run test:scenario`
- Managed by the test-runner package
