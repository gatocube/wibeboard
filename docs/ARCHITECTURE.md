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
│   │   ├── BaseNode.tsx            # Foundational wrapper (type, subType, ctx via React context)
│   │   ├── StatusDot.tsx           # Animated status indicator
│   │   └── wibeglow/              # WibeGlow template components
│   │       ├── JobNode.tsx         # Unified job node (subType='ai' | 'script')
│   │       ├── AgentNode.tsx       # Thin wrapper → JobNode subType='ai'
│   │       ├── ScriptNode.tsx      # Thin wrapper → JobNode subType='script'
│   │       ├── NoteNode.tsx        # Annotation node (subType='sticker' | 'group' | 'label')
│   │       ├── GroupNode.tsx       # Container node
│   │       ├── UserNode.tsx        # Human review / approval node
│   │       ├── ArtifactNode.tsx    # Artifact display node
│   │       ├── ExpectationNode.tsx # Expected-outcome node
│   │       └── PlaceholderNode.tsx # Placeholder during widget selection
│   │
│   ├── engine/
│   │   ├── NodeContext.ts         # NodeContext type + React context (useNodeCtx hook)
│   │   ├── AgentMessenger.ts      # Contact management + messaging for agent nodes
│   │   ├── widget-registry.ts     # Widget definitions (type, category, sizes, templates)
│   │   ├── ConnectorFlow.tsx      # Click-based connection drawing (position → size → pick)
│   │   ├── automerge-store.ts     # Step-based state store (Automerge CRDT)
│   │   ├── step-player.tsx        # Step player UI (play/pause/next/prev/reset)
│   │   └── workflow-store.ts      # Persistent workflow save/load (IndexedDB)
│   │
│   ├── components/
│   │   ├── FlowBuilder.tsx        # Core ReactFlow wrapper (drag-drop, zoom, grid, settings)
│   │   ├── WidgetSelector.tsx     # Categorized widget picker (search, categories, recent)
│   │   ├── PreviewCanvas.tsx      # Minimap-style preview canvas
│   │   ├── TimelineDots.tsx       # Timeline dot navigation
│   │   ├── WidgetIcon.tsx         # Widget type icon renderer
│   │   ├── AnimatedNumber.tsx     # Animated number transition
│   │   ├── FpsMeter.tsx           # FPS performance meter
│   │   ├── TechIcons.tsx          # Technology brand icons
│   │   └── animate-ui/index.tsx   # Animation primitives
│   │
│   ├── hooks/
│   │   └── useIntegrations.ts     # API key management (env → localStorage fallback)
│   │
│   └── pages/
│       ├── test-builder.tsx       # Builder demo (Agent → Script → Group)
│       ├── test-widgets.tsx       # Widget gallery with template switcher
│       ├── test-icons.tsx         # Icon showcase
│       ├── ai-script-scenario.tsx # Step-driven AI coding scenario (Agent → Tests → Review → Deploy)
│       ├── two-node-scenario.tsx  # Minimal two-node scenario
│       ├── four-node-concurrent.tsx # Four-node concurrent execution demo
│       └── integrations.tsx       # API key management UI (GitHub, Cursor, OpenHands, OpenAI, ClaudeCode)
│
├── tests/
│   ├── flowbuilder.e2e.ts         # Builder drag-drop + ConnectorFlow E2E
│   ├── integrations.e2e.ts        # Integrations page E2E (token test, localStorage)
│   ├── two-node.scenario.e2e.ts   # Two-node scenario E2E
│   ├── four-node.scenario.e2e.ts  # Four-node concurrent scenario E2E
│   ├── gallery.scenario.e2e.ts    # Widget gallery E2E
│   └── pages-smoke.scenario.e2e.ts # Smoke tests for all pages
│
├── packages/
│   └── test-runner/              # CLI test runner utility
│
├── agents/
│   └── testing-strategy.md      # Testing conventions
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
