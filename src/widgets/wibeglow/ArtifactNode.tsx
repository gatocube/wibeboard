/**
 * ArtifactNode — 3×3 compact artifact display with GitHub-style diff stats.
 *
 * Matches the magnetic-filament ArtifactNode visual style:
 *   - 56×56px icon box (dashed border when building, solid when ready)
 *   - Label below
 *   - +N / -N diff line counts with AnimatedNumber
 *
 * States:
 *   Building: dashed border, 30% opacity, pulsing glow
 *   Ready:    solid border, 100% opacity, soft glow
 */

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { AnimatedNumber } from '@/components/AnimatedNumber'

const ARTIFACT_COLOR = '#c084fc'

export function ArtifactNode({ data }: NodeProps) {
    const {
        label = 'artifact',
        ready = false,
        linesAdded = 0,
        linesRemoved = 0,
    } = data as any

    const isBuilding = !ready

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
            data-testid="artifact-node"
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
        >
            <motion.div
                animate={
                    isBuilding
                        ? {
                            boxShadow: [
                                `0 0 8px ${ARTIFACT_COLOR}33`,
                                `0 0 20px ${ARTIFACT_COLOR}55`,
                                `0 0 8px ${ARTIFACT_COLOR}33`,
                            ]
                        }
                        : { boxShadow: `0 0 16px ${ARTIFACT_COLOR}33` }
                }
                transition={
                    isBuilding
                        ? { repeat: Infinity, duration: 1, ease: 'easeInOut' }
                        : {}
                }
                style={{
                    width: 56, height: 56, borderRadius: 10,
                    background: `${ARTIFACT_COLOR}0d`,
                    border: `2px ${isBuilding ? 'dashed' : 'solid'} ${isBuilding ? 'rgba(255,255,255,0.1)' : ARTIFACT_COLOR}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isBuilding ? 0.3 : 1,
                }}
            >
                <Handle type="target" position={Position.Bottom} style={{
                    background: ARTIFACT_COLOR, border: 'none', width: 6, height: 6,
                }} />
                <motion.div
                    animate={isBuilding ? { rotate: [0, 5, -5, 0] } : { rotate: 0 }}
                    transition={isBuilding ? { repeat: Infinity, duration: 1.2, ease: 'easeInOut' } : {}}
                >
                    <span style={{
                        fontSize: 22, color: isBuilding ? 'rgba(255,255,255,0.2)' : ARTIFACT_COLOR,
                    }}>{ }</span>
                </motion.div>
            </motion.div>

            {/* Label */}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: isBuilding ? 0.3 : 0.8 }}
                transition={{ delay: 0.2 }}
                style={{
                    fontSize: 9, color: ARTIFACT_COLOR,
                    fontFamily: "'JetBrains Mono', monospace",
                }}
            >
                {isBuilding ? (
                    <motion.span
                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        {label}
                    </motion.span>
                ) : label}
            </motion.span>

            {/* Git-style diff stats — only when visible/ready */}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.3 }}
                style={{
                    fontSize: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: 0.5,
                    display: 'flex', alignItems: 'center', gap: 2,
                }}
            >
                <span style={{ color: '#4ade80' }}>+</span>
                <AnimatedNumber value={linesAdded} duration={0.8} style={{ color: '#4ade80', fontSize: 8 }} />
                <span style={{ color: '#475569', margin: '0 2px' }}>/</span>
                <span style={{ color: '#f87171' }}>−</span>
                <AnimatedNumber value={linesRemoved} duration={0.8} style={{ color: '#f87171', fontSize: 8 }} />
            </motion.span>
        </motion.div>
    )
}
