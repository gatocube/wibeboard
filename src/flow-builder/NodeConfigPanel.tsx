/**
 * NodeConfigPanel — sidebar panel shown when configuring a newly created node.
 * Replaces the WidgetPicker in the right sidebar.
 */

import { X, Code, Cpu, UserCircle, Save, Terminal, FileCode, FileType } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

// ── Types ───────────────────────────────────────────────────────────────────────

interface NodeConfigPanelProps {
    nodeId: string
    nodeType: string         // e.g. 'script-js', 'agent', 'user'
    nodeLabel: string
    nodeData: Record<string, any>
    onUpdateData: (nodeId: string, data: Record<string, any>) => void
    onClose: () => void
}

// ── Node type icon/color ────────────────────────────────────────────────────────

function getNodeMeta(nodeType: string) {
    if (nodeType.startsWith('script-')) {
        const lang = nodeType.replace('script-', '')
        const icons: Record<string, typeof Code> = { js: FileCode, sh: Terminal, py: FileType }
        return {
            icon: icons[lang] || Code,
            color: lang === 'js' ? '#f7df1e' : lang === 'sh' ? '#4ade80' : '#3b82f6',
            category: 'Script',
            language: lang.toUpperCase(),
        }
    }
    if (nodeType === 'agent') return { icon: Cpu, color: '#8b5cf6', category: 'AI Agent', language: '' }
    if (nodeType === 'user') return { icon: UserCircle, color: '#22c55e', category: 'User', language: '' }
    return { icon: Code, color: '#94a3b8', category: 'Node', language: '' }
}

// ── Component ───────────────────────────────────────────────────────────────────

export function NodeConfigPanel({ nodeId, nodeType, nodeLabel, nodeData, onUpdateData, onClose }: NodeConfigPanelProps) {
    const meta = getNodeMeta(nodeType)
    const Icon = meta.icon
    const isScript = nodeType.startsWith('script-')

    const [label, setLabel] = useState(nodeLabel)
    const [code, setCode] = useState(String(nodeData.code || ''))
    const [task, setTask] = useState(String(nodeData.task || ''))
    const codeRef = useRef<HTMLTextAreaElement>(null)

    // Auto-focus the main input
    useEffect(() => {
        if (isScript) {
            setTimeout(() => codeRef.current?.focus(), 100)
        }
    }, [isScript])

    const handleSave = () => {
        const updates: Record<string, any> = { label }
        if (isScript) {
            updates.code = code
            updates.configured = true
        } else if (nodeType === 'agent') {
            updates.task = task
        }
        onUpdateData(nodeId, updates)
        onClose()
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'rgba(15,15,26,0.98)',
            fontFamily: 'Inter, sans-serif',
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 10,
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${meta.color}15`,
                    border: `1px solid ${meta.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon size={16} color={meta.color} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', letterSpacing: 0.3 }}>
                        Configure Node
                    </div>
                    <div style={{ fontSize: 9, color: meta.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {meta.category} {meta.language && `· ${meta.language}`}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#64748b', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Name field */}
                <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Name
                    </label>
                    <input
                        type="text"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        style={{
                            width: '100%', marginTop: 6,
                            padding: '8px 10px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#e2e8f0', fontSize: 12,
                            fontFamily: 'Inter', outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Script code editor */}
                {isScript && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Code
                        </label>
                        <textarea
                            ref={codeRef}
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            placeholder={`// Write your ${meta.language} code here...`}
                            spellCheck={false}
                            style={{
                                flex: 1, marginTop: 6, minHeight: 180,
                                padding: '10px 12px', borderRadius: 8,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#a5d6ff', fontSize: 11,
                                fontFamily: "'JetBrains Mono', monospace",
                                lineHeight: 1.6,
                                outline: 'none', resize: 'vertical',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                )}

                {/* Agent task */}
                {nodeType === 'agent' && (
                    <div>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Task / Prompt
                        </label>
                        <textarea
                            value={task}
                            onChange={e => setTask(e.target.value)}
                            placeholder="Describe what this agent should do..."
                            style={{
                                width: '100%', marginTop: 6, minHeight: 120,
                                padding: '10px 12px', borderRadius: 8,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#e2e8f0', fontSize: 12,
                                fontFamily: 'Inter', lineHeight: 1.5,
                                outline: 'none', resize: 'vertical',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                )}

                {/* User node — placeholder info */}
                {nodeType === 'user' && (
                    <div style={{
                        padding: '12px 14px', borderRadius: 8,
                        background: 'rgba(245,158,11,0.06)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        fontSize: 11, color: '#94a3b8', lineHeight: 1.5,
                    }}>
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>User node</span> — this node pauses
                        the flow for human review, approval, or manual data entry.
                    </div>
                )}
            </div>

            {/* Footer — Save */}
            <div style={{
                padding: '12px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 8,
            }}>
                <button
                    onClick={handleSave}
                    style={{
                        flex: 1, padding: '10px 0',
                        borderRadius: 8, border: 'none',
                        background: `${meta.color}22`,
                        color: meta.color, fontSize: 12,
                        fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'Inter',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${meta.color}33`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `${meta.color}22`)}
                >
                    <Save size={14} />
                    Save & Close
                </button>
            </div>
        </div>
    )
}
