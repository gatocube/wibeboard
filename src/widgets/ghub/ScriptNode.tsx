import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { CheckCircle, Circle, Loader2, Terminal } from 'lucide-react'
import { StatusDot } from '@/widgets/StatusDot'

/**
 * ScriptNode (ghub) — GitHub Actions workflow run style.
 *
 * Mimics the GitHub Actions run summary UI with exact GitHub design tokens:
 * - System font stack + SFMono-Regular for code
 * - Exact color tokens from github.com
 * - Proper spacing, line height, border radius
 * - Step list with status indicators
 *
 * data.label — script name (e.g. "deploy.sh")
 * data.language — 'js' | 'ts' | 'sh' | 'py'
 * data.status — 'idle' | 'running' | 'done' | 'error'
 * data.logs — string[] of output lines
 * data.knockSide — 'in' | 'out' | null
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
    yellow: '#d29922',
    red: '#f85149',
    accent: '#58a6ff',
}

const ghLightColors = {
    bg: '#ffffff',
    bgCard: '#f6f8fa',
    bgInset: '#f6f8fa',
    border: '#d0d7de',
    borderMuted: '#d8dee4',
    fg: '#1f2328',
    fgMuted: '#656d76',
    fgSubtle: '#6e7681',
    green: '#1a7f37',
    yellow: '#9a6700',
    red: '#cf222e',
    accent: '#0969da',
}

const ghFont = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" }
const ghMono = { fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace" }

const LANG_COLORS: Record<string, { color: string; label: string }> = {
    js: { color: '#f7df1e', label: 'JavaScript' },
    ts: { color: '#3178c6', label: 'TypeScript' },
    sh: { color: '#89e051', label: 'Shell' },
    py: { color: '#3776ab', label: 'Python' },
}

export function ScriptNode({ data }: { data: any }) {
    const gh = data.dayMode ? ghLightColors : ghDark
    const status = data.status || 'idle'
    const w = data.width || 220
    const h = data.height || 120
    const isCompact = w <= 60
    const lang = LANG_COLORS[data.language || 'js'] || LANG_COLORS.js

    const knockSide = data.knockSide
    const hasKnock = !!knockSide
    const kColor = data.knockColor || '#f97316'
    // Border faces TOWARD the other node: 'out' = sending left, 'in' = receiving from right
    const knockStyle = hasKnock ? (
        knockSide === 'out'
            ? { borderLeft: `2px solid ${kColor}` }
            : { borderRight: `2px solid ${kColor}` }
    ) : {}

    // Status icon matching GitHub Actions
    const StatusIcon = ({ size = 14 }: { size?: number }) => {
        if (status === 'done') return <CheckCircle size={size} style={{ color: gh.green }} />
        if (status === 'running') return (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                <Loader2 size={size} style={{ color: gh.yellow }} />
            </motion.div>
        )
        if (status === 'error') return <Circle size={size} style={{ color: gh.red }} />
        return <Circle size={size} style={{ color: gh.fgSubtle }} />
    }

    // ── Compact mode ──
    if (isCompact) {
        return (
            <div style={{
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
            }}>
                <Handle type="target" position={Position.Left} style={{ background: gh.accent, width: 6, height: 6 }} />
                <Handle type="source" position={Position.Right} style={{ background: gh.fgMuted, width: 6, height: 6 }} />
                <StatusDot status={status} />
                <span style={{ fontSize: 7, color: gh.fgMuted, fontWeight: 700 }}>{(data.language || 'js').toUpperCase()}</span>
            </div>
        )
    }

    // ── Full mode — GitHub Actions workflow run card ──
    const logs: string[] = data.logs || []

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

            {/* Header — GitHub Actions run header */}
            <div style={{
                padding: '6px 12px',
                borderBottom: `1px solid ${gh.border}`,
                display: 'flex', alignItems: 'center', gap: 6,
            }}>
                <StatusIcon size={14} />
                <span style={{
                    fontSize: 12, fontWeight: 600, color: gh.fg,
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {data.label || 'Script'}
                </span>
                {/* Language dot */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: gh.fgMuted }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: lang.color, display: 'inline-block' }} />
                    {lang.label}
                </span>
            </div>

            {/* Workflow steps — brief run summary */}
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

            {/* Log output — code block */}
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
                                color: line.startsWith('>') ? gh.green : gh.fgSubtle,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer — stats bar */}
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
