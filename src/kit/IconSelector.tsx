/**
 * IconSelector — reusable icon picker component.
 *
 * Displays all icons from the WidgetIcon registry in a searchable,
 * categorized grid. Click an icon to select it.
 *
 * Features:
 *  - Search by name, type, or tags
 *  - Category filter tabs
 *  - Highlighted selection with color preview
 *  - iPad-friendly 44px touch targets
 */

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { WidgetIcon, getAllIconEntries, type IconEntry } from '@/components/WidgetIcon'

// ── Tag mapping for improved search ─────────────────────────────────────────────

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

// ── Category definitions for filter tabs ────────────────────────────────────────

const CATEGORIES = [
    { key: 'all', label: 'All' },
    { key: 'AI', label: 'AI' },
    { key: 'Script', label: 'Script' },
    { key: 'Widget', label: 'Widget' },
    { key: 'Status', label: 'Status' },
    { key: 'Action', label: 'Action' },
]

function getCategory(type: string): string {
    if (type.startsWith('script-')) return 'Script'
    if (['agent', 'bot'].includes(type)) return 'AI'
    if (['play', 'starting', 'sleep', 'timer', 'clock'].includes(type)) return 'Status'
    if (['send', 'download', 'upload', 'sync', 'rocket', 'search'].includes(type)) return 'Action'
    return 'Widget'
}

// ── Props ────────────────────────────────────────────────────────────────────────

interface IconSelectorProps {
    /** Called when an icon is selected */
    onSelect?: (type: string, color: string) => void
    /** Currently selected icon type */
    selected?: string
    /** Container height (default: 400) */
    height?: number
}

// ── Component ────────────────────────────────────────────────────────────────────

export function IconSelector({ onSelect, selected, height = 400 }: IconSelectorProps) {
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState('all')

    const allIcons = useMemo(() => getAllIconEntries(), [])

    const filtered = useMemo(() => {
        const q = query.toLowerCase().trim()
        return allIcons.filter(entry => {
            // Category filter
            if (category !== 'all' && getCategory(entry.type) !== category) return false
            // Text search
            if (!q) return true
            if (entry.type.toLowerCase().includes(q)) return true
            if (entry.name.toLowerCase().includes(q)) return true
            const tags = ICON_TAGS[entry.type] || []
            return tags.some(tag => tag.includes(q))
        })
    }, [allIcons, query, category])

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
                        placeholder="Search icons..."
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

            {/* Category tabs */}
            <div style={{
                display: 'flex', gap: 4,
                padding: '6px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                overflowX: 'auto',
            }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        data-testid={`icon-cat-${cat.key}`}
                        onClick={() => setCategory(cat.key)}
                        style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: category === cat.key
                                ? 'rgba(139,92,246,0.15)'
                                : 'transparent',
                            color: category === cat.key ? '#c084fc' : '#64748b',
                            fontSize: 10, fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            minHeight: 28,
                            transition: 'all 0.15s',
                            fontFamily: 'Inter, sans-serif',
                        }}
                    >
                        {cat.label}
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
                        {filtered.map(entry => (
                            <IconTile
                                key={entry.type}
                                entry={entry}
                                isSelected={selected === entry.type}
                                onSelect={() => onSelect?.(entry.type, entry.color)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Footer: count */}
            <div style={{
                padding: '6px 12px',
                borderTop: '1px solid rgba(255,255,255,0.04)',
                fontSize: 9, color: '#475569',
                textAlign: 'center',
            }}>
                {filtered.length} of {allIcons.length} icons
            </div>
        </div>
    )
}

// ── Icon tile ───────────────────────────────────────────────────────────────────

function IconTile({ entry, isSelected, onSelect }: {
    entry: IconEntry
    isSelected: boolean
    onSelect: () => void
}) {
    const [hovered, setHovered] = useState(false)
    const active = isSelected || hovered

    return (
        <button
            data-testid={`icon-tile-${entry.type}`}
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
                    ? `1.5px solid ${entry.color}66`
                    : `1px solid ${active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'}`,
                background: isSelected
                    ? `${entry.color}15`
                    : active
                        ? 'rgba(255,255,255,0.04)'
                        : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.12s',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            <WidgetIcon type={entry.type} size={20} />
            <span style={{
                fontSize: 7, fontWeight: 500,
                color: active ? entry.color : '#64748b',
                textAlign: 'center',
                lineHeight: 1.2,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}>
                {entry.type}
            </span>
        </button>
    )
}
