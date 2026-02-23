# Architecture

## Overview

Wideboard is an interactive widget-based flow builder built with React and React Flow.
It provides 3 visual themes ("templates") and a registry of reusable widget nodes.

## Project Structure

```
wideboard/
├── src/
│   ├── App.tsx                    # Main app — nav bar + page router
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles (fonts, scrollbars, animations)
│   │
│   ├── templates/
│   │   └── template-registry.ts   # 3 visual themes: pixel, ghub, wibeglow
│   │
│   ├── widgets/
│   │   ├── widget-registry.ts     # Widget definitions (type, category, sizes, templates)
│   │   └── wibeglow/              # WibeGlow template components
│   │       ├── AgentNode.tsx       # AI agent node
│   │       ├── ScriptNode.tsx      # Code editor + terminal log node
│   │       ├── GroupNode.tsx        # Container node
│   │       └── PlaceholderNode.tsx  # Placeholder during widget selection
│   │
│   ├── builder/
│   │   └── WidgetSelector.tsx     # Categorized widget picker (search, categories, recent)
│   │
│   └── pages/
│       ├── test-builder.tsx       # Builder demo (Agent → Script → Group)
│       └── test-widgets.tsx       # Widget gallery with template switcher
│
├── tests/
│   └── builder.scenario.e2e.ts   # Playwright E2E test for the builder
│
├── packages/
│   └── test-runner/              # CLI test runner utility
│
└── .github/workflows/
    ├── deploy.yml                # Build + deploy to GitHub Pages on push to main
    └── test.yml                  # Run E2E tests on pull requests
```

## Key Design Decisions

### Template Registry
Each template defines: name, fonts, colors, animation level, and dark/light mode support.
Widget nodes render differently depending on the active template.

### Widget Registry
Central registry of all available widgets. Each widget specifies:
- **Type** + category + tags (for search)
- **Size constraints** (min/default width and height)
- **Templates** — named presets with default data

### Node Components
Each widget type has a React component per template. Currently:
- `wibeglow/` — modern dark theme with glow effects and framer-motion animations
- `pixel/` and `ghub/` — planned

### Testing Pages (no Cosmos)
Instead of React Cosmos, we use regular React components as testing pages.
Navigate between them via the top nav bar.

## Data Flow

```
Widget Registry → WidgetSelector → ConnectorFlow → React Flow nodes
                                                         ↓
Template Registry → Node components render per active template
```

## Stack

- **React 19** + TypeScript
- **@xyflow/react** (React Flow v12) — canvas, nodes, edges
- **framer-motion** — animations (wibeglow template)
- **lucide-react** — icons
- **elkjs** — auto-layout (planned)
- **Vite 7** — dev server and build
- **Playwright** — E2E testing
