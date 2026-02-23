/**
 * WidgetIcon — centralized icon registry for widget types.
 *
 * Maps widget type strings to Lucide React icon components.
 * Replaces scattered emoji usage with consistent SVG icons.
 * Includes animated variants for loading/active states.
 *
 * Usage:
 *   <WidgetIcon type="agent" size={16} />
 *   <WidgetIcon type="script-js" size={16} color="#f7df1e" />
 *   <AnimatedIcon name="spinner" size={20} />
 */

import { motion } from 'framer-motion'
import {
    Sparkles,
    Terminal,
    Package,
    CheckCircle2,
    StickyNote,
    Cpu,
    // Extended icons
    Bot,
    Braces,
    Code2,
    FileCode2,
    FileText,
    FolderTree,
    GitBranch,
    GitPullRequest,
    Globe,
    Hash,
    Layers,
    ListChecks,
    MessageSquare,
    Network,
    Play,
    Puzzle,
    Shield,
    Workflow,
    Zap,
    // Status icons
    AlertTriangle,
    CheckCircle,
    Circle,
    CircleDot,
    Loader2,
    Timer,
    XCircle,
    type LucideProps,
} from 'lucide-react'

// ── Icon mapping ────────────────────────────────────────────────────────────────

export type WidgetIconName =
    | 'agent' | 'script-js' | 'script-ts' | 'script-sh' | 'script-py'
    | 'group' | 'expectation' | 'note'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
    // Core widget types
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
    // Extended node types
    'bot': Bot,
    'api': Globe,
    'webhook': Zap,
    'workflow': Workflow,
    'function': Braces,
    'code': Code2,
    'file': FileCode2,
    'doc': FileText,
    'folder': FolderTree,
    'branch': GitBranch,
    'pr': GitPullRequest,
    'chat': MessageSquare,
    'network': Network,
    'puzzle': Puzzle,
    'shield': Shield,
    'checklist': ListChecks,
    'hash': Hash,
    'layer': Layers,
    'play': Play,
}

// Default colors per widget type
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
    // Extended
    'bot': '#8b5cf6',
    'api': '#06b6d4',
    'webhook': '#f97316',
    'workflow': '#a855f7',
    'function': '#ec4899',
    'code': '#60a5fa',
    'file': '#3b82f6',
    'doc': '#94a3b8',
    'folder': '#f59e0b',
    'branch': '#22c55e',
    'pr': '#22c55e',
    'chat': '#06b6d4',
    'network': '#8b5cf6',
    'puzzle': '#f59e0b',
    'shield': '#ef4444',
    'checklist': '#10b981',
    'hash': '#6366f1',
    'layer': '#a855f7',
    'play': '#22c55e',
}

// Category icons
export const CATEGORY_ICONS: Record<string, React.ComponentType<LucideProps>> = {
    'AI': Sparkles,
    'Script': Terminal,
    'Expectation': CheckCircle2,
    'Note': StickyNote,
    'Layout': Package,
    'Integration': Globe,
    'Workflow': Workflow,
    'Dev': Code2,
}

// ── Status icons (for node states) ──────────────────────────────────────────────

export const STATUS_ICONS: Record<string, React.ComponentType<LucideProps>> = {
    'idle': Circle,
    'pending': CircleDot,
    'running': Loader2,
    'done': CheckCircle,
    'error': XCircle,
    'warning': AlertTriangle,
    'timer': Timer,
}

export const STATUS_COLORS: Record<string, string> = {
    'idle': '#64748b',
    'pending': '#f59e0b',
    'running': '#3b82f6',
    'done': '#22c55e',
    'error': '#ef4444',
    'warning': '#f97316',
    'timer': '#8b5cf6',
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

// ── Animated Icons ──────────────────────────────────────────────────────────────

export type AnimatedIconName = 'spinner' | 'pulse' | 'thinking' | 'loading-dots' | 'processing' | 'success' | 'error-shake'

interface AnimatedIconProps {
    name: AnimatedIconName
    size?: number
    color?: string
    style?: React.CSSProperties
}

/** Animated icon component for loading and status states */
export function AnimatedIcon({ name, size = 16, color = '#8b5cf6', style }: AnimatedIconProps) {
    switch (name) {
        case 'spinner':
            return (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex', ...style }}
                >
                    <Loader2 size={size} color={color} />
                </motion.div>
            )

        case 'pulse':
            return (
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ display: 'inline-flex', ...style }}
                >
                    <Circle size={size} color={color} fill={color} />
                </motion.div>
            )

        case 'thinking':
            return (
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ display: 'inline-flex', ...style }}
                >
                    <Sparkles size={size} color={color} />
                </motion.div>
            )

        case 'loading-dots':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.25, alignItems: 'center', ...style }}>
                    {[0, 1, 2].map(i => (
                        <motion.div
                            key={i}
                            animate={{ y: [0, -(size * 0.3), 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                            style={{
                                width: size * 0.2, height: size * 0.2,
                                borderRadius: '50%', background: color,
                            }}
                        />
                    ))}
                </div>
            )

        case 'processing':
            return (
                <motion.div
                    animate={{ rotate: [0, 180, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-flex', ...style }}
                >
                    <Cpu size={size} color={color} />
                </motion.div>
            )

        case 'success':
            return (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ display: 'inline-flex', ...style }}
                >
                    <CheckCircle size={size} color={color} />
                </motion.div>
            )

        case 'error-shake':
            return (
                <motion.div
                    animate={{ x: [0, -3, 3, -3, 3, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    style={{ display: 'inline-flex', ...style }}
                >
                    <XCircle size={size} color={color} />
                </motion.div>
            )

        default:
            return <Cpu size={size} color={color} style={style} />
    }
}

// ── Utility ─────────────────────────────────────────────────────────────────────

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
    return Object.entries(ICON_MAP).map(([type, component]) => ({
        name: component.displayName || type,
        type,
        component,
        color: WIDGET_ICON_COLORS[type] || '#8b5cf6',
        category: type.startsWith('script-') ? 'Script' : type.startsWith('note-') ? 'Note' : 'Widget',
    }))
}
