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
| waking   | `#f59e0b` (orange)| Spinning ring  |
| running  | `#3b82f6` (blue)  | Blinking       |
| done     | `#10b981` (green) | Static         |
| error    | `#ef4444` (red)   | Static         |

The dot must be visible across all themes (WibeGlow, GitHub, Pixel).

## Icons

Each node displays an icon in its header (or centered in compact mode).

| Kind     | Default icon           | Active icon (running/waking)         |
|----------|------------------------|--------------------------------------|
| **AI**   | `Sparkles` (lucide)    | `sparkle-burst` (WidgetIcon, animated rotation) |
| **Script** | `terminal` (WidgetIcon) | `terminal-blink` (WidgetIcon)       |

Icons are rendered via `WidgetIcon` from the [icon gallery](/wibeboard/?page=icons).

## Compact mode layout

In compact mode, nodes render as a square icon box with:

1. **Status dot** — top-right corner of the box
2. **Icon** — centered in the box (`sparkle-burst` for AI, `terminal` for Script)
3. **Name label** — below the box, truncated with ellipsis
4. **AI thoughts / Script output** — below the name (italic, muted):
   - Agent: shows `data.thought` prefixed with 💭
   - Script: shows last line of `data.logs`

## Non-compact mode layout (M, Default, L)

Non-compact nodes render as a card with these fields:

| Field           | Data key        | AI example        | Script example     |
|-----------------|-----------------|-------------------|--------------------|
| **Icon**        | (from subType)  | `sparkle-burst`   | `terminal`         |
| **Label**       | `data.label`    | "Planner"         | "build.ts"         |
| **Agent/Lang**  | `data.agent`    | "Claude 3.5"      | "TypeScript"       |
| **Status**      | `data.status`   | running           | idle               |
| **Progress**    | `data.progress` | 55%               | 0%                 |
| **Exec time**   | `data.execTime` | "1.3s"            | "0.6s"             |
| **Calls/Runs**  | `data.callsCount` | 3               | 1                  |

### Card structure for medium (default) size (top → bottom)

```
┌──────────────────────────────┐
│ Icon  Label        StatusDot |← Header
├──────────────────────────────┤
│ Agent name                 ⚡3|<- Agent name (AI) like: Reviewer: Claude 3.5 or Lang (Script) like: TS: hello-world.ts
│ Current task                 |<- Current task (AI) or Code last Output line
│ ████████░░░░░░░░░░  55% 1.3s │<- Total running time and Progress bar
└──────────────────────────────┘
  Some AI thoughts or script output line here
```

### Card structure for large size (top → bottom)

```
┌──────────────────────────────┐
│ Icon  Label        StatusDot |← Header
├──────────────────────────────┤
|                              |
|       Preview Canvas         |
|      16/9 aspect ratio       |
|                              |
├──────────────────────────────┤
│ Agent name                 ⚡3|<- Agent name (AI) like: Reviewer: Claude 3.5 or Lang (Script) like: TS: hello-world.ts
│ Current task                 |<- Current task (AI) or Code last Output line
│ ████████░░░░░░░░░░  55% 1.3s │<- Total running time and Progress bar
└──────────────────────────────┘
  Some AI thoughts or script output line here
```

### Theme-specific progress bar position

| Theme     | Progress bar position |
|-----------|-----------------------|
| WibeGlow  | **Bottom** (before stats row) |
| GitHub    | **Top** (after header) |
| Pixel     | (theme-dependent)     |

## Default Theme: WibeGlow

WibeGlow is the default theme. It uses a **colored gradient border** for AI Agent nodes:

```
background: linear-gradient(135deg, primary, secondary, tertiary)
padding: 1px  (the gradient shows through as a border)
inner: #0f0f1a background with border-radius - 1
while working uses floating animation
```

This gradient border is applied consistently across **all sizes** (S, M, L).

## Connection animations

| Animation      | Color              | Dash direction        | Trigger           |
|----------------|--------------------|-----------------------|-------------------|
| **Knocking**   | `#f97316` (orange) | Toward the node       | `waking` status   |
| **Communicating** | `#06b6d4` (cyan) | Away from the node    | Manual toggle     |

Animations use CSS `stroke-dashoffset` with `6 4` dash pattern and `0.3s linear infinite` timing.
