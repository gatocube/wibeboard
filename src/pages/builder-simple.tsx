/**
 * BuilderSimplePage — minimal flow builder with workflow selector.
 *
 * Shows a workflow selector bar at the top and a React Flow canvas.
 * Supports multiple workflows persisted to localStorage.
 * Start node is positioned on the left so new nodes grow to the right.
 *
 * Optimized for iPad:
 *  - 44px touch targets on selector bar
 *  - Default zoom 0.85 for landscape fit
 *  - fitView padding 0.3 for breathing room
 *
 * Supports:
 *  - Add After / Add Before via SwipeButtons
 *  - Delete via Config → Delete
 *  - Undo / Redo via Cmd+Z / Cmd+Shift+Z and on-screen buttons
 */

import { ReactFlowProvider, useReactFlow, type Node, type Edge, applyNodeChanges, type NodeChange } from '@xyflow/react'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { StartingNode, JobNode, UserNode, SubFlowNode } from '@/widgets/wibeglow'
import { FlowStudio, FlowStudioStoreProvider } from '@/flow-studio'
import { widgetRegistry } from '@/engine/widget-registry'
import { FlowStudioApi } from '@/engine/FlowStudioApi'
import { AgentMessenger } from '@/engine/AgentMessenger'
import { runScriptInBrowser } from '@/engine/script-runner'
import { EventsPanel, type FlowEvent } from '@/flow-studio/EventsPanel'
import { NodeSettingsPanel } from '@/kit/NodeSettingsPanel'
import '@xyflow/react/dist/style.css'

// ── Node types ──
const nodeTypes = {
    starting: StartingNode,
    job: JobNode,
    user: UserNode,
    subflow: SubFlowNode,
}

// ── iPad-friendly constants ──
const DEFAULT_ZOOM = 0.85
const FIT_VIEW_PADDING = 0.3

// ── Workflow data model ──
interface Workflow {
    id: string
    name: string
    nodes: Node[]
    edges: Edge[]
}

function createWorkflow(name: string): Workflow {
    return {
        id: `wf-${Date.now()}`,
        name,
        nodes: [api.createStartNode()],
        edges: [],
    }
}

// ── Persistence ──
const STORAGE_KEY = 'flowstudio_workflows'
const ACTIVE_KEY = 'flowstudio_active_workflow'

function loadWorkflows(): { workflows: Workflow[]; activeId: string } {
    // Persistence disabled — clear any stale data and start fresh
    try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(ACTIVE_KEY)
    } catch (e) { /* ignore */ }
    const wf = createWorkflow('Workflow 1')
    return { workflows: [wf], activeId: wf.id }
}


const api = new FlowStudioApi()

// ── Resolve widgetType string to { type, data } ──
function resolveWidgetType(widgetType: string): { nodeType: string; data: Record<string, any> } {
    if (widgetType === 'user') {
        const def = widgetRegistry.get('user')
        const tpl = def?.templates[0]
        return {
            nodeType: 'user',
            data: {
                ...tpl?.defaultData,
                label: tpl?.defaultData.label || 'User',
                width: def?.defaultWidth || 160,
                height: def?.defaultHeight || 100,
            },
        }
    }
    if (widgetType === 'subflow') {
        const def = widgetRegistry.get('subflow')
        const tpl = def?.templates[0]
        return {
            nodeType: 'subflow',
            data: {
                ...tpl?.defaultData,
                label: tpl?.defaultData.label || 'SubFlow',
                width: def?.defaultWidth || 200,
                height: def?.defaultHeight || 120,
            },
        }
    }
    if (widgetType.startsWith('script:') || widgetType.startsWith('ai:')) {
        const [prefix, variant] = widgetType.split(':')
        const def = widgetRegistry.get('job')
        const subType = prefix === 'ai' ? 'ai' : variant
        const tpl = def?.templates.find(t => t.defaultData.subType === subType) || def?.templates[0]
        const label = tpl?.defaultData.label || `${variant} Script`
        return {
            nodeType: 'job',
            data: {
                ...tpl?.defaultData,
                subType,
                label,
                width: def?.defaultWidth || 200,
                height: def?.defaultHeight || 120,
                configured: true,
                sandbox: 'browser',
                code: `// ${label}\nmessenger.send('system', 'text', 'Hello from ${label}')`,
            },
        }
    }
    // Fallback: treat as job with default JS script
    const def = widgetRegistry.get('job')
    const tpl = def?.templates.find(t => t.defaultData.subType === 'js') || def?.templates[0]
    const label = tpl?.defaultData.label || 'Script'
    return {
        nodeType: 'job',
        data: {
            ...tpl?.defaultData,
            label,
            width: def?.defaultWidth || 200,
            height: def?.defaultHeight || 120,
            configured: true,
            sandbox: 'browser',
            code: `// ${label}\nmessenger.send('system', 'text', 'Hello from ${label}')`,
        },
    }
}

// ── History entry for undo / redo ──
interface HistoryEntry { nodes: Node[]; edges: Edge[] }

// ── Page wrapper (provides context) ──
export default function BuilderSimplePage() {
    return (
        <FlowStudioStoreProvider store={api.state}>
            <ReactFlowProvider>
                <BuilderSimpleInner />
            </ReactFlowProvider>
        </FlowStudioStoreProvider>
    )
}

// ── Inner component (uses hooks that need ReactFlowProvider) ──
function BuilderSimpleInner() {
    const { workflows: loadedWorkflows, activeId: loadedActiveId } = loadWorkflows()
    const [workflows, setWorkflows] = useState<Workflow[]>(loadedWorkflows)
    const [activeId, setActiveId] = useState<string>(loadedActiveId)
    const [events, setEvents] = useState<FlowEvent[]>([])
    const messengersRef = useRef<Map<string, AgentMessenger>>(new Map())
    const [settingsNodeId, setSettingsNodeId] = useState<string | null>(null)

    const active = workflows.find(w => w.id === activeId) || workflows[0]
    const nodes = active?.nodes || []
    const edges = active?.edges || []

    // ── Undo / Redo ──
    const historyRef = useRef<HistoryEntry[]>([{ nodes, edges }])
    const historyIndexRef = useRef(0)
    const skipPushRef = useRef(false)
    const { fitView } = useReactFlow()
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    const updateUndoRedoState = useCallback(() => {
        setCanUndo(historyIndexRef.current > 0)
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }, [])

    // ── Auto-fit when node count changes or workflow switches ──
    const prevCountRef = useRef(nodes.length)
    useEffect(() => {
        if (nodes.length !== prevCountRef.current) {
            prevCountRef.current = nodes.length
            const t = setTimeout(() => fitView({ padding: FIT_VIEW_PADDING, maxZoom: DEFAULT_ZOOM }), 100)
            return () => clearTimeout(t)
        }
    }, [nodes.length, fitView])

    // ── Persist workflows to localStorage (disabled for now) ──
    // useEffect(() => {
    //     saveWorkflows(workflows, activeId)
    // }, [workflows, activeId])

    // ── Reset history when switching workflows ──
    const prevActiveIdRef = useRef(activeId)
    useEffect(() => {
        if (activeId !== prevActiveIdRef.current) {
            prevActiveIdRef.current = activeId
            const wf = workflows.find(w => w.id === activeId)
            if (wf) {
                historyRef.current = [{ nodes: wf.nodes, edges: wf.edges }]
                historyIndexRef.current = 0
                updateUndoRedoState()
                // Center viewport on the new workflow's nodes
                setTimeout(() => fitView({ padding: FIT_VIEW_PADDING, maxZoom: DEFAULT_ZOOM }), 100)
            }
        }
    }, [activeId, workflows, updateUndoRedoState, fitView])

    const updateWorkflow = useCallback((updatedNodes: Node[], updatedEdges: Edge[]) => {
        setWorkflows(prev => prev.map(w =>
            w.id === activeId ? { ...w, nodes: updatedNodes, edges: updatedEdges } : w
        ))
    }, [activeId])

    const pushHistory = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
        if (skipPushRef.current) { skipPushRef.current = false; return }
        const idx = historyIndexRef.current
        historyRef.current = historyRef.current.slice(0, idx + 1)
        historyRef.current.push({ nodes: nextNodes, edges: nextEdges })
        historyIndexRef.current = historyRef.current.length - 1
        updateUndoRedoState()
    }, [updateUndoRedoState])

    const undo = useCallback(() => {
        const idx = historyIndexRef.current
        if (idx <= 0) return
        historyIndexRef.current = idx - 1
        const entry = historyRef.current[idx - 1]
        skipPushRef.current = true
        updateWorkflow(entry.nodes, entry.edges)
        updateUndoRedoState()
    }, [updateWorkflow, updateUndoRedoState])

    const redo = useCallback(() => {
        const idx = historyIndexRef.current
        if (idx >= historyRef.current.length - 1) return
        historyIndexRef.current = idx + 1
        const entry = historyRef.current[idx + 1]
        skipPushRef.current = true
        updateWorkflow(entry.nodes, entry.edges)
        updateUndoRedoState()
    }, [updateWorkflow, updateUndoRedoState])

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault()
                if (e.shiftKey) redo()
                else undo()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [undo, redo])

    // ── Use refs for synced mutations ──
    const nodesRef = useRef(nodes)
    const edgesRef = useRef(edges)
    nodesRef.current = nodes
    edgesRef.current = edges

    const mutateState = useCallback((
        fn: (nodes: Node[], edges: Edge[]) => { nodes: Node[]; edges: Edge[] },
    ) => {
        const result = fn(nodesRef.current, edgesRef.current)
        updateWorkflow(result.nodes, result.edges)
        pushHistory(result.nodes, result.edges)
    }, [pushHistory, updateWorkflow])

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            const wf = workflows.find(w => w.id === activeId)
            if (!wf) return
            const updated = applyNodeChanges(changes, wf.nodes)
            setWorkflows(prev => prev.map(w =>
                w.id === activeId ? { ...w, nodes: updated } : w
            ))
        },
        [workflows, activeId],
    )

    const memoNodeTypes = useMemo(() => nodeTypes, [])

    // ── Add After handler ──
    const handleAddAfter = useCallback((sourceNodeId: string, widgetType: string) => {
        const { nodeType, data } = resolveWidgetType(widgetType)
        const newNodeId = `node-${Date.now()}`
        const sourceNode = nodesRef.current.find(n => n.id === sourceNodeId)
        const position = sourceNode
            ? api.positionAfter(sourceNode, nodeType, data)
            : { x: 460, y: 0 }

        mutateState((prevNodes, prevEdges) => ({
            nodes: [...prevNodes, {
                id: newNodeId,
                type: nodeType,
                position,
                data,
            }],
            edges: [...prevEdges, api.makeEdge(sourceNodeId, newNodeId)],
        }))
    }, [mutateState])

    // ── Add Before handler ──
    const handleAddBefore = useCallback((targetNodeId: string, widgetType: string) => {
        const { nodeType, data } = resolveWidgetType(widgetType)
        const newNodeId = `node-${Date.now()}`

        mutateState((prevNodes, prevEdges) => {
            const targetNode = prevNodes.find(n => n.id === targetNodeId)
            const incomingEdge = prevEdges.find(e => e.target === targetNodeId)
            const sourceId = incomingEdge?.source || null
            const sourceNode = sourceId ? prevNodes.find(n => n.id === sourceId) : null

            const position = targetNode
                ? api.positionBefore(targetNode, sourceNode ?? null, nodeType, data)
                : { x: 0, y: 0 }

            const newNodes = [...prevNodes, {
                id: newNodeId,
                type: nodeType,
                position,
                data,
            }]

            let newEdges = prevEdges
            if (sourceId && incomingEdge) {
                newEdges = prevEdges.map(e =>
                    e.id === incomingEdge.id
                        ? { ...e, target: newNodeId }
                        : e
                )
            }
            newEdges = [...newEdges, api.makeEdge(newNodeId, targetNodeId)]

            return { nodes: newNodes, edges: newEdges }
        })
    }, [mutateState])

    // ── Configure handler ──
    const handleConfigure = useCallback((nodeId: string, action: string) => {
        if (action === 'delete') {
            mutateState((prevNodes, prevEdges) =>
                api.deleteWithReconnect(nodeId, prevNodes, prevEdges)
            )
        } else if (action === 'settings') {
            setSettingsNodeId(nodeId)
        }
    }, [mutateState])

    // ── Script execution ──
    const getMessenger = useCallback((nodeId: string): AgentMessenger => {
        let m = messengersRef.current.get(nodeId)
        if (!m) {
            m = new AgentMessenger(nodeId)
            messengersRef.current.set(nodeId, m)
        }
        return m
    }, [])

    const handleRunScript = useCallback((nodeId: string) => {
        const node = nodesRef.current.find(n => n.id === nodeId)
        if (!node) return
        const code = String(node.data?.code || '')
        const nodeName = String(node.data?.label || nodeId)
        const messenger = getMessenger(nodeId)

        // Listen for messages sent during execution
        const unsub = messenger.onMessage((msg) => {
            setEvents(prev => [...prev, {
                id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                timestamp: msg.timestamp,
                nodeId,
                nodeName,
                type: 'message',
                content: String(msg.payload ?? ''),
            }])
        })

        // Update status to running
        mutateState((prevNodes, prevEdges) => ({
            nodes: prevNodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, status: 'running', logs: ['> Running...'] } } : n
            ),
            edges: prevEdges,
        }))

        // Execute after a brief delay to show running state
        setTimeout(() => {
            const result = runScriptInBrowser(code, messenger, nodeName)
            unsub()

            mutateState((prevNodes, prevEdges) => ({
                nodes: prevNodes.map(n =>
                    n.id === nodeId ? { ...n, data: { ...n.data, status: result.status, logs: result.logs } } : n
                ),
                edges: prevEdges,
            }))
        }, 300)
    }, [getMessenger, mutateState])

    const handleSaveScript = useCallback((nodeId: string, code: string) => {
        mutateState((prevNodes, prevEdges) => ({
            nodes: prevNodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, code } } : n
            ),
            edges: prevEdges,
        }))
    }, [mutateState])

    // ── Decorate nodes with script callbacks ──
    const decoratedNodes = useMemo(() => {
        return nodes.map(n => {
            if (n.type !== 'job') return n
            return {
                ...n,
                data: {
                    ...n.data,
                    onRunScript: () => handleRunScript(n.id),
                    onSaveScript: (code: string) => handleSaveScript(n.id, code),
                },
            }
        })
    }, [nodes, handleRunScript, handleSaveScript])

    // ── Update node data from settings panel ──
    const handleSettingsUpdate = useCallback((nodeId: string, data: Record<string, any>) => {
        mutateState((prevNodes, prevEdges) => ({
            nodes: prevNodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
            ),
            edges: prevEdges,
        }))
    }, [mutateState])

    const settingsNode = settingsNodeId ? nodes.find(n => n.id === settingsNodeId) : null

    // ── Rename handler ──
    const handleRename = useCallback((nodeId: string, newName: string) => {
        mutateState((prevNodes, prevEdges) => ({
            nodes: prevNodes.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, label: newName } } : n
            ),
            edges: prevEdges,
        }))
    }, [mutateState])

    // ── Hide \"Before\" button on starting nodes ──
    const hideBeforeButton = useCallback((nodeId: string) => {
        const node = nodesRef.current.find(n => n.id === nodeId)
        return node?.type === 'starting'
    }, [])

    // ── Workflow actions ──
    const handleNewWorkflow = useCallback(() => {
        const wf = createWorkflow(`Workflow ${workflows.length + 1}`)
        setWorkflows(prev => [...prev, wf])
        setActiveId(wf.id)
        // Reset history for the new workflow
        historyRef.current = [{ nodes: wf.nodes, edges: wf.edges }]
        historyIndexRef.current = 0
        updateUndoRedoState()
        // Fit viewport to show the starting node (use longer timeout to ensure React re-rendered)
        setTimeout(() => fitView({ padding: FIT_VIEW_PADDING, maxZoom: DEFAULT_ZOOM }), 200)
    }, [workflows.length, fitView, updateUndoRedoState])

    const handleSelectWorkflow = useCallback((id: string) => {
        setActiveId(id)
        setTimeout(() => fitView({ padding: FIT_VIEW_PADDING }), 150)
    }, [fitView])

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* ── Workflow Selector Bar ── */}
            <div
                data-testid="workflow-selector"
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px',
                    background: 'rgba(15,15,30,0.95)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0,
                    overflowX: 'auto',
                }}
            >
                {workflows.map(wf => (
                    <button
                        key={wf.id}
                        data-testid={`workflow-tab-${wf.id}`}
                        onClick={() => handleSelectWorkflow(wf.id)}
                        style={{
                            minHeight: 44, minWidth: 44,
                            padding: '6px 16px',
                            borderRadius: 8,
                            border: activeId === wf.id
                                ? '1px solid rgba(139,92,246,0.4)'
                                : '1px solid rgba(255,255,255,0.06)',
                            background: activeId === wf.id
                                ? 'rgba(139,92,246,0.15)'
                                : 'rgba(255,255,255,0.03)',
                            color: activeId === wf.id ? '#c084fc' : '#94a3b8',
                            fontSize: 12, fontWeight: 600,
                            fontFamily: 'Inter, sans-serif',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.15s',
                        }}
                    >
                        {wf.name}
                    </button>
                ))}
                <button
                    data-testid="workflow-new-btn"
                    onClick={handleNewWorkflow}
                    style={{
                        minHeight: 44, minWidth: 44,
                        padding: '6px 16px',
                        borderRadius: 8,
                        border: '1px solid rgba(34,197,94,0.3)',
                        background: 'rgba(34,197,94,0.08)',
                        color: '#22c55e',
                        fontSize: 12, fontWeight: 600,
                        fontFamily: 'Inter, sans-serif',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: 4,
                        transition: 'all 0.15s',
                    }}
                >
                    + New
                </button>
            </div>

            {/* ── Canvas area ── */}
            <div style={{ flex: 1, position: 'relative' }}>
                <FlowStudio
                    nodes={decoratedNodes}
                    edges={edges}
                    nodeTypes={memoNodeTypes}
                    onNodesChange={onNodesChange}
                    editMode
                    fitView
                    defaultViewport={{ x: 0, y: 0, zoom: DEFAULT_ZOOM }}
                    onAddAfter={handleAddAfter}
                    onAddBefore={handleAddBefore}
                    onConfigure={handleConfigure}
                    onRename={handleRename}
                    hideBeforeButton={hideBeforeButton}
                >
                    {/* Undo/Redo buttons — left edge */}
                    <div
                        data-testid="undo-redo-bar"
                        style={{
                            position: 'absolute', left: 16, top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex', flexDirection: 'column', gap: 6,
                            zIndex: 10,
                        }}
                    >
                        <button
                            data-testid="undo-btn"
                            onClick={undo}
                            disabled={!canUndo}
                            title="Undo (Cmd+Z)"
                            style={{
                                width: 44, height: 44,
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: canUndo ? 'rgba(15,15,26,0.9)' : 'rgba(15,15,26,0.5)',
                                color: canUndo ? '#e2e8f0' : '#334155',
                                cursor: canUndo ? 'pointer' : 'not-allowed',
                                fontSize: 18,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(8px)',
                                transition: 'all 0.2s',
                            }}
                        >
                            ↩
                        </button>
                        <button
                            data-testid="redo-btn"
                            onClick={redo}
                            disabled={!canRedo}
                            title="Redo (Cmd+Shift+Z)"
                            style={{
                                width: 44, height: 44,
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: canRedo ? 'rgba(15,15,26,0.9)' : 'rgba(15,15,26,0.5)',
                                color: canRedo ? '#e2e8f0' : '#334155',
                                cursor: canRedo ? 'pointer' : 'not-allowed',
                                fontSize: 18,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(8px)',
                                transition: 'all 0.2s',
                            }}
                        >
                            ↪
                        </button>
                    </div>
                    <EventsPanel events={events} />
                </FlowStudio>
                {settingsNode && (
                    <NodeSettingsPanel
                        node={settingsNode}
                        onClose={() => setSettingsNodeId(null)}
                        onUpdate={handleSettingsUpdate}
                    />
                )}
            </div>
        </div>
    )
}
