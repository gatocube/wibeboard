/**
 * StudioSettings — gear-icon settings panel (theme, mode, zoom-autosize).
 * Reads state from FlowStudioStore (MobX).
 */

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Settings, Sun, Moon, ZoomIn } from 'lucide-react'
import type { ThemeKey } from './types'
import { useFlowStudioStore } from './FlowStudioStore'

export const StudioSettings = observer(function StudioSettings({
    onThemeChange,
}: {
    onThemeChange?: (t: ThemeKey) => void
}) {
    const store = useFlowStudioStore()
    const [open, setOpen] = useState(false)

    const theme = store.theme
    const mode = store.mode
    const zoomAutosize = store.zoomAutosize
    const currentSize = store.currentSize

    return (
        <div style={{ position: 'relative' }}>
            <button
                data-testid="settings-btn"
                onClick={() => setOpen(o => !o)}
                style={{
                    background: open ? 'rgba(139,92,246,0.2)' : 'rgba(15,15,26,0.9)',
                    color: open ? '#c084fc' : '#64748b',
                    border: open ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s',
                }}
            >
                <Settings size={14} />
            </button>

            {open && (
                <div
                    data-testid="settings-panel"
                    style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 6,
                        width: 200,
                        background: 'rgba(15,15,26,0.97)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, padding: '10px 0',
                        backdropFilter: 'blur(12px)',
                        fontFamily: 'Inter',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        zIndex: 100,
                    }}
                >
                    {/* Theme selector */}
                    <div style={{ padding: '4px 12px', fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Theme
                    </div>
                    {(['wibeglow', 'pixel', 'ghub'] as ThemeKey[]).map(t => (
                        <button
                            key={t}
                            data-testid={`theme-${t}`}
                            onClick={() => {
                                store.setTheme(t)
                                onThemeChange?.(t)
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                padding: '6px 12px', border: 'none', cursor: 'pointer',
                                background: theme === t ? 'rgba(139,92,246,0.1)' : 'transparent',
                                color: theme === t ? '#c084fc' : '#94a3b8',
                                fontSize: 11, fontWeight: theme === t ? 600 : 400,
                                fontFamily: 'Inter', textAlign: 'left',
                            }}
                        >
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: t === 'wibeglow' ? '#8b5cf6' : t === 'pixel' ? '#ef4444' : '#58a6ff',
                            }} />
                            {t === 'wibeglow' ? 'WibeGlow' : t === 'pixel' ? 'Pixel' : 'GitHub'}
                        </button>
                    ))}

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                    {/* Mode toggle */}
                    <div style={{ padding: '4px 12px', fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Mode
                    </div>
                    <button
                        data-testid="mode-toggle"
                        onClick={() => store.setMode(mode === 'dark' ? 'light' : 'dark')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '6px 12px', border: 'none', cursor: 'pointer',
                            background: 'transparent', color: '#94a3b8',
                            fontSize: 11, fontFamily: 'Inter', textAlign: 'left',
                        }}
                    >
                        {mode === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                        {mode === 'dark' ? 'Dark' : 'Light'}
                    </button>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                    {/* Zoom autosize */}
                    <div style={{ padding: '4px 12px', fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Zoom Autosize {currentSize && <span style={{ color: '#c084fc', fontWeight: 700 }}>({currentSize})</span>}
                    </div>
                    <button
                        data-testid="zoom-autosize-toggle"
                        onClick={() => store.setZoomAutosize(!zoomAutosize)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '6px 12px', border: 'none', cursor: 'pointer',
                            background: zoomAutosize ? 'rgba(34,197,94,0.1)' : 'transparent',
                            color: zoomAutosize ? '#22c55e' : '#94a3b8',
                            fontSize: 11, fontWeight: zoomAutosize ? 600 : 400,
                            fontFamily: 'Inter', textAlign: 'left',
                        }}
                    >
                        <ZoomIn size={12} />
                        {zoomAutosize ? 'Enabled' : 'Disabled'}
                    </button>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                    {/* Minimap toggle */}
                    <div style={{ padding: '4px 12px', fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Minimap
                    </div>
                    <label
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                            padding: '6px 12px', cursor: 'pointer',
                        }}
                    >
                        <span style={{ color: store.showMinimap ? '#e2e8f0' : '#94a3b8', fontSize: 11, fontFamily: 'Inter' }}>Show Minimap</span>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                className="sr-only"
                                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                                checked={store.showMinimap}
                                onChange={(e) => store.setShowMinimap(e.target.checked)}
                            />
                            <div style={{
                                width: 28, height: 16,
                                background: store.showMinimap ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                                borderRadius: 12, transition: 'background 0.2s', position: 'relative'
                            }}>
                                <div style={{
                                    width: 12, height: 12, background: '#fff', borderRadius: '50%',
                                    position: 'absolute', top: 2, left: store.showMinimap ? 14 : 2,
                                    transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }} />
                            </div>
                        </div>
                    </label>
                </div>
            )}
        </div>
    )
})
