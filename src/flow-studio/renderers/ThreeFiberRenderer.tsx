/**
 * ThreeFiberRenderer — experimental 3D renderer using React Three Fiber.
 * Renders nodes as 3D boxes and edges as lines in a 3D scene.
 */

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { useMemo } from 'react'
import type { Node, Edge } from '@xyflow/react'

// ── Types ──

interface RendererProps {
    nodes: Node[]
    edges: Edge[]
}

// ── 3D Node ──

function Node3D({ node, index, total }: { node: Node; index: number; total: number }) {
    // Distribute nodes in a circle for visual appeal
    const angle = (index / Math.max(total, 1)) * Math.PI * 2
    const radius = 3 + total * 0.4
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    // Color based on widget type or status
    const status = (node.data as any)?.status
    const color = status === 'success' ? '#22c55e'
        : status === 'failed' ? '#ef4444'
            : status === 'working' ? '#f59e0b'
                : '#8b5cf6'

    return (
        <group position={[x, 0, z]}>
            {/* Box body */}
            <mesh castShadow>
                <boxGeometry args={[1.6, 0.8, 0.3]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.3}
                    roughness={0.6}
                    transparent
                    opacity={0.85}
                />
            </mesh>
            {/* Wireframe */}
            <mesh>
                <boxGeometry args={[1.6, 0.8, 0.3]} />
                <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
            </mesh>
            {/* Label */}
            <Text
                position={[0, 0, 0.18]}
                fontSize={0.18}
                color="#fff"
                anchorX="center"
                anchorY="middle"
                maxWidth={1.4}
            >
                {String((node.data as any)?.label || node.id)}
            </Text>
            {/* Type badge */}
            <Text
                position={[0, -0.55, 0]}
                fontSize={0.1}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
            >
                {String((node.data as any)?.widgetType || node.type || '?')}
            </Text>
        </group>
    )
}

// ── 3D Edge ──

function Edge3D({ edge, nodes }: { edge: Edge; nodes: Node[] }) {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)
    if (!sourceNode || !targetNode) return null

    const sIdx = nodes.indexOf(sourceNode)
    const tIdx = nodes.indexOf(targetNode)
    const total = nodes.length
    const radius = 3 + total * 0.4

    const sAngle = (sIdx / Math.max(total, 1)) * Math.PI * 2
    const tAngle = (tIdx / Math.max(total, 1)) * Math.PI * 2

    const points: [number, number, number][] = [
        [Math.cos(sAngle) * radius, 0, Math.sin(sAngle) * radius],
        [Math.cos(tAngle) * radius, 0, Math.sin(tAngle) * radius],
    ]

    return (
        <Line
            points={points}
            color="#8b5cf680"
            lineWidth={2}
            dashed
            dashSize={0.15}
            gapSize={0.08}
        />
    )
}

// ── Main renderer ──

export function ThreeFiberRenderer({ nodes, edges }: RendererProps) {
    const nodeList = useMemo(() => nodes, [nodes])
    const edgeList = useMemo(() => edges, [edges])

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: '#0a0a14' }}>
            {/* Experimental badge */}
            <div style={{
                position: 'absolute', top: 12, left: 12, zIndex: 10,
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b', fontSize: 10, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px',
                backdropFilter: 'blur(8px)',
            }}>
                ⚗️ Experimental · 3D Renderer
            </div>

            <Canvas
                camera={{ position: [0, 8, 8], fov: 50 }}
                style={{ width: '100%', height: '100%' }}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 10, 5]} intensity={0.8} />
                <pointLight position={[-5, 5, -5]} intensity={0.3} color="#8b5cf6" />

                {/* Ground grid */}
                <gridHelper args={[20, 20, '#1e1b4b', '#1e1b4b33']} />

                {/* Nodes */}
                {nodeList.map((node, i) => (
                    <Node3D key={node.id} node={node} index={i} total={nodeList.length} />
                ))}

                {/* Edges */}
                {edgeList.map((edge, i) => (
                    <Edge3D key={`edge-${i}`} edge={edge} nodes={nodeList} />
                ))}

                <OrbitControls
                    enableDamping
                    dampingFactor={0.08}
                    minDistance={3}
                    maxDistance={25}
                />
            </Canvas>
        </div>
    )
}
