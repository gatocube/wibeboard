# Wideboard — Agent Instructions

- Project: wibeboard — interactive widget-based flow builder
- Stack: Vite + React + TypeScript + @xyflow/react + framer-motion
- Templates: pixel (terminal), ghub (GitHub-style), wibeglow (modern glow)
- Testing: use `src/pages/test-*.tsx` files as testing pages (no React Cosmos)
- PRs: create against main branch unless specified otherwise
- **MUST deploy locally (`pnpm build && pnpm preview`) before pushing!** Verify the production build works on http://localhost:4173/wibeboard/

Check aslo agents/testing-strategy.md
Check agents/DEPRECATION-POLICY.md
Check docs/ARCHITECTURE.md

After you finished you current task you must check the agents/tasks/ folder for tasks that are not marked as done and pick the next one.

Make it done or reply in task why you failed to make it done.
