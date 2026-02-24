/**
 * ArtifactNode — displays a file artifact with GitHub-style diff stats.
 *
 * States:
 *   Building: dashed border, 50% opacity, pulsing animation
 *   Ready:    solid border, 100% opacity, subtle glow
 *
 * Shows: filename, type icon, +N/-N diff line counts with SlidingNumber animation.
 */

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/AnimatedNumber'

// ── File type icons ──
const TYPE_ICONS: Record<string, string> = {
    json: '{ }',
    md: '📄',
    ts: '🟦',
    js: '🟨',
    py: '🐍',
    sh: '⚙️',
    default: '📁',
}

const TYPE_COLORS: Record<string, string> = {
    json: '#f59e0b',
    md: '#94a3b8',
    ts: '#3b82f6',
    js: '#f7df1e',
    py: '#22c55e',
    sh: '#a78bfa',
    default: '#64748b',
}

export function ArtifactNode({ data }: NodeProps) {
    const {
        label = 'artifact',
        type = 'json',
        ready = false,
        linesAdded = 0,
        linesRemoved = 0,
        width = 180,
        height = 80,
    } = data as any

    const icon = TYPE_ICONS[type] || TYPE_ICONS.default
    const typeColor = TYPE_COLORS[type] || TYPE_COLORS.default
    const isBuilding = !ready

    return (
        <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: isBuilding ? 0.55 : 1,
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
                width,
                height,
                borderRadius: 10,
                border: isBuilding
                    ? `1.5px dashed ${typeColor}55`
                    : `1.5px solid ${typeColor}88`,
                background: isBuilding
                    ? 'rgba(15,15,26,0.7)'
                    : 'rgba(15,15,26,0.95)',
                boxShadow: isBuilding
                    ? 'none'
                    : `0 0 12px ${typeColor}22, 0 2px 8px rgba(0,0,0,0.3)`,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'Inter',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Handle type="target" position={Position.Bottom} style={{
                background: typeColor, border: `2px solid ${typeColor}55`, width: 6, height: 6,
            }} />

            {/* Header — icon + filename */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12 }}>{icon}</span>
                <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: isBuilding ? '#64748b' : '#e2e8f0',
                    fontFamily: "'JetBrains Mono', monospace",
                    transition: 'color 0.3s',
                }}>
                    {label}
                </span>
                {isBuilding && (
                    <motion.span
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ fontSize: 9, color: '#f59e0b', marginLeft: 'auto' }}
                    >
                        building…
                    </motion.span>
                )}
                {ready && (
                    <span style={{ fontSize: 9, color: '#22c55e', marginLeft: 'auto', fontWeight: 500 }}>
                        ✓ ready
                    </span>
                )}
            </div>

            {/* GitHub-style diff stats */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
            }}>
                {/* Added lines */}
                <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: 2 }}>
                    +<AnimatedNumber value={linesAdded} duration={0.8} style={{ fontWeight: 700 }} />
                </span>

                {/* Removed lines */}
                <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 2 }}>
                    -<AnimatedNumber value={linesRemoved} duration={0.8} style={{ fontWeight: 700 }} />
                </span>

                {/* Mini diff bar */}
                <div style={{ display: 'flex', gap: 1, marginLeft: 'auto' }}>
                    {Array.from({ length: 5 }, (_, i) => {
                        const total = linesAdded + linesRemoved
                        const greenCount = total > 0 ? Math.round((linesAdded / total) * 5) : 0
                        return (
                            <motion.div
                                key={i}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ delay: i * 0.05, duration: 0.2 }}
                                style={{
                                    width: 6, height: 10, borderRadius: 1,
                                    background: i < greenCount ? '#4ade80' : '#f87171',
                                    opacity: total > 0 ? 0.8 : 0.15,
                                }}
                            />
                        )
                    })}
                </div>
            </div>

            {/* Building shimmer overlay */}
            {isBuilding && (
                <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '50%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </motion.div>
    )
}
