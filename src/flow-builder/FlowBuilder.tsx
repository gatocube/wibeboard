/**
 * FlowBuilder — self-contained ReactFlow wrapper with widget creation pipeline.
 *
 * Merges the former ConnectorFlow state machine into this component so consumers
 * get node creation for free via the `onNodeCreated` callback.
 *
 * Features:
 *  - ReactFlow shell with background, settings panel, zoom-autosize
 *  - WidgetPicker sidebar (editMode)
 *  - ConnectorFlow lifecycle: handle click → position → resize → pick widget
 *  - Drag-and-drop from WidgetPicker sidebar
 *  - Ghost node/edge preview during positioning phase
 *  - ESC / right-click cancellation
 */

import {
    ReactFlow, Background, Panel,
    useReactFlow,
    type Node, type Edge, type XYPosition,
} from '@xyflow/react'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { GRID_CELL, MIN_GRID, widgetRegistry, type WidgetDefinition, type WidgetTemplate } from '@/engine/widget-registry'

import type { FlowBuilderProps, ThemeKey, ThemeMode, NodeSize, ConnectorPhase } from './types'
import { FlowBuilderSettings } from './FlowBuilderSettings'
import { ZoomAutosizeWatcher, ScreenToFlowBridge } from './ZoomAutosize'
import { ConnectorOverlay } from './ConnectorOverlay'
import { WidgetPicker } from './WidgetPicker'
import { ExtendedNodeButtonsMenu } from '@/kit/ExtendedNodeButtonsMenu'

// ── Ghost node/edge IDs ─────────────────────────────────────────────────────────
const GHOST_NODE_ID = '__connector-ghost__'
const GHOST_EDGE_ID = '__connector-preview__'
const PLACEHOLDER_PREFIX = 'placeholder-'

// ── Theme backgrounds ───────────────────────────────────────────────────────────

const THEME_BG: Record<ThemeKey, string> = {
    wibeglow: '#1e1e3a',
    pixel: '#1a1a1a',
    ghub: '#21262d',
}

const THEME_CANVAS: Record<ThemeKey, string> = {
    wibeglow: '#0a0a14',
    pixel: '#080808',
    ghub: '#0d1117',
}

// ── Grid helpers ────────────────────────────────────────────────────────────────

function anchorMouseToGridRect(anchor: XYPosition, mouse: XYPosition) {
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

// ── FlowBuilder (needs ReactFlowProvider parent) ────────────────────────────────

export function FlowBuilder({
    nodes, edges, nodeTypes, children,
    onNodesChange,
    defaultViewport,
    nodesDraggable = false,
    nodesConnectable = false,
    panOnDrag = true,
    zoomOnScroll = true,
    fitView = false,
    currentSize = 'M',
    onSizeChange,
    currentTheme = 'wibeglow',
    onThemeChange,
    wrapperStyle,
    bgColor,
    gridGap = 20,
    editMode = false,
    onNodeCreated,
    onNodeCancelled,
    onAddBefore,
    onAddAfter,
    onConfigure,
    onRename,
}: FlowBuilderProps) {
    const { screenToFlowPosition } = useReactFlow()

    // ── Visual state ────────────────────────────────────────────────────────────
    const [theme, setTheme] = useState<ThemeKey>(currentTheme)
    const [mode, setMode] = useState<ThemeMode>('dark')
    const [zoomAutosize, setZoomAutosize] = useState(false)

    const handleThemeChange = (t: ThemeKey) => {
        setTheme(t)
        onThemeChange?.(t)
    }
    const handleSizeChange = (s: NodeSize) => onSizeChange?.(s)

    const canvasBg = bgColor || THEME_CANVAS[theme]
    const gridColor = THEME_BG[theme]

    // ── Screen→Flow bridge ref ──────────────────────────────────────────────────
    const screenToFlowRef = useRef<((pos: { x: number; y: number }) => { x: number; y: number }) | null>(null)

    // ── Node buttons menu state ─────────────────────────────────────────────────
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

    // Dismiss menu when leaving edit mode
    useEffect(() => {
        if (!editMode) setSelectedNodeId(null)
    }, [editMode])

    // Find selected node data for the menu
    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null

    // Node click + long-press detection
    // Desktop: pointerup toggles menu.
    // Touch: long-press (500ms hold) also triggers menu with scale animation.
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pressedNodeRef = useRef<{ id: string; el: HTMLElement } | null>(null)
    const didLongPressRef = useRef(false)

    useEffect(() => {
        const el = wrapperElRef.current
        if (!el) return

        const clearLongPress = () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current)
                longPressTimerRef.current = null
            }
            // Restore node scale
            if (pressedNodeRef.current) {
                pressedNodeRef.current.el.style.transition = 'transform 0.2s ease-out'
                pressedNodeRef.current.el.style.transform = ''
                pressedNodeRef.current = null
            }
        }

        const onPointerDown = (e: PointerEvent) => {
            if (!editMode) return
            const target = e.target as HTMLElement
            const nodeEl = target.closest('.react-flow__node') as HTMLElement | null
            if (!nodeEl) return
            const nodeId = nodeEl.getAttribute('data-id')
            if (!nodeId) return
            if (nodeId.startsWith(PLACEHOLDER_PREFIX) || nodeId === GHOST_NODE_ID) return
            if (target.closest('.react-flow__handle')) return

            didLongPressRef.current = false
            pressedNodeRef.current = { id: nodeId, el: nodeEl }

            // Animate press-down effect
            nodeEl.style.transition = 'transform 0.15s ease-out'
            nodeEl.style.transform = 'scale(0.95)'

            // Start long-press timer
            longPressTimerRef.current = setTimeout(() => {
                didLongPressRef.current = true
                setSelectedNodeId(prev => prev === nodeId ? null : nodeId)
                // Release scale
                nodeEl.style.transition = 'transform 0.2s ease-out'
                nodeEl.style.transform = ''
                pressedNodeRef.current = null
                longPressTimerRef.current = null
            }, 500)
        }

        const onPointerUp = (e: PointerEvent) => {
            clearLongPress()
            if (didLongPressRef.current) {
                didLongPressRef.current = false
                return // Already handled by long-press
            }

            const target = e.target as HTMLElement
            const nodeEl = target.closest('.react-flow__node') as HTMLElement | null
            if (nodeEl) {
                if (!editMode) return
                const nodeId = nodeEl.getAttribute('data-id')
                if (!nodeId) return
                if (nodeId.startsWith(PLACEHOLDER_PREFIX) || nodeId === GHOST_NODE_ID) return
                if (target.closest('.react-flow__handle')) return
                setSelectedNodeId(prev => prev === nodeId ? null : nodeId)
                return
            }

            // Click on pane = dismiss menu
            if (target.closest('.react-flow__pane') || target.closest('.react-flow__renderer')) {
                setSelectedNodeId(null)
            }
        }

        // Cancel long-press on drag or pointer leave
        const onPointerMove = () => {
            if (!pressedNodeRef.current) return
            // Allow small movement (5px threshold)
            clearLongPress()
        }

        const onPointerCancel = () => clearLongPress()

        el.addEventListener('pointerdown', onPointerDown)
        el.addEventListener('pointerup', onPointerUp)
        el.addEventListener('pointermove', onPointerMove, { passive: true })
        el.addEventListener('pointercancel', onPointerCancel)
        return () => {
            clearLongPress()
            el.removeEventListener('pointerdown', onPointerDown)
            el.removeEventListener('pointerup', onPointerUp)
            el.removeEventListener('pointermove', onPointerMove)
            el.removeEventListener('pointercancel', onPointerCancel)
        }
    }, [editMode])  // recreate when editMode changes

    // ── Connector state machine ─────────────────────────────────────────────────
    const [phase, setPhase] = useState<ConnectorPhase>({ type: 'idle' })
    const phaseRef = useRef(phase)
    phaseRef.current = phase
    const gridRef = useRef({ cols: MIN_GRID * 4, rows: MIN_GRID * 2 })

    // Internal placeholder nodes/edges managed by the connector
    const [placeholderNodes, setPlaceholderNodes] = useState<Node[]>([])
    const [placeholderEdges, setPlaceholderEdges] = useState<Edge[]>([])

    // Stable refs for callbacks
    const onNodeCreatedRef = useRef(onNodeCreated)
    onNodeCreatedRef.current = onNodeCreated
    const onNodeCancelledRef = useRef(onNodeCancelled)
    onNodeCancelledRef.current = onNodeCancelled

    // ── Connector: cancel on ESC / right-click ──────────────────────────────────
    const cancelConnector = useCallback(() => {
        const p = phaseRef.current
        if (p.type === 'sizing' || p.type === 'placed') {
            setPlaceholderNodes(nds => nds.filter(n => n.id !== p.placeholderId))
            setPlaceholderEdges(eds => eds.filter(e => e.target !== p.placeholderId))
            onNodeCancelledRef.current?.(p.placeholderId)
        }
        setPhase({ type: 'idle' })
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && phaseRef.current.type !== 'idle') {
                e.preventDefault()
                cancelConnector()
            }
        }
        const onContext = (e: MouseEvent) => {
            if (phaseRef.current.type !== 'idle') {
                e.preventDefault()
                cancelConnector()
            }
        }
        window.addEventListener('keydown', onKey)
        window.addEventListener('contextmenu', onContext)
        return () => {
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('contextmenu', onContext)
        }
    }, [cancelConnector])

    // ── Connector: create placeholder ───────────────────────────────────────────
    const createPlaceholder = useCallback((sourceId: string | null, position: XYPosition) => {
        const placeholderId = `${PLACEHOLDER_PREFIX}${Date.now()}`
        const defaultW = MIN_GRID * 4 * GRID_CELL
        const defaultH = MIN_GRID * 2 * GRID_CELL

        setPlaceholderNodes(nds => [...nds, {
            id: placeholderId,
            type: 'placeholder',
            position,
            data: {
                width: defaultW, height: defaultH,
                gridCols: MIN_GRID * 4, gridRows: MIN_GRID * 2,
                sizing: true,
            },
            style: { width: defaultW, height: defaultH },
            draggable: false,
            selectable: false,
        }])

        if (sourceId) {
            setPlaceholderEdges(eds => [...eds, {
                id: `edge-${sourceId}-${placeholderId}`,
                source: sourceId,
                target: placeholderId,
                animated: true,
                style: { stroke: 'rgba(139,92,246,0.5)', strokeWidth: 2 },
            }])
        }

        return placeholderId
    }, [])

    // ── Connector: resize placeholder ───────────────────────────────────────────
    const resizePlaceholder = useCallback((placeholderId: string, rect: { x: number; y: number; width: number; height: number; cols: number; rows: number }) => {
        setPlaceholderNodes(nds => nds.map(n =>
            n.id === placeholderId
                ? {
                    ...n,
                    position: { x: rect.x, y: rect.y },
                    data: { ...n.data, width: rect.width, height: rect.height, gridCols: rect.cols, gridRows: rect.rows, sizing: true },
                    style: { width: rect.width, height: rect.height },
                }
                : n
        ))
    }, [])

    // ── Helper to update placeholder node data for resize ────────────────────────
    const handlePlaceholderResize = useCallback((placeholderId: string, newW: number, newH: number) => {
        setPlaceholderNodes(nds => nds.map(n =>
            n.id === placeholderId
                ? { ...n, data: { ...n.data, width: newW, height: newH }, style: { width: newW, height: newH } }
                : n
        ))
    }, [])

    // ── Connector: sizing finalized → show widget picker ────────────────────────
    const finalizeSizing = useCallback((placeholderId: string) => {
        setPlaceholderNodes(nds => nds.map(n =>
            n.id === placeholderId
                ? {
                    ...n,
                    data: {
                        ...n.data,
                        sizing: false,
                        resizable: true,
                        showSelector: true,
                        onResize: (newW: number, newH: number) => handlePlaceholderResize(placeholderId, newW, newH),
                        onSelectWidget: (widget: WidgetDefinition, template: WidgetTemplate) => {
                            selectWidget(widget, template)
                        },
                        onCancelSelector: () => cancelConnector(),
                        onHoverWidget: (widget: WidgetDefinition | null) => {
                            setPlaceholderNodes(ns => ns.map(nd =>
                                nd.id === placeholderId
                                    ? { ...nd, data: { ...nd.data, hoveredWidget: widget } }
                                    : nd
                            ))
                        },
                    },
                }
                : n
        ))
    }, [handlePlaceholderResize, cancelConnector]) // selectWidget added below

    // ── Connector: widget selected → fire onNodeCreated ─────────────────────────
    const selectWidget = useCallback((widget: WidgetDefinition, template: WidgetTemplate) => {
        const p = phaseRef.current
        if (p.type !== 'placed') {
            setPhase({ type: 'idle' })
            return
        }

        // Get the placeholder's current rect
        const placeholder = placeholderNodes.find(n => n.id === p.placeholderId)
        const rect = {
            x: placeholder?.position?.x || p.anchor.x,
            y: placeholder?.position?.y || p.anchor.y,
            width: Number(placeholder?.data?.width) || GRID_CELL * p.gridCols,
            height: Number(placeholder?.data?.height) || GRID_CELL * p.gridRows,
        }

        // Remove placeholder
        setPlaceholderNodes(nds => nds.filter(n => n.id !== p.placeholderId))
        setPlaceholderEdges(eds => eds.filter(e => e.target !== p.placeholderId))

        // Fire callback
        const nodeId = `node-${Date.now()}`
        onNodeCreatedRef.current?.(nodeId, widget.type, template, rect, p.sourceId)

        widgetRegistry.markUsed(widget.type)
        setPhase({ type: 'idle' })
    }, [placeholderNodes])

    // ── Connector: start sizing from drop position ──────────────────────────────
    const startSizingAt = useCallback((anchor: XYPosition, sourceId: string | null = null) => {
        if (phaseRef.current.type !== 'idle') return

        gridRef.current = { cols: MIN_GRID * 4, rows: MIN_GRID * 2 }
        const placeholderId = createPlaceholder(sourceId, anchor)

        setPhase({
            type: 'sizing',
            placeholderId,
            sourceId,
            anchor,
        })
    }, [createPlaceholder])

    // ── Phase 1: POSITIONING — line from handle to cursor ───────────────────────
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
            const placeholderId = createPlaceholder(p.sourceId, anchor)

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
    }, [phase.type, screenToFlowPosition, createPlaceholder])

    // ── Phase 2: SIZING — mousemove resizes, click confirms ─────────────────────
    useEffect(() => {
        if (phase.type !== 'sizing') return

        const onMouseMove = (e: MouseEvent) => {
            const p = phaseRef.current
            if (p.type !== 'sizing') return

            const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY })
            const gridRect = anchorMouseToGridRect(p.anchor, flowPos)
            gridRef.current = { cols: gridRect.cols, rows: gridRect.rows }
            resizePlaceholder(p.placeholderId, gridRect)
        }

        const onClick = (e: MouseEvent) => {
            const p = phaseRef.current
            if (p.type !== 'sizing') return

            e.stopPropagation()
            finalizeSizing(p.placeholderId)
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
    }, [phase.type, screenToFlowPosition, resizePlaceholder, finalizeSizing])

    // ── Handle click interception (source handle → positioning mode) ────────────
    //    Also detects node clicks for the NodeButtonsMenu.
    const wrapperElRef = useRef<HTMLDivElement | null>(null)

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (!editMode) return
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
    }, [screenToFlowPosition, editMode])


    // Attach/detach mousedown listener on the wrapper (handle click interception only)
    const wrapperRef = useCallback((el: HTMLDivElement | null) => {
        if (wrapperElRef.current) {
            wrapperElRef.current.removeEventListener('mousedown', handleMouseDown, true)
        }
        wrapperElRef.current = el
        if (el) {
            el.addEventListener('mousedown', handleMouseDown, true)
        }
    }, [handleMouseDown])

    // ── Ghost node + edge for positioning preview ───────────────────────────────
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

    // ── Combine consumer nodes/edges with connector nodes/edges ─────────────────
    const allNodes = useMemo(() => {
        const result = [...nodes, ...placeholderNodes]
        if (ghostNode) result.push(ghostNode)
        return result
    }, [nodes, placeholderNodes, ghostNode])

    const allEdges = useMemo(() => {
        const result = [...edges, ...placeholderEdges]
        if (ghostEdge) result.push(ghostEdge)
        return result
    }, [edges, placeholderEdges, ghostEdge])

    // ── Current grid for overlay ────────────────────────────────────────────────
    const currentGrid = phase.type === 'placed'
        ? { cols: phase.gridCols, rows: phase.gridRows }
        : gridRef.current

    return (
        <>
            <div
                ref={wrapperRef}
                style={{
                    width: '100%', height: '100%',
                    display: 'flex',
                    background: canvasBg,
                    position: 'relative',
                    ...wrapperStyle,
                }}
            >
                {/* Canvas area */}
                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                    <ReactFlow
                        nodes={allNodes}
                        edges={allEdges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        nodesDraggable={nodesDraggable}
                        nodesConnectable={nodesConnectable}
                        panOnDrag={panOnDrag}
                        zoomOnScroll={zoomOnScroll}
                        fitView={fitView}
                        defaultViewport={defaultViewport}
                        proOptions={{ hideAttribution: true }}
                        style={{ background: 'transparent' }}
                        onDrop={editMode ? (e) => {
                            e.preventDefault()
                            const raw = e.dataTransfer.getData('application/flowbuilder-widget')
                            if (!raw) return
                            try {
                                JSON.parse(raw)
                                const converter = screenToFlowRef.current
                                const position = converter
                                    ? converter({ x: e.clientX, y: e.clientY })
                                    : { x: e.clientX, y: e.clientY }
                                startSizingAt(position)
                            } catch { /* ignore */ }
                        } : undefined}
                        onDragOver={editMode ? (e) => {
                            if (e.dataTransfer.types.includes('application/flowbuilder-widget')) {
                                e.preventDefault()
                                e.dataTransfer.dropEffect = 'move'
                            }
                        } : undefined}
                    >
                        <Background color={gridColor} gap={gridGap} size={1} />

                        {/* Bridge: exposes screenToFlowPosition via ref */}
                        <ScreenToFlowBridge converterRef={screenToFlowRef} />

                        {/* Zoom autosize watcher */}
                        <ZoomAutosizeWatcher
                            enabled={zoomAutosize}
                            onSizeChange={handleSizeChange}
                        />

                        {/* Settings gear — top-right */}
                        <Panel position="top-right">
                            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                <FlowBuilderSettings
                                    theme={theme}
                                    onThemeChange={handleThemeChange}
                                    mode={mode}
                                    onModeChange={setMode}
                                    zoomAutosize={zoomAutosize}
                                    onZoomAutosizeChange={setZoomAutosize}
                                    currentSize={currentSize}
                                />
                            </div>
                        </Panel>

                        {children}
                    </ReactFlow>
                </div>

                {/* Widget picker — right side */}
                {editMode && (
                    <div style={{
                        width: 260, flexShrink: 0,
                        borderLeft: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden',
                    }}>
                        <WidgetPicker
                            rectSize={{ width: 200, height: 120 }}
                            onSelect={() => {
                                startSizingAt({ x: 200, y: 200 })
                            }}
                            onCancel={() => { }}
                            embedded
                        />
                    </div>
                )}
            </div>

            <ConnectorOverlay phase={phase} currentGrid={currentGrid} />

            {/* Node buttons menu — fixed position overlay */}
            {editMode && selectedNode && (
                <ExtendedNodeButtonsMenu
                    nodeId={selectedNode.id}
                    currentLabel={String(selectedNode.data?.label || selectedNode.id)}
                    onAddBefore={(id, widgetType) => {
                        onAddBefore?.(id, widgetType)
                        setSelectedNodeId(null)
                    }}
                    onAddAfter={(id, widgetType) => {
                        if (onAddAfter) {
                            onAddAfter(id, widgetType)
                        } else {
                            // Default: start connector from the node
                            const nodeEl = document.querySelector(`[data-id="${id}"]`)
                            if (nodeEl) {
                                const rect = nodeEl.getBoundingClientRect()
                                const flowPos = screenToFlowPosition({ x: rect.right, y: rect.top + rect.height / 2 })
                                startSizingAt(flowPos, id)
                            }
                        }
                        setSelectedNodeId(null)
                    }}
                    onConfigure={(id, action) => onConfigure?.(id, action)}
                    onRename={(id, newName) => onRename?.(id, newName)}
                    onDismiss={() => setSelectedNodeId(null)}
                />
            )}
        </>
    )
}
