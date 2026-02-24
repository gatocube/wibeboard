/**
 * ConnectorOverlay — phase hint bar shown during node creation.
 * Extracted from ConnectorFlow.tsx.
 */

import type { ConnectorPhase } from './types'

export function ConnectorOverlay({
    phase,
    currentGrid,
}: {
    phase: ConnectorPhase
    currentGrid: { cols: number; rows: number }
}) {
    if (phase.type === 'idle') return null

    return (
        <div style={{
            position: 'fixed',
            bottom: 60, left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 12px', borderRadius: 6,
            background: 'rgba(15,15,26,0.9)',
            border: '1px solid rgba(139,92,246,0.2)',
            fontSize: 9, color: '#8b5cf6',
            fontFamily: 'Inter', fontWeight: 500,
            zIndex: 100, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
        }}>
            {phase.type === 'positioning' && '🔗 Click on canvas to place node · ESC to cancel'}
            {phase.type === 'sizing' && `📐 Move to resize (${currentGrid.cols}×${currentGrid.rows}) · Click to confirm · ESC to cancel`}
            {phase.type === 'placed' && `✅ Size confirmed (${currentGrid.cols}×${currentGrid.rows}) · Pick a widget · ESC to cancel`}
        </div>
    )
}
