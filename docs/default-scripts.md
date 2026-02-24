# Default Scripts

Script templates available in `workspace-templates/default/scripts/js/`. These are loaded when creating a new JS script node.

## Scripts

| File | Description |
|------|-------------|
| `default.js` | Minimal "Hello" starter — logs node name and ID |
| `data-pipeline.js` | 3-stage ETL pipeline: validate → transform → output |
| `http-fetch.js` | Simulated API fetch with async/await and error handling |
| `test-runner.js` | Lightweight test suite with assertions and pass/fail summary |

## Script API

Each script exports an `activate(ctx)` function. The `ctx` object provides:

```js
ctx.node       // { id, name, data }   — the current node
ctx.node.data  // { ... }              — node-specific data (url, input, etc.)
```

Scripts log output via `console.log()` — lines appear in the node's terminal preview.

## Adding New Scripts

1. Create a `.js` file in `workspace-templates/default/scripts/js/`
2. Export an `activate(ctx)` function
3. The script will automatically appear in the script template selector
