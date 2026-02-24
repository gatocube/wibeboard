import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'

/**
 * GroupNode (wibeglow) — container node for grouping related nodes.
 *
 * data.label — group name
 * data.color — accent color
 * data.width / data.height — dimensions
 */
export function GroupNode({ data }: { data: any }) {
    const color = data.color || '#6366f1'
    const w = data.width || 400
    const h = data.height || 300

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
                width: w, height: h,
                borderRadius: 16,
                background: `${color}06`,
                border: `2px dashed ${color}33`,
                position: 'relative',
                boxShadow: `inset 0 0 40px ${color}05`,
            }}
        >
            <Handle type="target" position={Position.Left} style={{
                background: color, border: `2px solid ${color}55`, width: 8, height: 8,
            }} />
            <Handle type="source" position={Position.Right} style={{
                background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
            }} />

            {/* Title badge */}
            <div style={{
                position: 'absolute', top: -10, left: 16,
                padding: '2px 10px', borderRadius: 6,
                background: `${color}18`,
                border: `1px solid ${color}33`,
                fontSize: 10, fontWeight: 600, color,
                fontFamily: "'Caveat', 'Inter', sans-serif",
            }}>
                {data.label || 'Group'}
            </div>
        </motion.div>
    )
}
