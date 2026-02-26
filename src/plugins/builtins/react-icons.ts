import React from 'react'
import type { PluginDefinition } from '../types'
import { registerPluginIcon, unregisterPluginIcons } from '@/components/WidgetIcon'

/**
 * ── React Icons Plugin ────────────────────────────────────────────────────────
 *
 * Extends the wibeboard icon set with additional icons inspired by popular
 * react-icons libraries (Font Awesome, Material Design, SimpleIcons).
 *
 * Each icon provides a fallback from the built-in Lucide set.
 * When the plugin is disabled, icons are unregistered.
 */

const PLUGIN_ID = 'react-icons'

// ── Hand-crafted SVG icon components ────────────────────────────────────────────

function SvgIcon({ size = 16, color = '#8b5cf6', d, viewBox = '0 0 24 24' }: {
    size?: number; color?: string; d: string; viewBox?: string
}) {
    return React.createElement('svg', {
        width: size, height: size, viewBox, fill: color,
        style: { display: 'inline-block', verticalAlign: 'middle' },
    }, React.createElement('path', { d }))
}

// ── Icon definitions ────────────────────────────────────────────────────────────

interface PluginIconEntry {
    name: string
    label: string
    color: string
    fallback: string   // built-in icon key
    d: string          // SVG path
    viewBox?: string   // default '0 0 24 24'
}

const ICONS: PluginIconEntry[] = [
    {
        name: 'fa-home', label: 'Home', color: '#3b82f6',
        fallback: 'play', d: 'M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z',
    },
    {
        name: 'fa-cog', label: 'Settings Cog', color: '#64748b',
        fallback: 'puzzle', d: 'M19.14 12.94a7.07 7.07 0 000-1.88l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96a7.04 7.04 0 00-1.62-.94l-.36-2.54A.48.48 0 0013.93 2h-3.86a.48.48 0 00-.48.41l-.36 2.54a7.04 7.04 0 00-1.62.94l-2.39-.96a.48.48 0 00-.59.22L2.71 8.47a.48.48 0 00.12.61l2.03 1.58a7.07 7.07 0 000 1.88l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.04.7 1.62.94l.36 2.54c.05.24.26.41.48.41h3.86c.22 0 .43-.17.48-.41l.36-2.54a7.04 7.04 0 001.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z',
    },
    {
        name: 'fa-bolt', label: 'Lightning', color: '#fbbf24',
        fallback: 'webhook', d: 'M13 2L4 14h6l-1 8 9-12h-6z',
    },
    {
        name: 'fa-cube', label: 'Cube', color: '#8b5cf6',
        fallback: 'layer', d: 'M12 2L2 7v10l10 5 10-5V7zm0 2.3L19 9l-7 4.7L5 9zm-8 6.2l7 4.5v5.5L4 16zm9 10v-5.5l7-4.5v4.5z',
    },
    {
        name: 'fa-users', label: 'Team', color: '#06b6d4',
        fallback: 'network', d: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    },
    {
        name: 'md-dashboard', label: 'Dashboard', color: '#22c55e',
        fallback: 'bar-chart', d: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
    },
    {
        name: 'md-terminal', label: 'Terminal', color: '#22c55e',
        fallback: 'code', d: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-8-2l4-4-4-4-1.4 1.4L13.2 12l-2.6 2.6z',
    },
    {
        name: 'md-science', label: 'Science', color: '#a855f7',
        fallback: 'activity', d: 'M13 2v2h1v4l5 7.3V17H5v-1.7L10 8V4h1V2H7v2h1v3.6L2.6 16 2 17v2c0 .6.4 1 1 1h18c.6 0 1-.4 1-1v-2l-.6-1L17 7.6V4h1V2h-5z',
    },
    {
        name: 'si-notion', label: 'Notion', color: '#ffffff',
        fallback: 'doc', d: 'M4 4.5A2.5 2.5 0 016.5 2H18l4 4v12.5a2.5 2.5 0 01-2.5 2.5H6.5A2.5 2.5 0 014 18.5v-14zM7 7v2h10V7H7zm0 4v2h10v-2H7zm0 4v2h7v-2H7z',
    },
    {
        name: 'si-slack', label: 'Slack', color: '#4A154B',
        fallback: 'chat', d: 'M5.04 15.16a2.52 2.52 0 01-2.52 2.52 2.52 2.52 0 01-2.52-2.52 2.52 2.52 0 012.52-2.52h2.52v2.52zm1.27 0a2.52 2.52 0 012.52-2.52 2.52 2.52 0 012.52 2.52v6.32a2.52 2.52 0 01-2.52 2.52 2.52 2.52 0 01-2.52-2.52v-6.32zM8.83 5.04a2.52 2.52 0 01-2.52-2.52A2.52 2.52 0 018.83 0a2.52 2.52 0 012.52 2.52v2.52H8.83zm0 1.27a2.52 2.52 0 012.52 2.52 2.52 2.52 0 01-2.52 2.52H2.52A2.52 2.52 0 010 8.83a2.52 2.52 0 012.52-2.52h6.31zm10.13 2.52a2.52 2.52 0 012.52-2.52A2.52 2.52 0 0124 8.83a2.52 2.52 0 01-2.52 2.52h-2.52V8.83zm-1.27 0a2.52 2.52 0 01-2.52 2.52 2.52 2.52 0 01-2.52-2.52V2.52A2.52 2.52 0 0115.17 0a2.52 2.52 0 012.52 2.52v6.31zm-2.52 10.13a2.52 2.52 0 012.52 2.52 2.52 2.52 0 01-2.52 2.52 2.52 2.52 0 01-2.52-2.52v-2.52h2.52zm0-1.27a2.52 2.52 0 01-2.52-2.52 2.52 2.52 0 012.52-2.52h6.31A2.52 2.52 0 0124 15.17a2.52 2.52 0 01-2.52 2.52h-6.31z',
    },
    {
        name: 'fa-paint-brush', label: 'Design', color: '#ec4899',
        fallback: 'star', d: 'M7 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z',
    },
    {
        name: 'fa-chart-line', label: 'Analytics', color: '#f97316',
        fallback: 'bar-chart', d: 'M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z',
    },
    {
        name: 'md-memory', label: 'Memory', color: '#06b6d4',
        fallback: 'database', d: 'M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z',
    },
    {
        name: 'fa-box', label: 'Package', color: '#f59e0b',
        fallback: 'folder', d: 'M20.5 5.19L12 1 3.5 5.19 12 9.38zM2 17.66l9 5.19V10.85L2 5.66zm11-6.81v12l9-5.19V5.66z',
    },
    {
        name: 'md-gesture', label: 'Gesture', color: '#ef4444',
        fallback: 'activity', d: 'M4.59 6.89c.7-.71 1.4-1.35 1.71-1.22.5.2 0 1.03-.3 1.52-.25.42-2.86 3.89-2.86 6.31 0 1.28.48 2.34 1.34 2.98.75.56 1.74.73 2.64.46 1.07-.31 1.95-1.4 3.06-2.77 1.21-1.49 2.83-3.44 4.08-3.44 1.63 0 1.65 1.01 1.76 1.79-3.78.64-5.38 3.67-5.38 5.37 0 1.7 1.44 3.09 3.21 3.09 1.63 0 4.29-1.33 4.69-6.1H21v-2.5h-2.47c-.15-1.65-1.09-4.2-4.03-4.2-2.25 0-4.18 1.91-4.94 2.84-.58.73-2.06 2.48-2.29 2.72-.25.3-.68.84-1.11.84-.45 0-.72-.83-.36-1.92.35-1.09 1.4-2.86 1.85-3.52.78-1.14 1.3-1.92 1.3-3.28C8.95 3.69 7.31 3 6.44 3 5.12 3 3.97 4 3.72 4.25c-.36.36-.66.66-.88.93z',
    },
]

// ── Registration helpers ────────────────────────────────────────────────────────

function enableIcons() {
    for (const icon of ICONS) {
        const component = ({ size, color }: { size?: number; color?: string }) =>
            SvgIcon({ size, color: color || icon.color, d: icon.d, viewBox: icon.viewBox })
        registerPluginIcon(icon.name, {
            component,
            color: icon.color,
            fallbackBuiltin: icon.fallback,
            pluginId: PLUGIN_ID,
        })
    }
}

function disableIcons() {
    unregisterPluginIcons(PLUGIN_ID)
}

// ── Plugin export ───────────────────────────────────────────────────────────────

export const reactIconsPlugin: PluginDefinition = {
    meta: {
        id: PLUGIN_ID,
        name: 'React Icons',
        version: '1.0.0',
        description: 'Extends the icon set with 15 additional icons inspired by Font Awesome, Material Design, and SimpleIcons.',
        author: 'wibeboard',
        icon: React.createElement('span', { style: { fontSize: 16 } }, '🎨'),

        source: `---
id: react-icons
name: React Icons
version: 1.0.0
description: Extends wibeboard icon set
author: wibeboard
---

# React Icons Plugin

Registers additional icons into the Icon Registry.
Each icon provides a **fallback** from the built-in Lucide set.

When disabled, the plugin icons are unregistered.

## Icons Provided

${ICONS.map(i => `- **${i.label}** (\`${i.name}\`) → fallback: \`${i.fallback}\``).join('\n')}
`,
    },

    defaultSettings: {},

    onEnable: enableIcons,
    onDisable: disableIcons,

    // ── Side Panel ──────────────────────────────────────────────────────────────
    renderSidePanel() {
        const gridStyle: React.CSSProperties = {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
            gap: 6,
        }
        const tileStyle: React.CSSProperties = {
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, padding: 6, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
            minHeight: 48,
        }
        const labelStyle: React.CSSProperties = {
            fontSize: 7, color: '#94a3b8', textAlign: 'center',
            lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }

        return React.createElement('div', {
            'data-testid': 'react-icons-side',
            style: { display: 'flex', flexDirection: 'column', gap: 10 },
        },
            React.createElement('div', {
                style: { fontSize: 12, fontWeight: 600, color: '#c084fc', fontFamily: "'JetBrains Mono', monospace" },
            }, `🎨 React Icons (${ICONS.length})`),
            React.createElement('div', { 'data-testid': 'react-icons-grid', style: gridStyle },
                ...ICONS.map(icon =>
                    React.createElement('div', { key: icon.name, style: tileStyle },
                        SvgIcon({ size: 20, color: icon.color, d: icon.d, viewBox: icon.viewBox }),
                        React.createElement('span', { style: labelStyle }, icon.label),
                    )
                )
            ),
            React.createElement('div', {
                style: { fontSize: 9, color: '#475569', fontFamily: 'Inter' },
            }, 'Each icon has a built-in fallback icon.'),
        )
    },

    // ── Bottom Bar ──────────────────────────────────────────────────────────────
    renderBottomBar() {
        return React.createElement('span', {
            'data-testid': 'react-icons-status',
            style: { display: 'flex', alignItems: 'center', gap: 4 },
        },
            React.createElement('span', null, '🎨'),
            React.createElement('span', null, `Icons: ${ICONS.length}`),
        )
    },

    // ── Settings ────────────────────────────────────────────────────────────────
    renderSettings() {
        return React.createElement('div', {
            style: { fontSize: 12, color: '#94a3b8', lineHeight: 1.6 },
        },
            React.createElement('p', null, `This plugin provides ${ICONS.length} additional icons.`),
            React.createElement('p', null, 'Each icon has a fallback from the built-in Lucide set, used when this plugin is disabled.'),
            React.createElement('div', {
                style: { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 },
            },
                ...ICONS.map(icon =>
                    React.createElement('div', {
                        key: icon.name,
                        style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 },
                    },
                        SvgIcon({ size: 14, color: icon.color, d: icon.d, viewBox: icon.viewBox }),
                        React.createElement('span', { style: { color: '#e2e8f0', fontWeight: 500 } }, icon.label),
                        React.createElement('span', { style: { color: '#475569' } }, `→ ${icon.fallback}`),
                    )
                )
            ),
        )
    },
}
