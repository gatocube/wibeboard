import { Handle, Position } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { StatusDot } from '@/widgets/StatusDot'
import { ShimmeringText, SplittingText } from '@/components/animate-ui'

/**
 * AgentNode (wibeglow) — #26 Gradient Border design.
 *
 * Modern dark node with a vibrant gradient border, progress bar,
 * and agent stats in monospace.
 *
 * data.label — node name (e.g. "Code Generator")
 * data.color — primary accent color
 * data.status — 'idle' | 'waking' | 'running' | 'done' | 'error'
 * data.agent — agent model name (e.g. "Claude 3.5")
 * data.task — current task description
 * data.thought — agent's current thinking text
 * data.progress — 0-100 progress percentage
 * data.execTime — execution time string (e.g. "8.1s")
 * data.callsCount — number of tool calls
 * data.logs — string[] terminal output lines
 * data.width / data.height — dimensions
 */
export function AgentNode({ data }: { data: any }) {
    const color = data.color || '#8b5cf6'
    const status = data.status || 'idle'
    const w = data.width || 200
    const h = data.height || 120
    const isCompact = w <= 60
    const isLarge = w >= 280
    const progress = data.progress ?? 0
    const secondaryColor = '#06b6d4'
    const tertiaryColor = '#f59e0b'
    const isWaking = status === 'waking'
    const isRunning = status === 'running'
    const knockOut = data.knockSide === 'out'
    const knockIn = data.knockSide === 'in'
    const hasKnock = !!(data.knockSide)
    const logs: string[] = data.logs || []
    const knockColor = data.knockColor || '#f97316' // use provided color or fallback to orange

    const statusColors: Record<string, string> = {
        idle: '#475569', waking: color, running: '#f7df1e', done: '#28c840', error: '#ff5f57',
    }

    // Knocking animation: pulsing inset glow on left or right side
    // Triggers whenever knockSide is set (not just when waking)
    const knockBoxShadow = hasKnock
        ? knockOut
            ? [
                `inset -1px 0 0 0 ${knockColor}, 0 0 4px ${knockColor}22`,
                `inset -4px 0 0 0 ${knockColor}, 0 0 12px ${knockColor}44`,
                `inset -1px 0 0 0 ${knockColor}, 0 0 4px ${knockColor}22`,
            ]
            : knockIn
                ? [
                    `inset 1px 0 0 0 ${knockColor}, 0 0 4px ${knockColor}22`,
                    `inset 4px 0 0 0 ${knockColor}, 0 0 12px ${knockColor}44`,
                    `inset 1px 0 0 0 ${knockColor}, 0 0 4px ${knockColor}22`,
                ]
                : undefined
        : undefined

    const knockTransition = hasKnock
        ? { repeat: Infinity, duration: 0.5, ease: 'easeOut' as const, times: [0, 0.7, 1] }
        : {}

    // ── Status indicator ──
    const statusIndicator = isWaking ? (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            style={{
                width: 8, height: 8, borderRadius: '50%',
                border: `2px solid ${color}33`,
                borderTopColor: color,
                boxSizing: 'border-box',
            }}
        />
    ) : (
        <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusColors[status] || '#475569',
            boxShadow: status === 'running' ? `0 0 6px ${statusColors[status]}55` : 'none',
            animation: status === 'running' ? 'pulse 1s ease infinite' : 'none',
        }} />
    )

    // ── Compact mode (icon size) — gradient border like M/L ──
    if (isCompact) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Gradient border wrapper */}
                <motion.div
                    style={{
                        width: w, height: h,
                        padding: 1,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${color}, ${secondaryColor}, ${tertiaryColor})`,
                        boxShadow: isRunning
                            ? `0 0 16px ${color}33, 0 2px 8px rgba(0,0,0,0.3)`
                            : `0 2px 8px rgba(0,0,0,0.3)`,
                        position: 'relative',
                    }}
                >
                    <Handle type="target" position={Position.Left} style={{
                        background: color, border: `2px solid ${color}55`, width: 6, height: 6,
                    }} />
                    <Handle type="source" position={Position.Right} style={{
                        background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 6, height: 6,
                    }} />
                    <motion.div
                        animate={knockBoxShadow ? { boxShadow: knockBoxShadow } : {}}
                        transition={knockTransition}
                        style={{
                            background: '#0f0f1a', borderRadius: 11,
                            width: '100%', height: '100%',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: 2, boxSizing: 'border-box',
                        }}
                    >
                        <StatusDot status={status} />
                        <Sparkles size={16} style={{ color }} />
                    </motion.div>
                </motion.div>
                {/* Node name */}
                <span style={{ fontSize: 8, color: '#e2e8f0', fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: 'Inter' }}>{data.label || 'Agent'}</span>
                {/* Thought text */}
                {data.thought && (
                    <span style={{ fontSize: 7, color: '#64748b', fontStyle: 'italic', marginTop: 2, maxWidth: w + 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: 'Inter' }}>💭 {data.thought}</span>
                )}
            </div>
        )
    }

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={isRunning ? { opacity: 1, scale: [1, 1.03, 1] } : { opacity: 1, scale: 1 }}
            transition={isRunning ? { repeat: Infinity, duration: 1.5 } : {}}
            style={{
                width: w, height: h,
                padding: 1,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${color}, ${secondaryColor}, ${tertiaryColor})`,
                boxShadow: isRunning
                    ? `0 0 24px ${color}33, 0 4px 16px rgba(0,0,0,0.3)`
                    : `0 4px 16px rgba(0,0,0,0.3)`,
            }}
        >
            <Handle type="target" position={Position.Left} style={{
                background: color, border: `2px solid ${color}55`, width: 8, height: 8,
            }} />
            <Handle type="source" position={Position.Right} style={{
                background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
            }} />

            {/* Inner content div — knock animation lives here so inset shadow is visible */}
            <motion.div
                animate={knockBoxShadow ? { boxShadow: knockBoxShadow } : {}}
                transition={knockTransition}
                style={{
                    background: '#0f0f1a', borderRadius: 13,
                    padding: '10px 14px',
                    height: '100%',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
            >
                {/* Header — icon + label + status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <motion.div
                        animate={status === 'running' ? { rotate: [0, 15, -15, 0] } : {}}
                        transition={status === 'running' ? { duration: 1.5, repeat: Infinity } : {}}
                    >
                        <Sparkles size={14} style={{ color }} />
                    </motion.div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', fontFamily: 'Inter', flex: 1 }}>
                        {data.label || 'Agent'}
                    </span>
                    {statusIndicator}
                </div>

                {/* PreviewCanvas — terminal output for large nodes (right after name) */}
                {isLarge && logs.length > 0 && (
                    <div style={{
                        flex: 1, minHeight: 0, marginTop: 4,
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: '4px 8px',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                    }}>
                        {/* Terminal header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            marginBottom: 3,
                        }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff5f57' }} />
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#febc2e' }} />
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#28c840' }} />
                            <span style={{ fontSize: 7, color: '#475569', marginLeft: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                                output
                            </span>
                        </div>
                        {/* Log lines */}
                        <div style={{
                            flex: 1, overflow: 'hidden',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 8, lineHeight: '13px',
                        }}>
                            {logs.slice(-5).map((line, i) => (
                                <div key={i} style={{
                                    color: line.startsWith('⚡') ? '#fbbf24'
                                        : line.startsWith('📦') ? '#22c55e'
                                            : line.startsWith('←') ? '#94a3b8'
                                                : line.startsWith('ERROR') ? '#ff5f57'
                                                    : '#64748b',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Task description — shimmer when running */}
                {data.task && (
                    <div style={{
                        fontSize: 9, margin: '4px 0 2px',
                        fontFamily: 'Inter', lineHeight: 1.4,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                        {isRunning ? (
                            <ShimmeringText
                                text={data.task}
                                color="#94a3b8"
                                shimmeringColor="#e2e8f0"
                                duration={2.5}
                                style={{ fontSize: 9, fontFamily: 'Inter' }}
                            />
                        ) : (
                            <span style={{ color: '#94a3b8' }}>{data.task}</span>
                        )}
                    </div>
                )}

                {/* Thought — splitting text effect */}
                <AnimatePresence mode="wait">
                    {data.thought && (
                        <motion.div
                            key={data.thought}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                                fontSize: 8, fontFamily: 'Inter', fontStyle: 'italic',
                                overflow: 'hidden', marginBottom: 2,
                            }}
                        >
                            <SplittingText
                                text={`💭 ${data.thought}`}
                                variant="blur"
                                delay={0.02}
                                duration={0.3}
                                style={{ fontSize: 8, color: '#64748b' }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* Progress bar + percentage */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: isLarge ? 4 : 0 }}>
                    <div style={{
                        height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden', flex: 1,
                    }}>
                        <motion.div
                            style={{ height: '100%', borderRadius: 3, background: color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.6 }}
                        />
                    </div>
                    <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 8, color, fontWeight: 600, flexShrink: 0,
                    }}>
                        {progress}%
                    </span>
                </div>

                {/* Stats row: agent · time · calls */}
                <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                    color: '#64748b', marginTop: 4,
                    display: 'flex', justifyContent: 'space-between',
                }}>
                    <span>{data.agent || 'Default'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span>{data.execTime || '0s'}</span>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <AnimatedNumber value={data.callsCount ?? 0} prefix="⚡" />
                    </span>
                </div>
            </motion.div>
        </motion.div>
    )
}
