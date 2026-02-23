import { motion } from 'framer-motion'

/**
 * TimelineDots — horizontal progress dots showing node completion steps.
 *
 * Each dot represents a node in the flow, colored by its status:
 *   idle → grey, running → pulsing amber, done → green, error → red
 *
 * Props:
 *   nodes — array of { id, label, status, type? }
 */

interface TimelineNode {
    id: string
    label: string
    status: 'idle' | 'waking' | 'running' | 'done' | 'error'
    type?: string
}

const STATUS_COLORS: Record<string, string> = {
    idle: '#334155',
    waking: '#f59e0b',
    running: '#f7df1e',
    done: '#22c55e',
    error: '#ef4444',
}

export function TimelineDots({ nodes }: { nodes: TimelineNode[] }) {
    if (!nodes.length) return null

    const doneCount = nodes.filter(n => n.status === 'done').length
    const total = nodes.length

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '6px 14px',
            borderRadius: 8,
            background: 'rgba(15,15,26,0.9)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(8px)',
            fontFamily: 'Inter',
        }}>
            {/* Progress label */}
            <span style={{
                fontSize: 9, color: '#64748b', fontWeight: 600,
                flexShrink: 0, whiteSpace: 'nowrap',
            }}>
                {doneCount}/{total}
            </span>

            {/* Dots row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {nodes.map((node, i) => {
                    const color = STATUS_COLORS[node.status] || STATUS_COLORS.idle
                    const isActive = node.status === 'running'
                    const isDone = node.status === 'done'

                    return (
                        <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {/* Connector line between dots */}
                            {i > 0 && (
                                <div style={{
                                    width: 8, height: 1,
                                    background: isDone || nodes[i - 1]?.status === 'done'
                                        ? '#22c55e44'
                                        : 'rgba(255,255,255,0.06)',
                                }} />
                            )}
                            {/* Dot */}
                            <motion.div
                                animate={isActive ? {
                                    boxShadow: [`0 0 0 0 ${color}44`, `0 0 0 4px ${color}22`, `0 0 0 0 ${color}44`],
                                } : {}}
                                transition={isActive ? { repeat: Infinity, duration: 1.2 } : {}}
                                title={`${node.label} — ${node.status}`}
                                style={{
                                    width: 8, height: 8,
                                    borderRadius: '50%',
                                    background: color,
                                    cursor: 'default',
                                    flexShrink: 0,
                                    boxShadow: isDone ? `0 0 4px ${color}66` : 'none',
                                }}
                            />
                        </div>
                    )
                })}
            </div>

            {/* Percentage */}
            <span style={{
                fontSize: 9, color: doneCount === total ? '#22c55e' : '#64748b',
                fontWeight: 600, flexShrink: 0,
                fontFamily: "'JetBrains Mono', monospace",
            }}>
                {total > 0 ? Math.round((doneCount / total) * 100) : 0}%
            </span>
        </div>
    )
}
