import React from 'react'
import type { PluginDefinition } from '../types'
import { presetRegistry } from '@/engine/preset-registry'

/**
 * ── Node Logger Plugin ──────────────────────────────────────────────────────
 *
 * version: 1.0.0
 * description: Registers a JS script preset that logs the node's type, subtype,
 *              ID, and left/right neighbor node IDs and types.
 *
 * When this plugin is enabled, it registers a "Node Logger" preset in the
 * PresetRegistry. The preset creates a JS script node with code that outputs
 * the node's own metadata and its connected neighbor info.
 */

const PRESET_ID = 'job-node-logger'

const NODE_LOGGER_CODE = `// Node Logger — logs this node's metadata and neighbors
const self = {
  type: ctx.node.type || 'unknown',
  subType: ctx.node.subType || 'none',
  id: ctx.node.id || 'unnamed',
}

const left = ctx.leftNode
  ? { id: ctx.leftNode.id, type: ctx.leftNode.type || 'unknown' }
  : null

const right = ctx.rightNode
  ? { id: ctx.rightNode.id, type: ctx.rightNode.type || 'unknown' }
  : null

const result = {
  self,
  leftNode: left,
  rightNode: right,
}

console.log('[Node Logger]', JSON.stringify(result, null, 2))
return result
`

export const nodeLoggerPlugin: PluginDefinition = {
    meta: {
        id: 'node-logger',
        name: 'Node Logger',
        version: '1.0.0',
        description: 'Registers a JS script preset that logs node type, subtype, ID, and left/right neighbor info.',
        author: 'wibeboard',

        source: `---
id: node-logger
name: Node Logger
version: 1.0.0
description: JS script preset that logs node metadata and neighbors
author: wibeboard
---

# Node Logger Plugin

Registers a **Node Logger** preset in the PresetRegistry.

When inserted between two nodes, the logger script outputs:
- \`self\`: { type, subType, id }
- \`leftNode\`: { id, type } of the source node
- \`rightNode\`: { id, type } of the target node

## Usage

1. Enable this plugin on the Plugins page
2. In the builder, use SwipeButtons → "Script" → "Node Logger"
3. Run the pipeline — the node outputs its metadata as JSON
`,
    },

    defaultSettings: {
        autoLog: true,
    },

    onEnable() {
        // Register the "Node Logger" preset in the PresetRegistry
        presetRegistry.registerCustom({
            type: PRESET_ID,
            widgetType: 'job',
            subType: 'js',
            label: 'Node Logger',
            description: 'Logs node type, subtype, ID, left/right neighbor info',
            tags: ['script', 'js', 'logger', 'debug', 'diagnostic'],
            ui: { icons: { default: 'terminal', working: 'loader-2' } },
            defaultData: {
                label: 'Node Logger',
                subType: 'js',
                language: 'js',
                code: NODE_LOGGER_CODE,
            },
        })
    },

    onDisable() {
        // Unregister the preset when the plugin is disabled
        presetRegistry.unregister(PRESET_ID)
    },

    // ── Side Panel ───────────────────────────────────────────────────────────────
    renderSidePanel(_settings) {
        return React.createElement('div', {
            'data-testid': 'node-logger-side',
            style: {
                display: 'flex', flexDirection: 'column', gap: 12,
            },
        },
            React.createElement('div', {
                style: {
                    fontSize: 13, fontWeight: 600, color: '#22c55e',
                    fontFamily: "'JetBrains Mono', monospace",
                },
            }, '📋 Node Logger'),
            React.createElement('div', {
                style: {
                    fontSize: 11, color: '#94a3b8',
                    background: 'rgba(34,197,94,0.06)',
                    border: '1px solid rgba(34,197,94,0.15)',
                    borderRadius: 8, padding: 12,
                    lineHeight: 1.5,
                    fontFamily: "'JetBrains Mono', monospace",
                },
            }, 'Insert a Node Logger between two nodes to inspect:\n• Node type, subType, ID\n• Left neighbor ID & type\n• Right neighbor ID & type'),
            React.createElement('div', {
                style: { fontSize: 10, color: '#64748b', fontFamily: 'Inter' },
            }, `v${nodeLoggerPlugin.meta.version} · Enable to register the preset`),
        )
    },

    // ── Bottom Bar ───────────────────────────────────────────────────────────────
    renderBottomBar(_settings) {
        return React.createElement('span', {
            'data-testid': 'node-logger-status',
            style: { display: 'flex', alignItems: 'center', gap: 4 },
        },
            React.createElement('span', null, '📋'),
            React.createElement('span', null, 'Node Logger active'),
        )
    },

    // ── Settings ─────────────────────────────────────────────────────────────────
    renderSettings(settings, onUpdate) {
        return React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column', gap: 12 },
        },
            React.createElement('label', {
                style: {
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, fontWeight: 600, color: '#94a3b8',
                    cursor: 'pointer',
                },
            },
                React.createElement('input', {
                    type: 'checkbox',
                    checked: settings.autoLog !== false,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        onUpdate({ ...settings, autoLog: e.target.checked }),
                }),
                'Auto-log on node execution',
            ),
        )
    },
}
