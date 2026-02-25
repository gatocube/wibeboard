import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Workflow } from 'lucide-react'

/**
 * SubFlowNode (wibeglow) — nested sub-flow container.
 *
 * data.label      — subflow name
 * data.color      — accent color
 * data.nodeCount  — number of nodes inside
 * data.avgExecTime — average execution time string
 * data.hasAI      — if true, renders AI-style rainbow gradient border
 * data.width / data.height — dimensions
 */
export function SubFlowNode({ data }: { data: any }) {
    const color = data.color || '#6366f1'
    const w = data.width || 280
    const h = data.height || 160
    const hasAI = data.hasAI ?? false
    const nodeCount = data.nodeCount ?? 0
    const avgExecTime = data.avgExecTime || '—'

    // AI-style rainbow gradient or plain indigo
    const borderBg = hasAI
        ? `linear-gradient(135deg, ${color}, #06b6d4, #f59e0b)`
        : color

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
                width: w, height: h,
                padding: hasAI ? 1.5 : 0,
                borderRadius: 16,
                background: hasAI ? borderBg : 'transparent',
                boxShadow: hasAI
                    ? `0 0 20px ${color}33, 0 0 40px ${color}15`
                    : `0 4px 16px rgba(0,0,0,0.3)`,
            }}
        >
            <div style={{
                width: '100%', height: '100%',
                borderRadius: hasAI ? 14.5 : 16,
                background: `${color}06`,
                border: hasAI ? 'none' : `2px dashed ${color}33`,
                position: 'relative',
                boxShadow: `inset 0 0 40px ${color}05`,
                display: 'flex',
                flexDirection: 'column',
            }}>
                <Handle type="target" position={Position.Left} style={{
                    background: color, border: `2px solid ${color}55`, width: 8, height: 8,
                }} />
                <Handle type="source" position={Position.Right} style={{
                    background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
                }} />

                {/* Title badge */}
                <div style={{
                    position: 'absolute', top: -10, left: 16,
                    padding: '2px 10px', borderRadius: 6,
                    background: hasAI
                        ? `linear-gradient(135deg, ${color}25, #06b6d425)`
                        : `${color}18`,
                    border: `1px solid ${color}33`,
                    fontSize: 10, fontWeight: 600, color,
                    fontFamily: 'Inter',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <Workflow size={10} />
                    {data.label || 'SubFlow'}
                </div>

                {/* Stats row — bottom */}
                <div style={{
                    marginTop: 'auto',
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px',
                    borderTop: `1px solid ${color}15`,
                }}>
                    {/* Node count */}
                    <div style={{
                        fontSize: 9, color: '#94a3b8',
                        fontFamily: "'JetBrains Mono', monospace",
                        display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                        <span style={{
                            background: `${color}20`,
                            padding: '1px 5px',
                            borderRadius: 4,
                            color,
                            fontWeight: 700,
                            fontSize: 8,
                        }}>{nodeCount}</span>
                        <span>nodes</span>
                    </div>

                    {/* Avg exec time */}
                    <div style={{
                        fontSize: 9, color: '#64748b',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        ⏱ {avgExecTime}
                    </div>

                    {/* AI badge */}
                    {hasAI && (
                        <div style={{
                            marginLeft: 'auto',
                            fontSize: 7, fontWeight: 700,
                            color: '#c084fc',
                            background: 'rgba(139,92,246,0.12)',
                            padding: '1px 6px', borderRadius: 4,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            AI
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
