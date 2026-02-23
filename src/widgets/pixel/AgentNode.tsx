import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { StatusDot } from '@/widgets/StatusDot'

/**
 * AgentNode (pixel) — #16 Airport Departure Board design.
 *
 * Terminal-aesthetic with monospace font, grid stats layout,
 * blinking "ACTIVE" indicator, and no animations beyond the blink.
 *
 * data.label — node name (displayed UPPERCASE)
 * data.agent — agent model name
 * data.status — 'idle' | 'running' | 'done' | 'error'
 * data.progress — 0-100
 * data.execTime — execution time string
 * data.callsCount — number of tool calls
 * data.width / data.height — dimensions
 */
export function AgentNode({ data }: { data: any }) {
    const status = data.status || 'idle'
    const w = data.width || 220
    const h = data.height || 100
    const isCompact = w <= 60
    const isLarge = w >= 280
    const logs: string[] = data.logs || []

    const hasKnock = !!(data.knockSide)

    const statusConfig: Record<string, { label: string; color: string }> = {
        idle: { label: 'IDLE', color: '#666' },
        waking: { label: 'WAKE', color: '#fbbf24' },
        running: { label: 'ACTIVE', color: '#22c55e' },
        done: { label: 'DONE', color: '#3b82f6' },
        error: { label: 'ERROR', color: '#ef4444' },
    }
    const st = statusConfig[status] || statusConfig.idle

    // Knocking animation: border flashes — triggers on knockSide, not just waking
    const kColor = data.knockColor || '#f97316'
    const knockAnimation = hasKnock ? {
        borderColor: ['#1a1a1a', kColor, '#1a1a1a'],
    } : {}
    const knockTransition = hasKnock
        ? { repeat: Infinity, duration: 0.5, ease: 'easeOut' as const, times: [0, 0.7, 1] }
        : {}

    // ── Compact mode (icon size) ──
    if (isCompact) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <motion.div
                    animate={knockAnimation}
                    transition={knockTransition}
                    style={{
                        width: w, height: h,
                        background: '#0a0a0a',
                        border: '1px solid #1a1a1a',
                        borderRadius: 2,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, boxSizing: 'border-box',
                        position: 'relative',
                        fontFamily: "'Press Start 2P', monospace",
                    }}
                >
                    <StatusDot status={status} />
                    <Handle type="target" position={Position.Left} style={{
                        background: '#fbbf24', border: '2px solid #fbbf2455', width: 4, height: 4, borderRadius: 0,
                    }} />
                    <Handle type="source" position={Position.Right} style={{
                        background: '#666', border: '2px solid #33333355', width: 4, height: 4, borderRadius: 0,
                    }} />
                    <span style={{ fontSize: 14, color: '#fbbf24' }}>◈</span>
                    <span style={{ fontSize: 7, color: st.color, fontWeight: 700 }}>{st.label}</span>
                </motion.div>
                {/* Node name */}
                <span style={{ fontSize: 8, color: '#888', fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: "'Press Start 2P', monospace" }}>{data.label || 'Agent'}</span>
                {/* Thought text */}
                {data.thought && (
                    <span style={{ fontSize: 7, color: '#666', fontStyle: 'italic', marginTop: 2, maxWidth: w + 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: "'Press Start 2P', monospace" }}>💭 {data.thought}</span>
                )}
            </div>
        )
    }

    return (
        <motion.div
            animate={knockAnimation}
            transition={knockTransition}
            style={{
                width: w, height: h,
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: 4,
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', monospace",
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
            }}>
            <Handle type="target" position={Position.Left} style={{
                background: '#fbbf24', border: '2px solid #fbbf2455', width: 6, height: 6, borderRadius: 0,
            }} />
            <Handle type="source" position={Position.Right} style={{
                background: '#666', border: '2px solid #33333355', width: 6, height: 6, borderRadius: 0,
            }} />

            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>
                    {(data.label || 'AGENT').toUpperCase()}
                </span>
                <motion.span
                    animate={status === 'running' ? { opacity: [1, 0, 1] } : {}}
                    transition={status === 'running' ? { repeat: Infinity, duration: 1 } : {}}
                    style={{ fontSize: 10, color: st.color }}
                >
                    ● {st.label}
                </motion.span>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#333', margin: '2px 0' }} />

            {/* PreviewCanvas — terminal output for large nodes */}
            {isLarge && logs.length > 0 && (
                <div style={{
                    flex: 1, minHeight: 0, marginTop: 4,
                    background: '#050505',
                    border: '1px solid #222',
                    padding: '3px 6px',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{ fontSize: 7, color: '#444', marginBottom: 2 }}>{'>'} OUTPUT</div>
                    <div style={{
                        flex: 1, overflow: 'hidden',
                        fontSize: 8, lineHeight: '12px',
                    }}>
                        {logs.slice(-5).map((line, i) => (
                            <div key={i} style={{
                                color: line.startsWith('⚡') ? '#fbbf24'
                                    : line.startsWith('📦') ? '#22c55e'
                                        : line.startsWith('←') ? '#888'
                                            : '#555',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '2px 12px', fontSize: 9, flex: 1,
                alignContent: 'center',
            }}>
                <span style={{ color: '#666' }}>AGENT</span>
                <span style={{ color: '#e2e8f0' }}>{data.agent || 'Default'}</span>
                <span style={{ color: '#666' }}>TIME</span>
                <span style={{ color: '#e2e8f0' }}>{data.execTime || '—'}</span>
                <span style={{ color: '#666' }}>CALLS</span>
                <span style={{ color: '#e2e8f0' }}>{data.callsCount ?? 0}</span>
                <span style={{ color: '#666' }}>PROG</span>
                <span style={{ color: '#fbbf24' }}>{data.progress ?? 0}%</span>
            </div>
        </motion.div>
    )
}
