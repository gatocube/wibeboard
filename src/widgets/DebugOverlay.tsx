/**
 * DebugOverlay — displays debug information when debugMode is enabled.
 *
 * Size-based display:
 *   Compact (≤60px)  → Node ID + type badge
 *   Normal  (61-280) → JSON of state
 *   Large   (>280px) → Full node data JSON
 */

interface DebugOverlayProps {
    data: Record<string, any>
    nodeId?: string
    type?: string
    subType?: string
}

export function DebugOverlay({ data, nodeId, type, subType }: DebugOverlayProps) {
    const w = data.width || 160
    const isCompact = w <= 60
    const isLarge = w >= 280

    const overlay: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 10, 0, 0.88)',
        borderRadius: 'inherit',
        overflow: 'hidden',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        padding: isCompact ? 2 : 6,
        fontFamily: "'JetBrains Mono', monospace",
        color: '#22c55e',
        fontSize: isCompact ? 6 : isLarge ? 9 : 8,
        lineHeight: isCompact ? '8px' : '13px',
    }

    const badge: React.CSSProperties = {
        background: 'rgba(34, 197, 94, 0.15)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: 3,
        padding: '1px 3px',
        fontSize: isCompact ? 5 : 7,
        color: '#4ade80',
        display: 'inline-block',
        marginTop: 2,
    }

    // ── Compact: just ID + type ──
    if (isCompact) {
        return (
            <div style={overlay}>
                <div style={{ fontWeight: 700, fontSize: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nodeId || '—'}
                </div>
                <div style={badge}>
                    {type}{subType ? `:${subType}` : ''}
                </div>
            </div>
        )
    }

    // ── Large: full node data JSON ──
    if (isLarge) {
        // Filter out functions and very large fields
        const filtered: Record<string, any> = {}
        for (const [k, v] of Object.entries(data)) {
            if (typeof v === 'function') continue
            if (k === 'ctx') continue
            filtered[k] = v
        }

        return (
            <div style={overlay}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#4ade80' }}>🐛 {nodeId || '—'}</span>
                    <span style={badge}>{type}{subType ? `:${subType}` : ''}</span>
                </div>
                <div style={{
                    flex: 1, overflow: 'auto',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 4, padding: 4,
                }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#86efac' }}>
                        {JSON.stringify(filtered, null, 2)}
                    </pre>
                </div>
            </div>
        )
    }

    // ── Normal: state summary ──
    const stateFields: Record<string, any> = {}
    const stateKeys = ['status', 'progress', 'execTime', 'callsCount', 'knockSide', 'subType', 'label']
    for (const k of stateKeys) {
        if (k in data && data[k] !== undefined) stateFields[k] = data[k]
    }
    // Also include data.state if present
    if (data.state && typeof data.state === 'object') {
        Object.assign(stateFields, data.state)
    }

    return (
        <div style={overlay}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 7, color: '#4ade80' }}>🐛</span>
                <span style={{ fontWeight: 600, fontSize: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nodeId || '—'}
                </span>
                <span style={badge}>{type}{subType ? `:${subType}` : ''}</span>
            </div>
            <div style={{
                flex: 1, overflow: 'auto',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 3, padding: 3,
            }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#86efac', fontSize: 7 }}>
                    {JSON.stringify(stateFields, null, 1)}
                </pre>
            </div>
        </div>
    )
}
