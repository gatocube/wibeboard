/**
 * WidgetSelector — popup for choosing which widget to place.
 *
 * Shows widget icons grouped by category, with search filtering.
 * Renders inside NodeToolbar of PlaceholderNode.
 *
 * Streamlined from magnetic-filament's WidgetSelector.tsx.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { widgetRegistry, type WidgetDefinition, type WidgetTemplate, type WidgetCategory } from '@/engine/widget-registry'

const CATEGORY_COLORS: Record<string, string> = {
    AI: '#8b5cf6',
    Script: '#f7df1e',
    Layout: '#6366f1',
}

interface WidgetSelectorProps {
    rectSize: { width: number; height: number }
    gridSize?: { cols: number; rows: number }
    onSelect: (widget: WidgetDefinition, template: WidgetTemplate) => void
    onCancel: () => void
    onHoverWidget?: (widget: WidgetDefinition | null) => void
    embedded?: boolean
}

export function WidgetSelector({
    rectSize,
    gridSize,
    onSelect,
    onCancel,
    onHoverWidget,
    embedded,
}: WidgetSelectorProps) {
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'All'>('All')
    const [expandedWidget, setExpandedWidget] = useState<string | null>(null)
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

    // Filter widgets
    const allWidgets = widgetRegistry.getAll()
    const categories = widgetRegistry.getCategories()
    let filtered = selectedCategory === 'All'
        ? allWidgets
        : allWidgets.filter(w => w.category === selectedCategory)
    if (search) {
        filtered = widgetRegistry.search(search).filter(w =>
            selectedCategory === 'All' || w.category === selectedCategory
        )
    }

    const containerStyle: React.CSSProperties = embedded
        ? { position: 'relative' }
        : { position: 'fixed', zIndex: 1000 }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
                ...containerStyle,
                width: 240,
                maxHeight: 360,
                background: 'rgba(15,15,26,0.95)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 12,
                backdropFilter: 'blur(12px)',
                padding: '8px 0',
                fontFamily: 'Inter',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.1)',
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
        >
            {/* Header */}
            <div style={{ padding: '4px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📦</span>
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
                    onChange={e => setSearch(e.target.value)}
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

                {/* Category tabs */}
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                    {(['All', ...categories] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '2px 8px', borderRadius: 4, border: 'none',
                                background: selectedCategory === cat ? 'rgba(139,92,246,0.2)' : 'transparent',
                                color: selectedCategory === cat ? '#8b5cf6' : '#64748b',
                                fontSize: 9, fontWeight: 500, cursor: 'pointer',
                                fontFamily: 'Inter',
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Widget list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
                <AnimatePresence>
                    {filtered.map(widget => (
                        <motion.div
                            key={widget.type}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            layout
                        >
                            <div
                                data-testid={`widget-${widget.type}`}
                                style={{
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={() => {
                                    onHoverWidget?.(widget)
                                    if (widget.templates.length <= 1) setExpandedWidget(null)
                                }}
                                onMouseLeave={() => onHoverWidget?.(null)}
                                onClick={() => {
                                    if (widget.templates.length === 1) {
                                        onSelect(widget, widget.templates[0])
                                    } else {
                                        setExpandedWidget(expandedWidget === widget.type ? null : widget.type)
                                    }
                                }}
                                onMouseOver={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)'
                                }}
                                onMouseOut={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                                }}
                            >
                                <span style={{ fontSize: 16 }}>{widget.icon}</span>
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
                                                    onSelect(widget, tmpl)
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
                    ))}
                </AnimatePresence>

                {filtered.length === 0 && (
                    <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 9, color: '#475569' }}>
                        No widgets match "{search}"
                    </div>
                )}
            </div>
        </motion.div>
    )
}
