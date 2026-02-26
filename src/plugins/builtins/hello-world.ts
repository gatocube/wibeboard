import React from 'react'
import type { PluginDefinition } from '../types'

/**
 * ── Hello World Plugin ────────────────────────────────────────────────────────
 *
 * version: 1.0.0
 * description: A minimal example plugin that displays configurable phrases
 *              in the side panel and bottom status bar.
 * author: wibeboard
 */

export const helloWorldPlugin: PluginDefinition = {
    meta: {
        id: 'hello-world',
        name: 'Hello World',
        version: '1.0.0',
        description: 'A minimal example plugin that displays configurable phrases in the side panel and bottom bar.',
        author: 'wibeboard',

        source: `---
id: hello-world
name: Hello World
version: 1.0.0
description: A minimal example plugin
author: wibeboard
---

# Hello World Plugin

Displays configurable phrases in two slots:
- **Side Panel** — shows a greeting card
- **Bottom Bar** — shows a status indicator

## Settings

\`\`\`tsx
<input label="Side Panel Phrase" bind="sidePhrase" />
<input label="Status Bar Phrase" bind="statusPhrase" />
\`\`\`

## Side Panel

\`\`\`tsx
<Card title="👋 Hello World">
  {settings.sidePhrase}
</Card>
\`\`\`

## Bottom Bar

\`\`\`tsx
<StatusDot color="green" />
<span>{settings.statusPhrase}</span>
\`\`\`
`,
    },

    defaultSettings: {
        sidePhrase: 'Hello from the side panel!',
        statusPhrase: 'Hello, World!',
    },

    // ── Side Panel ──────────────────────────────────────────────────────────────
    renderSidePanel(settings) {
        return React.createElement('div', {
            'data-testid': 'hello-world-side',
            style: {
                display: 'flex', flexDirection: 'column', gap: 12,
            },
        },
            React.createElement('div', {
                style: {
                    fontSize: 13, fontWeight: 600, color: '#c084fc',
                    fontFamily: "'JetBrains Mono', monospace",
                },
            }, '👋 Hello World'),
            React.createElement('div', {
                style: {
                    fontSize: 20, fontWeight: 700, color: '#e2e8f0',
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 10, padding: '16px 14px',
                    lineHeight: 1.4,
                },
            }, settings.sidePhrase || 'Hello from the side panel!'),
            React.createElement('div', {
                style: { fontSize: 10, color: '#64748b', fontFamily: 'Inter' },
            }, `v${helloWorldPlugin.meta.version} · Configure on the Plugins page`),
        )
    },

    // ── Bottom Bar ──────────────────────────────────────────────────────────────
    renderBottomBar(settings) {
        return React.createElement('span', {
            'data-testid': 'hello-world-status',
            style: { display: 'flex', alignItems: 'center', gap: 4 },
        },
            React.createElement('span', null, '🟢'),
            React.createElement('span', null, settings.statusPhrase || 'Hello, World!'),
        )
    },

    // ── Settings ────────────────────────────────────────────────────────────────
    renderSettings(settings, onUpdate) {
        const inputStyle: React.CSSProperties = {
            width: '100%',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#fff',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
            boxSizing: 'border-box',
        }

        return React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column', gap: 16 },
        },
            // Side panel phrase
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                React.createElement('label', {
                    style: { fontSize: 12, fontWeight: 600, color: '#94a3b8' },
                }, 'Side Panel Phrase'),
                React.createElement('input', {
                    'data-testid': 'hello-world-side-input',
                    type: 'text',
                    value: settings.sidePhrase ?? '',
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        onUpdate({ ...settings, sidePhrase: e.target.value }),
                    style: inputStyle,
                }),
            ),
            // Status bar phrase
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                React.createElement('label', {
                    style: { fontSize: 12, fontWeight: 600, color: '#94a3b8' },
                }, 'Status Bar Phrase'),
                React.createElement('input', {
                    'data-testid': 'hello-world-status-input',
                    type: 'text',
                    value: settings.statusPhrase ?? '',
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        onUpdate({ ...settings, statusPhrase: e.target.value }),
                    style: inputStyle,
                }),
            ),
        )
    },
}
