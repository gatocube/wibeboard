/**
 * TestBuilderPage — builder demo with connector flow.
 *
 * Click a source handle → click canvas to place → drag to size → click to confirm → pick widget.
 * Supports: Agent, Script (JS/TS/SH/PY), Group nodes.
 */

import { ReactFlowProvider, Panel, type Node, type Edge, applyNodeChanges, type NodeChange } from '@xyflow/react'
import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { JobNode, GroupNode, PlaceholderNode } from '@/widgets/wibeglow'
import { FlowStudio, FlowStudioStoreProvider, useFlowHistory } from '@/flow-studio'
import { FlowStudioStore } from '@/flow-studio/FlowStudioStore'
import type { PresetDefinition } from '@/engine/widget-preset-registry'
import { generateId, now } from '@/engine/core'
import { TimelineDots } from '@/components/TimelineDots'
import { getWorkflowStore, type WorkflowMeta } from '@/engine/workflow-store'

// ── Node types ──
const nodeTypes = {
    agent: JobNode,
    job: JobNode,
    'script-js': JobNode,
    'script-ts': JobNode,
    'script-sh': JobNode,
    'script-py': JobNode,
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
            label: 'process.js', language: 'js', configured: true, subType: 'script',
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
    const [editMode, setEditMode] = useState(true)

    // ── Undo / Redo ──
    const applySnapshot = useCallback((snapNodes: Node[], snapEdges: Edge[]) => {
        setNodes(snapNodes)
        setEdges(snapEdges)
    }, [])
    const { pushHistory, undo, redo, canUndo, canRedo } = useFlowHistory(applySnapshot)

    // ── Workflow persistence ──
    const [workflows, setWorkflows] = useState<WorkflowMeta[]>([])
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null)
    const [workflowName, setWorkflowName] = useState('Untitled')
    const [dirty, setDirty] = useState(false)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const skipDirty = useRef(false) // suppress dirty flag during load

    // Load workflow list on mount
    useEffect(() => {
        getWorkflowStore().then(store => store.list()).then(setWorkflows)
    }, [])

    // Mark dirty on node/edge change (unless we're loading)
    useEffect(() => {
        if (skipDirty.current) { skipDirty.current = false; return }
        if (activeWorkflowId) setDirty(true)
    }, [nodes, edges]) // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-save debounced
    useEffect(() => {
        if (!dirty || !activeWorkflowId) return
        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(async () => {
            const store = await getWorkflowStore()
            const plainNodes = nodes.filter(n => n.type !== 'placeholder').map(n => ({
                id: n.id, type: n.type || 'agent',
                position: n.position,
                data: { ...n.data, onRunScript: undefined, onSaveScript: undefined, onResize: undefined, onSelectWidget: undefined, onCancelSelector: undefined, onHoverWidget: undefined },
                width: n.width, height: n.height,
            }))
            const plainEdges = edges.map(e => ({
                id: e.id, source: e.source, target: e.target,
                animated: e.animated, style: e.style as Record<string, unknown> | undefined,
            }))
            await store.save({
                id: activeWorkflowId, name: workflowName,
                nodes: plainNodes as any, edges: plainEdges as any,
                createdAt: now(), updatedAt: now(),
            })
            setDirty(false)
            // Refresh list to update node counts
            setWorkflows(await store.list())
        }, 1500)
        return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
    }, [dirty, activeWorkflowId, nodes, edges, workflowName])

    const handleNewWorkflow = useCallback(async () => {
        const name = prompt('Workflow name:', `Workflow ${workflows.length + 1}`)
        if (!name) return
        const store = await getWorkflowStore()
        const doc = await store.create(name)
        skipDirty.current = true
        setNodes([])
        setEdges([])
        setActiveWorkflowId(doc.id)
        setWorkflowName(doc.name)
        setDirty(false)
        setWorkflows(await store.list())
    }, [workflows.length])

    const handleLoadWorkflow = useCallback(async (id: string) => {
        const store = await getWorkflowStore()
        const doc = await store.load(id)
        if (!doc) return
        skipDirty.current = true
        const loaded: Node[] = doc.nodes.map(n => ({
            id: n.id, type: n.type, position: n.position,
            data: { ...n.data, width: n.width || (n.data as any).width, height: n.height || (n.data as any).height },
            width: n.width, height: n.height,
        }))
        const loadedEdges: Edge[] = doc.edges.map(e => ({
            id: e.id, source: e.source, target: e.target,
            animated: e.animated, style: e.style as any,
        }))
        setNodes(loaded)
        setEdges(loadedEdges)
        setActiveWorkflowId(doc.id)
        setWorkflowName(doc.name)
        setDirty(false)
    }, [])

    const handleDeleteWorkflow = useCallback(async () => {
        if (!activeWorkflowId) return
        if (!confirm(`Delete "${workflowName}"?`)) return
        const store = await getWorkflowStore()
        await store.delete(activeWorkflowId)
        skipDirty.current = true
        setNodes(initialNodes)
        setEdges(initialEdges)
        setActiveWorkflowId(null)
        setWorkflowName('Untitled')
        setDirty(false)
        setWorkflows(await store.list())
    }, [activeWorkflowId, workflowName])

    const handleSaveNow = useCallback(async () => {
        if (!activeWorkflowId) {
            // Create a new workflow to save into
            await handleNewWorkflow()
            return
        }
        // Clear debounce and save immediately
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setDirty(true) // triggers the auto-save effect
    }, [activeWorkflowId, handleNewWorkflow])

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
                            // Push history on drag end
                            setTimeout(() => pushHistory(result, edges), 0)
                        }
                    }
                }
            }
            return result
        })
    }, [snapToGrid, pushHistory, edges])

    // ── Update node data helper ──
    const updateNodeData = useCallback((id: string, patch: Record<string, any>) => {
        setNodes(nds => nds.map(n =>
            n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
        ))
    }, [])

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

    // ── Node created via FlowStudio connector ──
    const handleNodeCreated = useCallback((nodeId: string, widgetType: string, template: PresetDefinition, rect: { x: number; y: number; width: number; height: number }, sourceNodeId: string | null) => {
        const nodeData: Record<string, any> = {
            label: template.defaultData.label || template.label,
            ...template.defaultData,
            width: rect.width,
            height: rect.height,
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

        setNodes(nds => [...nds, {
            id: nodeId,
            type: widgetType,
            position: { x: rect.x, y: rect.y },
            data: nodeData,
            style: { width: rect.width, height: rect.height },
        }])

        if (sourceNodeId) {
            setEdges(eds => [...eds, {
                id: `edge-${sourceNodeId}-${nodeId}`,
                source: sourceNodeId,
                target: nodeId,
                animated: true,
                style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
            }])
        }
    }, [updateNodeData, handleRunScript])

    // ── Inject callbacks into existing script nodes (memoized to avoid blinking) ──
    const nodesWithCallbacks = useMemo(() => nodes.map(n => {
        const base = { ...n, data: { ...n.data, editMode } }
        if (n.type?.startsWith('script-')) {
            return {
                ...base,
                data: {
                    ...base.data,
                    onRunScript: () => handleRunScript(n.id),
                    onSaveScript: (code: string) => updateNodeData(n.id, { code, configured: true }),
                },
            }
        }
        return base
    }), [nodes, editMode, handleRunScript, updateNodeData])

    return (
        <FlowStudio
            nodes={nodesWithCallbacks}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            nodesDraggable
            defaultViewport={{ x: 80, y: 60, zoom: 0.65 }}
            gridGap={GRID_SIZE}
            editMode={editMode}
            onNodeCreated={handleNodeCreated}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onAddBefore={(nodeId) => {
                // Insert a new node between the incoming source and this node
                const incomingEdge = edges.find(e => e.target === nodeId)
                const sourceId = incomingEdge?.source || null

                const targetNode = nodes.find(n => n.id === nodeId)
                if (!targetNode) return

                // Position the new node between source and target
                const sourceNode = sourceId ? nodes.find(n => n.id === sourceId) : null
                const newX = sourceNode
                    ? (sourceNode.position.x + targetNode.position.x) / 2
                    : targetNode.position.x - 200
                const newY = targetNode.position.y

                const newNodeId = generateId('node')
                setNodes(nds => [...nds, {
                    id: newNodeId,
                    type: 'placeholder',
                    position: { x: newX, y: newY },
                    data: {
                        width: 160, height: 100,
                        gridCols: 4, gridRows: 2,
                        sizing: false, showSelector: true,
                    },
                }])

                // Rewire: sourceId → newNode → nodeId
                setEdges(eds => {
                    const updated = sourceId
                        ? eds.map(e => e.target === nodeId && e.source === sourceId
                            ? { ...e, target: newNodeId }
                            : e)
                        : eds
                    return [...updated, {
                        id: `edge-${newNodeId}-${nodeId}`,
                        source: newNodeId,
                        target: nodeId,
                        animated: true,
                        style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
                    }]
                })
            }}
            onAddAfter={(nodeId, widgetType) => {
                const sourceNode = nodes.find(n => n.id === nodeId)
                if (!sourceNode) return

                let nodeType = 'agent'
                let subType = 'ai'
                let label = 'Agent'
                let language = 'js'

                if (widgetType.startsWith('script:')) {
                    language = widgetType.split(':')[1] || 'js'
                    nodeType = `script-${language}`
                    subType = 'script'
                    label = `script.${language}`
                } else if (widgetType === 'user') {
                    nodeType = 'job'
                    subType = 'user'
                    label = 'User'
                }

                const newNodeId = generateId('node')
                const newX = sourceNode.position.x + (sourceNode.width || 200) + 100
                const newY = sourceNode.position.y

                const newNodeData: Record<string, any> = {
                    label, subType,
                    width: subType === 'script' ? 280 : 200,
                    height: subType === 'script' ? 200 : 120,
                }

                if (subType === 'script') {
                    newNodeData.language = language
                    newNodeData.configured = false
                    newNodeData.logs = []
                    newNodeData.status = 'idle'
                    newNodeData.onSaveScript = (code: string) => updateNodeData(newNodeId, { code, configured: true })
                    newNodeData.onRunScript = () => handleRunScript(newNodeId)
                } else if (subType === 'ai') {
                    newNodeData.color = '#8b5cf6'
                    newNodeData.agent = 'Claude 3.5'
                }

                setNodes(nds => [...nds, {
                    id: newNodeId,
                    type: nodeType,
                    position: { x: newX, y: newY },
                    data: newNodeData,
                    style: { width: newNodeData.width, height: newNodeData.height },
                }])

                setEdges(eds => [...eds, {
                    id: `edge-${nodeId}-${newNodeId}`,
                    source: nodeId,
                    target: newNodeId,
                    animated: true,
                    style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
                }])
            }}
            onRename={(nodeId, newName) => {
                updateNodeData(nodeId, { label: newName })
            }}
            onConfigure={(nodeId, action) => {
                if (action === 'delete') {
                    setNodes(nds => nds.filter(n => n.id !== nodeId))
                    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
                } else {
                    console.log('Configure node:', nodeId)
                }
            }}
            onSizeChange={(size) => {
                const presets: Record<string, { w: number; h: number }> = {
                    S: { w: 50, h: 50 }, M: { w: 160, h: 100 }, L: { w: 300, h: 200 },
                }
                const { w, h } = presets[size]
                setNodes(prev => prev.map(n => ({
                    ...n,
                    data: { ...n.data, width: w, height: h },
                })))
            }}
        >
            {/* ── Workflow selector ── */}
            <Panel position="top-center">
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 10px', borderRadius: 8,
                    background: 'rgba(15,15,26,0.92)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                    fontFamily: 'Inter',
                }}>
                    <select
                        data-testid="workflow-select"
                        value={activeWorkflowId || ''}
                        onChange={e => { if (e.target.value) handleLoadWorkflow(e.target.value) }}
                        style={{
                            background: 'rgba(30,30,58,0.8)', color: '#c084fc',
                            border: '1px solid rgba(139,92,246,0.2)',
                            borderRadius: 5, padding: '3px 8px', fontSize: 10,
                            fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'Inter',
                        }}
                    >
                        <option value="" disabled>Select workflow…</option>
                        {workflows.map((w: WorkflowMeta) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleNewWorkflow}
                        style={{
                            background: 'transparent', color: '#64748b',
                            border: '1px solid transparent',
                            borderRadius: 5, padding: '3px 8px', fontSize: 10,
                            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                        }}
                    >＋ New</button>
                    <button
                        data-testid="workflow-save"
                        onClick={handleSaveNow}
                        style={{
                            background: dirty ? 'rgba(245,158,11,0.15)' : 'transparent',
                            color: dirty ? '#f59e0b' : '#64748b',
                            border: dirty ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                            borderRadius: 5, padding: '3px 8px', fontSize: 10,
                            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                        }}
                    >{dirty ? '● Save' : 'Saved'}</button>
                    {activeWorkflowId && (
                        <button
                            onClick={handleDeleteWorkflow}
                            style={{
                                background: 'transparent', color: '#ef4444',
                                border: '1px solid transparent',
                                borderRadius: 5, padding: '3px 8px', fontSize: 10,
                                fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                            }}
                        >🗑</button>
                    )}
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', height: 16 }} />
                    <button
                        data-testid="edit-mode-toggle"
                        onClick={() => setEditMode(m => !m)}
                        style={{
                            background: editMode ? 'rgba(139,92,246,0.15)' : 'transparent',
                            color: editMode ? '#c084fc' : '#64748b',
                            border: editMode ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                            borderRadius: 5, padding: '3px 8px', fontSize: 10,
                            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter',
                        }}
                    >{editMode ? '✏️ Edit' : '👁 View'}</button>
                    {activeWorkflowId && (
                        <span style={{ fontSize: 8, color: '#475569', fontFamily: 'Inter' }}>
                            {workflowName}
                        </span>
                    )}
                </div>
            </Panel>


            {/* ── JSON debug panel (bottom-right) ── */}
            <Panel position="bottom-right">
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: 4,
                    maxWidth: 320,
                }}>
                    <pre style={{
                        background: 'rgba(15,15,26,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: '6px 10px',
                        color: '#475569', fontSize: 8,
                        fontFamily: "'JetBrains Mono', monospace",
                        margin: 0, maxHeight: 140, overflow: 'auto',
                    }}>
                        {nodes.length} nodes • {edges.length} edges
                    </pre>
                </div>
            </Panel>

            {/* Timeline dots */}
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
        </FlowStudio>
    )
}

// ── Wrapper with ReactFlowProvider ──

const studioStore = new FlowStudioStore()

export function TestBuilderPage() {
    return (
        <FlowStudioStoreProvider store={studioStore}>
            <ReactFlowProvider>
                <BuilderInner />
            </ReactFlowProvider>
        </FlowStudioStoreProvider>
    )
}
