/**
 * Three Jobs Page — pipeline demo: Starting → Job(+1) → Job(×3) → Job(+1)
 *
 * Demonstrates sequential script execution with data passing.
 * Starting node defines input {counter: 10}, each job transforms it.
 * Expected final output: (10 + 1) × 3 + 1 = 34
 *
 * Click "▶ Run Pipeline" to execute all jobs sequentially.
 */

import { useState, useMemo, useCallback } from 'react'
import { ReactFlowProvider, type Node, type Edge, type NodeTypes } from '@xyflow/react'
import { FlowStudio, FlowStudioStoreProvider } from '@/flow-studio'
import { FlowStudioStore } from '@/flow-studio/FlowStudioStore'
import { StartingNode, JobNode } from '@/widgets/wibeglow'
import '@xyflow/react/dist/style.css'

// ── Node Types ──────────────────────────────────────────────────────────────────

const NODE_TYPES: NodeTypes = {
    starting: StartingNode,
    job: JobNode,
}

// ── Pipeline scripts ────────────────────────────────────────────────────────────

interface PipelineNode {
    id: string
    label: string
    code: string
    description: string
}

const PIPELINE: PipelineNode[] = [
    {
        id: 'add1-first',
        label: 'Add +1',
        code: 'return { counter: input.counter + 1 }',
        description: 'Adds 1 to counter',
    },
    {
        id: 'multiply3',
        label: 'Multiply ×3',
        code: 'return { counter: input.counter * 3 }',
        description: 'Multiplies counter by 3',
    },
    {
        id: 'add1-last',
        label: 'Add +1',
        code: 'return { counter: input.counter + 1 }',
        description: 'Adds 1 to counter',
    },
]

const INITIAL_INPUT = { counter: 10 }

// ── Pipeline executor ───────────────────────────────────────────────────────────

interface NodeState {
    status: 'idle' | 'running' | 'done' | 'error'
    input: Record<string, any> | null
    output: Record<string, any> | null
    logs: string[]
}

function runPipeline(
    input: Record<string, any>,
    pipeline: PipelineNode[],
): Map<string, NodeState> {
    const states = new Map<string, NodeState>()
    let current = input

    for (const node of pipeline) {
        const state: NodeState = {
            status: 'running',
            input: { ...current },
            output: null,
            logs: [`> Running: ${node.label}`, `  input: ${JSON.stringify(current)}`],
        }

        try {
            const fn = new Function('input', node.code)
            const result = fn(current)
            state.output = result
            state.status = 'done'
            state.logs.push(`  output: ${JSON.stringify(result)}`, '> Done ✓')
            current = result
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            state.status = 'error'
            state.logs.push(`ERROR: ${msg}`)
        }

        states.set(node.id, state)
    }

    return states
}

// ── Layout ──────────────────────────────────────────────────────────────────────

const NODE_W = 180
const NODE_H = 100
const GAP = 140

function buildNodes(
    pipelineStates: Map<string, NodeState> | null,
    startStatus: 'idle' | 'done',
): Node[] {
    const startNode: Node = {
        id: 'start',
        type: 'starting',
        position: { x: 50, y: 120 },
        draggable: true,
        data: {
            label: 'Input',
            width: 60,
            height: 60,
            status: startStatus,
        },
    }

    const jobNodes: Node[] = PIPELINE.map((p, i) => {
        const state = pipelineStates?.get(p.id)
        return {
            id: p.id,
            type: 'job',
            position: { x: 50 + 60 + GAP + i * (NODE_W + GAP), y: 90 },
            draggable: true,
            data: {
                label: p.label,
                subType: 'script',
                language: 'js',
                configured: true,
                code: p.code,
                width: NODE_W,
                height: NODE_H,
                status: state?.status ?? 'idle',
                logs: state?.logs ?? [],
                connectedHandles: i === 0 ? ['in', 'out'] : i === PIPELINE.length - 1 ? ['in'] : ['in', 'out'],
            },
        }
    })

    return [startNode, ...jobNodes]
}

function buildEdges(): Edge[] {
    const edges: Edge[] = [
        {
            id: 'start-to-first',
            source: 'start',
            target: PIPELINE[0].id,
            sourceHandle: 'out',
            targetHandle: 'in',
            animated: false,
            style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
        },
    ]

    for (let i = 0; i < PIPELINE.length - 1; i++) {
        edges.push({
            id: `${PIPELINE[i].id}-to-${PIPELINE[i + 1].id}`,
            source: PIPELINE[i].id,
            target: PIPELINE[i + 1].id,
            sourceHandle: 'out',
            targetHandle: 'in',
            animated: false,
            style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
        })
    }

    return edges
}

// ── Page component ──────────────────────────────────────────────────────────────

const store = new FlowStudioStore()

function ThreeJobsInner() {
    const [pipelineStates, setPipelineStates] = useState<Map<string, NodeState> | null>(null)
    const [hasRun, setHasRun] = useState(false)

    const nodes = useMemo(() => buildNodes(pipelineStates, hasRun ? 'done' : 'idle'), [pipelineStates, hasRun])
    const edges = useMemo(() => buildEdges(), [])

    const handleRun = useCallback(() => {
        const states = runPipeline(INITIAL_INPUT, PIPELINE)
        setPipelineStates(states)
        setHasRun(true)
    }, [])

    const handleReset = useCallback(() => {
        setPipelineStates(null)
        setHasRun(false)
    }, [])

    // Get final output for display
    const lastNode = PIPELINE[PIPELINE.length - 1]
    const finalOutput = pipelineStates?.get(lastNode.id)?.output

    return (
        <FlowStudio
            nodes={nodes}
            edges={edges}
            nodeTypes={NODE_TYPES}
            fitView
            nodesDraggable
            nodesConnectable={false}
            gridGap={20}
        >
            {/* Pipeline controls */}
            <div
                data-testid="pipeline-controls"
                style={{
                    position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 100, display: 'flex', gap: 8, alignItems: 'center',
                    padding: '8px 16px', borderRadius: 10,
                    background: 'rgba(15,15,26,0.95)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <div style={{
                    fontSize: 11, fontWeight: 700, color: '#8b5cf6',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    3 Jobs Pipeline
                </div>

                <div style={{
                    width: 1, height: 16, background: 'rgba(255,255,255,0.08)',
                }} />

                <div style={{
                    fontSize: 10, color: '#64748b',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    input: {JSON.stringify(INITIAL_INPUT)}
                </div>

                <button
                    data-testid="run-pipeline"
                    onClick={handleRun}
                    disabled={hasRun}
                    style={{
                        padding: '4px 12px', borderRadius: 6, border: 'none',
                        background: hasRun ? 'rgba(34,197,94,0.15)' : '#8b5cf6',
                        color: hasRun ? '#22c55e' : '#fff',
                        fontSize: 10, fontWeight: 600, cursor: hasRun ? 'default' : 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    {hasRun ? '✓ Done' : '▶ Run Pipeline'}
                </button>

                {hasRun && (
                    <button
                        data-testid="reset-pipeline"
                        onClick={handleReset}
                        style={{
                            padding: '4px 12px', borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent', color: '#94a3b8',
                            fontSize: 10, fontWeight: 600, cursor: 'pointer',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}
                    >
                        ↺ Reset
                    </button>
                )}

                {finalOutput && (
                    <>
                        <div style={{
                            width: 1, height: 16, background: 'rgba(255,255,255,0.08)',
                        }} />
                        <div
                            data-testid="final-output"
                            style={{
                                fontSize: 10, color: '#22c55e', fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace",
                            }}
                        >
                            output: {JSON.stringify(finalOutput)}
                        </div>
                    </>
                )}
            </div>

            {/* Per-node state cards */}
            {hasRun && (
                <div
                    data-testid="node-states"
                    style={{
                        position: 'absolute', bottom: 10, left: 10, right: 10,
                        zIndex: 100, display: 'flex', gap: 8,
                    }}
                >
                    {/* Starting node state */}
                    <div
                        data-testid="state-start"
                        style={{
                            flex: 1, padding: '8px 10px', borderRadius: 8,
                            background: 'rgba(15,15,26,0.95)',
                            border: '1px solid rgba(139,92,246,0.2)',
                            fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                            color: '#94a3b8',
                        }}
                    >
                        <div style={{ color: '#8b5cf6', fontWeight: 700, marginBottom: 4 }}>Input</div>
                        <div>out: {JSON.stringify(INITIAL_INPUT)}</div>
                    </div>

                    {PIPELINE.map(p => {
                        const state = pipelineStates?.get(p.id)
                        if (!state) return null
                        return (
                            <div
                                key={p.id}
                                data-testid={`state-${p.id}`}
                                style={{
                                    flex: 1, padding: '8px 10px', borderRadius: 8,
                                    background: 'rgba(15,15,26,0.95)',
                                    border: `1px solid ${state.status === 'done' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                    fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
                                    color: '#94a3b8',
                                }}
                            >
                                <div style={{
                                    color: state.status === 'done' ? '#22c55e' : '#ef4444',
                                    fontWeight: 700, marginBottom: 4,
                                }}>
                                    {p.label} ({p.description})
                                </div>
                                <div>in: {JSON.stringify(state.input)}</div>
                                <div>out: {JSON.stringify(state.output)}</div>
                            </div>
                        )
                    })}
                </div>
            )}
        </FlowStudio>
    )
}

export function ThreeJobsPage() {
    return (
        <FlowStudioStoreProvider store={store}>
            <ReactFlowProvider>
                <ThreeJobsInner />
            </ReactFlowProvider>
        </FlowStudioStoreProvider>
    )
}
