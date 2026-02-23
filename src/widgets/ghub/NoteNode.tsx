import { Handle, Position } from '@xyflow/react'

/**
 * NoteNode (ghub) — annotation nodes for documentation and visual markers.
 *
 * Supports 3 variants via data.noteType:
 *   'sticker' — Release note card with version, changelog, badges
 *   'group'   — Section header with description
 *   'label'   — Small inline label/badge
 *
 * data.label    — title / version
 * data.content  — markdown-like content
 * data.color    — accent color
 * data.width    — width in px
 * data.height   — height in px
 */

// ── GitHub color tokens ─────────────────────────────────────────────────────────

const gh = {
    bg: '#0d1117',
    bgCard: '#161b22',
    border: '#30363d',
    borderMuted: '#21262d',
    fg: '#e6edf3',
    fgMuted: '#8b949e',
    fgSubtle: '#6e7681',
    green: '#3fb950',
    accent: '#58a6ff',
}

const ghLight = {
    bg: '#ffffff',
    bgCard: '#f6f8fa',
    border: '#d0d7de',
    borderMuted: '#d8dee4',
    fg: '#1f2328',
    fgMuted: '#656d76',
    fgSubtle: '#6e7681',
    green: '#1a7f37',
    accent: '#0969da',
}

const ghFont = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif" }

// ── Badge helper ────────────────────────────────────────────────────────────────

function Badge({ label, msg, color }: { label: string; msg: string; color: string }) {
    return (
        <div style={{ display: 'inline-flex', borderRadius: 3, overflow: 'hidden', fontSize: 9, fontWeight: 700, lineHeight: 1, ...ghFont }}>
            <span style={{ background: '#555', color: '#fff', padding: '3px 5px' }}>{label}</span>
            <span style={{ background: color, color: '#fff', padding: '3px 5px' }}>{msg}</span>
        </div>
    )
}

// ── Sticker variant — Release Note style ────────────────────────────────────────

function StickerNote({ data, w, h }: { data: any; w: number; h: number }) {
    const c = data.dayMode ? ghLight : gh
    const version = data.label || 'v1.0.0'
    const isCompact = w <= 60

    if (isCompact) {
        return (
            <div style={{
                width: w, height: h,
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...ghFont,
            }}>
                <Handle type="target" position={Position.Left} style={{ background: c.accent, width: 6, height: 6 }} />
                <Handle type="source" position={Position.Right} style={{ background: c.fgMuted, width: 6, height: 6 }} />
                <span style={{ fontSize: 10 }}>🏷️</span>
            </div>
        )
    }

    // Changelog items
    const changes = data.changes || [
        '✨ New feature: dashboard widgets',
        '🐛 Fix: connection timeout on slow networks',
        '📦 Upgrade to React 19',
        '🔧 Improve build performance by 35%',
    ]

    return (
        <div style={{
            width: w, height: h,
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            padding: 12,
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
            ...ghFont,
        }}>
            <Handle type="target" position={Position.Left} style={{ background: c.accent, width: 8, height: 8 }} />
            <Handle type="source" position={Position.Right} style={{ background: c.fgMuted, width: 8, height: 8 }} />

            {/* Header: tag icon + version + latest badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: c.green }}>🏷️</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.fg }}>{version}</span>
                <span style={{
                    fontSize: 9, fontWeight: 600,
                    color: '#fff', background: c.green,
                    padding: '1px 6px', borderRadius: 10,
                }}>
                    latest
                </span>
            </div>

            {/* Changelog */}
            <div style={{ fontSize: 10, color: c.fg, lineHeight: 1.7, flex: 1, overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, marginBottom: 3 }}>What's Changed</div>
                {changes.map((item: string, i: number) => (
                    <div key={i} style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {item}
                    </div>
                ))}
            </div>

            {/* Footer badges */}
            <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                <Badge label="assets" msg={String(data.assets || 3)} color="#007ec6" />
                <Badge label="contributors" msg={String(data.contributors || 5)} color="#007ec6" />
            </div>
        </div>
    )
}

// ── Group Note variant ──────────────────────────────────────────────────────────

function GroupNoteNode({ data, w, h }: { data: any; w: number; h: number }) {
    const c = data.dayMode ? ghLight : gh

    if (w <= 60) {
        return (
            <div style={{
                width: w, height: h,
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                ...ghFont,
            }}>
                <span style={{ fontSize: 10 }}>📝</span>
            </div>
        )
    }

    return (
        <div style={{
            width: w, height: h,
            background: c.bgCard,
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            padding: 12,
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box',
            ...ghFont,
        }}>
            <Handle type="target" position={Position.Left} style={{ background: c.accent, width: 8, height: 8 }} />
            <Handle type="source" position={Position.Right} style={{ background: c.fgMuted, width: 8, height: 8 }} />

            <div style={{ fontSize: 12, fontWeight: 600, color: c.fg, marginBottom: 4 }}>
                {data.label || 'Note'}
            </div>
            <div style={{
                fontSize: 10, color: c.fgMuted, lineHeight: 1.5,
                flex: 1, overflow: 'hidden',
            }}>
                {data.content || 'Add notes and documentation here'}
            </div>
        </div>
    )
}

// ── Label variant ───────────────────────────────────────────────────────────────

function LabelNode({ data, w, h }: { data: any; w: number; h: number }) {
    const c = data.dayMode ? ghLight : gh

    return (
        <div style={{
            width: w, height: h,
            background: c.bgCard,
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px 10px',
            boxSizing: 'border-box',
            ...ghFont,
        }}>
            <Handle type="target" position={Position.Left} style={{ background: c.accent, width: 6, height: 6 }} />
            <Handle type="source" position={Position.Right} style={{ background: c.fgMuted, width: 6, height: 6 }} />

            <span style={{
                fontSize: 10, fontWeight: 600, color: c.fg,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {data.label || 'Label'}
            </span>
        </div>
    )
}

// ── Main NoteNode component ─────────────────────────────────────────────────────

export function NoteNode({ data }: { data: any }) {
    const noteType = data.noteType || 'sticker'
    const w = data.width || 240
    const h = data.height || 160

    switch (noteType) {
        case 'group':
            return <GroupNoteNode data={data} w={w} h={h} />
        case 'label':
            return <LabelNode data={data} w={w} h={h} />
        default:
            return <StickerNote data={data} w={w} h={h} />
    }
}
