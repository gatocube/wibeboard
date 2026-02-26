import { useState } from 'react'
import { PanelRightOpen, PanelRightClose } from 'lucide-react'
import { getEnabledPlugins, getPluginSettings, usePluginChange } from './plugin-registry'

export function PluginSidePanel() {
    usePluginChange()
    const [open, setOpen] = useState(true)
    const plugins = getEnabledPlugins().filter(p => p.renderSidePanel)
    const [activeTab, setActiveTab] = useState(0)

    if (plugins.length === 0) return null

    return (
        <div
            data-testid="plugin-side-panel"
            style={{
                width: open ? 280 : 36,
                flexShrink: 0,
                background: 'rgba(10,10,20,0.96)',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
                overflow: 'hidden',
            }}
        >
            {/* Toggle button */}
            <button
                data-testid="plugin-side-panel-toggle"
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', height: 32, border: 'none',
                    background: 'transparent', color: '#64748b',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {open ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            </button>

            {open && (
                <>
                    {/* Tabs (if more than one plugin) */}
                    {plugins.length > 1 && (
                        <div style={{
                            display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            {plugins.map((p, i) => (
                                <button
                                    key={p.meta.id}
                                    onClick={() => setActiveTab(i)}
                                    style={{
                                        flex: 1, padding: '6px 8px', border: 'none',
                                        background: activeTab === i ? 'rgba(139,92,246,0.12)' : 'transparent',
                                        color: activeTab === i ? '#c084fc' : '#64748b',
                                        fontSize: 10, fontWeight: 600,
                                        cursor: 'pointer', fontFamily: 'Inter',
                                        borderBottom: activeTab === i ? '2px solid #8b5cf6' : '2px solid transparent',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {p.meta.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Active plugin content */}
                    <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                        {plugins[activeTab]?.renderSidePanel?.(
                            getPluginSettings(plugins[activeTab].meta.id),
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
