/**
 * Node Configurator — standalone page to explore & configure node types.
 *
 * Layout:
 *  Left:   Widget type selector + template selector + node preview + info
 *  Right:  Settings panel with Visual / Raw / Manifest tabs
 *
 * Visual mode fields are fully editable — changes update node data live.
 * Manifest = JSON schema + metadata (description, tags, version, etc.)
 */

import { useState, useCallback, useMemo, type CSSProperties } from 'react'
import type { Node } from '@xyflow/react'
import { widgetRegistry, type WidgetDefinition } from '@/widgets/widget-registry'
import { WidgetIcon } from '@/components/WidgetIcon'

// ── Manifest generator ──────────────────────────────────────────────────────────

function generateManifest(def: WidgetDefinition) {
    const tpl = def.templates[0]
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
        icon: def.icon,
        color: def.color,
        category: def.category,
        tags: def.tags,
        subTypes: def.subTypes || [],
        dimensions: {
            minWidth: def.minWidth,
            minHeight: def.minHeight,
            defaultWidth: def.defaultWidth,
            defaultHeight: def.defaultHeight,
        },
        templates: def.templates.map(t => ({
            name: t.name,
            description: t.description,
            defaultData: t.defaultData,
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
        height: '100%', overflow: 'auto',
        background: '#0a0a14', padding: '24px 32px',
        fontFamily: 'Inter, sans-serif', color: '#e2e8f0',
    } as CSSProperties,

    layout: {
        display: 'flex', gap: 24, alignItems: 'flex-start',
    } as CSSProperties,

    left: {
        width: 340, flexShrink: 0,
        display: 'flex', flexDirection: 'column' as const, gap: 16,
    } as CSSProperties,

    right: { flex: 1, minWidth: 0 } as CSSProperties,

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

    textarea: (hasError: boolean): CSSProperties => ({
        width: '100%', minHeight: 320,
        background: 'rgba(0,0,0,0.3)', color: '#a5f3fc',
        border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 8, padding: 12, fontSize: 12,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        resize: 'vertical' as const, lineHeight: 1.5,
        outline: 'none', boxSizing: 'border-box' as const,
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
}

// ── Component ────────────────────────────────────────────────────────────────────

export function NodeConfiguratorPage() {
    const allWidgets = useMemo(() => widgetRegistry.getAll(), [])
    const [selectedType, setSelectedType] = useState(allWidgets[0]?.type || 'job')
    const [templateIdx, setTemplateIdx] = useState(0)
    const [mode, setMode] = useState<Mode>('visual')
    const [rawJson, setRawJson] = useState('')
    const [parseError, setParseError] = useState<string | null>(null)
    const [nodeData, setNodeData] = useState<Record<string, any>>({})

    const widgetDef = useMemo(
        () => allWidgets.find(w => w.type === selectedType) || allWidgets[0],
        [allWidgets, selectedType],
    )

    const template = widgetDef.templates[templateIdx] || widgetDef.templates[0]

    // Initialize node data when widget/template changes
    const initData = useCallback(() => {
        return { ...template.defaultData }
    }, [template])

    // Reset on type change
    const handleTypeChange = useCallback((type: string) => {
        setSelectedType(type)
        setTemplateIdx(0)
        setMode('visual')
        setParseError(null)
        // nodeData will be reset via effect
    }, [])

    const handleTemplateChange = useCallback((idx: number) => {
        setTemplateIdx(idx)
        setParseError(null)
    }, [])

    // Re-init nodeData when widget/template changes
    useMemo(() => {
        setNodeData(initData())
    }, [initData])

    const node: Node = useMemo(() => ({
        id: 'preview-node',
        type: widgetDef.type,
        position: { x: 0, y: 0 },
        data: nodeData,
    }), [widgetDef.type, nodeData])

    const manifest = useMemo(() => generateManifest(widgetDef), [widgetDef])

    const handleModeSwitch = useCallback((m: Mode) => {
        if (m === 'raw') setRawJson(JSON.stringify(nodeData, null, 2))
        setMode(m)
        setParseError(null)
    }, [nodeData])

    const handleRawChange = useCallback((val: string) => {
        setRawJson(val)
        try {
            JSON.parse(val)
            setParseError(null)
        } catch (err: any) {
            setParseError(err.message)
        }
    }, [])

    const handleRawApply = useCallback(() => {
        try {
            const parsed = JSON.parse(rawJson)
            setNodeData(parsed)
            setParseError(null)
        } catch (err: any) {
            setParseError(err.message)
        }
    }, [rawJson])

    // Update a single field in nodeData
    const updateField = useCallback((key: string, value: any) => {
        setNodeData(prev => ({ ...prev, [key]: value }))
    }, [])

    return (
        <div style={S.page}>
            <h1 style={{
                fontSize: 20, fontWeight: 800, color: '#8b5cf6',
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: 4,
            }}>
                Node Configurator
            </h1>
            <p style={{ fontSize: 11, color: '#64748b', marginBottom: 24 }}>
                Explore node types, edit their data, and view the manifest
            </p>

            <div style={S.layout}>
                {/* ── Left: Selector + Preview ── */}
                <div style={S.left}>
                    {/* Widget type selector */}
                    <div style={S.card}>
                        <div style={S.cardHeader}>Widget Type</div>
                        <div style={S.cardBody}>
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

                    {/* Template selector */}
                    {widgetDef.templates.length > 1 && (
                        <div style={S.card}>
                            <div style={S.cardHeader}>Template</div>
                            <div style={{ ...S.cardBody, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {widgetDef.templates.map((tpl, i) => (
                                    <button
                                        key={i}
                                        data-testid={`template-${i}`}
                                        onClick={() => handleTemplateChange(i)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '8px 12px', borderRadius: 8, border: 'none',
                                            background: i === templateIdx
                                                ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer', textAlign: 'left',
                                            fontFamily: 'Inter, sans-serif',
                                        }}
                                    >
                                        <WidgetIcon type={widgetDef.icon} size={16} />
                                        <div>
                                            <div style={{
                                                fontSize: 11, fontWeight: 600,
                                                color: i === templateIdx ? '#c084fc' : '#e2e8f0',
                                            }}>
                                                {tpl.name}
                                            </div>
                                            <div style={{ fontSize: 9, color: '#64748b' }}>
                                                {tpl.description}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Node preview card */}
                    <div style={S.card}>
                        <div style={S.cardHeader}>Node Preview</div>
                        <div style={{
                            ...S.cardBody,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            minHeight: 120,
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '16px 20px',
                                background: 'rgba(15,15,26,0.8)',
                                border: `1.5px solid ${widgetDef.color}44`,
                                borderRadius: 12,
                                boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 0 1px ${widgetDef.color}11`,
                                minWidth: 180,
                            }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    background: `${widgetDef.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <WidgetIcon type={widgetDef.icon} size={18} />
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
                        </div>
                    </div>

                    {/* Widget info */}
                    <div style={S.card}>
                        <div style={S.cardHeader}>Info</div>
                        <div style={{ ...S.cardBody, fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
                            <div><strong style={{ color: '#e2e8f0' }}>Category:</strong> {widgetDef.category}</div>
                            <div><strong style={{ color: '#e2e8f0' }}>Tags:</strong> {widgetDef.tags.join(', ')}</div>
                            <div style={{ marginTop: 4 }}>{widgetDef.description}</div>
                            {widgetDef.subTypes && widgetDef.subTypes.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <strong style={{ color: '#e2e8f0' }}>Sub-types:</strong>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
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
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right: Settings Panel ── */}
                <div style={S.right}>
                    <div style={S.card}>
                        {/* Header with mode switcher */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <WidgetIcon type={widgetDef.icon} size={16} />
                                <span style={{ fontWeight: 600, fontSize: 13 }}>
                                    {String(nodeData.label || widgetDef.label)}
                                </span>
                                <span style={{ fontSize: 10, color: '#475569' }}>
                                    {widgetDef.type}
                                </span>
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

                        {/* Body */}
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
                                    <textarea
                                        style={S.textarea(!!parseError)}
                                        value={rawJson}
                                        onChange={e => handleRawChange(e.target.value)}
                                        spellCheck={false}
                                        data-testid="raw-editor"
                                    />
                                    {parseError && (
                                        <div style={{ color: '#ef4444', fontSize: 10, marginTop: 4 }}>
                                            {parseError}
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
                                    <textarea
                                        style={S.textarea(false)}
                                        value={JSON.stringify(manifest, null, 2)}
                                        readOnly
                                        data-testid="manifest-editor"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Visual Editor ───────────────────────────────────────────────────────────────

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

    return (
        <>
            {entries.map(([key, value]) => (
                <VisualField
                    key={key}
                    fieldKey={key}
                    value={value}
                    widgetDef={widgetDef}
                    onChange={onChange}
                />
            ))}
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
    const t = typeof value

    // Check if this field has enum options (subType)
    const isEnum = fieldKey === 'subType' && widgetDef.subTypes && widgetDef.subTypes.length > 0

    // Boolean → toggle
    if (t === 'boolean') {
        return (
            <div style={S.fieldRow}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={S.fieldLabel}>{fieldKey}</label>
                    <button
                        style={S.toggle(value)}
                        onClick={() => onChange(fieldKey, !value)}
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
                    onChange={e => onChange(fieldKey, e.target.value)}
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

    // Multi-line string → textarea
    if (t === 'string' && (String(value).includes('\n') || fieldKey === 'code' || fieldKey === 'content' || fieldKey === 'reviewBody')) {
        return (
            <div style={S.fieldRow}>
                <label style={S.fieldLabel}>{fieldKey}</label>
                <textarea
                    style={S.fieldTextarea}
                    value={String(value)}
                    onChange={e => onChange(fieldKey, e.target.value)}
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
                <label style={S.fieldLabel}>{fieldKey}</label>
                <input
                    style={S.fieldInput}
                    value={String(value)}
                    onChange={e => onChange(fieldKey, e.target.value)}
                    data-testid={`field-${fieldKey}`}
                />
                <div style={S.fieldHint}>string</div>
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
                    onChange={e => onChange(fieldKey, Number(e.target.value))}
                    data-testid={`field-${fieldKey}`}
                />
                <div style={S.fieldHint}>number</div>
            </div>
        )
    }

    // Object/Array → JSON textarea
    return (
        <div style={S.fieldRow}>
            <label style={S.fieldLabel}>{fieldKey}</label>
            <textarea
                style={S.fieldTextarea}
                value={JSON.stringify(value, null, 2)}
                onChange={e => {
                    try {
                        const parsed = JSON.parse(e.target.value)
                        onChange(fieldKey, parsed)
                    } catch { /* ignore parse errors while typing */ }
                }}
                data-testid={`field-${fieldKey}`}
            />
            <div style={S.fieldHint}>{Array.isArray(value) ? 'array' : 'object'}</div>
        </div>
    )
}

export default NodeConfiguratorPage
