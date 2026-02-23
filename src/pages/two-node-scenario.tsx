/**
 * Two-Node Scenario — Agent A (Planner) calls tools + publishes artifact,
 * Agent B (Executor) reads artifact and executes it.
 *
 * 19 scripted steps driven by Automerge StepStore.
 * Features: theme switcher, JSON state inspector, animated knocking.
 */

import { useState, useEffect, useMemo } from 'react'
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Panel,
    type Node,
    type Edge,
    type NodeTypes,
} from '@xyflow/react'
import { StepStore, type StepDef, type FlowState } from '@/engine/automerge-store'
import { StepPlayer } from '@/engine/step-player'
import { AgentNode as WibeGlowAgent } from '@/widgets/wibeglow/AgentNode'
import { AgentNode as PixelAgent } from '@/widgets/pixel/AgentNode'
import { AgentNode as GHubAgent } from '@/widgets/ghub/AgentNode'

// ── Theme configs ────────────────────────────────────────────────────────────

type ThemeKey = 'wibeglow' | 'pixel' | 'ghub'

const THEME_NODE_TYPES: Record<ThemeKey, NodeTypes> = {
    wibeglow: { agent: WibeGlowAgent },
    pixel: { agent: PixelAgent },
    ghub: { agent: GHubAgent },
}

const THEME_BG: Record<ThemeKey, { color: string; bg: string }> = {
    wibeglow: { color: '#1e1e3a', bg: '#0a0a14' },
    pixel: { color: '#1a1a1a', bg: '#080808' },
    ghub: { color: '#21262d', bg: '#0d1117' },
}

const THEME_LABELS: Record<ThemeKey, string> = {
    wibeglow: 'WibeGlow',
    pixel: 'Pixel',
    ghub: 'GitHub',
}

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
        { label: 'Node A done', apply: (s: FlowState) => { s.nodes['a'].status = 'done'; s.nodes['a'].progress = 100; s.nodes['a'].knockSide = null; s.nodes['a'].logs.push('✓ Planner complete') } },
        { label: 'Node B waking up', apply: (s: FlowState) => { s.nodes['b'].status = 'waking'; s.nodes['b'].logs.push('Initializing...') } },
        { label: 'Node B reading artifact', apply: (s: FlowState) => { s.nodes['b'].status = 'running'; s.nodes['b'].progress = 10; s.nodes['b'].logs.push('📥 read: auth-plan.md') } },
        { label: 'Node B implementing auth', apply: (s: FlowState) => { s.nodes['b'].progress = 35; s.nodes['b'].logs.push('Implementing OAuth2 flow...') } },
        // ── Knocking: B asks A a question ──
        {
            label: 'Node B knocking on A', apply: (s: FlowState) => {
                s.nodes['b'].logs.push('❓ Asking A: confirm JWT expiry setting?')
                s.nodes['a'].status = 'waking'; s.nodes['a'].knockSide = 'out'
                s.nodes['a'].logs.push('🔔 B is asking: confirm JWT expiry setting?')
            }
        },
        {
            label: 'Node A answering B', apply: (s: FlowState) => {
                s.nodes['a'].status = 'running'; s.nodes['a'].knockSide = null
                s.nodes['a'].logs.push('✓ Confirmed: 1h access, 7d refresh')
                s.nodes['b'].logs.push('← A confirmed: 1h access, 7d refresh')
            }
        },
        {
            label: 'Node A back to done', apply: (s: FlowState) => {
                s.nodes['a'].status = 'done'; s.nodes['a'].knockSide = null
            }
        },
        // ── Resume B's work ──
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
    const [theme, setTheme] = useState<ThemeKey>('wibeglow')
    const [showJson, setShowJson] = useState(false)

    useEffect(() => store.subscribe(() => setState(store.getState())), [store])

    const nodeTypes = useMemo(() => THEME_NODE_TYPES[theme], [theme])
    const themeBg = THEME_BG[theme]

    const nodes: Node[] = [
        {
            id: 'a', type: 'agent', position: { x: 50, y: 80 },
            data: {
                label: 'Planner (A)', agent: 'Claude 3.5', color: '#8b5cf6',
                status: state.nodes['a']?.status || 'idle',
                knockSide: state.nodes['a']?.knockSide || null,
                task: 'Search patterns, analyze, publish plan',
                thought: state.nodes['a']?.status === 'running' ? 'Analyzing authentication patterns...' : undefined,
                progress: state.nodes['a']?.progress || 0,
                execTime: state.nodes['a']?.status === 'done' ? '12.3s' : '—',
                callsCount: state.nodes['a']?.logs.filter(l => l.includes('tool_call')).length || 0,
                logs: state.nodes['a']?.logs || [],
                width: 260, height: 180,
            },
        },
        {
            id: 'b', type: 'agent', position: { x: 420, y: 80 },
            data: {
                label: 'Executor (B)', agent: 'Claude 3.5', color: '#06b6d4',
                status: state.nodes['b']?.status || 'idle',
                knockSide: state.nodes['b']?.knockSide || null,
                task: 'Read plan, implement, test, publish module',
                thought: state.nodes['b']?.status === 'running' ? 'Implementing OAuth2 flow...' : undefined,
                progress: state.nodes['b']?.progress || 0,
                execTime: state.nodes['b']?.status === 'done' ? '18.7s' : '—',
                callsCount: state.nodes['b']?.logs.filter(l => l.includes('tool_call')).length || 0,
                logs: state.nodes['b']?.logs || [],
                width: 260, height: 180,
            },
        },
    ]

    // Derive edge color from node states:
    // - Orange: one node is waking/knocking on the other
    // - Green: both are active and messages are flowing
    // - Dim purple: artifact handoff (A done → B starts)
    const aStatus = state.nodes['a']?.status || 'idle'
    const bStatus = state.nodes['b']?.status || 'idle'
    const aKnock = state.nodes['a']?.knockSide
    const isKnocking = aStatus === 'waking' || bStatus === 'waking'
    const isMessaging = (aStatus === 'running' && bStatus === 'running') ||
        (aStatus === 'running' && aKnock) ||
        (bStatus === 'running' && aKnock)
    const isHandoff = aStatus === 'done' && bStatus !== 'idle'
    const edgeActive = isKnocking || isMessaging || isHandoff

    const edgeColor = isKnocking ? '#f97316'   // orange for waking/knocking
        : isMessaging ? '#22c55e'               // green for active messaging
            : '#8b5cf655'                           // dim purple for handoff

    const edges: Edge[] = edgeActive ? [
        {
            id: 'a-b', source: 'a', target: 'b',
            animated: true,
            style: {
                stroke: edgeColor,
                strokeWidth: isKnocking || isMessaging ? 2 : 1,
                filter: isKnocking ? 'drop-shadow(0 0 4px #f97316)' : isMessaging ? 'drop-shadow(0 0 4px #22c55e)' : 'none',
            },
        },
    ] : [
        {
            id: 'a-b', source: 'a', target: 'b',
            animated: false,
            style: { stroke: '#8b5cf622', strokeDasharray: '6 3' },
        },
    ]

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: themeBg.bg }}>
            <div style={{ flex: 1 }}>
                <ReactFlowProvider>
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
                        <Background color={themeBg.color} gap={20} />

                        {/* Theme switcher panel */}
                        <Panel position="top-right">
                            <div style={{
                                display: 'flex', gap: 4, padding: '4px 6px',
                                background: 'rgba(15,15,26,0.9)',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                {(Object.keys(THEME_LABELS) as ThemeKey[]).map(key => (
                                    <button
                                        key={key}
                                        data-testid={`theme-${key}`}
                                        onClick={() => setTheme(key)}
                                        style={{
                                            padding: '3px 10px', borderRadius: 5,
                                            border: 'none', cursor: 'pointer',
                                            background: theme === key ? 'rgba(139,92,246,0.2)' : 'transparent',
                                            color: theme === key ? '#8b5cf6' : '#64748b',
                                            fontSize: 10, fontWeight: 600, fontFamily: 'Inter',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {THEME_LABELS[key]}
                                    </button>
                                ))}
                                <button
                                    data-testid="toggle-json"
                                    onClick={() => setShowJson(!showJson)}
                                    style={{
                                        padding: '3px 10px', borderRadius: 5,
                                        border: 'none', cursor: 'pointer',
                                        background: showJson ? 'rgba(34,197,94,0.2)' : 'transparent',
                                        color: showJson ? '#22c55e' : '#64748b',
                                        fontSize: 10, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {'{}'}
                                </button>
                            </div>
                        </Panel>
                    </ReactFlow>
                </ReactFlowProvider>
            </div>

            {/* Bottom panels: logs + optional JSON state */}
            <div style={{
                display: 'flex', gap: 1,
                height: showJson ? 180 : 120,
                background: 'rgba(10,10,20,0.95)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
                transition: 'height 0.2s ease',
            }}>
                <LogPanel title="Planner (A)" logs={state.nodes['a']?.logs || []} color="#8b5cf6" artifacts={state.nodes['a']?.artifacts || []} />
                <LogPanel title="Executor (B)" logs={state.nodes['b']?.logs || []} color="#06b6d4" artifacts={state.nodes['b']?.artifacts || []} />

                {/* JSON State Inspector */}
                {showJson && (
                    <div style={{
                        width: 280, flexShrink: 0,
                        padding: '6px 10px', overflow: 'auto',
                        borderLeft: '1px solid rgba(255,255,255,0.04)',
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                        lineHeight: '14px',
                        background: 'rgba(0,0,0,0.3)',
                    }}>
                        <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 4, fontSize: 9 }}>
                            State Inspector
                        </div>
                        <pre style={{
                            margin: 0, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                        }}>
                            {JSON.stringify({
                                step: state.currentStep,
                                nodes: Object.fromEntries(
                                    Object.entries(state.nodes).map(([id, n]) => [id, {
                                        status: n.status,
                                        progress: n.progress,
                                        knockSide: n.knockSide,
                                        artifacts: n.artifacts,
                                        logCount: n.logs.length,
                                    }])
                                ),
                            }, null, 2)}
                        </pre>
                    </div>
                )}
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
