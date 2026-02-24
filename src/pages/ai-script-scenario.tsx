/**
 * AI + Script Scenario — Agent codes → Script tests → User reviews → Deploy.
 *
 * Flow: Agent (Coder) → Script (Tests) → User (Review) → Script (Deploy)
 *
 * Turn 1: Agent works, tests run, user clicks "Comment" → loop back
 * Turn 2: Agent re-works, tests re-run, user clicks "Approve" → Deploy runs
 *
 * Uses shared FlowBuilder component for settings + zoom autosize.
 * Supports drag-and-drop widget creation from the sidebar WidgetPicker.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ReactFlowProvider, Panel, type Node, type Edge, type NodeTypes, type NodeChange, applyNodeChanges } from '@xyflow/react'
import { StepStore, type StepDef, type FlowState } from '@/engine/automerge-store'
import { StepPlayer } from '@/engine/step-player'
import { FlowBuilder, type NodeSize } from '@/flow-builder'
import { AgentNode } from '@/widgets/wibeglow/AgentNode'
import { ScriptNode } from '@/widgets/wibeglow/ScriptNode'
import { UserNode } from '@/widgets/wibeglow/UserNode'
import { PlaceholderNode } from '@/widgets/wibeglow/PlaceholderNode'
import type { WidgetTemplate } from '@/engine/widget-registry'

// ── Node types ───────────────────────────────────────────────────────────────

const SIZE_PRESETS: Record<NodeSize, { w: number; h: number; gap: number }> = {
    S: { w: 50, h: 50, gap: 100 },
    M: { w: 160, h: 100, gap: 200 },
    L: { w: 300, h: 200, gap: 360 },
}

const NODE_TYPES: NodeTypes = {
    agent: AgentNode,
    'script-js': ScriptNode,
    'script-ts': ScriptNode,
    'script-sh': ScriptNode,
    'script-py': ScriptNode,
    user: UserNode,
    placeholder: PlaceholderNode,
}

const GRID_SIZE = 20

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

        // Apply position changes to scenario nodes via position overrides
        if (scenarioChanges.length > 0) {
            const posChanges = scenarioChanges.filter(
                (c): c is NodeChange & { type: 'position'; id: string; position?: { x: number; y: number } } =>
                    c.type === 'position'
            )
            if (posChanges.length > 0) {
                setPositionOverrides(prev => {
                    const next = { ...prev }
                    for (const c of posChanges) {
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

    // ── Node created via FlowBuilder connector ───────────────────────────────

    const handleNodeCreated = useCallback((nodeId: string, widgetType: string, template: WidgetTemplate, rect: { x: number; y: number; width: number; height: number }, sourceNodeId: string | null) => {
        const nodeData: Record<string, any> = {
            label: template.defaultData.label || template.name,
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
        <FlowBuilder
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
            editMode
            onNodeCreated={handleNodeCreated}
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
        </FlowBuilder>
    )
}

// ── Exported wrapper with ReactFlowProvider ──────────────────────────────────

export function AIScriptScenarioPage() {
    return (
        <ReactFlowProvider>
            <AIScriptInner />
        </ReactFlowProvider>
    )
}
