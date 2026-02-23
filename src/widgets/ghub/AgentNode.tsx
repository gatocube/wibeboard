import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

/**
 * AgentNode (ghub) — #3 Task List + Progress design.
 *
 * GitHub-style card with progress bar and checkbox task list.
 * Uses GitHub's dark theme color tokens and system font stack.
 *
 * data.label — title (e.g. "Sprint Tasks")
 * data.status — 'idle' | 'running' | 'done' | 'error'
 * data.tasks — { done: boolean; text: string }[]
 * data.agent — agent model name
 * data.width / data.height — dimensions
 */

const gh = {
    bg: '#0d1117',
    bgCard: '#161b22',
    border: '#30363d',
    borderMuted: '#21262d',
    fg: '#e6edf3',
    fgMuted: '#8b949e',
    green: '#3fb950',
    accent: '#58a6ff',
}
const ghFont = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" }

export function AgentNode({ data }: { data: any }) {
    const status = data.status || 'idle'
    const w = data.width || 240
    const h = data.height || 160

    // Build tasks — use data.tasks if provided, else generate from status
    const tasks: { done: boolean; text: string }[] = data.tasks || [
        { done: status === 'done' || status === 'running', text: 'Initialize agent' },
        { done: status === 'done' || status === 'running', text: 'Execute task' },
        { done: status === 'done', text: 'Validate output' },
        { done: false, text: 'Complete' },
    ]

    const doneCount = tasks.filter(t => t.done).length
    const total = tasks.length
    const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

    return (
        <div style={{
            width: w, height: h,
            background: gh.bg,
            border: `1px solid ${gh.border}`,
            borderRadius: 6,
            padding: 12,
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
            ...ghFont,
        }}>
            <Handle type="target" position={Position.Left} style={{
                background: gh.accent, border: `2px solid ${gh.accent}55`, width: 8, height: 8,
            }} />
            <Handle type="source" position={Position.Right} style={{
                background: gh.fgMuted, border: `2px solid ${gh.borderMuted}`, width: 8, height: 8,
            }} />

            {/* Title */}
            <div style={{
                fontSize: 12, fontWeight: 600, color: gh.fg,
                marginBottom: 6,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <span>{data.label || 'Agent'}</span>
                <span style={{ fontSize: 9, color: gh.fgMuted, fontWeight: 400 }}>
                    {data.agent || 'Default'}
                </span>
            </div>

            {/* Progress bar */}
            <div style={{
                height: 4, borderRadius: 2, background: gh.borderMuted,
                marginBottom: 8, overflow: 'hidden',
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    style={{ height: '100%', borderRadius: 2, background: gh.green }}
                />
            </div>

            {/* Task list */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: 3,
                flex: 1, overflow: 'hidden',
            }}>
                {tasks.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                            width: 13, height: 13, borderRadius: 3, flexShrink: 0,
                            border: `1.5px solid ${item.done ? gh.green : gh.border}`,
                            background: item.done ? gh.green : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {item.done && <Check size={9} style={{ color: 'white' }} />}
                        </div>
                        <span style={{
                            fontSize: 10, color: item.done ? gh.fgMuted : gh.fg,
                            textDecoration: item.done ? 'line-through' : 'none',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer stats */}
            <div style={{
                fontSize: 9, color: gh.fgMuted, marginTop: 6,
                display: 'flex', justifyContent: 'space-between',
            }}>
                <span>{doneCount}/{total} tasks</span>
                <span>{pct}% complete</span>
            </div>
        </div>
    )
}
