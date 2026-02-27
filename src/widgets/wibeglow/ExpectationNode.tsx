import { Handle, Position } from '@xyflow/react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Loader2, FileText, Wrench, Briefcase } from 'lucide-react'
import { resolveState } from '@/widgets/resolve-state'
import { subTypeRegistry } from '@/engine/widget-subtypes-registry'

/**
 * ExpectationNode (wibeglow) — assertion node connected on the side of an agent.
 *
 * Used to verify that an agent produces a specific artifact or calls a specific tool.
 *
 * data.label     — expectation title (e.g. "Creates README.md")
 * data.variant   — 'artifact' | 'tool-call' | 'job'
 * data.status    — 'idle' | 'working' | 'pass' | 'fail'
 * data.progress  — 0-100 (fills border from dashed→solid)
 * data.target    — expected artifact name or tool name
 * data.color     — accent color override
 * data.width     — width in px
 * data.height    — height in px
 */

/** Resolve variant color from subtype registry, with fallback */
function getVariantColor(variant: string): string {
    return subTypeRegistry.resolveColor('expectation', variant)
}

// ── Status visuals ──────────────────────────────────────────────────────────────

function getStatusConfig(status: string, accentColor: string) {
    switch (status) {
        case 'working':
            return {
                icon: Loader2, color: accentColor,
                bg: `${accentColor}08`, border: `${accentColor}33`,
                label: 'Working', borderStyle: 'solid' as const,
            }
        case 'pass':
            return {
                icon: CheckCircle2, color: '#10b981',
                bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.30)',
                label: 'Pass', borderStyle: 'solid' as const,
            }
        case 'fail':
            return {
                icon: XCircle, color: '#ef4444',
                bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.30)',
                label: 'Fail', borderStyle: 'solid' as const,
            }
        case 'idle':
        default:
            return {
                icon: Clock, color: accentColor,
                bg: `${accentColor}06`, border: `${accentColor}25`,
                label: 'Idle', borderStyle: 'dashed' as const,
            }
    }
}

const VARIANT_ICON: Record<string, React.ComponentType<any>> = {
    'artifact': FileText,
    'tool-call': Wrench,
    'job': Briefcase,
}

// ── Shimmer keyframes (injected once) ───────────────────────────────────────────

let shimmerInjected = false
function injectShimmer() {
    if (shimmerInjected || typeof document === 'undefined') return
    shimmerInjected = true
    const style = document.createElement('style')
    style.textContent = `
        @keyframes expectation-shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
        }
    `
    document.head.appendChild(style)
}

// ── Progress SVG border ─────────────────────────────────────────────────────────

function ProgressBorder({ w, h, progress, color, radius }: {
    w: number; h: number; progress: number; color: string; radius: number
}) {
    if (progress <= 0) return null
    const perimeter = 2 * (w + h - 4 * radius) + 2 * Math.PI * radius
    const filled = (progress / 100) * perimeter
    const gap = perimeter - filled

    return (
        <svg
            width={w} height={h}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
            <rect
                x={1} y={1}
                width={w - 2} height={h - 2}
                rx={radius} ry={radius}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray={`${filled} ${gap}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
        </svg>
    )
}

// ── Main component ──────────────────────────────────────────────────────────────

export function ExpectationNode({ data }: { data: any }) {
    injectShimmer()

    const w = data.width || 140
    const h = data.height || 60
    const st = resolveState(data)
    const status = st.status || data.status || 'idle'
    const variant = data.variant || data.subType || 'artifact'
    const accentColor = data.color || getVariantColor(variant)
    const progress = st.progress ?? data.progress ?? 0
    const cfg = getStatusConfig(status, accentColor)
    const VariantIcon = VARIANT_ICON[variant] || FileText
    const isCompact = w <= 80
    const isWorking = status === 'working'
    const borderRadius = isCompact ? 8 : 10

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
                animate={{
                    scale: 1, opacity: 1,
                    ...(isWorking ? { scale: [1, 1.02, 1] } : {}),
                }}
                transition={{
                    type: 'spring', stiffness: 300, damping: 20,
                    ...(isWorking ? { scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' } } : {}),
                }}
                style={{
                    width: w, height: h,
                    borderRadius,
                    background: cfg.bg,
                    border: `1.5px ${cfg.borderStyle} ${cfg.border}`,
                    position: 'relative',
                    fontFamily: 'Inter',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                {/* Shimmer overlay for working state */}
                {isWorking && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        borderRadius,
                        background: `linear-gradient(90deg, transparent 0%, ${accentColor}12 25%, ${accentColor}20 50%, ${accentColor}12 75%, transparent 100%)`,
                        backgroundSize: '200% 100%',
                        animation: 'expectation-shimmer 2s linear infinite',
                        pointerEvents: 'none',
                    }} />
                )}

                {/* Progress border overlay */}
                {progress > 0 && status === 'working' && (
                    <ProgressBorder
                        w={w} h={h}
                        progress={progress}
                        color={accentColor}
                        radius={borderRadius}
                    />
                )}

                {isCompact ? (
                    <CompactView cfg={cfg} variant={variant} VariantIcon={VariantIcon} data={data} accentColor={accentColor} />
                ) : (
                    <FullView cfg={cfg} VariantIcon={VariantIcon} data={data} w={w} h={h} accentColor={accentColor} progress={progress} status={status} />
                )}

                {/* Pass pulse animation */}
                <AnimatePresence>
                    {status === 'pass' && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0.6 }}
                            animate={{ scale: 2.5, opacity: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{
                                position: 'absolute', inset: 0,
                                borderRadius,
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

function CompactView({ cfg, VariantIcon, data, accentColor }: {
    cfg: ReturnType<typeof getStatusConfig>
    variant: string
    VariantIcon: React.ComponentType<any>
    data: any
    accentColor: string
}) {
    const StatusIcon = cfg.icon
    const isSpinning = cfg.label === 'Working'
    return (
        <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2, padding: 4, position: 'relative', zIndex: 1,
        }}>
            <div style={{ position: 'relative' }}>
                <VariantIcon size={14} color={accentColor} style={{ opacity: 0.5 }} />
                {isSpinning ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{
                            position: 'absolute', bottom: -2, right: -4,
                            display: 'flex',
                        }}
                    >
                        <StatusIcon size={8} color={cfg.color} />
                    </motion.div>
                ) : (
                    <StatusIcon
                        size={8}
                        color={cfg.color}
                        style={{
                            position: 'absolute', bottom: -2, right: -4,
                            background: '#0a0a1a',
                            borderRadius: '50%',
                        }}
                    />
                )}
            </div>
            {data.label && (
                <div style={{
                    fontSize: 6, fontWeight: 600, color: accentColor,
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

function FullView({ cfg, VariantIcon, data, w, h, accentColor, progress, status }: {
    cfg: ReturnType<typeof getStatusConfig>
    VariantIcon: React.ComponentType<any>
    data: any
    w: number
    h: number
    accentColor: string
    progress: number
    status: string
}) {
    const StatusIcon = cfg.icon
    const isLarge = w >= 200
    const isSpinning = status === 'working'

    return (
        <div style={{
            flex: 1, padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
            position: 'relative', zIndex: 1,
        }}>
            {/* Status icon */}
            <div style={{
                flexShrink: 0,
                width: isLarge ? 28 : 22, height: isLarge ? 28 : 22,
                borderRadius: 6,
                background: `${accentColor}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {isSpinning ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{ display: 'flex' }}
                    >
                        <StatusIcon size={isLarge ? 14 : 12} color={cfg.color} />
                    </motion.div>
                ) : (
                    <StatusIcon size={isLarge ? 14 : 12} color={cfg.color} />
                )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                {/* Title */}
                <div style={{
                    fontSize: isLarge ? 11 : 9,
                    fontWeight: 600,
                    color: accentColor,
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
                        <VariantIcon size={8} color={accentColor} style={{ opacity: 0.5 }} />
                        <span style={{
                            fontSize: isLarge ? 9 : 7,
                            color: `${accentColor}aa`,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {data.target}
                        </span>
                    </div>
                )}

                {/* Progress bar (when working + progress > 0) */}
                {status === 'working' && progress > 0 && isLarge && h > 50 && (
                    <div style={{
                        marginTop: 4,
                        height: 3, borderRadius: 2,
                        background: `${accentColor}15`,
                        overflow: 'hidden',
                    }}>
                        <motion.div
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            style={{
                                height: '100%', borderRadius: 2,
                                background: accentColor,
                            }}
                        />
                    </div>
                )}

                {/* Status label for large */}
                {isLarge && h > 60 && !progress && (
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
