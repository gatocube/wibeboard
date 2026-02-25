/**
 * Node Configurator — standalone page to explore & configure node types.
 *
 * Layout:
 *  Left:   Widget type selector (dropdown) + live node preview (ReactFlow)
 *  Right:  Settings panel with Visual / Raw / Schema tabs
 */

import { useState, useCallback, useMemo, type CSSProperties } from 'react'
import type { Node } from '@xyflow/react'
import { widgetRegistry, type WidgetDefinition } from '@/widgets/widget-registry'
import { WidgetIcon } from '@/components/WidgetIcon'

// ── JSON Schema generator for a widget ──────────────────────────────────────────

function generateSchema(def: WidgetDefinition): object {
    const tpl = def.templates[0]
    if (!tpl) return { type: 'object', properties: {} }

    const properties: Record<string, object> = {}
    const required: string[] = []

    for (const [key, value] of Object.entries(tpl.defaultData)) {
        const typeOf = typeof value
        if (typeOf === 'string') {
            const prop: Record<string, any> = { type: 'string', default: value }
            // Guess enum from subTypes
            if (key === 'subType' && def.subTypes?.length) {
                prop.enum = def.subTypes.map(s => s.value)
                prop.description = `One of: ${def.subTypes.map(s => s.label).join(', ')}`
            }
            properties[key] = prop
        } else if (typeOf === 'number') {
            properties[key] = { type: 'number', default: value }
        } else if (typeOf === 'boolean') {
            properties[key] = { type: 'boolean', default: value }
        } else if (Array.isArray(value)) {
            properties[key] = { type: 'array', default: value, items: {} }
        } else if (value !== null && typeOf === 'object') {
            properties[key] = { type: 'object', default: value }
        }
        if (key === 'label') required.push(key)
    }

    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        title: `${def.label} Node`,
        description: def.description,
        type: 'object',
        properties,
        required,
    }
}

// ── Mode type ───────────────────────────────────────────────────────────────────

type Mode = 'visual' | 'raw' | 'schema'

// ── Styles ──────────────────────────────────────────────────────────────────────

const S = {
    page: {
        height: '100%', overflow: 'auto',
        background: '#0a0a14', padding: '24px 32px',
        fontFamily: 'Inter, sans-serif',
        color: '#e2e8f0',
    } as CSSProperties,

    layout: {
        display: 'flex', gap: 24, alignItems: 'flex-start',
    } as CSSProperties,

    left: {
        width: 340, flexShrink: 0,
        display: 'flex', flexDirection: 'column' as const, gap: 16,
    } as CSSProperties,

    right: {
        flex: 1, minWidth: 0,
    } as CSSProperties,

    card: {
        background: 'rgba(15,15,26,0.95)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        overflow: 'hidden',
    } as CSSProperties,

    cardHeader: {
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        fontSize: 10, fontWeight: 700 as const,
        color: '#64748b',
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
    } as CSSProperties,

    cardBody: {
        padding: 16,
    } as CSSProperties,

    select: {
        width: '100%',
        background: 'rgba(0,0,0,0.3)',
        color: '#e2e8f0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 13,
        outline: 'none',
        cursor: 'pointer',
        fontFamily: 'Inter, sans-serif',
    } as CSSProperties,

    switcherWrap: {
        display: 'flex', gap: 2,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 6, padding: 2,
    } as CSSProperties,

    switchBtn: (active: boolean): CSSProperties => ({
        padding: '5px 14px',
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 600,
        background: active ? 'rgba(139,92,246,0.6)' : 'transparent',
        color: active ? '#fff' : '#64748b',
        transition: 'all 0.15s',
        fontFamily: 'Inter, sans-serif',
    }),

    textarea: (hasError: boolean): CSSProperties => ({
        width: '100%',
        minHeight: 320,
        background: 'rgba(0,0,0,0.3)',
        color: '#a5f3fc',
        border: `1px solid ${hasError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 8,
        padding: 12,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        resize: 'vertical' as const,
        lineHeight: 1.5,
        outline: 'none',
        boxSizing: 'border-box' as const,
    }),

    fieldRow: {
        display: 'flex', flexDirection: 'column' as const,
        gap: 4, marginBottom: 12,
    } as CSSProperties,

    fieldLabel: {
        fontSize: 10, fontWeight: 600 as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        color: '#64748b',
    } as CSSProperties,

    fieldInput: {
        background: 'rgba(0,0,0,0.3)',
        color: '#e2e8f0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        padding: '8px 10px',
        fontSize: 12,
        outline: 'none',
        fontFamily: 'Inter, sans-serif',
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

    const widgetDef = useMemo(
        () => allWidgets.find(w => w.type === selectedType) || allWidgets[0],
        [allWidgets, selectedType],
    )

    const template = widgetDef.templates[templateIdx] || widgetDef.templates[0]

    const node: Node = useMemo(() => ({
        id: 'preview-node',
        type: widgetDef.type,
        position: { x: 0, y: 0 },
        data: { ...template.defaultData },
    }), [widgetDef.type, template])

    const schema = useMemo(() => generateSchema(widgetDef), [widgetDef])

    // Reset state when widget type changes
    const handleTypeChange = useCallback((type: string) => {
        setSelectedType(type)
        setTemplateIdx(0)
        setMode('visual')
        setParseError(null)
    }, [])

    const handleTemplateChange = useCallback((idx: number) => {
        setTemplateIdx(idx)
        setParseError(null)
    }, [])

    const handleModeSwitch = useCallback((m: Mode) => {
        if (m === 'raw') setRawJson(JSON.stringify(node.data, null, 2))
        if (m === 'schema') setRawJson(JSON.stringify(schema, null, 2))
        setMode(m)
        setParseError(null)
    }, [node.data, schema])

    const handleRawChange = useCallback((val: string) => {
        setRawJson(val)
        try {
            JSON.parse(val)
            setParseError(null)
        } catch (err: any) {
            setParseError(err.message)
        }
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
                Explore node types, edit their data, and view the JSON schema
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
                                            padding: '8px 12px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: i === templateIdx
                                                ? 'rgba(139,92,246,0.15)'
                                                : 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
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
                                    width: 36, height: 36,
                                    borderRadius: 8,
                                    background: `${widgetDef.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <WidgetIcon type={widgetDef.icon} size={18} />
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                                    }}>
                                        {String(node.data?.label || widgetDef.label)}
                                    </div>
                                    <div style={{
                                        fontSize: 9, color: '#64748b',
                                        marginTop: 2,
                                    }}>
                                        {widgetDef.type}
                                        {node.data?.subType && ` · ${String(node.data.subType)}`}
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
                                    {String(node.data?.label || widgetDef.label)}
                                </span>
                                <span style={{ fontSize: 10, color: '#475569' }}>
                                    {widgetDef.type}
                                </span>
                            </div>
                            <div style={S.switcherWrap}>
                                {(['visual', 'raw', 'schema'] as Mode[]).map(m => (
                                    <button
                                        key={m}
                                        style={S.switchBtn(mode === m)}
                                        onClick={() => handleModeSwitch(m)}
                                        data-testid={`mode-${m}`}
                                    >
                                        {m === 'schema' ? 'Schema' : m.charAt(0).toUpperCase() + m.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div style={S.cardBody}>
                            {mode === 'visual' && (
                                <VisualFields data={node.data || {}} />
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
                                </div>
                            )}

                            {mode === 'schema' && (
                                <div>
                                    <div style={{
                                        fontSize: 10, color: '#64748b', marginBottom: 8,
                                    }}>
                                        JSON Schema generated from widget definition. Describes all available fields and their types.
                                    </div>
                                    <textarea
                                        style={S.textarea(false)}
                                        value={JSON.stringify(schema, null, 2)}
                                        readOnly
                                        data-testid="schema-editor"
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

// ── Visual fields renderer ──────────────────────────────────────────────────────

function VisualFields({ data }: { data: Record<string, any> }) {
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
                <div key={key} style={S.fieldRow}>
                    <label style={S.fieldLabel}>{key}</label>
                    {typeof value === 'string' && value.includes('\n') ? (
                        <textarea
                            style={{
                                ...S.fieldInput,
                                minHeight: 80,
                                resize: 'vertical',
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                lineHeight: 1.5,
                            }}
                            value={value}
                            readOnly
                        />
                    ) : (
                        <input
                            style={S.fieldInput}
                            value={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
                            readOnly
                        />
                    )}
                    <span style={{ fontSize: 8, color: '#475569' }}>
                        {typeof value === 'object' ? (Array.isArray(value) ? 'array' : 'object') : typeof value}
                    </span>
                </div>
            ))}
        </>
    )
}

export default NodeConfiguratorPage
