# UI Guidelines

## Target Devices

Our primary design goal is to be **comfortably usable on iPad screens** (1024 × 768 pt and up).
All interactive elements, touch targets, and node sizes must work well with finger input — no hover-dependent interactions at the base level.

### Touch targets

| Guideline        | Minimum | Recommended |
|------------------|---------|-------------|
| Apple HIG        | 44 × 44 pt | 48+ pt  |
| Our grid cell    | 20 × 20 px | —       |
| Compact node     | 48 × 48 px (≈ 44 pt) | 64 × 64 px |

> [!IMPORTANT]
> Every tappable element must be at least **44 × 44 pt** to meet Apple Human Interface Guidelines.

## Grid System

The board uses a **20 px** grid cell. All node sizes snap to multiples of 20 px.

| Grid cells | Pixels   | Use case        |
|------------|----------|-----------------|
| 1 × 1      | 20 × 20  | *(too small — not used)* |
| 3 × 3      | 60 × 60  | Compact icon node (minimum) |
| 5 × 4      | 100 × 80 | Medium card     |
| 10 × 6     | 200 × 120| Default card    |
| 15 × 9     | 300 × 180| Large detail    |

## Typography

Use system-compatible font stacks:
- **Headings / labels**: `Inter`, sans-serif
- **Code / stats**: `'JetBrains Mono'`, monospace

Minimum font sizes for readability on iPad:
- Body text: **10 px**
- Captions / stats: **9 px**
- Never below **8 px**

## Color System

Status colors are standardized across all themes:

| Status   | Color     | Hex       |
|----------|-----------|-----------|
| idle     | Gray      | `#475569` |
| waking   | Orange    | `#f59e0b` |
| running  | Blue      | `#3b82f6` |
| done     | Green     | `#10b981` |
| error    | Red       | `#ef4444` |

These colors are used in the [StatusDot](../src/widgets/StatusDot.tsx) component and throughout the widget library.
