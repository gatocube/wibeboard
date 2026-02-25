# Wideboard

[![Build & Deploy](https://github.com/gatocube/wibeboard/actions/workflows/deploy.yml/badge.svg)](https://github.com/gatocube/wibeboard/actions/workflows/deploy.yml)
[![Tests](https://github.com/gatocube/wibeboard/actions/workflows/test.yml/badge.svg)](https://github.com/gatocube/wibeboard/actions/workflows/test.yml)

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

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the project structure and design decisions.

## License

MIT
