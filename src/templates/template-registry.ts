/**
 * Template Registry — 3 visual themes for wideboard widgets.
 *
 * Each widget must provide a React component for all 3 templates.
 * Templates define the visual identity: colors, fonts, animations, layout.
 */

export type TemplateName = 'pixel' | 'ghub' | 'wibeglow'

export interface TemplateDefinition {
    name: TemplateName
    label: string
    description: string
    characteristics: string[]
    fonts: { heading: string; body: string; mono: string }
    colors: {
        bg: string
        surface: string
        border: string
        text: string
        textMuted: string
        accent: string
    }
    supportsDarkMode: boolean
    supportsLightMode: boolean
    animationLevel: 'none' | 'minimal' | 'full'
}

// ── Template Definitions ────────────────────────────────────────────────────────

const TEMPLATES: TemplateDefinition[] = [
    {
        name: 'pixel',
        label: 'Pixel',
        description: 'Terminal/pixel-art style. No animations, performance-focused. Works in terminal and browser.',
        characteristics: [
            'Pixel-art styling in browser',
            'No animations — performance focused',
            'Color support + visible without colors',
            'Renderable in terminal',
        ],
        fonts: {
            heading: "'Courier New', Courier, monospace",
            body: "'Courier New', Courier, monospace",
            mono: "'Courier New', Courier, monospace",
        },
        colors: {
            bg: '#1a1a2e',
            surface: '#16213e',
            border: '#0f3460',
            text: '#e0e0e0',
            textMuted: '#8888aa',
            accent: '#e94560',
        },
        supportsDarkMode: true,
        supportsLightMode: false,
        animationLevel: 'none',
    },
    {
        name: 'ghub',
        label: 'GitHub',
        description: 'GitHub-style components. Minimal animations, mobile-friendly, day/night mode.',
        characteristics: [
            'Well-known GitHub design language',
            'Fast rendering, minimal animations',
            'Mobile-friendly responsive layout',
            'Day and night mode included',
        ],
        fonts: {
            heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Noto Sans, Helvetica, Arial, sans-serif",
            body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Noto Sans, Helvetica, Arial, sans-serif",
            mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
        },
        colors: {
            bg: '#0d1117',
            surface: '#161b22',
            border: '#30363d',
            text: '#e6edf3',
            textMuted: '#8d96a0',
            accent: '#58a6ff',
        },
        supportsDarkMode: true,
        supportsLightMode: true,
        animationLevel: 'minimal',
    },
    {
        name: 'wibeglow',
        label: 'WibeGlow',
        description: 'Modern dark design with glowing accents. Advanced animations, dark/darkish mode only.',
        characteristics: [
            'Modern, premium aesthetics',
            'Advanced animations (framer-motion)',
            'Dark/darkish mode with glow effects',
            'Latest web technologies',
        ],
        fonts: {
            heading: "'Inter', -apple-system, sans-serif",
            body: "'Inter', -apple-system, sans-serif",
            mono: "'JetBrains Mono', 'Fira Code', monospace",
        },
        colors: {
            bg: '#0a0a14',
            surface: '#0f0f1e',
            border: 'rgba(255,255,255,0.08)',
            text: '#e2e8f0',
            textMuted: '#64748b',
            accent: '#8b5cf6',
        },
        supportsDarkMode: true,
        supportsLightMode: false,
        animationLevel: 'full',
    },
]

// ── Registry API ────────────────────────────────────────────────────────────────

class TemplateRegistry {
    private templates: Map<TemplateName, TemplateDefinition> = new Map()

    constructor(definitions: TemplateDefinition[]) {
        for (const def of definitions) {
            this.templates.set(def.name, def)
        }
    }

    getAll(): TemplateDefinition[] {
        return Array.from(this.templates.values())
    }

    get(name: TemplateName): TemplateDefinition | undefined {
        return this.templates.get(name)
    }

    getDefault(): TemplateDefinition {
        return this.templates.get('wibeglow')!
    }

    getNames(): TemplateName[] {
        return Array.from(this.templates.keys())
    }
}

export const templateRegistry = new TemplateRegistry(TEMPLATES)
