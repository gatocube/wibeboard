/**
 * SwipeButtons — dedicated showcase page.
 *
 * One full-page canvas with three mock nodes:
 *  - Center   — 🤖 Planner (purple)
 *  - Top-left — ▶ Start (green)
 *  - Right    — 🚀 Deploy (amber)
 *
 * Mode selector and event log float over the canvas.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { SwipeButtons, type SwipeButtonsActivation } from '@/components/kit'

// ── Activation mode pill selector ───────────────────────────────────────────────

const MODES: { key: SwipeButtonsActivation; label: string; desc: string }[] = [
    { key: 'click', label: 'Click', desc: 'Tap / click to open' },
    { key: 'hold', label: 'Hold', desc: 'Long-press ~500 ms' },
    { key: 'swipe', label: 'Swipe', desc: 'Hover to open' },
]

function ModeSelector({ mode, onChange }: { mode: SwipeButtonsActivation; onChange: (m: SwipeButtonsActivation) => void }) {
    return (
        <div style={{
            position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 6, zIndex: 10,
            background: 'rgba(10,10,20,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '6px 8px',
            backdropFilter: 'blur(12px)',
        }}>
            {MODES.map(m => (
                <button
                    key={m.key}
                    onClick={() => onChange(m.key)}
                    style={{
                        padding: '6px 16px',
                        borderRadius: 8,
                        border: `1.5px solid ${mode === m.key ? '#8b5cf688' : 'transparent'}`,
                        background: mode === m.key ? 'rgba(139,92,246,0.15)' : 'transparent',
                        color: mode === m.key ? '#c4b5fd' : '#64748b',
                        cursor: 'pointer',
                        fontFamily: 'Inter',
                        fontSize: 11,
                        fontWeight: 700,
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <span>{m.label}</span>
                    <span style={{ fontSize: 7, fontWeight: 400, opacity: 0.6 }}>{m.desc}</span>
                </button>
            ))}
        </div>
    )
}

// ── Event Log ───────────────────────────────────────────────────────────────────

function EventLog({ log }: { log: string[] }) {
    return (
        <div style={{
            position: 'absolute', bottom: 16, right: 16,
            width: 200, maxHeight: 140, overflow: 'auto',
            background: 'rgba(10,10,20,0.85)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            padding: '8px 10px',
            zIndex: 10,
            backdropFilter: 'blur(12px)',
        }}>
            <div style={{
                fontSize: 7, fontWeight: 700, color: '#64748b',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                marginBottom: 4,
            }}>
                Event Log
            </div>
            {log.length === 0 ? (
                <div style={{ fontSize: 8, color: '#334155', fontStyle: 'italic' }}>
                    Interact with a node…
                </div>
            ) : (
                log.map((entry, i) => (
                    <div key={i} style={{
                        fontSize: 8, color: '#94a3b8',
                        fontFamily: "'JetBrains Mono', monospace",
                        padding: '1px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                    }}>
                        {entry}
                    </div>
                ))
            )}
        </div>
    )
}

// ── Mock node ───────────────────────────────────────────────────────────────────

function MockNode({ id, label, color, icon, selected, onClick, onMouseEnter, onHold, onTouchSelect, style }: {
    id: string
    label: string
    color: string
    icon: string
    selected: boolean
    onClick: () => void
    onMouseEnter?: () => void
    onHold?: () => void
    onTouchSelect?: () => void
    style?: React.CSSProperties
}) {
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const didHoldRef = useRef(false)

    const handlePointerDown = useCallback((_e: React.PointerEvent) => {
        if (!onHold) return
        didHoldRef.current = false
        holdTimerRef.current = setTimeout(() => {
            didHoldRef.current = true
            onHold()
            holdTimerRef.current = null
        }, 500)
    }, [onHold])

    const handlePointerUp = useCallback((_e: React.PointerEvent) => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current)
            holdTimerRef.current = null
        }
    }, [])

    const handlePointerCancel = useCallback(() => {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current)
            holdTimerRef.current = null
        }
    }, [])

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        // Don't fire click if hold just completed
        if (didHoldRef.current) { didHoldRef.current = false; return }
        onClick()
    }, [onClick])

    const handleTouchStart = useCallback((_e: React.TouchEvent) => {
        if (onTouchSelect) {
            onTouchSelect()
        }
    }, [onTouchSelect])

    return (
        <div
            data-id={id}
            data-testid={`mock-node-${id}`}
            onClick={handleClick}
            onMouseEnter={onMouseEnter}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onTouchStart={handleTouchStart}
            style={{
                position: 'absolute',
                width: 120, height: 60,
                borderRadius: 10,
                background: selected ? `${color}20` : 'rgba(15,15,26,0.9)',
                border: `1.5px solid ${selected ? `${color}66` : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: selected ? `0 0 20px ${color}22` : 'none',
                touchAction: 'none',
                userSelect: 'none',
                ...style,
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

// ── Page Component ──────────────────────────────────────────────────────────────

export function ButtonsMenuPage() {
    const [mode, setMode] = useState<SwipeButtonsActivation>('click')
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [centerLabel, setCenterLabel] = useState('Planner')
    const [log, setLog] = useState<string[]>([])

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-12), msg])
    }, [])

    const selectNode = useCallback((id: string) => {
        setSelectedId(prev => prev === id ? null : id)
    }, [])

    const hoverNode = useCallback((id: string) => {
        if (mode === 'swipe') setSelectedId(id)
    }, [mode])

    const holdNode = useCallback((id: string) => {
        if (mode === 'hold') setSelectedId(id)
    }, [mode])

    const touchSelectNode = useCallback((id: string) => {
        if (mode === 'swipe') setSelectedId(id)
    }, [mode])

    // ── Document-level pointer listener for hold & swipe from node element ──
    // CDP touch simulation dispatches pointerdown/pointerup at the document level,
    // bypassing React synthetic events. This listener ensures hold and swipe modes
    // work correctly with both real touch and CDP-simulated events.
    const holdTimerDocRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        function findNodeId(target: EventTarget | null): string | null {
            const el = (target as HTMLElement)?.closest?.('[data-id]')
            return el?.getAttribute('data-id') ?? null
        }

        function findNodeIdFromPoint(x: number, y: number): string | null {
            const el = document.elementFromPoint(x, y) as HTMLElement | null
            return el?.closest?.('[data-id]')?.getAttribute('data-id') ?? null
        }

        function handleDown(nodeId: string | null) {
            if (!nodeId) return
            if (mode === 'swipe') setSelectedId(nodeId)
            if (mode === 'hold') {
                holdTimerDocRef.current = setTimeout(() => {
                    setSelectedId(nodeId)
                    holdTimerDocRef.current = null
                }, 500)
            }
        }

        function handleUp() {
            if (holdTimerDocRef.current) {
                clearTimeout(holdTimerDocRef.current)
                holdTimerDocRef.current = null
            }
        }

        // Native pointer events (mouse + real touch on modern browsers)
        function handlePointerDown(e: PointerEvent) {
            handleDown(findNodeId(e.target))
        }

        // Native touch events (CDP simulated touch)
        function handleTouchStart(e: TouchEvent) {
            const touch = e.touches[0]
            if (touch) handleDown(findNodeIdFromPoint(touch.clientX, touch.clientY))
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('pointerup', handleUp)
        document.addEventListener('pointercancel', handleUp)
        document.addEventListener('touchstart', handleTouchStart, { passive: true })
        document.addEventListener('touchend', handleUp, { passive: true })
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('pointerup', handleUp)
            document.removeEventListener('pointercancel', handleUp)
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('touchend', handleUp)
            if (holdTimerDocRef.current) clearTimeout(holdTimerDocRef.current)
        }
    }, [mode])

    const currentLabel = selectedId === 'center-node' ? centerLabel
        : selectedId === 'left-node' ? 'Start'
            : selectedId === 'right-node' ? 'Deploy'
                : ''

    return (
        <div
            style={{
                position: 'relative',
                width: '100%', height: '100%',
                background: '#0a0a14',
                fontFamily: 'Inter',
                overflow: 'hidden',
            }}
            onClick={() => setSelectedId(null)}
        >
            {/* ── Mode selector (top-center) ── */}
            <ModeSelector mode={mode} onChange={setMode} />

            {/* ── Title (bottom-left) ── */}
            <div style={{
                position: 'absolute', bottom: 16, left: 16, zIndex: 10,
            }}>
                <div style={{
                    fontSize: 14, fontWeight: 800, color: '#8b5cf6',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    SwipeButtons
                </div>
                <div style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>
                    Radial action menus · touchscreen optimised
                </div>
            </div>

            {/* ── Event log (bottom-right) ── */}
            <EventLog log={log} />

            {/* ── Subtle grid background ── */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0,
                backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
            }} />

            {/* ── Top-left node (menu-button sized) ── */}
            <MockNode
                id="left-node"
                label="Start"
                color="#22c55e"
                icon="▶"
                selected={selectedId === 'left-node'}
                onClick={() => selectNode('left-node')}
                onMouseEnter={() => hoverNode('left-node')}
                onHold={() => holdNode('left-node')}
                onTouchSelect={() => touchSelectNode('left-node')}
                style={{ top: 32, left: 32, width: 48, height: 48, padding: '0 6px', justifyContent: 'center' }}
            />

            {/* ── Center node ── */}
            <MockNode
                id="center-node"
                label={centerLabel}
                color="#8b5cf6"
                icon="🤖"
                selected={selectedId === 'center-node'}
                onClick={() => selectNode('center-node')}
                onMouseEnter={() => hoverNode('center-node')}
                onHold={() => holdNode('center-node')}
                onTouchSelect={() => touchSelectNode('center-node')}
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            />

            {/* ── Right-edge node ── */}
            <MockNode
                id="right-node"
                label="Deploy"
                color="#f59e0b"
                icon="🚀"
                selected={selectedId === 'right-node'}
                onClick={() => selectNode('right-node')}
                onMouseEnter={() => hoverNode('right-node')}
                onHold={() => holdNode('right-node')}
                onTouchSelect={() => touchSelectNode('right-node')}
                style={{ top: '50%', right: 32, transform: 'translateY(-50%)' }}
            />

            {/* ── SwipeButtons for selected node ── */}
            {selectedId && (
                <SwipeButtons
                    nodeId={selectedId}
                    currentLabel={currentLabel}
                    activationMode={mode}
                    directions={selectedId === 'left-node' ? ['right', 'bottom', 'bottom-right'] : undefined}
                    noOverlap={selectedId === 'left-node' || selectedId === 'right-node'}
                    onAddBefore={(id, type) => { addLog(`⬅ Before ${type}: ${id}`); setSelectedId(null) }}
                    onAddAfter={(id, type) => { addLog(`➡ After ${type}: ${id}`); setSelectedId(null) }}
                    onConfigure={(id, action) => {
                        addLog(`⚙ ${action}: ${id}`)
                        if (action !== 'rename') setSelectedId(null)
                    }}
                    onRename={(id, newName) => {
                        addLog(`✏ Rename: ${id} → ${newName}`)
                        if (selectedId === 'center-node') setCenterLabel(newName)
                    }}
                    onDismiss={() => setSelectedId(null)}
                />
            )}
        </div>
    )
}
