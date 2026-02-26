/**
 * Widget Gallery — interactive preview of all widgets across themes.
 *
 * Layout:
 *   ┌──────────┬─────────┬─────────┬─────────┐
 *   │ Widget   │ WibeGlow│  GitHub │  Pixel  │
 *   │ Selector │ (theme) │ (theme) │ (theme) │
 *   │          │ s/m/l   │ s/m/l   │ s/m/l   │
 *   └──────────┴─────────┴─────────┴─────────┘
 *
 * State controls: idle / waking / running / done + knock side.
 */

import { useState, useCallback } from 'react'
import { ReactFlow, ReactFlowProvider, type Node, type Edge, Handle, Position } from '@xyflow/react'
import { WidgetPicker } from '@/flow-studio'
import {
    widgetRegistry,
    type WidgetDefinition,
    GRID_CELL,
} from '@/engine/widget-registry'
import {
    presetRegistry,
    type PresetDefinition,
} from '@/engine/preset-registry'
import { templateRegistry, type TemplateName } from '@/templates/template-registry'

// Theme node components — use unified JobNode/InformerNode directly
import { JobNode as WibeGlowJob, GroupNode as WibeGlowGroup, InformerNode as WibeGlowInformer, ExpectationNode as WibeGlowExpectation, UserNode as WibeGlowUser, StartingNode as WibeGlowStarting, SubFlowNode as WibeGlowSubFlow } from '@/widgets/wibeglow'
import { JobNode as PixelJob, InformerNode as PixelInformer } from '@/widgets/pixel'
import { JobNode as GhubJob, InformerNode as GhubInformer } from '@/widgets/ghub'
import { RawNode } from '@/widgets/RawNode'

// ── Status + knock controls ────────────────────────────────────────────────────

type Status = 'idle' | 'waking' | 'running' | 'done' | 'error'
type KnockSide = null | 'in' | 'out'
type CommSide = null | 'left' | 'right'

const STATUSES: Status[] = ['idle', 'waking', 'running', 'done', 'error']
const KNOCK_OPTIONS: { label: string; value: KnockSide }[] = [
    { label: 'None', value: null },
    { label: '← In', value: 'in' },
    { label: 'Out →', value: 'out' },
]
const COMM_OPTIONS: { label: string; value: CommSide }[] = [
    { label: 'None', value: null },
    { label: '← Emit', value: 'left' },
    { label: 'Emit →', value: 'right' },
]

// ── Mini ReactFlow node types ───────────────────────────────────────────────────

/** Tiny dot node — just a circle with handles */
function DotNode({ data }: { data: { color?: string; side: 'left' | 'right' } }) {
    const c = data.color || '#64748b'
    return (
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, position: 'relative' }}>
            {data.side === 'left' && (
                <Handle type="source" position={Position.Right} style={{ background: c, border: 'none', width: 4, height: 4, right: -2 }} />
            )}
            {data.side === 'right' && (
                <Handle type="target" position={Position.Left} style={{ background: c, border: 'none', width: 4, height: 4, left: -2 }} />
            )}
        </div>
    )
}

/** Wrapper node — renders the actual widget component inside ReactFlow */
function WidgetWrapperNode({ data }: { data: { component: React.ComponentType<any>; widgetData: Record<string, any> } }) {
    const Component = data.component
    return (
        <div style={{ position: 'relative' }}>
            <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 1, height: 1 }} />
            <Handle type="source" position={Position.Right} style={{ opacity: 0, width: 1, height: 1 }} />
            <Component data={data.widgetData} />
        </div>
    )
}

const MINI_NODE_TYPES = {
    dot: DotNode,
    widget: WidgetWrapperNode,
}

// ── Size definitions ────────────────────────────────────────────────────────────

interface SizeDef { label: string; width: number; height: number; gridLabel: string }

function getSizes(widget: WidgetDefinition): SizeDef[] {
    // S = compact icon (3×3 grid = 60×60px — meets 44pt touch target for iPad)
    const iconSize = GRID_CELL * 3
    return [
        { label: 'S', width: iconSize, height: iconSize, gridLabel: '3×3' },
        { label: 'M', width: widgetRegistry.getDefaultWidthPx(widget.type), height: widgetRegistry.getDefaultHeightPx(widget.type), gridLabel: `${Math.round(widgetRegistry.getDefaultWidthPx(widget.type) / GRID_CELL)}×${Math.round(widgetRegistry.getDefaultHeightPx(widget.type) / GRID_CELL)}` },
        { label: 'L', width: widgetRegistry.getDefaultWidthPx(widget.type) * 1.5, height: widgetRegistry.getDefaultHeightPx(widget.type) * 2, gridLabel: `${Math.round(widgetRegistry.getDefaultWidthPx(widget.type) * 1.5 / GRID_CELL)}×${Math.round(widgetRegistry.getDefaultHeightPx(widget.type) * 2 / GRID_CELL)}` },
    ]
}

// ── Component resolver ──────────────────────────────────────────────────────────

type ThemeComponents = Record<TemplateName, Record<string, React.ComponentType<any>>>

const THEME_COMPONENTS: ThemeComponents = {
    wibeglow: {
        job: WibeGlowJob,
        group: WibeGlowGroup,
        note: WibeGlowInformer,
        expectation: WibeGlowExpectation,
        user: WibeGlowUser,
        starting: WibeGlowStarting,
        subflow: WibeGlowSubFlow,
    },
    pixel: {
        job: PixelJob,
        note: PixelInformer,
    },
    ghub: {
        job: GhubJob,
        note: GhubInformer,
    },
}

function getComponent(theme: TemplateName, widgetType: string): React.ComponentType<any> | null {
    return THEME_COMPONENTS[theme]?.[widgetType] || null
}

// ── Build data for a widget at given state ──────────────────────────────────────

function buildData(
    widget: WidgetDefinition,
    template: PresetDefinition,
    status: Status,
    knockSide: KnockSide,
    width: number,
    height: number,
    progress: number,
    activeSubType?: string,
): Record<string, any> {
    const subType = activeSubType || template.defaultData.subType
    const isAI = subType === 'ai'
    const isScript = ['js', 'ts', 'sh', 'py'].includes(subType || '')

    const base: Record<string, any> = {
        ...template.defaultData,
        label: template.defaultData.label || template.label,
        subType,
        width,
        height,
        knockSide,
        state: {
            ...(template.defaultData.state || {}),
            status,
        },
    }

    // Job: AI agent
    if (widget.type === 'job' && isAI) {
        base.agent = template.defaultData.agent || 'Claude 3.5'
        base.color = template.defaultData.color || widget.ui.color
        base.task = status !== 'idle' ? 'Processing authentication module...' : undefined
        base.state = {
            ...base.state,
            thought: status === 'running' ? 'Analyzing auth patterns...' : status === 'done' ? 'Task complete!' : undefined,
            progress,
            execTime: status === 'done' ? '4.2s' : status === 'running' ? '1.3s' : '—',
            callsCount: status === 'done' ? 7 : status === 'running' ? 3 : 0,
        }
        base.totalRuns = status === 'done' ? 42 : status === 'running' ? 41 : 40
        base.logs = status === 'running'
            ? ['⚡ tool_call: search("auth patterns")', '← result: 5 patterns found', '⚡ tool_call: analyze(patterns)']
            : status === 'done'
                ? ['⚡ tool_call: search("auth")', '← 5 patterns found', '⚡ tool_call: analyze()', '← OAuth2 + JWT', '📦 auth-plan.md', '✓ Complete']
                : []
    }

    // Job: script
    if (widget.type === 'job' && isScript) {
        const langLabels: Record<string, string> = { js: 'JavaScript', ts: 'TypeScript', sh: 'Shell', py: 'Python' }
        base.agent = langLabels[subType || 'js'] || subType
        base.language = subType
        base.color = widget.subTypes?.find(s => s.value === subType)?.color || widget.ui.color
        base.configured = true
        base.code = template.defaultData.code || '// empty'
        base.logs = status === 'done' ? ['> Running...', 'Output: hello', '> Done ✓'] : status === 'running' ? ['> Running...'] : []
        base.state = {
            ...base.state,
            status: status === 'running' ? 'running' : status === 'done' ? 'done' : 'idle',
            execTime: status === 'done' ? '1.8s' : status === 'running' ? '0.6s' : '—',
            callsCount: status === 'done' ? 3 : status === 'running' ? 1 : 0,
            progress,
        }
        base.totalRuns = status === 'done' ? 18 : status === 'running' ? 17 : 16
    }

    // Group-specific
    if (widget.type === 'group') {
        base.color = template.defaultData.color || widget.ui.color
    }

    // Note-specific
    if (widget.type === 'informer') {
        base.subType = subType || 'sticker'
        base.color = template.defaultData.color || widget.ui.color
        base.content = template.defaultData.content || ''
    }

    // Expectation-specific
    if (widget.type === 'expectation') {
        base.subType = subType || 'artifact'
        base.target = template.defaultData.target || ''
        base.state = {
            ...base.state,
            status: status === 'done' ? 'pass' : status === 'running' ? 'pending' : status === 'waking' ? 'fail' : 'pending',
        }
    }

    return base
}

// ── Main Component ──────────────────────────────────────────────────────────────

export function TestWidgetsPage() {
    return (
        <ReactFlowProvider>
            <WidgetGalleryInner />
        </ReactFlowProvider>
    )
}

function WidgetGalleryInner() {
    const [selectedWidget, setSelectedWidget] = useState<WidgetDefinition | null>(widgetRegistry.get('job') ?? null)
    const [selectedTemplate, setSelectedTemplate] = useState<PresetDefinition | null>(
        presetRegistry.getDefault('job', widgetRegistry.get('job')?.defaultPreset) ?? null
    )
    const [status, setStatus] = useState<Status>('idle')
    const [knockSide, setKnockSide] = useState<KnockSide>(null)
    const [progress, setProgress] = useState(0)
    const [showConnections, setShowConnections] = useState(true)
    const [showAnimations, setShowAnimations] = useState(true)
    const [showThinking, setShowThinking] = useState(false)
    const [commSide, setCommSide] = useState<CommSide>(null)
    const [ghubDay, setGhubDay] = useState(false)      // GHub: day/night (dark default)
    const [wibeglowStatic, setWibeglowStatic] = useState(false) // WibeGlow: animated/static
    const [pixelTui, setPixelTui] = useState(false)     // Pixel: pixel/TUI
    const [activeSubType, setActiveSubType] = useState<string | undefined>('ai')
    const [showRaw, setShowRaw] = useState(false)
    const [debugMode, setDebugMode] = useState(false)

    const themes = templateRegistry.getAll()

    const handleSelect = useCallback((widget: WidgetDefinition, template: PresetDefinition) => {
        setSelectedWidget(widget)
        setSelectedTemplate(template)
        setStatus('idle')
        setKnockSide(null)
        setProgress(0)
        // Set first subType if available
        setActiveSubType(widget.subTypes?.[0]?.value ?? template.defaultData.subType)
    }, [])

    const sizes = selectedWidget ? getSizes(selectedWidget) : []

    return (
        <div style={{
            height: '100%', display: 'flex', overflow: 'hidden',
            background: '#0a0a14',
        }}>
            {/* CSS: hide handles on standalone widgets + reverse-animated edge direction */}
            <style>{`
                .hide-handles .react-flow__handle { display: none !important; }
                .mini-flow .react-flow__edge.animated path.react-flow__edge-path {
                    stroke-dasharray: 6 4;
                }
                .mini-flow .react-flow__edge.reverse-animated path.react-flow__edge-path {
                    animation-direction: reverse !important;
                }
                .mini-flow .react-flow__renderer { overflow: visible !important; }
                .mini-flow .react-flow__node { cursor: default !important; }
            `}</style>
            {/* Left: WidgetSelector */}
            <div style={{
                width: 260, flexShrink: 0,
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                <WidgetPicker
                    rectSize={{ width: 200, height: 120 }}
                    onSelect={handleSelect as any}
                    onCancel={() => { }}
                    embedded
                />

                {/* RawNode debug panel — always visible below picker */}
                {selectedWidget && selectedTemplate && (
                    <div style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        padding: 8,
                        flexShrink: 0,
                    }}>
                        <div style={{
                            fontSize: 8, fontWeight: 700, color: '#475569',
                            fontFamily: "'JetBrains Mono', monospace",
                            marginBottom: 4, textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>Raw State</div>
                        <RawNode data={buildData(
                            selectedWidget, selectedTemplate,
                            status, knockSide,
                            240, 180,
                            progress, activeSubType,
                        )} />
                    </div>
                )}
            </div>

            {/* Center: Preview area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Theme panes */}
                {selectedWidget && selectedTemplate ? (
                    <div style={{
                        flex: 1, display: 'flex', overflow: 'hidden',
                    }}>
                        {themes.map((theme, ti) => {
                            const Component = getComponent(theme.name, selectedWidget.type)
                            // GHub day/night: swap colors when in day mode
                            const useLight = theme.name === 'ghub' && ghubDay && theme.colorsLight
                            const activeColors = useLight ? theme.colorsLight! : theme.colors
                            return (
                                <div
                                    key={theme.name}
                                    style={{
                                        flex: 1,
                                        background: activeColors.bg,
                                        borderRight: ti < themes.length - 1 ? `1px solid ${activeColors.border}` : 'none',
                                        display: 'flex', flexDirection: 'column',
                                        overflow: 'auto',
                                        transition: 'background 0.3s ease',
                                    }}
                                >
                                    {/* Theme header */}
                                    <div style={{
                                        padding: '8px 16px',
                                        borderBottom: `1px solid ${activeColors.border}`,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        flexShrink: 0,
                                    }}>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: activeColors.accent,
                                        }} />
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            color: activeColors.text,
                                            fontFamily: theme.fonts.heading,
                                        }}>
                                            {theme.label}
                                        </span>
                                        <span style={{
                                            fontSize: 8, color: activeColors.textMuted,
                                            fontFamily: theme.fonts.mono,
                                            padding: '1px 6px', borderRadius: 3,
                                            background: `${activeColors.accent}15`,
                                        }}>
                                            {theme.animationLevel}
                                        </span>
                                        {/* Day/Night toggle for GHub */}
                                        {theme.supportsLightMode && (
                                            <button
                                                data-testid="ghub-day-night"
                                                onClick={() => setGhubDay(!ghubDay)}
                                                style={{
                                                    marginLeft: 'auto',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    fontSize: 12, padding: '2px 4px', borderRadius: 4,
                                                    color: activeColors.textMuted,
                                                }}
                                                title={ghubDay ? 'Switch to night' : 'Switch to day'}
                                            >
                                                {ghubDay ? '☀️' : '🌙'}
                                            </button>
                                        )}
                                        {/* Animated/Static toggle for WibeGlow */}
                                        {theme.name === 'wibeglow' && (
                                            <button
                                                data-testid="wibeglow-mode"
                                                onClick={() => setWibeglowStatic(!wibeglowStatic)}
                                                style={{
                                                    marginLeft: theme.supportsLightMode ? 0 : 'auto',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    fontSize: 12, padding: '2px 4px', borderRadius: 4,
                                                    color: activeColors.textMuted,
                                                }}
                                                title={wibeglowStatic ? 'Switch to animated' : 'Switch to static'}
                                            >
                                                {wibeglowStatic ? '⚡' : '✨'}
                                            </button>
                                        )}
                                        {/* Pixel/TUI toggle for Pixel */}
                                        {theme.name === 'pixel' && (
                                            <button
                                                data-testid="pixel-mode"
                                                onClick={() => setPixelTui(!pixelTui)}
                                                style={{
                                                    marginLeft: 'auto',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    fontSize: 12, padding: '2px 4px', borderRadius: 4,
                                                    color: activeColors.textMuted,
                                                }}
                                                title={pixelTui ? 'Switch to pixel' : 'Switch to TUI'}
                                            >
                                                {pixelTui ? '🖥️' : '🎮'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Size variants */}
                                    {(Component && !showRaw) ? (
                                        <div style={{
                                            padding: 16, display: 'flex', flexDirection: 'column',
                                            gap: 24, alignItems: 'center',
                                        }}>
                                            {sizes.map(size => {
                                                const data = buildData(
                                                    selectedWidget, selectedTemplate,
                                                    showAnimations ? status : (status === 'waking' ? 'idle' : status),
                                                    showAnimations ? knockSide : null,
                                                    size.width, size.height,
                                                    progress,
                                                    activeSubType,
                                                )
                                                // Add thought/log data when thinking toggle is on
                                                if (showThinking) {
                                                    if (activeSubType === 'ai') {
                                                        data.state = { ...data.state, thought: status === 'running' ? 'Analyzing auth patterns...' : status === 'done' ? 'Task complete!' : undefined }
                                                    } else if (['js', 'ts', 'sh', 'py'].includes(activeSubType || '')) {
                                                        data.logs = ['$ compiling...', 'Output: hello world', '> Done ✓']
                                                    }
                                                }

                                                // Debug mode overlay
                                                if (debugMode) {
                                                    data.debugMode = true
                                                    data._debugId = `${selectedWidget.type}-${size.label}`
                                                }

                                                // Pass theme metadata for ctx.ui
                                                data._themeName = theme.name
                                                data._themeType = 'night' // default
                                                // Pass dayMode to GHub theme nodes
                                                if (theme.name === 'ghub' && ghubDay) {
                                                    data.dayMode = true
                                                    data._themeType = 'day'
                                                }
                                                // Pass staticMode to WibeGlow nodes
                                                if (theme.name === 'wibeglow' && wibeglowStatic) {
                                                    data.staticMode = true
                                                    data._themeType = 'static'
                                                }
                                                // Pass tuiMode to Pixel nodes
                                                if (theme.name === 'pixel' && pixelTui) {
                                                    data.tuiMode = true
                                                    data._themeType = 'tui'
                                                }

                                                const connLineLen = size.label === 'S' ? 60 : 40
                                                // Compact nodes render extra text below the box (name label ~14px + margin ~4px)
                                                // so the actual Handle center is lower than size.height/2
                                                const isCompactSize = size.label === 'S'
                                                const dotY = isCompactSize ? (size.height / 2 + 6) : (size.height / 2 - 3)
                                                const canvasW = connLineLen + size.width + connLineLen + 40
                                                const canvasH = isCompactSize ? size.height + 50 : Math.max(size.height + 40, 80)

                                                // Determine edge animation states
                                                const isKnockIn = showAnimations && status === 'waking' && knockSide === 'in'
                                                const isKnockOut = showAnimations && status === 'waking' && knockSide === 'out'
                                                const isCommLeft = showAnimations && commSide === 'left'
                                                const isCommRight = showAnimations && commSide === 'right'
                                                const inActive = isKnockIn || isCommLeft
                                                const outActive = isKnockOut || isCommRight

                                                // Edge colors
                                                const inColor = isKnockIn ? '#f97316' : isCommLeft ? '#06b6d4' : theme.colors.accent
                                                const outColor = isKnockOut ? '#f97316' : isCommRight ? '#06b6d4' : theme.colors.textMuted

                                                // Knocking flows TOWARD node = normal direction
                                                // Communicating flows AWAY from node = reverse direction
                                                const inReverse = isCommLeft
                                                const outReverse = isKnockOut

                                                const miniNodes: Node[] = [
                                                    {
                                                        id: 'dot-in', type: 'dot',
                                                        position: { x: 0, y: dotY },
                                                        data: { color: inColor, side: 'left' },
                                                        draggable: false, selectable: false,
                                                    },
                                                    {
                                                        id: 'widget', type: 'widget',
                                                        position: { x: connLineLen + 10, y: 0 },
                                                        data: { component: Component, widgetData: data },
                                                        draggable: false, selectable: false,
                                                    },
                                                    {
                                                        id: 'dot-out', type: 'dot',
                                                        position: { x: connLineLen + 10 + size.width + connLineLen, y: dotY },
                                                        data: { color: outColor, side: 'right' },
                                                        draggable: false, selectable: false,
                                                    },
                                                ]

                                                const miniEdges: Edge[] = showConnections ? [
                                                    {
                                                        id: 'e-in', source: 'dot-in', target: 'widget',
                                                        animated: inActive,
                                                        className: inReverse ? 'reverse-animated' : undefined,
                                                        data: { testAnimated: inActive },
                                                        style: {
                                                            stroke: inColor,
                                                            strokeWidth: inActive ? 2.5 : 1.5,
                                                            strokeDasharray: inActive ? undefined : '3 3',
                                                            opacity: inActive ? 1 : 0.4,
                                                        },
                                                    },
                                                    {
                                                        id: 'e-out', source: 'widget', target: 'dot-out',
                                                        animated: outActive,
                                                        className: outReverse ? 'reverse-animated' : undefined,
                                                        data: { testAnimated: outActive },
                                                        style: {
                                                            stroke: outColor,
                                                            strokeWidth: outActive ? 2.5 : 1.5,
                                                            strokeDasharray: outActive ? undefined : '3 3',
                                                            opacity: outActive ? 1 : 0.4,
                                                        },
                                                    },
                                                ] : []

                                                return (
                                                    <div key={size.label} style={{
                                                        display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', gap: 6,
                                                    }}>
                                                        {/* Size label — below node */}
                                                        <div style={{
                                                            fontSize: 7, fontWeight: 700, color: theme.colors.textMuted,
                                                            fontFamily: theme.fonts.mono,
                                                            opacity: 0.5,
                                                            textAlign: 'center',
                                                        }}>
                                                            {size.label} · {size.gridLabel}
                                                        </div>

                                                        {/* Mini ReactFlow canvas */}
                                                        <div className="mini-flow" style={{ width: canvasW, height: canvasH }}>
                                                            <ReactFlowProvider>
                                                                <ReactFlow
                                                                    nodes={miniNodes}
                                                                    edges={miniEdges}
                                                                    nodeTypes={MINI_NODE_TYPES}
                                                                    nodesDraggable={false}
                                                                    nodesConnectable={false}
                                                                    elementsSelectable={false}
                                                                    panOnDrag={false}
                                                                    zoomOnScroll={false}
                                                                    zoomOnDoubleClick={false}
                                                                    zoomOnPinch={false}
                                                                    preventScrolling={false}
                                                                    proOptions={{ hideAttribution: true }}
                                                                    style={{ background: 'transparent' }}
                                                                />
                                                            </ReactFlowProvider>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        /* Fallback: RawNode with JSON state */
                                        <div style={{
                                            padding: 16, display: 'flex', flexDirection: 'column',
                                            gap: 24, alignItems: 'center',
                                        }}>
                                            {sizes.map(size => {
                                                const data = buildData(
                                                    selectedWidget, selectedTemplate,
                                                    showAnimations ? status : (status === 'waking' ? 'idle' : status),
                                                    showAnimations ? knockSide : null,
                                                    size.width, size.height,
                                                    progress, activeSubType,
                                                )
                                                return (
                                                    <div key={size.label} style={{
                                                        display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', gap: 6,
                                                    }}>
                                                        <div style={{
                                                            fontSize: 7, fontWeight: 700,
                                                            color: theme.colors.textMuted,
                                                            fontFamily: theme.fonts.mono,
                                                            opacity: 0.5, textAlign: 'center',
                                                        }}>
                                                            {size.label} · {size.gridLabel}
                                                        </div>
                                                        <RawNode data={data} />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#475569', fontSize: 12, fontFamily: 'Inter',
                    }}>
                        Select a widget from the left panel
                    </div>
                )}
            </div>

            {/* Right: Settings sidebar */}
            <div style={{
                width: 180, flexShrink: 0,
                borderLeft: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(15,15,26,0.95)',
                display: 'flex', flexDirection: 'column',
                overflow: 'auto',
                padding: '12px 10px',
                gap: 12,
            }}>
                {/* Selected widget info */}
                {selectedWidget && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 18 }}>{selectedWidget.ui.icons.default}</span>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: selectedWidget.ui.color, fontFamily: 'Inter' }}>
                                {selectedWidget.label}
                            </div>
                            <div style={{ fontSize: 8, color: '#64748b', fontFamily: 'Inter' }}>
                                {selectedTemplate?.label} · {selectedWidget.type}
                            </div>
                        </div>
                    </div>
                )}

                {/* SubType selector */}
                {selectedWidget?.subTypes && selectedWidget.subTypes.length > 1 && (
                    <div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>SubType</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {selectedWidget.subTypes.map(st => (
                                <button
                                    key={st.value}
                                    data-testid={`subtype-${st.value}`}
                                    onClick={() => setActiveSubType(st.value)}
                                    style={{
                                        padding: '3px 6px', borderRadius: 4,
                                        border: 'none', cursor: 'pointer',
                                        background: activeSubType === st.value ? `${st.color || '#8b5cf6'}33` : 'rgba(255,255,255,0.04)',
                                        color: activeSubType === st.value ? (st.color || '#8b5cf6') : '#64748b',
                                        fontSize: 8, fontWeight: 600,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        textTransform: 'uppercase' as const,
                                    }}
                                >
                                    {st.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Status */}
                <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Status</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {STATUSES.map(s => (
                            <button
                                key={s}
                                data-testid={`status-${s}`}
                                onClick={() => {
                                    setStatus(s)
                                    setProgress(s === 'done' ? 100 : s === 'running' ? 55 : s === 'waking' ? 10 : 0)
                                }}
                                style={{
                                    padding: '3px 6px', borderRadius: 4,
                                    border: 'none', cursor: 'pointer',
                                    background: status === s ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                                    color: status === s ? '#8b5cf6' : '#64748b',
                                    fontSize: 8, fontWeight: 600,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    textTransform: 'uppercase' as const,
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Knock */}
                <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Knock</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {KNOCK_OPTIONS.map(k => (
                            <button
                                key={k.label}
                                data-testid={`knock-${k.value || 'none'}`}
                                onClick={() => {
                                    setKnockSide(k.value)
                                    setCommSide(null)
                                    if (k.value) setStatus('waking')
                                }}
                                style={{
                                    padding: '3px 6px', borderRadius: 4,
                                    border: 'none', cursor: 'pointer',
                                    background: knockSide === k.value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                                    color: knockSide === k.value ? '#8b5cf6' : '#64748b',
                                    fontSize: 8, fontWeight: 600,
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {k.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comm */}
                <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Comm</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {COMM_OPTIONS.map(c => (
                            <button
                                key={c.label}
                                data-testid={`comm-${c.value || 'none'}`}
                                onClick={() => {
                                    setCommSide(c.value)
                                    setKnockSide(null)
                                    if (c.value && status === 'idle') setStatus('running')
                                }}
                                style={{
                                    padding: '3px 6px', borderRadius: 4,
                                    border: 'none', cursor: 'pointer',
                                    background: commSide === c.value ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)',
                                    color: commSide === c.value ? '#06b6d4' : '#64748b',
                                    fontSize: 8, fontWeight: 600,
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Progress */}
                <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Progress</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input
                            type="range"
                            min={0} max={100} value={progress}
                            onChange={e => setProgress(Number(e.target.value))}
                            style={{ flex: 1, accentColor: '#8b5cf6' }}
                        />
                        <span style={{ fontSize: 8, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", minWidth: 24 }}>
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* Separator */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                {/* Toggles */}
                <div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Display</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {[{ label: 'Connections', value: showConnections, set: setShowConnections },
                        { label: 'Animations', value: showAnimations, set: setShowAnimations },
                        { label: 'Thinking', value: showThinking, set: setShowThinking },
                        { label: 'Raw', value: showRaw, set: setShowRaw },
                        { label: '🐛 Debug', value: debugMode, set: setDebugMode },
                        ].map(toggle => (
                            <button
                                key={toggle.label}
                                onClick={() => toggle.set(!toggle.value)}
                                style={{
                                    padding: '4px 6px', borderRadius: 4,
                                    border: 'none', cursor: 'pointer',
                                    background: toggle.value ? 'rgba(139,92,246,0.15)' : 'transparent',
                                    color: toggle.value ? '#a78bfa' : '#64748b',
                                    fontSize: 9, fontWeight: 500,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ fontSize: 9, width: 12 }}>{toggle.value ? '☑' : '☐'}</span>
                                {toggle.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
