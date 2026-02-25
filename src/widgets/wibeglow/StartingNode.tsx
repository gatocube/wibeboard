import { Handle, Position } from '@xyflow/react'
import { Play } from 'lucide-react'

/**
 * StartingNode (wibeglow) — entry point of a flow.
 *
 * A 60×60 play-button node (3×3 grid) with a single output handle.
 * Designed as the starting point for workflows.
 *
 * data.label  — node label (default: "Start")
 * data.color  — accent color (default: green #22c55e)
 * data.width  — width (default: 60)
 * data.height — height (default: 60)
 */
export function StartingNode({ data }: { data: any }) {
    const color = data.color || '#22c55e'
    const w = data.width || 60
    const h = data.height || 60
    const label = data.label || 'Start'

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
                style={{
                    width: w,
                    height: h,
                    padding: 1.5,
                    borderRadius: 14,
                    background: `linear-gradient(135deg, ${color}, ${color}88)`,
                    boxShadow: `0 0 16px ${color}33, 0 4px 12px rgba(0,0,0,0.3)`,
                    position: 'relative',
                }}
            >
                <Handle
                    type="source"
                    position={Position.Right}
                    id="out"
                    style={{
                        background: color,
                        border: `2px solid ${color}55`,
                        width: 8,
                        height: 8,
                    }}
                />

                <div
                    style={{
                        background: '#0f0f1a',
                        borderRadius: 12,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                    }}
                >
                    <Play size={18} fill={color} style={{ color, marginLeft: 2 }} />
                </div>
            </div>
            <span
                style={{
                    fontSize: 9,
                    color: '#e2e8f0',
                    fontWeight: 600,
                    marginTop: 4,
                    textAlign: 'center',
                    fontFamily: 'Inter',
                    letterSpacing: '0.02em',
                }}
            >
                {label}
            </span>
        </div>
    )
}
