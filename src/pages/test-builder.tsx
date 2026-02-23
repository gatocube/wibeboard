import { ReactFlow, Background, Panel, type Node, type Edge } from '@xyflow/react'
import { useState } from 'react'
import { AgentNode, ScriptNode, GroupNode, PlaceholderNode } from '@/widgets/wibeglow'

// ── Node types ──
const nodeTypes = {
    agent: AgentNode,
    'script-js': ScriptNode,
    'script-ts': ScriptNode,
    'script-sh': ScriptNode,
    'script-py': ScriptNode,
    group: GroupNode,
    placeholder: PlaceholderNode,
}

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
            label: 'process.js', language: 'js', configured: true,
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

export function TestBuilderPage() {
    const [nodes, setNodes] = useState<Node[]>(initialNodes)
    const [edges] = useState<Edge[]>(initialEdges)

    // Script run callback
    const handleRunScript = (nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return
        const code = String(node.data?.code || '')

        setNodes(nds => nds.map(n =>
            n.id === nodeId ? { ...n, data: { ...n.data, logs: ['> Running...'], status: 'running' } } : n
        ))

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
                setNodes(nds => nds.map(n =>
                    n.id === nodeId ? { ...n, data: { ...n.data, logs: capturedLogs, status: 'done' } } : n
                ))
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err)
                capturedLogs.push(`ERROR: ${msg}`)
                setNodes(nds => nds.map(n =>
                    n.id === nodeId ? { ...n, data: { ...n.data, logs: capturedLogs, status: 'error' } } : n
                ))
            }
        }, 300)
    }

    // Inject callbacks into nodes
    const nodesWithCallbacks = nodes.map(n => {
        if (n.type?.startsWith('script-')) {
            return {
                ...n,
                data: {
                    ...n.data,
                    onRunScript: () => handleRunScript(n.id),
                    onSaveScript: (code: string) => {
                        setNodes(nds => nds.map(nd =>
                            nd.id === n.id ? { ...nd, data: { ...nd.data, code, configured: true } } : nd
                        ))
                    },
                },
            }
        }
        return n
    })

    return (
        <ReactFlow
            nodes={nodesWithCallbacks}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            style={{ background: '#0a0a14' }}
        >
            <Background color="#1e1e3a" gap={20} size={1} />
            <Panel position="top-right">
                <div style={{
                    padding: '6px 12px', borderRadius: 6,
                    background: 'rgba(15,15,26,0.9)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    fontSize: 9, color: '#64748b',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    Builder Demo · {nodes.length} nodes
                </div>
            </Panel>
        </ReactFlow>
    )
}
