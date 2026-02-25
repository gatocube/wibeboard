import { Handle, Position, NodeToolbar } from '@xyflow/react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Play, Settings, Check, Terminal } from 'lucide-react'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { PreviewCanvas } from '@/components/PreviewCanvas'
import { StatusDot } from '@/widgets/StatusDot'
import { ShimmeringText, SplittingText } from '@/components/animate-ui'
import { BaseNode } from '@/widgets/BaseNode'
import { WidgetIcon, AnimatedIcon } from '@/components/WidgetIcon'

/**
 * JobNode (wibeglow) — Unified modern dark node for agents and scripts.
 *
 * Variant-based rendering:
 *   'agent' → Rainbow gradient border, sparkle icon, progress bar, stats
 *   'script' → Language-colored gradient border, code editor, terminal logs
 *
 * data.subType — 'ai' | 'script' (default: 'ai')
 * data.ctx — NodeContext with messenger
 * data.label — node name
 * data.color — primary accent color
 * data.status — 'idle' | 'waking' | 'running' | 'done' | 'error'
 * data.agent — agent model name (agent variant)
 * data.language — 'js' | 'ts' | 'sh' | 'py' (script variant)
 * data.code — source code (script variant)
 * data.configured — true after save (script variant)
 * data.logs — string[] output
 * data.progress — 0-100
 * data.width / data.height — dimensions
 */

const LANG_COLORS: Record<string, string> = {
    js: '#f7df1e', ts: '#3178c6', sh: '#89e051', py: '#3776ab',
}
const LANG_LABELS: Record<string, string> = {
    js: 'JavaScript', ts: 'TypeScript', sh: 'Shell', py: 'Python',
}

export function JobNode({ data }: { data: any }) {
    const subType = data.subType || 'ai'

    return (
        <BaseNode data={data} type="job" subType={subType}>
            {subType === 'ai'
                ? <AgentVariant data={data} />
                : <ScriptVariant data={data} />
            }
        </BaseNode>
    )
}

// ── Agent variant (rainbow gradient border) ─────────────────────────────────

function AgentVariant({ data }: { data: any }) {
    const color = data.color || '#8b5cf6'
    const status = data.status || 'idle'
    const w = data.width || 200
    const h = data.height || 120
    const isCompact = w <= 60
    const isLarge = w >= 280
    const progress = data.progress ?? 0
    const isWaking = status === 'waking'
    const isRunning = status === 'running'
    const isActive = isWaking || isRunning || !!(data.knockSide)
    const secondaryColor = isActive ? '#06b6d4' : '#06b6d488'
    const tertiaryColor = isActive ? '#f59e0b' : '#f59e0b66'
    const knockOut = data.knockSide === 'out'
    const knockIn = data.knockSide === 'in'
    const hasKnock = !!(data.knockSide)
    const kColor = data.knockColor || '#f97316'

    // ── Compact mode ──
    if (isCompact) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <motion.div
                    animate={hasKnock ? (knockOut
                        ? { boxShadow: [`3px 0 0 0 ${kColor}`, `3px 0 0 0 transparent`] }
                        : { boxShadow: [`-3px 0 0 0 ${kColor}`, `-3px 0 0 0 transparent`] }
                    ) : {}}
                    transition={hasKnock ? { repeat: Infinity, duration: 0.5, ease: 'easeOut' } : {}}
                    style={{
                        width: w, height: h,
                        padding: 1,
                        borderRadius: 12,
                        background: `linear-gradient(135deg, ${color}, ${secondaryColor}, ${tertiaryColor})`,
                        boxShadow: isActive
                            ? `0 0 12px ${color}44, 0 0 24px ${color}22`
                            : `0 2px 8px rgba(0,0,0,0.3)`,
                        position: 'relative',
                    }}
                >
                    <Handle type="target" position={Position.Left} id="in" style={{
                        background: color, border: `2px solid ${color}55`, width: 6, height: 6,
                    }} />
                    <Handle type="source" position={Position.Right} id="out" style={{
                        background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 6, height: 6,
                    }} />
                    <Handle type="source" position={Position.Top} id="thinking" style={{
                        background: '#c084fc', border: '2px solid #c084fc55', width: 5, height: 5,
                    }} />
                    <div style={{
                        background: '#1a1b26', borderRadius: 11,
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, boxSizing: 'border-box',
                    }}>
                        <StatusDot status={status} />
                        <Sparkles size={16} style={{ color }} />
                    </div>
                </motion.div>
                <span style={{ fontSize: 8, color: '#e2e8f0', fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: 'Inter' }}>{data.label || 'Agent'}</span>
            </div>
        )
    }

    // ── Full mode ──
    const logs: string[] = data.logs || []
    const lastLog = logs.length > 0 ? logs[logs.length - 1] : null
    const thoughtText = data.thought || lastLog

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
            <motion.div
                animate={{
                    ...(hasKnock ? (knockOut
                        ? { boxShadow: [`4px 0 0 0 ${kColor}`, `4px 0 0 0 transparent`] }
                        : { boxShadow: [`-4px 0 0 0 ${kColor}`, `-4px 0 0 0 transparent`] }
                    ) : {}),
                    ...(isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }),
                }}
                transition={{
                    ...(hasKnock ? { boxShadow: { repeat: Infinity, duration: 0.5, ease: 'easeOut' } } : {}),
                    ...(isActive ? { scale: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' } } : {}),
                }}
                style={{
                    width: w, height: h,
                    padding: 1.5,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${color}, ${secondaryColor}, ${tertiaryColor})`,
                    boxShadow: isActive
                        ? `0 0 20px ${color}33, 0 0 40px ${color}15`
                        : `0 4px 16px rgba(0,0,0,0.3)`,
                }}
            >
                <Handle type="target" position={Position.Left} id="in" style={{
                    background: color, border: `2px solid ${color}55`, width: 8, height: 8,
                }} />
                <Handle type="source" position={Position.Right} id="out" style={{
                    background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
                }} />
                <Handle type="source" position={Position.Top} id="thinking" style={{
                    background: '#c084fc', border: '2px solid #c084fc55', width: 6, height: 6,
                }} />

                <div style={{
                    background: '#1a1b26', borderRadius: 12.5,
                    height: '100%',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    {/* ── Header: Icon → Label → StatusDot (right) ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px',
                        background: `${color}08`,
                        borderBottom: `1px solid ${color}15`,
                        flexShrink: 0,
                    }}>
                        {/* AI icon */}
                        {isActive
                            ? <AnimatedIcon name="sparkle-burst" size={14} color={color} />
                            : <Sparkles size={14} style={{ color: `${color}99` }} />
                        }
                        {/* Label */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={status}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                style={{
                                    flex: 1, fontSize: 11, fontWeight: 700,
                                    color: '#e2e8f0',
                                    fontFamily: 'Inter',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}
                            >
                                {isWaking ? (
                                    <SplittingText text={data.label || 'Agent'} />
                                ) : isRunning ? (
                                    <ShimmeringText color={color}>{data.label || 'Agent'}</ShimmeringText>
                                ) : (
                                    data.label || 'Agent'
                                )}
                            </motion.div>
                        </AnimatePresence>
                        {/* StatusDot — right side, contained in relative wrapper */}
                        <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
                            <StatusDot status={status} />
                        </div>
                    </div>

                    {/* ── PreviewCanvas (large only, 16:9) ── */}
                    {isLarge && (
                        <div style={{
                            margin: '4px 6px',
                            borderRadius: 8,
                            overflow: 'hidden',
                            aspectRatio: '16 / 9',
                            background: '#0d0d1a',
                            flexShrink: 0,
                        }}>
                            <PreviewCanvas
                                width={w - 16}
                                height={Math.round((w - 16) * 9 / 16)}
                                lines={logs}
                            />
                        </div>
                    )}

                    {/* ── Agent name + calls row ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px',
                        flexShrink: 0,
                    }}>
                        <span style={{
                            flex: 1, fontSize: 9, color: `${color}cc`,
                            fontFamily: "'JetBrains Mono', monospace",
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{data.agent || '—'}</span>
                        <span style={{
                            fontSize: 9, color: '#64748b',
                            fontFamily: "'JetBrains Mono', monospace",
                            flexShrink: 0,
                        }}>⚡{data.callsCount ?? 0}</span>
                    </div>

                    {/* ── Current task row ── */}
                    <div style={{
                        padding: '0 10px 3px',
                        fontSize: 11, color: '#94a3b8',
                        fontFamily: 'Inter',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        flexShrink: 0,
                        opacity: data.task ? 1 : 0.5,
                    }}>{data.task || 'Ready for task'}</div>

                    {/* ── Progress bar + percentage + time ── */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '3px 10px 5px',
                        marginTop: 'auto',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            flex: 1, height: 3, background: `${color}15`,
                            borderRadius: 2,
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8 }}
                                style={{
                                    height: '100%', borderRadius: 2,
                                    background: `linear-gradient(90deg, ${color}, ${secondaryColor})`,
                                    boxShadow: progress > 0 ? `0 0 6px ${color}44` : 'none',
                                }}
                            />
                        </div>
                        <span style={{
                            fontSize: 9, color: `${color}88`,
                            fontFamily: "'JetBrains Mono', monospace",
                            flexShrink: 0,
                        }}><AnimatedNumber value={progress} />%</span>
                        <span style={{
                            fontSize: 9, color: '#64748b',
                            fontFamily: "'JetBrains Mono', monospace",
                            flexShrink: 0,
                        }}>{data.execTime || '—'}</span>
                    </div>
                </div>
            </motion.div>

            {/* ── Below card: AI thoughts or last log ── */}
            {thoughtText && (
                <div style={{
                    width: w,
                    padding: '3px 4px 0',
                    fontSize: 8, color: '#c084fc', fontStyle: 'italic',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontFamily: 'Inter',
                }}>💭 {thoughtText}</div>
            )}
        </div>
    )
}

// ── Script variant (language-colored border + code editor) ──────────────────

function ScriptVariant({ data }: { data: any }) {
    const lang = data.language || 'js'
    const langColor = LANG_COLORS[lang] || '#8b5cf6'
    const w = data.width || 280
    const h = data.height || 200
    const isConfigured = data.configured
    const logs: string[] = data.logs || []
    const status = data.status || 'idle'

    const [editingCode, setEditingCode] = useState<string>(data.code || '')
    const [isEditing, setIsEditing] = useState(!isConfigured)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const logsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (data.code !== undefined) setEditingCode(data.code)
    }, [data.code])

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs.length])

    const handleSave = useCallback(() => {
        setIsEditing(false)
        data.onSaveScript?.(editingCode)
    }, [editingCode, data])

    const handleEdit = useCallback(() => {
        setIsEditing(true)
    }, [])

    // ── Editing mode ──
    if (isEditing && w > 60) {
        return (
            <>
                <NodeToolbar
                    isVisible={true}
                    position={Position.Right}
                    offset={16}
                    align="start"
                    style={{ zIndex: 1000 }}
                >
                    <div
                        className="nodrag nopan"
                        style={{
                            width: 340,
                            borderRadius: 10,
                            background: 'rgba(15,15,30,0.97)',
                            border: `1px solid ${langColor}33`,
                            boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px ${langColor}11`,
                            backdropFilter: 'blur(16px)',
                            overflow: 'hidden',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        {/* Editor title bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 10px',
                            background: `${langColor}0a`,
                            borderBottom: `1px solid ${langColor}22`,
                        }}>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }} />
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }} />
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }} />
                            </div>
                            <div style={{ flex: 1, fontSize: 10, fontWeight: 600, color: '#94a3b8', textAlign: 'center' }}>
                                {data.label || `script.${lang}`}
                            </div>
                            <div style={{
                                fontSize: 8, fontWeight: 700, color: langColor,
                                background: `${langColor}18`, padding: '1px 6px', borderRadius: 4,
                                textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>
                                {LANG_LABELS[lang] || lang}
                            </div>
                        </div>

                        {/* Code area */}
                        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0, width: 30,
                                background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.04)',
                                display: 'flex', flexDirection: 'column', paddingTop: 8, userSelect: 'none',
                            }}>
                                {editingCode.split('\n').map((_, i) => (
                                    <div key={i} style={{
                                        fontSize: 9, color: '#475569', textAlign: 'right',
                                        paddingRight: 6, lineHeight: '16px', height: 16,
                                    }}>{i + 1}</div>
                                ))}
                            </div>
                            <textarea
                                ref={textareaRef}
                                className="nodrag nopan nowheel"
                                value={editingCode}
                                onChange={e => setEditingCode(e.target.value)}
                                spellCheck={false}
                                style={{
                                    position: 'absolute', left: 30, top: 0, right: 0, bottom: 0,
                                    width: 'calc(100% - 30px)', height: '100%',
                                    padding: '8px 10px', background: 'transparent',
                                    color: '#e2e8f0', fontSize: 10, lineHeight: '16px',
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    border: 'none', outline: 'none', resize: 'none',
                                    whiteSpace: 'pre', overflowWrap: 'normal',
                                    overflowX: 'auto', overflowY: 'auto', tabSize: 2,
                                }}
                            />
                        </div>

                        {/* Save button */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                            padding: '6px 10px', gap: 6,
                            borderTop: `1px solid ${langColor}15`,
                            background: `${langColor}05`,
                        }}>
                            <span style={{ fontSize: 8, color: '#64748b', flex: 1 }}>
                                {editingCode.split('\n').length} lines · {editingCode.length} chars
                            </span>
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '4px 12px', borderRadius: 5, border: 'none',
                                    background: langColor, color: '#1a1b26',
                                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                    fontFamily: 'Inter',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}
                            >
                                <Check size={10} /> Save
                            </button>
                        </div>
                    </div>
                </NodeToolbar>

                {/* Placeholder node while editing */}
                <div style={{
                    width: w, height: h,
                    border: `2px dashed ${langColor}55`,
                    borderRadius: 10,
                    background: `${langColor}06`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                    userSelect: 'none',
                }}>
                    <Handle type="target" position={Position.Left} id="in" style={{
                        background: langColor, border: `2px solid ${langColor}55`, width: 8, height: 8,
                    }} />
                    <Handle type="source" position={Position.Right} id="out" style={{
                        background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
                    }} />
                    <Settings size={18} style={{ color: `${langColor}88`, animation: 'spin 4s linear infinite' }} />
                    <div style={{ fontSize: 10, color: langColor, fontWeight: 600, fontFamily: 'Inter' }}>Configuring...</div>
                    <div style={{ fontSize: 8, color: `${langColor}66`, fontFamily: 'Inter' }}>Edit code in panel →</div>
                </div>
            </>
        )
    }

    // ── Configured / runtime mode ──
    const isCompact = w <= 60
    const isLarge = h > 200
    const langAccents: Record<string, string> = {
        js: '#f97316', ts: '#6366f1', sh: '#14b8a6', py: '#8b5cf6',
    }
    const accentColor = langAccents[lang] || langColor
    const codeLines = editingCode.split('\n')
    const lineCount = codeLines.length

    // ── Compact mode ──
    if (isCompact) {
        const lastLog = logs.length > 0 ? logs[logs.length - 1] : null
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    width: w, height: h,
                    padding: 1,
                    borderRadius: 12,
                    background: langColor,
                    boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
                    position: 'relative',
                }}>
                    <Handle type="target" position={Position.Left} id="in" style={{
                        background: langColor, border: `2px solid ${langColor}55`, width: 6, height: 6,
                    }} />
                    <Handle type="source" position={Position.Right} id="out" style={{
                        background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 6, height: 6,
                    }} />
                    <div style={{
                        background: '#1a1b26', borderRadius: 11,
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, boxSizing: 'border-box',
                    }}>
                        <StatusDot status={status} />
                        <Terminal size={16} style={{ color: langColor }} />
                    </div>
                </div>
                <span style={{ fontSize: 8, color: '#e2e8f0', fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{data.label || `script.${lang}`}</span>
                {lastLog && (
                    <span style={{ fontSize: 7, color: '#64748b', fontStyle: 'italic', marginTop: 2, maxWidth: w + 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{lastLog}</span>
                )}
            </div>
        )
    }

    // ── Full mode ──
    return (
        <div style={{
            width: w, height: h,
            padding: 1,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${langColor}, ${accentColor})`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
        }}>
            <Handle type="target" position={Position.Left} id="in" style={{
                background: langColor, border: `2px solid ${langColor}55`, width: 8, height: 8,
            }} />
            <Handle type="source" position={Position.Right} id="out" style={{
                background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
            }} />

            <div style={{
                background: '#1a1b26', borderRadius: 13,
                height: '100%',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px',
                    background: `${langColor}0a`,
                    borderBottom: `1px solid ${langColor}22`,
                    flexShrink: 0,
                }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: status === 'running' ? '#f7df1e'
                            : status === 'done' ? '#28c840'
                                : status === 'error' ? '#ff5f57'
                                    : '#475569',
                        boxShadow: status === 'running' ? '0 0 6px #f7df1e55' : 'none',
                    }} />
                    {status === 'running'
                        ? <AnimatedIcon name="terminal-blink" size={12} color={langColor} />
                        : <WidgetIcon type="terminal" size={12} color={`${langColor}88`} />
                    }
                    <div style={{
                        flex: 1, fontSize: 10, fontWeight: 600, color: '#94a3b8',
                        fontFamily: "'JetBrains Mono', monospace",
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {data.label || `script.${lang}`}
                    </div>
                    <div style={{
                        fontSize: 7, fontWeight: 700, color: langColor,
                        background: `${langColor}18`, padding: '1px 5px', borderRadius: 3,
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                        {lang}
                    </div>
                    <div className="nodrag nopan" style={{ display: 'flex', gap: 3 }}>
                        <button
                            onClick={() => data.onRunScript?.()}
                            title="Run"
                            style={{
                                width: 18, height: 18, borderRadius: 4, border: 'none',
                                background: '#28c84022', color: '#28c840',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Play size={9} />
                        </button>
                        <button
                            onClick={handleEdit}
                            title="Edit"
                            style={{
                                width: 18, height: 18, borderRadius: 4, border: 'none',
                                background: 'rgba(255,255,255,0.04)', color: '#64748b',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <Settings size={9} />
                        </button>
                    </div>
                </div>

                {isLarge ? (
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                            <div style={{
                                position: 'absolute', left: 0, top: 0, bottom: 0, width: 28,
                                background: 'rgba(0,0,0,0.2)', borderRight: '1px solid rgba(255,255,255,0.04)',
                                display: 'flex', flexDirection: 'column', paddingTop: 6, userSelect: 'none',
                                overflow: 'hidden',
                            }}>
                                {codeLines.map((_, i) => (
                                    <div key={i} style={{
                                        fontSize: 8, color: '#475569', textAlign: 'right',
                                        paddingRight: 4, lineHeight: '14px', height: 14,
                                    }}>{i + 1}</div>
                                ))}
                            </div>
                            <div
                                className="nodrag nopan nowheel"
                                style={{
                                    position: 'absolute', left: 28, top: 0, right: 0, bottom: 0,
                                    padding: '6px 8px',
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    fontSize: 9, lineHeight: '14px',
                                    color: '#e2e8f0',
                                    overflowY: 'auto', overflowX: 'auto',
                                    whiteSpace: 'pre',
                                }}
                            >
                                {editingCode}
                            </div>
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '3px 10px',
                            background: `${langColor}05`,
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                            flexShrink: 0,
                        }}>
                            <span style={{
                                fontSize: 7, color: '#475569',
                                fontFamily: "'JetBrains Mono', monospace",
                                display: 'flex', gap: 6,
                            }}>
                                <span>
                                    {status === 'running' ? '⏳ running...'
                                        : status === 'done' ? `✓ done · ${logs.length} lines`
                                            : status === 'error' ? '✗ error'
                                                : `${lineCount} lines`}
                                </span>
                                <span style={{ opacity: 0.5 }}>·</span>
                                <span>{data.execTime || '—'}</span>
                                <span>⚡{data.callsCount ?? 0}</span>
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {logs.length > 0 ? (
                            <>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '3px 10px',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <Terminal size={8} style={{ color: '#475569' }} />
                                    <span style={{ fontSize: 8, color: '#475569', fontWeight: 600, fontFamily: 'Inter' }}>Output</span>
                                    <span style={{ fontSize: 7, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>({logs.length})</span>
                                </div>
                                <div
                                    className="nodrag nopan nowheel"
                                    style={{
                                        flex: 1, padding: '6px 10px',
                                        overflowY: 'auto',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 9, lineHeight: '14px',
                                    }}
                                >
                                    {logs.map((line, i) => (
                                        <div key={i} style={{
                                            color: (line as string).startsWith('ERROR')
                                                ? '#ff5f57'
                                                : (line as string).startsWith('>')
                                                    ? '#475569'
                                                    : '#94a3b8',
                                            whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                        }}>
                                            <span style={{ color: '#334155', marginRight: 4, userSelect: 'none' }}>
                                                {String(i + 1).padStart(2, ' ')}
                                            </span>
                                            {line}
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '3px 10px',
                                    background: `${langColor}05`,
                                    borderTop: '1px solid rgba(255,255,255,0.04)',
                                    flexShrink: 0,
                                }}>
                                    <span style={{
                                        fontSize: 7, color: '#475569',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        display: 'flex', gap: 6,
                                    }}>
                                        <span>
                                            {status === 'running' ? '⏳ running...'
                                                : status === 'done' ? `✓ done · ${logs.length} lines`
                                                    : status === 'error' ? '✗ error'
                                                        : `${lineCount} lines`}
                                        </span>
                                        <span style={{ opacity: 0.5 }}>·</span>
                                        <span>{data.execTime || '—'}</span>
                                        <span>⚡{data.callsCount ?? 0}</span>
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div style={{
                                flex: 1, display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 4, padding: '0 10px',
                            }}>
                                <Terminal size={20} style={{ color: langColor, opacity: 0.7 }} />
                                <div style={{
                                    fontSize: 9, color: '#94a3b8',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    textAlign: 'center',
                                }}>
                                    {`${lineCount} lines`}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
