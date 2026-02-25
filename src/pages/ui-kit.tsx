/**
 * UI Kit — interactive showcase of reusable wibeboard components.
 *
 * Sections:
 *  1. IconButton — all colors and sizes
 *  2. NodeButtonsMenu — click a mock node to see action buttons appear
 *  3. ExtendedNodeButtonsMenu — with sub-menu fans for widget type selection
 *  4. DragToPlace — press & drag to position, release to show widget picker
 */

import { useState, useCallback, useRef } from 'react'
import { IconButton, ICON_BUTTON_COLORS, type IconButtonColor, type IconButtonSize, ExtendedNodeButtonsMenu } from '@/kit'
import { NodeButtonsMenu } from '@/flow-builder/NodeButtonsMenu'
import { Plus, Settings, Pencil, ArrowRight, Code, Cpu, Zap, Star, Heart, Globe, Shield, UserCircle } from 'lucide-react'
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

            <NodeButtonsMenuSection />

            <div style={{ height: 32 }} />

            <ExtendedMenuSection />

            <div style={{ height: 32 }} />

            <DragToPlaceSection />
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

// ── 2. NodeButtonsMenu demo ─────────────────────────────────────────────────────

function NodeButtonsMenuSection() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [label, setLabel] = useState('My Node')
    const [log, setLog] = useState<string[]>([])

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-6), msg])
    }, [])

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
                }}>⚡</span>
                NodeButtonsMenu
            </h2>

            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 16 }}>
                Click a node to see the action buttons appear around it. iPad-friendly 48px touch targets.
            </p>

            <div style={{
                display: 'flex', gap: 32, alignItems: 'flex-start',
            }}>
                {/* Mock nodes area */}
                <div style={{
                    position: 'relative',
                    width: 400, height: 300,
                    background: 'rgba(15,15,26,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 40,
                }}
                    onClick={(e) => {
                        // Click on background = dismiss
                        if (e.target === e.currentTarget) {
                            setSelectedId(null)
                        }
                    }}
                >
                    {/* Mock Node 1 */}
                    <MockNode
                        id="node-a"
                        label={label}
                        color="#8b5cf6"
                        icon="🤖"
                        selected={selectedId === 'node-a'}
                        onClick={() => setSelectedId(prev => prev === 'node-a' ? null : 'node-a')}
                    />

                    {/* Mock Node 2 */}
                    <MockNode
                        id="node-b"
                        label="process.js"
                        color="#f7df1e"
                        icon="📜"
                        selected={selectedId === 'node-b'}
                        onClick={() => setSelectedId(prev => prev === 'node-b' ? null : 'node-b')}
                    />
                </div>

                {/* Event log */}
                <div style={{
                    width: 200, minHeight: 100,
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
                            Click a node to start...
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

            {/* Render NodeButtonsMenu for the selected mock node */}
            {selectedId && (
                <NodeButtonsMenu
                    nodeId={selectedId}
                    nodeWidth={120}
                    nodeHeight={60}
                    currentLabel={selectedId === 'node-a' ? label : 'process.js'}
                    onAddBefore={(id) => { addLog(`⬆ Add Before: ${id}`); setSelectedId(null) }}
                    onAddAfter={(id) => { addLog(`⬇ Add After: ${id}`); setSelectedId(null) }}
                    onConfigure={(id) => { addLog(`⚙ Configure: ${id}`) }}
                    onRename={(id, newName) => {
                        addLog(`✏ Rename: ${id} → ${newName}`)
                        if (id === 'node-a') setLabel(newName)
                    }}
                    onDismiss={() => setSelectedId(null)}
                />
            )}
        </section>
    )
}

// ── MockNode ────────────────────────────────────────────────────────────────────

function MockNode({ id, label, color, icon, selected, onClick }: {
    id: string
    label: string
    color: string
    icon: string
    selected: boolean
    onClick: () => void
}) {
    return (
        <div
            data-id={id}
            data-testid={`mock-node-${id}`}
            onClick={(e) => { e.stopPropagation(); onClick() }}
            style={{
                width: 120, height: 60,
                borderRadius: 10,
                background: selected ? `${color}20` : 'rgba(15,15,26,0.9)',
                border: `1.5px solid ${selected ? `${color}66` : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: selected ? `0 0 20px ${color}22` : 'none',
            }}
        >
            <span style={{ fontSize: 20 }}>{icon}</span>
            <div>
                <div style={{
                    fontSize: 11, fontWeight: 700, color: '#e2e8f0',
                    fontFamily: 'Inter',
                }}>
                    {label}
                </div>
                <div style={{
                    fontSize: 7, color: '#64748b',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    {id}
                </div>
            </div>
        </div>
    )
}

// ── 3. ExtendedNodeButtonsMenu demo ─────────────────────────────────────────────

function ExtendedMenuSection() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [label, setLabel] = useState('Planner')
    const [log, setLog] = useState<string[]>([])

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-8), msg])
    }, [])

    return (
        <section>
            <h2 style={{
                fontSize: 13, fontWeight: 700, color: '#e2e8f0',
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: 'rgba(34,197,94,0.15)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                }}>🚀</span>
                ExtendedNodeButtonsMenu
            </h2>

            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                Click <strong style={{ color: '#94a3b8' }}>After</strong> or <strong style={{ color: '#94a3b8' }}>Before</strong> to see widget-type sub-buttons fan out.
                Click <strong style={{ color: '#94a3b8' }}>Config</strong> to see Rename / Duplicate / Delete options.
            </p>

            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                {/* Mock nodes area */}
                <div style={{
                    position: 'relative',
                    width: 500, height: 350,
                    background: 'rgba(15,15,26,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 80,
                }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setSelectedId(null)
                    }}
                >
                    <MockNode
                        id="ext-node-a"
                        label={label}
                        color="#8b5cf6"
                        icon="🤖"
                        selected={selectedId === 'ext-node-a'}
                        onClick={() => setSelectedId(prev => prev === 'ext-node-a' ? null : 'ext-node-a')}
                    />
                    <MockNode
                        id="ext-node-b"
                        label="process.js"
                        color="#f7df1e"
                        icon="📜"
                        selected={selectedId === 'ext-node-b'}
                        onClick={() => setSelectedId(prev => prev === 'ext-node-b' ? null : 'ext-node-b')}
                    />
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
                            Click a node, then a button...
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

            {/* Render ExtendedNodeButtonsMenu for selected node */}
            {selectedId && (
                <ExtendedNodeButtonsMenu
                    nodeId={selectedId}
                    currentLabel={selectedId === 'ext-node-a' ? label : 'process.js'}
                    onAddBefore={(id, type) => { addLog(`⬅ Before ${type}: ${id}`); setSelectedId(null) }}
                    onAddAfter={(id, type) => { addLog(`➡ After ${type}: ${id}`); setSelectedId(null) }}
                    onConfigure={(id, action) => {
                        addLog(`⚙ ${action}: ${id}`)
                        if (action !== 'rename') setSelectedId(null)
                    }}
                    onRename={(id, newName) => {
                        addLog(`✏ Rename: ${id} → ${newName}`)
                        if (id === 'ext-node-a') setLabel(newName)
                    }}
                    onDismiss={() => setSelectedId(null)}
                />
            )}
        </section>
    )
}

// ── 4. Drag-to-Place demo ───────────────────────────────────────────────────────

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
