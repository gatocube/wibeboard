/**
 * SwipeButtons — dedicated showcase page.
 *
 * Sections:
 *  1. Center preview — a floating button in the middle with a multilevel radial menu
 *  2. Left-corner preview — a button pinned to the top-left corner
 *  3. Right-edge preview — a button pinned to the right edge
 *
 * An activation mode selector (click / hold / swipe) is provided at the top.
 */

import { useState, useCallback } from 'react'
import { SwipeButtons, type SwipeButtonsActivation } from '@/kit'

// ── Activation mode pill selector ───────────────────────────────────────────────

const MODES: { key: SwipeButtonsActivation; label: string; desc: string }[] = [
    { key: 'click', label: 'Click', desc: 'Tap / click to open menu' },
    { key: 'hold', label: 'Hold', desc: 'Long-press ~500 ms to open' },
    { key: 'swipe', label: 'Swipe', desc: 'Hover to open instantly' },
]

function ModeSelector({ mode, onChange }: { mode: SwipeButtonsActivation; onChange: (m: SwipeButtonsActivation) => void }) {
    return (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {MODES.map(m => (
                <button
                    key={m.key}
                    onClick={() => onChange(m.key)}
                    style={{
                        padding: '8px 20px',
                        borderRadius: 10,
                        border: `1.5px solid ${mode === m.key ? '#8b5cf688' : 'rgba(255,255,255,0.08)'}`,
                        background: mode === m.key ? 'rgba(139,92,246,0.12)' : 'rgba(15,15,26,0.7)',
                        color: mode === m.key ? '#c4b5fd' : '#64748b',
                        cursor: 'pointer',
                        fontFamily: 'Inter',
                        fontSize: 12,
                        fontWeight: 700,
                        transition: 'all 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <span>{m.label}</span>
                    <span style={{ fontSize: 8, fontWeight: 400, opacity: 0.7 }}>{m.desc}</span>
                </button>
            ))}
        </div>
    )
}

// ── Event Log ───────────────────────────────────────────────────────────────────

function EventLog({ log, placeholder }: { log: string[]; placeholder: string }) {
    return (
        <div style={{
            width: 220, minHeight: 80,
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
                    {placeholder}
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
    )
}

// ── Mock node ───────────────────────────────────────────────────────────────────

function MockNode({ id, label, color, icon, selected, onClick, onMouseEnter, style }: {
    id: string
    label: string
    color: string
    icon: string
    selected: boolean
    onClick: () => void
    onMouseEnter?: () => void
    style?: React.CSSProperties
}) {
    return (
        <div
            data-id={id}
            data-testid={`mock-node-${id}`}
            onClick={(e) => { e.stopPropagation(); onClick() }}
            onMouseEnter={onMouseEnter}
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

// ── Section heading ─────────────────────────────────────────────────────────────

function SectionHeading({ emoji, emojiColor, title, description }: {
    emoji: string; emojiColor: string; title: string; description: string
}) {
    return (
        <>
            <h2 style={{
                fontSize: 13, fontWeight: 700, color: '#e2e8f0',
                marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: emojiColor,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10,
                }}>{emoji}</span>
                {title}
            </h2>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 16 }}>
                {description}
            </p>
        </>
    )
}

// ── 1. Center Preview ───────────────────────────────────────────────────────────

function CenterPreview({ mode }: { mode: SwipeButtonsActivation }) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [label, setLabel] = useState('Planner')
    const [log, setLog] = useState<string[]>([])

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-8), msg])
    }, [])

    return (
        <section>
            <SectionHeading
                emoji="🎯"
                emojiColor="rgba(139,92,246,0.15)"
                title="Center — Radial Menu"
                description="Click the node to activate SwipeButtons. Menu fans out in all 4 directions."
            />

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{
                    position: 'relative',
                    width: 520, height: 380,
                    background: 'rgba(15,15,26,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                    onClick={() => setSelectedId(null)}
                >
                    <MockNode
                        id="center-node"
                        label={label}
                        color="#8b5cf6"
                        icon="🤖"
                        selected={selectedId === 'center-node'}
                        onClick={() => setSelectedId(prev => prev === 'center-node' ? null : 'center-node')}
                        onMouseEnter={mode === 'swipe' ? () => setSelectedId('center-node') : undefined}
                    />
                </div>

                <EventLog log={log} placeholder="Click the node, then a button..." />
            </div>

            {selectedId && (
                <SwipeButtons
                    nodeId={selectedId}
                    currentLabel={label}
                    activationMode={mode}
                    onAddBefore={(id, type) => { addLog(`⬅ Before ${type}: ${id}`); setSelectedId(null) }}
                    onAddAfter={(id, type) => { addLog(`➡ After ${type}: ${id}`); setSelectedId(null) }}
                    onConfigure={(id, action) => {
                        addLog(`⚙ ${action}: ${id}`)
                        if (action !== 'rename') setSelectedId(null)
                    }}
                    onRename={(id, newName) => {
                        addLog(`✏ Rename: ${id} → ${newName}`)
                        setLabel(newName)
                    }}
                    onDismiss={() => setSelectedId(null)}
                />
            )}
        </section>
    )
}

// ── 2. Left-Corner Preview ──────────────────────────────────────────────────────

function LeftCornerPreview({ mode }: { mode: SwipeButtonsActivation }) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [log, setLog] = useState<string[]>([])

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-6), msg])
    }, [])

    return (
        <section>
            <SectionHeading
                emoji="↖"
                emojiColor="rgba(34,197,94,0.15)"
                title="Left Corner — Pinned Button"
                description="Node pinned to the top-left corner. Menu fans right and down."
            />

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{
                    position: 'relative',
                    width: 520, height: 380,
                    background: 'rgba(15,15,26,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    overflow: 'visible',
                }}
                    onClick={() => setSelectedId(null)}
                >
                    <MockNode
                        id="left-node"
                        label="Start"
                        color="#22c55e"
                        icon="▶"
                        selected={selectedId === 'left-node'}
                        onClick={() => setSelectedId(prev => prev === 'left-node' ? null : 'left-node')}
                        onMouseEnter={mode === 'swipe' ? () => setSelectedId('left-node') : undefined}
                        style={{ position: 'absolute', top: 24, left: 24 }}
                    />
                </div>

                <EventLog log={log} placeholder="Click the corner node..." />
            </div>

            {selectedId && (
                <SwipeButtons
                    nodeId={selectedId}
                    currentLabel="Start"
                    activationMode={mode}
                    onAddBefore={(id, type) => { addLog(`⬅ Before ${type}: ${id}`); setSelectedId(null) }}
                    onAddAfter={(id, type) => { addLog(`➡ After ${type}: ${id}`); setSelectedId(null) }}
                    onConfigure={(id, action) => {
                        addLog(`⚙ ${action}: ${id}`)
                        if (action !== 'rename') setSelectedId(null)
                    }}
                    onRename={(id, newName) => { addLog(`✏ Rename: ${id} → ${newName}`) }}
                    onDismiss={() => setSelectedId(null)}
                />
            )}
        </section>
    )
}

// ── 3. Right-Edge Preview ───────────────────────────────────────────────────────

function RightEdgePreview({ mode }: { mode: SwipeButtonsActivation }) {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [log, setLog] = useState<string[]>([])

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-6), msg])
    }, [])

    return (
        <section>
            <SectionHeading
                emoji="→"
                emojiColor="rgba(245,158,11,0.15)"
                title="Right Edge — Pinned Button"
                description="Node pinned to the right edge. Menu fans left."
            />

            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{
                    position: 'relative',
                    width: 520, height: 380,
                    background: 'rgba(15,15,26,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    overflow: 'visible',
                }}
                    onClick={() => setSelectedId(null)}
                >
                    <MockNode
                        id="right-node"
                        label="Deploy"
                        color="#f59e0b"
                        icon="🚀"
                        selected={selectedId === 'right-node'}
                        onClick={() => setSelectedId(prev => prev === 'right-node' ? null : 'right-node')}
                        onMouseEnter={mode === 'swipe' ? () => setSelectedId('right-node') : undefined}
                        style={{ position: 'absolute', top: '50%', right: 24, transform: 'translateY(-50%)' }}
                    />
                </div>

                <EventLog log={log} placeholder="Click the edge node..." />
            </div>

            {selectedId && (
                <SwipeButtons
                    nodeId={selectedId}
                    currentLabel="Deploy"
                    activationMode={mode}
                    onAddBefore={(id, type) => { addLog(`⬅ Before ${type}: ${id}`); setSelectedId(null) }}
                    onAddAfter={(id, type) => { addLog(`➡ After ${type}: ${id}`); setSelectedId(null) }}
                    onConfigure={(id, action) => {
                        addLog(`⚙ ${action}: ${id}`)
                        if (action !== 'rename') setSelectedId(null)
                    }}
                    onRename={(id, newName) => { addLog(`✏ Rename: ${id} → ${newName}`) }}
                    onDismiss={() => setSelectedId(null)}
                />
            )}
        </section>
    )
}

// ── Page Component ──────────────────────────────────────────────────────────────

export function ButtonsMenuPage() {
    const [mode, setMode] = useState<SwipeButtonsActivation>('click')

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
                SwipeButtons
            </h1>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                Radial action menus optimised for touchscreen devices — trains muscle memory for frequent actions
            </p>
            <p style={{ fontSize: 10, color: '#475569', marginBottom: 24, maxWidth: 600, lineHeight: 1.5 }}>
                Select an activation mode below, then interact with the nodes in each preview.
                In <strong style={{ color: '#c4b5fd' }}>Click</strong> mode, tap the buttons directly.
                In <strong style={{ color: '#c4b5fd' }}>Hold</strong> mode, press and hold (~500 ms) — watch the progress ring.
                In <strong style={{ color: '#c4b5fd' }}>Swipe</strong> mode, just hover to expand sub-menus.
            </p>

            <ModeSelector mode={mode} onChange={setMode} />

            <CenterPreview mode={mode} />

            <div style={{ height: 48 }} />

            <LeftCornerPreview mode={mode} />

            <div style={{ height: 48 }} />

            <RightEdgePreview mode={mode} />
        </div>
    )
}
