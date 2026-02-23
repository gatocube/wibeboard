import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Check, CheckCircle, Circle, Loader2 } from 'lucide-react'
import { StatusDot } from '@/widgets/StatusDot'

/**
 * AgentNode (ghub) — GitHub-style agent card.
 *
 * Designed to closely match GitHub's actual UI:
 * - System font stack (not custom fonts)
 * - Exact GitHub dark theme color tokens
 * - Proper spacing, line height, border radius
 * - Lucide-react icons matching GitHub's icon style
 * - TaskList with authentic checkbox design
 * - Progress bar matching GitHub's thin bar style
 *
 * data.label — title (e.g. "Sprint Tasks")
 * data.status — 'idle' | 'waking' | 'running' | 'done' | 'error'
 * data.agent — agent model name
 * data.width / data.height — dimensions
 * data.dayMode — boolean, switches to light GitHub theme
 */

// ── GitHub color tokens (exact from github.com) ─────────────────────────────

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
    accent: '#0969da',
    purple: '#8250df',
}

// System font stacks matching GitHub exactly
const ghFont = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" }
const ghMono = { fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" }

export function AgentNode({ data }: { data: any }) {
    const gh = data.dayMode ? ghLight : ghDark
    const status = data.status || 'idle'
    const w = data.width || 240
    const h = data.height || 160
    const isCompact = w <= 60
    const isLarge = w >= 280
    const logs: string[] = data.logs || []

    const knockSide = data.knockSide
    const hasKnock = !!knockSide
    const kColor = data.knockColor || '#f97316'
    const knockStyle = hasKnock ? (
        knockSide === 'out'
            ? { borderRight: `2px solid ${kColor}` }
            : { borderLeft: `2px solid ${kColor}` }
    ) : {}

    // Progress
    const pct = data.progress ?? 0
    const tasks = [
        { done: pct >= 25, text: data.task?.split(',')[0]?.trim() || 'Initialize' },
        { done: pct >= 50, text: data.task?.split(',')[1]?.trim() || 'Process' },
        { done: pct >= 75, text: data.task?.split(',')[2]?.trim() || 'Finalize' },
    ]

    // Status icon
    const StatusIcon = () => {
        if (status === 'done') return <CheckCircle size={14} style={{ color: gh.green }} />
        if (status === 'running') return (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Loader2 size={14} style={{ color: gh.orange }} />
            </motion.div>
        )
        if (status === 'waking') return (
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
                <Circle size={14} style={{ color: gh.orange }} />
            </motion.div>
        )
        if (status === 'error') return <Circle size={14} style={{ color: gh.red }} />
        return <Circle size={14} style={{ color: gh.fgSubtle }} />
    }

    // ── Compact mode ──
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
                <Handle type="target" position={Position.Left} style={{ background: gh.accent, width: 6, height: 6 }} />
                <Handle type="source" position={Position.Right} style={{ background: gh.fgMuted, width: 6, height: 6 }} />
                <StatusDot status={status} />
            </motion.div>
        )
    }

    // ── Full mode ──
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
            <Handle type="target" position={Position.Left} style={{ background: gh.accent, width: 8, height: 8 }} />
            <Handle type="source" position={Position.Right} style={{ background: gh.fgMuted, width: 8, height: 8 }} />

            {/* Header — matches GitHub's issue/PR header */}
            <div style={{
                padding: '8px 12px',
                borderBottom: `1px solid ${gh.border}`,
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                <StatusIcon />
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

            {/* Progress bar — thin GitHub-style */}
            <div style={{
                height: 3, background: gh.borderMuted,
                overflow: 'hidden',
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', background: gh.green }}
                />
            </div>

            {/* PreviewCanvas — terminal output for large nodes */}
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
                                color: line.startsWith('⚡') ? gh.orange
                                    : line.startsWith('📦') ? gh.green
                                        : line.startsWith('←') ? gh.fgMuted
                                            : gh.fgSubtle,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Task list — matches GitHub's checkbox style */}
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

            {/* Footer stats — matches GitHub's issue footer */}
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
