/**
 * ConnectorFlow — click-based connection drawing for the builder.
 *
 * Phases:
 *   1. idle       — default
 *   2. positioning — click on handle → dashed bezier follows cursor
 *   3. sizing     — click on canvas → PlaceholderNode appears, mouse resizes
 *   4. placed     — click confirms size → widget selector popup shows
 *
 * All transitions are single clicks — NO dragging required.
 *
 * Ported from magnetic-filament's ConnectorFlow.tsx.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useReactFlow, type XYPosition, type Node, type Edge } from '@xyflow/react'
import { type WidgetDefinition, type WidgetTemplate, GRID_CELL, MIN_GRID } from '@/engine/widget-registry'

// ── Ghost node/edge IDs (used for the positioning preview) ──────────────────
const GHOST_NODE_ID = '__connector-ghost__'
const GHOST_EDGE_ID = '__connector-preview__'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ConnectorPhase =
    | { type: 'idle' }
    | { type: 'positioning'; sourceId: string; sourcePos: XYPosition; cursorPos: XYPosition }
    | { type: 'sizing'; placeholderId: string; sourceId: string | null; anchor: XYPosition }
    | { type: 'placed'; placeholderId: string; sourceId: string | null; anchor: XYPosition; gridCols: number; gridRows: number }

export interface ConnectorFlowCallbacks {
    onCreatePlaceholder: (sourceId: string | null, position: XYPosition) => string
    onResizePlaceholder: (placeholderId: string, rect: { x: number; y: number; width: number; height: number }) => void
    onSizingFinalized: (placeholderId: string) => void
    onFinalize: (placeholderId: string, widgetType: string, template: WidgetTemplate, gridCols: number, gridRows: number) => void
    onCancel: (placeholderId: string) => void
}

/** Convert anchor + mouse into a grid-snapped rect (bidirectional) */
export function anchorMouseToGridRect(anchor: XYPosition, mouse: XYPosition) {
    const rawDx = mouse.x - anchor.x
    const rawDy = mouse.y - anchor.y

    const cols = Math.max(MIN_GRID, Math.round(Math.abs(rawDx) / GRID_CELL))
    const halfRows = Math.max(MIN_GRID, Math.round(Math.abs(rawDy) / GRID_CELL))
    const rows = halfRows * 2

    const width = cols * GRID_CELL
    const height = rows * GRID_CELL

    const x = rawDx >= 0 ? anchor.x : anchor.x - width

    return { x, y: anchor.y - height / 2, width, height, cols, rows }
}

// ── Hook ────────────────────────────────────────────────────────────────────────

export function useConnectorFlow(callbacks: ConnectorFlowCallbacks) {
    const [phase, setPhase] = useState<ConnectorPhase>({ type: 'idle' })
    const { screenToFlowPosition, flowToScreenPosition } = useReactFlow()
    const callbacksRef = useRef(callbacks)
    callbacksRef.current = callbacks
    const phaseRef = useRef(phase)
    phaseRef.current = phase
    const gridRef = useRef({ cols: MIN_GRID * 4, rows: MIN_GRID * 2 })

    // ── Cancel on ESC / right-click ──
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const p = phaseRef.current
            if (e.key === 'Escape' && p.type !== 'idle') {
                e.preventDefault()
                if (p.type === 'sizing' || p.type === 'placed') {
                    callbacksRef.current.onCancel(p.placeholderId)
                }
                setPhase({ type: 'idle' })
            }
        }
        const onContext = (e: MouseEvent) => {
            const p = phaseRef.current
            if (p.type !== 'idle') {
                e.preventDefault()
                if (p.type === 'sizing' || p.type === 'placed') {
                    callbacksRef.current.onCancel(p.placeholderId)
                }
                setPhase({ type: 'idle' })
            }
        }
        window.addEventListener('keydown', onKey)
        window.addEventListener('contextmenu', onContext)
        return () => {
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('contextmenu', onContext)
        }
    }, [])

    // ── Phase 1: POSITIONING — line from handle to cursor ──
    useEffect(() => {
        if (phase.type !== 'positioning') return

        const onMouseMove = (e: MouseEvent) => {
            const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
            setPhase(prev => prev.type === 'positioning'
                ? { ...prev, cursorPos: flowPos }
                : prev)
        }

        const onClick = (e: MouseEvent) => {
            const p = phaseRef.current
            if (p.type !== 'positioning') return

            const target = e.target as HTMLElement
            if (target.closest('.react-flow__handle') || target.closest('.react-flow__node')) return

            e.stopPropagation()

            const anchor = screenToFlowPosition({ x: e.clientX, y: e.clientY })
            gridRef.current = { cols: MIN_GRID * 4, rows: MIN_GRID * 2 }
            const placeholderId = callbacksRef.current.onCreatePlaceholder(p.sourceId, anchor)

            setPhase({
                type: 'sizing',
                placeholderId,
                sourceId: p.sourceId,
                anchor,
            })
        }

        window.addEventListener('mousemove', onMouseMove)
        const timer = setTimeout(() => {
            window.addEventListener('click', onClick, { capture: true })
        }, 100)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('click', onClick, { capture: true })
        }
    }, [phase.type, screenToFlowPosition])

    // ── Phase 2: SIZING — mousemove resizes, click confirms ──
    useEffect(() => {
        if (phase.type !== 'sizing') return

        const onMouseMove = (e: MouseEvent) => {
            const p = phaseRef.current
            if (p.type !== 'sizing') return

            const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
            const gridRect = anchorMouseToGridRect(p.anchor, flowPos)
            gridRef.current = { cols: gridRect.cols, rows: gridRect.rows }
            callbacksRef.current.onResizePlaceholder(p.placeholderId, gridRect)
        }

        const onClick = (e: MouseEvent) => {
            const p = phaseRef.current
            if (p.type !== 'sizing') return

            e.stopPropagation()
            callbacksRef.current.onSizingFinalized(p.placeholderId)
            setPhase({
                type: 'placed',
                placeholderId: p.placeholderId,
                sourceId: p.sourceId,
                anchor: p.anchor,
                gridCols: gridRef.current.cols,
                gridRows: gridRef.current.rows,
            })
        }

        window.addEventListener('mousemove', onMouseMove)
        const timer = setTimeout(() => {
            window.addEventListener('click', onClick, { capture: true })
        }, 200)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('click', onClick, { capture: true })
        }
    }, [phase.type, screenToFlowPosition])

    // ── Handle click interception ──
    const containerRef = useRef<HTMLDivElement | null>(null)

    const handleMouseDown = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement
        const handle = target.closest('.react-flow__handle.source') as HTMLElement | null
        if (!handle) return

        const p = phaseRef.current
        if (p.type !== 'idle') return

        e.stopPropagation()
        e.preventDefault()

        const nodeEl = handle.closest('.react-flow__node') as HTMLElement
        const nodeId = nodeEl?.getAttribute('data-id')
        if (!nodeId) return

        const rect = handle.getBoundingClientRect()
        const handleScreenPos = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
        const flowPos = screenToFlowPosition(handleScreenPos)

        setPhase({
            type: 'positioning',
            sourceId: nodeId,
            sourcePos: flowPos,
            cursorPos: flowPos,
        })
    }, [screenToFlowPosition])

    const attachHandleInterceptor = useCallback((container: HTMLDivElement | null) => {
        if (containerRef.current) {
            containerRef.current.removeEventListener('mousedown', handleMouseDown, true)
        }
        containerRef.current = container
        if (container) {
            container.addEventListener('mousedown', handleMouseDown, true)
        }
    }, [handleMouseDown])

    // Widget selected → finalize
    const selectWidget = useCallback((widget: WidgetDefinition, template: WidgetTemplate) => {
        const p = phaseRef.current
        if (p.type === 'placed') {
            callbacksRef.current.onFinalize(p.placeholderId, widget.type, template, p.gridCols, p.gridRows)
        }
        setPhase({ type: 'idle' })
    }, [])

    const cancel = useCallback(() => {
        const p = phaseRef.current
        if (p.type === 'sizing' || p.type === 'placed') {
            callbacksRef.current.onCancel(p.placeholderId)
        }
        setPhase({ type: 'idle' })
    }, [])

    /** Start sizing mode from a drop position (no source edge) */
    const startSizingAt = useCallback((anchor: XYPosition) => {
        const p = phaseRef.current
        if (p.type !== 'idle') return

        gridRef.current = { cols: MIN_GRID * 4, rows: MIN_GRID * 2 }
        const placeholderId = callbacksRef.current.onCreatePlaceholder(null, anchor)

        setPhase({
            type: 'sizing',
            placeholderId,
            sourceId: null,
            anchor,
        })
    }, [])

    // ── Ghost node + edge for positioning preview (rendered by React Flow) ──
    const ghostNode: Node | null = useMemo(() => {
        if (phase.type !== 'positioning') return null
        return {
            id: GHOST_NODE_ID,
            type: 'default',
            position: phase.cursorPos,
            data: {},
            style: { width: 1, height: 1, opacity: 0, pointerEvents: 'none' as const },
            draggable: false,
            selectable: false,
            connectable: false,
        }
    }, [phase.type === 'positioning' ? phase.cursorPos.x : 0, phase.type === 'positioning' ? phase.cursorPos.y : 0, phase.type])

    const ghostEdge: Edge | null = useMemo(() => {
        if (phase.type !== 'positioning') return null
        return {
            id: GHOST_EDGE_ID,
            source: phase.sourceId,
            target: GHOST_NODE_ID,
            animated: true,
            style: { stroke: 'rgba(139,92,246,0.6)', strokeWidth: 2, strokeDasharray: '6 4' },
        }
    }, [phase.type === 'positioning' ? phase.sourceId : '', phase.type])

    return {
        phase,
        attachHandleInterceptor,
        selectWidget,
        cancel,
        startSizingAt,
        currentGrid: phase.type === 'placed'
            ? { cols: phase.gridCols, rows: phase.gridRows }
            : gridRef.current,
        /** Inject into nodes array: [...nodes, ...connector.previewNodes] */
        previewNodes: ghostNode ? [ghostNode] : [] as Node[],
        /** Inject into edges array: [...edges, ...connector.previewEdges] */
        previewEdges: ghostEdge ? [ghostEdge] : [] as Edge[],
        flowToScreenPosition,
    }
}

// ── Overlay ─────────────────────────────────────────────────────────────────────

export function ConnectorFlowOverlay({
    phase,
    currentGrid,
}: {
    phase: ConnectorPhase
    currentGrid: { cols: number; rows: number }
}) {
    if (phase.type === 'idle') return null

    return (
        /* Phase indicator — connection preview is now handled by React Flow edges */
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
