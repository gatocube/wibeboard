import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'

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

    const statusConfig: Record<string, { label: string; color: string }> = {
        idle: { label: 'IDLE', color: '#666' },
        running: { label: 'ACTIVE', color: '#22c55e' },
        done: { label: 'DONE', color: '#3b82f6' },
        error: { label: 'ERROR', color: '#ef4444' },
    }
    const st = statusConfig[status] || statusConfig.idle

    return (
        <div style={{
            width: w, height: h,
            background: '#0a0a0a',
            border: '1px solid #1a1a1a',
            borderRadius: 4,
            padding: '6px 10px',
            fontFamily: "'JetBrains Mono', monospace",
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
        </div>
    )
}
