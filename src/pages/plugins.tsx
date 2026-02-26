import { useState, useCallback } from 'react'
import { Puzzle, ToggleLeft, ToggleRight, ChevronDown, ChevronRight, Shield, FileCode } from 'lucide-react'
import { CodeEditor } from '@/kit/CodeEditor'
import {
    getPlugins,
    isPluginEnabled,
    setPluginEnabled,
    getPluginSettings,
    savePluginSettings,
} from '@/plugins'

export function PluginsPage() {
    const plugins = getPlugins()
    const [, forceUpdate] = useState(0)
    const rerender = useCallback(() => forceUpdate(n => n + 1), [])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [showSourceId, setShowSourceId] = useState<string | null>(null)

    const toggle = (id: string) => {
        setPluginEnabled(id, !isPluginEnabled(id))
        rerender()
    }

    const handleSettingsUpdate = (id: string, next: Record<string, any>) => {
        savePluginSettings(id, next)
        rerender()
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <h1 style={{ fontSize: 24, marginBottom: 8, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Puzzle size={24} /> Plugins
                </h1>
                <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                    Enable plugins to extend wibeboard with side panel widgets, status bar indicators, and more.
                </p>

                {plugins.length === 0 && (
                    <div style={{ color: '#64748b', fontSize: 14, padding: 24, textAlign: 'center' }}>
                        No plugins registered.
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {plugins.map(p => {
                        const enabled = isPluginEnabled(p.meta.id)
                        const expanded = expandedId === p.meta.id
                        const settings = getPluginSettings(p.meta.id)
                        const hasSecretsRead = p.meta.permissions?.includes('secrets:read')
                        const sourceVisible = showSourceId === p.meta.id

                        return (
                            <div
                                key={p.meta.id}
                                data-testid={`plugin-card-${p.meta.id}`}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${enabled ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                {/* Header row */}
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '14px 16px', cursor: 'pointer',
                                    }}
                                    onClick={() => setExpandedId(expanded ? null : p.meta.id)}
                                >
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 8,
                                        background: enabled ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.04)',
                                        color: enabled ? '#a78bfa' : '#64748b',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0, fontSize: 18,
                                    }}>
                                        {p.meta.icon || <Puzzle size={18} />}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
                                                {p.meta.name}
                                            </span>
                                            <span style={{
                                                fontSize: 10, color: '#64748b',
                                                fontFamily: "'JetBrains Mono', monospace",
                                            }}>
                                                v{p.meta.version}
                                            </span>
                                            {/* Permission badge */}
                                            {hasSecretsRead && (
                                                <span
                                                    data-testid={`plugin-badge-secrets-read-${p.meta.id}`}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 3,
                                                        fontSize: 9, fontWeight: 600,
                                                        padding: '2px 7px', borderRadius: 4,
                                                        background: 'rgba(245,158,11,0.12)',
                                                        color: '#f59e0b',
                                                        border: '1px solid rgba(245,158,11,0.25)',
                                                        letterSpacing: 0.3,
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                    }}
                                                >
                                                    <Shield size={10} /> secrets:read
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                                            {p.meta.description}
                                        </div>
                                    </div>

                                    {/* Enable toggle */}
                                    <button
                                        data-testid={`plugin-toggle-${p.meta.id}`}
                                        onClick={e => { e.stopPropagation(); toggle(p.meta.id) }}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: enabled ? '#8b5cf6' : '#475569',
                                            transition: 'color 0.2s', flexShrink: 0,
                                        }}
                                    >
                                        {enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                    </button>

                                    {/* Expand chevron */}
                                    <div style={{ color: '#475569', flexShrink: 0 }}>
                                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                </div>

                                {/* Expanded settings section */}
                                {expanded && (
                                    <div style={{
                                        padding: '0 16px 16px',
                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                        {/* Settings */}
                                        {p.renderSettings ? (
                                            <>
                                                <div style={{
                                                    fontSize: 11, fontWeight: 600, color: '#64748b',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                                    padding: '12px 0 8px',
                                                }}>
                                                    Settings
                                                </div>
                                                {p.renderSettings(settings, (next) => handleSettingsUpdate(p.meta.id, next))}
                                            </>
                                        ) : (
                                            <div style={{
                                                padding: '12px 0',
                                                color: '#64748b', fontSize: 12,
                                            }}>
                                                This plugin has no configurable settings.
                                            </div>
                                        )}

                                        {/* View Source button */}
                                        {p.meta.source && (
                                            <div style={{ marginTop: 16 }}>
                                                <button
                                                    data-testid={`plugin-view-source-${p.meta.id}`}
                                                    onClick={() => setShowSourceId(sourceVisible ? null : p.meta.id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 6,
                                                        background: 'rgba(56,189,248,0.08)',
                                                        border: '1px solid rgba(56,189,248,0.2)',
                                                        borderRadius: 6,
                                                        padding: '6px 12px',
                                                        color: '#38bdf8',
                                                        fontSize: 12, fontWeight: 500,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                >
                                                    <FileCode size={14} />
                                                    {sourceVisible ? 'Hide MDX Source' : 'View MDX Source'}
                                                </button>

                                                {sourceVisible && (
                                                    <div data-testid={`plugin-source-${p.meta.id}`} style={{ marginTop: 10 }}>
                                                        <CodeEditor
                                                            value={p.meta.source}
                                                            language="markdown"
                                                            readOnly
                                                            minHeight={120}
                                                            maxHeight={400}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Info box */}
                <div style={{
                    marginTop: 24, padding: 16,
                    background: 'rgba(139,92,246,0.08)',
                    borderRadius: 10,
                    border: '1px solid rgba(139,92,246,0.2)',
                }}>
                    <h3 style={{
                        margin: '0 0 6px', color: '#c084fc', fontSize: 13,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Puzzle size={14} /> About Plugins
                    </h3>
                    <p style={{ margin: 0, color: '#a78bfa', fontSize: 12, lineHeight: 1.5 }}>
                        Plugins can render in three slots: the <strong>right side panel</strong> for main UI,
                        the <strong>bottom bar</strong> for small status messages, and this <strong>settings page</strong> for configuration.
                        Enable a plugin and configure its settings above.
                    </p>
                </div>
            </div>
        </div>
    )
}
