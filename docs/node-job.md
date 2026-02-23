# Job Node

A **Job Node** represents a working process on the board. There are two kinds of job nodes:

| Kind       | Description                              |
|------------|------------------------------------------|
| **Script** | Runs user-defined code (JS, TS, SH, PY)  |
| **AI**     | Delegates work to an AI agent model       |

Both kinds have access to `ExecutionContext`.

## Script Node example

```js
export function activate(ctx) {
  ctx.log('Hello world!');
  console.log(`My name is ${ctx.node.name}`);
}
```

## Sizing

We use **grid cells** to define node dimensions.

| Size    | Grid   | Pixels   | Notes                  |
|---------|--------|----------|------------------------|
| Minimal | 2 × 2  | 40 × 40  | Square icon with status dot |
| Medium  | —      | 200 × 120 | Default card view       |
| Large   | —      | 300 × 180 | Extended detail view    |

> **Minimum size is 2 × 2** (40 × 40 px). At this size the node renders as a compact icon.

## Status indicator

At minimal (2 × 2) size, the node displays a **colored status dot** in the top-left corner.

| Status   | Color             | Behavior       |
|----------|-------------------|----------------|
| idle     | `#475569` (gray)  | Static         |
| waking   | `#f59e0b` (orange)| Static         |
| running  | `#3b82f6` (blue)  | Blinking       |
| done     | `#10b981` (green) | Static         |
| error    | `#ef4444` (red)   | Static         |

The dot must be visible across all themes (WibeGlow, GitHub, Pixel).
