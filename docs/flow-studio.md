# FlowStudio Component — Requirements

## Overview

`FlowStudio` is the **single shared component** for all canvas-based pages. It provides the interactive flow editor with widget management, settings, and zoom-responsive sizing.

State is managed via **MobX** (`FlowStudioStore`): theme, mode, zoomAutosize, currentSize, selectedNodeId.

## Layout

```
┌──────────────────────────────────────────────────┬──────────────┐
│                                                  │              │
│             ReactFlow Canvas                     │   Widget     │
│       (nodes, edges, background)                 │   Selector   │
│                                                  │   Panel      │
│       ┌──────┐  ──→  ┌──────┐  ──→  ┌──────┐   │   (100%h)    │
│       │Agent │       │Script│       │ User │    │              │
│       └──────┘       └──────┘       └──────┘   │  ● Agent     │
│                                                  │  ● Script JS │
│  ┌─── Settings gear (top-right of canvas)        │  ● Script TS │
│  │                                               │  ● User      │
│  │  children (StepPlayer, Workflow bar, etc.)    │  ● Group     │
│                                                  │              │
└──────────────────────────────────────────────────┴──────────────┘
```

## Widget Selector Panel

- **Position**: right side, 100% height of the FlowStudio container
- **Width**: ~200px, collapsible
- **Contents**: all widgets from `widgetRegistry.getAll()`, grouped by category
- **Interaction**: drag a widget item from the panel onto the canvas

## Drag → Rect Sizing Flow

When a widget is **dragged from the selector** and **dropped onto the canvas**:

1. A placeholder node is created at the drop point
2. The user enters **rect construction mode** — mouse movement sets the widget size (grid-snapped)
3. Click to confirm the size → the placeholder is replaced with the real widget node

This reuses the existing `ConnectorFlow` sizing phases (`positioning` → `sizing` → `placed`).

## Settings Panel

- **Theme**: wibeglow / pixel / ghub
- **Mode**: dark / light
- **Zoom autosize**: maps zoom level to node size (S/M/L)

## Props

FlowStudio accepts:
- `nodes`, `edges`, `nodeTypes` — standard React Flow data
- `onNodesChange` — node change handler (dragging, etc.)
- `onNodeCreated(...)` — called when a widget is dropped and sized
- `editMode` — controls whether handles and widget selector are visible
- `children` — extra panels (StepPlayer, workflow bar, etc.)
- `currentSize`, `onSizeChange` — zoom autosize callbacks
- `currentTheme`, `onThemeChange` — theme callbacks

## Used By

| Page | URL | editMode | Extra children |
|------|-----|----------|---------------|
| Builder Demo Complex | `?page=builder-complex` (alias: `?page=builder`) | `true` | Workflow selector, TimelineDots |
| Builder Demo Simple | `?page=builder-simple` | `false` | — |
| AI+Script | `?page=ai-script` | `true` | StepPlayer, JSON debug |
