import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { BaseNode } from '@/widgets/BaseNode'

/**
 * NoteNode (pixel) — Terminal-style sticky note / annotation.
 *
 * Variants:
 *   'sticker'    — ASCII-art bordered post-it note
 *   'group-note' — Group header with dashed border
 *   'label'      — Minimal inline label
 *
 * data.variant   — 'sticker' | 'group-note' | 'label'
 * data.label     — title text
 * data.content   — body text
 * data.color     — 'yellow' | 'pink' | 'green' | 'blue' | 'purple'
 * data.width / data.height — dimensions
 */

// ── Color palettes ──────────────────────────────────────────────────────────────

const STICKER_COLORS: Record<string, { bg: string; text: string; border: string; accent: string }> = {
    yellow: { bg: '#1a1800', text: '#fbbf24', border: '#6b5b00', accent: '#fbbf24' },
    pink: { bg: '#1a0012', text: '#f472b6', border: '#6b004e', accent: '#f472b6' },
    green: { bg: '#001a0a', text: '#4ade80', border: '#006b2e', accent: '#4ade80' },
    blue: { bg: '#00101a', text: '#60a5fa', border: '#003d6b', accent: '#60a5fa' },
    purple: { bg: '#0f001a', text: '#c084fc', border: '#3d006b', accent: '#c084fc' },
}

function getPalette(color?: string) {
    if (color && STICKER_COLORS[color]) return STICKER_COLORS[color]
    return STICKER_COLORS.yellow
}

// ── Sticker variant ─────────────────────────────────────────────────────────────

function StickerNote({ data, w, h }: { data: any; w: number; h: number }) {
    const palette = getPalette(data.color)
    const isCompact = w <= 80
    const pixelFont = data.tuiMode
        ? "'Courier New', Courier, monospace"
        : "'Press Start 2P', monospace"

    // ASCII art top border
    const topBorder = '╔' + '═'.repeat(Math.max(2, Math.floor((w - 24) / 8))) + '╗'
    const bottomBorder = '╚' + '═'.repeat(Math.max(2, Math.floor((w - 24) / 8))) + '╝'

    if (isCompact) {
        return (
            <div style={{
                width: w, height: h,
                background: palette.bg,
                border: `2px solid ${palette.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: pixelFont,
                boxSizing: 'border-box',
            }}>
                <span style={{ fontSize: 16 }}>📌</span>
            </div>
        )
    }

    return (
        <div style={{
            width: w, height: h,
            background: palette.bg,
            border: `2px solid ${palette.border}`,
            fontFamily: pixelFont,
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden',
        }}>
            {/* ASCII header */}
            <div style={{
                fontSize: 7, color: palette.border,
                lineHeight: 1, padding: '2px 4px 0',
                whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
                {topBorder}
            </div>

            {/* Title */}
            <div style={{
                padding: '2px 8px',
                fontSize: 9, fontWeight: 700,
                color: palette.accent,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
                📌 {data.label || 'NOTE'}
            </div>

            {/* Divider */}
            <div style={{
                height: 1, background: palette.border,
                margin: '2px 6px',
            }} />

            {/* Content */}
            <div style={{
                flex: 1, padding: '4px 8px',
                fontSize: 8, color: palette.text,
                lineHeight: '12px',
                overflow: 'hidden',
                opacity: 0.85,
            }}>
                {data.content || '...'}
            </div>

            {/* ASCII footer */}
            <div style={{
                fontSize: 7, color: palette.border,
                lineHeight: 1, padding: '0 4px 2px',
                whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
                {bottomBorder}
            </div>
        </div>
    )
}

// ── Group Note variant ──────────────────────────────────────────────────────────

function GroupNote({ data, w, h }: { data: any; w: number; h: number }) {
    const palette = getPalette(data.color || 'blue')
    const pixelFont = data.tuiMode
        ? "'Courier New', Courier, monospace"
        : "'Press Start 2P', monospace"

    return (
        <div style={{
            width: w, height: h,
            background: `${palette.bg}88`,
            border: `2px dashed ${palette.border}`,
            fontFamily: pixelFont,
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
        }}>
            {/* Header */}
            <div style={{
                padding: '4px 8px',
                fontSize: 9, fontWeight: 700,
                color: palette.accent,
                textTransform: 'uppercase',
                borderBottom: `1px dashed ${palette.border}`,
            }}>
                {'['} {data.label || 'GROUP'} {']'}
            </div>

            {/* Content area */}
            <div style={{
                flex: 1, padding: '4px 8px',
                fontSize: 8, color: palette.text,
                lineHeight: '12px',
                opacity: 0.7,
            }}>
                {data.content || ''}
            </div>
        </div>
    )
}

// ── Label variant ───────────────────────────────────────────────────────────────

function LabelNote({ data, w, h }: { data: any; w: number; h: number }) {
    const palette = getPalette(data.color || 'green')
    const pixelFont = data.tuiMode
        ? "'Courier New', Courier, monospace"
        : "'Press Start 2P', monospace"

    return (
        <div style={{
            width: w, height: h,
            background: 'transparent',
            borderLeft: `3px solid ${palette.accent}`,
            fontFamily: pixelFont,
            display: 'flex', alignItems: 'center',
            padding: '0 8px',
            boxSizing: 'border-box',
        }}>
            <span style={{
                fontSize: 8, color: palette.text,
                fontWeight: 700,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
                {'>'} {data.label || 'LABEL'}
            </span>
        </div>
    )
}

// ── Main NoteNode ───────────────────────────────────────────────────────────────

export function InformerNode({ data }: { data: any }) {
    const w = data.width || 160
    const h = data.height || 100
    const subType = data.subType || 'sticker'
    const hasKnock = !!data.knockSide
    const kColor = data.knockColor || '#f97316'
    const knockAnimation = hasKnock
        ? data.knockSide === 'out'
            ? { borderRightColor: ['transparent', kColor, 'transparent'] }
            : { borderLeftColor: ['transparent', kColor, 'transparent'] }
        : {}
    const knockTransition = hasKnock
        ? { repeat: Infinity, duration: 0.5, ease: 'easeOut' as const, times: [0, 0.7, 1] }
        : {}

    return (
        <BaseNode data={data} type="informer" subType={subType}>
            <motion.div
                animate={knockAnimation}
                transition={knockTransition}
                style={{ position: 'relative' }}
            >
                <Handle type="target" position={Position.Left} id="in" style={{
                    background: '#fbbf24', border: '2px solid #fbbf2455', width: 6, height: 6, borderRadius: 0,
                }} />
                <Handle type="source" position={Position.Right} id="out" style={{
                    background: '#666', border: '2px solid #33333355', width: 6, height: 6, borderRadius: 0,
                }} />

                {subType === 'sticker' && <StickerNote data={data} w={w} h={h} />}
                {subType === 'group-note' && <GroupNote data={data} w={w} h={h} />}
                {subType === 'label' && <LabelNote data={data} w={w} h={h} />}
            </motion.div>
        </BaseNode>
    )
}
