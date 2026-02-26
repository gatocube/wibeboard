import { getEnabledPlugins, getPluginSettings, usePluginChange } from './plugin-registry'

export function PluginBottomBar() {
    usePluginChange()
    const plugins = getEnabledPlugins().filter(p => p.renderBottomBar)

    if (plugins.length === 0) return null

    return (
        <div
            data-testid="plugin-bottom-bar"
            style={{
                height: 28,
                flexShrink: 0,
                background: 'rgba(10,10,20,0.96)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '0 16px',
                fontSize: 11,
                color: '#94a3b8',
                fontFamily: 'Inter, sans-serif',
                overflow: 'hidden',
            }}
        >
            {plugins.map(p => (
                <div
                    key={p.meta.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    data-testid={`plugin-bottom-${p.meta.id}`}
                >
                    {p.renderBottomBar?.(getPluginSettings(p.meta.id))}
                </div>
            ))}
        </div>
    )
}
