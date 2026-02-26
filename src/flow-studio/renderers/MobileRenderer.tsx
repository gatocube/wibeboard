/**
 * MobileRenderer — experimental renderer adapted for mobile devices.
 *
 * Uses ReactFlow in a vertical (top-to-bottom) layout with:
 * - Artifacts/Tools/Expectations pinned to a left icon sidebar
 * - Info/Informer nodes pinned to a right icon sidebar
 * - Main flow nodes rendered vertically
 * - Concurrent nodes in compact view
 */

import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'

// ── Types ──

interface RendererProps {
    nodes: Node[]
    edges: Edge[]
}

// ── Category helpers ──

type SidebarItem = { id: string; label: string; icon: string; color: string }

function categorizeSidebars(nodes: Node[]) {
    const left: SidebarItem[] = []     // Artifacts, Tools, Expectations
    const right: SidebarItem[] = []    // Info / Informer nodes
    const main: Node[] = []            // Everything else (Job, Starting, SubFlow, Layout)
    const concurrent: Node[][] = []    // Groups of nodes at same Y position

    for (const node of nodes) {
        const data = node.data as any
        const wtype = String(data?.widgetType || node.type || '')
        const category = String(data?.category || '')
        const label = String(data?.label || node.id)

        if (category === 'Expectation' || wtype === 'expectation' || wtype === 'artifact' || wtype === 'tool') {
            left.push({ id: node.id, label, icon: '🔧', color: '#ec4899' })
        } else if (category === 'Informer' || wtype === 'info' || wtype === 'informer') {
            right.push({ id: node.id, label, icon: 'ℹ️', color: '#3b82f6' })
        } else {
            main.push(node)
        }
    }

    // Detect concurrent nodes: nodes at the same Y position
    const yGroups = new Map<number, Node[]>()
    for (const node of main) {
        const y = Math.round((node.position?.y || 0) / 50) * 50
        if (!yGroups.has(y)) yGroups.set(y, [])
        yGroups.get(y)!.push(node)
    }
    for (const [, group] of yGroups) {
        if (group.length > 1) concurrent.push(group)
    }

    return { left, right, main, concurrent }
}

// ── Sidebar Icon ──

function SidebarIcon({ item, side }: { item: SidebarItem; side: 'left' | 'right' }) {
    return (
        <div
            title={item.label}
            style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: `${item.color}18`,
                border: `1.5px solid ${item.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: 6,
                ...(side === 'left' ? { marginRight: 'auto' } : { marginLeft: 'auto' }),
            }}
        >
            {item.icon}
        </div>
    )
}

// ── Main Node Card ──

function MobileNodeCard({ node, isCompact }: { node: Node; isCompact: boolean }) {
    const data = node.data as any
    const label = String(data?.label || node.id)
    const wtype = String(data?.widgetType || node.type || '')
    const status = data?.status

    const statusColor = status === 'success' ? '#22c55e'
        : status === 'failed' ? '#ef4444'
            : status === 'working' ? '#f59e0b'
                : '#8b5cf6'

    const statusBg = status === 'success' ? 'rgba(34,197,94,0.1)'
        : status === 'failed' ? 'rgba(239,68,68,0.1)'
            : status === 'working' ? 'rgba(245,158,11,0.1)'
                : 'rgba(139,92,246,0.06)'

    return (
        <div style={{
            background: 'rgba(15,15,26,0.9)',
            border: `1.5px solid ${statusColor}44`,
            borderRadius: isCompact ? 8 : 12,
            padding: isCompact ? '6px 10px' : '12px 16px',
            width: isCompact ? 'auto' : '100%',
            maxWidth: isCompact ? 120 : undefined,
            minWidth: isCompact ? 80 : undefined,
            flex: isCompact ? '0 0 auto' : undefined,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
        }}>
            {/* Status dot + label */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: isCompact ? 0 : 4,
            }}>
                <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: statusColor,
                    boxShadow: `0 0 6px ${statusColor}66`,
                    flexShrink: 0,
                }} />
                <span style={{
                    fontSize: isCompact ? 9 : 11, fontWeight: 600,
                    color: '#e2e8f0', lineHeight: 1.2,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    whiteSpace: isCompact ? 'nowrap' : undefined,
                }}>
                    {label}
                </span>
            </div>

            {/* Type badge (only in full mode) */}
            {!isCompact && (
                <div style={{
                    display: 'inline-block',
                    marginTop: 4,
                    fontSize: 8, fontWeight: 600,
                    padding: '2px 6px', borderRadius: 4,
                    background: statusBg,
                    color: statusColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                }}>
                    {wtype}
                </div>
            )}
        </div>
    )
}

// ── Edge Arrow ──

function FlowArrow() {
    return (
        <div style={{
            display: 'flex', justifyContent: 'center',
            padding: '4px 0', color: '#475569', fontSize: 14,
        }}>
            ↓
        </div>
    )
}

// ── Main renderer ──

export function MobileRenderer({ nodes, edges: _edges }: RendererProps) {
    const { left, right, main, concurrent } = useMemo(
        () => categorizeSidebars(nodes),
        [nodes]
    )

    // Build the main vertical flow, detecting concurrent groups
    const concurrentIds = new Set(concurrent.flat().map(n => n.id))

    return (
        <div style={{
            width: '100%', height: '100%', position: 'relative',
            background: '#0a0a14', display: 'flex',
            fontFamily: 'Inter, sans-serif',
        }}>
            {/* Experimental badge */}
            <div style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                zIndex: 10, padding: '4px 10px', borderRadius: 6,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                color: '#3b82f6', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.5px', backdropFilter: 'blur(8px)',
            }}>
                ⚗️ Experimental · Mobile Renderer
            </div>

            {/* Left sidebar — Artifacts / Tools / Expectations */}
            {left.length > 0 && (
                <div style={{
                    width: 52, flexShrink: 0,
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    padding: '44px 8px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    overflowY: 'auto',
                }}>
                    <div style={{
                        fontSize: 7, color: '#64748b', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '1px',
                        marginBottom: 8, writingMode: 'vertical-lr',
                        transform: 'rotate(180deg)',
                    }}>
                        Tools
                    </div>
                    {left.map(item => (
                        <SidebarIcon key={item.id} item={item} side="left" />
                    ))}
                </div>
            )}

            {/* Main vertical flow */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: '52px 16px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 0,
            }}>
                {main.map((node, i) => {
                    // Check if this node is part of a concurrent group
                    if (concurrentIds.has(node.id)) {
                        const group = concurrent.find(g => g[0].id === node.id)
                        if (!group) return null // Skip — rendered with its group leader

                        return (
                            <div key={`group-${node.id}`}>
                                {i > 0 && <FlowArrow />}
                                <div style={{
                                    display: 'flex', gap: 8,
                                    justifyContent: 'center', flexWrap: 'wrap',
                                }}>
                                    {group.map(gNode => (
                                        <MobileNodeCard key={gNode.id} node={gNode} isCompact />
                                    ))}
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div key={node.id} style={{ width: '100%', maxWidth: 280 }}>
                            {i > 0 && <FlowArrow />}
                            <MobileNodeCard node={node} isCompact={false} />
                        </div>
                    )
                })}

                {main.length === 0 && (
                    <div style={{ color: '#475569', fontSize: 11, padding: 24, textAlign: 'center' }}>
                        No flow nodes to display
                    </div>
                )}
            </div>

            {/* Right sidebar — Informer / Info nodes */}
            {right.length > 0 && (
                <div style={{
                    width: 52, flexShrink: 0,
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    padding: '44px 8px 8px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    overflowY: 'auto',
                }}>
                    <div style={{
                        fontSize: 7, color: '#64748b', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '1px',
                        marginBottom: 8, writingMode: 'vertical-rl',
                    }}>
                        Info
                    </div>
                    {right.map(item => (
                        <SidebarIcon key={item.id} item={item} side="right" />
                    ))}
                </div>
            )}
        </div>
    )
}
