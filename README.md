# Wideboard

[![CI](https://github.com/gatocube/wibeboard/actions/workflows/ci.yml/badge.svg)](https://github.com/gatocube/wibeboard/actions/workflows/ci.yml)

Interactive widget-based flow builder with customizable visual themes.

**🌐 [Live Demo →](https://gatocube.github.io/wibeboard/)** · **📊 [Test Stats →](https://gatocube.github.io/wibeboard/stats/)**

## Quick Start

```bash
git clone https://github.com/gatocube/wibeboard.git
cd wibeboard
npm install
npm run dev
```

Open [http://localhost:5173/wibeboard/](http://localhost:5173/wibeboard/) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npx playwright test` | Run E2E tests |
| `npm run lint` | Lint check |

## Templates

Wideboard supports 3 visual themes — every widget implements all 3:

| Template | Style | Animations | Modes |
|----------|-------|------------|-------|
| **pixel** | Terminal / pixel-art | None | Dark |
| **ghub** | GitHub-style | Minimal | Day + Night |
| **wibeglow** | Modern dark + glow | Full | Dark only |

## Experimental Renderers

Besides the default ReactFlow canvas, wibeboard includes 4 experimental renderers
selectable from the ⚙ settings panel:

| Renderer | Description |
|----------|-------------|
| **3D** ⚗️ | Three.js 3D scene with orbit controls |
| **ASCII** ⚗️ | 3D scene rendered as ASCII art |
| **Mermaid** ⚗️ | Flow → Mermaid flowchart → SVG |
| **Mobile** ⚗️ | Vertical layout with sidebar icons |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the project structure and design decisions.

## Tests

32 E2E tests across 3 suites:
- `pages-smoke.e2e.ts` — 9 page smoke tests + color and settings assertions
- `builder-simple.e2e.ts` — Flow builder interactions
- `node-configurator.e2e.ts` — Widget configurator and custom presets

## License

MIT
