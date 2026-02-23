/**
 * StatusDot — colored status indicator for compact (2×2) job nodes.
 *
 * Positioned in the top-left corner. Blinks when running.
 */

import { motion } from 'framer-motion'

export const STATUS_DOT_COLORS: Record<string, string> = {
    idle: '#475569',
    waking: '#f59e0b',
    running: '#3b82f6',
    done: '#10b981',
    error: '#ef4444',
}

export function StatusDot({ status }: { status: string }) {
    const color = STATUS_DOT_COLORS[status] || STATUS_DOT_COLORS.idle
    const isRunning = status === 'running'

    return (
        <motion.div
            animate={isRunning ? { opacity: [1, 0.3, 1] } : {}}
            transition={isRunning ? { repeat: Infinity, duration: 1, ease: 'easeInOut' } : {}}
            style={{
                position: 'absolute',
                top: 3, left: 3,
                width: 6, height: 6,
                borderRadius: '50%',
                background: color,
                boxShadow: isRunning ? `0 0 4px ${color}` : 'none',
                zIndex: 10,
            }}
        />
    )
}
