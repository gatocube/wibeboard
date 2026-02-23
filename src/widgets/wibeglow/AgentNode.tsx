import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

/**
 * AgentNode (wibeglow) — AI agent node with status indicator and glow effects.
 *
 * data.label — node name
 * data.color — accent color
 * data.status — 'idle' | 'running' | 'done' | 'error'
 * data.width / data.height — dimensions
 */
export function AgentNode({ data }: { data: any }) {
    const color = data.color || '#8b5cf6'
    const status = data.status || 'idle'
    const w = data.width || 200
    const h = data.height || 120

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
                width: w, height: h,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
                border: `1px solid ${color}33`,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: status === 'running'
                    ? `0 0 20px ${color}22, 0 4px 16px rgba(0,0,0,0.3)`
                    : `0 4px 16px rgba(0,0,0,0.3)`,
            }}
        >
            <Handle type="target" position={Position.Left} style={{
                background: color, border: `2px solid ${color}55`, width: 8, height: 8,
            }} />
            <Handle type="source" position={Position.Right} style={{
                background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
            }} />

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px',
                borderBottom: `1px solid ${color}22`,
            }}>
                <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: status === 'running' ? '#f7df1e'
                        : status === 'done' ? '#28c840'
                            : status === 'error' ? '#ff5f57'
                                : '#475569',
                    boxShadow: status === 'running' ? '0 0 6px #f7df1e55' : 'none',
                }} />
                <span style={{
                    flex: 1, fontSize: 11, fontWeight: 600, color: '#e2e8f0',
                    fontFamily: 'Inter',
                }}>
                    {data.label || 'Agent'}
                </span>
                <span style={{
                    fontSize: 8, fontWeight: 600, color,
                    background: `${color}15`, padding: '1px 6px', borderRadius: 4,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                    {status}
                </span>
            </div>

            {/* Body — icon + description */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '0 12px',
            }}>
                <motion.div
                    animate={status === 'running' ? { rotate: [0, 360] } : {}}
                    transition={status === 'running' ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
                >
                    <Bot size={24} style={{ color: `${color}88` }} />
                </motion.div>
                <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'Inter' }}>
                        {data.agent || 'Default'} agent
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
