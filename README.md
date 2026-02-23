# Wideboard

[![Build & Deploy](https://github.com/gatocube/wideboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/gatocube/wideboard/actions/workflows/deploy.yml)
[![Tests](https://github.com/gatocube/wideboard/actions/workflows/test.yml/badge.svg)](https://github.com/gatocube/wideboard/actions/workflows/test.yml)

Interactive widget-based flow builder with customizable visual themes.
Like [n8n](https://n8n.io) but with interactive widget nodes.

**🌐 [Live Demo →](https://gatocube.github.io/wideboard/)**

## Quick Start

```bash
git clone https://github.com/gatocube/wideboard.git
cd wideboard
npm install
npm run dev
```

Open [http://localhost:5173/wideboard/](http://localhost:5173/wideboard/) in your browser.

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

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the project structure and design decisions.

## License

MIT
