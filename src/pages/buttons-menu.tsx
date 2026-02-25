/**
 * Buttons Menu — dedicated showcase for NodeButtonsMenu and ExtendedNodeButtonsMenu.
 *
 * Sections:
 *  1. NodeButtonsMenu — basic radial action buttons around a node
 *  2. ExtendedNodeButtonsMenu — with sub-menu fans for widget type selection
 */

import { useState, useCallback } from 'react'
import { ExtendedNodeButtonsMenu } from '@/kit'
import { NodeButtonsMenu } from '@/flow-builder/NodeButtonsMenu'

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

// ── Event Log ───────────────────────────────────────────────────────────────────

function EventLog({ log, placeholder }: { log: string[]; placeholder: string }) {
    return (
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

// ── 1. NodeButtonsMenu demo ─────────────────────────────────────────────────────

function NodeButtonsMenuSection() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [label, setLabel] = useState('My Node')
    const [log, setLog] = useState<string[]>([])

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-6), msg])
    }, [])

    return (
        <section>
            <SectionHeading
                emoji="⚡"
                emojiColor="rgba(139,92,246,0.15)"
                title="NodeButtonsMenu"
                description="Click a node to see the action buttons appear around it. iPad-friendly 48px touch targets."
            />

            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                <div style={{
                    position: 'relative',
                    width: 400, height: 300,
                    background: 'rgba(15,15,26,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40,
                }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null) }}
                >
                    <MockNode id="node-a" label={label} color="#8b5cf6" icon="🤖"
                        selected={selectedId === 'node-a'}
                        onClick={() => setSelectedId(prev => prev === 'node-a' ? null : 'node-a')}
                    />
                    <MockNode id="node-b" label="process.js" color="#f7df1e" icon="📜"
                        selected={selectedId === 'node-b'}
                        onClick={() => setSelectedId(prev => prev === 'node-b' ? null : 'node-b')}
                    />
                </div>

                <EventLog log={log} placeholder="Click a node to start..." />
            </div>

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

// ── 2. ExtendedNodeButtonsMenu demo ─────────────────────────────────────────────

function ExtendedMenuSection() {
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [label, setLabel] = useState('Planner')
    const [log, setLog] = useState<string[]>([])

    const addLog = useCallback((msg: string) => {
        setLog(prev => [...prev.slice(-8), msg])
    }, [])

    return (
        <section>
            <SectionHeading
                emoji="🚀"
                emojiColor="rgba(34,197,94,0.15)"
                title="ExtendedNodeButtonsMenu"
                description="Click After or Before to see widget-type sub-buttons fan out. Click Config to see Rename / Duplicate / Delete options."
            />

            <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
                <div style={{
                    position: 'relative',
                    width: 500, height: 350,
                    background: 'rgba(15,15,26,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80,
                }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null) }}
                >
                    <MockNode id="ext-node-a" label={label} color="#8b5cf6" icon="🤖"
                        selected={selectedId === 'ext-node-a'}
                        onClick={() => setSelectedId(prev => prev === 'ext-node-a' ? null : 'ext-node-a')}
                    />
                    <MockNode id="ext-node-b" label="process.js" color="#f7df1e" icon="📜"
                        selected={selectedId === 'ext-node-b'}
                        onClick={() => setSelectedId(prev => prev === 'ext-node-b' ? null : 'ext-node-b')}
                    />
                </div>

                <EventLog log={log} placeholder="Click a node, then a button..." />
            </div>

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

// ── Page Component ──────────────────────────────────────────────────────────────

export function ButtonsMenuPage() {
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
                Buttons Menu
            </h1>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 32 }}>
                Interactive node action menus — basic and extended variants
            </p>

            <NodeButtonsMenuSection />

            <div style={{ height: 48 }} />

            <ExtendedMenuSection />
        </div>
    )
}
