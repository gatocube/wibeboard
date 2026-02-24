/**
 * FlowBuilderSettings — gear-icon settings panel (theme, mode, zoom-autosize).
 * Extracted from FlowBuilder.tsx.
 */

import { useState } from 'react'
import { Settings, Sun, Moon, ZoomIn } from 'lucide-react'
import type { ThemeKey, ThemeMode, NodeSize } from './types'

export function FlowBuilderSettings({
    theme, onThemeChange,
    mode, onModeChange,
    zoomAutosize, onZoomAutosizeChange,
    currentSize,
}: {
    theme: ThemeKey
    onThemeChange: (t: ThemeKey) => void
    mode: ThemeMode
    onModeChange: (m: ThemeMode) => void
    zoomAutosize: boolean
    onZoomAutosizeChange: (v: boolean) => void
    currentSize?: NodeSize
}) {
    const [open, setOpen] = useState(false)

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
                            onClick={() => onThemeChange(t)}
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
                        onClick={() => onModeChange(mode === 'dark' ? 'light' : 'dark')}
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
                        onClick={() => onZoomAutosizeChange(!zoomAutosize)}
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
                </div>
            )}
        </div>
    )
}
