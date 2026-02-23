import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { StatusDot } from '@/widgets/StatusDot'

/**
 * ScriptNode (ghub) — GitHub Actions workflow run style.
 *
 * Mimics the GitHub Actions run summary UI:
 * status icon on the left, step name, elapsed time,
 * GitHub's dark theme colors + system font.
 *
 * data.label — script name (e.g. "deploy.sh")
 * data.language — 'js' | 'ts' | 'sh' | 'py'
 * data.status — 'idle' | 'running' | 'done' | 'error'
 * data.logs — string[] of output lines
 * data.knockSide — 'in' | 'out' | null
 * data.width / data.height — dimensions
 */

const gh = {
    bg: '#0d1117',
    bgCard: '#161b22',
    border: '#30363d',
    borderMuted: '#21262d',
    fg: '#e6edf3',
    fgMuted: '#8b949e',
    green: '#3fb950',
    yellow: '#d29922',
    red: '#f85149',
    accent: '#58a6ff',
    bgOverlay: '#1c2128',
}
const ghFont = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" }
const ghMono = { fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace" }

const LANG_ICONS: Record<string, { color: string; label: string }> = {
    js: { color: '#f7df1e', label: 'Node.js' },
    ts: { color: '#3178c6', label: 'TypeScript' },
    sh: { color: '#89e051', label: 'Shell' },
    py: { color: '#3776ab', label: 'Python' },
}

export function ScriptNode({ data }: { data: any }) {
    const status = data.status || 'idle'
    const w = data.width || 220
    const h = data.height || 120
    const lang = data.language || 'sh'
    const langInfo = LANG_ICONS[lang] || LANG_ICONS.sh
    const logs: string[] = data.logs || []
    const isCompact = w <= 60
    const isMedium = w <= 160 && !isCompact

    const isWaking = status === 'waking'

    // Status icon + color
    const statusConfig: Record<string, { icon: string; color: string; bg: string }> = {
        idle: { icon: '○', color: gh.fgMuted, bg: 'transparent' },
        waking: { icon: '◎', color: gh.yellow, bg: `${gh.yellow}15` },
        running: { icon: '●', color: gh.yellow, bg: `${gh.yellow}15` },
        done: { icon: '✓', color: gh.green, bg: `${gh.green}15` },
        error: { icon: '✗', color: gh.red, bg: `${gh.red}15` },
    }
    const st = statusConfig[status] || statusConfig.idle

    // Knocking: side-specific orange border
    const knockSide = data.knockSide || 'in'
    const knockStyle = isWaking ? (
        knockSide === 'out'
            ? { borderRight: '2px solid #f97316' }
            : { borderLeft: '2px solid #f97316' }
    ) : {}

    // ── Compact mode (icon size) ──
    if (isCompact) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                    style={{
                        width: w, height: h,
                        background: gh.bg,
                        border: `1px solid ${status === 'running' ? gh.yellow : status === 'done' ? gh.green : gh.border}`,
                        ...knockStyle,
                        borderRadius: 6,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, boxSizing: 'border-box',
                        position: 'relative',
                        ...ghFont,
                    }}
                >
                    <StatusDot status={status} />
                    <Handle type="target" position={Position.Left} style={{
                        background: gh.accent, border: `2px solid ${gh.accent}55`, width: 6, height: 6,
                    }} />
                    <Handle type="source" position={Position.Right} style={{
                        background: gh.fgMuted, border: `2px solid ${gh.borderMuted}`, width: 6, height: 6,
                    }} />
                    {/* Action status icon */}
                    <div style={{
                        width: 20, height: 20, borderRadius: 10,
                        background: st.bg,
                        border: `1.5px solid ${st.color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, color: st.color,
                    }}>
                        {status === 'running' ? (
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{ fontSize: 9 }}
                            >◠</motion.span>
                        ) : st.icon}
                    </div>
                    <span style={{ fontSize: 7, color: langInfo.color, fontWeight: 600, ...ghMono }}>
                        {lang.toUpperCase()}
                    </span>
                </div>
                {/* Node name */}
                <span style={{ fontSize: 8, color: gh.fg, fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', ...ghFont }}>{data.label || 'Script'}</span>
            </div>
        )
    }

    // ── Medium / Large mode ──
    return (
        <div
            style={{
                width: w, height: h,
                background: gh.bg,
                border: `1px solid ${gh.border}`,
                ...knockStyle,
                borderRadius: 6,
                display: 'flex', flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden',
                ...ghFont,
            }}
        >
            <Handle type="target" position={Position.Left} style={{
                background: gh.accent, border: `2px solid ${gh.accent}55`, width: 8, height: 8,
            }} />
            <Handle type="source" position={Position.Right} style={{
                background: gh.fgMuted, border: `2px solid ${gh.borderMuted}`, width: 8, height: 8,
            }} />

            {/* Header — looks like GH Actions job header */}
            <div style={{
                padding: isMedium ? '6px 8px' : '8px 12px',
                borderBottom: `1px solid ${gh.border}`,
                display: 'flex', alignItems: 'center', gap: 8,
                background: gh.bgCard,
            }}>
                {/* Status icon circle */}
                <div style={{
                    width: isMedium ? 16 : 20, height: isMedium ? 16 : 20,
                    borderRadius: '50%',
                    border: `1.5px solid ${st.color}`,
                    background: st.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {status === 'running' ? (
                        <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ fontSize: isMedium ? 8 : 10, color: st.color }}
                        >◠</motion.span>
                    ) : (
                        <span style={{ fontSize: isMedium ? 8 : 10, color: st.color }}>{st.icon}</span>
                    )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: isMedium ? 10 : 12, fontWeight: 600, color: gh.fg,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {data.label || 'script.sh'}
                    </div>
                    {!isMedium && (
                        <div style={{ fontSize: 9, color: gh.fgMuted, marginTop: 1 }}>
                            Run #{data.runNumber || 1} · {langInfo.label}
                        </div>
                    )}
                </div>

                {/* Language badge */}
                <span style={{
                    fontSize: 8, fontWeight: 600,
                    padding: '1px 6px', borderRadius: 10,
                    background: `${langInfo.color}22`,
                    color: langInfo.color,
                    border: `1px solid ${langInfo.color}33`,
                    ...ghMono,
                }}>
                    {lang.toUpperCase()}
                </span>
            </div>

            {/* Steps / Output */}
            <div style={{
                flex: 1, padding: isMedium ? '4px 8px' : '6px 12px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column', gap: 2,
            }}>
                {logs.length > 0 ? (
                    logs.slice(-4).map((line, i) => (
                        <div key={i} style={{
                            fontSize: 9, color: gh.fgMuted,
                            ...ghMono,
                            display: 'flex', gap: 6,
                            overflow: 'hidden', whiteSpace: 'nowrap',
                        }}>
                            <span style={{ color: gh.green, flexShrink: 0 }}>{'>'}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{line}</span>
                        </div>
                    ))
                ) : (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: gh.fgMuted, fontSize: 9,
                        ...ghMono,
                    }}>
                        {status === 'idle' ? 'Waiting to run...' : status === 'running' ? 'Running...' : 'No output'}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isMedium && (
                <div style={{
                    padding: '4px 12px',
                    borderTop: `1px solid ${gh.border}`,
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 9, color: gh.fgMuted,
                    background: gh.bgCard,
                    ...ghMono,
                }}>
                    <span style={{ display: 'flex', gap: 6 }}>
                        <span>{data.execTime || '—'}</span>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span>⚡{data.callsCount ?? 0}</span>
                    </span>
                    <span>{status === 'done' ? '✓ Success' : status === 'error' ? '✗ Failed' : status === 'running' ? '● Running' : '○ Queued'}</span>
                </div>
            )}
        </div>
    )
}
