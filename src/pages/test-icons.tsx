/**
 * Icons Gallery — reference page showing all icons used in wibeboard.
 *
 * Displays:
 * 1. Widget type icons (from WidgetIcon registry)
 * 2. Category icons
 * 3. UI icons (Lucide icons used across the app)
 */

import { useState } from 'react'
import { WidgetIcon, getAllIconEntries, CATEGORY_ICONS, WIDGET_ICON_COLORS } from '@/components/WidgetIcon'
import {
    // UI icons used across the app
    Play, Pause, SkipBack, SkipForward, RotateCcw,
    Menu, X, Layout, Layers, Home, GitBranch, Network,
    Search, Clock, ChevronDown, Settings, Check,
    Construction, Sparkles, Cpu,
    type LucideProps,
} from 'lucide-react'

// ── All icons used in wibeboard ─────────────────────────────────────────────────

interface IconItem {
    name: string
    component: React.ComponentType<LucideProps>
    color: string
    usage: string
}

const UI_ICONS: IconItem[] = [
    // Navigation
    { name: 'Home', component: Home, color: '#94a3b8', usage: 'Sidebar: Home page' },
    { name: 'Layout', component: Layout, color: '#94a3b8', usage: 'Sidebar: Builder Demo' },
    { name: 'GitBranch', component: GitBranch, color: '#94a3b8', usage: 'Sidebar: Two-Node Scenario' },
    { name: 'Network', component: Network, color: '#94a3b8', usage: 'Sidebar: Four-Node Concurrent' },
    { name: 'Layers', component: Layers, color: '#94a3b8', usage: 'Sidebar: Widget Gallery' },
    { name: 'Menu', component: Menu, color: '#94a3b8', usage: 'Sidebar toggle (open)' },
    { name: 'X', component: X, color: '#94a3b8', usage: 'Sidebar toggle (close), search clear' },

    // Playback
    { name: 'Play', component: Play, color: '#28c840', usage: 'Step player, script run button' },
    { name: 'Pause', component: Pause, color: '#f59e0b', usage: 'Step player: pause' },
    { name: 'SkipBack', component: SkipBack, color: '#94a3b8', usage: 'Step player: back' },
    { name: 'SkipForward', component: SkipForward, color: '#94a3b8', usage: 'Step player: forward' },
    { name: 'RotateCcw', component: RotateCcw, color: '#94a3b8', usage: 'Step player: reset' },

    // Actions
    { name: 'Settings', component: Settings, color: '#64748b', usage: 'Script node: edit button' },
    { name: 'Check', component: Check, color: '#28c840', usage: 'Script node: done state' },
    { name: 'Search', component: Search, color: '#64748b', usage: 'Widget selector: search input' },
    { name: 'Clock', component: Clock, color: '#64748b', usage: 'Widget selector: recently used' },
    { name: 'ChevronDown', component: ChevronDown, color: '#8b5cf6', usage: 'Widget selector: show more' },
    { name: 'Construction', component: Construction, color: '#f59e0b', usage: 'Placeholder node icon' },
    { name: 'Cpu', component: Cpu, color: '#8b5cf6', usage: 'Fallback icon for unknown types' },
]

// ── Component ────────────────────────────────────────────────────────────────────

export function IconsGalleryPage() {
    const [hovered, setHovered] = useState<string | null>(null)
    const widgetIcons = getAllIconEntries()
    const categoryEntries = Object.entries(CATEGORY_ICONS)

    return (
        <div style={{
            width: '100%', height: '100%',
            background: '#0a0a1a',
            overflow: 'auto',
            padding: '24px 32px',
            fontFamily: 'Inter',
        }}>
            {/* Page header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{
                    fontSize: 18, fontWeight: 700, color: '#e2e8f0',
                    margin: 0, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    <Sparkles size={18} color="#8b5cf6" />
                    Icon Reference
                </h1>
                <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
                    All Lucide icons used across wibeboard — consistent SVG, no emojis
                </p>
            </div>

            {/* ── 1. Widget Type Icons ── */}
            <Section title="Widget Types" subtitle="Icons for node types in the flow builder">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {widgetIcons.map(entry => (
                        <IconCard
                            key={entry.type}
                            name={entry.name}
                            label={entry.type}
                            color={entry.color}
                            isHovered={hovered === entry.type}
                            onHover={setHovered}
                        >
                            <WidgetIcon type={entry.type} size={24} />
                        </IconCard>
                    ))}
                </div>
            </Section>

            {/* ── 2. Category Icons ── */}
            <Section title="Categories" subtitle="Icons for widget category grouping">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {categoryEntries.map(([key, Icon]) => (
                        <IconCard
                            key={key}
                            name={Icon.displayName || key}
                            label={key}
                            color={WIDGET_ICON_COLORS[key.toLowerCase()] || '#8b5cf6'}
                            isHovered={hovered === `cat-${key}`}
                            onHover={(id) => setHovered(id ? `cat-${key}` : null)}
                        >
                            <Icon size={24} color={WIDGET_ICON_COLORS[key.toLowerCase()] || '#8b5cf6'} />
                        </IconCard>
                    ))}
                </div>
            </Section>

            {/* ── 3. UI Icons ── */}
            <Section title="UI Icons" subtitle="Navigation, playback, and action icons">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {UI_ICONS.map(icon => {
                        const Icon = icon.component
                        return (
                            <IconCard
                                key={icon.name}
                                name={icon.name}
                                label={icon.usage}
                                color={icon.color}
                                isHovered={hovered === `ui-${icon.name}`}
                                onHover={(id) => setHovered(id ? `ui-${icon.name}` : null)}
                            >
                                <Icon size={24} color={icon.color} />
                            </IconCard>
                        )
                    })}
                </div>
            </Section>

            {/* ── Summary ── */}
            <div style={{
                marginTop: 24, padding: '12px 16px',
                background: 'rgba(139,92,246,0.05)',
                border: '1px solid rgba(139,92,246,0.15)',
                borderRadius: 8,
            }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#8b5cf6', marginBottom: 4 }}>
                    Icon System Summary
                </div>
                <div style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1.6 }}>
                    <strong style={{ color: '#e2e8f0' }}>{widgetIcons.length}</strong> widget type icons ·{' '}
                    <strong style={{ color: '#e2e8f0' }}>{categoryEntries.length}</strong> category icons ·{' '}
                    <strong style={{ color: '#e2e8f0' }}>{UI_ICONS.length}</strong> UI icons ·{' '}
                    All from <span style={{ color: '#8b5cf6', fontWeight: 600 }}>Lucide React</span> — zero emojis
                </div>
            </div>
        </div>
    )
}

// ── Reusable components ─────────────────────────────────────────────────────────

function Section({ title, subtitle, children }: {
    title: string
    subtitle: string
    children: React.ReactNode
}) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{
                fontSize: 11, fontWeight: 700, color: '#e2e8f0',
                marginBottom: 2, textTransform: 'uppercase',
                letterSpacing: '0.5px',
            }}>
                {title}
            </div>
            <div style={{ fontSize: 9, color: '#64748b', marginBottom: 10 }}>
                {subtitle}
            </div>
            {children}
        </div>
    )
}

function IconCard({
    name, label, color, isHovered, onHover, children,
}: {
    name: string
    label: string
    color: string
    isHovered: boolean
    onHover: (id: string | null) => void
    children: React.ReactNode
}) {
    return (
        <div
            onMouseEnter={() => onHover(name)}
            onMouseLeave={() => onHover(null)}
            style={{
                padding: '12px 10px',
                borderRadius: 8,
                background: isHovered ? `${color}10` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isHovered ? `${color}33` : 'rgba(255,255,255,0.06)'}`,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
                cursor: 'default',
            }}
        >
            {children}
            <div style={{
                fontSize: 9, fontWeight: 600, color: isHovered ? color : '#e2e8f0',
                textAlign: 'center',
            }}>
                {name}
            </div>
            <div style={{
                fontSize: 7, color: '#64748b',
                textAlign: 'center', lineHeight: 1.3,
                maxWidth: 120,
            }}>
                {label}
            </div>
        </div>
    )
}
