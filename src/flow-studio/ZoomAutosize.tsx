/**
 * ZoomAutosize — zoom-level → node-size watcher + screen↔flow bridge.
 * Extracted from FlowStudio.tsx.
 */

import { useEffect, useRef } from 'react'
import { useStore, useReactFlow } from '@xyflow/react'
import type { NodeSize } from './types'

// ── Zoom → Size mapping ─────────────────────────────────────────────────────

function zoomToSize(zoom: number): NodeSize {
    if (zoom < 0.5) return 'S'
    if (zoom < 0.85) return 'M'
    return 'L'
}

/**
 * Selector that derives NodeSize from the store's zoom level.
 * Returns a *stable string* — React Flow's useStore uses Object.is equality,
 * so the subscribing component re-renders ONLY when the size bucket changes
 * (e.g. M→L), not on every 0.001 zoom tick.
 */
const zoomToSizeSelector = (state: { transform: [number, number, number] }): NodeSize =>
    zoomToSize(state.transform[2])

// ── ZoomAutosizeWatcher ─────────────────────────────────────────────────────

export function ZoomAutosizeWatcher({ enabled, onSizeChange }: {
    enabled: boolean
    onSizeChange?: (size: NodeSize) => void
}) {
    const derivedSize = useStore(zoomToSizeSelector)
    const lastEmitted = useRef<NodeSize | null>(null)

    useEffect(() => {
        if (!enabled || !onSizeChange) return
        if (derivedSize !== lastEmitted.current) {
            lastEmitted.current = derivedSize
            onSizeChange(derivedSize)
        }
    }, [derivedSize, enabled, onSizeChange])

    return null
}

// ── ScreenToFlowBridge ──────────────────────────────────────────────────────

/** Renders nothing — exposes screenToFlowPosition to a ref for use outside ReactFlow children. */
export function ScreenToFlowBridge({ converterRef }: {
    converterRef: React.MutableRefObject<((pos: { x: number; y: number }) => { x: number; y: number }) | null>
}) {
    const { screenToFlowPosition } = useReactFlow()
    converterRef.current = screenToFlowPosition
    return null
}
