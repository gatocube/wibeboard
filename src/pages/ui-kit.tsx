/**
 * UI Kit — interactive showcase of reusable wibeboard components.
 *
 * Sections:
 *  1. IconButton — all colors and sizes
 *  2. DragToPlace — press & drag to position, release to show widget picker
 *  3. ConstructionNode — all states of the placeholder/construction node
 */

import { useState, useCallback, useRef } from 'react'
import { IconButton, ICON_BUTTON_COLORS, IconSelector, type IconButtonColor, type IconButtonSize } from '@/kit'
import { WidgetIcon } from '@/components/WidgetIcon'
import { Plus, Settings, Pencil, ArrowRight, Code, Cpu, Zap, Star, Heart, Globe, Shield, UserCircle, Construction } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Icon list for demo ──────────────────────────────────────────────────────────

const DEMO_ICONS = [Plus, Settings, Pencil, ArrowRight, Code, Cpu, Zap, Star, Heart, Globe, Shield]

// ── Component ───────────────────────────────────────────────────────────────────

export function UIKitPage() {
    return (
        <div style={{
            height: '100%', overflow: 'auto',
            background: '#0a0a14', padding: '24px 32px',
            fontFamily: 'Inter',
        }}>
            <h1 style={{
                fontSize: 20, fontWeight: 800, color: '#8b5cf6',
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 4,
            }}>
                UI Kit
            </h1>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 32 }}>
                Reusable components for wibeboard
            </p>

            <IconButtonSection />

            <div style={{ height: 32 }} />

            <DragToPlaceSection />

            <div style={{ height: 32 }} />

            <ConstructionNodeSection />

            <div style={{ height: 32 }} />

            <IconSelectorSection />
        </div>
    )
}

// ── 1. IconButton showcase ──────────────────────────────────────────────────────

function IconButtonSection() {
    const colors = Object.keys(ICON_BUTTON_COLORS) as IconButtonColor[]
    const sizes: IconButtonSize[] = ['xs', 'sm', 'md', 'lg']
    const [clicked, setClicked] = useState<string | null>(null)

    return (
        <section>
            <h2 style={{
                fontSize: 13, fontWeight: 700, color: '#e2e8f0',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: 'rgba(139,92,246,0.15)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                }}>🎨</span>
                IconButton
            </h2>

            {/* Sizes */}
            <div style={{ marginBottom: 20 }}>
                <div style={{
                    fontSize: 9, fontWeight: 600, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    marginBottom: 10,
                }}>
                    Sizes
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    {sizes.map(size => (
                        <div key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <IconButton
                                icon={<Star size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'md' ? 18 : 22} />}
                                label={size}
                                color="purple"
                                size={size}
                                testId={`icon-btn-${size}`}
                                onClick={() => setClicked(size)}
                            />
                            <span style={{ fontSize: 7, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                                {size}
                            </span>
                        </div>
                    ))}
                    {clicked && (
                        <span style={{ fontSize: 9, color: '#8b5cf6', marginLeft: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                            clicked: {clicked}
                        </span>
                    )}
                </div>
            </div>

            {/* All colors */}
            <div style={{ marginBottom: 20 }}>
                <div style={{
                    fontSize: 9, fontWeight: 600, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    marginBottom: 10,
                }}>
                    Colors
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {colors.map((color, i) => {
                        const Icon = DEMO_ICONS[i % DEMO_ICONS.length]
                        return (
                            <IconButton
                                key={color}
                                icon={<Icon size={18} />}
                                label={color}
                                color={color}
                                size="md"
                                testId={`icon-btn-${color}`}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Active & disabled states */}
            <div>
                <div style={{
                    fontSize: 9, fontWeight: 600, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                    marginBottom: 10,
                }}>
                    States
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <IconButton icon={<Star size={18} />} label="Default" color="purple" size="md" />
                    <IconButton icon={<Star size={18} />} label="Active" color="purple" size="md" active />
                    <IconButton icon={<Star size={18} />} label="Disabled" color="purple" size="md" disabled />
                </div>
            </div>
        </section>
    )
}

// ── 2. Drag-to-Place demo ───────────────────────────────────────────────────────

interface WidgetPickerItem {
    key: string
    label: string
    icon: typeof Plus
    color: string
}

const PLACE_WIDGET_TYPES: WidgetPickerItem[] = [
    { key: 'script', label: 'Script', icon: Code, color: '#f7df1e' },
    { key: 'ai', label: 'AI', icon: Cpu, color: '#8b5cf6' },
    { key: 'user', label: 'User', icon: UserCircle, color: '#22c55e' },
]

function DragToPlaceSection() {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [dragging, setDragging] = useState(false)
    const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
    const [pickerPos, setPickerPos] = useState<{ x: number; y: number } | null>(null)
    const [placedNodes, setPlacedNodes] = useState<{ x: number; y: number; type: string; id: number }[]>([])
    const [log, setLog] = useState<string[]>([])
    const nextId = useRef(1)

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-8), msg])
    }, [])

    const getRelativePos = useCallback((e: React.PointerEvent | PointerEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return null
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }, [])

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (pickerPos) { setPickerPos(null); return }
        const pos = getRelativePos(e)
        if (!pos) return
        setDragging(true)
        setCursor(pos)
            ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
    }, [getRelativePos, pickerPos])

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging) return
        const pos = getRelativePos(e)
        if (pos) setCursor(pos)
    }, [dragging, getRelativePos])

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!dragging) return
        const pos = getRelativePos(e)
        setDragging(false)
        if (pos) {
            setPickerPos(pos)
            setCursor(null)
            addLog(`📍 Drop at (${Math.round(pos.x)}, ${Math.round(pos.y)})`)
        }
    }, [dragging, getRelativePos, addLog])

    const handlePickWidget = useCallback((type: string) => {
        if (!pickerPos) return
        const id = nextId.current++
        setPlacedNodes(prev => [...prev, { ...pickerPos, type, id }])
        addLog(`✅ Created ${type} node #${id} at (${Math.round(pickerPos.x)}, ${Math.round(pickerPos.y)})`)
        setPickerPos(null)
    }, [pickerPos, addLog])

    const typeColors: Record<string, string> = { script: '#f7df1e', ai: '#8b5cf6', user: '#22c55e' }
    const typeIcons: Record<string, string> = { script: '>_', ai: '🤖', user: '👤' }

    return (
        <section>
            <h2 style={{
                fontSize: 13, fontWeight: 700, color: '#e2e8f0',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: 'rgba(139,92,246,0.15)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                }}>📌</span>
                Drag to Place
            </h2>

            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                Press and drag on the canvas to position a node.
                On release, pick <strong style={{ color: '#94a3b8' }}>Script</strong>,{' '}
                <strong style={{ color: '#94a3b8' }}>AI</strong>, or{' '}
                <strong style={{ color: '#94a3b8' }}>User</strong> to place it.
                Works with touch on iPad.
            </p>

            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                {/* Canvas */}
                <div
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    style={{
                        position: 'relative',
                        width: 500, height: 350,
                        background: 'rgba(15,15,26,0.6)',
                        border: `1px solid ${dragging ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: 12,
                        cursor: dragging ? 'crosshair' : 'pointer',
                        touchAction: 'none',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s',
                    }}
                >
                    {/* Grid dots */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }} />

                    {/* Placed nodes */}
                    {placedNodes.map(node => (
                        <div key={node.id} style={{
                            position: 'absolute',
                            left: node.x - 24, top: node.y - 16,
                            width: 48, height: 32,
                            background: 'rgba(15,15,26,0.92)',
                            border: `1.5px solid ${typeColors[node.type] || '#8b5cf6'}44`,
                            borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 4,
                            fontSize: 8, color: typeColors[node.type] || '#8b5cf6',
                            fontWeight: 700, fontFamily: 'Inter',
                            boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px ${typeColors[node.type] || '#8b5cf6'}11`,
                        }}>
                            <span style={{ fontSize: 10 }}>{typeIcons[node.type]}</span>
                            {node.type.toUpperCase()}
                        </div>
                    ))}

                    {/* Drag cursor indicator */}
                    <AnimatePresence>
                        {dragging && cursor && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                style={{
                                    position: 'absolute',
                                    left: cursor.x - 12, top: cursor.y - 12,
                                    width: 24, height: 24,
                                    borderRadius: '50%',
                                    border: '2px solid rgba(139,92,246,0.6)',
                                    background: 'rgba(139,92,246,0.1)',
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Widget picker on release */}
                    <AnimatePresence>
                        {pickerPos && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                style={{
                                    position: 'absolute',
                                    left: pickerPos.x,
                                    top: pickerPos.y,
                                    display: 'flex', gap: 6,
                                    transform: 'translate(-50%, -60px)',
                                }}
                            >
                                {PLACE_WIDGET_TYPES.map((wt, i) => (
                                    <motion.button
                                        key={wt.key}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={(e) => { e.stopPropagation(); handlePickWidget(wt.key) }}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        style={{
                                            width: 48, height: 48,
                                            borderRadius: 14,
                                            border: `1.5px solid ${wt.color}44`,
                                            background: 'rgba(15,15,26,0.92)',
                                            backdropFilter: 'blur(12px)',
                                            color: wt.color,
                                            cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            gap: 2,
                                            fontFamily: 'Inter',
                                            padding: 0,
                                            boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${wt.color}11`,
                                            WebkitTapHighlightColor: 'transparent',
                                            touchAction: 'manipulation',
                                        }}
                                    >
                                        <wt.icon size={18} strokeWidth={2} />
                                        <span style={{
                                            fontSize: 7, fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.3, lineHeight: 1,
                                            opacity: 0.85,
                                        }}>{wt.label}</span>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Drop dot marker */}
                    <AnimatePresence>
                        {pickerPos && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                style={{
                                    position: 'absolute',
                                    left: pickerPos.x - 4, top: pickerPos.y - 4,
                                    width: 8, height: 8,
                                    borderRadius: '50%',
                                    background: '#8b5cf6',
                                    boxShadow: '0 0 8px rgba(139,92,246,0.4)',
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                    </AnimatePresence>

                    {/* Empty canvas hint */}
                    {placedNodes.length === 0 && !dragging && !pickerPos && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#334155', fontSize: 11, fontFamily: 'Inter',
                            pointerEvents: 'none',
                        }}>
                            Press and drag to place a node
                        </div>
                    )}
                </div>

                {/* Event log */}
                <div style={{
                    width: 220, minHeight: 100,
                    background: 'rgba(15,15,26,0.8)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '8px 12px',
                }}>
                    <div style={{
                        fontSize: 8, fontWeight: 700, color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        marginBottom: 6,
                    }}>
                        Event Log
                    </div>
                    {log.length === 0 ? (
                        <div style={{ fontSize: 9, color: '#334155', fontStyle: 'italic' }}>
                            Drag on the canvas to start...
                        </div>
                    ) : (
                        log.map((entry, i) => (
                            <div key={i} style={{
                                fontSize: 9, color: '#94a3b8',
                                fontFamily: "'JetBrains Mono', monospace",
                                padding: '2px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                            }}>
                                {entry}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    )
}

// ── 3. Construction Node states ─────────────────────────────────────────────────

const CONSTRUCTION_STATES = [
    {
        label: 'Positioning',
        desc: 'Just placed, waiting for interaction',
        sizing: false,
        resizable: false,
        showSelector: false,
        hoveredWidget: null,
        w: 160, h: 100,
    },
    {
        label: 'Resizing',
        desc: 'User dragging to set size',
        sizing: true,
        resizable: false,
        showSelector: false,
        hoveredWidget: null,
        w: 200, h: 120,
    },
    {
        label: 'Configuring',
        desc: 'Size confirmed, awaiting widget pick',
        sizing: false,
        resizable: true,
        showSelector: true,
        hoveredWidget: null,
        w: 160, h: 100,
    },
    {
        label: 'Widget Preview',
        desc: 'Hovering a widget in the picker',
        sizing: false,
        resizable: true,
        showSelector: true,
        hoveredWidget: { name: 'AI Agent', type: 'agent', description: 'An AI agent that executes tasks autonomously' },
        w: 160, h: 100,
    },
] as const

function ConstructionNodeSection() {
    return (
        <section>
            <h2 style={{
                fontSize: 13, fontWeight: 700, color: '#e2e8f0',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: 'rgba(139,92,246,0.15)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                }}>🚧</span>
                Construction Node States
            </h2>

            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 16 }}>
                The placeholder node transitions through these visual states during node creation:
                <strong style={{ color: '#94a3b8' }}> Positioning</strong> →
                <strong style={{ color: '#94a3b8' }}> Resizing</strong> →
                <strong style={{ color: '#94a3b8' }}> Configuring</strong> →
                <strong style={{ color: '#94a3b8' }}> Widget Preview</strong>
            </p>

            <div style={{
                display: 'flex', gap: 24, flexWrap: 'wrap',
            }}>
                {CONSTRUCTION_STATES.map((state) => (
                    <div key={state.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        {/* State label */}
                        <div style={{
                            fontSize: 9, fontWeight: 700, color: '#8b5cf6',
                            textTransform: 'uppercase', letterSpacing: 0.5,
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>{state.label}</div>

                        {/* Mock node */}
                        <MockConstructionNode
                            w={state.w}
                            h={state.h}
                            sizing={state.sizing}
                            resizable={state.resizable}
                            showSelector={state.showSelector}
                            hoveredWidget={state.hoveredWidget}
                        />

                        {/* Description */}
                        <div style={{
                            fontSize: 8, color: '#64748b', textAlign: 'center',
                            maxWidth: state.w, fontFamily: 'Inter',
                        }}>{state.desc}</div>
                    </div>
                ))}
            </div>
        </section>
    )
}

function MockConstructionNode({ w, h, sizing, resizable, showSelector, hoveredWidget }: {
    w: number; h: number; sizing: boolean; resizable: boolean
    showSelector: boolean; hoveredWidget: { name: string; type: string; description: string } | null
}) {
    const showPreview = !!hoveredWidget && !sizing
    const gridCols = Math.round(w / 40)
    const gridRows = Math.round(h / 40)

    return (
        <div style={{
            position: 'relative',
            width: w, height: h,
            border: `2px dashed ${showPreview ? 'rgba(139,92,246,0.7)' : 'rgba(139,92,246,0.5)'}`,
            borderRadius: 10,
            background: showPreview
                ? 'rgba(139,92,246,0.08)'
                : sizing
                    ? 'rgba(139,92,246,0.04)'
                    : 'rgba(139,92,246,0.06)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            transition: sizing ? 'none' : 'all 0.15s ease',
            userSelect: 'none',
            overflow: 'hidden',
        }}>
            {/* Handle dots */}
            <div style={{
                position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 8, borderRadius: '50%',
                background: '#8b5cf6', border: '2px solid rgba(139,92,246,0.3)',
            }} />
            <div style={{
                position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 8, borderRadius: '50%',
                background: '#64748b', border: '2px solid rgba(100,116,139,0.3)',
            }} />

            {showPreview ? (
                <>
                    <Cpu size={24} style={{ color: 'rgba(139,92,246,0.7)' }} />
                    <div style={{
                        fontSize: 11, fontWeight: 600, color: '#8b5cf6',
                        fontFamily: 'Inter', textAlign: 'center', padding: '0 8px',
                    }}>
                        {hoveredWidget.name}
                    </div>
                    <div style={{
                        fontSize: 8, color: 'rgba(139,92,246,0.6)', fontFamily: 'Inter',
                        textAlign: 'center', padding: '0 12px', lineHeight: 1.3,
                        maxHeight: h - 60, overflow: 'hidden',
                    }}>
                        {hoveredWidget.description}
                    </div>
                    <div style={{
                        fontSize: 8, color: 'rgba(139,92,246,0.4)',
                        fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginTop: 2,
                    }}>
                        {gridCols}×{gridRows}
                    </div>
                </>
            ) : (
                <>
                    <Construction size={sizing ? 16 : 20} style={{ color: 'rgba(139,92,246,0.5)' }} />
                    <div style={{
                        fontSize: 10, color: 'rgba(139,92,246,0.7)',
                        fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    }}>
                        {gridCols}×{gridRows}
                    </div>
                    <div style={{
                        fontSize: 8, color: 'rgba(139,92,246,0.4)',
                        fontFamily: 'Inter', fontWeight: 500,
                        letterSpacing: 0.5, textTransform: 'uppercase',
                    }}>
                        {sizing ? 'sizing...' : resizable ? 'drag corner to resize' : showSelector ? 'select widget' : 'select widget'}
                    </div>
                </>
            )}

            {/* Corner markers (sizing state) */}
            {sizing && (
                <>
                    {[
                        { top: 4, left: 4 }, { top: 4, right: 4 },
                        { bottom: 4, left: 4 }, { bottom: 4, right: 4 },
                    ].map((pos, i) => (
                        <div key={i} style={{
                            position: 'absolute', ...pos, width: 6, height: 6,
                            borderTop: 'top' in pos ? '1.5px solid rgba(139,92,246,0.4)' : 'none',
                            borderBottom: 'bottom' in pos ? '1.5px solid rgba(139,92,246,0.4)' : 'none',
                            borderLeft: 'left' in pos ? '1.5px solid rgba(139,92,246,0.4)' : 'none',
                            borderRight: 'right' in pos ? '1.5px solid rgba(139,92,246,0.4)' : 'none',
                        }} />
                    ))}
                </>
            )}

            {/* Resize handle (configuring states) */}
            {resizable && (
                <div style={{
                    position: 'absolute', bottom: -4, right: -4,
                    width: 12, height: 12, borderRadius: 2,
                    background: '#8b5cf6', border: '1.5px solid rgba(139,92,246,0.6)',
                    cursor: 'nwse-resize', zIndex: 10,
                    boxShadow: '0 0 4px rgba(139,92,246,0.3)',
                }} />
            )}

            {/* Configuring indicator badge */}
            {showSelector && !showPreview && (
                <div style={{
                    position: 'absolute', top: -8, right: -8,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#8b5cf6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, color: '#fff', fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(139,92,246,0.4)',
                }}>⚡</div>
            )}
        </div>
    )
}

// ── 4. Icon Selector demo ───────────────────────────────────────────────────────

function IconSelectorSection() {
    const [selected, setSelected] = useState<string | null>(null)
    const [selectedColor, setSelectedColor] = useState<string | null>(null)

    return (
        <section>
            <h2 style={{
                fontSize: 13, fontWeight: 700, color: '#e2e8f0',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: 'rgba(139,92,246,0.15)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                }}>🎯</span>
                Icon Selector
            </h2>

            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 12 }}>
                Searchable icon picker built from the icon registry.
                Search by <strong style={{ color: '#94a3b8' }}>name</strong>,{' '}
                <strong style={{ color: '#94a3b8' }}>type</strong>, or{' '}
                <strong style={{ color: '#94a3b8' }}>tags</strong>. Click to select.
            </p>

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ width: 360 }}>
                    <IconSelector
                        selected={selected || undefined}
                        onSelect={(type, color) => {
                            setSelected(type)
                            setSelectedColor(color)
                        }}
                        height={380}
                    />
                </div>

                {/* Selected icon info panel */}
                <div style={{
                    width: 200, minHeight: 100,
                    background: 'rgba(15,15,26,0.8)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: '12px 16px',
                }}>
                    <div style={{
                        fontSize: 8, fontWeight: 700, color: '#64748b',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        marginBottom: 8,
                    }}>
                        Selected Icon
                    </div>
                    {selected ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{
                                width: 48, height: 48,
                                borderRadius: 10,
                                background: `${selectedColor}15`,
                                border: `1.5px solid ${selectedColor}44`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <WidgetIcon type={selected} size={24} />
                            </div>
                            <div>
                                <div style={{
                                    fontSize: 11, fontWeight: 600, color: '#e2e8f0',
                                }}>
                                    {selected}
                                </div>
                                <div style={{
                                    fontSize: 9, color: selectedColor || '#8b5cf6',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    marginTop: 2,
                                }}>
                                    {selectedColor}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: 9, color: '#334155', fontStyle: 'italic' }}>
                            Click an icon to select it
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
