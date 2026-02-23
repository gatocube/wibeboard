/**
 * Two-Node Scenario — Agent A (Planner) calls tools + publishes artifact,
 * Agent B (Executor) reads artifact and executes it.
 *
 * 15 scripted steps driven by Automerge StepStore.
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
        { label: 'Node A waking up', apply: (s: FlowState) => { s.nodes['a'].status = 'waking'; s.nodes['a'].logs.push('Initializing...') } },
        { label: 'Node A is working', apply: (s: FlowState) => { s.nodes['a'].status = 'running'; s.nodes['a'].progress = 10; s.nodes['a'].logs.push('Starting planner...') } },
        { label: 'Node A calling tool: search', apply: (s: FlowState) => { s.nodes['a'].progress = 25; s.nodes['a'].logs.push('⚡ tool_call: search("auth patterns")') } },
        { label: 'Tool result received', apply: (s: FlowState) => { s.nodes['a'].progress = 40; s.nodes['a'].logs.push('← result: 5 patterns found') } },
        { label: 'Node A calling tool: analyze', apply: (s: FlowState) => { s.nodes['a'].progress = 55; s.nodes['a'].logs.push('⚡ tool_call: analyze(patterns)') } },
        { label: 'Analysis complete', apply: (s: FlowState) => { s.nodes['a'].progress = 70; s.nodes['a'].logs.push('← result: OAuth2 + JWT recommended') } },
        { label: 'Node A publishing artifact', apply: (s: FlowState) => { s.nodes['a'].progress = 85; s.nodes['a'].logs.push('📦 publish: auth-plan.md'); s.nodes['a'].artifacts.push('auth-plan.md') } },
        { label: 'Node A done', apply: (s: FlowState) => { s.nodes['a'].status = 'done'; s.nodes['a'].progress = 100; s.nodes['a'].logs.push('✓ Planner complete') } },
        { label: 'Node B waking up', apply: (s: FlowState) => { s.nodes['b'].status = 'waking'; s.nodes['b'].logs.push('Initializing...') } },
        { label: 'Node B reading artifact', apply: (s: FlowState) => { s.nodes['b'].status = 'running'; s.nodes['b'].progress = 10; s.nodes['b'].logs.push('📥 read: auth-plan.md') } },
        { label: 'Node B implementing auth', apply: (s: FlowState) => { s.nodes['b'].progress = 35; s.nodes['b'].logs.push('Implementing OAuth2 flow...') } },
        { label: 'Node B writing tests', apply: (s: FlowState) => { s.nodes['b'].progress = 60; s.nodes['b'].logs.push('Writing unit tests...') } },
        { label: 'Node B running tests', apply: (s: FlowState) => { s.nodes['b'].progress = 80; s.nodes['b'].logs.push('⚡ tool_call: run_tests()'); s.nodes['b'].logs.push('← 12/12 tests pass ✓') } },
        { label: 'Node B publishing artifact', apply: (s: FlowState) => { s.nodes['b'].progress = 95; s.nodes['b'].logs.push('📦 publish: auth-module.ts'); s.nodes['b'].artifacts.push('auth-module.ts') } },
        { label: 'Both nodes done', apply: (s: FlowState) => { s.nodes['b'].status = 'done'; s.nodes['b'].progress = 100; s.nodes['b'].logs.push('✓ Executor complete') } },
    ]
}

// ── Page component ───────────────────────────────────────────────────────────

export function TwoNodeScenarioPage() {
    const store = useMemo(() => new StepStore(['a', 'b'], makeSteps()), [])
    const [state, setState] = useState(store.getState())

    useEffect(() => store.subscribe(() => setState(store.getState())), [store])

    const nodes: Node[] = [
        {
            id: 'a', type: 'agent', position: { x: 50, y: 80 },
            data: {
                label: 'Planner (A)', agent: 'Claude 3.5', color: '#8b5cf6',
                status: state.nodes['a']?.status || 'idle',
                task: 'Search patterns, analyze, publish plan',
                progress: state.nodes['a']?.progress || 0,
                execTime: state.nodes['a']?.status === 'done' ? '12.3s' : '—',
                callsCount: state.nodes['a']?.logs.filter(l => l.includes('tool_call')).length || 0,
                width: 240, height: 140,
            },
        },
        {
            id: 'b', type: 'agent', position: { x: 400, y: 80 },
            data: {
                label: 'Executor (B)', agent: 'Claude 3.5', color: '#06b6d4',
                status: state.nodes['b']?.status || 'idle',
                task: 'Read plan, implement, test, publish module',
                progress: state.nodes['b']?.progress || 0,
                execTime: state.nodes['b']?.status === 'done' ? '18.7s' : '—',
                callsCount: state.nodes['b']?.logs.filter(l => l.includes('tool_call')).length || 0,
                width: 240, height: 140,
            },
        },
    ]

    const edges: Edge[] = [
        { id: 'a-b', source: 'a', target: 'b', animated: state.nodes['a']?.status === 'done' && state.nodes['b']?.status !== 'idle', style: { stroke: '#8b5cf655', strokeDasharray: '6 3' } },
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

            {/* Log panels */}
            <div style={{
                display: 'flex', gap: 1,
                height: 120,
                background: 'rgba(10,10,20,0.95)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
            }}>
                <LogPanel title="Planner (A)" logs={state.nodes['a']?.logs || []} color="#8b5cf6" artifacts={state.nodes['a']?.artifacts || []} />
                <LogPanel title="Executor (B)" logs={state.nodes['b']?.logs || []} color="#06b6d4" artifacts={state.nodes['b']?.artifacts || []} />
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
                <div key={i} style={{ color: log.startsWith('⚡') ? '#fbbf24' : log.startsWith('📦') ? '#22c55e' : log.startsWith('←') ? '#94a3b8' : '#64748b' }}>
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
