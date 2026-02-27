/**
 * NodeSettingsPanel — shows node settings with visual/raw mode toggle.
 *
 * "Raw" mode displays node.data as a prettified JSON editor.
 * "Visual" mode shows a structured form (placeholder for now).
 */

import { useState, useCallback, type CSSProperties } from 'react'
import type { Node } from '@xyflow/react'

export interface NodeSettingsPanelProps {
    node: Node
    onClose: () => void
    onUpdate?: (nodeId: string, data: Record<string, any>) => void
}

type Mode = 'visual' | 'raw'

const panelStyle: CSSProperties = {
    position: 'fixed',
    top: 60,
    right: 20,
    width: 380,
    maxHeight: 'calc(100vh - 100px)',
    background: 'rgba(26, 26, 30, 0.95)',
    backdropFilter: 'blur(12px)',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
    zIndex: 9000,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    color: '#eee',
    fontFamily: 'system-ui, -apple-system, sans-serif',
}

const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
}

const switcherStyle: CSSProperties = {
    display: 'flex',
    gap: 2,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 6,
    padding: 2,
}

const switchBtnBase: CSSProperties = {
    padding: '4px 12px',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.15s ease',
}

const closeBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
    padding: '0 4px',
}

const bodyStyle: CSSProperties = {
    flex: 1,
    padding: 16,
    overflow: 'auto',
}

const textareaStyle: CSSProperties = {
    width: '100%',
    minHeight: 280,
    background: 'rgba(0,0,0,0.3)',
    color: '#a5f3fc',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace',
    resize: 'vertical' as const,
    lineHeight: 1.5,
    outline: 'none',
    boxSizing: 'border-box' as const,
}

const fieldRowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    marginBottom: 12,
}

const labelStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: '#888',
}

const inputStyle: CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    color: '#eee',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 13,
    outline: 'none',
}

export function NodeSettingsPanel({ node, onClose, onUpdate }: NodeSettingsPanelProps) {
    const [mode, setMode] = useState<Mode>('visual')
    const [rawJson, setRawJson] = useState(() => JSON.stringify(node.data, null, 2))
    const [parseError, setParseError] = useState<string | null>(null)

    const handleRawChange = useCallback((val: string) => {
        setRawJson(val)
        try {
            JSON.parse(val)
            setParseError(null)
        } catch (err: any) {
            setParseError(err.message)
        }
    }, [])

    const handleApplyRaw = useCallback(() => {
        try {
            const parsed = JSON.parse(rawJson)
            onUpdate?.(node.id, parsed)
            setParseError(null)
        } catch (err: any) {
            setParseError(err.message)
        }
    }, [rawJson, node.id, onUpdate])

    const switchBtn = (m: Mode, label: string) => (
        <button
            style={{
                ...switchBtnBase,
                background: mode === m ? 'rgba(139,92,246,0.6)' : 'transparent',
                color: mode === m ? '#fff' : '#888',
            }}
            onClick={() => {
                if (m === 'raw') setRawJson(JSON.stringify(node.data, null, 2))
                setMode(m)
            }}
            data-testid={`settings-mode-${m}`}
        >
            {label}
        </button>
    )

    return (
        <div style={panelStyle} data-testid="node-settings-panel">
            {/* Header */}
            <div style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {String(node.data?.label || node.id)}
                    </span>
                    <span style={{ fontSize: 11, color: '#666' }}>
                        {node.type}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={switcherStyle}>
                        {switchBtn('visual', 'Visual')}
                        {switchBtn('raw', 'Raw')}
                    </div>
                    <button style={closeBtnStyle} onClick={onClose} data-testid="settings-close">
                        ✕
                    </button>
                </div>
            </div>

            {/* Body */}
            <div style={bodyStyle}>
                {mode === 'raw' ? (
                    <div>
                        <textarea
                            style={{
                                ...textareaStyle,
                                borderColor: parseError ? '#ef4444' : 'rgba(255,255,255,0.1)',
                            }}
                            value={rawJson}
                            onChange={e => handleRawChange(e.target.value)}
                            spellCheck={false}
                            data-testid="settings-raw-editor"
                        />
                        {parseError && (
                            <div style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>
                                {parseError}
                            </div>
                        )}
                        <button
                            onClick={handleApplyRaw}
                            disabled={!!parseError}
                            style={{
                                marginTop: 8,
                                padding: '6px 16px',
                                borderRadius: 6,
                                border: 'none',
                                background: parseError ? '#333' : 'rgba(139,92,246,0.7)',
                                color: parseError ? '#666' : '#fff',
                                cursor: parseError ? 'not-allowed' : 'pointer',
                                fontSize: 12,
                                fontWeight: 500,
                            }}
                            data-testid="settings-apply"
                        >
                            Apply
                        </button>
                    </div>
                ) : (
                    <div>
                        {/* Visual mode: show each data field */}
                        {Object.entries(node.data || {}).map(([key, value]) => (
                            <div key={key} style={fieldRowStyle}>
                                <label style={labelStyle}>{key}</label>
                                <input
                                    style={inputStyle}
                                    value={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                                    readOnly
                                />
                            </div>
                        ))}
                        {Object.keys(node.data || {}).length === 0 && (
                            <div style={{ color: '#666', fontSize: 13, fontStyle: 'italic' }}>
                                No settings for this node.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
