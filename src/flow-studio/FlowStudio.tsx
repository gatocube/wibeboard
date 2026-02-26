/**
 * FlowStudio — self-contained ReactFlow wrapper.
 *
 * Node creation happens in two ways:
 *  1. Drag from the WidgetPicker sidebar → creates node at drop position
 *  2. SwipeButtons "+Before / +After" → consumer handles via callbacks
 *
 * Features:
 *  - ReactFlow shell with background, settings panel, zoom-autosize
 *  - WidgetPicker sidebar (editMode)
 *  - Drag-and-drop from WidgetPicker sidebar
 *  - SwipeButtons radial menu for node actions
 */

import {
    ReactFlow, Background, Panel, Controls, MiniMap,
    useReactFlow,
} from '@xyflow/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { GRID_CELL, MIN_NODE_SIZE, widgetRegistry } from '@/engine/widget-registry'
import { type PresetDefinition } from '@/engine/preset-registry'
import { generateId } from '@/engine/core'

import type { FlowStudioProps, ThemeKey, NodeSize } from './types'
import { useFlowStudioStore } from './FlowStudioStore'
import { StudioSettings } from './StudioSettings'
import { ZoomAutosizeWatcher, ScreenToFlowBridge } from './ZoomAutosize'
import { WidgetPicker } from './WidgetPicker'
import { SwipeButtons } from '@/kit/SwipeButtons'
import { resolveCollisions, findNonOverlappingPosition } from './resolve-collisions'
import { ThreeFiberRenderer } from './renderers/ThreeFiberRenderer'
import { AsciiFlowRenderer } from './renderers/AsciiRenderer'
import { MermaidRenderer } from './renderers/MermaidRenderer'
import { MobileRenderer } from './renderers/MobileRenderer'

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

// ── FlowStudio (needs ReactFlowProvider parent) ────────────────────────────────

export const FlowStudio = observer(function FlowStudio({
    nodes,
    edges,
    nodeTypes,
    children,
    onNodesChange,
    defaultViewport,
    nodesDraggable = false,
    nodesConnectable = false,
    panOnDrag = true,
    zoomOnScroll = true,
    fitView = false,
    onSizeChange,
    currentTheme = 'wibeglow',
    onThemeChange,
    wrapperStyle,
    bgColor,
    gridGap = 20,
    editMode: editModeProp = false,
    onNodeCreated,
    onAddBefore,
    onAddAfter,
    onConfigure,
    onRename,
    hideBeforeButton,
    sidebarContent,
}: FlowStudioProps) {
    useReactFlow() // ensure we're inside ReactFlowProvider
    const store = useFlowStudioStore()

    // ── Edit mode (internal, seeded from prop) ──────────────────────────────────
    const [editMode, setEditMode] = useState(editModeProp)

    // ── Visual state (from MobX store) ──────────────────────────────────────────
    // Sync initial theme from props into store on first render
    useEffect(() => {
        if (currentTheme !== store.theme) store.setTheme(currentTheme)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleThemeChange = (t: ThemeKey) => {
        store.setTheme(t)
        onThemeChange?.(t)
    }
    const handleSizeChange = (s: NodeSize) => {
        store.setCurrentSize(s)
        onSizeChange?.(s)
    }

    const canvasBg = bgColor || THEME_CANVAS[store.theme]
    const gridColor = THEME_BG[store.theme]

    // ── Screen→Flow bridge ref ──────────────────────────────────────────────────
    const screenToFlowRef = useRef<((pos: { x: number; y: number }) => { x: number; y: number }) | null>(null)

    // ── Node buttons menu state (from MobX store) ────────────────────────────────
    // Dismiss menu when leaving edit mode
    useEffect(() => {
        if (!editMode) store.clearSelectedNode()
    }, [editMode, store])

    // Find selected node data for the menu
    const selectedNode = store.selectedNodeId ? nodes.find(n => n.id === store.selectedNodeId) : null

    // ── Node click + long-press detection ────────────────────────────────────────
    const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pressedNodeRef = useRef<{ id: string; el: HTMLElement } | null>(null)
    const didLongPressRef = useRef(false)
    const wrapperElRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const el = wrapperElRef.current
        if (!el) return

        const clearLongPress = () => {
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current)
                longPressTimerRef.current = null
            }
            // Restore node visual
            if (pressedNodeRef.current) {
                pressedNodeRef.current.el.style.transition = 'filter 0.2s ease-out'
                pressedNodeRef.current.el.style.filter = ''
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
            if (target.closest('.react-flow__handle')) return

            didLongPressRef.current = false
            pressedNodeRef.current = { id: nodeId, el: nodeEl }

            // Animate press-down effect (use filter to avoid clobbering React Flow's transform)
            nodeEl.style.transition = 'filter 0.15s ease-out'
            nodeEl.style.filter = 'brightness(0.85)'

            // Start long-press timer
            longPressTimerRef.current = setTimeout(() => {
                didLongPressRef.current = true
                store.toggleSelectedNode(nodeId)
                // Release effect
                nodeEl.style.transition = 'filter 0.2s ease-out'
                nodeEl.style.filter = ''
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
                if (target.closest('.react-flow__handle')) return
                store.toggleSelectedNode(nodeId)
                return
            }

            // Click on pane = dismiss menu
            if (target.closest('.react-flow__pane') || target.closest('.react-flow__renderer')) {
                store.clearSelectedNode()
            }
        }

        // Cancel long-press on drag or pointer leave
        const onPointerMove = () => {
            if (!pressedNodeRef.current) return
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

    // ── Stable ref for onNodeCreated callback ───────────────────────────────────
    const onNodeCreatedRef = useRef(onNodeCreated)
    onNodeCreatedRef.current = onNodeCreated

    // ── Direct node creation from widget data ───────────────────────────────────
    const createNodeFromWidget = useCallback((
        widgetType: string,
        template: PresetDefinition,
        position: { x: number; y: number },
        sourceNodeId: string | null = null,
    ) => {
        const defaultW = MIN_NODE_SIZE * 4 * GRID_CELL
        const defaultH = MIN_NODE_SIZE * 2 * GRID_CELL

        // Auto-space: find a non-overlapping position (3 grid units from nearest)
        const safePos = findNonOverlappingPosition(nodes, defaultW, defaultH, position)

        const rect = { x: safePos.x, y: safePos.y, width: defaultW, height: defaultH }
        const nodeId = generateId('node')

        onNodeCreatedRef.current?.(nodeId, widgetType, template, rect, sourceNodeId)
        widgetRegistry.markUsed(widgetType)
    }, [nodes])

    // ── Collision resolution on drag stop ────────────────────────────────────────
    const handleNodeDragStop = useCallback((_event: React.MouseEvent, draggedNode: { id: string }) => {
        if (!onNodesChange) return
        const resolved = resolveCollisions(nodes, { anchorId: draggedNode.id })

        // Dispatch position changes for any node that moved
        const changes = resolved
            .filter((n, i) =>
                n.position.x !== nodes[i].position.x ||
                n.position.y !== nodes[i].position.y
            )
            .map(n => ({
                type: 'position' as const,
                id: n.id,
                position: n.position,
            }))

        if (changes.length > 0) {
            onNodesChange(changes)
        }
    }, [nodes, onNodesChange])

    // ── Sidebar widget pick handler ─────────────────────────────────────────────
    const handleSidebarSelect = useCallback((_widget: { type: string }, template: PresetDefinition) => {
        // Place at center of current viewport
        const converter = screenToFlowRef.current
        const center = converter
            ? converter({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
            : { x: 200, y: 200 }
        createNodeFromWidget(_widget.type, template, center)
    }, [createNodeFromWidget])

    // ── Wrapper ref callback ────────────────────────────────────────────────────
    const wrapperRef = useCallback((el: HTMLDivElement | null) => {
        wrapperElRef.current = el
    }, [])

    return (
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
                {store.renderer === 'three-fiber' ? (
                    <ThreeFiberRenderer nodes={nodes} edges={edges} />
                ) : store.renderer === 'ascii' ? (
                    <AsciiFlowRenderer nodes={nodes} edges={edges} />
                ) : store.renderer === 'mermaid' ? (
                    <MermaidRenderer nodes={nodes} edges={edges} />
                ) : store.renderer === 'mobile' ? (
                    <MobileRenderer nodes={nodes} edges={edges} />
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onNodeDragStop={editMode ? handleNodeDragStop : undefined}
                        nodesDraggable={nodesDraggable || editMode}
                        nodesConnectable={nodesConnectable}
                        panOnDrag={panOnDrag}
                        zoomOnScroll={zoomOnScroll}
                        fitView={fitView}
                        defaultViewport={defaultViewport}
                        proOptions={{ hideAttribution: true }}
                        style={{ background: 'transparent' }}
                        onDrop={editMode ? (e) => {
                            e.preventDefault()
                            const raw = e.dataTransfer.getData('application/flowstudio-widget')
                            if (!raw) return
                            try {
                                const { type, template } = JSON.parse(raw)
                                const converter = screenToFlowRef.current
                                const position = converter
                                    ? converter({ x: e.clientX, y: e.clientY })
                                    : { x: e.clientX, y: e.clientY }
                                createNodeFromWidget(type, template, position)
                            } catch { /* ignore */ }
                        } : undefined}
                        onDragOver={editMode ? (e) => {
                            if (e.dataTransfer.types.includes('application/flowstudio-widget')) {
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
                            enabled={store.zoomAutosize}
                            onSizeChange={handleSizeChange}
                        />

                        {/* React Flow Built-in Controls (Zoom/Lock) */}
                        <Controls position="bottom-left" style={{ margin: 16 }} />

                        {/* Conditional Minimap */}
                        {store.showMinimap && (
                            <MiniMap
                                position="bottom-right"
                                style={{
                                    background: 'rgba(15,15,26,0.9)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                    margin: 16
                                }}
                                nodeColor="rgba(139,92,246,0.5)"
                                maskColor="rgba(0,0,0,0.5)"
                            />
                        )}

                        {/* Settings gear + edit toggle — top-right */}
                        <Panel position="top-right">
                            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                <button
                                    data-testid="edit-mode-toggle"
                                    onClick={() => setEditMode(m => !m)}
                                    style={{
                                        padding: '4px 10px', borderRadius: 6,
                                        border: editMode ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                                        background: editMode ? 'rgba(139,92,246,0.15)' : 'rgba(15,15,26,0.8)',
                                        color: editMode ? '#c084fc' : '#64748b',
                                        fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                                        cursor: 'pointer', backdropFilter: 'blur(8px)',
                                    }}
                                >
                                    {editMode ? '✏️ Edit' : '👁 View'}
                                </button>
                                <StudioSettings
                                    onThemeChange={handleThemeChange}
                                />
                            </div>
                        </Panel>

                        {children}
                    </ReactFlow>
                )}
            </div>

            {/* Sidebar — right side */}
            {editMode && (
                <div style={{
                    width: 260, flexShrink: 0,
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    {sidebarContent || (
                        <WidgetPicker
                            rectSize={{ width: 200, height: 120 }}
                            onSelect={handleSidebarSelect}
                            onCancel={() => { }}
                            embedded
                        />
                    )}
                </div>
            )}

            {/* Node buttons menu — fixed position overlay */}
            {editMode && selectedNode && (
                <SwipeButtons
                    nodeId={selectedNode.id}
                    currentLabel={String(selectedNode.data?.label || selectedNode.id)}
                    activationMode={store.controlMode}
                    directions={hideBeforeButton?.(selectedNode.id) ? ['top', 'right', 'bottom', 'bottom-right'] : undefined}
                    onAddBefore={(id, widgetType) => {
                        onAddBefore?.(id, widgetType)
                        store.clearSelectedNode()
                    }}
                    onAddAfter={(id, widgetType) => {
                        onAddAfter?.(id, widgetType)
                        store.clearSelectedNode()
                    }}
                    onConfigure={(id, action) => {
                        onConfigure?.(id, action)
                        if (action === 'delete') {
                            store.clearSelectedNode()
                        }
                    }}
                    onRename={(id, newName) => onRename?.(id, newName)}
                    onDismiss={() => store.clearSelectedNode()}
                />
            )}
        </div>
    )
})
