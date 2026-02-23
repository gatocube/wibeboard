import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { StatusDot } from '@/widgets/StatusDot'

/**
 * ScriptNode (pixel) — Terminal/retro style.
 *
 * Looks like a terminal window with monospace output,
 * blinking cursor when running, and pixel borders.
 *
 * data.label — script name
 * data.language — 'js' | 'ts' | 'sh' | 'py'
 * data.status — 'idle' | 'waking' | 'running' | 'done' | 'error'
 * data.logs — string[] output lines
 * data.knockSide — 'in' | 'out' | null
 * data.width / data.height — dimensions
 */

const LANG_COLORS: Record<string, string> = {
    js: '#f7df1e', ts: '#3178c6', sh: '#22c55e', py: '#3776ab',
}

export function ScriptNode({ data }: { data: any }) {
    const status = data.status || 'idle'
    const w = data.width || 220
    const h = data.height || 100
    const lang = data.language || 'sh'
    const langColor = LANG_COLORS[lang] || '#22c55e'
    const logs: string[] = data.logs || []
    const isCompact = w <= 60
    const isMedium = w <= 160 && !isCompact

    const hasKnock = !!(data.knockSide)

    // Status labels
    const statusConfig: Record<string, { label: string; color: string }> = {
        idle: { label: 'IDLE', color: '#666' },
        waking: { label: 'WAKE', color: '#fbbf24' },
        running: { label: 'RUN', color: '#22c55e' },
        done: { label: 'DONE', color: '#3b82f6' },
        error: { label: 'ERR', color: '#ef4444' },
    }
    const st = statusConfig[status] || statusConfig.idle

    // Knocking animation — triggers on knockSide, uses knockColor
    const kColor = data.knockColor || '#f97316'
    const knockAnimation = hasKnock ? {
        borderColor: ['#1a1a1a', kColor, '#1a1a1a'],
    } : {}

    const knockTransition = hasKnock
        ? { repeat: Infinity, duration: 0.5, ease: 'easeOut' as const, times: [0, 0.7, 1] }
        : {}

    // TUI mode just swaps the font — same layout, no pixel art font
    const pixelFont = data.tuiMode
        ? "'Courier New', Courier, monospace"
        : "'Press Start 2P', monospace"

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
                    <Handle type="target" position={Position.Left} style={{
                        background: '#fbbf24', border: '2px solid #fbbf2455', width: 4, height: 4, borderRadius: 0,
                    }} />
                    <Handle type="source" position={Position.Right} style={{
                        background: '#666', border: '2px solid #33333355', width: 4, height: 4, borderRadius: 0,
                    }} />
                    <span style={{ fontSize: 14, color: langColor }}>{'>'}_</span>
                    <span style={{ fontSize: 7, color: st.color, fontWeight: 700 }}>{st.label}</span>
                </motion.div>
                {/* Node name */}
                <span style={{ fontSize: 8, color: '#888', fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: pixelFont }}>{data.label || 'Script'}</span>
            </div>
        )
    }

    // ── Medium / Large mode ──
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
            <Handle type="target" position={Position.Left} style={{
                background: '#fbbf24', border: '2px solid #fbbf2455', width: 6, height: 6, borderRadius: 0,
            }} />
            <Handle type="source" position={Position.Right} style={{
                background: '#666', border: '2px solid #33333355', width: 6, height: 6, borderRadius: 0,
            }} />

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
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                    }}>
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
