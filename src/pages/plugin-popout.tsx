/**
 * PluginPopoutPage — standalone page for rendering a single plugin's
 * side panel in its own browser window.
 *
 * URL: ?page=plugin-popout&pluginId=<plugin-id>
 *
 * Designed to be opened via `window.open()` from the main app so the
 * plugin UI can be placed on a second monitor.
 */

import { getEnabledPlugins, getPluginSettings, usePluginChange } from '@/plugins'
import { Puzzle } from 'lucide-react'

export function PluginPopoutPage() {
    usePluginChange()
    const params = new URLSearchParams(window.location.search)
    const pluginId = params.get('pluginId')
    const plugins = getEnabledPlugins()
    const plugin = plugins.find(p => p.meta.id === pluginId)

    if (!plugin || !plugin.renderSidePanel) {
        return (
            <div
                data-testid="plugin-popout-empty"
                style={{
                    height: '100vh', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 12,
                    background: '#0a0a14', color: '#64748b',
                    fontFamily: 'Inter, sans-serif', fontSize: 14,
                }}
            >
                <Puzzle size={32} style={{ opacity: 0.4 }} />
                <span>Plugin not found or not enabled.</span>
                <span style={{ fontSize: 11, opacity: 0.5 }}>
                    pluginId: {pluginId || '(none)'}
                </span>
            </div>
        )
    }

    const settings = getPluginSettings(plugin.meta.id)

    return (
        <div
            data-testid="plugin-popout-container"
            style={{
                height: '100vh', display: 'flex', flexDirection: 'column',
                background: '#0a0a14', color: '#e2e8f0',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            {/* Minimal header */}
            <div style={{
                padding: '8px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', gap: 8,
                flexShrink: 0,
                background: 'rgba(15,15,30,0.95)',
            }}>
                <span style={{ fontSize: 16 }}>{plugin.meta.icon || <Puzzle size={16} />}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                    {plugin.meta.name}
                </span>
                <span style={{
                    fontSize: 9, color: '#64748b',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    v{plugin.meta.version}
                </span>
            </div>

            {/* Plugin content */}
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                {plugin.renderSidePanel(settings)}
            </div>
        </div>
    )
}
