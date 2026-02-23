import { Handle, Position, NodeToolbar } from '@xyflow/react'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Settings, Check, Terminal } from 'lucide-react'
import { StatusDot } from '@/widgets/StatusDot'

/**
 * ScriptNode — JavaScript script node with editing + configured modes.
 *
 * data.label — file name (e.g. "script.js")
 * data.language — 'js' | 'ts' | 'sh' | 'py'
 * data.code — the source code
 * data.width / data.height — dimensions
 * data.configured — true after user clicks "Save"
 * data.logs — string[] of log output
 * data.status — 'idle' | 'running' | 'done' | 'error'
 * data.onSaveScript — callback(code) when user saves
 * data.onRunScript — callback() to trigger execution
 */

const LANG_COLORS: Record<string, string> = {
    js: '#f7df1e', ts: '#3178c6', sh: '#89e051', py: '#3776ab',
}
const LANG_LABELS: Record<string, string> = {
    js: 'JavaScript', ts: 'TypeScript', sh: 'Shell', py: 'Python',
}

export function ScriptNode({ data }: { data: any }) {
    const lang = data.language || 'js'
    const langColor = LANG_COLORS[lang] || '#8b5cf6'
    const w = data.width || 280
    const h = data.height || 200
    const isConfigured = data.configured
    const logs: string[] = data.logs || []
    const status = data.status || 'idle'

    // ── Editing state (local until saved) ──
    const [editingCode, setEditingCode] = useState<string>(data.code || '')
    const [isEditing, setIsEditing] = useState(!isConfigured)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const logsEndRef = useRef<HTMLDivElement>(null)

    // Sync code from data
    useEffect(() => {
        if (data.code !== undefined) setEditingCode(data.code)
    }, [data.code])

    // Auto-scroll logs
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

    // ── EDITING MODE — show code editor via NodeToolbar ──
    if (isEditing && w > 60) {
        return (
            <>
                {/* Code editor in NodeToolbar */}
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
                            {/* Line numbers */}
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

                {/* The node itself — looks like placeholder while editing */}
                <div style={{
                    width: w, height: h,
                    border: `2px dashed ${langColor}55`,
                    borderRadius: 10,
                    background: `${langColor}06`,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                    userSelect: 'none',
                }}>
                    <Handle type="target" position={Position.Left} style={{
                        background: langColor, border: `2px solid ${langColor}55`, width: 8, height: 8,
                    }} />
                    <Handle type="source" position={Position.Right} style={{
                        background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
                    }} />
                    <Settings size={18} style={{ color: `${langColor}88`, animation: 'spin 4s linear infinite' }} />
                    <div style={{ fontSize: 10, color: langColor, fontWeight: 600, fontFamily: 'Inter' }}>
                        Configuring...
                    </div>
                    <div style={{ fontSize: 8, color: `${langColor}66`, fontFamily: 'Inter' }}>
                        Edit code in panel →
                    </div>
                </div>
            </>
        )
    }

    // ── CONFIGURED MODE — compact runtime view ──
    const isCompact = w <= 60
    const isLarge = h >= 120

    // ── Compact mode (icon size) ──
    if (isCompact) {
        const lastLog = logs.length > 0 ? logs[logs.length - 1] : null
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                    style={{
                        width: w, height: h,
                        borderRadius: 10,
                        background: '#1a1b26',
                        border: `1px solid ${langColor}33`,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 2, boxSizing: 'border-box',
                        position: 'relative',
                    }}
                >
                    <StatusDot status={status} />
                    <Handle type="target" position={Position.Left} style={{
                        background: langColor, border: `2px solid ${langColor}55`, width: 6, height: 6,
                    }} />
                    <Handle type="source" position={Position.Right} style={{
                        background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 6, height: 6,
                    }} />
                    <Terminal size={16} style={{ color: langColor }} />
                </div>
                {/* Node name */}
                <span style={{ fontSize: 8, color: '#e2e8f0', fontWeight: 600, marginTop: 4, maxWidth: w + 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{data.label || `script.${lang}`}</span>
                {/* Last output line */}
                {lastLog && (
                    <span style={{ fontSize: 7, color: '#64748b', fontStyle: 'italic', marginTop: 2, maxWidth: w + 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}>{lastLog}</span>
                )}
            </div>
        )
    }

    return (
        <div style={{
            width: w, height: h,
            borderRadius: 10,
            background: '#1a1b26',
            border: `1px solid ${langColor}33`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px ${langColor}11`,
        }}>
            <Handle type="target" position={Position.Left} style={{
                background: langColor, border: `2px solid ${langColor}55`, width: 8, height: 8,
            }} />
            <Handle type="source" position={Position.Right} style={{
                background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
            }} />

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px',
                background: `${langColor}0a`,
                borderBottom: `1px solid ${langColor}22`,
                flexShrink: 0,
            }}>
                {/* Status indicator */}
                <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: status === 'running' ? '#f7df1e'
                        : status === 'done' ? '#28c840'
                            : status === 'error' ? '#ff5f57'
                                : '#475569',
                    boxShadow: status === 'running' ? '0 0 6px #f7df1e55' : 'none',
                    animation: status === 'running' ? 'pulse 1s ease infinite' : 'none',
                }} />

                {/* File name */}
                <div style={{
                    flex: 1, fontSize: 10, fontWeight: 600, color: '#94a3b8',
                    fontFamily: "'JetBrains Mono', monospace",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {data.label || `script.${lang}`}
                </div>

                {/* Language badge */}
                <div style={{
                    fontSize: 7, fontWeight: 700, color: langColor,
                    background: `${langColor}18`, padding: '1px 5px', borderRadius: 3,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                    {lang}
                </div>

                {/* Action buttons */}
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
                /* ── Large view: terminal log preview ── */
                <div style={{
                    flex: 1, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                }}>
                    {/* Terminal header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px',
                        background: 'rgba(0,0,0,0.2)',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <Terminal size={8} style={{ color: '#475569' }} />
                        <span style={{ fontSize: 8, color: '#475569', fontWeight: 600, fontFamily: 'Inter' }}>
                            Output
                        </span>
                        {logs.length > 0 && (
                            <span style={{ fontSize: 7, color: '#475569', fontFamily: "'JetBrains Mono', monospace" }}>
                                ({logs.length})
                            </span>
                        )}
                    </div>

                    {/* Log output */}
                    <div
                        className="nodrag nopan nowheel"
                        style={{
                            flex: 1, padding: '6px 10px',
                            overflowY: 'auto',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 9,
                            lineHeight: '14px',
                        }}
                    >
                        {logs.length === 0 ? (
                            <div style={{ color: '#334155', fontStyle: 'italic' }}>
                                No output yet. Click ▶ to run.
                            </div>
                        ) : (
                            logs.map((line, i) => (
                                <div key={i} style={{
                                    color: line.startsWith('ERROR')
                                        ? '#ff5f57'
                                        : line.startsWith('>')
                                            ? '#475569'
                                            : '#94a3b8',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all',
                                }}>
                                    <span style={{ color: '#334155', marginRight: 4, userSelect: 'none' }}>
                                        {String(i + 1).padStart(2, ' ')}
                                    </span>
                                    {line}
                                </div>
                            ))
                        )}
                        <div ref={logsEndRef} />
                    </div>

                    {/* Status bar */}
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
                        }}>
                            {status === 'running' ? '⏳ running...'
                                : status === 'done' ? `✓ done · ${logs.length} lines`
                                    : status === 'error' ? '✗ error'
                                        : '● idle'}
                        </span>
                    </div>
                </div>
            ) : (
                /* ── Small view: compact script card ── */
                <div style={{
                    flex: 1, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 8, padding: '0 10px',
                }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: `${langColor}15`, border: `1px solid ${langColor}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14,
                    }}>
                        {lang === 'js' ? '🟨' : lang === 'ts' ? '🔷' : lang === 'sh' ? '🐚' : '🐍'}
                    </div>
                    <div>
                        <div style={{
                            fontSize: 10, fontWeight: 600, color: '#e2e8f0',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>
                            {data.label || `script.${lang}`}
                        </div>
                        <div style={{
                            fontSize: 8, color: '#64748b',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>
                            {status === 'running' ? 'running...'
                                : status === 'done' ? `done · ${logs.length} lines`
                                    : `${editingCode.split('\n').length} lines`}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
