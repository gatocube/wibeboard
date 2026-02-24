/**
 * RawNode — fallback node that displays raw JSON state.
 *
 * Used when a theme doesn't have a component for a widget type.
 * Shows data as formatted JSON in a terminal-style preview canvas.
 */

import { PreviewCanvas } from '@/components/PreviewCanvas'

export function RawNode({ data }: { data: Record<string, any> }) {
    const w = data.width || 220
    const h = data.height || 160

    // Format data as JSON lines for terminal display
    const { width: _w, height: _h, ...displayData } = data
    const jsonStr = JSON.stringify(displayData, null, 2)
    const lines = jsonStr.split('\n')

    return (
        <div style={{
            width: w, height: h,
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'JetBrains Mono', monospace",
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
            }}>
                <span style={{ fontSize: 10, opacity: 0.6 }}>{'{…}'}</span>
                <span style={{
                    flex: 1, fontSize: 9, fontWeight: 600,
                    color: '#94a3b8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {data.label || data.type || 'raw'}
                </span>
                {data.status && (
                    <span style={{
                        fontSize: 7, color: '#64748b',
                        padding: '1px 4px', borderRadius: 3,
                        background: 'rgba(255,255,255,0.04)',
                    }}>{data.status}</span>
                )}
            </div>

            {/* JSON body via PreviewCanvas */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '0 2px' }}>
                <PreviewCanvas
                    type="terminal"
                    lines={lines}
                    maxLines={Math.max(8, Math.floor((h - 40) / 13))}
                />
            </div>
        </div>
    )
}
