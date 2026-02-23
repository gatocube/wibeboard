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

We use **grid cells** (20 px each) to define node dimensions. See [UI Guidelines](./ui.md) for the full grid system.

| Size    | Grid   | Pixels    | Notes                         |
|---------|--------|-----------|-------------------------------|
| Compact | 3 × 3  | 60 × 60   | Square icon with status dot   |
| Medium  | 5 × 4  | 100 × 80  | Condensed card view           |
| Default | 10 × 6 | 200 × 120 | Standard card view            |
| Large   | 15 × 9 | 300 × 180 | Extended detail view          |

> **Minimum size is 3 × 3** (60 × 60 px). This meets the 44 pt minimum touch target for comfortable iPad use.

## Status indicator

At compact size, the node displays a **colored status dot** in the **top-right** corner.

| Status   | Color             | Behavior       |
|----------|-------------------|----------------|
| idle     | `#475569` (gray)  | Static         |
| waking   | `#f59e0b` (orange)| Static         |
| running  | `#3b82f6` (blue)  | Blinking       |
| done     | `#10b981` (green) | Static         |
| error    | `#ef4444` (red)   | Static         |

The dot must be visible across all themes (WibeGlow, GitHub, Pixel).

## Compact mode layout

In compact mode, nodes render as a square icon box with:

1. **Status dot** — top-right corner of the box
2. **Icon** — centered in the box (Sparkles for AI, Terminal for Script)
3. **Name label** — below the box, truncated with ellipsis
4. **AI thoughts / Script output** — below the name (italic, muted):
   - Agent: shows `data.thought` prefixed with 💭
   - Script: shows last line of `data.logs`

## Default Theme: WibeGlow

WibeGlow is the default theme. It uses a **colored gradient border** for AI Agent nodes:

```
background: linear-gradient(135deg, primary, secondary, tertiary)
padding: 1px  (the gradient shows through as a border)
inner: #0f0f1a background with border-radius - 1
```

This gradient border is applied consistently across **all sizes** (S, M, L).

## Connection animations

| Animation      | Color              | Dash direction        | Trigger           |
|----------------|--------------------|-----------------------|-------------------|
| **Knocking**   | `#f97316` (orange) | Toward the node       | `waking` status   |
| **Communicating** | `#06b6d4` (cyan) | Away from the node    | Manual toggle     |

Animations use CSS `stroke-dashoffset` with `6 4` dash pattern and `0.3s linear infinite` timing.
