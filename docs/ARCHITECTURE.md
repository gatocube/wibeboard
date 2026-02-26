# Architecture

## Overview

Wibeboard is an interactive widget-based flow builder built with React and React Flow.
It provides 3 visual themes ("templates") and a registry of reusable widget nodes.

## Project Structure

```
wibeboard/
├── src/
│   ├── App.tsx                    # Main app — nav bar + page router
│   ├── main.tsx                   # React entry point
│   ├── index.css                  # Global styles (fonts, scrollbars, animations)
│   │
│   ├── templates/
│   │   └── template-registry.ts   # 3 visual themes: pixel, ghub, wibeglow
│   │
│   ├── widgets/
│   │   ├── BaseNode.tsx            # Foundational wrapper (type, subType, ctx)
│   │   ├── StatusDot.tsx           # Animated status indicator
│   │   ├── widget-registry.ts      # Widget definitions (mirrors engine/)
│   │   └── wibeglow/               # WibeGlow template components
│   │       ├── JobNode.tsx         # Unified job node (subType='ai' | 'script')
│   │       ├── StartingNode.tsx    # 60×60 starting node (center at origin)
│   │       ├── UserNode.tsx        # Human review / approval node
│   │       ├── SubFlowNode.tsx     # Sub-workflow container
│   │       ├── NoteNode.tsx        # Annotation node
│   │       ├── GroupNode.tsx       # Container node
│   │       ├── ExpectationNode.tsx # Expected-outcome node
│   │       └── PlaceholderNode.tsx # Placeholder during widget selection
│   │
│   ├── engine/
│   │   ├── widget-registry.ts     # Widget definitions (GRID_CELL, MIN_GRID, sizes)
│   │   ├── FlowStudioApi.ts       # High-level API (state + store + node CRUD)
│   │   ├── NodeContext.ts         # NodeContext type + React context
│   │   ├── AgentMessenger.ts      # Contact management + messaging for agents
│   │   ├── ConnectorFlow.tsx      # Click-based connection drawing
│   │   ├── automerge-store.ts     # CRDT state store
│   │   ├── step-player.tsx        # Step player UI
│   │   └── workflow-store.ts      # Persistent workflow save/load
│   │
│   ├── flow-studio/
│   │   ├── FlowStudio.tsx         # Main ReactFlow wrapper (drag-drop, themes, edit mode)
│   │   ├── FlowStudioStore.tsx    # MobX store (theme, size, node selection)
│   │   ├── WidgetPicker.tsx       # Sidebar widget picker
│   │   ├── NodeButtonsMenu.tsx    # Radial menu for node actions
│   │   ├── NodeConfigPanel.tsx    # Node configuration panel
│   │   ├── StudioSettings.tsx     # Settings panel (theme, grid, renderer)
│   │   ├── ZoomAutosize.tsx       # Zoom-based node resizing
│   │   ├── resolve-collisions.ts  # Collision detection + auto-spacing
│   │   ├── types.ts               # Shared types (RendererType, etc.)
│   │   ├── index.ts               # Barrel exports
│   │   └── renderers/
│   │       ├── ThreeFiberRenderer.tsx  # 3D renderer (Three.js)
│   │       ├── AsciiRenderer.tsx      # ASCII art renderer
│   │       ├── MermaidRenderer.tsx     # Mermaid flowchart renderer
│   │       └── MobileRenderer.tsx     # Mobile-adapted vertical layout
│   │
│   ├── kit/
│   │   ├── SwipeButtons.tsx       # Radial action menu (After, Before, Configure)
│   │   ├── ExtendedNodeButtonsMenu.tsx  # Extended button menu
│   │   ├── NodeSettingsPanel.tsx  # Settings panel for node configuration
│   │   ├── CodeEditor.tsx         # CodeMirror 6 editor (JSON, JS, TS, Python)
│   │   └── IconSelector.tsx       # Icon picker
│   │
│   ├── components/
│   │   ├── PreviewCanvas.tsx      # Minimap-style preview canvas
│   │   ├── WidgetIcon.tsx         # Widget type icon renderer
│   │   └── ...                    # Other UI components
│   │
│   ├── hooks/
│   │   └── useIntegrations.ts     # API key management
│   │
│   └── pages/
│       ├── builder-simple.tsx     # Simple flow builder (start → chain nodes)
│       ├── test-builder.tsx       # Complex builder demo
│       ├── test-widgets.tsx       # Widget gallery with template switcher
│       ├── ai-script-scenario.tsx # Step-driven AI coding scenario
│       ├── integrations.tsx       # API key management UI
│       └── ...                    # Other demo pages
│
├── tests/
│   ├── builder-simple.e2e.ts      # Simple builder: add, delete, reconnect, spacing
│   ├── node-configurator.e2e.ts   # Configurator: widget switching, custom presets
│   ├── pages-smoke.e2e.ts         # Smoke tests for all pages + color/settings assertions
│   └── ...                        # Scenario + integration tests
│
├── public/
│   └── stats/
│       ├── index.html             # Test stats dashboard (auto-updated by CI)
│       └── test-results.json      # JSON test results (populated by CI)
│
├── docs/
│   ├── ARCHITECTURE.md            # ← You are here
│   ├── grid-sizing.md             # Grid units, spacing rules, collision avoidance
│   ├── simple-demo.md             # Builder Simple page specification
│   ├── flow-studio.md             # FlowStudio component documentation
│   ├── swipe-buttons-menu.md      # SwipeButtons menu specification
│   └── ...                        # Other feature docs
│
└── .github/workflows/
    ├── deploy.yml                 # Build + deploy to GitHub Pages on push to main
    └── test.yml                   # CI: smoke + full tests, publish stats
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
All node components wrap in `BaseNode` which provides:
- **type** — node category (`'job'`, `'note'`, `'group'`)
- **subType** — specialization (`'ai'`, `'script'`, `'sticker'`, `'label'`)
- **ctx** — `NodeContext` with `AgentMessenger`, available via `useNodeCtx()` hook

Unified components per template:
- **JobNode** — `type="job"`: `subType="ai"` (agent) or `subType="script"` (code runner)
- **NoteNode** — `type="note"`: `subType="sticker"`, `"group"`, `"group-note"`, `"label"`

Legacy `AgentNode`/`ScriptNode` are thin wrappers that delegate to `JobNode`.

Each template provides its own visual rendering:
- `wibeglow/` — modern dark theme with glow effects and framer-motion animations
- `pixel/` — retro terminal / pixel-art style
- `ghub/` — GitHub-style with day/night mode

### ConnectorFlow
Click-based node creation pipeline:
1. Click source handle → dashed bezier follows cursor
2. Click canvas → PlaceholderNode appears, mouse resizes
3. Click confirms size → WidgetSelector popup shows
4. Pick widget → placeholder replaced with real node

Also supports drag-and-drop from the WidgetSelector sidebar (via `onWidgetDrop`).

### FlowStudio
Self-contained ReactFlow wrapper providing:
- **Theme management** (wibeglow, pixel, ghub)
- **Edit mode** with WidgetPicker sidebar
- **Drag-and-drop** node creation from picker
- **Collision avoidance** — auto-spacing on drag-stop (O(n²) algorithm)
- **SwipeButtons** radial menu for node actions (Add After/Before, Configure)
- **Renderer selection** — switch between ReactFlow and 4 experimental renderers

Settings button is always accessible via a floating overlay when using
non-ReactFlow renderers.

See [docs/flow-studio.md](flow-studio.md) for full component documentation.

### Experimental Renderers
Four experimental renderers (`src/flow-studio/renderers/`) complement the default ReactFlow canvas:
- **ThreeFiberRenderer** — nodes as 3D metallic boxes via `@react-three/fiber`
- **AsciiRenderer** — same 3D scene rendered as ASCII art via `@react-three/drei`
- **MermaidRenderer** — converts flow to Mermaid syntax → SVG
- **MobileRenderer** — vertical layout, tools in left sidebar, info in right sidebar

Renderer type is stored in `FlowStudioStore.renderer` (persisted to `localStorage`).
The `RendererType` union is defined in `types.ts`.

### Custom Widget Presets
Users can save custom presets from the Node Configurator page.
Custom presets are marked with a "custom" tag and appear after built-in widgets
in the Widget Picker. Drag-to-reorder is supported via the Automerge CRDT store.

### FlowStudioApi (`engine/FlowStudioApi.ts`)
High-level API that owns:
- `state` — FlowStudioStore (MobX) for UI state
- `store` — StepStore (Automerge) for persistent step execution (optional)
- Node CRUD with correct positioning:
  - `createStartNode()` — center at (0, 0)
  - `positionAfter(source)` — 5 grid units right, Y center-aligned
  - `positionBefore(target)` — left of target, Y center-aligned
  - `deleteWithReconnect()` — bridge-reconnection (A→B→C → A→C)
  - `makeEdge()` — styled edge factory

See [docs/grid-sizing.md](grid-sizing.md) for grid sizing guidelines.

### Step-Based Scenarios
Pages like `ai-script-scenario` use `StepStore` (Automerge CRDT) to drive
node state changes step-by-step with play/pause/next/prev controls.

### Integrations
API key management for external services. Keys are loaded from `.env`
(read-only, preferred) with `localStorage` as a fallback for runtime entry.
GitHub tokens are validated via the `X-OAuth-Scopes` header.

### Testing Pages (no Cosmos)
Instead of React Cosmos, we use regular React components as testing pages.
Navigate between them via the top nav bar.

## CI / CD

### Deploy (`deploy.yml`)
On push to `main`, builds the Vite app and deploys to GitHub Pages.

### Tests (`test.yml`)
Triggers on push to `main` and pull requests. Runs 2 parallel jobs:
- **Smoke** — `pages-smoke.scenario.e2e.ts` (fast gate, ~5s)
- **Full** — complete test suite

A third job (`publish-stats`) merges JSON results and deploys a stats dashboard to
[gatocube.github.io/wibeboard/stats/](https://gatocube.github.io/wibeboard/stats/).

## Related Documentation

- [Grid Sizing Guidelines](grid-sizing.md) — spacing, collision avoidance, minimum sizes
- [FlowStudio](flow-studio.md) — FlowStudio component API
- [SwipeButtons Menu](swipe-buttons-menu.md) — radial action menu
- [Simple Demo](simple-demo.md) — builder-simple page specification
- [Testing Strategy](../agents/testing-strategy.md) — E2E testing conventions

## Stack

- **React 19** + TypeScript
- **@xyflow/react** (React Flow v12) — canvas, nodes, edges
- **MobX** — observable state for FlowStudio
- **framer-motion** — animations (wibeglow template)
- **lucide-react** — icons
- **CodeMirror 6** — code editing in configurator
- **Vite 7** — dev server and build
- **Playwright** — E2E testing
- **@react-three/fiber** + **drei** — 3D rendering (experimental)
- **mermaid** — flowchart rendering (experimental)

## Inspiration

- **n8n** — workflow automation platform with visual node-based editor

