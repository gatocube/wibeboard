/**
 * Two-Node Scenario — Agent A (Planner) calls tools + publishes artifact,
 * then wakes Agent B (Executor). B asks follow-up questions (green edge),
 * A responds, B confirms and works independently.
 *
 * Edge colors:
 *   🟠 Orange animated — A is waking B
 *   🟢 Green animated  — B is asking / A is responding (messaging)
 *   ⚫ Inactive dashed  — no inter-node communication
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
import { ArtifactNode as WibeGlowArtifact } from '@/widgets/wibeglow/ArtifactNode'
import { AgentNode as PixelAgent } from '@/widgets/pixel/AgentNode'
import { AgentNode as GHubAgent } from '@/widgets/ghub/AgentNode'

// ── Theme configs ────────────────────────────────────────────────────────────

type ThemeKey = 'wibeglow' | 'pixel' | 'ghub'
type NodeSize = 'S' | 'M' | 'L'

const SIZE_PRESETS: Record<NodeSize, { w: number; h: number; gap: number }> = {
    S: { w: 50, h: 50, gap: 120 },
    M: { w: 160, h: 100, gap: 250 },
    L: { w: 300, h: 200, gap: 420 },
}

const THEME_NODE_TYPES: Record<ThemeKey, NodeTypes> = {
    wibeglow: { agent: WibeGlowAgent, artifact: WibeGlowArtifact },
    pixel: { agent: PixelAgent, artifact: WibeGlowArtifact },
    ghub: { agent: GHubAgent, artifact: WibeGlowArtifact },
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
        // ── Phase 1: A wakes up (2s visual pause) ──
        {
            label: 'Node A waking up',
            apply: (s: FlowState) => {
                s.nodes['a'].status = 'waking'
                s.nodes['a'].logs.push('Initializing...')
            }
        },
        {
            label: 'Node A estimating work',
            apply: (s: FlowState) => {
                s.nodes['a'].status = 'running'
                s.nodes['a'].estimating = true
                s.nodes['a'].logs.push('Estimating task complexity...')
            }
        },

        // ── Phase 2: A works in 3 progress steps ──
        {
            label: 'Node A progress 1/3 — searching',
            apply: (s: FlowState) => {
                s.nodes['a'].estimating = false
                s.nodes['a'].progress = 33
                s.nodes['a'].logs.push('⚡ tool_call: search("auth patterns")')
                s.nodes['a'].logs.push('← result: 5 patterns found')
            }
        },
        {
            label: 'Node A progress 2/3 — artifact created',
            apply: (s: FlowState) => {
                s.nodes['a'].progress = 66
                s.nodes['a'].logs.push('📦 Creating todolist.json...')
                // Artifact appears — building (dashed, transparent)
                s.artifacts['todolist'] = {
                    id: 'todolist',
                    name: 'todolist.json',
                    type: 'json',
                    ready: false,
                    linesAdded: 12,
                    linesRemoved: 0,
                }
            }
        },
        {
            label: 'Node A progress 3/3 — artifact ready',
            apply: (s: FlowState) => {
                s.nodes['a'].progress = 100
                s.nodes['a'].logs.push('✓ todolist.json complete')
                s.nodes['a'].artifacts.push('todolist.json')
                // Artifact ready — solid border, full opacity
                s.artifacts['todolist'].ready = true
                s.artifacts['todolist'].linesAdded = 42
                s.artifacts['todolist'].linesRemoved = 3
            }
        },

        // ── Phase 3: A wakes B (orange animated edge A→B) ──
        {
            label: 'Node A waking Node B',
            apply: (s: FlowState) => {
                s.nodes['a'].knockSide = 'out'
                s.nodes['a'].logs.push('🔔 Waking Executor B...')
                s.nodes['b'].status = 'waking'
                s.nodes['b'].knockSide = 'in'
                s.nodes['b'].logs.push('🔔 Woken by Planner A')
            }
        },

        // ── Phase 4: B asks follow-up, A responds ──
        {
            label: 'Node B asking follow-up',
            apply: (s: FlowState) => {
                s.nodes['b'].status = 'running'
                // B reaches toward A (left side) — A receives from B (right side)
                s.nodes['b'].knockSide = 'in'
                s.nodes['a'].knockSide = 'out'
                s.nodes['b'].progress = 5
                s.nodes['b'].logs.push('❓ What JWT expiry should I use?')
                s.nodes['a'].logs.push('📥 B asks: What JWT expiry?')
            }
        },
        {
            label: 'Node A responding',
            apply: (s: FlowState) => {
                s.nodes['a'].knockSide = 'out'
                s.nodes['b'].knockSide = 'in'
                s.nodes['a'].logs.push('✓ Use 1h access, 7d refresh tokens')
                s.nodes['b'].logs.push('← A: 1h access, 7d refresh tokens')
            }
        },
        {
            label: 'Node B confirms — all clear',
            apply: (s: FlowState) => {
                s.nodes['b'].knockSide = null
                s.nodes['a'].knockSide = null
                s.nodes['a'].status = 'done'
                s.nodes['a'].logs.push('✓ Planner complete — handed off to B')
                s.nodes['b'].logs.push('✓ Got it, starting implementation.')
            }
        },

        // ── Phase 5: B works solo ──
        { label: 'Node B implementing auth', apply: (s: FlowState) => { s.nodes['b'].progress = 35; s.nodes['b'].logs.push('Implementing OAuth2 flow...') } },
        { label: 'Node B writing tests', apply: (s: FlowState) => { s.nodes['b'].progress = 60; s.nodes['b'].logs.push('Writing unit tests...') } },
        { label: 'Node B running tests', apply: (s: FlowState) => { s.nodes['b'].progress = 80; s.nodes['b'].logs.push('⚡ tool_call: run_tests()'); s.nodes['b'].logs.push('← 12/12 tests pass ✓') } },
        { label: 'Node B publishing', apply: (s: FlowState) => { s.nodes['b'].progress = 95; s.nodes['b'].logs.push('📦 publish: auth-module.ts'); s.nodes['b'].artifacts.push('auth-module.ts') } },
        { label: 'Both nodes done', apply: (s: FlowState) => { s.nodes['b'].status = 'done'; s.nodes['b'].progress = 100; s.nodes['b'].logs.push('✓ Executor complete') } },
    ]
}

// ── Page component ───────────────────────────────────────────────────────────

export function TwoNodeScenarioPage() {
    const store = useMemo(() => new StepStore(['a', 'b'], makeSteps()), [])
    const [state, setState] = useState(store.getState())
    const [theme, setTheme] = useState<ThemeKey>('wibeglow')
    const [nodeSize, setNodeSize] = useState<NodeSize>('L')
    const [showJson, setShowJson] = useState(false)
    const sz = SIZE_PRESETS[nodeSize]

    useEffect(() => store.subscribe(() => setState(store.getState())), [store])

    const nodeTypes = useMemo(() => THEME_NODE_TYPES[theme], [theme])
    const themeBg = THEME_BG[theme]

    // Edge logic: only animated during active inter-node communication
    // Uses knockSide as the single source of truth — if either node has knockSide set,
    // the edge is active. Color depends on whether it's waking (orange) or messaging (green).
    const aKnock = state.nodes['a']?.knockSide
    const bKnock = state.nodes['b']?.knockSide
    const hasKnock = !!(aKnock || bKnock)
    const isWakingPhase = hasKnock && (state.nodes['b']?.status === 'waking')
    const edgeColor = isWakingPhase ? '#f97316' : '#22c55e'
    const knockColor = hasKnock ? edgeColor : undefined // borders match edge color

    // Dynamic thought text — shows "Estimating..." during estimation phase
    const aThought = state.nodes['a']?.estimating
        ? 'Estimating…'
        : state.nodes['a']?.status === 'running' ? 'Analyzing authentication patterns...' : undefined

    const nodes: Node[] = [
        {
            id: 'a', type: 'agent', position: { x: 50, y: 80 },
            data: {
                label: 'Planner (A)', agent: 'Claude 3.5', color: '#8b5cf6',
                status: state.nodes['a']?.status || 'idle',
                knockSide: state.nodes['a']?.knockSide || null,
                knockColor,
                task: 'Search patterns, analyze, publish plan',
                thought: aThought,
                progress: state.nodes['a']?.estimating ? 0 : (state.nodes['a']?.progress || 0),
                execTime: state.nodes['a']?.status === 'done' ? '12.3s' : '—',
                callsCount: state.nodes['a']?.logs.filter(l => l.includes('tool_call')).length || 0,
                logs: state.nodes['a']?.logs || [],
                width: sz.w, height: sz.h,
            },
        },
        {
            id: 'b', type: 'agent', position: { x: 50 + sz.w + sz.gap, y: 80 },
            data: {
                label: 'Executor (B)', agent: 'Claude 3.5', color: '#06b6d4',
                status: state.nodes['b']?.status || 'idle',
                knockSide: state.nodes['b']?.knockSide || null,
                knockColor,
                task: 'Read plan, implement, test, publish module',
                thought: state.nodes['b']?.status === 'running' ? 'Implementing OAuth2 flow...' : undefined,
                progress: state.nodes['b']?.progress || 0,
                execTime: state.nodes['b']?.status === 'done' ? '18.7s' : '—',
                callsCount: state.nodes['b']?.logs.filter(l => l.includes('tool_call')).length || 0,
                logs: state.nodes['b']?.logs || [],
                width: sz.w, height: sz.h,
            },
        },
    ]

    // Add artifact nodes from FlowState
    const artifactEntries = Object.values(state.artifacts || {})
    for (const art of artifactEntries) {
        nodes.push({
            id: `art-${art.id}`, type: 'artifact',
            position: { x: 50, y: 80 - (sz.h > 100 ? 120 : 90) }, // above agent A
            data: {
                label: art.name, type: art.type,
                ready: art.ready,
                linesAdded: art.linesAdded,
                linesRemoved: art.linesRemoved,
                width: 180, height: 80,
            },
        })
    }

    const edges: Edge[] = []

    // Agent-to-agent edge
    if (hasKnock) {
        edges.push({
            id: 'a-b', source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in',
            animated: true,
            style: {
                stroke: edgeColor,
                strokeWidth: 2,
                filter: `drop-shadow(0 0 4px ${edgeColor})`,
            },
        })
    } else {
        edges.push({
            id: 'a-b', source: 'a', sourceHandle: 'out', target: 'b', targetHandle: 'in',
            animated: false,
            style: { stroke: '#8b5cf622', strokeDasharray: '6 3' },
        })
    }

    // Artifact edges — A publishes via the top "thinking" gate
    for (const art of artifactEntries) {
        edges.push({
            id: `a-art-${art.id}`, source: 'a', sourceHandle: 'thinking', target: `art-${art.id}`,
            animated: !art.ready,
            style: {
                stroke: art.ready ? '#c084fc55' : '#c084fc33',
                strokeWidth: 1,
                strokeDasharray: art.ready ? undefined : '4 2',
            },
        })
    }

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
                            {/* Size switcher */}
                            <div style={{
                                display: 'flex', gap: 2, padding: '4px 6px',
                                background: 'rgba(15,15,26,0.9)',
                                borderRadius: 8, marginTop: 4,
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                {(['S', 'M', 'L'] as NodeSize[]).map(sz => (
                                    <button
                                        key={sz}
                                        data-testid={`size-${sz}`}
                                        onClick={() => setNodeSize(sz)}
                                        style={{
                                            padding: '3px 10px', borderRadius: 5,
                                            border: 'none', cursor: 'pointer',
                                            background: nodeSize === sz ? 'rgba(59,130,246,0.2)' : 'transparent',
                                            color: nodeSize === sz ? '#3b82f6' : '#64748b',
                                            fontSize: 10, fontWeight: 700, fontFamily: 'Inter',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {sz}
                                    </button>
                                ))}
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
                                        estimating: n.estimating,
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
