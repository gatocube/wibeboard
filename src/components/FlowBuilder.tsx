/**
 * FlowBuilder — shared ReactFlow wrapper with settings panel & zoom-autosize.
 *
 * Used by both Builder Demo and AI+Script scenario.
 * Provides: ReactFlow shell, background, settings gear menu,
 * and optional zoom-autosize (node size follows zoom level).
 */

import { ReactFlow, Background, Panel, useStore, useReactFlow, type Node, type Edge, type NodeTypes, type OnNodesChange, type Viewport } from '@xyflow/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Settings, Sun, Moon, ZoomIn } from 'lucide-react'
import { WidgetSelector } from '@/components/WidgetSelector'
import type { WidgetTemplate } from '@/engine/widget-registry'

// ── Types ────────────────────────────────────────────────────────────────────

export type NodeSize = 'S' | 'M' | 'L'
export type ThemeKey = 'wibeglow' | 'pixel' | 'ghub'
export type ThemeMode = 'dark' | 'light'

export interface FlowBuilderProps {
    nodes: Node[]
    edges: Edge[]
    nodeTypes: NodeTypes
    children?: React.ReactNode
    onNodesChange?: OnNodesChange
    defaultViewport?: Viewport
    nodesDraggable?: boolean
    nodesConnectable?: boolean
    panOnDrag?: boolean
    zoomOnScroll?: boolean
    fitView?: boolean
    /** Current node size */
    currentSize?: NodeSize
    /** Called when zoom-autosize changes the node size */
    onSizeChange?: (size: NodeSize) => void
    /** Current theme */
    currentTheme?: ThemeKey
    /** Called when theme changes */
    onThemeChange?: (theme: ThemeKey) => void
    /** Extra style for the wrapper div */
    wrapperStyle?: React.CSSProperties
    /** Ref callback for the wrapper div (e.g. connector flow interceptor) */
    wrapperRef?: React.Ref<HTMLDivElement>
    /** Background color */
    bgColor?: string
    /** Grid gap */
    gridGap?: number
    /** Show widget selector and editing handles */
    editMode?: boolean
    /** Called when a widget is dropped from the selector onto the canvas */
    onNodeAdd?: (widgetType: string, template: WidgetTemplate, position: { x: number; y: number }) => void
}

// ── Theme backgrounds ────────────────────────────────────────────────────────

const THEME_BG: Record<ThemeKey, string> = {
    wibeglow: '#1e1e3a',
    pixel: '#1a1a1a',
    ghub: '#21262d',
}

const THEME_CANVAS: Record<ThemeKey, string> = {
    wibeglow: '#0a0a14',
    pixel: '#080808',
    ghub: '#0d1117',
}

// ── Zoom → Size mapping ─────────────────────────────────────────────────────

function zoomToSize(zoom: number): NodeSize {
    if (zoom < 0.5) return 'S'
    if (zoom < 0.85) return 'M'
    return 'L'
}

/**
 * Selector that derives NodeSize from the store's zoom level.
 * Returns a *stable string* — React Flow's useStore uses Object.is equality,
 * so the subscribing component re-renders ONLY when the size bucket changes
 * (e.g. M→L), not on every 0.001 zoom tick.
 */
const zoomToSizeSelector = (state: { transform: [number, number, number] }): NodeSize =>
    zoomToSize(state.transform[2])

// ── Zoom autosize inner component (needs ReactFlow context) ──────────────────

function ZoomAutosizeWatcher({ enabled, onSizeChange }: {
    enabled: boolean
    onSizeChange?: (size: NodeSize) => void
}) {
    // useStore with selector: only re-renders when the computed size string changes
    const derivedSize = useStore(zoomToSizeSelector)
    const lastEmitted = useRef<NodeSize | null>(null)

    useEffect(() => {
        if (!enabled || !onSizeChange) return
        // Only call back when the size actually transitions
        if (derivedSize !== lastEmitted.current) {
            lastEmitted.current = derivedSize
            onSizeChange(derivedSize)
        }
    }, [derivedSize, enabled, onSizeChange])

    return null
}

// ── Settings panel ───────────────────────────────────────────────────────────

function SettingsPanel({
    theme, onThemeChange,
    mode, onModeChange,
    zoomAutosize, onZoomAutosizeChange,
    currentSize,
}: {
    theme: ThemeKey
    onThemeChange: (t: ThemeKey) => void
    mode: ThemeMode
    onModeChange: (m: ThemeMode) => void
    zoomAutosize: boolean
    onZoomAutosizeChange: (v: boolean) => void
    currentSize?: NodeSize
}) {
    const [open, setOpen] = useState(false)

    return (
        <div style={{ position: 'relative' }}>
            <button
                data-testid="settings-btn"
                onClick={() => setOpen(o => !o)}
                style={{
                    background: open ? 'rgba(139,92,246,0.2)' : 'rgba(15,15,26,0.9)',
                    color: open ? '#c084fc' : '#64748b',
                    border: open ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 8, padding: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s',
                }}
            >
                <Settings size={14} />
            </button>

            {open && (
                <div
                    data-testid="settings-panel"
                    style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 6,
                        width: 200,
                        background: 'rgba(15,15,26,0.97)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 10, padding: '10px 0',
                        backdropFilter: 'blur(12px)',
                        fontFamily: 'Inter',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        zIndex: 100,
                    }}
                >
                    {/* Theme selector */}
                    <div style={{ padding: '4px 12px', fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Theme
                    </div>
                    {(['wibeglow', 'pixel', 'ghub'] as ThemeKey[]).map(t => (
                        <button
                            key={t}
                            data-testid={`theme-${t}`}
                            onClick={() => onThemeChange(t)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                padding: '6px 12px', border: 'none', cursor: 'pointer',
                                background: theme === t ? 'rgba(139,92,246,0.1)' : 'transparent',
                                color: theme === t ? '#c084fc' : '#94a3b8',
                                fontSize: 11, fontWeight: theme === t ? 600 : 400,
                                fontFamily: 'Inter', textAlign: 'left',
                            }}
                        >
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: t === 'wibeglow' ? '#8b5cf6' : t === 'pixel' ? '#ef4444' : '#58a6ff',
                            }} />
                            {t === 'wibeglow' ? 'WibeGlow' : t === 'pixel' ? 'Pixel' : 'GitHub'}
                        </button>
                    ))}

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                    {/* Mode toggle */}
                    <div style={{ padding: '4px 12px', fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Mode
                    </div>
                    <button
                        data-testid="mode-toggle"
                        onClick={() => onModeChange(mode === 'dark' ? 'light' : 'dark')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '6px 12px', border: 'none', cursor: 'pointer',
                            background: 'transparent', color: '#94a3b8',
                            fontSize: 11, fontFamily: 'Inter', textAlign: 'left',
                        }}
                    >
                        {mode === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
                        {mode === 'dark' ? 'Dark' : 'Light'}
                    </button>

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' }} />

                    {/* Zoom autosize */}
                    <div style={{ padding: '4px 12px', fontSize: 9, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                        Zoom Autosize {currentSize && <span style={{ color: '#c084fc', fontWeight: 700 }}>({currentSize})</span>}
                    </div>
                    <button
                        data-testid="zoom-autosize-toggle"
                        onClick={() => onZoomAutosizeChange(!zoomAutosize)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '6px 12px', border: 'none', cursor: 'pointer',
                            background: zoomAutosize ? 'rgba(34,197,94,0.1)' : 'transparent',
                            color: zoomAutosize ? '#22c55e' : '#94a3b8',
                            fontSize: 11, fontWeight: zoomAutosize ? 600 : 400,
                            fontFamily: 'Inter', textAlign: 'left',
                        }}
                    >
                        <ZoomIn size={12} />
                        {zoomAutosize ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            )}
        </div>
    )
}

// ── Screen→Flow coordinate bridge (renders nothing, just exposes converter via ref) ──

function ScreenToFlowBridge({ converterRef }: {
    converterRef: React.MutableRefObject<((pos: { x: number; y: number }) => { x: number; y: number }) | null>
}) {
    const { screenToFlowPosition } = useReactFlow()
    converterRef.current = screenToFlowPosition
    return null
}

// ── FlowBuilder ──────────────────────────────────────────────────────────────

export function FlowBuilder({
    nodes, edges, nodeTypes, children,
    onNodesChange,
    defaultViewport,
    nodesDraggable = false,
    nodesConnectable = false,
    panOnDrag = true,
    zoomOnScroll = true,
    fitView = false,
    currentSize = 'M',
    onSizeChange,
    currentTheme = 'wibeglow',
    onThemeChange,
    wrapperStyle,
    wrapperRef,
    bgColor,
    gridGap = 20,
    editMode = false,
    onNodeAdd,
}: FlowBuilderProps) {
    const [theme, setTheme] = useState<ThemeKey>(currentTheme)
    const [mode, setMode] = useState<ThemeMode>('dark')
    const [zoomAutosize, setZoomAutosize] = useState(false)

    // Sync theme from props
    useEffect(() => { setTheme(currentTheme) }, [currentTheme])

    const handleThemeChange = useCallback((t: ThemeKey) => {
        setTheme(t)
        onThemeChange?.(t)
    }, [onThemeChange])

    const handleSizeChange = useCallback((size: NodeSize) => {
        onSizeChange?.(size)
    }, [onSizeChange])

    const canvasBg = bgColor || THEME_CANVAS[theme]
    const gridColor = THEME_BG[theme]

    // Ref for screen→flow coordinate conversion (filled by ScreenToFlowBridge)
    const screenToFlowRef = useRef<((pos: { x: number; y: number }) => { x: number; y: number }) | null>(null)

    return (
        <div
            ref={wrapperRef}
            style={{
                width: '100%', height: '100%',
                display: 'flex',
                background: canvasBg,
                position: 'relative',
                ...wrapperStyle,
            }}
        >
            {/* Canvas area */}
            <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    nodesDraggable={nodesDraggable}
                    nodesConnectable={nodesConnectable}
                    panOnDrag={panOnDrag}
                    zoomOnScroll={zoomOnScroll}
                    fitView={fitView}
                    defaultViewport={defaultViewport}
                    proOptions={{ hideAttribution: true }}
                    style={{ background: 'transparent' }}
                    onDrop={editMode ? (e) => {
                        e.preventDefault()
                        const raw = e.dataTransfer.getData('application/flowbuilder-widget')
                        if (!raw || !onNodeAdd) return
                        try {
                            const { type, template } = JSON.parse(raw)
                            const converter = screenToFlowRef.current
                            const position = converter
                                ? converter({ x: e.clientX, y: e.clientY })
                                : { x: e.clientX, y: e.clientY }
                            onNodeAdd(type, template, position)
                        } catch { /* ignore */ }
                    } : undefined}
                    onDragOver={editMode ? (e) => {
                        if (e.dataTransfer.types.includes('application/flowbuilder-widget')) {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                        }
                    } : undefined}
                >
                    <Background color={gridColor} gap={gridGap} size={1} />

                    {/* Bridge: exposes screenToFlowPosition via ref */}
                    <ScreenToFlowBridge converterRef={screenToFlowRef} />

                    {/* Zoom autosize watcher */}
                    <ZoomAutosizeWatcher
                        enabled={zoomAutosize}
                        onSizeChange={handleSizeChange}
                    />

                    {/* Settings gear — top-right */}
                    <Panel position="top-right">
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                            <SettingsPanel
                                theme={theme}
                                onThemeChange={handleThemeChange}
                                mode={mode}
                                onModeChange={setMode}
                                zoomAutosize={zoomAutosize}
                                onZoomAutosizeChange={setZoomAutosize}
                                currentSize={currentSize}
                            />
                        </div>
                    </Panel>

                    {children}
                </ReactFlow>
            </div>

            {/* Widget selector — right side, 100% height, using existing WidgetSelector */}
            {editMode && (
                <div style={{
                    width: 260, flexShrink: 0,
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    <WidgetSelector
                        rectSize={{ width: 200, height: 120 }}
                        onSelect={(widget, template) => {
                            // When user clicks a widget in the selector,
                            // just notify through onNodeAdd with center position
                            onNodeAdd?.(widget.type, template, { x: 200, y: 200 })
                        }}
                        onCancel={() => { }}
                        embedded
                    />
                </div>
            )}
        </div>
    )
}
