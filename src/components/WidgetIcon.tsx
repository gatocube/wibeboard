/**
 * WidgetIcon — centralized icon registry for widget types.
 *
 * Maps widget type strings to Lucide React icon components.
 * Replaces scattered emoji usage with consistent SVG icons.
 *
 * Usage:
 *   <WidgetIcon type="agent" size={16} />
 *   <WidgetIcon type="script-js" size={16} color="#f7df1e" />
 */

import {
    Sparkles,
    Terminal,
    Package,
    CheckCircle2,
    StickyNote,
    Cpu,
    type LucideProps,
} from 'lucide-react'

// ── Icon mapping ────────────────────────────────────────────────────────────────

export type WidgetIconName =
    | 'agent' | 'script-js' | 'script-ts' | 'script-sh' | 'script-py'
    | 'group' | 'expectation' | 'note'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
    'agent': Sparkles,
    'script-js': Terminal,
    'script-ts': Terminal,
    'script-sh': Terminal,
    'script-py': Terminal,
    'group': Package,
    'expectation': CheckCircle2,
    'note': StickyNote,
    'note-sticker': StickyNote,
    'note-group': Package,
    'note-label': StickyNote,
}

// Default colors per widget type (used when no color override is provided)
export const WIDGET_ICON_COLORS: Record<string, string> = {
    'agent': '#8b5cf6',
    'script-js': '#f7df1e',
    'script-ts': '#3178c6',
    'script-sh': '#89e051',
    'script-py': '#3776ab',
    'group': '#6366f1',
    'expectation': '#10b981',
    'note': '#f59e0b',
    'note-sticker': '#fbbf24',
    'note-group': '#6366f1',
    'note-label': '#94a3b8',
}

// Category icons
export const CATEGORY_ICONS: Record<string, React.ComponentType<LucideProps>> = {
    'AI': Sparkles,
    'Script': Terminal,
    'Expectation': CheckCircle2,
    'Note': StickyNote,
    'Layout': Package,
}

// ── Component ────────────────────────────────────────────────────────────────────

interface WidgetIconProps {
    type: string
    size?: number
    color?: string
    className?: string
    style?: React.CSSProperties
}

export function WidgetIcon({ type, size = 16, color, className, style }: WidgetIconProps) {
    const IconComponent = ICON_MAP[type] || Cpu
    const iconColor = color || WIDGET_ICON_COLORS[type] || '#8b5cf6'

    return (
        <IconComponent
            size={size}
            color={iconColor}
            className={className}
            style={style}
        />
    )
}

// ── Utility: get icon component for a type ──────────────────────────────────────

export function getWidgetIconComponent(type: string): React.ComponentType<LucideProps> {
    return ICON_MAP[type] || Cpu
}

// ── All icon entries (for the gallery page) ─────────────────────────────────────

export interface IconEntry {
    name: string
    type: string
    component: React.ComponentType<LucideProps>
    color: string
    category: string
}

export function getAllIconEntries(): IconEntry[] {
    return [
        { name: 'Sparkles', type: 'agent', component: Sparkles, color: '#8b5cf6', category: 'Widget' },
        { name: 'Terminal', type: 'script-js', component: Terminal, color: '#f7df1e', category: 'Widget' },
        { name: 'Terminal', type: 'script-ts', component: Terminal, color: '#3178c6', category: 'Widget' },
        { name: 'Terminal', type: 'script-sh', component: Terminal, color: '#89e051', category: 'Widget' },
        { name: 'Terminal', type: 'script-py', component: Terminal, color: '#3776ab', category: 'Widget' },
        { name: 'Package', type: 'group', component: Package, color: '#6366f1', category: 'Widget' },
        { name: 'CheckCircle2', type: 'expectation', component: CheckCircle2, color: '#10b981', category: 'Widget' },
        { name: 'StickyNote', type: 'note', component: StickyNote, color: '#f59e0b', category: 'Widget' },
    ]
}
