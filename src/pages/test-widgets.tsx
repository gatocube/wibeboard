import { useState } from 'react'
import { widgetRegistry, type WidgetDefinition } from '@/widgets/widget-registry'
import { templateRegistry, type TemplateName } from '@/templates/template-registry'

/**
 * Widget Gallery — displays all registered widgets across all templates.
 */
export function TestWidgetsPage() {
    const [activeTemplate, setActiveTemplate] = useState<TemplateName>('wibeglow')
    const categories = widgetRegistry.getCategories()
    const templates = templateRegistry.getAll()
    const tmpl = templateRegistry.get(activeTemplate)!

    return (
        <div style={{
            height: '100%', overflow: 'auto', padding: 24,
            background: tmpl.colors.bg,
        }}>
            {/* Template switcher */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                {templates.map(t => (
                    <button
                        key={t.name}
                        onClick={() => setActiveTemplate(t.name)}
                        style={{
                            padding: '6px 16px', borderRadius: 6,
                            border: activeTemplate === t.name ? `1px solid ${t.colors.accent}` : `1px solid ${t.colors.border}`,
                            background: activeTemplate === t.name ? `${t.colors.accent}15` : 'transparent',
                            color: activeTemplate === t.name ? t.colors.accent : t.colors.textMuted,
                            fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            fontFamily: 'Inter',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Template info */}
            <div style={{
                padding: 16, borderRadius: 10, marginBottom: 24,
                background: tmpl.colors.surface,
                border: `1px solid ${tmpl.colors.border}`,
            }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: tmpl.colors.accent, marginBottom: 4 }}>
                    {tmpl.label} Template
                </h2>
                <p style={{ fontSize: 11, color: tmpl.colors.textMuted, marginBottom: 8 }}>
                    {tmpl.description}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {tmpl.characteristics.map((c, i) => (
                        <span key={i} style={{
                            padding: '2px 8px', borderRadius: 4,
                            background: `${tmpl.colors.accent}10`, border: `1px solid ${tmpl.colors.accent}22`,
                            fontSize: 9, color: tmpl.colors.accent,
                        }}>
                            {c}
                        </span>
                    ))}
                </div>
            </div>

            {/* Widgets by category */}
            {categories.map(cat => {
                const widgets = widgetRegistry.getByCategory(cat)
                return (
                    <div key={cat} style={{ marginBottom: 24 }}>
                        <h3 style={{
                            fontSize: 12, fontWeight: 600, color: tmpl.colors.text,
                            textTransform: 'uppercase', letterSpacing: '1px',
                            marginBottom: 12,
                        }}>
                            {cat}
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200, 1fr))',
                            gap: 12,
                        }}>
                            {widgets.map(widget => (
                                <WidgetCard key={widget.type} widget={widget} tmpl={tmpl} />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function WidgetCard({ widget, tmpl }: {
    widget: WidgetDefinition
    tmpl: ReturnType<typeof templateRegistry.get> extends infer T ? NonNullable<T> : never
}) {
    return (
        <div style={{
            padding: 14, borderRadius: 8,
            background: tmpl.colors.surface,
            border: `1px solid ${widget.disabled ? tmpl.colors.border : `${widget.color}33`}`,
            opacity: widget.disabled ? 0.5 : 1,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{widget.icon}</span>
                <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: widget.color }}>
                        {widget.label}
                    </div>
                    <div style={{ fontSize: 9, color: tmpl.colors.textMuted }}>
                        {widget.type}
                    </div>
                </div>
                {widget.disabled && (
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: 8, fontWeight: 700, color: tmpl.colors.textMuted,
                        background: `${tmpl.colors.border}`,
                        padding: '1px 6px', borderRadius: 3,
                        textTransform: 'uppercase',
                    }}>
                        soon
                    </span>
                )}
            </div>
            <p style={{ fontSize: 9, color: tmpl.colors.textMuted, lineHeight: 1.4 }}>
                {widget.description}
            </p>
        </div>
    )
}
