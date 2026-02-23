/**
 * TestBuilderPage — builder demo with connector flow.
 *
 * Click a source handle → click canvas to place → drag to size → click to confirm → pick widget.
 * Supports: Agent, Script (JS/TS/SH/PY), Group nodes.
 */

import { ReactFlow, ReactFlowProvider, Background, Panel, type Node, type Edge, applyNodeChanges, type NodeChange } from '@xyflow/react'
import { useState, useCallback, useRef } from 'react'
import { AgentNode, ScriptNode, GroupNode, PlaceholderNode } from '@/widgets/wibeglow'
import { useConnectorFlow, ConnectorFlowOverlay, anchorMouseToGridRect } from '@/engine/ConnectorFlow'
import { GRID_CELL, widgetRegistry } from '@/engine/widget-registry'
import { TimelineDots } from '@/components/TimelineDots'

// ── Node types ──
const nodeTypes = {
    agent: AgentNode,
    'script-js': ScriptNode,
    'script-ts': ScriptNode,
    'script-sh': ScriptNode,
    'script-py': ScriptNode,
    group: GroupNode,
    placeholder: PlaceholderNode,
}

const GRID_SIZE = 20

// ── Demo data ──
const initialNodes: Node[] = [
    {
        id: 'agent-1',
        type: 'agent',
        position: { x: 50, y: 80 },
        data: {
            label: 'Planner', agent: 'Claude 3.5', color: '#8b5cf6', status: 'idle',
            task: 'Implementing auth module', progress: 65, execTime: '8.1s', callsCount: 12,
            width: 200, height: 120,
        },
    },
    {
        id: 'script-1',
        type: 'script-js',
        position: { x: 320, y: 60 },
        data: {
            label: 'process.js', language: 'js', configured: true,
            code: `export function activate(ctx) {\n   console.log('Processing', ctx.node.name);\n   console.log('Step 1: validate input');\n   console.log('Step 2: transform data');\n   console.log('Done!');\n}`,
            logs: [], status: 'idle', width: 280, height: 200,
        },
    },
    {
        id: 'group-1',
        type: 'group',
        position: { x: 50, y: 280 },
        data: { label: 'Processing Pipeline', color: '#6366f1', width: 550, height: 180 },
    },
]

const initialEdges: Edge[] = [
    { id: 'e1', source: 'agent-1', target: 'script-1', animated: true, style: { stroke: '#8b5cf6', strokeWidth: 1.5 } },
]

// ── Builder Inner (needs ReactFlowProvider parent) ──

function BuilderInner() {
    const [nodes, setNodes] = useState<Node[]>(initialNodes)
    const [edges, setEdges] = useState<Edge[]>(initialEdges)
    const isDragging = useRef(false)

    // ── Grid snap ──
    const snapToGrid = useCallback((pos: { x: number; y: number }) => ({
        x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
        y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
    }), [])

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        setNodes(nds => {
            const positionChanges: NodeChange[] = []
            const otherChanges: NodeChange[] = []
            for (const change of changes) {
                if (change.type === 'position') {
                    positionChanges.push(change)
                } else {
                    otherChanges.push(change)
                }
            }
            let result = otherChanges.length > 0
                ? applyNodeChanges(otherChanges, nds)
                : [...nds]

            for (const change of positionChanges) {
                if (change.type === 'position' && change.id && change.position) {
                    const idx = result.findIndex(n => n.id === change.id)
                    if (idx >= 0) {
                        if (change.dragging) {
                            isDragging.current = true
                            result[idx] = { ...result[idx], position: change.position }
                        } else {
                            isDragging.current = false
                            result[idx] = { ...result[idx], position: snapToGrid(change.position) }
                        }
                    }
                }
            }
            return result
        })
    }, [snapToGrid])

    // ── Update node data helper ──
    const updateNodeData = useCallback((id: string, patch: Record<string, any>) => {
        setNodes(nds => nds.map(n =>
            n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
        ))
    }, [])

    // ── Placeholder resize helper ──
    const handlePlaceholderResize = useCallback((placeholderId: string, newW: number, newH: number) => {
        const snappedW = Math.max(40, Math.round(newW / GRID_CELL) * GRID_CELL)
        const snappedH = Math.max(40, Math.round(newH / GRID_CELL) * GRID_CELL)
        updateNodeData(placeholderId, {
            width: snappedW,
            height: snappedH,
            gridCols: Math.round(snappedW / GRID_CELL),
            gridRows: Math.round(snappedH / GRID_CELL),
        })
    }, [updateNodeData])

    // ── Script run callback ──
    const handleRunScript = useCallback((nodeId: string) => {
        setNodes(nds => {
            const node = nds.find(n => n.id === nodeId)
            if (!node) return nds
            const code = String(node.data?.code || '')

            updateNodeData(nodeId, { logs: ['> Running...'], status: 'running' })

            setTimeout(() => {
                const capturedLogs: string[] = ['> Running...']
                const fakeConsole = {
                    log: (...args: unknown[]) => {
                        capturedLogs.push(args.map(a =>
                            typeof a === 'object' ? JSON.stringify(a) : String(a)
                        ).join(' '))
                    },
                    error: (...args: unknown[]) => capturedLogs.push('ERROR: ' + args.map(String).join(' ')),
                }

                try {
                    const cleanCode = code.replace(/^export\s+/gm, '')
                    const fn = new Function('console', 'ctx', `
                        ${cleanCode}
                        if (typeof activate === 'function') activate(ctx);
                    `)
                    fn(fakeConsole, { node: { name: node.data?.label, id: nodeId } })
                    capturedLogs.push('> Done ✓')
                    updateNodeData(nodeId, { logs: capturedLogs, status: 'done' })
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err)
                    capturedLogs.push(`ERROR: ${msg}`)
                    updateNodeData(nodeId, { logs: capturedLogs, status: 'error' })
                }
            }, 300)

            return nds
        })
    }, [updateNodeData])

    // ── Connector Flow ──
    const connector = useConnectorFlow({
        onCreatePlaceholder: (sourceId, anchor) => {
            const placeholderId = `placeholder-${Date.now()}`
            const defaultRect = anchorMouseToGridRect(anchor, { x: anchor.x + 160, y: anchor.y })

            setNodes(nds => [...nds, {
                id: placeholderId,
                type: 'placeholder',
                position: { x: defaultRect.x, y: defaultRect.y },
                data: {
                    width: defaultRect.width,
                    height: defaultRect.height,
                    gridCols: defaultRect.cols,
                    gridRows: defaultRect.rows,
                    sizing: true,
                },
            }])

            setEdges(eds => [...eds, {
                id: `edge-${sourceId}-${placeholderId}`,
                source: sourceId,
                target: placeholderId,
                animated: true,
                style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
            }])

            return placeholderId
        },

        onResizePlaceholder: (placeholderId, rect) => {
            const gridCols = Math.round(rect.width / GRID_CELL)
            const gridRows = Math.round(rect.height / GRID_CELL)
            setNodes(nds => nds.map(n =>
                n.id === placeholderId
                    ? {
                        ...n,
                        position: { x: rect.x, y: rect.y },
                        data: { ...n.data, width: rect.width, height: rect.height, gridCols, gridRows, sizing: true },
                    }
                    : n
            ))
        },

        onSizingFinalized: (placeholderId) => {
            setNodes(nds => nds.map(n =>
                n.id === placeholderId
                    ? {
                        ...n,
                        data: {
                            ...n.data,
                            sizing: false,
                            resizable: true,
                            showSelector: true,
                            onResize: (newW: number, newH: number) => handlePlaceholderResize(placeholderId, newW, newH),
                            onSelectWidget: (widget: any, template: any) => {
                                connector.selectWidget(widget, template)
                            },
                            onCancelSelector: () => connector.cancel(),
                            onHoverWidget: (widget: any) => {
                                setNodes(ns => ns.map(nd =>
                                    nd.id === placeholderId
                                        ? { ...nd, data: { ...nd.data, hoveredWidget: widget } }
                                        : nd
                                ))
                            },
                        },
                    }
                    : n
            ))
        },

        onFinalize: (placeholderId, widgetType, template, _gridCols, _gridRows) => {
            const nodeId = `node-${Date.now()}`

            setNodes(nds => nds.map(n => {
                if (n.id !== placeholderId) return n
                const placeholderW = Number(n.data?.width) || 160
                const placeholderH = Number(n.data?.height) || 100

                const nodeData: Record<string, any> = {
                    label: template.defaultData.label || template.name,
                    ...template.defaultData,
                    width: placeholderW,
                    height: placeholderH,
                }

                // Inject script callbacks for script-* types
                if (widgetType.startsWith('script-')) {
                    nodeData.configured = false
                    nodeData.logs = []
                    nodeData.status = 'idle'
                    nodeData.onSaveScript = (code: string) => {
                        updateNodeData(nodeId, { code, configured: true })
                    }
                    nodeData.onRunScript = () => handleRunScript(nodeId)
                }

                return {
                    ...n,
                    id: nodeId,
                    type: widgetType,
                    style: { width: placeholderW, height: placeholderH },
                    data: nodeData,
                } satisfies Node
            }))

            // Update edge target
            setEdges(eds => eds.map(e =>
                e.target === placeholderId
                    ? { ...e, target: nodeId, animated: true }
                    : e
            ))

            widgetRegistry.markUsed(widgetType)
        },

        onCancel: (placeholderId) => {
            setNodes(nds => nds.filter(n => n.id !== placeholderId))
            setEdges(eds => eds.filter(e => e.target !== placeholderId))
        },
    })

    // ── Inject callbacks into existing script nodes ──
    const nodesWithCallbacks = nodes.map(n => {
        if (n.type?.startsWith('script-')) {
            return {
                ...n,
                data: {
                    ...n.data,
                    onRunScript: () => handleRunScript(n.id),
                    onSaveScript: (code: string) => updateNodeData(n.id, { code, configured: true }),
                },
            }
        }
        return n
    })

    return (
        <div
            ref={connector.attachHandleInterceptor}
            style={{
                width: '100%', height: '100%',
                background: '#0a0a14',
                position: 'relative',
            }}
        >
            <style>{`
                .react-flow__handle {
                    cursor: pointer !important;
                    transition: box-shadow 0.15s, background 0.15s !important;
                }
                .react-flow__handle:hover {
                    box-shadow: 0 0 0 3px rgba(139,92,246,0.4), 0 0 8px rgba(139,92,246,0.3);
                    background: #8b5cf6 !important;
                }
            `}</style>

            <ReactFlow
                nodes={[...nodesWithCallbacks, ...connector.previewNodes]}
                edges={[...edges, ...connector.previewEdges]}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                nodesDraggable
                defaultViewport={{ x: 80, y: 60, zoom: 0.65 }}
                proOptions={{ hideAttribution: true }}
                style={{ background: 'transparent' }}
            >
                <Background color="#1e1e3a" gap={GRID_SIZE} size={1} />

                <Panel position="top-left">
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 8,
                        padding: '12px 14px', borderRadius: 10,
                        background: 'rgba(15,15,26,0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(8px)',
                        fontFamily: 'Inter',
                    }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>
                            🔗 Builder
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5, maxWidth: 220 }}>
                            <b>Click</b> a handle (●) → click canvas to place →
                            {' '}move to size → click to confirm → pick widget.
                        </div>
                        <div style={{ fontSize: 9, color: '#475569', display: 'flex', gap: 8, marginTop: 2 }}>
                            <span>ESC / RMB = cancel</span>
                            <span>·</span>
                            <span>Grid: {GRID_CELL}px</span>
                        </div>
                    </div>
                </Panel>

                <Panel position="bottom-center">
                    <div style={{
                        padding: '4px 10px', borderRadius: 6,
                        background: 'rgba(15,15,26,0.85)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(8px)',
                        fontFamily: 'Inter', fontSize: 9,
                        color: '#64748b', display: 'flex', gap: 8, alignItems: 'center',
                    }}>
                        <span>{nodes.length} nodes</span>
                        <span>·</span>
                        <span>{edges.length} edges</span>
                        <span>·</span>
                        <span>⊞ grid snap</span>
                        {connector.phase.type !== 'idle' && (
                            <>
                                <span>·</span>
                                <span style={{ color: '#8b5cf6' }}>
                                    {connector.phase.type === 'positioning' && '🔗 positioning'}
                                    {connector.phase.type === 'sizing' && `📐 ${connector.currentGrid.cols}×${connector.currentGrid.rows}`}
                                    {connector.phase.type === 'placed' && `✅ ${connector.currentGrid.cols}×${connector.currentGrid.rows}`}
                                </span>
                            </>
                        )}
                    </div>
                </Panel>

                <Panel position="bottom-left">
                    <TimelineDots
                        nodes={nodes
                            .filter(n => n.type !== 'placeholder')
                            .map(n => ({
                                id: n.id,
                                label: (n.data as any).label || n.id,
                                status: (n.data as any).status || 'idle',
                                type: n.type,
                            }))}
                    />
                </Panel>
            </ReactFlow>

            <ConnectorFlowOverlay
                phase={connector.phase}
                currentGrid={connector.currentGrid}
            />
        </div>
    )
}

// ── Wrapper with ReactFlowProvider ──

export function TestBuilderPage() {
    return (
        <ReactFlowProvider>
            <BuilderInner />
        </ReactFlowProvider>
    )
}
