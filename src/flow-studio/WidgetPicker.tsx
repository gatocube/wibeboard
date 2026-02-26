/**
 * WidgetPicker — sidebar / popup for choosing which widget to place.
 *
 * Layout:
 *  1. Recently used tiles (icon grid)
 *  2. Category tiles row (AI, Script, Expectation, Note)
 *  3. Full widget list (searchable)
 *
 * Renamed from WidgetSelector.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { widgetRegistry, type WidgetDefinition, type WidgetTemplate, type WidgetCategory } from '@/engine/widget-registry'
import { WidgetIcon, CATEGORY_ICONS } from '@/components/WidgetIcon'
import { Package } from 'lucide-react'

// ── Category visual config ──────────────────────────────────────────────────────

interface CategoryTile {
    label: string
    key: WidgetCategory | string
    color: string
    description: string
}

const CATEGORY_TILES: CategoryTile[] = [
    { label: 'AI', key: 'AI', color: '#8b5cf6', description: 'Agents & LLMs' },
    { label: 'Script', key: 'Script', color: '#f7df1e', description: 'Code runners' },
    { label: 'Expectation', key: 'Expectation', color: '#10b981', description: 'Assertions' },
    { label: 'Note', key: 'Note', color: '#f59e0b', description: 'Annotations' },
]

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
    CATEGORY_TILES.map(c => [c.key, c.color])
)

// ── Persistent recent widgets (localStorage) ────────────────────────────────────

const RECENT_KEY = 'wibeboard:recent-widgets'
const MAX_RECENT = 6

function getRecentTypes(): string[] {
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    } catch { return [] }
}

function pushRecent(type: string) {
    const list = getRecentTypes().filter(t => t !== type)
    list.unshift(type)
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)))
}

// ── Component ────────────────────────────────────────────────────────────────────

interface WidgetPickerProps {
    rectSize: { width: number; height: number }
    gridSize?: { cols: number; rows: number }
    onSelect: (widget: WidgetDefinition, template: WidgetTemplate) => void
    onCancel: () => void
    onHoverWidget?: (widget: WidgetDefinition | null) => void
    embedded?: boolean
    /** Compact tile view — renders all widgets as icon tiles instead of a list */
    compact?: boolean
}

export function WidgetPicker({
    rectSize,
    gridSize,
    onSelect,
    onCancel,
    onHoverWidget,
    embedded,
    compact,
}: WidgetPickerProps) {
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | string | null>(null)
    const [expandedWidget, setExpandedWidget] = useState<string | null>(null)
    const [recentTypes, setRecentTypes] = useState<string[]>(getRecentTypes)
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus search on mount
    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 100)
        return () => clearTimeout(t)
    }, [])

    // ESC to cancel
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onCancel() }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onCancel])

    // ── Data ──
    const allWidgets = widgetRegistry.getAll()

    // Recently used widgets
    const recentWidgets = recentTypes
        .map(t => allWidgets.find(w => w.type === t))
        .filter(Boolean) as WidgetDefinition[]

    // Filtered widgets for the list
    let filtered = selectedCategory
        ? allWidgets.filter(w => w.category === selectedCategory)
        : allWidgets
    if (search) {
        filtered = widgetRegistry.search(search).filter(w =>
            !selectedCategory || w.category === selectedCategory
        )
    }

    // ── Handlers ──
    const handleSelect = (widget: WidgetDefinition, template: WidgetTemplate) => {
        pushRecent(widget.type)
        setRecentTypes(getRecentTypes())
        onSelect(widget, template)
    }

    const handleWidgetClick = (widget: WidgetDefinition) => {
        if (widget.templates.length === 1 || compact) {
            handleSelect(widget, widget.templates[0])
        } else {
            setExpandedWidget(expandedWidget === widget.type ? null : widget.type)
        }
    }

    const containerStyle: React.CSSProperties = embedded
        ? { position: 'relative' }
        : { position: 'fixed', zIndex: 1000 }

    const isSearching = search.length > 0

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
                ...containerStyle,
                width: 260,
                ...(embedded ? { height: '100%' } : { maxHeight: 420 }),
                background: 'rgba(15,15,26,0.95)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: embedded ? 0 : 12,
                backdropFilter: 'blur(12px)',
                padding: '8px 0',
                fontFamily: 'Inter',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: embedded ? 'none' : '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.1)',
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
        >
            {/* ── Header ── */}
            <div style={{ padding: '4px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={12} color="#8b5cf6" />
                    <span>Pick a widget</span>
                    {gridSize && (
                        <span style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginLeft: 'auto' }}>
                            {gridSize.cols}×{gridSize.rows} · {rectSize.width}×{rectSize.height}px
                        </span>
                    )}
                </div>

                {/* Search */}
                <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setSelectedCategory(null) }}
                    placeholder="Search widgets..."
                    style={{
                        width: '100%', padding: '4px 8px', borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.04)',
                        color: '#e2e8f0', fontSize: 10, outline: 'none',
                        fontFamily: 'Inter',
                        boxSizing: 'border-box',
                    }}
                />
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>

                {/* ── 1. Recently used tiles ── */}
                {!isSearching && recentWidgets.length > 0 && (
                    <div style={{ padding: '4px 12px 8px' }}>
                        <div style={{
                            fontSize: 8, fontWeight: 600, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            marginBottom: 6,
                        }}>
                            Recent
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {recentWidgets.map(widget => (
                                <div
                                    key={widget.type}
                                    data-testid={`recent-${widget.type}`}
                                    title={widget.label}
                                    draggable
                                    onDragStart={e => {
                                        e.dataTransfer.setData('application/flowstudio-widget', JSON.stringify({
                                            type: widget.type, template: widget.templates[0],
                                        }))
                                        e.dataTransfer.effectAllowed = 'move'
                                    }}
                                    onClick={() => handleWidgetClick(widget)}
                                    onMouseEnter={() => onHoverWidget?.(widget)}
                                    onMouseLeave={() => onHoverWidget?.(null)}
                                    style={{
                                        width: 36, height: 36, borderRadius: 8,
                                        background: `${widget.color}15`,
                                        border: `1px solid ${widget.color}33`,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        gap: 1,
                                    }}
                                    onMouseOver={e => {
                                        (e.currentTarget as HTMLElement).style.background = `${widget.color}25`
                                            ; (e.currentTarget as HTMLElement).style.borderColor = `${widget.color}55`
                                            ; (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'
                                    }}
                                    onMouseOut={e => {
                                        (e.currentTarget as HTMLElement).style.background = `${widget.color}15`
                                            ; (e.currentTarget as HTMLElement).style.borderColor = `${widget.color}33`
                                            ; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                                    }}
                                >
                                    <WidgetIcon type={widget.icon} size={14} />
                                    <span style={{ fontSize: 6, color: '#94a3b8', fontWeight: 600, lineHeight: 1 }}>
                                        {widget.label.length > 5 ? widget.label.slice(0, 5) : widget.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 2. Category tiles (hidden in compact mode) ── */}
                {!isSearching && !compact && (
                    <div style={{
                        padding: '4px 12px 8px',
                        borderTop: recentWidgets.length > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                        <div style={{
                            fontSize: 8, fontWeight: 600, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            marginBottom: 6,
                        }}>
                            Categories
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
                            {CATEGORY_TILES.map(cat => {
                                const isActive = selectedCategory === cat.key
                                return (
                                    <div
                                        key={cat.key}
                                        data-testid={`category-${cat.key.toLowerCase()}`}
                                        onClick={() => setSelectedCategory(isActive ? null : cat.key as WidgetCategory)}
                                        style={{
                                            padding: '8px 4px', borderRadius: 8,
                                            background: isActive ? `${cat.color}20` : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${isActive ? `${cat.color}44` : 'rgba(255,255,255,0.06)'}`,
                                            cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', gap: 3,
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseOver={e => {
                                            if (!isActive) {
                                                (e.currentTarget as HTMLElement).style.background = `${cat.color}10`
                                                    ; (e.currentTarget as HTMLElement).style.borderColor = `${cat.color}33`
                                            }
                                        }}
                                        onMouseOut={e => {
                                            if (!isActive) {
                                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                                                    ; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                                            }
                                        }}
                                    >
                                        {(() => { const CatIcon = CATEGORY_ICONS[cat.key] || Package; return <CatIcon size={14} color={isActive ? cat.color : '#94a3b8'} /> })()}
                                        <div style={{
                                            fontSize: 8, fontWeight: 600,
                                            color: isActive ? cat.color : '#94a3b8',
                                        }}>
                                            {cat.label}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── 3. Widget list / compact tile grid ── */}
                <div style={{
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    paddingTop: 4,
                }}>
                    {!isSearching && !selectedCategory && (
                        <div style={{
                            fontSize: 8, fontWeight: 600, color: '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            padding: '4px 12px 2px',
                        }}>
                            {compact ? 'Widgets' : 'All widgets'}
                        </div>
                    )}
                    {selectedCategory && (
                        <div style={{
                            fontSize: 8, fontWeight: 600, color: CATEGORY_COLORS[selectedCategory] || '#64748b',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            padding: '4px 12px 2px',
                            display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                            <span>{selectedCategory}</span>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                style={{
                                    border: 'none', background: 'rgba(255,255,255,0.06)',
                                    color: '#64748b', fontSize: 7, padding: '1px 5px',
                                    borderRadius: 3, cursor: 'pointer', fontFamily: 'Inter',
                                }}
                            >
                                ✕ clear
                            </button>
                        </div>
                    )}

                    {compact ? (
                        /* ── Compact tile grid — one tile per template/preset ── */
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '6px 12px' }}>
                            {filtered.flatMap(widget =>
                                widget.templates.map((tmpl, i) => {
                                    const label = widget.templates.length === 1
                                        ? widget.label
                                        : tmpl.name
                                    const truncLabel = label.length > 7 ? label.slice(0, 7) : label
                                    return (
                                        <div
                                            key={`${widget.type}-${i}`}
                                            data-testid={`widget-${widget.type}${widget.templates.length > 1 ? `-${i}` : ''}`}
                                            title={`${widget.label}${widget.templates.length > 1 ? ` — ${tmpl.name}` : ''}: ${tmpl.description}`}
                                            draggable
                                            onDragStart={e => {
                                                e.dataTransfer.setData('application/flowstudio-widget', JSON.stringify({
                                                    type: widget.type, template: tmpl,
                                                }))
                                                e.dataTransfer.effectAllowed = 'move'
                                            }}
                                            onClick={() => handleSelect(widget, tmpl)}
                                            onMouseEnter={() => onHoverWidget?.(widget)}
                                            onMouseLeave={() => onHoverWidget?.(null)}
                                            style={{
                                                width: 48, height: 48, borderRadius: 8,
                                                background: `${widget.color}15`,
                                                border: `1px solid ${widget.color}33`,
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                                gap: 2,
                                            }}
                                            onMouseOver={e => {
                                                (e.currentTarget as HTMLElement).style.background = `${widget.color}25`
                                                    ; (e.currentTarget as HTMLElement).style.borderColor = `${widget.color}55`
                                                    ; (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'
                                            }}
                                            onMouseOut={e => {
                                                (e.currentTarget as HTMLElement).style.background = `${widget.color}15`
                                                    ; (e.currentTarget as HTMLElement).style.borderColor = `${widget.color}33`
                                                    ; (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                                            }}
                                        >
                                            <WidgetIcon type={tmpl.icon || widget.icon} size={16} />
                                            <span style={{ fontSize: 7, color: '#94a3b8', fontWeight: 600, lineHeight: 1, textAlign: 'center' }}>
                                                {truncLabel}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                            {filtered.length === 0 && (
                                <div style={{ padding: '12px 0', fontSize: 9, color: '#475569', width: '100%', textAlign: 'center' }}>
                                    {search ? `No widgets match "${search}"` : 'No widgets in this category yet'}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ── Standard list view ── */
                        <>
                            <AnimatePresence>
                                {(() => {
                                    // Group by category when showing "All widgets" (no filter, no search)
                                    const showCategoryHeaders = !isSearching && !selectedCategory
                                    let lastCategory = ''

                                    return filtered.map(widget => {
                                        const needsHeader = showCategoryHeaders && widget.category !== lastCategory
                                        lastCategory = widget.category

                                        return (
                                            <motion.div
                                                key={widget.type}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                layout
                                            >
                                                {/* Category header */}
                                                {needsHeader && (
                                                    <div style={{
                                                        padding: '8px 12px 3px',
                                                        fontSize: 8, fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px',
                                                        color: CATEGORY_COLORS[widget.category] || '#64748b',
                                                        borderTop: filtered.indexOf(widget) > 0
                                                            ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                    }}>
                                                        {widget.category}
                                                    </div>
                                                )}

                                                {/* Widget row */}
                                                <div
                                                    data-testid={`widget-${widget.type}`}
                                                    draggable
                                                    onDragStart={e => {
                                                        e.dataTransfer.setData('application/flowstudio-widget', JSON.stringify({
                                                            type: widget.type, template: widget.templates[0],
                                                        }))
                                                        e.dataTransfer.effectAllowed = 'move'
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        cursor: 'grab',
                                                        display: 'flex', alignItems: 'center', gap: 8,
                                                        transition: 'background 0.1s',
                                                    }}
                                                    onMouseEnter={() => {
                                                        onHoverWidget?.(widget)
                                                        if (widget.templates.length <= 1) setExpandedWidget(null)
                                                    }}
                                                    onMouseLeave={() => onHoverWidget?.(null)}
                                                    onClick={() => handleWidgetClick(widget)}
                                                    onMouseOver={e => {
                                                        (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)'
                                                    }}
                                                    onMouseOut={e => {
                                                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                                                    }}
                                                >
                                                    {/* Icon button */}
                                                    <div style={{
                                                        width: 28, height: 28,
                                                        borderRadius: 8,
                                                        background: `${widget.color || CATEGORY_COLORS[widget.category] || '#475569'}15`,
                                                        border: `1.5px solid ${widget.color || CATEGORY_COLORS[widget.category] || '#475569'}33`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}>
                                                        <WidgetIcon type={widget.icon} size={14} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 10, fontWeight: 600, color: '#e2e8f0' }}>
                                                            {widget.label}
                                                        </div>
                                                        <div style={{ fontSize: 8, color: '#64748b', lineHeight: 1.3 }}>
                                                            {widget.description}
                                                        </div>
                                                    </div>
                                                    <span style={{
                                                        fontSize: 7, padding: '1px 4px', borderRadius: 3,
                                                        background: `${CATEGORY_COLORS[widget.category] || '#475569'}22`,
                                                        color: CATEGORY_COLORS[widget.category] || '#475569',
                                                        fontWeight: 600,
                                                    }}>
                                                        {widget.category}
                                                    </span>
                                                </div>

                                                {/* Expanded templates */}
                                                <AnimatePresence>
                                                    {expandedWidget === widget.type && widget.templates.length > 1 && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            style={{ overflow: 'hidden', paddingLeft: 36 }}
                                                        >
                                                            {widget.templates.map((tmpl, i) => (
                                                                <div
                                                                    key={i}
                                                                    data-testid={`template-${widget.type}-${i}`}
                                                                    style={{
                                                                        padding: '4px 12px', cursor: 'pointer',
                                                                        fontSize: 9, color: '#94a3b8',
                                                                        borderLeft: `2px solid ${widget.color}33`,
                                                                        transition: 'all 0.1s',
                                                                    }}
                                                                    onClick={e => {
                                                                        e.stopPropagation()
                                                                        handleSelect(widget, tmpl)
                                                                    }}
                                                                    onMouseOver={e => {
                                                                        (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.06)'
                                                                            ; (e.currentTarget as HTMLElement).style.color = '#e2e8f0'
                                                                    }}
                                                                    onMouseOut={e => {
                                                                        (e.currentTarget as HTMLElement).style.background = 'transparent'
                                                                            ; (e.currentTarget as HTMLElement).style.color = '#94a3b8'
                                                                    }}
                                                                >
                                                                    <div style={{ fontWeight: 600 }}>{tmpl.name}</div>
                                                                    <div style={{ fontSize: 8, color: '#64748b' }}>{tmpl.description}</div>
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )
                                    })
                                })()}
                            </AnimatePresence>

                            {filtered.length === 0 && (
                                <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 9, color: '#475569' }}>
                                    {search ? `No widgets match "${search}"` : 'No widgets in this category yet'}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
