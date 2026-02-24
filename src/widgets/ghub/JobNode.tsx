import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Check, CheckCircle, Circle, Loader2, Terminal } from 'lucide-react'
import { StatusDot } from '@/widgets/StatusDot'
import type { NodeContext } from '@/engine/NodeContext'

/**
 * JobNode (ghub) — Unified GitHub-style node for agents and scripts.
 *
 * Variant-based rendering:
 *   'agent' → GitHub Issue card with rainbow accent, task list, AI badge
 *   'script' → GitHub Actions workflow card with step list, language dot
 *
 * data.variant — 'agent' | 'script' (default: 'agent')
 * data.ctx — NodeContext with messenger
 * data.label — title
 * data.status — 'idle' | 'waking' | 'running' | 'done' | 'error'
 * data.agent — agent model name (agent variant)
 * data.language — 'js' | 'ts' | 'sh' | 'py' (script variant)
 * data.logs — string[] output
 * data.progress — 0-100
 * data.execTime — execution time
 * data.callsCount — number of tool calls
 * data.knockSide — 'in' | 'out' | null
 * data.width / data.height — dimensions
 * data.dayMode — boolean, light/dark GitHub theme
 */

// ── GitHub color tokens ─────────────────────────────────────────────────────

const ghDark = {
    bg: '#0d1117',
    bgCard: '#161b22',
    bgInset: '#010409',
    border: '#30363d',
    borderMuted: '#21262d',
    fg: '#e6edf3',
    fgMuted: '#8b949e',
    fgSubtle: '#6e7681',
    green: '#3fb950',
    red: '#f85149',
    orange: '#d29922',
    yellow: '#d29922',
    accent: '#58a6ff',
    purple: '#bc8cff',
}

const ghLight = {
    bg: '#ffffff',
    bgCard: '#f6f8fa',
    bgInset: '#f6f8fa',
    border: '#d0d7de',
    borderMuted: '#d8dee4',
    fg: '#1f2328',
    fgMuted: '#656d76',
    fgSubtle: '#6e7681',
    green: '#1a7f37',
    red: '#cf222e',
    orange: '#9a6700',
    yellow: '#9a6700',
    accent: '#0969da',
    purple: '#8250df',
}

const ghFont = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" }
const ghMono = { fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" }

const LANG_COLORS: Record<string, { color: string; label: string }> = {
    js: { color: '#f7df1e', label: 'JavaScript' },
    ts: { color: '#3178c6', label: 'TypeScript' },
    sh: { color: '#89e051', label: 'Shell' },
    py: { color: '#3776ab', label: 'Python' },
}

// ── Shared sub-components ───────────────────────────────────────────────────

function GhStatusIcon({ status, gh, size = 14 }: { status: string; gh: typeof ghDark; size?: number }) {
    if (status === 'done') return <CheckCircle size={size} style={{ color: gh.green }} />
    if (status === 'running') return (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
            <Loader2 size={size} style={{ color: gh.orange }} />
        </motion.div>
    )
    if (status === 'waking') return (
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ display: 'flex' }}>
            <Circle size={size} style={{ color: gh.orange }} />
        </motion.div>
    )
    if (status === 'error') return <Circle size={size} style={{ color: gh.red }} />
    return <Circle size={size} style={{ color: gh.fgSubtle }} />
}

// ── JobNode ─────────────────────────────────────────────────────────────────

export function JobNode({ data }: { data: any }) {
    const ctx = data.ctx as NodeContext | undefined
    const variant: 'agent' | 'script' = data.variant || 'agent'
    const gh = data.dayMode ? ghLight : ghDark
    const status = data.status || 'idle'
    const w = data.width || (variant === 'agent' ? 240 : 220)
    const h = data.height || (variant === 'agent' ? 160 : 120)
    const isCompact = w <= 60
    const isLarge = w >= 280
    const logs: string[] = data.logs || []

    // Knock styling
    const knockSide = data.knockSide
    const hasKnock = !!knockSide
    const kColor = data.knockColor || '#f97316'
    const knockStyle = hasKnock ? (
        knockSide === 'out'
            ? { borderRight: `2px solid ${kColor}` }
            : { borderLeft: `2px solid ${kColor}` }
    ) : {}

    // Messenger — react to incoming knocks
    if (ctx?.messenger) {
        // ctx.messenger is available for future use
    }

    // ── Compact mode (shared) ──
    if (isCompact) {
        return (
            <motion.div
                style={{
                    width: w, height: h,
                    background: gh.bgCard,
                    border: `1px solid ${gh.border}`,
                    borderRadius: 6,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 2, boxSizing: 'border-box',
                    position: 'relative',
                    ...ghFont,
                    ...knockStyle,
                }}
            >
                <Handle type="target" position={Position.Left} id="in" style={{ background: gh.accent, width: 6, height: 6 }} />
                <Handle type="source" position={Position.Right} id="out" style={{ background: gh.fgMuted, width: 6, height: 6 }} />
                {variant === 'agent' && (
                    <Handle type="source" position={Position.Top} id="thinking" style={{ background: '#c084fc', width: 5, height: 5 }} />
                )}
                <StatusDot status={status} />
                {variant === 'script' && (
                    <span style={{ fontSize: 7, color: gh.fgMuted, fontWeight: 700 }}>
                        {(data.language || 'js').toUpperCase()}
                    </span>
                )}
            </motion.div>
        )
    }

    // ── Full mode ──
    if (variant === 'agent') {
        return <AgentVariant data={data} ctx={ctx} gh={gh} status={status} w={w} h={h} isLarge={isLarge} logs={logs} knockStyle={knockStyle} />
    }
    return <ScriptVariant data={data} ctx={ctx} gh={gh} status={status} w={w} h={h} logs={logs} knockStyle={knockStyle} />
}

// ── Agent variant ───────────────────────────────────────────────────────────

function AgentVariant({ data, ctx: _ctx, gh, status, w, h, isLarge, logs, knockStyle }: {
    data: any; ctx: NodeContext | undefined; gh: typeof ghDark; status: string
    w: number; h: number; isLarge: boolean; logs: string[]; knockStyle: Record<string, string>
}) {
    const pct = data.progress ?? 0
    const tasks = [
        { done: pct >= 25, text: data.task?.split(',')[0]?.trim() || 'Initialize' },
        { done: pct >= 50, text: data.task?.split(',')[1]?.trim() || 'Process' },
        { done: pct >= 75, text: data.task?.split(',')[2]?.trim() || 'Finalize' },
    ]

    return (
        <motion.div
            style={{
                width: w, height: h,
                background: gh.bg,
                border: `1px solid ${gh.border}`,
                borderRadius: 6,
                display: 'flex', flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden',
                ...ghFont,
                ...knockStyle,
            }}
        >
            <Handle type="target" position={Position.Left} id="in" style={{ background: gh.accent, width: 8, height: 8 }} />
            <Handle type="source" position={Position.Right} id="out" style={{ background: gh.fgMuted, width: 8, height: 8 }} />
            <Handle type="source" position={Position.Top} id="thinking" style={{ background: '#c084fc', width: 6, height: 6 }} />

            {/* Header */}
            <div style={{
                padding: '8px 12px',
                borderBottom: `1px solid ${gh.border}`,
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                <GhStatusIcon status={status} gh={gh} />
                <span style={{ fontSize: 13, fontWeight: 600, color: gh.fg, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {data.label || 'Agent'}
                </span>
                {data.agent && (
                    <span style={{
                        fontSize: 10, color: gh.fgMuted,
                        ...ghMono,
                        background: gh.bgCard,
                        padding: '1px 6px', borderRadius: 3,
                    }}>
                        {data.agent}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div style={{ height: 3, background: gh.borderMuted, overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', background: gh.green }}
                />
            </div>

            {/* Terminal output for large nodes */}
            {isLarge && logs.length > 0 && (
                <div style={{
                    flex: 1, minHeight: 0, margin: '6px 8px',
                    background: gh.bgInset,
                    borderRadius: 6,
                    border: `1px solid ${gh.border}`,
                    padding: '4px 8px',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{
                        fontSize: 9, color: gh.fgSubtle, marginBottom: 2,
                        display: 'flex', gap: 4, alignItems: 'center',
                        ...ghMono,
                    }}>
                        <span style={{ color: gh.green }}>●</span> Output
                    </div>
                    <div style={{
                        flex: 1, overflow: 'hidden',
                        ...ghMono,
                        fontSize: 10, lineHeight: '15px',
                    }}>
                        {logs.slice(-5).map((line, i) => (
                            <div key={i} style={{
                                color: (line as string).startsWith('⚡') ? gh.orange
                                    : (line as string).startsWith('📦') ? gh.green
                                        : (line as string).startsWith('←') ? gh.fgMuted
                                            : gh.fgSubtle,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Task list */}
            <div style={{
                padding: '6px 12px',
                display: 'flex', flexDirection: 'column', gap: 3,
                flex: isLarge ? 0 : 1,
            }}>
                {tasks.map((task, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                            border: `1.5px solid ${task.done ? gh.green : gh.border}`,
                            background: task.done ? gh.green : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {task.done && <Check size={10} style={{ color: 'white' }} />}
                        </div>
                        <span style={{
                            fontSize: 11, lineHeight: 1.5,
                            color: task.done ? gh.fgMuted : gh.fg,
                            textDecoration: task.done ? 'line-through' : 'none',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {task.text}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={{
                padding: '4px 12px',
                borderTop: `1px solid ${gh.border}`,
                display: 'flex', gap: 8, alignItems: 'center',
                fontSize: 10, color: gh.fgMuted,
                ...ghMono,
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <CheckCircle size={10} style={{ color: gh.green }} />
                    {tasks.filter(t => t.done).length}/{tasks.length}
                </span>
                <span>{data.execTime || '—'}</span>
                {data.callsCount > 0 && <span>{data.callsCount} calls</span>}
            </div>
        </motion.div>
    )
}

// ── Script variant ──────────────────────────────────────────────────────────

function ScriptVariant({ data, ctx: _ctx, gh, status, w, h, logs, knockStyle }: {
    data: any; ctx: NodeContext | undefined; gh: typeof ghDark; status: string
    w: number; h: number; logs: string[]; knockStyle: Record<string, string>
}) {
    const lang = LANG_COLORS[data.language || 'js'] || LANG_COLORS.js

    return (
        <div style={{
            width: w, height: h,
            background: gh.bg,
            border: `1px solid ${gh.border}`,
            borderRadius: 6,
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden',
            ...ghFont,
            ...knockStyle,
        }}>
            <Handle type="target" position={Position.Left} style={{ background: gh.accent, width: 8, height: 8 }} />
            <Handle type="source" position={Position.Right} style={{ background: gh.fgMuted, width: 8, height: 8 }} />

            {/* Header */}
            <div style={{
                padding: '6px 12px',
                borderBottom: `1px solid ${gh.border}`,
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                <GhStatusIcon status={status} gh={gh} size={14} />
                <span style={{
                    fontSize: 12, fontWeight: 600, color: gh.fg,
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {data.label || 'Script'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: gh.fgMuted }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color, display: 'inline-block' }} />
                    {lang.label}
                </span>
            </div>

            {/* Workflow steps */}
            <div style={{
                padding: '6px 12px',
                flex: 1,
                display: 'flex', flexDirection: 'column', gap: 2,
                overflow: 'hidden',
            }}>
                {[
                    { text: 'Set up job', done: status !== 'idle' },
                    { text: `Run ${data.label || 'script'}`, done: status === 'done' || (status === 'running' && (data.progress || 0) > 50), active: status === 'running' },
                    { text: 'Post run', done: status === 'done' },
                ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        {step.done ? (
                            <CheckCircle size={12} style={{ color: gh.green, flexShrink: 0 }} />
                        ) : step.active ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex', flexShrink: 0 }}>
                                <Loader2 size={12} style={{ color: gh.yellow }} />
                            </motion.div>
                        ) : (
                            <Circle size={12} style={{ color: gh.fgSubtle, flexShrink: 0 }} />
                        )}
                        <span style={{
                            color: step.done ? gh.fgMuted : gh.fg,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {step.text}
                        </span>
                        {step.done && (
                            <span style={{ marginLeft: 'auto', fontSize: 9, color: gh.fgSubtle, ...ghMono }}>
                                {i === 0 ? '1s' : i === 1 ? (data.execTime || '—') : '0s'}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Log output */}
            {logs.length > 0 && (
                <div style={{
                    margin: '0 8px 6px',
                    background: gh.bgInset,
                    border: `1px solid ${gh.border}`,
                    borderRadius: 6,
                    overflow: 'hidden',
                    ...ghMono,
                }}>
                    <div style={{
                        padding: '2px 8px',
                        background: gh.bgCard,
                        borderBottom: `1px solid ${gh.border}`,
                        fontSize: 9, color: gh.fgMuted,
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <Terminal size={9} /> output
                    </div>
                    <div style={{ padding: '4px 8px', fontSize: 10, lineHeight: '14px' }}>
                        {logs.slice(-3).map((line, i) => (
                            <div key={i} style={{
                                color: (line as string).startsWith('>') ? gh.green : gh.fgSubtle,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{
                padding: '4px 12px',
                borderTop: `1px solid ${gh.border}`,
                display: 'flex', gap: 8, alignItems: 'center',
                fontSize: 10, color: gh.fgMuted,
                ...ghMono,
            }}>
                <span>{data.execTime || '—'}</span>
                {data.callsCount > 0 && <span>{data.callsCount} calls</span>}
            </div>
        </div>
    )
}
