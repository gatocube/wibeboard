/**
 * AsciiRenderer — experimental ASCII art renderer using React Three Fiber + drei AsciiRenderer effect.
 * Renders the same 3D scene as ThreeFiberRenderer but with ASCII art post-processing.
 */

import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Text, Line, AsciiRenderer as DreiAscii } from '@react-three/drei'
import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'

// ── Types ──

interface RendererProps {
    nodes: Node[]
    edges: Edge[]
}

// ── 3D Node (simplified for ASCII) ──

function AsciiNode({ node, index, total }: { node: Node; index: number; total: number }) {
    const angle = (index / Math.max(total, 1)) * Math.PI * 2
    const radius = 3 + total * 0.3
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    const status = (node.data as any)?.status
    const color = status === 'success' ? '#22c55e'
        : status === 'failed' ? '#ef4444'
            : status === 'working' ? '#f59e0b'
                : '#a78bfa'

    return (
        <group position={[x, 0, z]}>
            <mesh>
                <boxGeometry args={[1.2, 0.6, 0.25]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <Text
                position={[0, 0, 0.15]}
                fontSize={0.14}
                color="#fff"
                anchorX="center"
                anchorY="middle"
                maxWidth={1}
            >
                {String((node.data as any)?.label || node.id)}
            </Text>
        </group>
    )
}

// ── 3D Edge (simplified for ASCII) ──

function AsciiEdge({ edge, nodes }: { edge: Edge; nodes: Node[] }) {
    const src = nodes.find(n => n.id === edge.source)
    const tgt = nodes.find(n => n.id === edge.target)
    if (!src || !tgt) return null

    const total = nodes.length
    const radius = 3 + total * 0.3
    const sA = (nodes.indexOf(src) / Math.max(total, 1)) * Math.PI * 2
    const tA = (nodes.indexOf(tgt) / Math.max(total, 1)) * Math.PI * 2

    return (
        <Line
            points={[
                [Math.cos(sA) * radius, 0, Math.sin(sA) * radius],
                [Math.cos(tA) * radius, 0, Math.sin(tA) * radius],
            ]}
            color="#a78bfa"
            lineWidth={1.5}
        />
    )
}

// ── ASCII effect wrapper ──

function AsciiEffect() {
    const { size } = useThree()
    const renderIndex = Math.min(Math.round(size.width / 6), 200)

    return (
        <DreiAscii
            characters=" .:-+*=%@#"
            fgColor="#a78bfa"
            bgColor="#0a0a14"
            renderIndex={renderIndex}
        />
    )
}

// ── Main renderer ──

export function AsciiFlowRenderer({ nodes, edges }: RendererProps) {
    const nodeList = useMemo(() => nodes, [nodes])
    const edgeList = useMemo(() => edges, [edges])

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a14' }}>
            {/* Experimental badge */}
            <div style={{
                position: 'absolute', top: 12, left: 12, zIndex: 10,
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
                color: '#a78bfa', fontSize: 10, fontWeight: 600,
                fontFamily: 'monospace', letterSpacing: '1px',
                backdropFilter: 'blur(8px)',
            }}>
                ⚗️ Experimental · ASCII Renderer
            </div>

            <Canvas
                camera={{ position: [0, 6, 8], fov: 50 }}
                style={{ width: '100%', height: '100%' }}
            >
                <color attach="background" args={['#0a0a14']} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 10, 5]} intensity={0.7} />

                {nodeList.map((node, i) => (
                    <AsciiNode key={node.id} node={node} index={i} total={nodeList.length} />
                ))}

                {edgeList.map((edge, i) => (
                    <AsciiEdge key={`edge-${i}`} edge={edge} nodes={nodeList} />
                ))}

                <AsciiEffect />

                <OrbitControls enableDamping dampingFactor={0.08} />
            </Canvas>
        </div>
    )
}
