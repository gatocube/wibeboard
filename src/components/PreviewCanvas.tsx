/**
 * PreviewCanvas — embeddable content preview for large job nodes.
 *
 * Content types:
 *   - terminal: colored log output with macOS-style traffic-light header
 *   - (future: code, video, image, etc.)
 *
 * Renders below the node name inside large AgentNodes.
 * Compact/medium nodes do NOT render this canvas.
 */

import { motion } from 'framer-motion'

export type PreviewContentType = 'terminal'

export interface PreviewCanvasProps {
    /** Content type — determines rendering style */
    type: PreviewContentType
    /** Log lines for terminal type */
    lines?: string[]
    /** Max visible lines (default: 5) */
    maxLines?: number
}

/** Color a log line based on its prefix */
function lineColor(line: string): string {
    if (line.startsWith('⚡')) return '#fbbf24'     // tool call — amber
    if (line.startsWith('📦')) return '#22c55e'     // artifact — green
    if (line.startsWith('←')) return '#94a3b8'      // result — gray
    if (line.startsWith('✓')) return '#4ade80'      // success — bright green
    if (line.startsWith('❓')) return '#60a5fa'      // question — blue
    if (line.startsWith('🔔')) return '#f97316'      // notification — orange
    if (line.startsWith('ERROR')) return '#ff5f57'   // error — red
    return '#64748b'                                 // default — slate
}

export function PreviewCanvas({ type, lines = [], maxLines = 5 }: PreviewCanvasProps) {
    if (type !== 'terminal' || lines.length === 0) return null

    const visibleLines = lines.slice(-maxLines)

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            data-testid="preview-canvas"
            style={{
                flex: 1, minHeight: 0, marginTop: 4,
                background: 'rgba(0,0,0,0.4)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.04)',
                padding: '4px 8px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
            }}
        >
            {/* macOS traffic-light header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                marginBottom: 3,
            }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#28c840' }} />
                <span style={{
                    fontSize: 7, color: '#475569', marginLeft: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    output
                </span>
            </div>

            {/* Log lines */}
            <div style={{
                flex: 1, overflow: 'hidden',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8, lineHeight: '13px',
            }}>
                {visibleLines.map((line, i) => (
                    <div key={i} style={{
                        color: lineColor(line),
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {line}
                    </div>
                ))}
            </div>
        </motion.div>
    )
}
