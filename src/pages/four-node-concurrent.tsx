/**
 * Four-Node Concurrent Scenario — Orchestrator dispatches to Workers A+B
 * (concurrent), then Aggregator collects results.
 *
 * ~20 scripted steps. Workers run in parallel during the same step range.
 */

import { useState, useEffect, useMemo } from 'react'
import {
    ReactFlow,
    Background,
    type Node,
    type Edge,
} from '@xyflow/react'
import { StepStore, type StepDef, type FlowState } from '@/engine/automerge-store'
import { StepPlayer } from '@/engine/step-player'
import { AgentNode } from '@/widgets/wibeglow/AgentNode'

const nodeTypes = { agent: AgentNode }

// ── Step definitions ─────────────────────────────────────────────────────────

function makeSteps(): StepDef[] {
    return [
        // Orchestrator phase
        { label: 'Orchestrator starting', apply: (s: FlowState) => { s.nodes['orch'].status = 'waking'; s.nodes['orch'].logs.push('Initializing orchestrator...') } },
        { label: 'Orchestrator planning tasks', apply: (s: FlowState) => { s.nodes['orch'].status = 'running'; s.nodes['orch'].progress = 30; s.nodes['orch'].logs.push('Analyzing workload...') } },
        { label: 'Orchestrator dispatching', apply: (s: FlowState) => { s.nodes['orch'].progress = 60; s.nodes['orch'].logs.push('⚡ dispatch: task_a → Worker A'); s.nodes['orch'].logs.push('⚡ dispatch: task_b → Worker B') } },
        { label: 'Orchestrator waiting', apply: (s: FlowState) => { s.nodes['orch'].progress = 80; s.nodes['orch'].logs.push('Waiting for workers...') } },

        // Concurrent workers phase — both start simultaneously
        {
            label: 'Workers A & B starting', apply: (s: FlowState) => {
                s.nodes['wa'].status = 'waking'; s.nodes['wa'].logs.push('Initializing Worker A...')
                s.nodes['wb'].status = 'waking'; s.nodes['wb'].logs.push('Initializing Worker B...')
            }
        },
        {
            label: 'Workers running (concurrent)', apply: (s: FlowState) => {
                s.nodes['wa'].status = 'running'; s.nodes['wa'].progress = 15; s.nodes['wa'].logs.push('Processing: data validation...')
                s.nodes['wb'].status = 'running'; s.nodes['wb'].progress = 20; s.nodes['wb'].logs.push('Processing: schema migration...')
            }
        },
        {
            label: 'Workers progressing', apply: (s: FlowState) => {
                s.nodes['wa'].progress = 35; s.nodes['wa'].logs.push('⚡ tool_call: validate(schema)')
                s.nodes['wb'].progress = 40; s.nodes['wb'].logs.push('⚡ tool_call: migrate(tables)')
            }
        },
        {
            label: 'Tool results received', apply: (s: FlowState) => {
                s.nodes['wa'].progress = 50; s.nodes['wa'].logs.push('← validation: 24/24 fields pass')
                s.nodes['wb'].progress = 55; s.nodes['wb'].logs.push('← migration: 8 tables updated')
            }
        },
        {
            label: 'Workers continuing', apply: (s: FlowState) => {
                s.nodes['wa'].progress = 70; s.nodes['wa'].logs.push('Generating validation report...')
                s.nodes['wb'].progress = 65; s.nodes['wb'].logs.push('Running migration tests...')
            }
        },
        {
            label: 'Worker A finishing', apply: (s: FlowState) => {
                s.nodes['wa'].progress = 90; s.nodes['wa'].logs.push('📦 publish: validation-report.json')
                s.nodes['wa'].artifacts.push('validation-report.json')
                s.nodes['wb'].progress = 80; s.nodes['wb'].logs.push('⚡ tool_call: run_tests()')
            }
        },
        {
            label: 'Worker A done, B still working', apply: (s: FlowState) => {
                s.nodes['wa'].status = 'done'; s.nodes['wa'].progress = 100; s.nodes['wa'].logs.push('✓ Worker A complete')
                s.nodes['wb'].progress = 90; s.nodes['wb'].logs.push('← 15/15 tests pass ✓')
            }
        },
        {
            label: 'Worker B publishing', apply: (s: FlowState) => {
                s.nodes['wb'].progress = 95; s.nodes['wb'].logs.push('📦 publish: migration-result.sql')
                s.nodes['wb'].artifacts.push('migration-result.sql')
            }
        },
        {
            label: 'Worker B done', apply: (s: FlowState) => {
                s.nodes['wb'].status = 'done'; s.nodes['wb'].progress = 100; s.nodes['wb'].logs.push('✓ Worker B complete')
            }
        },

        // Orchestrator completes
        {
            label: 'Orchestrator received results', apply: (s: FlowState) => {
                s.nodes['orch'].progress = 90; s.nodes['orch'].logs.push('← Workers complete. Forwarding to aggregator.')
                s.nodes['orch'].status = 'done'; s.nodes['orch'].progress = 100
            }
        },

        // Aggregator phase
        {
            label: 'Aggregator starting', apply: (s: FlowState) => {
                s.nodes['agg'].status = 'waking'; s.nodes['agg'].logs.push('Initializing aggregator...')
            }
        },
        {
            label: 'Aggregator reading artifacts', apply: (s: FlowState) => {
                s.nodes['agg'].status = 'running'; s.nodes['agg'].progress = 20
                s.nodes['agg'].logs.push('📥 read: validation-report.json')
                s.nodes['agg'].logs.push('📥 read: migration-result.sql')
            }
        },
        {
            label: 'Aggregator merging results', apply: (s: FlowState) => {
                s.nodes['agg'].progress = 60; s.nodes['agg'].logs.push('Merging results...')
            }
        },
        {
            label: 'Aggregator publishing final artifact', apply: (s: FlowState) => {
                s.nodes['agg'].progress = 90
                s.nodes['agg'].logs.push('📦 publish: deploy-package.tar.gz')
                s.nodes['agg'].artifacts.push('deploy-package.tar.gz')
            }
        },
        {
            label: 'All nodes done', apply: (s: FlowState) => {
                s.nodes['agg'].status = 'done'; s.nodes['agg'].progress = 100
                s.nodes['agg'].logs.push('✓ Aggregator complete — ready to deploy')
            }
        },
    ]
}

// ── Page component ───────────────────────────────────────────────────────────

export function FourNodeConcurrentPage() {
    const store = useMemo(() => new StepStore(['orch', 'wa', 'wb', 'agg'], makeSteps()), [])
    const [state, setState] = useState(store.getState())

    useEffect(() => store.subscribe(() => setState(store.getState())), [store])

    const n = state.nodes
    const nodes: Node[] = [
        {
            id: 'orch', type: 'agent', position: { x: 50, y: 140 },
            data: {
                label: 'Orchestrator', agent: 'Claude 3.5', color: '#f59e0b',
                status: n['orch']?.status || 'idle',
                task: 'Plan and dispatch tasks to workers',
                progress: n['orch']?.progress || 0,
                callsCount: n['orch']?.logs.filter(l => l.includes('dispatch')).length || 0,
                width: 220, height: 130,
            },
        },
        {
            id: 'wa', type: 'agent', position: { x: 350, y: 40 },
            data: {
                label: 'Worker A', agent: 'Claude 3.5', color: '#8b5cf6',
                status: n['wa']?.status || 'idle',
                task: 'Data validation',
                progress: n['wa']?.progress || 0,
                callsCount: n['wa']?.logs.filter(l => l.includes('tool_call')).length || 0,
                width: 200, height: 120,
            },
        },
        {
            id: 'wb', type: 'agent', position: { x: 350, y: 240 },
            data: {
                label: 'Worker B', agent: 'Claude 3.5', color: '#06b6d4',
                status: n['wb']?.status || 'idle',
                task: 'Schema migration',
                progress: n['wb']?.progress || 0,
                callsCount: n['wb']?.logs.filter(l => l.includes('tool_call')).length || 0,
                width: 200, height: 120,
            },
        },
        {
            id: 'agg', type: 'agent', position: { x: 650, y: 140 },
            data: {
                label: 'Aggregator', agent: 'Claude 3.5', color: '#22c55e',
                status: n['agg']?.status || 'idle',
                task: 'Merge results, create deploy package',
                progress: n['agg']?.progress || 0,
                callsCount: n['agg']?.logs.filter(l => l.includes('read')).length || 0,
                width: 220, height: 130,
            },
        },
    ]

    const edges: Edge[] = [
        { id: 'orch-wa', source: 'orch', target: 'wa', animated: n['orch']?.status === 'running' || n['wa']?.status === 'running', style: { stroke: '#f59e0b55', strokeDasharray: '6 3' } },
        { id: 'orch-wb', source: 'orch', target: 'wb', animated: n['orch']?.status === 'running' || n['wb']?.status === 'running', style: { stroke: '#f59e0b55', strokeDasharray: '6 3' } },
        { id: 'wa-agg', source: 'wa', target: 'agg', animated: n['wa']?.status === 'done' && n['agg']?.status !== 'idle', style: { stroke: '#8b5cf655', strokeDasharray: '6 3' } },
        { id: 'wb-agg', source: 'wb', target: 'agg', animated: n['wb']?.status === 'done' && n['agg']?.status !== 'idle', style: { stroke: '#06b6d455', strokeDasharray: '6 3' } },
    ]

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    nodesDraggable
                    panOnDrag
                    zoomOnScroll={false}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#1e1e3a" gap={20} />
                </ReactFlow>
            </div>

            {/* Log panels — 4-column */}
            <div style={{
                display: 'flex', gap: 1,
                height: 120,
                background: 'rgba(10,10,20,0.95)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
            }}>
                <LogPanel title="Orchestrator" logs={n['orch']?.logs || []} color="#f59e0b" artifacts={n['orch']?.artifacts || []} />
                <LogPanel title="Worker A" logs={n['wa']?.logs || []} color="#8b5cf6" artifacts={n['wa']?.artifacts || []} />
                <LogPanel title="Worker B" logs={n['wb']?.logs || []} color="#06b6d4" artifacts={n['wb']?.artifacts || []} />
                <LogPanel title="Aggregator" logs={n['agg']?.logs || []} color="#22c55e" artifacts={n['agg']?.artifacts || []} />
            </div>

            <StepPlayer store={store} />
        </div>
    )
}


function LogPanel({ title, logs, color, artifacts }: { title: string; logs: string[]; color: string; artifacts: string[] }) {
    return (
        <div style={{
            flex: 1, padding: '6px 10px', overflow: 'auto',
            borderRight: '1px solid rgba(255,255,255,0.04)',
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
        }}>
            <div style={{ color, fontWeight: 600, marginBottom: 4 }}>{title}</div>
            {logs.map((log, i) => (
                <div key={i} style={{ color: log.startsWith('⚡') ? '#fbbf24' : log.startsWith('📦') ? '#22c55e' : log.startsWith('📥') ? '#38bdf8' : log.startsWith('←') ? '#94a3b8' : '#64748b' }}>
                    {log}
                </div>
            ))}
            {artifacts.length > 0 && (
                <div style={{ marginTop: 4, color: '#22c55e', fontSize: 8 }}>
                    Artifacts: {artifacts.join(', ')}
                </div>
            )}
        </div>
    )
}
