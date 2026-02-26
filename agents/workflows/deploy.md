---
description: how to deploy and verify locally before pushing
---

# Local Deploy Before Push

// turbo-all

1. Build the project:
```bash
pnpm build
```

2. Run E2E tests:
```bash
npx playwright test
```

3. Start preview server (reads VITE_PREVIEW_PORT from .env, default 4173):
```bash
pnpm preview
```

4. Visually verify the affected page(s) in the browser at `http://localhost:$VITE_PREVIEW_PORT/wibeboard/`

5. If everything looks good, commit and push:
```bash
git add -A -- ':!BdxSwipeMenu' && git commit -m "your message" && git push
```

> **Note**: If push is rejected, run `git pull --rebase && git push`
