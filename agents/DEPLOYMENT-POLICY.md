# Deployment Policy

We should always have a deployed local version of the project available. Make sure it's not conflicting with ports and databases of dev version when working on both.

## Ports

Ports are configured in `.env` (copy from `.env.example`):
- **Dev server**: `VITE_DEV_PORT` (default: 5173)
- **Preview server**: `VITE_PREVIEW_PORT` (default: 4173)

## Local preview server

- **Command**: `pnpm build && pnpm preview`
- **URL**: `http://localhost:$VITE_PREVIEW_PORT/wibeboard/`
- The local preview server must stay running at all times
- After every `pnpm build`, restart the preview server immediately
- Never kill the preview server process without restarting it

## Pre-push checklist

1. `pnpm build` — must pass with no errors
2. `npx playwright test` — all E2E tests must pass
3. `pnpm preview` — deploy locally and visually verify changes
4. Only then: `git push`