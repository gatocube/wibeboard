/**
 * BuilderSimplePage — minimal flow builder with a single StartingNode.
 *
 * Shows a centered StartingNode on a React Flow canvas.
 * Use the SwipeButtons radial menu to add nodes after the starting point.
 */

import { ReactFlowProvider, type Node, type Edge, applyNodeChanges, type NodeChange } from '@xyflow/react'
import { useState, useCallback, useMemo } from 'react'
import { StartingNode } from '@/widgets/wibeglow'
import { FlowBuilder } from '@/flow-builder'
import '@xyflow/react/dist/style.css'

// ── Node types ──
const nodeTypes = {
    starting: StartingNode,
}

// ── Initial state: single Starting node ──
const initialNodes: Node[] = [
    {
        id: 'start-1',
        type: 'starting',
        position: { x: 200, y: 200 },
        data: { label: 'Start', color: '#22c55e' },
    },
]

const initialEdges: Edge[] = []

// ── Page ──
export default function BuilderSimplePage() {
    const [nodes, setNodes] = useState<Node[]>(initialNodes)
    const [edges] = useState<Edge[]>(initialEdges)

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)),
        [],
    )

    const memoNodeTypes = useMemo(() => nodeTypes, [])

    return (
        <ReactFlowProvider>
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <FlowBuilder
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={memoNodeTypes}
                    onNodesChange={onNodesChange}
                    fitView
                />
            </div>
        </ReactFlowProvider>
    )
}
