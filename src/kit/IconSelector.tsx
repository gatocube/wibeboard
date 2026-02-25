/**
 * IconSelector — unified searchable icon picker.
 *
 * Includes ALL icons from the icon registry:
 *  - Widget type icons (Lucide)
 *  - Status icons
 *  - UI icons
 *  - Animated icons (framer-motion)
 *  - Tech logo icons (custom SVG)
 *  - Animated tech icons (custom SVG + motion)
 *
 * Features:
 *  - Search by name or tags
 *  - Quick filter tabs: All, Animated, SVG, Widget, Status, Action
 *  - Click to select
 *  - iPad-friendly 44px touch targets
 */

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import {
    WidgetIcon, getAllIconEntries, AnimatedIcon,
    STATUS_ICONS, STATUS_COLORS,
    type AnimatedIconName,
} from '@/components/WidgetIcon'
import {
    TechIcon, AnimatedTechIcon,
    ALL_TECH_ICONS, ALL_ANIMATED_TECH_ICONS,
    TECH_COLORS, ANIMATED_TECH_COLORS,
} from '@/components/TechIcons'

// ── Unified icon entry ──────────────────────────────────────────────────────────

interface UnifiedIcon {
    id: string
    label: string
    color: string
    /** 'svg' = custom SVG tech icon, 'lucide' = Lucide font icon, 'animated' = motion icon */
    iconType: 'lucide' | 'svg' | 'animated'
    category: string
    tags: string[]
    animated: boolean
    /** Render function */
    render: (size: number) => React.ReactNode
}

// ── Tag database ────────────────────────────────────────────────────────────────

const ICON_TAGS: Record<string, string[]> = {
    'agent': ['ai', 'llm', 'sparkle', 'magic', 'bot'],
    'script-js': ['javascript', 'code', 'terminal', 'node'],
    'script-ts': ['typescript', 'code', 'terminal', 'node'],
    'script-sh': ['bash', 'shell', 'code', 'terminal', 'cli'],
    'script-py': ['python', 'code', 'terminal', 'snake'],
    'bot': ['robot', 'automation', 'ai'],
    'api': ['web', 'http', 'rest', 'endpoint', 'globe'],
    'webhook': ['trigger', 'event', 'zap', 'lightning'],
    'workflow': ['flow', 'process', 'pipeline', 'subflow'],
    'database': ['db', 'storage', 'sql', 'data'],
    'cloud': ['aws', 'gcp', 'azure', 'hosting'],
    'lock': ['security', 'auth', 'password', 'private'],
    'unlock': ['open', 'public', 'access'],
    'bell': ['notification', 'alert', 'remind'],
    'heart': ['favorite', 'like', 'love'],
    'star': ['bookmark', 'rating', 'featured'],
    'rocket': ['deploy', 'launch', 'fast', 'startup'],
    'send': ['email', 'message', 'mail'],
    'sync': ['refresh', 'reload', 'update'],
    'activity': ['health', 'monitor', 'pulse'],
    'target': ['goal', 'aim', 'focus'],
    'sleep': ['wait', 'delay', 'pause', 'timer', 'hourglass'],
    'starting': ['start', 'begin', 'entry', 'play', 'run'],
    'subflow': ['nested', 'child', 'subprocess'],
    'group': ['container', 'layout', 'package', 'folder'],
    'expectation': ['test', 'assert', 'check', 'verify'],
    'note': ['sticky', 'comment', 'annotation'],
}

// ── Build unified icon list ─────────────────────────────────────────────────────

function buildAllIcons(): UnifiedIcon[] {
    const icons: UnifiedIcon[] = []

    // 1. Widget type icons (Lucide)
    for (const entry of getAllIconEntries()) {
        icons.push({
            id: entry.type,
            label: entry.type,
            color: entry.color,
            iconType: 'lucide',
            category: getCat(entry.type),
            tags: ICON_TAGS[entry.type] || [],
            animated: false,
            render: (size) => <WidgetIcon type={entry.type} size={size} />,
        })
    }

    // 2. Status icons (Lucide)
    for (const [key, Icon] of Object.entries(STATUS_ICONS)) {
        if (icons.find(i => i.id === key)) continue // skip duplicates
        icons.push({
            id: `status-${key}`,
            label: key,
            color: STATUS_COLORS[key] || '#8b5cf6',
            iconType: 'lucide',
            category: 'Status',
            tags: ['status', key],
            animated: false,
            render: (size) => <Icon size={size} color={STATUS_COLORS[key] || '#8b5cf6'} />,
        })
    }

    // 3. Animated icons (framer-motion)
    const animatedNames: AnimatedIconName[] = [
        'spinner', 'pulse', 'thinking', 'loading-dots', 'processing', 'success', 'error-shake',
        'radar', 'data-stream', 'heartbeat', 'orbit', 'wave', 'typing',
        'sync', 'download', 'signal', 'hourglass', 'ripple', 'scan-line',
        'progress-ring', 'progress-bar', 'loading-wave', 'bounce',
        'progress-dots', 'pixel-load',
        'alert-flash', 'check-bounce', 'traffic-light',
        'gear-spin', 'upload-pulse', 'search-scan', 'clock-tick', 'terminal-blink', 'rewind',
        'waveform', 'radio-wave', 'matrix-rain', 'stack-build',
        'crossfade', 'dna-helix', 'fire-flicker', 'lightning-bolt', 'magnet-pull',
        'sparkle-burst', 'morse-code', 'pendulum', 'ping-pong', 'satellite', 'telescope',
    ]
    const animColors: Record<string, string> = {
        'spinner': '#3b82f6', 'pulse': '#22c55e', 'thinking': '#8b5cf6',
        'loading-dots': '#f59e0b', 'processing': '#06b6d4', 'success': '#22c55e',
        'error-shake': '#ef4444', 'radar': '#06b6d4', 'data-stream': '#8b5cf6',
        'heartbeat': '#ef4444', 'orbit': '#f59e0b', 'wave': '#22c55e',
        'typing': '#94a3b8', 'sync': '#06b6d4', 'download': '#22c55e',
        'signal': '#8b5cf6', 'hourglass': '#f59e0b', 'ripple': '#3b82f6',
        'scan-line': '#22c55e', 'progress-ring': '#3b82f6', 'progress-bar': '#8b5cf6',
        'loading-wave': '#06b6d4', 'bounce': '#f59e0b', 'progress-dots': '#22c55e',
        'pixel-load': '#8b5cf6', 'alert-flash': '#ef4444', 'check-bounce': '#22c55e',
        'traffic-light': '#f59e0b', 'gear-spin': '#64748b', 'upload-pulse': '#3b82f6',
        'search-scan': '#f59e0b', 'clock-tick': '#94a3b8', 'terminal-blink': '#22c55e',
        'rewind': '#8b5cf6', 'waveform': '#06b6d4', 'radio-wave': '#8b5cf6',
        'matrix-rain': '#22c55e', 'stack-build': '#f59e0b', 'crossfade': '#3b82f6',
        'dna-helix': '#8b5cf6', 'fire-flicker': '#f97316', 'lightning-bolt': '#fbbf24',
        'magnet-pull': '#ef4444', 'sparkle-burst': '#c084fc', 'morse-code': '#22c55e',
        'pendulum': '#f59e0b', 'ping-pong': '#3b82f6', 'satellite': '#06b6d4',
        'telescope': '#8b5cf6',
    }
    for (const name of animatedNames) {
        const c = animColors[name] || '#8b5cf6'
        icons.push({
            id: `anim-${name}`,
            label: name,
            color: c,
            iconType: 'animated',
            category: 'Animated',
            tags: ['animated', 'motion', name.replace(/-/g, ' ')],
            animated: true,
            render: (size) => <AnimatedIcon name={name} size={size} color={c} />,
        })
    }

    // 4. Tech logos (custom SVG)
    for (const name of ALL_TECH_ICONS) {
        const c = TECH_COLORS[name] || '#8b5cf6'
        icons.push({
            id: `tech-${name}`,
            label: name,
            color: c,
            iconType: 'svg',
            category: 'Tech',
            tags: ['tech', 'logo', 'svg', name],
            animated: false,
            render: (size) => <TechIcon name={name} size={size} />,
        })
    }

    // 5. Animated tech icons (custom SVG + motion)
    for (const icon of ALL_ANIMATED_TECH_ICONS) {
        const c = ANIMATED_TECH_COLORS[icon.name] || icon.color
        icons.push({
            id: `atech-${icon.name}`,
            label: icon.name,
            color: c,
            iconType: 'svg',
            category: 'Tech',
            tags: ['tech', 'animated', 'svg', 'motion', icon.name.replace(/-/g, ' '), icon.label.toLowerCase()],
            animated: true,
            render: (size) => <AnimatedTechIcon name={icon.name} size={size} color={c} />,
        })
    }

    return icons
}

function getCat(type: string): string {
    if (type.startsWith('script-')) return 'Script'
    if (['agent', 'bot'].includes(type)) return 'AI'
    if (['play', 'starting', 'sleep', 'timer', 'clock'].includes(type)) return 'Status'
    if (['send', 'download', 'upload', 'sync', 'rocket', 'search'].includes(type)) return 'Action'
    return 'Widget'
}

// ── Quick filter tabs ───────────────────────────────────────────────────────────

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'animated', label: '✦ Animated' },
    { key: 'svg', label: 'SVG' },
    { key: 'lucide', label: 'Lucide' },
    { key: 'Widget', label: 'Widget' },
    { key: 'Status', label: 'Status' },
    { key: 'Action', label: 'Action' },
    { key: 'Tech', label: 'Tech' },
    { key: 'AI', label: 'AI' },
    { key: 'Script', label: 'Script' },
]

// ── Props ────────────────────────────────────────────────────────────────────────

interface IconSelectorProps {
    onSelect?: (id: string, color: string) => void
    selected?: string
    height?: number
}

// ── Component ────────────────────────────────────────────────────────────────────

export function IconSelector({ onSelect, selected, height = 400 }: IconSelectorProps) {
    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState('all')

    const allIcons = useMemo(() => buildAllIcons(), [])

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim()
        return allIcons.filter(icon => {
            // Filter by tab
            if (filter === 'animated' && !icon.animated) return false
            if (filter === 'svg' && icon.iconType !== 'svg') return false
            if (filter === 'lucide' && icon.iconType !== 'lucide') return false
            if (['Widget', 'Status', 'Action', 'Tech', 'AI', 'Script', 'Animated'].includes(filter)
                && icon.category !== filter) return false

            // Text search
            if (!q) return true
            if (icon.id.toLowerCase().includes(q)) return true
            if (icon.label.toLowerCase().includes(q)) return true
            return icon.tags.some(tag => tag.includes(q))
        })
    }, [allIcons, query, filter])

    return (
        <div
            data-testid="icon-selector"
            style={{
                width: '100%',
                height,
                display: 'flex', flexDirection: 'column',
                background: 'rgba(15,15,26,0.95)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                overflow: 'hidden',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            {/* Search bar */}
            <div style={{
                padding: '10px 12px 6px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8, padding: '0 10px',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <Search size={14} color="#475569" />
                    <input
                        data-testid="icon-search"
                        type="text"
                        placeholder="Search icons by name or tag..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{
                            flex: 1,
                            border: 'none', outline: 'none',
                            background: 'transparent',
                            color: '#e2e8f0',
                            fontSize: 11,
                            padding: '8px 0',
                            fontFamily: 'Inter, sans-serif',
                            minHeight: 36,
                        }}
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            style={{
                                background: 'none', border: 'none',
                                cursor: 'pointer', padding: 2,
                                display: 'flex',
                            }}
                        >
                            <X size={12} color="#475569" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter tabs */}
            <div style={{
                display: 'flex', gap: 4,
                padding: '6px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                overflowX: 'auto',
            }}>
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        data-testid={`icon-filter-${f.key}`}
                        onClick={() => setFilter(f.key)}
                        style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: filter === f.key
                                ? 'rgba(139,92,246,0.15)'
                                : 'transparent',
                            color: filter === f.key ? '#c084fc' : '#64748b',
                            fontSize: 10, fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            minHeight: 28,
                            transition: 'all 0.15s',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Icon grid */}
            <div style={{
                flex: 1, overflow: 'auto',
                padding: 12,
            }}>
                {filtered.length === 0 ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: '100%', color: '#334155', fontSize: 11,
                    }}>
                        No icons match "{query}"
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
                        gap: 6,
                    }}>
                        {filtered.map(icon => (
                            <IconTile
                                key={icon.id}
                                icon={icon}
                                isSelected={selected === icon.id}
                                onSelect={() => onSelect?.(icon.id, icon.color)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '6px 12px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                fontSize: 9, color: '#475569',
                display: 'flex', justifyContent: 'space-between',
            }}>
                <span>{filtered.length} of {allIcons.length} icons</span>
                <span>
                    {allIcons.filter(i => i.animated).length} animated · {allIcons.filter(i => i.iconType === 'svg').length} SVG · {allIcons.filter(i => i.iconType === 'lucide').length} Lucide
                </span>
            </div>
        </div>
    )
}

// ── Icon tile ───────────────────────────────────────────────────────────────────

function IconTile({ icon, isSelected, onSelect }: {
    icon: UnifiedIcon
    isSelected: boolean
    onSelect: () => void
}) {
    const [hovered, setHovered] = useState(false)
    const active = isSelected || hovered

    return (
        <button
            data-testid={`icon-tile-${icon.id}`}
            onClick={onSelect}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4,
                padding: 8,
                minHeight: 56,
                borderRadius: 8,
                border: isSelected
                    ? `1.5px solid ${icon.color}66`
                    : `1px solid ${active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                background: isSelected
                    ? `${icon.color}15`
                    : active
                        ? 'rgba(255,255,255,0.04)'
                        : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.12s',
                fontFamily: 'Inter, sans-serif',
                position: 'relative',
            }}
        >
            {/* Animated badge */}
            {icon.animated && (
                <div style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 4px rgba(34,197,94,0.5)',
                }} />
            )}
            {/* SVG badge */}
            {icon.iconType === 'svg' && !icon.animated && (
                <div style={{
                    position: 'absolute', top: 2, right: 2,
                    fontSize: 5, fontWeight: 700, color: '#64748b',
                    letterSpacing: 0.3,
                }}>
                    SVG
                </div>
            )}
            {icon.render(20)}
            <span style={{
                fontSize: 7, fontWeight: 500,
                color: active ? icon.color : '#64748b',
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}>
                {icon.label}
            </span>
        </button>
    )
}
