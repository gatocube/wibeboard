/**
 * MobileRenderer — experimental renderer adapted for mobile devices.
 *
 * Renders ALL nodes in a vertical top-to-bottom flow, ignoring ReactFlow
 * positions and sizes. Uses topological ordering from edges to determine
 * the correct node sequence. Parallel (concurrent) nodes at the same
 * level are displayed side-by-side in compact cards.
 */

import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'

// ── Types ──

interface RendererProps {
    nodes: Node[]
    edges: Edge[]
}

// ── Topological sort using edges ──

/** Returns nodes in topological order (source → target). Parallel siblings are grouped. */
function topoSort(nodes: Node[], edges: Edge[]): Node[][] {
    const nodeMap = new Map<string, Node>()
    for (const n of nodes) nodeMap.set(n.id, n)

    const inDegree = new Map<string, number>()
    const children = new Map<string, string[]>()

    for (const n of nodes) {
        inDegree.set(n.id, 0)
        children.set(n.id, [])
    }

    for (const e of edges) {
        if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
            inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
            children.get(e.source)?.push(e.target)
        }
    }

    // BFS level-by-level → each level is a group of parallel nodes
    const levels: Node[][] = []
    let queue = nodes.filter(n => (inDegree.get(n.id) || 0) === 0)
    const visited = new Set<string>()

    while (queue.length > 0) {
        const level: Node[] = []
        const nextQueue: Node[] = []

        for (const n of queue) {
            if (visited.has(n.id)) continue
            visited.add(n.id)
            level.push(n)

            for (const childId of children.get(n.id) || []) {
                const newDeg = (inDegree.get(childId) || 1) - 1
                inDegree.set(childId, newDeg)
                if (newDeg === 0 && !visited.has(childId)) {
                    const childNode = nodeMap.get(childId)
                    if (childNode) nextQueue.push(childNode)
                }
            }
        }

        if (level.length > 0) levels.push(level)
        queue = nextQueue
    }

    // Add any remaining nodes not connected by edges
    for (const n of nodes) {
        if (!visited.has(n.id)) {
            levels.push([n])
            visited.add(n.id)
        }
    }

    return levels
}

// ── Node Card ──

function MobileNodeCard({ node, isCompact }: { node: Node; isCompact: boolean }) {
    const data = node.data as any
    const label = String(data?.label || node.id)
    const wtype = String(data?.widgetType || node.type || '')
    const category = String(data?.category || '')
    const status = data?.status

    const isInfo = category === 'Informer' || wtype === 'info' || wtype === 'informer'
    const isTool = category === 'Expectation' || wtype === 'expectation' || wtype === 'artifact' || wtype === 'tool'

    const statusColor = status === 'success' ? '#22c55e'
        : status === 'failed' ? '#ef4444'
            : status === 'working' ? '#f59e0b'
                : isInfo ? '#3b82f6'
                    : isTool ? '#ec4899'
                        : '#8b5cf6'

    const statusBg = status === 'success' ? 'rgba(34,197,94,0.1)'
        : status === 'failed' ? 'rgba(239,68,68,0.1)'
            : status === 'working' ? 'rgba(245,158,11,0.1)'
                : isInfo ? 'rgba(59,130,246,0.08)'
                    : isTool ? 'rgba(236,72,153,0.08)'
                        : 'rgba(139,92,246,0.06)'

    // Icon based on type
    const icon = isInfo ? 'ℹ️' : isTool ? '🔧' : wtype === 'ai' ? '🤖' : wtype === 'user' ? '👤' : null

    return (
        <div
            data-testid={`mobile-node-${node.id}`}
            style={{
                background: 'rgba(15,15,26,0.9)',
                border: `1.5px solid ${statusColor}44`,
                borderRadius: isCompact ? 8 : 12,
                padding: isCompact ? '6px 10px' : '12px 16px',
                width: isCompact ? 'auto' : '100%',
                maxWidth: isCompact ? 140 : undefined,
                minWidth: isCompact ? 80 : undefined,
                flex: isCompact ? '0 1 auto' : undefined,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
            }}>
            {/* Status dot + icon + label */}
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
                {icon && <span style={{ fontSize: isCompact ? 10 : 12, flexShrink: 0 }}>{icon}</span>}
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
                    {wtype || 'node'}
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

export function MobileRenderer({ nodes, edges }: RendererProps) {
    // Topological sort: group nodes into levels using edges
    const levels = useMemo(() => topoSort(nodes, edges), [nodes, edges])

    return (
        <div style={{
            width: '100%', height: '100%', position: 'relative',
            background: '#0a0a14', display: 'flex',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden', minHeight: 0,
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

            {/* Main vertical flow */}
            <div
                data-testid="mobile-main-flow"
                style={{
                    flex: 1, overflowY: 'auto', padding: '52px 16px 16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 0,
                }}>
                {levels.map((level, i) => {
                    const isParallel = level.length > 1

                    return (
                        <div key={`level-${i}`} style={{ width: '100%', maxWidth: 320 }}>
                            {i > 0 && <FlowArrow />}
                            {isParallel ? (
                                <div style={{
                                    display: 'flex', gap: 8,
                                    justifyContent: 'center', flexWrap: 'wrap',
                                }}>
                                    {level.map(node => (
                                        <MobileNodeCard key={node.id} node={node} isCompact />
                                    ))}
                                </div>
                            ) : (
                                <MobileNodeCard node={level[0]} isCompact={false} />
                            )}
                        </div>
                    )
                })}

                {levels.length === 0 && (
                    <div style={{ color: '#475569', fontSize: 11, padding: 24, textAlign: 'center' }}>
                        No flow nodes to display
                    </div>
                )}
            </div>
        </div>
    )
}
