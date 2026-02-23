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
import { ReactFlowProvider } from '@xyflow/react'
import { WidgetSelector } from '@/components/WidgetSelector'
import {
    widgetRegistry,
    type WidgetDefinition,
    type WidgetTemplate,
    GRID_CELL,
} from '@/widgets/widget-registry'
import { templateRegistry, type TemplateName } from '@/templates/template-registry'

// Theme node components
import { AgentNode as WibeGlowAgent, ScriptNode as WibeGlowScript, GroupNode as WibeGlowGroup } from '@/widgets/wibeglow'
import { AgentNode as PixelAgent, ScriptNode as PixelScript } from '@/widgets/pixel'
import { AgentNode as GhubAgent, ScriptNode as GhubScript } from '@/widgets/ghub'

// ── Status + knock controls ────────────────────────────────────────────────────

type Status = 'idle' | 'waking' | 'running' | 'done'
type KnockSide = null | 'in' | 'out'

const STATUSES: Status[] = ['idle', 'waking', 'running', 'done']
const KNOCK_OPTIONS: { label: string; value: KnockSide }[] = [
    { label: 'None', value: null },
    { label: '← In', value: 'in' },
    { label: 'Out →', value: 'out' },
]

// ── Size definitions ────────────────────────────────────────────────────────────

interface SizeDef { label: string; width: number; height: number; gridLabel: string }

function getSizes(widget: WidgetDefinition): SizeDef[] {
    // S = square icon (2×2 grid = 40×40px)
    const iconSize = GRID_CELL * 2
    return [
        { label: 'S', width: iconSize, height: iconSize, gridLabel: '2×2' },
        { label: 'M', width: widget.defaultWidth, height: widget.defaultHeight, gridLabel: `${Math.round(widget.defaultWidth / GRID_CELL)}×${Math.round(widget.defaultHeight / GRID_CELL)}` },
        { label: 'L', width: widget.defaultWidth * 1.5, height: widget.defaultHeight * 1.5, gridLabel: `${Math.round(widget.defaultWidth * 1.5 / GRID_CELL)}×${Math.round(widget.defaultHeight * 1.5 / GRID_CELL)}` },
    ]
}

// ── Component resolver ──────────────────────────────────────────────────────────

type ThemeComponents = Record<TemplateName, Record<string, React.ComponentType<any>>>

const THEME_COMPONENTS: ThemeComponents = {
    wibeglow: {
        agent: WibeGlowAgent,
        'script-js': WibeGlowScript,
        'script-ts': WibeGlowScript,
        'script-sh': WibeGlowScript,
        'script-py': WibeGlowScript,
        group: WibeGlowGroup,
    },
    pixel: {
        agent: PixelAgent,
        'script-js': PixelScript,
        'script-ts': PixelScript,
        'script-sh': PixelScript,
        'script-py': PixelScript,
    },
    ghub: {
        agent: GhubAgent,
        'script-js': GhubScript,
        'script-ts': GhubScript,
        'script-sh': GhubScript,
        'script-py': GhubScript,
    },
}

function getComponent(theme: TemplateName, widgetType: string): React.ComponentType<any> | null {
    return THEME_COMPONENTS[theme]?.[widgetType] || null
}

// ── Build data for a widget at given state ──────────────────────────────────────

function buildData(
    widget: WidgetDefinition,
    template: WidgetTemplate,
    status: Status,
    knockSide: KnockSide,
    width: number,
    height: number,
    progress: number,
): Record<string, any> {
    const base: Record<string, any> = {
        ...template.defaultData,
        label: template.defaultData.label || template.name,
        status,
        width,
        height,
        knockSide,
    }

    // Agent-specific
    if (widget.type === 'agent') {
        base.agent = template.defaultData.agent || 'Claude 3.5'
        base.color = template.defaultData.color || widget.color
        base.task = status !== 'idle' ? 'Processing authentication module...' : undefined
        base.progress = progress
        base.execTime = status === 'done' ? '4.2s' : '—'
        base.callsCount = status === 'done' ? 7 : status === 'running' ? 3 : 0
    }

    // Script-specific
    if (widget.type.startsWith('script-')) {
        base.configured = true
        base.code = template.defaultData.code || '// empty'
        base.logs = status === 'done' ? ['> Running...', 'Output: hello', '> Done ✓'] : []
        base.status = status === 'running' ? 'running' : status === 'done' ? 'done' : 'idle'
    }

    // Group-specific
    if (widget.type === 'group') {
        base.color = template.defaultData.color || widget.color
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
    const [selectedWidget, setSelectedWidget] = useState<WidgetDefinition | null>(widgetRegistry.get('agent') ?? null)
    const [selectedTemplate, setSelectedTemplate] = useState<WidgetTemplate | null>(
        widgetRegistry.get('agent')?.templates[0] ?? null
    )
    const [status, setStatus] = useState<Status>('idle')
    const [knockSide, setKnockSide] = useState<KnockSide>(null)
    const [progress, setProgress] = useState(0)

    const themes = templateRegistry.getAll()

    const handleSelect = useCallback((widget: WidgetDefinition, template: WidgetTemplate) => {
        setSelectedWidget(widget)
        setSelectedTemplate(template)
        setStatus('idle')
        setKnockSide(null)
        setProgress(0)
    }, [])

    const sizes = selectedWidget ? getSizes(selectedWidget) : []

    return (
        <div style={{
            height: '100%', display: 'flex', overflow: 'hidden',
            background: '#0a0a14',
        }}>
            {/* Left: WidgetSelector */}
            <div style={{
                width: 260, flexShrink: 0,
                borderRight: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                <WidgetSelector
                    rectSize={{ width: 200, height: 120 }}
                    onSelect={handleSelect as any}
                    onCancel={() => { }}
                    embedded
                />
            </div>

            {/* Right: Preview area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top: State controls */}
                <div style={{
                    padding: '8px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', gap: 16,
                    flexShrink: 0,
                    background: 'rgba(15,15,26,0.95)',
                }}>
                    {/* Selected widget info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
                        {selectedWidget && (
                            <>
                                <span style={{ fontSize: 18 }}>{selectedWidget.icon}</span>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedWidget.color, fontFamily: 'Inter' }}>
                                        {selectedWidget.label}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#64748b', fontFamily: 'Inter' }}>
                                        {selectedTemplate?.name} · {selectedWidget.type}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Status buttons */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: '#475569', fontFamily: 'Inter', fontWeight: 600, marginRight: 4 }}>Status</span>
                        {STATUSES.map(s => (
                            <button
                                key={s}
                                data-testid={`status-${s}`}
                                onClick={() => {
                                    setStatus(s)
                                    setProgress(s === 'done' ? 100 : s === 'running' ? 55 : s === 'waking' ? 10 : 0)
                                }}
                                style={{
                                    padding: '3px 8px', borderRadius: 4,
                                    border: 'none', cursor: 'pointer',
                                    background: status === s ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                                    color: status === s ? '#8b5cf6' : '#64748b',
                                    fontSize: 9, fontWeight: 600,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    textTransform: 'uppercase',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Knock buttons */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: '#475569', fontFamily: 'Inter', fontWeight: 600, marginRight: 4 }}>Knock</span>
                        {KNOCK_OPTIONS.map(k => (
                            <button
                                key={k.label}
                                data-testid={`knock-${k.value || 'none'}`}
                                onClick={() => {
                                    setKnockSide(k.value)
                                    if (k.value) setStatus('waking')
                                }}
                                style={{
                                    padding: '3px 8px', borderRadius: 4,
                                    border: 'none', cursor: 'pointer',
                                    background: knockSide === k.value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                                    color: knockSide === k.value ? '#8b5cf6' : '#64748b',
                                    fontSize: 9, fontWeight: 600,
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {k.label}
                            </button>
                        ))}
                    </div>

                    {/* Progress slider */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 9, color: '#475569', fontFamily: 'Inter', fontWeight: 600 }}>Progress</span>
                        <input
                            type="range"
                            min={0} max={100} value={progress}
                            onChange={e => setProgress(Number(e.target.value))}
                            style={{ width: 80, accentColor: '#8b5cf6' }}
                        />
                        <span style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", minWidth: 28 }}>
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* Theme panes */}
                {selectedWidget && selectedTemplate ? (
                    <div style={{
                        flex: 1, display: 'flex', overflow: 'hidden',
                    }}>
                        {themes.map((theme, ti) => {
                            const Component = getComponent(theme.name, selectedWidget.type)
                            return (
                                <div
                                    key={theme.name}
                                    style={{
                                        flex: 1,
                                        background: theme.colors.bg,
                                        borderRight: ti < themes.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                                        display: 'flex', flexDirection: 'column',
                                        overflow: 'auto',
                                    }}
                                >
                                    {/* Theme header */}
                                    <div style={{
                                        padding: '8px 16px',
                                        borderBottom: `1px solid ${theme.colors.border}`,
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        flexShrink: 0,
                                    }}>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: theme.colors.accent,
                                        }} />
                                        <span style={{
                                            fontSize: 11, fontWeight: 700,
                                            color: theme.colors.text,
                                            fontFamily: theme.fonts.heading,
                                        }}>
                                            {theme.label}
                                        </span>
                                        <span style={{
                                            fontSize: 8, color: theme.colors.textMuted,
                                            fontFamily: theme.fonts.mono,
                                            padding: '1px 6px', borderRadius: 3,
                                            background: `${theme.colors.accent}15`,
                                        }}>
                                            {theme.animationLevel}
                                        </span>
                                    </div>

                                    {/* Size variants */}
                                    {Component ? (
                                        <div style={{
                                            padding: 16, display: 'flex', flexDirection: 'column',
                                            gap: 24, alignItems: 'center',
                                        }}>
                                            {sizes.map(size => {
                                                const data = buildData(
                                                    selectedWidget, selectedTemplate,
                                                    status, knockSide,
                                                    size.width, size.height,
                                                    progress,
                                                )
                                                return (
                                                    <div key={size.label} style={{
                                                        display: 'flex', flexDirection: 'column',
                                                        alignItems: 'center', gap: 6,
                                                    }}>
                                                        {/* Size label */}
                                                        <div style={{
                                                            fontSize: 8, fontWeight: 700, color: theme.colors.textMuted,
                                                            fontFamily: theme.fonts.mono,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '1px',
                                                            display: 'flex', gap: 8, alignItems: 'center',
                                                        }}>
                                                            <span style={{
                                                                width: 18, height: 18, borderRadius: 4,
                                                                background: `${theme.colors.accent}15`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: 9, fontWeight: 800,
                                                                color: theme.colors.accent,
                                                            }}>
                                                                {size.label}
                                                            </span>
                                                            <span>{size.gridLabel}</span>
                                                            <span style={{ color: `${theme.colors.textMuted}88` }}>
                                                                {size.width}×{size.height}px
                                                            </span>
                                                        </div>

                                                        {/* Rendered widget */}
                                                        <div style={{
                                                            position: 'relative',
                                                            padding: 8,
                                                            borderRadius: 8,
                                                            border: `1px dashed ${theme.colors.border}`,
                                                            background: `${theme.colors.surface}88`,
                                                        }}>
                                                            <Component data={data} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        /* Fallback: widget not available in this theme */
                                        <div style={{
                                            flex: 1, display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            gap: 8, padding: 24,
                                        }}>
                                            <span style={{ fontSize: 32, opacity: 0.3 }}>🚧</span>
                                            <span style={{
                                                fontSize: 10, color: theme.colors.textMuted,
                                                fontFamily: theme.fonts.body, textAlign: 'center',
                                            }}>
                                                {selectedWidget.label} not yet available in {theme.label} theme
                                            </span>
                                            <span style={{
                                                fontSize: 8, color: `${theme.colors.textMuted}88`,
                                                fontFamily: theme.fonts.mono,
                                            }}>
                                                Only AgentNode is implemented across all themes
                                            </span>
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
        </div>
    )
}
