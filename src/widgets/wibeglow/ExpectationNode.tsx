import { Handle, Position } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, FileText, Wrench } from 'lucide-react'

/**
 * ExpectationNode (wibeglow) — assertion node connected on the side of an agent.
 *
 * Used to verify that an agent produces a specific artifact or calls a specific tool.
 *
 * data.label     — expectation title (e.g. "Creates README.md")
 * data.variant   — 'artifact' | 'tool-call'
 * data.status    — 'pending' | 'pass' | 'fail'
 * data.target    — expected artifact name or tool name
 * data.color     — accent color override
 * data.width     — width in px
 * data.height    — height in px
 */

// ── Status visuals ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    pending: { icon: Clock, color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.20)', label: 'Pending' },
    pass: { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', label: 'Pass' },
    fail: { icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'Fail' },
}

const VARIANT_ICON = {
    'artifact': FileText,
    'tool-call': Wrench,
}

// ── Main component ──────────────────────────────────────────────────────────────

export function ExpectationNode({ data }: { data: any }) {
    const w = data.width || 140
    const h = data.height || 60
    const status: keyof typeof STATUS_CONFIG = data.status || 'pending'
    const variant = data.variant || 'artifact'
    const cfg = STATUS_CONFIG[status]
    const VariantIcon = VARIANT_ICON[variant as keyof typeof VARIANT_ICON] || FileText
    const isCompact = w <= 80

    return (
        <div style={{ position: 'relative' }}>
            {/* Input handle — left side, connects from agent */}
            <Handle type="target" position={Position.Left} style={{
                background: cfg.color, border: `2px solid ${cfg.border}`,
                width: 8, height: 8,
            }} />
            {/* Output handle — right side (optional chaining) */}
            <Handle type="source" position={Position.Right} style={{
                background: '#64748b', border: '2px solid rgba(100,116,139,0.3)',
                width: 6, height: 6,
            }} />

            <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{
                    width: w, height: h,
                    borderRadius: isCompact ? 8 : 10,
                    background: cfg.bg,
                    border: `1.5px solid ${cfg.border}`,
                    position: 'relative',
                    fontFamily: "'Caveat', 'Inter', sans-serif",
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {isCompact ? (
                    <CompactView cfg={cfg} variant={variant} VariantIcon={VariantIcon} data={data} />
                ) : (
                    <FullView cfg={cfg} VariantIcon={VariantIcon} data={data} w={w} h={h} />
                )}

                {/* Pass/fail pulse animation */}
                <AnimatePresence>
                    {status === 'pass' && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0.6 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{
                                position: 'absolute', inset: 0,
                                borderRadius: 10,
                                border: `2px solid ${cfg.color}`,
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

// ── Compact view (S size) ───────────────────────────────────────────────────────

function CompactView({ cfg, VariantIcon, data }: {
    cfg: typeof STATUS_CONFIG['pending']
    variant: string
    VariantIcon: React.ComponentType<any>
    data: any
}) {
    const StatusIcon = cfg.icon
    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2, padding: 4,
        }}>
            <div style={{ position: 'relative' }}>
                <VariantIcon size={14} color={cfg.color} style={{ opacity: 0.5 }} />
                <StatusIcon
                    size={8}
                    color={cfg.color}
                    style={{
                        position: 'absolute', bottom: -2, right: -4,
                        background: '#0a0a1a',
                        borderRadius: '50%',
                    }}
                />
            </div>
            {data.label && (
                <div style={{
                    fontSize: 6, fontWeight: 600, color: cfg.color,
                    textAlign: 'center', lineHeight: 1.1,
                    maxWidth: 52, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {data.label}
                </div>
            )}
        </div>
    )
}

// ── Full view (M/L size) ────────────────────────────────────────────────────────

function FullView({ cfg, VariantIcon, data, w, h }: {
    cfg: typeof STATUS_CONFIG['pending']
    VariantIcon: React.ComponentType<any>
    data: any
    w: number
    h: number
}) {
    const StatusIcon = cfg.icon
    const isLarge = w >= 200

    return (
        <div style={{
            flex: 1, padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
        }}>
            {/* Status icon */}
            <div style={{
                flexShrink: 0,
                width: isLarge ? 28 : 22, height: isLarge ? 28 : 22,
                borderRadius: 6,
                background: `${cfg.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <StatusIcon size={isLarge ? 14 : 12} color={cfg.color} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                {/* Title */}
                <div style={{
                    fontSize: isLarge ? 11 : 9,
                    fontWeight: 600,
                    color: cfg.color,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                    {data.label || 'Expectation'}
                </div>

                {/* Target (artifact/tool name) */}
                {data.target && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        marginTop: 2,
                    }}>
                        <VariantIcon size={8} color={cfg.color} style={{ opacity: 0.5 }} />
                        <span style={{
                            fontSize: isLarge ? 9 : 7,
                            color: `${cfg.color}aa`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {data.target}
                        </span>
                    </div>
                )}

                {/* Status label for large */}
                {isLarge && h > 60 && (
                    <div style={{
                        marginTop: 4,
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '1px 6px', borderRadius: 4,
                        background: `${cfg.color}12`,
                        fontSize: 7, fontWeight: 600,
                        color: cfg.color,
                    }}>
                        {cfg.label}
                    </div>
                )}
            </div>
        </div>
    )
}
