import { Handle, Position, NodeToolbar } from '@xyflow/react'
import { motion } from 'framer-motion'
import { User, MessageSquare, Check } from 'lucide-react'
import { StatusDot } from '@/widgets/StatusDot'

/**
 * UserNode (wibeglow) — Human interaction node.
 *
 * Shows a user avatar/icon with status. When status is 'waiting',
 * clicking opens a code review dialog with Approve / Comment buttons.
 *
 * data.label — node name (e.g. "Code Review")
 * data.color — accent color (default: amber #f59e0b)
 * data.status — 'idle' | 'waiting' | 'done'
 * data.width / data.height — dimensions
 * data.onApprove — callback when user clicks Approve
 * data.onComment — callback when user clicks Comment
 * data.reviewTitle — title shown in review dialog
 * data.reviewBody — body text in review dialog
 * data.commentCount — number of previous comments
 * data.connectedHandles — handle visibility
 * data.editMode — show all handles
 */
export function UserNode({ data }: { data: any }) {
    const color = data.color || '#f59e0b'
    const status = data.status || 'idle'
    const w = data.width || 160
    const h = data.height || 100
    const isCompact = w <= 60
    const isWaiting = status === 'waiting'
    const editMode = !!data.editMode
    const connectedHandles: string[] = data.connectedHandles || ['in', 'out']

    const borderGradient = isWaiting
        ? `linear-gradient(135deg, ${color}, #ef4444, #8b5cf6)`
        : `linear-gradient(135deg, ${color}, #f97316, ${color}88)`

    // ── Compact mode ──
    if (isCompact) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <motion.div
                    animate={isWaiting ? { scale: [1, 1.08, 1] } : {}}
                    transition={isWaiting ? { repeat: Infinity, duration: 1.5 } : {}}
                    style={{
                        width: w, height: h,
                        padding: 1,
                        borderRadius: 12,
                        background: borderGradient,
                        boxShadow: isWaiting
                            ? `0 0 16px ${color}44, 0 2px 8px rgba(0,0,0,0.3)`
                            : `0 2px 8px rgba(0,0,0,0.3)`,
                        position: 'relative',
                    }}
                >
                    {(editMode || connectedHandles.includes('in')) && <Handle type="target" position={Position.Left} id="in" style={{
                        background: color, border: `2px solid ${color}55`, width: 6, height: 6,
                    }} />}
                    {(editMode || connectedHandles.includes('out')) && <Handle type="source" position={Position.Right} id="out" style={{
                        background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 6, height: 6,
                    }} />}
                    <div style={{
                        background: '#0f0f1a', borderRadius: 11,
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, boxSizing: 'border-box',
                    }}>
                        <StatusDot status={status === 'waiting' ? 'running' : status} />
                        <User size={16} style={{ color }} />
                    </div>
                </motion.div>
                <span style={{ fontSize: 8, color: '#e2e8f0', fontWeight: 600, marginTop: 4, textAlign: 'center', fontFamily: "'Caveat', 'Inter', sans-serif" }}>{data.label || 'User'}</span>
            </div>
        )
    }

    // ── M / L mode ──
    return (
        <>
            {/* Code review dialog — shown when waiting */}
            <NodeToolbar
                isVisible={isWaiting}
                position={Position.Top}
                offset={12}
                align="center"
                style={{ zIndex: 1000 }}
            >
                <div
                    className="nodrag nopan"
                    style={{
                        width: Math.max(280, w),
                        borderRadius: 10,
                        background: 'rgba(15,15,30,0.97)',
                        border: `1px solid ${color}33`,
                        boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px ${color}11`,
                        backdropFilter: 'blur(16px)',
                        overflow: 'hidden',
                        fontFamily: "'Caveat', 'Inter', sans-serif",
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 12px',
                        background: `${color}0a`,
                        borderBottom: `1px solid ${color}22`,
                    }}>
                        <User size={14} style={{ color }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0' }}>
                            {data.reviewTitle || 'Code Review'}
                        </span>
                        {data.commentCount > 0 && (
                            <span style={{
                                fontSize: 9, color: '#f59e0b', background: 'rgba(245,158,11,0.15)',
                                padding: '1px 6px', borderRadius: 8, fontWeight: 600,
                            }}>
                                Round {data.commentCount + 1}
                            </span>
                        )}
                    </div>

                    {/* Body */}
                    <div style={{
                        padding: '10px 12px',
                        fontSize: 10, lineHeight: '16px', color: '#94a3b8',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}>
                        {data.reviewBody || 'Review the changes and approve or request modifications.'}
                    </div>

                    {/* Actions */}
                    <div style={{
                        display: 'flex', gap: 6,
                        padding: '8px 12px',
                        borderTop: `1px solid ${color}11`,
                    }}>
                        <button
                            data-testid="user-comment-btn"
                            onClick={() => data.onComment?.()}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                                border: '1px solid rgba(245,158,11,0.2)',
                                borderRadius: 6, padding: '5px 10px', fontSize: 10,
                                fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'Caveat', 'Inter', sans-serif",
                            }}
                        >
                            <MessageSquare size={12} /> Comment
                        </button>
                        <button
                            data-testid="user-approve-btn"
                            onClick={() => data.onApprove?.()}
                            style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                background: 'rgba(34,197,94,0.15)', color: '#22c55e',
                                border: '1px solid rgba(34,197,94,0.25)',
                                borderRadius: 6, padding: '5px 10px', fontSize: 10,
                                fontWeight: 600, cursor: 'pointer',
                                fontFamily: "'Caveat', 'Inter', sans-serif",
                            }}
                        >
                            <Check size={12} /> Approve
                        </button>
                    </div>
                </div>
            </NodeToolbar>

            <motion.div
                animate={isWaiting ? { scale: [1, 1.03, 1] } : {}}
                transition={isWaiting ? { repeat: Infinity, duration: 1.5 } : {}}
                style={{
                    width: w, height: h,
                    padding: 1,
                    borderRadius: 14,
                    background: borderGradient,
                    boxShadow: isWaiting
                        ? `0 0 24px ${color}33, 0 4px 16px rgba(0,0,0,0.3)`
                        : `0 4px 16px rgba(0,0,0,0.3)`,
                }}
            >
                {(editMode || connectedHandles.includes('in')) && <Handle type="target" position={Position.Left} id="in" style={{
                    background: color, border: `2px solid ${color}55`, width: 8, height: 8,
                }} />}
                {(editMode || connectedHandles.includes('out')) && <Handle type="source" position={Position.Right} id="out" style={{
                    background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
                }} />}

                <div style={{
                    background: '#1a1b26', borderRadius: 13,
                    height: '100%',
                    display: 'flex', flexDirection: 'column',
                    padding: '8px 12px', boxSizing: 'border-box',
                    gap: 6,
                }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: `${color}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <User size={13} style={{ color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', fontFamily: "'Caveat', 'Inter', sans-serif" }}>
                                {data.label || 'User'}
                            </div>
                            <div style={{ fontSize: 8, color: '#64748b', fontFamily: "'Caveat', 'Inter', sans-serif" }}>
                                {status === 'waiting' ? '⏳ Awaiting review' : status === 'done' ? '✓ Approved' : 'Not yet active'}
                            </div>
                        </div>
                        <StatusDot status={status === 'waiting' ? 'running' : status} />
                    </div>

                    {/* Status text */}
                    {isWaiting && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                fontSize: 9, color, fontFamily: "'JetBrains Mono', monospace",
                                textAlign: 'center', padding: '4px 0',
                            }}
                        >
                            Click to review changes ↑
                        </motion.div>
                    )}
                    {status === 'done' && (
                        <div style={{
                            fontSize: 9, color: '#22c55e', fontFamily: "'JetBrains Mono', monospace",
                            textAlign: 'center', padding: '4px 0',
                        }}>
                            ✓ Changes approved
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    )
}
