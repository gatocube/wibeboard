/**
 * BuilderSimplePage — minimal flow builder with a single StartingNode.
 *
 * Shows a centered StartingNode on a React Flow canvas.
 * Use the SwipeButtons radial menu to add nodes after the starting point.
 *
 * Supports:
 *  - Add After / Add Before via SwipeButtons
 *  - Delete via Config → Delete
 *  - Undo / Redo via Cmd+Z / Cmd+Shift+Z
 */

import { ReactFlowProvider, useReactFlow, type Node, type Edge, applyNodeChanges, type NodeChange } from '@xyflow/react'
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { StartingNode, JobNode, UserNode, SubFlowNode } from '@/widgets/wibeglow'
import { FlowStudio, FlowStudioStoreProvider } from '@/flow-studio'
import { FlowStudioStore } from '@/flow-studio/FlowStudioStore'
import { widgetRegistry } from '@/engine/widget-registry'
import { NodeSettingsPanel } from '@/kit/NodeSettingsPanel'
import '@xyflow/react/dist/style.css'

// ── Node types ──
const nodeTypes = {
    starting: StartingNode,
    job: JobNode,
    user: UserNode,
    subflow: SubFlowNode,
}

// ── Initial state: single Starting node ──
const INITIAL_NODES: Node[] = [
    {
        id: 'start-1',
        type: 'starting',
        position: { x: 200, y: 200 },
        data: { label: 'Start', color: '#22c55e' },
    },
]

const INITIAL_EDGES: Edge[] = []

const studioStore = new FlowStudioStore()

// ── Resolve widgetType string to { type, data } ──
function resolveWidgetType(widgetType: string): { nodeType: string; data: Record<string, any> } {
    // e.g. 'user' → user widget, 'script:js' → job with subType js, 'ai:worker' → job with subType ai
    if (widgetType === 'user') {
        const def = widgetRegistry.get('user')
        const tpl = def?.templates[0]
        return { nodeType: 'user', data: { ...tpl?.defaultData, label: tpl?.defaultData.label || 'User' } }
    }
    if (widgetType === 'subflow') {
        const def = widgetRegistry.get('subflow')
        const tpl = def?.templates[0]
        return { nodeType: 'subflow', data: { ...tpl?.defaultData, label: tpl?.defaultData.label || 'SubFlow' } }
    }
    if (widgetType.startsWith('script:') || widgetType.startsWith('ai:')) {
        const [prefix, variant] = widgetType.split(':')
        const def = widgetRegistry.get('job')
        const subType = prefix === 'ai' ? 'ai' : variant
        const tpl = def?.templates.find(t => t.defaultData.subType === subType) || def?.templates[0]
        return {
            nodeType: 'job',
            data: {
                ...tpl?.defaultData,
                subType,
                label: tpl?.defaultData.label || `${variant} Script`,
                width: def?.defaultWidth || 200,
                height: def?.defaultHeight || 120,
            },
        }
    }
    // Fallback: treat as job with default JS script
    const def = widgetRegistry.get('job')
    const tpl = def?.templates.find(t => t.defaultData.subType === 'js') || def?.templates[0]
    return {
        nodeType: 'job',
        data: {
            ...tpl?.defaultData,
            label: tpl?.defaultData.label || 'Script',
            width: def?.defaultWidth || 200,
            height: def?.defaultHeight || 120,
        },
    }
}

// ── History entry for undo / redo ──
interface HistoryEntry { nodes: Node[]; edges: Edge[] }

// ── Page wrapper (provides context) ──
export default function BuilderSimplePage() {
    return (
        <FlowStudioStoreProvider store={studioStore}>
            <ReactFlowProvider>
                <BuilderSimpleInner />
            </ReactFlowProvider>
        </FlowStudioStoreProvider>
    )
}

// ── Inner component (uses hooks that need ReactFlowProvider) ──
function BuilderSimpleInner() {
    const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES)
    const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES)
    const [settingsNodeId, setSettingsNodeId] = useState<string | null>(null)

    // ── Undo / Redo ──
    const historyRef = useRef<HistoryEntry[]>([{ nodes: INITIAL_NODES, edges: INITIAL_EDGES }])
    const historyIndexRef = useRef(0)
    const skipPushRef = useRef(false) // suppress history push during undo/redo
    const { fitView } = useReactFlow()

    // ── Auto-fit when node count changes ──
    const prevCountRef = useRef(nodes.length)
    useEffect(() => {
        if (nodes.length !== prevCountRef.current) {
            prevCountRef.current = nodes.length
            const t = setTimeout(() => fitView({ padding: 0.2 }), 100)
            return () => clearTimeout(t)
        }
    }, [nodes.length, fitView])

    const pushHistory = useCallback((nextNodes: Node[], nextEdges: Edge[]) => {
        if (skipPushRef.current) { skipPushRef.current = false; return }
        const idx = historyIndexRef.current
        // Trim any future entries if we branched
        historyRef.current = historyRef.current.slice(0, idx + 1)
        historyRef.current.push({ nodes: nextNodes, edges: nextEdges })
        historyIndexRef.current = historyRef.current.length - 1
    }, [])

    const undo = useCallback(() => {
        const idx = historyIndexRef.current
        if (idx <= 0) return
        historyIndexRef.current = idx - 1
        const entry = historyRef.current[idx - 1]
        skipPushRef.current = true
        setNodes(entry.nodes)
        setEdges(entry.edges)
    }, [])

    const redo = useCallback(() => {
        const idx = historyIndexRef.current
        if (idx >= historyRef.current.length - 1) return
        historyIndexRef.current = idx + 1
        const entry = historyRef.current[idx + 1]
        skipPushRef.current = true
        setNodes(entry.nodes)
        setEdges(entry.edges)
    }, [])

    // Keyboard shortcuts: Cmd+Z / Cmd+Shift+Z
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
        setNodes(result.nodes)
        setEdges(result.edges)
        pushHistory(result.nodes, result.edges)
    }, [pushHistory])

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)),
        [],
    )

    const memoNodeTypes = useMemo(() => nodeTypes, [])

    // ── Add After handler ──
    const handleAddAfter = useCallback((sourceNodeId: string, widgetType: string) => {
        const { nodeType, data } = resolveWidgetType(widgetType)
        const newNodeId = `node-${Date.now()}`
        const sourceNode = nodesRef.current.find(n => n.id === sourceNodeId)
        const newX = sourceNode ? sourceNode.position.x + 260 : 460
        const newY = sourceNode ? sourceNode.position.y : 200

        mutateState((prevNodes, prevEdges) => ({
            nodes: [...prevNodes, {
                id: newNodeId,
                type: nodeType,
                position: { x: newX, y: newY },
                data: { ...data, width: data.width || 200, height: data.height || 120 },
            }],
            edges: [...prevEdges, {
                id: `edge-${sourceNodeId}-${newNodeId}`,
                source: sourceNodeId,
                target: newNodeId,
                animated: true,
                style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
            }],
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

            const newX = sourceNode && targetNode
                ? (sourceNode.position.x + targetNode.position.x) / 2
                : targetNode
                    ? targetNode.position.x - 260
                    : 0
            const newY = targetNode ? targetNode.position.y : 200

            const newNodes = [...prevNodes, {
                id: newNodeId,
                type: nodeType,
                position: { x: newX, y: newY },
                data: { ...data, width: data.width || 200, height: data.height || 120 },
            }]

            // Rewire: source → newNode → target
            let newEdges = prevEdges
            if (sourceId && incomingEdge) {
                newEdges = prevEdges.map(e =>
                    e.id === incomingEdge.id
                        ? { ...e, target: newNodeId }
                        : e
                )
            }
            newEdges = [...newEdges, {
                id: `edge-${newNodeId}-${targetNodeId}`,
                source: newNodeId,
                target: targetNodeId,
                animated: true,
                style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
            }]

            return { nodes: newNodes, edges: newEdges }
        })
    }, [mutateState])

    // ── Configure handler (delete, settings, etc.) ──
    const handleConfigure = useCallback((nodeId: string, action: string) => {
        if (action === 'delete') {
            mutateState((prevNodes, prevEdges) => ({
                nodes: prevNodes.filter(n => n.id !== nodeId),
                edges: prevEdges.filter(e => e.source !== nodeId && e.target !== nodeId),
            }))
        } else if (action === 'settings') {
            setSettingsNodeId(nodeId)
        }
    }, [mutateState])

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

    // ── Hide "Before" button on starting nodes ──
    const hideBeforeButton = useCallback((nodeId: string) => {
        const node = nodesRef.current.find(n => n.id === nodeId)
        return node?.type === 'starting'
    }, [])

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <FlowStudio
                nodes={nodes}
                edges={edges}
                nodeTypes={memoNodeTypes}
                onNodesChange={onNodesChange}
                editMode
                fitView
                onAddAfter={handleAddAfter}
                onAddBefore={handleAddBefore}
                onConfigure={handleConfigure}
                onRename={handleRename}
                hideBeforeButton={hideBeforeButton}
            />
            {settingsNode && (
                <NodeSettingsPanel
                    node={settingsNode}
                    onClose={() => setSettingsNodeId(null)}
                    onUpdate={handleSettingsUpdate}
                />
            )}
        </div>
    )
}
