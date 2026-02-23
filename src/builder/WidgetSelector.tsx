import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { widgetRegistry, type WidgetDefinition, type WidgetTemplate, type WidgetCategory } from '@/widgets/widget-registry'
import { Search, X, Clock, ChevronDown } from 'lucide-react'
import { WidgetIcon as WidgetIconComponent, CATEGORY_ICONS as CAT_ICONS } from '@/components/WidgetIcon'
import { Package } from 'lucide-react'

// Category icons are imported from shared WidgetIcon component
// CATEGORY_ICONS is now CAT_ICONS (from '@/components/WidgetIcon')

const CATEGORY_COLORS: Record<WidgetCategory, string> = {
    AI: '#8b5cf6',
    Script: '#f59e0b',
    Expectation: '#10b981',
    Assertion: '#ef4444',
    Note: '#fbbf24',
}

// ── Widget Selector Popup ──────────────────────────────────────────────────────

interface WidgetSelectorProps {
    position: { x: number; y: number }
    rectSize: { width: number; height: number }
    gridSize?: { cols: number; rows: number }
    onSelect: (widget: WidgetDefinition, template: WidgetTemplate) => void
    onCancel: () => void
    onHoverWidget?: (widget: WidgetDefinition | null) => void
    embedded?: boolean // true when rendered inside NodeToolbar (skip fixed positioning)
}

const INITIAL_VISIBLE = 8 // initial visible widgets in "All Widgets"
const LOAD_MORE_COUNT = 8

export function WidgetSelector({ position, rectSize, gridSize, onSelect, onCancel, onHoverWidget, embedded }: WidgetSelectorProps) {
    const [query, setQuery] = useState('')
    const [hoveredWidget, setHoveredWidget] = useState<WidgetDefinition | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | null>(null)
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
    const searchRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Auto-focus search field
    useEffect(() => {
        setTimeout(() => searchRef.current?.focus(), 50)
    }, [])

    // ESC to cancel
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.preventDefault(); onCancel() }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onCancel])

    // Click outside to cancel (only for non-embedded mode)
    useEffect(() => {
        if (embedded) return // NodeToolbar handles this
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onCancel()
            }
        }
        setTimeout(() => window.addEventListener('mousedown', handler), 100)
        return () => window.removeEventListener('mousedown', handler)
    }, [onCancel, embedded])

    // ── Data ──
    const recent = gridSize
        ? widgetRegistry.getRecentForGrid(gridSize.cols, gridSize.rows)
        : widgetRegistry.getRecentForSize(rectSize.width, rectSize.height)
    const showRecent = !query && recent.length > 0

    const categories = widgetRegistry.getCategories()

    // All widgets — filtered by search, category, or grid
    const allWidgets = query
        ? widgetRegistry.search(query)
        : selectedCategory
            ? widgetRegistry.getByCategory(selectedCategory)
            : gridSize
                ? widgetRegistry.getSuggestedForGrid(gridSize.cols, gridSize.rows)
                : widgetRegistry.getAll()

    const visibleWidgets = allWidgets.slice(0, visibleCount)
    const hasMore = allWidgets.length > visibleCount

    const handleHover = useCallback((widget: WidgetDefinition | null) => {
        setHoveredWidget(widget)
        onHoverWidget?.(widget)
    }, [onHoverWidget])

    const handleCategoryClick = (cat: WidgetCategory) => {
        if (selectedCategory === cat) {
            setSelectedCategory(null) // toggle off
        } else {
            setSelectedCategory(cat)
        }
        setVisibleCount(INITIAL_VISIBLE)
    }

    return (
        <motion.div
            ref={containerRef}
            data-widget-selector
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
                ...(embedded
                    ? {} // NodeToolbar handles position
                    : { position: 'fixed' as const, left: position.x, top: position.y }),
                width: 320,
                maxHeight: 460,
                borderRadius: 12,
                background: 'rgba(15,15,30,0.97)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                backdropFilter: 'blur(16px)',
                zIndex: 1000,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: 'Inter',
            }}
        >
            {/* Search bar */}
            <div style={{
                padding: '10px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <Search size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                <input
                    ref={searchRef}
                    value={query}
                    onChange={e => { setQuery(e.target.value); setVisibleCount(INITIAL_VISIBLE) }}
                    placeholder="Search widgets..."
                    style={{
                        flex: 1, border: 'none', outline: 'none',
                        background: 'transparent',
                        color: '#e2e8f0', fontSize: 12,
                        fontFamily: 'Inter',
                    }}
                />
                {query && (
                    <X
                        size={12}
                        style={{ color: '#64748b', cursor: 'pointer' }}
                        onClick={() => { setQuery(''); setVisibleCount(INITIAL_VISIBLE) }}
                    />
                )}
            </div>

            {/* Scrollable content */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '8px 10px',
            }}>
                {/* ── Recently Used ── */}
                {showRecent && (
                    <>
                        <SectionLabel icon={<Clock size={9} />} label="Recently Used" />
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 6, marginBottom: 12,
                        }}>
                            {recent.slice(0, 4).map(widget => (
                                <WidgetIconTile
                                    key={`recent-${widget.type}`}
                                    widget={widget}
                                    onHover={handleHover}
                                    onClick={() => onSelect(widget, widget.templates[0])}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* ── Categories ── */}
                {!query && (
                    <>
                        <SectionLabel label="Categories" />
                        <div style={{
                            display: 'flex', gap: 4, marginBottom: 12,
                            flexWrap: 'wrap',
                        }}>
                            {categories.map(cat => (
                                <motion.button
                                    key={cat}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleCategoryClick(cat)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        border: selectedCategory === cat
                                            ? `1px solid ${CATEGORY_COLORS[cat]}44`
                                            : '1px solid rgba(255,255,255,0.06)',
                                        background: selectedCategory === cat
                                            ? `${CATEGORY_COLORS[cat]}18`
                                            : 'rgba(255,255,255,0.03)',
                                        cursor: 'pointer',
                                        fontSize: 10,
                                        fontWeight: 500,
                                        color: selectedCategory === cat
                                            ? CATEGORY_COLORS[cat]
                                            : '#94a3b8',
                                        fontFamily: 'Inter',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {(() => { const CatI = CAT_ICONS[cat] || Package; return <CatI size={11} color={CATEGORY_COLORS[cat] || '#94a3b8'} /> })()}
                                    {cat}
                                </motion.button>
                            ))}
                        </div>
                    </>
                )}

                {/* ── All / Filtered Widgets ── */}
                <SectionLabel label={
                    query
                        ? `Results (${allWidgets.length})`
                        : selectedCategory
                            ? `${selectedCategory} (${allWidgets.length})`
                            : 'All Widgets'
                } />
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 6,
                }}>
                    {visibleWidgets.map(widget => (
                        <WidgetIconTile
                            key={widget.type}
                            widget={widget}
                            onHover={handleHover}
                            onClick={() => onSelect(widget, widget.templates[0])}
                        />
                    ))}
                </div>

                {/* Show More button */}
                {hasMore && (
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setVisibleCount(v => v + LOAD_MORE_COUNT)}
                        style={{
                            width: '100%',
                            padding: '6px 0',
                            marginTop: 8,
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(255,255,255,0.03)',
                            cursor: 'pointer',
                            fontSize: 9,
                            fontWeight: 500,
                            color: '#8b5cf6',
                            fontFamily: 'Inter',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            transition: 'background 0.15s',
                        }}
                    >
                        <ChevronDown size={10} />
                        Show more ({allWidgets.length - visibleCount} remaining)
                    </motion.button>
                )}

                {allWidgets.length === 0 && (
                    <div style={{
                        padding: '20px 0', textAlign: 'center',
                        fontSize: 11, color: '#475569',
                    }}>
                        No widgets found {query ? `for "${query}"` : ''}
                    </div>
                )}
            </div>

            {/* Bottom: hovered widget info + template selector */}
            <AnimatePresence>
                {hoveredWidget && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '8px 12px' }}>
                            <div style={{
                                fontSize: 11, fontWeight: 600,
                                color: hoveredWidget.color, marginBottom: 2,
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                                <WidgetIconComponent type={hoveredWidget.type} size={14} />
                                <span>{hoveredWidget.label}</span>
                                <span style={{
                                    fontSize: 8, fontWeight: 400,
                                    color: CATEGORY_COLORS[hoveredWidget.category],
                                    background: `${CATEGORY_COLORS[hoveredWidget.category]}15`,
                                    padding: '1px 5px', borderRadius: 4,
                                    marginLeft: 4,
                                }}>
                                    {hoveredWidget.category}
                                </span>
                            </div>
                            <div style={{ fontSize: 9, color: '#64748b', marginBottom: 8 }}>
                                {hoveredWidget.description}
                            </div>

                            {/* Template options */}
                            <div style={{ display: 'flex', gap: 4 }}>
                                {hoveredWidget.templates.map((tmpl) => (
                                    <motion.button
                                        key={tmpl.name}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => onSelect(hoveredWidget, tmpl)}
                                        style={{
                                            flex: 1, padding: '6px 4px',
                                            borderRadius: 6, border: 'none',
                                            background: `${hoveredWidget.color}11`,
                                            cursor: 'pointer',
                                            fontSize: 9, color: '#94a3b8',
                                            fontFamily: 'Inter', fontWeight: 500,
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = `${hoveredWidget.color}22`)}
                                        onMouseLeave={e => (e.currentTarget.style.background = `${hoveredWidget.color}11`)}
                                    >
                                        {tmpl.name}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}


// ── Section Label ──────────────────────────────────────────────────────────────

function SectionLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
    return (
        <div style={{
            fontSize: 9, fontWeight: 600,
            color: '#475569', textTransform: 'uppercase',
            letterSpacing: '0.5px', padding: '4px 4px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
        }}>
            {icon}
            {label}
        </div>
    )
}


// ── Widget Icon Tile (macOS/iOS style) ─────────────────────────────────────────

function WidgetIconTile({ widget, onHover, onClick }: {
    widget: WidgetDefinition
    onHover: (w: WidgetDefinition | null) => void
    onClick: () => void
}) {
    const isDisabled = widget.disabled

    return (
        <motion.div
            whileHover={isDisabled ? {} : { scale: 1.08, y: -2 }}
            whileTap={isDisabled ? {} : { scale: 0.95 }}
            onMouseEnter={() => onHover(widget)}
            onMouseLeave={() => onHover(null)}
            onClick={isDisabled ? undefined : onClick}
            data-widget-selector
            style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
                padding: '8px 4px',
                borderRadius: 8,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                opacity: isDisabled ? 0.4 : 1,
                position: 'relative',
            }}
            onMouseOver={isDisabled ? undefined : (e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseOut={isDisabled ? undefined : (e: React.MouseEvent<HTMLDivElement>) => (e.currentTarget.style.background = 'transparent')}
        >
            {/* Icon container */}
            <div style={{
                width: 36, height: 36,
                borderRadius: 8,
                background: isDisabled ? 'rgba(255,255,255,0.03)' : `${widget.color}15`,
                border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.06)' : `${widget.color}22`}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
                boxShadow: isDisabled ? 'none' : `0 2px 8px ${widget.color}10`,
                filter: isDisabled ? 'grayscale(0.8)' : 'none',
            }}>
                <WidgetIconComponent type={widget.type} size={18} />
            </div>

            {/* Label */}
            <div style={{
                fontSize: 8, fontWeight: 500,
                color: isDisabled ? '#475569' : '#94a3b8',
                textAlign: 'center',
                lineHeight: 1.1,
                maxWidth: 56,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}>
                {widget.label}
            </div>

            {/* Soon badge */}
            {isDisabled && (
                <div style={{
                    position: 'absolute', top: 2, right: -2,
                    fontSize: 6, fontWeight: 700,
                    color: '#475569',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '1px 3px', borderRadius: 3,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                }}>
                    soon
                </div>
            )}
        </motion.div>
    )
}
