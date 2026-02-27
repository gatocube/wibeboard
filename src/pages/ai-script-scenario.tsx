/**
 * AI + Script Scenario — Agent codes → Script tests → User reviews → Deploy.
 *
 * Flow: Agent (Coder) → Script (Tests) → User (Review) → Script (Deploy)
 *
 * Turn 1: Agent works, tests run, user clicks "Comment" → loop back
 * Turn 2: Agent re-works, tests re-run, user clicks "Approve" → Deploy runs
 *
 * Uses shared FlowStudio component for settings + zoom autosize.
 * Supports drag-and-drop widget creation from the sidebar WidgetPicker.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ReactFlowProvider, Panel, type Node, type Edge, type NodeTypes, type NodeChange, applyNodeChanges } from '@xyflow/react'
import { StepStore, type StepDef, type FlowState } from '@/engine/automerge-store'
import { StepPlayer } from '@/engine/step-player'
import { FlowStudio, NodeConfigPanel, type NodeSize, FlowStudioStoreProvider } from '@/flow-studio'
import { FlowStudioStore } from '@/flow-studio/FlowStudioStore'
import { JobNode } from '@/widgets/wibeglow/JobNode'
import { UserNode } from '@/widgets/wibeglow/UserNode'
import { PlaceholderNode } from '@/widgets/wibeglow/PlaceholderNode'
import type { PresetDefinition } from '@/engine/preset-registry'

// ── Node types ───────────────────────────────────────────────────────────────

const GRID_SIZE = 20
const NODE_GAP = GRID_SIZE * 6       // 6 grid units between nodes

const SIZE_PRESETS: Record<NodeSize, { w: number; h: number; gap: number }> = {
    S: { w: 50, h: 50, gap: NODE_GAP },
    M: { w: 160, h: 100, gap: NODE_GAP },
    L: { w: 300, h: 200, gap: NODE_GAP },
}

const NODE_TYPES: NodeTypes = {
    agent: JobNode,
    job: JobNode,
    'script-js': JobNode,
    'script-ts': JobNode,
    'script-sh': JobNode,
    'script-py': JobNode,
    user: UserNode,
    placeholder: PlaceholderNode,
}



// ── IDs of scenario (step-driven) nodes ──────────────────────────────────────

const SCENARIO_NODE_IDS = ['agent', 'tests', 'review', 'deploy'] as const

// ── Step definitions ─────────────────────────────────────────────────────────

function makeSteps(): StepDef[] {
    return [
        // ── Turn 1: Agent codes ──
        {
            label: 'Agent waking up',
            apply: (s: FlowState) => {
                s.nodes['agent'].status = 'waking'
                s.nodes['agent'].logs.push('Initializing...')
            }
        },
        {
            label: 'Agent coding — 1/3',
            apply: (s: FlowState) => {
                s.nodes['agent'].status = 'running'
                s.nodes['agent'].progress = 30
                s.nodes['agent'].logs.push('⚡ tool_call: edit_file("auth.ts")')
                s.nodes['agent'].logs.push('← 42 lines added')
            }
        },
        {
            label: 'Agent coding — 2/3',
            apply: (s: FlowState) => {
                s.nodes['agent'].progress = 60
                s.nodes['agent'].logs.push('⚡ tool_call: edit_file("auth.test.ts")')
                s.nodes['agent'].logs.push('← 28 lines added')
            }
        },
        {
            label: 'Agent coding — 3/3',
            apply: (s: FlowState) => {
                s.nodes['agent'].progress = 100
                s.nodes['agent'].status = 'done'
                s.nodes['agent'].logs.push('✓ Implementation complete')
            }
        },

        // ── Turn 1: Tests run ──
        {
            label: 'Waking test runner',
            apply: (s: FlowState) => {
                s.nodes['agent'].knockSide = 'out'
                s.nodes['tests'].status = 'waking'
                s.nodes['tests'].knockSide = 'in'
                s.nodes['tests'].logs.push('🔔 Triggered by Agent')
            }
        },
        {
            label: 'Tests running',
            apply: (s: FlowState) => {
                s.nodes['agent'].knockSide = null
                s.nodes['tests'].knockSide = null
                s.nodes['tests'].status = 'running'
                s.nodes['tests'].progress = 50
                s.nodes['tests'].logs.push('> Running auth.test.ts...')
                s.nodes['tests'].logs.push('  ✓ login flow (120ms)')
                s.nodes['tests'].logs.push('  ✓ token refresh (85ms)')
            }
        },
        {
            label: 'Tests passed',
            apply: (s: FlowState) => {
                s.nodes['tests'].progress = 100
                s.nodes['tests'].status = 'done'
                s.nodes['tests'].logs.push('  ✓ logout (32ms)')
                s.nodes['tests'].logs.push('✓ 3/3 tests passed')
            }
        },

        // ── Turn 1: User reviews ──
        {
            label: 'Awaiting user review (turn 1)',
            apply: (s: FlowState) => {
                s.nodes['tests'].knockSide = 'out'
                s.nodes['review'].status = 'waiting'
                s.nodes['review'].knockSide = 'in'
            }
        },

        // ── Turn 1: User comments → restart ──
        {
            label: 'User commented — restarting',
            apply: (s: FlowState) => {
                s.nodes['review'].status = 'idle'
                s.nodes['review'].knockSide = null
                s.nodes['tests'].knockSide = null
                s.nodes['agent'].status = 'idle'
                s.nodes['agent'].progress = 0
                s.nodes['agent'].logs.push('📝 Review feedback: "Add input validation"')
                s.nodes['tests'].status = 'idle'
                s.nodes['tests'].progress = 0
            }
        },

        // ── Turn 2: Agent re-codes ──
        {
            label: 'Agent re-coding (turn 2)',
            apply: (s: FlowState) => {
                s.nodes['agent'].status = 'running'
                s.nodes['agent'].progress = 50
                s.nodes['agent'].logs.push('⚡ tool_call: edit_file("auth.ts") — add validation')
            }
        },
        {
            label: 'Agent re-coding done',
            apply: (s: FlowState) => {
                s.nodes['agent'].progress = 100
                s.nodes['agent'].status = 'done'
                s.nodes['agent'].logs.push('✓ Validation added, ready for re-test')
            }
        },

        // ── Turn 2: Tests re-run ──
        {
            label: 'Re-running tests',
            apply: (s: FlowState) => {
                s.nodes['agent'].knockSide = 'out'
                s.nodes['tests'].knockSide = 'in'
                s.nodes['tests'].status = 'running'
                s.nodes['tests'].progress = 50
                s.nodes['tests'].logs.push('> Re-running auth.test.ts...')
            }
        },
        {
            label: 'Tests passed (turn 2)',
            apply: (s: FlowState) => {
                s.nodes['agent'].knockSide = null
                s.nodes['tests'].knockSide = null
                s.nodes['tests'].progress = 100
                s.nodes['tests'].status = 'done'
                s.nodes['tests'].logs.push('  ✓ validation checks (45ms)')
                s.nodes['tests'].logs.push('✓ 4/4 tests passed')
            }
        },

        // ── Turn 2: User approves ──
        {
            label: 'Awaiting user review (turn 2)',
            apply: (s: FlowState) => {
                s.nodes['tests'].knockSide = 'out'
                s.nodes['review'].status = 'waiting'
                s.nodes['review'].knockSide = 'in'
            }
        },
        {
            label: 'User approved',
            apply: (s: FlowState) => {
                s.nodes['review'].status = 'done'
                s.nodes['review'].knockSide = null
                s.nodes['tests'].knockSide = null
            }
        },

        // ── Deploy ──
        {
            label: 'Waking deploy script',
            apply: (s: FlowState) => {
                s.nodes['review'].knockSide = 'out'
                s.nodes['deploy'].status = 'waking'
                s.nodes['deploy'].knockSide = 'in'
                s.nodes['deploy'].logs.push('🔔 Triggered by approval')
            }
        },
        {
            label: 'Deploying',
            apply: (s: FlowState) => {
                s.nodes['review'].knockSide = null
                s.nodes['deploy'].knockSide = null
                s.nodes['deploy'].status = 'running'
                s.nodes['deploy'].progress = 50
                s.nodes['deploy'].logs.push('> npm run build')
                s.nodes['deploy'].logs.push('> Uploading to staging...')
            }
        },
        {
            label: 'Deploy complete',
            apply: (s: FlowState) => {
                s.nodes['deploy'].progress = 100
                s.nodes['deploy'].status = 'done'
                s.nodes['deploy'].logs.push('✓ Deployed to staging')
                s.nodes['deploy'].logs.push('🔗 https://staging.example.com')
            }
        },
    ]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build scenario node data from StepStore state (positions preserved externally) */
function buildScenarioNodes(
    state: FlowState,
    sz: { w: number; h: number; gap: number },
    commentCount: number,
    handleComment: () => void,
    handleApprove: () => void,
): Node[] {
    return [
        {
            id: 'agent', type: 'agent', draggable: true,
            position: { x: 50, y: 80 },
            data: {
                label: 'AI Coder', agent: 'Claude 3.5', color: '#8b5cf6',
                status: state.nodes['agent']?.status || 'idle',
                knockSide: state.nodes['agent']?.knockSide || null,
                task: 'Implement auth module with validation',
                thought: state.nodes['agent']?.status === 'running' ? 'Writing authentication code...' : undefined,
                progress: state.nodes['agent']?.progress || 0,
                execTime: state.nodes['agent']?.status === 'done' ? '8.2s' : '—',
                callsCount: state.nodes['agent']?.logs?.filter(l => l.includes('tool_call')).length || 0,
                logs: state.nodes['agent']?.logs || [],
                width: sz.w, height: sz.h,
                connectedHandles: ['out'],
            },
        },
        {
            id: 'tests', type: 'script-js', draggable: true,
            position: { x: 50 + sz.w + sz.gap, y: 80 },
            data: {
                label: 'test.ts', language: 'ts',
                status: state.nodes['tests']?.status || 'idle',
                knockSide: state.nodes['tests']?.knockSide || null,
                configured: true,
                code: 'describe("auth", () => {\\n  it("login flow", () => { ... })\\n  it("token refresh", () => { ... })\\n})',
                logs: state.nodes['tests']?.logs || [],
                progress: state.nodes['tests']?.progress || 0,
                width: sz.w, height: sz.h,
                connectedHandles: ['in', 'out'],
            },
        },
        {
            id: 'review', type: 'user', draggable: true,
            position: { x: 50 + (sz.w + sz.gap) * 2, y: 80 },
            data: {
                label: 'Code Review', color: '#f59e0b',
                status: state.nodes['review']?.status || 'idle',
                knockSide: state.nodes['review']?.knockSide || null,
                reviewTitle: 'Review: auth.ts',
                reviewBody: commentCount > 0
                    ? '✅ Validation added per your feedback.\nAll 4 tests pass. Approve to deploy?'
                    : 'New auth module with login, token refresh, and logout.\n3/3 tests passing. Approve or request changes.',
                commentCount,
                onComment: handleComment,
                onApprove: handleApprove,
                width: sz.w, height: sz.h,
                connectedHandles: ['in', 'out'],
            },
        },
        {
            id: 'deploy', type: 'script-js', draggable: true,
            position: { x: 50 + (sz.w + sz.gap) * 3, y: 80 },
            data: {
                label: 'deploy.sh', language: 'sh',
                status: state.nodes['deploy']?.status || 'idle',
                knockSide: state.nodes['deploy']?.knockSide || null,
                configured: true,
                code: '#!/bin/bash\nnpm run build\naws s3 sync dist/ s3://staging/',
                logs: state.nodes['deploy']?.logs || [],
                progress: state.nodes['deploy']?.progress || 0,
                width: sz.w, height: sz.h,
                connectedHandles: ['in'],
            },
        },
    ]
}

/** Build scenario edges from StepStore state */
function buildScenarioEdges(state: FlowState): Edge[] {
    const activeEdge = (source: string, target: string): boolean => {
        const sKnock = state.nodes[source]?.knockSide
        const tKnock = state.nodes[target]?.knockSide
        return sKnock === 'out' || tKnock === 'in'
    }
    const edgeStyle = (source: string, target: string) => {
        const active = activeEdge(source, target)
        const targetWaking = state.nodes[target]?.status === 'waking'
        const color = active ? (targetWaking ? '#f97316' : '#22c55e') : 'rgba(255,255,255,0.08)'
        return { stroke: color, strokeWidth: active ? 2 : 1 }
    }
    return [
        { id: 'agent-tests', source: 'agent', target: 'tests', sourceHandle: 'out', targetHandle: 'in', animated: activeEdge('agent', 'tests'), style: edgeStyle('agent', 'tests') },
        { id: 'tests-review', source: 'tests', target: 'review', sourceHandle: 'out', targetHandle: 'in', animated: activeEdge('tests', 'review'), style: edgeStyle('tests', 'review') },
        { id: 'review-deploy', source: 'review', target: 'deploy', sourceHandle: 'out', targetHandle: 'in', animated: activeEdge('review', 'deploy'), style: edgeStyle('review', 'deploy') },
    ]
}

// ── Page component ───────────────────────────────────────────────────────────

// ── Inner component (needs ReactFlowProvider parent for useConnectorFlow) ────

function AIScriptInner() {
    const store = useMemo(() => new StepStore(['agent', 'tests', 'review', 'deploy'], makeSteps()), [])
    const [state, setState] = useState(store.getState())

    const params = new URLSearchParams(window.location.search)
    const initialSize = (params.get('size') as NodeSize) || 'M'
    const [nodeSize, setNodeSize] = useState<NodeSize>(initialSize)
    const [showJson, setShowJson] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const sz = SIZE_PRESETS[nodeSize]

    useEffect(() => {
        const url = new URL(window.location.href)
        url.searchParams.set('size', nodeSize)
        window.history.replaceState({}, '', url.toString())
    }, [nodeSize])

    useEffect(() => store.subscribe(() => setState(store.getState())), [store])

    const commentCount = state.nodes['agent']?.logs?.filter(l => l.includes('Review feedback')).length || 0

    const handleComment = useCallback(() => { store.next() }, [store])
    const handleApprove = useCallback(() => { store.next() }, [store])

    // ── State-managed nodes & edges (scenario + user-added) ──────────────────

    const [extraNodes, setExtraNodes] = useState<Node[]>([])
    const [extraEdges, setExtraEdges] = useState<Edge[]>([])

    // Track which node is being configured in the sidebar
    const [configuringNodeId, setConfiguringNodeId] = useState<string | null>(null)

    // Build scenario nodes each render (data driven by StepStore)
    const scenarioNodes = useMemo(
        () => buildScenarioNodes(state, sz, commentCount, handleComment, handleApprove),
        [state, sz, commentCount, handleComment, handleApprove],
    )
    const scenarioEdges = useMemo(
        () => buildScenarioEdges(state),
        [state],
    )

    // Track drag positions for scenario nodes separately
    const [positionOverrides, setPositionOverrides] = useState<Record<string, { x: number; y: number }>>({})

    // Apply position overrides to scenario nodes
    const scenarioNodesWithPositions = useMemo(
        () => scenarioNodes.map(n => positionOverrides[n.id]
            ? { ...n, position: positionOverrides[n.id] }
            : n
        ),
        [scenarioNodes, positionOverrides],
    )

    // ── onNodesChange: handle drag + selection for all nodes ─────────────────

    // Track which scenario nodes are currently being dragged (ref = no re-renders)
    const draggingIdsRef = useRef<Set<string>>(new Set())

    const onNodesChange = useCallback((changes: NodeChange[]) => {
        const scenarioChanges: NodeChange[] = []
        const extraChanges: NodeChange[] = []

        for (const change of changes) {
            const id = 'id' in change ? change.id : undefined
            if (id && SCENARIO_NODE_IDS.includes(id as any)) {
                scenarioChanges.push(change)
            } else {
                extraChanges.push(change)
            }
        }

        // For scenario nodes: only commit position overrides on drag END.
        // During drag, React Flow manages positions internally — writing state
        // on every frame causes re-render blinking.
        if (scenarioChanges.length > 0) {
            const posChanges = scenarioChanges.filter(
                (c): c is NodeChange & { type: 'position'; id: string; position?: { x: number; y: number }; dragging?: boolean } =>
                    c.type === 'position'
            )

            // Track dragging state in ref (no re-renders)
            for (const c of posChanges) {
                if (c.dragging) {
                    draggingIdsRef.current.add(c.id)
                } else {
                    draggingIdsRef.current.delete(c.id)
                }
            }

            // Commit final positions on drag end
            const finalPositions = posChanges.filter(c => c.position && !c.dragging)
            if (finalPositions.length > 0) {
                setPositionOverrides(prev => {
                    const next = { ...prev }
                    for (const c of finalPositions) {
                        if (c.position) next[c.id] = c.position
                    }
                    return next
                })
            }
        }

        // Apply all changes to extra (user-added) nodes normally
        if (extraChanges.length > 0) {
            setExtraNodes(nds => applyNodeChanges(extraChanges, nds))
        }
    }, [])

    // ── Update extra node data helper ────────────────────────────────────────

    const updateExtraNodeData = useCallback((id: string, patch: Record<string, any>) => {
        setExtraNodes(nds => nds.map(n =>
            n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
        ))
    }, [])

    // ── Script run callback ──────────────────────────────────────────────────

    const handleRunScript = useCallback((nodeId: string) => {
        setExtraNodes(nds => {
            const node = nds.find(n => n.id === nodeId)
            if (!node) return nds
            const code = String(node.data?.code || '')

            updateExtraNodeData(nodeId, { logs: ['> Running...'], status: 'running' })

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
                    updateExtraNodeData(nodeId, { logs: capturedLogs, status: 'done' })
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err)
                    capturedLogs.push(`ERROR: ${msg}`)
                    updateExtraNodeData(nodeId, { logs: capturedLogs, status: 'error' })
                }
            }, 300)

            return nds
        })
    }, [updateExtraNodeData])

    // ── Node created via FlowStudio connector ───────────────────────────────

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
                updateExtraNodeData(nodeId, { code, configured: true })
            }
            nodeData.onRunScript = () => handleRunScript(nodeId)
        }

        setExtraNodes(nds => [...nds, {
            id: nodeId,
            type: widgetType,
            position: { x: rect.x, y: rect.y },
            draggable: true,
            data: nodeData,
            style: { width: rect.width, height: rect.height },
        }])

        if (sourceNodeId) {
            setExtraEdges(eds => [...eds, {
                id: `edge-${sourceNodeId}-${nodeId}`,
                source: sourceNodeId,
                target: nodeId,
                animated: true,
                style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
            }])
        }
    }, [updateExtraNodeData, handleRunScript])

    // ── Add After: insert node between source and its downstream neighbor ────

    const nextInsertId = useRef(1)

    const handleAddAfter = useCallback((sourceId: string, widgetType: string) => {
        // Resolve widget type → node type and default data
        let nodeType = 'script-js'
        let nodeLabel = 'script.js'
        let nodeLanguage = 'js'
        if (widgetType.startsWith('script:')) {
            const lang = widgetType.split(':')[1] || 'js'
            nodeType = `script-${lang}`
            nodeLanguage = lang
            nodeLabel = `script.${lang}`
        } else if (widgetType === 'script') {
            nodeType = 'script-js'
        } else if (widgetType.startsWith('ai:') || widgetType === 'ai') {
            nodeType = 'agent'
            nodeLabel = 'AI Agent'
        } else if (widgetType === 'user') {
            nodeType = 'user'
            nodeLabel = 'User Task'
        }

        // Find all current nodes with their effective positions
        const allNodes = [...scenarioNodesWithPositions, ...extraNodes]
        const allEdges = [...scenarioEdges, ...extraEdges]

        const sourceNode = allNodes.find(n => n.id === sourceId)
        if (!sourceNode) return

        // Find the node after sourceId via edges
        const outEdge = allEdges.find(e => e.source === sourceId)
        const nextNodeId = outEdge?.target || null

        // Compute insertion position: right edge of source + gap
        const sourceX = sourceNode.position.x
        const newX = sourceX + sz.w + sz.gap
        const newY = sourceNode.position.y

        // Shift all nodes to the right of the insertion point
        const shiftAmount = sz.w + sz.gap
        const shiftThreshold = newX - 10 // anything at or past newX needs shifting

        // Shift scenario nodes via position overrides
        setPositionOverrides(prev => {
            const next = { ...prev }
            for (const sn of scenarioNodesWithPositions) {
                if (sn.id === sourceId) continue
                const curX = sn.position.x
                if (curX >= shiftThreshold) {
                    next[sn.id] = { x: curX + shiftAmount, y: sn.position.y }
                }
            }
            return next
        })

        // Shift extra (user-added) nodes
        setExtraNodes(nds => nds.map(n => {
            if (n.position.x >= shiftThreshold) {
                return { ...n, position: { x: n.position.x + shiftAmount, y: n.position.y } }
            }
            return n
        }))

        // Create the new node
        const newId = `inserted-${nextInsertId.current++}`
        const newNodeData: Record<string, any> = {
            label: nodeLabel,
            width: sz.w, height: sz.h,
            connectedHandles: ['in', 'out'],
        }

        if (nodeType.startsWith('script-')) {
            newNodeData.language = nodeLanguage
            newNodeData.configured = false
            newNodeData.code = ''
            newNodeData.logs = []
            newNodeData.status = 'idle'
            newNodeData.onSaveScript = (code: string) => {
                updateExtraNodeData(newId, { code, configured: true })
            }
            newNodeData.onRunScript = () => handleRunScript(newId)
        } else if (nodeType === 'agent') {
            newNodeData.agent = 'Claude 3.5'
            newNodeData.color = '#8b5cf6'
            newNodeData.status = 'idle'
            newNodeData.task = ''
            newNodeData.logs = []
        } else if (nodeType === 'user') {
            newNodeData.color = '#f59e0b'
            newNodeData.status = 'idle'
            newNodeData.reviewTitle = ''
            newNodeData.reviewBody = ''
        }

        setExtraNodes(nds => [...nds, {
            id: newId,
            type: nodeType,
            position: { x: newX, y: newY },
            draggable: true,
            data: newNodeData,
            style: { width: sz.w, height: sz.h },
        }])

        // Open the configuration panel for the new node
        setConfiguringNodeId(newId)

        // Re-wire edges: remove old source→next if it's an extra edge
        // Add source→new and new→next
        setExtraEdges(eds => {
            const newEdges = eds.filter(e => !(e.source === sourceId && e.target === nextNodeId))
            newEdges.push({
                id: `edge-${sourceId}-${newId}`,
                source: sourceId,
                target: newId,
                sourceHandle: 'out',
                targetHandle: 'in',
                animated: false,
                style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
            })
            if (nextNodeId) {
                newEdges.push({
                    id: `edge-${newId}-${nextNodeId}`,
                    source: newId,
                    target: nextNodeId,
                    sourceHandle: 'out',
                    targetHandle: 'in',
                    animated: false,
                    style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
                })
            }
            return newEdges
        })
    }, [scenarioNodesWithPositions, extraNodes, scenarioEdges, extraEdges, sz, updateExtraNodeData, handleRunScript])

    // ── Add Before: insert node before a target ──────────────────────────────

    const handleAddBefore = useCallback((targetId: string, widgetType: string) => {
        // For now, delegate to handleAddAfter on the predecessor
        const allEdges = [...scenarioEdges, ...extraEdges]
        const inEdge = allEdges.find(e => e.target === targetId)
        if (inEdge) {
            handleAddAfter(inEdge.source, widgetType)
        }
    }, [scenarioEdges, extraEdges, handleAddAfter])

    // ── Configure / Rename (stubs — can be extended later) ───────────────────

    const handleConfigure = useCallback((nodeId: string, action: string) => {
        if (action === 'delete') {
            setExtraNodes(nds => nds.filter(n => n.id !== nodeId))
            setExtraEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
        }
        // duplicate, rename handled separately
    }, [])

    const handleRename = useCallback((nodeId: string, newName: string) => {
        // Update scenario node labels via override (or extra node data)
        if (SCENARIO_NODE_IDS.includes(nodeId as any)) {
            // Scenario nodes use data from buildScenarioNodes — can't easily rename here
            return
        }
        updateExtraNodeData(nodeId, { label: newName })
    }, [updateExtraNodeData])

    // ── Combine scenario + extra nodes/edges ─────────────────────────────────

    const combinedNodes = useMemo(
        () => [...scenarioNodesWithPositions, ...extraNodes],
        [scenarioNodesWithPositions, extraNodes],
    )
    const combinedEdges = useMemo(
        () => [...scenarioEdges, ...extraEdges],
        [scenarioEdges, extraEdges],
    )

    return (
        <FlowStudio
            nodes={combinedNodes}
            edges={combinedEdges}
            nodeTypes={NODE_TYPES}
            onNodesChange={onNodesChange}
            fitView
            nodesDraggable
            nodesConnectable={false}
            currentSize={nodeSize}
            onSizeChange={setNodeSize}
            gridGap={GRID_SIZE}
            editMode={editMode}
            onNodeCreated={handleNodeCreated}
            onAddAfter={handleAddAfter}
            onAddBefore={handleAddBefore}
            onConfigure={handleConfigure}
            onRename={handleRename}
            sidebarContent={configuringNodeId ? (() => {
                const node = [...scenarioNodesWithPositions, ...extraNodes].find(n => n.id === configuringNodeId)
                if (!node) return undefined
                return (
                    <NodeConfigPanel
                        nodeId={configuringNodeId}
                        nodeType={String(node.type || 'script-js')}
                        nodeLabel={String(node.data?.label || node.id)}
                        nodeData={node.data as Record<string, any>}
                        onUpdateData={(id, data) => {
                            updateExtraNodeData(id, data)
                            setConfiguringNodeId(null)
                        }}
                        onClose={() => setConfiguringNodeId(null)}
                    />
                )
            })() : undefined}
        >
            <StepPlayer store={store} />

            {/* JSON debug toggle */}
            <Panel position="top-right">
                <div style={{
                    display: 'flex', gap: 4, marginTop: 40,
                    padding: '4px 6px', borderRadius: 6,
                    background: 'rgba(15,15,26,0.9)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <button
                        onClick={() => setEditMode(e => !e)}
                        title={editMode ? 'Switch to view mode' : 'Switch to edit mode'}
                        style={{
                            background: editMode ? 'rgba(139,92,246,0.15)' : 'transparent',
                            color: editMode ? '#8b5cf6' : '#64748b',
                            border: editMode ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
                            borderRadius: 5, padding: '3px 8px', fontSize: 10,
                            fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        ✏️
                    </button>
                    <button
                        onClick={() => setShowJson(j => !j)}
                        style={{
                            background: showJson ? 'rgba(34,197,94,0.15)' : 'transparent',
                            color: showJson ? '#22c55e' : '#64748b',
                            border: showJson ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent',
                            borderRadius: 5, padding: '3px 8px', fontSize: 10,
                            fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        {'{}'}
                    </button>
                </div>
            </Panel>

            {showJson && (
                <Panel position="bottom-right">
                    <pre style={{
                        background: 'rgba(15,15,26,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: '10px 14px',
                        color: '#94a3b8', fontSize: 9,
                        fontFamily: "'JetBrains Mono', monospace",
                        maxHeight: 300, overflow: 'auto',
                    }}>
                        {JSON.stringify(state, null, 2)}
                    </pre>
                </Panel>
            )}
        </FlowStudio>
    )
}

// ── Exported wrapper with ReactFlowProvider ──────────────────────────────────

const aiScriptStore = new FlowStudioStore()

export function AIScriptScenarioPage() {
    return (
        <FlowStudioStoreProvider store={aiScriptStore}>
            <ReactFlowProvider>
                <AIScriptInner />
            </ReactFlowProvider>
        </FlowStudioStoreProvider>
    )
}
