Deploy locally first
We should always have a deployed local version of the project available. Make sure it's not conflicting with ports and databases of dev version when working on both.

## Local preview server

- **Command**: `pnpm build && pnpm preview --port 4173`
- **URL**: http://localhost:4173/wibeboard/
- **Port**: 4173 (dev server uses 5173)
- The local preview server must stay running at all times
- After every `pnpm build`, restart the preview server immediately
- Never kill the preview server process without restarting it