# Wideboard Developer Guide

## Project Structure

```
wideboard/
├── src/
│   ├── App.tsx                        # Main app with nav + testing pages
│   ├── main.tsx                       # React entry point
│   ├── index.css                      # Global styles
│   ├── templates/
│   │   └── template-registry.ts       # 3 visual themes (pixel, ghub, wibeglow)
│   ├── widgets/
│   │   ├── widget-registry.ts         # All widget definitions
│   │   └── wibeglow/                  # WibeGlow template node components
│   │       ├── AgentNode.tsx
│   │       ├── ScriptNode.tsx
│   │       ├── GroupNode.tsx
│   │       └── PlaceholderNode.tsx
│   ├── builder/
│   │   └── WidgetSelector.tsx         # Categorized widget picker
│   └── pages/
│       ├── test-builder.tsx           # Builder demo page
│       └── test-widgets.tsx           # Widget gallery page
├── agents/
│   ├── DEVELOPER.md                   # This file
│   └── testing-strategy.md            # Testing approach
├── packages/
│   └── test-runner/                   # Test runner utility
└── .github/
    └── workflows/
        └── deploy.yml                 # GitHub Pages deployment
```

## Key Concepts

### Templates
3 visual themes that every widget must support:
- **pixel**: Terminal/pixel-art, no animations, performance-focused
- **ghub**: GitHub-style, minimal animations, mobile-friendly, day/night mode
- **wibeglow**: Modern dark+glow, advanced animations, dark mode only

### Widgets
Interactive nodes in the flow builder. Each has:
- A definition in `widget-registry.ts`
- React components for each template theme

### Testing Pages
Instead of React Cosmos, we use `src/pages/test-*.tsx` as testing pages.
Navigate to them via the top nav bar in the app.

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — lint check
