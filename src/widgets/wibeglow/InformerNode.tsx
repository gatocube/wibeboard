import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { StickyNote } from 'lucide-react'
import { BaseNode } from '@/widgets/BaseNode'

/**
 * NoteNode (wibeglow) — annotation nodes for documentation and visual markers.
 *
 * Three variants controlled by `data.variant`:
 *   - 'sticker'    — post-it style note, can be attached to board or overlaid on nodes
 *   - 'group-note' — background label for a group of nodes
 *   - 'label'      — plain text/markdown label
 *
 * data.label     — note title/text
 * data.content   — markdown body content
 * data.color     — accent color (default: #fbbf24 yellow)
 * data.variant   — 'sticker' | 'group-note' | 'label'
 * data.width     — width in px
 * data.height    — height in px
 */

// ── Color presets ───────────────────────────────────────────────────────────────

const STICKER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    yellow: { bg: '#fef3c7', text: '#92400e', border: '#fbbf2444' },
    pink: { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d444' },
    green: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b744' },
    blue: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd44' },
    purple: { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd44' },
    orange: { bg: '#ffedd5', text: '#9a3412', border: '#fdba7444' },
}

function getStickerPalette(color?: string) {
    if (color && STICKER_COLORS[color]) return STICKER_COLORS[color]
    // Try hex match — default to yellow
    return STICKER_COLORS.yellow
}

// ── Sticker variant ─────────────────────────────────────────────────────────────

function StickerNote({ data, w, h }: { data: any; w: number; h: number }) {
    const palette = getStickerPalette(data.color)
    const isCompact = w <= 80

    return (
        <motion.div
            initial={{ scale: 0.85, rotate: -2, opacity: 0 }}
            animate={{ scale: 1, rotate: data.rotate ?? (Math.random() * 4 - 2), opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            style={{
                width: w, height: h,
                borderRadius: 3,
                background: palette.bg,
                border: `1px solid ${palette.border}`,
                boxShadow: '2px 3px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)',
                position: 'relative',
                fontFamily: "'Architects Daughter', cursive",
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Fold effect */}
            <div style={{
                position: 'absolute', top: 0, right: 0,
                width: isCompact ? 8 : 14, height: isCompact ? 8 : 14,
                background: `linear-gradient(135deg, ${palette.bg} 50%, ${palette.border} 50%)`,
                borderBottomLeftRadius: 4,
            }} />

            {/* Content */}
            <div style={{
                flex: 1, padding: isCompact ? '4px 5px' : '8px 10px',
                display: 'flex', flexDirection: 'column', gap: 2,
            }}>
                {/* Title */}
                {data.label && (
                    <div style={{
                        fontSize: isCompact ? 8 : 13,
                        fontWeight: 700,
                        color: palette.text,
                        lineHeight: 1.2,
                    }}>
                        {data.label}
                    </div>
                )}

                {/* Body */}
                {data.content && !isCompact && (
                    <div style={{
                        fontSize: 11,
                        color: palette.text,
                        opacity: 0.8,
                        lineHeight: 1.4,
                        flex: 1,
                        overflow: 'hidden',
                    }}>
                        {data.content}
                    </div>
                )}
            </div>

            {/* Bottom strip — sticker icon */}
            {!isCompact && (
                <div style={{
                    padding: '2px 8px 4px',
                    display: 'flex', alignItems: 'center', gap: 3,
                    opacity: 0.4,
                }}>
                    <StickyNote size={8} color={palette.text} />
                    <span style={{ fontSize: 7, color: palette.text }}>note</span>
                </div>
            )}
        </motion.div>
    )
}

// ── Group Note variant ──────────────────────────────────────────────────────────

function GroupNoteNode({ data, w, h }: { data: any; w: number; h: number }) {
    const color = data.color || '#6366f1'
    const isCompact = w <= 80

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            style={{
                width: w, height: h,
                borderRadius: isCompact ? 8 : 16,
                background: `${color}08`,
                border: `2px dashed ${color}30`,
                position: 'relative',
                boxShadow: `inset 0 0 60px ${color}06`,
            }}
        >
            {/* Title badge */}
            <div style={{
                position: 'absolute',
                top: isCompact ? -6 : -10,
                left: isCompact ? 6 : 16,
                padding: isCompact ? '1px 5px' : '2px 10px',
                borderRadius: 6,
                background: `${color}15`,
                border: `1px solid ${color}30`,
                fontSize: isCompact ? 7 : 10,
                fontWeight: 600,
                color,
                fontFamily: "'Architects Daughter', cursive",
                whiteSpace: 'nowrap',
            }}>
                {data.label || 'Group Note'}
            </div>

            {/* Description text */}
            {data.content && !isCompact && (
                <div style={{
                    position: 'absolute',
                    bottom: 8, left: 16, right: 16,
                    fontSize: 9,
                    color: `${color}88`,
                    fontFamily: "'Architects Daughter', cursive",
                    lineHeight: 1.3,
                }}>
                    {data.content}
                </div>
            )}
        </motion.div>
    )
}

// ── Label variant ───────────────────────────────────────────────────────────────

function LabelNode({ data, w, h }: { data: any; w: number; h: number }) {
    const color = data.color || '#94a3b8'
    const isCompact = w <= 80

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            style={{
                width: w, height: h,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: isCompact ? '4px' : '8px 12px',
                fontFamily: "'Architects Daughter', cursive",
            }}
        >
            {/* Title */}
            {data.label && (
                <div style={{
                    fontSize: isCompact ? 7 : 14,
                    fontWeight: 700,
                    color,
                    lineHeight: 1.2,
                    textAlign: isCompact ? 'center' : 'left',
                }}>
                    {data.label}
                </div>
            )}

            {/* Content / markdown-like body */}
            {data.content && !isCompact && (
                <div style={{
                    fontSize: 10,
                    color: `${color}cc`,
                    lineHeight: 1.5,
                    marginTop: 4,
                    overflow: 'hidden',
                }}>
                    {data.content}
                </div>
            )}

            {/* Image */}
            {data.image && !isCompact && (
                <div style={{
                    marginTop: 6,
                    borderRadius: 6,
                    overflow: 'hidden',
                    maxHeight: h - 40,
                }}>
                    <img
                        src={data.image}
                        alt={data.label || 'label image'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }}
                    />
                </div>
            )}
        </motion.div>
    )
}

// ── Main NoteNode component ─────────────────────────────────────────────────────

export function InformerNode({ data }: { data: any }) {
    const w = data.width || 160
    const h = data.height || 100
    const subType = data.subType || 'sticker'

    return (
        <BaseNode data={data} type="informer" subType={subType}>
            <div style={{ position: 'relative' }}>
                <Handle type="target" position={Position.Left} style={{
                    background: 'transparent', border: 'none', width: 1, height: 1,
                }} />
                <Handle type="source" position={Position.Right} style={{
                    background: 'transparent', border: 'none', width: 1, height: 1,
                }} />

                {subType === 'sticker' && <StickerNote data={data} w={w} h={h} />}
                {subType === 'group-note' && <GroupNoteNode data={data} w={w} h={h} />}
                {subType === 'label' && <LabelNode data={data} w={w} h={h} />}
            </div>
        </BaseNode>
    )
}
