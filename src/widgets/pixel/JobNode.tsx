import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { StatusDot } from '@/widgets/StatusDot'
import { BaseNode } from '@/widgets/BaseNode'

/**
 * JobNode (pixel) — Unified retro/terminal-style node for agents and scripts.
 *
 * Variant-based rendering:
 *   'agent' → Airport departure board with grid stats, blinking ACTIVE
 *   'script' → Terminal window with monospace output, blinking cursor
 *
 * data.variant — 'agent' | 'script' (default: 'agent')
 * data.subtype — 'ai' | 'script' | custom (default: variant)
 * data.ctx — NodeContext with messenger
 * data.label — node name
 * data.status — 'idle' | 'waking' | 'running' | 'done' | 'error'
 * data.language — 'js' | 'ts' | 'sh' | 'py' (script variant)
 * data.logs — string[] output lines
 * data.knockSide — 'in' | 'out' | null
 * data.width / data.height — dimensions
 * data.tuiMode — use Courier instead of Press Start 2P
 */

const LANG_COLORS: Record<string, string> = {
    js: '#f7df1e', ts: '#3178c6', sh: '#22c55e', py: '#3776ab',
}

export function JobNode({ data }: { data: any }) {
    const subType = data.subType || 'ai'

    return (
        <BaseNode data={data} type="job" subType={subType}>
            <JobNodeInner data={data} subType={subType} />
        </BaseNode>
    )
}

function JobNodeInner({ data, subType }: { data: any; subType: string }) {
    const isAI = subType === 'ai'
    const status = data.status || 'idle'
    const w = data.width || 220
    const h = data.height || 100
    const isCompact = w <= 60
    const logs: string[] = data.logs || []

    const hasKnock = !!(data.knockSide)

    // Pixel font
    const pixelFont = data.tuiMode
        ? "'Courier New', Courier, monospace"
        : "'Press Start 2P', monospace"

    // Knock animation
    const kColor = data.knockColor || '#f97316'
    const knockOut = data.knockSide === 'out'
    const knockAnimation = hasKnock ? (
        knockOut
            ? { borderRightColor: ['#1a1a1a', kColor, '#1a1a1a'] }
            : { borderLeftColor: ['#1a1a1a', kColor, '#1a1a1a'] }
    ) : {}
    const knockTransition = hasKnock
        ? { repeat: Infinity, duration: 0.5, ease: 'easeOut' as const, times: [0, 0.7, 1] }
        : {}

    if (isAI) {
        return <AgentVariant data={data} status={status} w={w} h={h} isCompact={isCompact} logs={logs} pixelFont={pixelFont} hasKnock={hasKnock} knockAnimation={knockAnimation} knockTransition={knockTransition} />
    }
    return <ScriptVariant data={data} status={status} w={w} h={h} isCompact={isCompact} logs={logs} pixelFont={pixelFont} hasKnock={hasKnock} knockAnimation={knockAnimation} knockTransition={knockTransition} />
}

// ── Agent variant ───────────────────────────────────────────────────────────

function AgentVariant({ data, status, w, h, isCompact, logs, pixelFont, hasKnock, knockAnimation, knockTransition }: {
    data: any; status: string; w: number; h: number; isCompact: boolean
    logs: string[]; pixelFont: string; hasKnock: boolean; knockAnimation: any; knockTransition: any
}) {
    const isLarge = w >= 280
    const statusConfig: Record<string, { label: string; color: string }> = {
        idle: { label: 'IDLE', color: '#666' },
        waking: { label: 'WAKE', color: '#fbbf24' },
        running: { label: 'ACTIVE', color: '#22c55e' },
        done: { label: 'DONE', color: '#3b82f6' },
        error: { label: 'ERR!', color: '#ef4444' },
        waiting: { label: 'WAIT', color: '#a855f7' },
    }
    const st = statusConfig[status] || statusConfig.idle

    if (isCompact) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <motion.div
                    animate={knockAnimation}
                    transition={knockTransition}
                    style={{
                        width: w, height: h,
                        background: '#0a0a0a',
                        border: `1px solid ${status === 'running' ? '#22c55e' : '#1a1a1a'}`,
                        borderRadius: 2,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, boxSizing: 'border-box',
                        position: 'relative',
                        fontFamily: pixelFont,
                    }}
                >
                    <Handle type="target" position={Position.Left} style={{
                        background: '#fbbf24', border: '2px solid #fbbf2455', width: 4, height: 4, borderRadius: 0,
                    }} />
                    <Handle type="source" position={Position.Right} style={{
                        background: '#666', border: '2px solid #33333355', width: 4, height: 4, borderRadius: 0,
                    }} />
                    <StatusDot status={status} />
                    <motion.span
                        animate={status === 'running' ? { opacity: [1, 0, 1] } : {}}
                        transition={status === 'running' ? { repeat: Infinity, duration: 1 } : {}}
                        style={{ fontSize: 7, color: st.color, fontWeight: 700 }}
                    >{st.label}</motion.span>
                </motion.div>
                <span style={{ fontSize: 8, color: '#888', fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: pixelFont }}>{(data.label || 'Agent').toUpperCase()}</span>
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
                display: 'flex', flexDirection: 'column',
                boxSizing: 'border-box',
                fontFamily: pixelFont,
                overflow: 'hidden',
            }}
        >
            <Handle type="target" position={Position.Left} style={{ background: '#fbbf24', border: '2px solid #fbbf2455', width: 6, height: 6, borderRadius: 0 }} />
            <Handle type="source" position={Position.Right} style={{ background: '#666', border: '2px solid #33333355', width: 6, height: 6, borderRadius: 0 }} />

            {/* Header */}
            <div style={{
                padding: '4px 10px',
                background: '#111',
                borderBottom: '1px solid #222',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <span style={{ fontSize: 8, color: '#888' }}>{(data.label || 'Agent').toUpperCase()}</span>
                <motion.span
                    animate={status === 'running' ? { opacity: [1, 0, 1] } : {}}
                    transition={status === 'running' ? { repeat: Infinity, duration: 1 } : {}}
                    style={{ fontSize: 8, color: st.color }}
                >● {st.label}</motion.span>
            </div>

            {/* Stats grid */}
            <div style={{
                flex: 1, padding: '4px 10px',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
                fontSize: 8, color: '#555',
            }}>
                <div>MDL <span style={{ color: '#888' }}>{(data.agent || '—').toUpperCase()}</span></div>
                <div>PRC <span style={{ color: st.color }}>{data.progress ?? 0}%</span></div>
                <div>TIM <span style={{ color: '#888' }}>{data.execTime || '—'}</span></div>
                <div>CLL <span style={{ color: '#888' }}>⚡{data.callsCount ?? 0}</span></div>
            </div>

            {/* Logs */}
            {isLarge && logs.length > 0 && (
                <div style={{ padding: '2px 10px', borderTop: '1px solid #222', overflow: 'hidden' }}>
                    {logs.slice(-3).map((line, i) => (
                        <div key={i} style={{ fontSize: 7, color: '#555', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            <span style={{ color: '#22c55e' }}>{'>'}</span> {line}
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div style={{
                padding: '2px 10px',
                borderTop: '1px solid #222',
                display: 'flex', justifyContent: 'space-between',
                fontSize: 7, color: '#444',
            }}>
                <span style={{ color: st.color }}>
                    {status === 'running' ? '█▓▒░' : status === 'done' ? 'COMPLETE' : '░░░░'}
                </span>
            </div>
        </motion.div>
    )
}

// ── Script variant ──────────────────────────────────────────────────────────

function ScriptVariant({ data, status, w, h, isCompact, logs, pixelFont, hasKnock, knockAnimation, knockTransition }: {
    data: any; status: string; w: number; h: number; isCompact: boolean
    logs: string[]; pixelFont: string; hasKnock: boolean; knockAnimation: any; knockTransition: any
}) {
    const lang = data.language || 'sh'
    const langColor = LANG_COLORS[lang] || '#22c55e'
    const isMedium = w <= 160 && !isCompact

    const statusConfig: Record<string, { label: string; color: string }> = {
        idle: { label: 'IDLE', color: '#666' },
        waking: { label: 'WAKE', color: '#fbbf24' },
        running: { label: 'RUN', color: '#22c55e' },
        done: { label: 'DONE', color: '#3b82f6' },
        error: { label: 'ERR', color: '#ef4444' },
    }
    const st = statusConfig[status] || statusConfig.idle

    if (isCompact) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <motion.div
                    animate={knockAnimation}
                    transition={knockTransition}
                    style={{
                        width: w, height: h,
                        background: '#0a0a0a',
                        border: `1px solid ${status === 'running' ? langColor : '#1a1a1a'}`,
                        borderRadius: 2,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, boxSizing: 'border-box',
                        position: 'relative',
                        fontFamily: pixelFont,
                    }}
                >
                    <StatusDot status={status} />
                    <Handle type="target" position={Position.Left} style={{ background: '#fbbf24', border: '2px solid #fbbf2455', width: 4, height: 4, borderRadius: 0 }} />
                    <Handle type="source" position={Position.Right} style={{ background: '#666', border: '2px solid #33333355', width: 4, height: 4, borderRadius: 0 }} />
                    <span style={{ fontSize: 14, color: langColor }}>{'>'}_</span>
                    <span style={{ fontSize: 7, color: st.color, fontWeight: 700 }}>{st.label}</span>
                </motion.div>
                <span style={{ fontSize: 8, color: '#888', fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: pixelFont }}>{data.label || 'Script'}</span>
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
                display: 'flex', flexDirection: 'column',
                boxSizing: 'border-box',
                fontFamily: pixelFont,
                overflow: 'hidden',
            }}
        >
            <Handle type="target" position={Position.Left} style={{ background: '#fbbf24', border: '2px solid #fbbf2455', width: 6, height: 6, borderRadius: 0 }} />
            <Handle type="source" position={Position.Right} style={{ background: '#666', border: '2px solid #33333355', width: 6, height: 6, borderRadius: 0 }} />

            {/* Terminal title bar */}
            <div style={{
                padding: isMedium ? '3px 6px' : '4px 10px',
                background: '#111',
                borderBottom: '1px solid #222',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff5f57' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#febc2e' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#28c840' }} />
                </div>
                <span style={{ fontSize: 8, color: '#666' }}>
                    {(data.label || 'script').toUpperCase()}
                </span>
                <motion.span
                    animate={status === 'running' ? { opacity: [1, 0, 1] } : {}}
                    transition={status === 'running' ? { repeat: Infinity, duration: 1 } : {}}
                    style={{ fontSize: 8, color: st.color }}
                >
                    ● {st.label}
                </motion.span>
            </div>

            {/* Terminal output */}
            <div style={{
                flex: 1, padding: isMedium ? '3px 6px' : '4px 10px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column', gap: 1,
            }}>
                {logs.length > 0 ? (
                    logs.slice(-(isMedium ? 3 : 5)).map((line, i) => (
                        <div key={i} style={{
                            fontSize: 8, color: '#888',
                            display: 'flex', gap: 4,
                            overflow: 'hidden', whiteSpace: 'nowrap',
                        }}>
                            <span style={{ color: langColor, flexShrink: 0 }}>$</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{line}</span>
                        </div>
                    ))
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 8, color: '#444' }}>
                            <span style={{ color: langColor }}>$</span>
                            {status === 'running' && (
                                <motion.span
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                    style={{ color: '#888' }}
                                > ▌</motion.span>
                            )}
                            {status === 'idle' && ' waiting...'}
                        </span>
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isMedium && (
                <div style={{
                    padding: '2px 10px',
                    borderTop: '1px solid #222',
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 7, color: '#444',
                }}>
                    <span style={{ color: langColor }}>{lang.toUpperCase()}</span>
                    <span style={{ display: 'flex', gap: 6 }}>
                        <span>{data.execTime || '—'}</span>
                        <span>⚡{data.callsCount ?? 0}</span>
                        <span style={{ color: st.color }}>{data.progress ?? 0}%</span>
                    </span>
                </div>
            )}
        </motion.div>
    )
}
