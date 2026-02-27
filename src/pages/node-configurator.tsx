/**
 * Node Configurator — 3-column explorer & configurator for widget types.
 *
 * Layout:
 *  Column 1 (left):   Live widget preview (normal) + preview (debug mode)
 *  Column 2 (center): Widget type selector + template + Visual / Raw / Manifest editor
 *  Column 3 (right):  Embedded WidgetPicker — clicking a widget auto-populates everything
 *
 * Data model (from docs/node-types.md):
 *   Identity: id, type, subType, preset, label
 *   State:    status, currentTask, thought, progress, execTime, callsCount
 *   Config:   ui (theme, transform, icons), script, sandbox, timeout, retries
 */

import { useState, useCallback, useMemo, type CSSProperties } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { widgetRegistry, GRID_CELL, type WidgetDefinition } from '@/engine/widget-registry'
import { presetRegistry, type PresetDefinition } from '@/engine/preset-registry'
import { WidgetPicker } from '@/flow-studio/WidgetPicker'
import { WidgetIcon } from '@/components/WidgetIcon'
import { CodeEditor, IconSelector } from '@/kit'
import type { CodeLanguage } from '@/kit'
import { generateId } from '@/engine/core'

// Widget node components for live preview
import {
    JobNode, GroupNode, InformerNode, ExpectationNode,
    UserNode, SubFlowNode, StartingNode, ArtifactNode,
} from '@/widgets/wibeglow'

// ── Node component map ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- widget components expect NodeProps but we render standalone
const NODE_COMPONENTS: Record<string, React.ComponentType<any>> = {
    job: JobNode,
    group: GroupNode,
    informer: InformerNode,
    expectation: ExpectationNode,
    user: UserNode,
    subflow: SubFlowNode,
    starting: StartingNode,
    artifact: ArtifactNode,
}

// ── Manifest generator ──────────────────────────────────────────────────────────

function generateManifest(def: WidgetDefinition) {
    const tpl = presetRegistry.getByWidget(def.type)[0]
    const properties: Record<string, object> = {}
    const required: string[] = []

    if (tpl) {
        for (const [key, value] of Object.entries(tpl.defaultData)) {
            const t = typeof value
            if (t === 'string') {
                const prop: Record<string, any> = { type: 'string', default: value }
                if (key === 'subType' && def.subTypes?.length) {
                    prop.enum = def.subTypes.map(s => s.value)
                    prop.enumLabels = def.subTypes.map(s => s.label)
                }
                properties[key] = prop
            } else if (t === 'number') {
                properties[key] = { type: 'number', default: value }
            } else if (t === 'boolean') {
                properties[key] = { type: 'boolean', default: value }
            } else if (Array.isArray(value)) {
                properties[key] = { type: 'array', default: value, items: {} }
            } else if (value !== null && t === 'object') {
                properties[key] = { type: 'object', default: value }
            }
            if (key === 'label') required.push(key)
        }
    }

    return {
        name: def.type,
        version: '1.0.0',
        label: def.label,
        description: def.description,
        icon: def.ui.icons.default,
        color: def.ui.color,
        category: def.category,
        tags: def.tags,
        subTypes: def.subTypes || [],
        ui: {
            icons: def.ui.icons,
            color: def.ui.color,
            defaultSize: def.ui.defaultSize,       // grid units
            defaultSizePx: {                        // computed pixels
                w: def.ui.defaultSize.w * GRID_CELL,
                h: def.ui.defaultSize.h * GRID_CELL,
            },
        },
        templates: presetRegistry.getByWidget(def.type).map(t => ({
            name: t.label, description: t.description, defaultData: t.defaultData,
        })),
        schema: {
            $schema: 'http://json-schema.org/draft-07/schema#',
            title: `${def.label} Node`,
            description: def.description,
            type: 'object',
            properties,
            required,
        },
    }
}

// ── Mode type ───────────────────────────────────────────────────────────────────

type Mode = 'visual' | 'raw' | 'manifest'

// ── Styles ──────────────────────────────────────────────────────────────────────

const S = {
    page: {
        height: '100%', display: 'flex', overflow: 'hidden',
        background: '#0a0a14', fontFamily: 'Inter, sans-serif', color: '#e2e8f0',
    } as CSSProperties,

    col1: {
        width: 300, flexShrink: 0, overflow: 'auto',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: 16, display: 'flex', flexDirection: 'column' as const, gap: 16,
    } as CSSProperties,

    col2: {
        flex: 1, minWidth: 0, overflow: 'auto', padding: 16,
        display: 'flex', flexDirection: 'column' as const, gap: 16,
    } as CSSProperties,

    col3: {
        width: 260, flexShrink: 0,
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column' as const,
    } as CSSProperties,

    card: {
        background: 'rgba(15,15,26,0.95)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, overflow: 'hidden',
    } as CSSProperties,

    cardHeader: {
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontSize: 10, fontWeight: 700 as const,
        color: '#64748b', textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
    } as CSSProperties,

    cardBody: { padding: 16 } as CSSProperties,

    select: {
        width: '100%', background: 'rgba(0,0,0,0.3)',
        color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '10px 12px', fontSize: 13,
        outline: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    } as CSSProperties,

    switcherWrap: {
        display: 'flex', gap: 2,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 6, padding: 2,
    } as CSSProperties,

    switchBtn: (active: boolean): CSSProperties => ({
        padding: '5px 14px', borderRadius: 4, border: 'none',
        cursor: 'pointer', fontSize: 11, fontWeight: 600,
        background: active ? 'rgba(139,92,246,0.6)' : 'transparent',
        color: active ? '#fff' : '#64748b',
        transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
    }),

    fieldRow: {
        display: 'flex', flexDirection: 'column' as const,
        gap: 4, marginBottom: 14,
    } as CSSProperties,

    fieldLabel: {
        fontSize: 10, fontWeight: 600 as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5, color: '#64748b',
    } as CSSProperties,

    fieldInput: {
        background: 'rgba(0,0,0,0.3)', color: '#e2e8f0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6, padding: '8px 10px', fontSize: 12,
        outline: 'none', fontFamily: 'Inter, sans-serif',
        width: '100%', boxSizing: 'border-box' as const,
    } as CSSProperties,

    fieldTextarea: {
        background: 'rgba(0,0,0,0.3)', color: '#e2e8f0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6, padding: '8px 10px', fontSize: 11,
        outline: 'none', fontFamily: "'JetBrains Mono', monospace",
        width: '100%', boxSizing: 'border-box' as const,
        minHeight: 80, resize: 'vertical' as const, lineHeight: 1.5,
    } as CSSProperties,

    fieldSelect: {
        background: 'rgba(0,0,0,0.3)', color: '#e2e8f0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6, padding: '8px 10px', fontSize: 12,
        outline: 'none', fontFamily: 'Inter, sans-serif',
        width: '100%', cursor: 'pointer',
    } as CSSProperties,

    toggle: (checked: boolean): CSSProperties => ({
        width: 36, height: 20, borderRadius: 10,
        background: checked ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
    }),

    toggleDot: (checked: boolean): CSSProperties => ({
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', position: 'absolute',
        top: 3, left: checked ? 19 : 3,
        transition: 'left 0.2s', pointerEvents: 'none',
    }),

    fieldHint: {
        fontSize: 8, color: '#475569', marginTop: 1,
    } as CSSProperties,

    sectionHeader: {
        fontSize: 9, fontWeight: 700 as const,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.8px',
        color: '#8b5cf6', marginBottom: 10, marginTop: 6,
        paddingBottom: 4,
        borderBottom: '1px solid rgba(139,92,246,0.15)',
    } as CSSProperties,
}

// ── Categorize node data fields by docs/node-types.md schema ─────────────────

const IDENTITY_FIELDS = new Set(['label', 'subType', 'preset', 'agent', 'language', 'color'])
const STATE_FIELDS = new Set(['status', 'currentTask', 'thought', 'progress', 'execTime', 'callsCount', 'totalRuns'])
const INTERNAL_FIELDS = new Set(['width', 'height', 'debugMode', '_debugId', '_themeName', '_themeType',
    'dayMode', 'staticMode', 'tuiMode', 'onRunScript', 'onSaveScript', 'onResize',
    'onSelectWidget', 'onCancelSelector', 'onHoverWidget', 'editMode', 'ctx'])

function categorizeField(key: string): 'identity' | 'state' | 'config' | 'internal' {
    if (INTERNAL_FIELDS.has(key)) return 'internal'
    if (IDENTITY_FIELDS.has(key)) return 'identity'
    if (STATE_FIELDS.has(key)) return 'state'
    return 'config'
}

// ── Build preview data for live rendering ───────────────────────────────────────

function buildPreviewData(
    nodeData: Record<string, any>,
    width: number,
    height: number,
    debugMode: boolean,
): Record<string, any> {
    return {
        ...nodeData,
        width,
        height,
        debugMode,
        _debugId: 'cfg-preview',
        state: nodeData.state || {
            status: nodeData.status || 'idle',
            progress: nodeData.progress || 0,
            execTime: nodeData.execTime || '—',
            callsCount: nodeData.callsCount || 0,
        },
    }
}

// ── Component ────────────────────────────────────────────────────────────────────

export function NodeConfiguratorPage() {
    const allWidgets = useMemo(() => widgetRegistry.getAll(), [])
    const [selectedType, setSelectedType] = useState(allWidgets[0]?.type || 'job')

    const [mode, setMode] = useState<Mode>('visual')
    const [rawJson, setRawJson] = useState('')
    const [parseError, setParseError] = useState<string | null>(null)
    const [nodeData, setNodeData] = useState<Record<string, any>>({})

    const widgetDef = useMemo(
        () => allWidgets.find(w => w.type === selectedType) || allWidgets[0],
        [allWidgets, selectedType],
    )

    const template = presetRegistry.getByWidget(widgetDef.type)[0]

    // Re-init nodeData when widget/template changes
    useMemo(() => {
        setNodeData({ ...template.defaultData })
    }, [template])

    const manifest = useMemo(() => generateManifest(widgetDef), [widgetDef])

    // ── Handlers ──

    const handleTypeChange = useCallback((type: string) => {
        setSelectedType(type)
        setMode('visual')
        setParseError(null)
    }, [])



    // Widget picker selection → auto-populate everything
    const handlePickerSelect = useCallback((widget: WidgetDefinition, tmpl: PresetDefinition) => {
        setSelectedType(widget.type)
        setNodeData({ ...tmpl.defaultData })
        setMode('visual')
        setParseError(null)
    }, [])

    const handleModeSwitch = useCallback((m: Mode) => {
        if (m === 'raw') setRawJson(JSON.stringify(nodeData, null, 2))
        setMode(m)
        setParseError(null)
    }, [nodeData])

    const handleRawChange = useCallback((val: string) => {
        setRawJson(val)
        try { JSON.parse(val); setParseError(null) } catch (err: any) { setParseError(err.message) }
    }, [])

    const handleRawApply = useCallback(() => {
        try { setNodeData(JSON.parse(rawJson)); setParseError(null) } catch (err: any) { setParseError(err.message) }
    }, [rawJson])

    const updateField = useCallback((key: string, value: any) => {
        setNodeData(prev => ({ ...prev, [key]: value }))
    }, [])

    // ── Preview data ──
    const previewW = widgetDef.ui.defaultSize.w * GRID_CELL || 200
    const previewH = widgetDef.ui.defaultSize.h * GRID_CELL || 120
    const previewData = useMemo(
        () => buildPreviewData(nodeData, previewW, previewH, false),
        [nodeData, previewW, previewH],
    )
    const debugPreviewData = useMemo(
        () => buildPreviewData(nodeData, previewW, previewH, true),
        [nodeData, previewW, previewH],
    )

    const PreviewComponent = NODE_COMPONENTS[widgetDef.type]

    return (
        <div style={S.page}>
            {/* Global CSS: hide handles on preview widgets */}
            <style>{`.hide-handles .react-flow__handle { display: none !important; }`}</style>

            {/* ── Column 1: Preview ── */}
            <div style={S.col1}>
                {/* Normal preview */}
                <div style={S.card}>
                    <div style={S.cardHeader}>Preview</div>
                    <div style={{
                        ...S.cardBody,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minHeight: 140, background: '#0a0a14',
                    }}>
                        <div className="hide-handles" style={{
                            width: previewW, height: previewH,
                            position: 'relative',
                        }}>
                            <ReactFlowProvider>
                                {PreviewComponent ? (
                                    <PreviewComponent data={previewData} />
                                ) : (
                                    <FallbackPreview nodeData={nodeData} widgetDef={widgetDef} />
                                )}
                            </ReactFlowProvider>
                        </div>
                    </div>
                </div>

                {/* Debug preview */}
                <div style={S.card}>
                    <div style={{
                        ...S.cardHeader,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{ color: '#10b981' }}>⬤</span>
                        Debug Preview
                    </div>
                    <div style={{
                        ...S.cardBody,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minHeight: 140, background: '#0a0a14',
                    }}>
                        <div className="hide-handles" style={{
                            width: previewW, height: previewH,
                            position: 'relative',
                        }}>
                            <ReactFlowProvider>
                                {PreviewComponent ? (
                                    <PreviewComponent data={debugPreviewData} />
                                ) : (
                                    <FallbackPreview nodeData={nodeData} widgetDef={widgetDef} />
                                )}
                            </ReactFlowProvider>
                        </div>
                    </div>
                </div>

                {/* Widget info */}
                <div style={S.card}>
                    <div style={S.cardHeader}>Info</div>
                    <div style={{ ...S.cardBody, fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
                        <div><strong style={{ color: '#e2e8f0' }}>Type:</strong> {widgetDef.type}</div>
                        <div><strong style={{ color: '#e2e8f0' }}>Category:</strong> {widgetDef.category}</div>
                        <div><strong style={{ color: '#e2e8f0' }}>Size:</strong> {previewW}×{previewH} px</div>
                        <div style={{ marginTop: 4 }}>{widgetDef.description}</div>
                        {widgetDef.subTypes && widgetDef.subTypes.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                                {widgetDef.subTypes.map(st => (
                                    <span key={st.value} style={{
                                        padding: '2px 8px', borderRadius: 4,
                                        background: `${st.color || '#8b5cf6'}20`,
                                        border: `1px solid ${st.color || '#8b5cf6'}33`,
                                        fontSize: 9, color: st.color || '#8b5cf6',
                                        fontWeight: 500,
                                    }}>
                                        {st.label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Column 2: Configurator ── */}
            <div style={S.col2}>
                {/* Widget type + template selectors */}
                <div style={S.card}>
                    <div style={{
                        ...S.cardHeader,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <WidgetIcon type={widgetDef.ui.icons.default} size={14} color={widgetDef.ui.color} />
                            <span>{widgetDef.label}</span>
                        </div>
                        <span style={{
                            fontSize: 8, color: '#475569',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>
                            {widgetDef.type}
                        </span>
                    </div>
                    <div style={{ ...S.cardBody, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Type selector */}
                        <div>
                            <div style={{ ...S.fieldLabel, marginBottom: 4 }}>Widget Type</div>
                            <select
                                data-testid="widget-type-select"
                                style={S.select}
                                value={selectedType}
                                onChange={e => handleTypeChange(e.target.value)}
                            >
                                {allWidgets.map(w => (
                                    <option key={w.type} value={w.type}>
                                        {w.label} ({w.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>
                </div>

                {/* Settings panel with mode switcher */}
                <div style={S.card}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <div style={{
                            fontSize: 10, fontWeight: 700,
                            color: '#64748b', textTransform: 'uppercase',
                            letterSpacing: 0.5,
                        }}>
                            Configuration
                        </div>
                        <div style={S.switcherWrap}>
                            {(['visual', 'raw', 'manifest'] as Mode[]).map(m => (
                                <button
                                    key={m}
                                    style={S.switchBtn(mode === m)}
                                    onClick={() => handleModeSwitch(m)}
                                    data-testid={`mode-${m}`}
                                >
                                    {m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={S.cardBody}>
                        {mode === 'visual' && (
                            <VisualEditor
                                data={nodeData}
                                widgetDef={widgetDef}
                                onChange={updateField}
                            />
                        )}

                        {mode === 'raw' && (
                            <div>
                                <CodeEditor
                                    value={rawJson}
                                    onChange={handleRawChange}
                                    language="json"
                                    minHeight={320}
                                    maxHeight={500}
                                    testId="raw-editor"
                                />
                                {parseError && (
                                    <div style={{
                                        color: '#ef4444', fontSize: 10, marginTop: 6,
                                        padding: '6px 10px',
                                        background: 'rgba(239,68,68,0.08)',
                                        borderRadius: 6,
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}>
                                        ⚠ {parseError}
                                    </div>
                                )}
                                <button
                                    onClick={handleRawApply}
                                    disabled={!!parseError}
                                    data-testid="raw-apply"
                                    style={{
                                        marginTop: 8, padding: '6px 16px',
                                        borderRadius: 6, border: 'none',
                                        background: parseError ? '#333' : 'rgba(139,92,246,0.7)',
                                        color: parseError ? '#666' : '#fff',
                                        cursor: parseError ? 'not-allowed' : 'pointer',
                                        fontSize: 12, fontWeight: 500,
                                        fontFamily: 'Inter, sans-serif',
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                        )}

                        {mode === 'manifest' && (
                            <div>
                                <div style={{
                                    fontSize: 10, color: '#64748b', marginBottom: 8,
                                }}>
                                    Full manifest with JSON schema, metadata, templates, and dimensions.
                                </div>
                                <CodeEditor
                                    value={JSON.stringify(manifest, null, 2)}
                                    language="json"
                                    readOnly
                                    minHeight={320}
                                    maxHeight={600}
                                    testId="manifest-editor"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Save as Custom Preset ── */}
                <div style={S.card}>
                    <div style={{ ...S.cardBody, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button
                            data-testid="save-preset-btn"
                            onClick={() => {
                                const name = prompt('Preset name:', nodeData.label || 'My Preset')
                                if (!name) return
                                const presetType = `custom-${generateId('preset')}`
                                presetRegistry.registerCustom({
                                    type: presetType,
                                    widgetType: widgetDef.type,
                                    subType: nodeData.subType,
                                    label: name,
                                    description: `Custom ${widgetDef.label} preset`,
                                    tags: ['custom', widgetDef.type],
                                    defaultData: { ...nodeData },
                                    ui: nodeData.icon ? { icons: { default: nodeData.icon } } : undefined,
                                })
                            }}
                            style={{
                                padding: '8px 16px', borderRadius: 8,
                                border: '1px solid rgba(245,158,11,0.3)',
                                background: 'rgba(245,158,11,0.08)',
                                color: '#f59e0b',
                                cursor: 'pointer',
                                fontSize: 11, fontWeight: 600,
                                fontFamily: 'Inter, sans-serif',
                                transition: 'all 0.15s',
                            }}
                            onMouseOver={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.15)'
                                    ; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.5)'
                            }}
                            onMouseOut={e => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.08)'
                                    ; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.3)'
                            }}
                        >
                            ★ Save as Custom Preset
                        </button>
                        <div style={{ fontSize: 9, color: '#64748b' }}>
                            Saves current settings as a reusable preset in the Widget Picker.
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Column 3: WidgetPicker ── */}
            <div style={S.col3}>
                <WidgetPicker
                    rectSize={{ width: 200, height: 120 }}
                    onSelect={handlePickerSelect}
                    onCancel={() => { }}
                    embedded
                    compact
                />
            </div>
        </div>
    )
}

// ── Fallback preview (when no component registered) ─────────────────────────────

function FallbackPreview({ nodeData, widgetDef }: {
    nodeData: Record<string, any>
    widgetDef: WidgetDefinition
}) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 20px',
            background: 'rgba(15,15,26,0.8)',
            border: `1.5px solid ${widgetDef.ui.color}44`,
            borderRadius: 12,
            boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px ${widgetDef.ui.color}11`,
            width: '100%', height: '100%', boxSizing: 'border-box',
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `${widgetDef.ui.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <WidgetIcon type={widgetDef.ui.icons.default} size={18} />
            </div>
            <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                    {String(nodeData.label || widgetDef.label)}
                </div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                    {widgetDef.type}
                    {nodeData.subType && ` · ${String(nodeData.subType)}`}
                </div>
            </div>
        </div>
    )
}

// ── Visual Editor (grouped by node-types.md schema) ─────────────────────────────

function VisualEditor({ data, widgetDef, onChange }: {
    data: Record<string, any>
    widgetDef: WidgetDefinition
    onChange: (key: string, value: any) => void
}) {
    const entries = Object.entries(data)
    if (entries.length === 0) {
        return (
            <div style={{ color: '#475569', fontSize: 12, fontStyle: 'italic' }}>
                No fields for this node.
            </div>
        )
    }

    // Group fields by category
    const groups: { identity: [string, any][]; state: [string, any][]; config: [string, any][] } = {
        identity: [], state: [], config: [],
    }
    for (const entry of entries) {
        const cat = categorizeField(entry[0])
        if (cat !== 'internal') {
            groups[cat].push(entry)
        }
    }

    return (
        <>
            {groups.identity.length > 0 && (
                <>
                    <div style={S.sectionHeader}>Identity</div>
                    {groups.identity.map(([key, value]) => (
                        <VisualField key={key} fieldKey={key} value={value} widgetDef={widgetDef} onChange={onChange} />
                    ))}
                </>
            )}
            {groups.state.length > 0 && (
                <>
                    <div style={S.sectionHeader}>State</div>
                    {groups.state.map(([key, value]) => (
                        <VisualField key={key} fieldKey={key} value={value} widgetDef={widgetDef} onChange={onChange} />
                    ))}
                </>
            )}
            {groups.config.length > 0 && (
                <>
                    <div style={S.sectionHeader}>Config</div>
                    {groups.config.map(([key, value]) => (
                        <VisualField key={key} fieldKey={key} value={value} widgetDef={widgetDef} onChange={onChange} />
                    ))}
                </>
            )}
        </>
    )
}

// ── Visual Field (editable) ─────────────────────────────────────────────────────

function VisualField({ fieldKey, value, widgetDef, onChange }: {
    fieldKey: string
    value: any
    widgetDef: WidgetDefinition
    onChange: (key: string, value: any) => void
}) {
    const [error, setError] = useState<string | null>(null)
    const t = typeof value

    // Check if this field has enum options (subType)
    const isEnum = fieldKey === 'subType' && widgetDef.subTypes && widgetDef.subTypes.length > 0

    // Detect code language from sibling data
    const isCode = fieldKey === 'code'
    const codeLanguage: CodeLanguage = useMemo(() => {
        if (!isCode) return 'text'
        const lang = presetRegistry.getByWidget(widgetDef.type)[0]?.defaultData?.language
            || presetRegistry.getByWidget(widgetDef.type)[0]?.defaultData?.subType
        if (lang === 'ts') return 'typescript'
        if (lang === 'js') return 'javascript'
        if (lang === 'py') return 'python'
        if (lang === 'sh') return 'shell'
        return 'javascript'
    }, [isCode, widgetDef])

    const isRequired = fieldKey === 'label'

    const validate = useCallback((val: any) => {
        if (isRequired && (val === '' || val === null || val === undefined)) {
            setError('This field is required')
            return false
        }
        setError(null)
        return true
    }, [isRequired])

    const handleChange = useCallback((val: any) => {
        validate(val)
        onChange(fieldKey, val)
    }, [fieldKey, onChange, validate])

    // Boolean → toggle
    if (t === 'boolean') {
        return (
            <div style={S.fieldRow}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={S.fieldLabel}>{fieldKey}</label>
                    <button
                        style={S.toggle(value)}
                        onClick={() => handleChange(!value)}
                        data-testid={`field-${fieldKey}`}
                    >
                        <div style={S.toggleDot(value)} />
                    </button>
                </div>
                <div style={S.fieldHint}>boolean</div>
            </div>
        )
    }

    // Enum → select dropdown
    if (isEnum) {
        return (
            <div style={S.fieldRow}>
                <label style={S.fieldLabel}>{fieldKey}</label>
                <select
                    style={S.fieldSelect}
                    value={String(value ?? '')}
                    onChange={e => handleChange(e.target.value)}
                    data-testid={`field-${fieldKey}`}
                >
                    {widgetDef.subTypes!.map(st => (
                        <option key={st.value} value={st.value}>
                            {st.label} ({st.value})
                        </option>
                    ))}
                </select>
                <div style={S.fieldHint}>enum</div>
            </div>
        )
    }

    // Icon field → IconSelector dropdown
    if (fieldKey === 'icon' && t === 'string') {
        return (
            <div style={S.fieldRow}>
                <label style={S.fieldLabel}>
                    {fieldKey}
                    <span style={{ fontSize: 8, color: '#f59e0b', marginLeft: 6, fontWeight: 400 }}>
                        icon picker
                    </span>
                </label>
                <IconSelector
                    selected={String(value)}
                    onSelect={id => handleChange(id)}
                />
                {error && <div style={{ color: '#ef4444', fontSize: 9, marginTop: 4 }}>{error}</div>}
            </div>
        )
    }

    // Code field → CodeEditor with syntax highlighting
    if (isCode && t === 'string') {
        return (
            <div style={S.fieldRow}>
                <label style={S.fieldLabel}>
                    {fieldKey}
                    <span style={{ fontSize: 8, color: '#8b5cf6', marginLeft: 6, fontWeight: 400 }}>
                        {codeLanguage}
                    </span>
                </label>
                <CodeEditor
                    value={String(value)}
                    onChange={v => handleChange(v)}
                    language={codeLanguage}
                    minHeight={120}
                    maxHeight={300}
                    testId={`field-${fieldKey}`}
                />
            </div>
        )
    }

    // Multi-line string → textarea
    if (t === 'string' && (String(value).includes('\n') || fieldKey === 'content' || fieldKey === 'reviewBody')) {
        return (
            <div style={S.fieldRow}>
                <label style={S.fieldLabel}>{fieldKey}</label>
                <textarea
                    style={S.fieldTextarea}
                    value={String(value)}
                    onChange={e => handleChange(e.target.value)}
                    data-testid={`field-${fieldKey}`}
                />
                <div style={S.fieldHint}>string (multiline)</div>
            </div>
        )
    }

    // String → input
    if (t === 'string') {
        return (
            <div style={S.fieldRow}>
                <label style={{
                    ...S.fieldLabel,
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    {fieldKey}
                    {isRequired && <span style={{ color: '#ef4444', fontSize: 8 }}>*</span>}
                </label>
                <input
                    style={{
                        ...S.fieldInput,
                        borderColor: error ? '#ef4444' : 'rgba(255,255,255,0.1)',
                    }}
                    value={String(value)}
                    onChange={e => handleChange(e.target.value)}
                    onBlur={() => validate(value)}
                    data-testid={`field-${fieldKey}`}
                />
                {error ? (
                    <div style={{ fontSize: 8, color: '#ef4444' }}>{error}</div>
                ) : (
                    <div style={S.fieldHint}>string</div>
                )}
            </div>
        )
    }

    // Number → input type=number
    if (t === 'number') {
        return (
            <div style={S.fieldRow}>
                <label style={S.fieldLabel}>{fieldKey}</label>
                <input
                    style={S.fieldInput}
                    type="number"
                    value={value}
                    onChange={e => handleChange(Number(e.target.value))}
                    data-testid={`field-${fieldKey}`}
                />
                <div style={S.fieldHint}>number</div>
            </div>
        )
    }

    // Object/Array → JSON CodeEditor
    return (
        <div style={S.fieldRow}>
            <label style={S.fieldLabel}>{fieldKey}</label>
            <CodeEditor
                value={JSON.stringify(value, null, 2)}
                onChange={v => {
                    try {
                        const parsed = JSON.parse(v)
                        setError(null)
                        onChange(fieldKey, parsed)
                    } catch (e: any) {
                        setError(e.message)
                    }
                }}
                language="json"
                minHeight={100}
                maxHeight={250}
                testId={`field-${fieldKey}`}
            />
            {error ? (
                <div style={{ fontSize: 8, color: '#ef4444' }}>{error}</div>
            ) : (
                <div style={S.fieldHint}>{Array.isArray(value) ? 'array' : 'object'}</div>
            )}
        </div>
    )
}

export default NodeConfiguratorPage
