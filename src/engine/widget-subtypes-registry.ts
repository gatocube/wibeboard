/**
 * SubType Registry — JSON schemas for widget settings, runtime state, and UI.
 *
 * Each subtype defines:
 *   • settingsSchema — user-editable fields (label, code, color, etc.)
 *   • stateSchema    — runtime-only fields (status, progress, execTime, etc.)
 *   • uiSchema       — visual definitions (color, icons, borders, palettes)
 *
 * uiSchema is the **single source of truth** for all visual properties.
 * Widget renderers should read from here instead of maintaining local color/icon maps.
 *
 * Keyed as `widgetType:subType` (e.g. 'job:ai', 'informer:web').
 * Widget types without subtypes use 'default'.
 *
 * Extends Registry<SubTypeDefinition> for standard get/getAll/search/has/keys.
 */

import { Registry, type RegistryItem } from './core'

// ── Schema types ────────────────────────────────────────────────────────────────

export interface FieldSchema {
    /** Field value type */
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum'
    /** Human-readable label */
    label: string
    /** Description / help text */
    description?: string
    /** Default value */
    default?: any
    /** Whether this field is required */
    required?: boolean
    /** For enum type — possible values */
    enum?: { value: string; label: string }[]
    /** For string type — editor hint (code, multiline, url, color, icon) */
    format?: 'code' | 'multiline' | 'url' | 'color' | 'icon' | 'plain'
    /** For number type — min constraint */
    min?: number
    /** For number type — max constraint */
    max?: number
    /** For array/object — nested item schema */
    items?: FieldSchema
    /** Whether this field is read-only in the UI */
    readOnly?: boolean
}

// ── UI Schema ───────────────────────────────────────────────────────────────────

export interface WidgetUISchema {
    /** Primary accent color */
    color: string
    /** Gradient border colors (e.g. AI rainbow border) */
    borderColors?: string[]
    /** Background style */
    background?: {
        type: 'solid' | 'gradient' | 'palette'
        /** CSS value for solid/gradient, or palette name for palette type */
        value: string
    }
    /** Border style */
    border?: {
        style: 'solid' | 'dashed' | 'gradient'
        width?: number
        radius?: number
    }
    /** Icons per state */
    icons: {
        default: string
        working?: string
        error?: string
        done?: string
    }
    /** Named color palette (e.g. sticker colors: yellow, pink, etc.) */
    palette?: Record<string, { bg: string; text: string; border: string }>
}

// ── SubType Definition ──────────────────────────────────────────────────────────

export interface SubTypeDefinition extends RegistryItem {
    /** Parent widget type (e.g. 'job') */
    widgetType: string
    /** SubType value (e.g. 'ai', 'js', 'web', 'default') */
    subType: string
    /** Color associated with this subtype (shorthand for uiSchema.color) */
    color: string
    /** Visual definition — single source of truth for rendering */
    uiSchema: WidgetUISchema
    /** JSON schema for user-editable settings */
    settingsSchema: Record<string, FieldSchema>
    /** JSON schema for runtime state (read-only in UI) */
    stateSchema: Record<string, FieldSchema>
}

// ── Shared field definitions ────────────────────────────────────────────────────

const F_LABEL: FieldSchema = { type: 'string', label: 'Label', description: 'Display name of the node', required: true }
const F_COLOR: FieldSchema = { type: 'string', label: 'Color', description: 'Node accent color', format: 'color', default: '#8b5cf6' }
const F_CODE: FieldSchema = { type: 'string', label: 'Code', description: 'Script source code', format: 'code' }
const F_LANGUAGE: FieldSchema = {
    type: 'enum', label: 'Language', description: 'Script language',
    enum: [
        { value: 'js', label: 'JavaScript' },
        { value: 'ts', label: 'TypeScript' },
        { value: 'sh', label: 'Shell' },
        { value: 'py', label: 'Python' },
    ],
}
const F_SANDBOX: FieldSchema = {
    type: 'enum', label: 'Sandbox', description: 'Execution environment',
    enum: [
        { value: 'browser', label: 'Browser' },
        { value: 'node', label: 'Node.js' },
        { value: 'docker', label: 'Docker' },
    ],
    default: 'browser',
}

// State fields (shared across job subtypes)
const S_STATUS: FieldSchema = {
    type: 'enum', label: 'Status', description: 'Current execution status', readOnly: true,
    enum: [
        { value: 'idle', label: 'Idle' },
        { value: 'waking', label: 'Waking' },
        { value: 'running', label: 'Running' },
        { value: 'done', label: 'Done' },
        { value: 'error', label: 'Error' },
    ],
    default: 'idle',
}
const S_EXEC_TIME: FieldSchema = { type: 'string', label: 'Exec Time', description: 'Last execution duration', readOnly: true, default: '—' }
const S_CALLS_COUNT: FieldSchema = { type: 'number', label: 'Calls', description: 'Number of tool calls', readOnly: true, default: 0, min: 0 }
const S_PROGRESS: FieldSchema = { type: 'number', label: 'Progress', description: 'Completion percentage', readOnly: true, default: 0, min: 0, max: 100 }
const S_LOGS: FieldSchema = { type: 'array', label: 'Logs', description: 'Execution log lines', readOnly: true, items: { type: 'string', label: 'Log line' } }

// Expectation status (shared)
const S_ASSERTION: FieldSchema = {
    type: 'enum', label: 'Status', description: 'Assertion result', readOnly: true,
    enum: [
        { value: 'pending', label: 'Pending' },
        { value: 'pass', label: 'Pass' },
        { value: 'fail', label: 'Fail' },
    ],
    default: 'pending',
}

// ── Sticker palette (moved from InformerNode.tsx) ───────────────────────────────

const STICKER_PALETTE: Record<string, { bg: string; text: string; border: string }> = {
    yellow: { bg: '#fef3c7', text: '#92400e', border: '#fbbf2444' },
    pink: { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d444' },
    green: { bg: '#d1fae5', text: '#065f46', border: '#6ee7b744' },
    blue: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd44' },
    purple: { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd44' },
    orange: { bg: '#ffedd5', text: '#9a3412', border: '#fdba7444' },
}

// ── SubType Data ────────────────────────────────────────────────────────────────

const SUBTYPES: Omit<SubTypeDefinition, 'id'>[] = [
    // ── Job: AI ──
    {
        type: 'job:ai', widgetType: 'job', subType: 'ai',
        label: 'AI Agent', description: 'LLM-powered agent with tool calls and thinking',
        tags: ['job', 'ai', 'agent', 'llm'],
        color: '#8b5cf6',
        uiSchema: {
            color: '#8b5cf6',
            borderColors: ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'],
            border: { style: 'gradient', width: 1, radius: 12 },
            icons: { default: 'sparkles', working: 'loader-2', error: 'alert-triangle', done: 'check-circle' },
        },
        settingsSchema: {
            label: F_LABEL,
            agent: { type: 'string', label: 'Agent', description: 'AI model or agent name', default: 'Claude 3.5' },
            code: { ...F_CODE, default: `export function activate(ctx) {\n   console.log('hello from AI');\n}` },
            language: F_LANGUAGE,
            color: F_COLOR,
            borderColors: { type: 'array', label: 'Border Colors', description: 'Gradient border colors', items: { type: 'string', label: 'Color', format: 'color' } },
        },
        stateSchema: {
            status: S_STATUS,
            thought: { type: 'string', label: 'Thought', description: 'Current agent thinking', readOnly: true },
            progress: S_PROGRESS,
            execTime: S_EXEC_TIME,
            callsCount: S_CALLS_COUNT,
            totalRuns: { type: 'number', label: 'Total Runs', description: 'Cumulative run count', readOnly: true, default: 0, min: 0 },
            logs: S_LOGS,
        },
    },
    // ── Job: JavaScript ──
    {
        type: 'job:js', widgetType: 'job', subType: 'js',
        label: 'JavaScript', description: 'JavaScript script with activate() entry',
        tags: ['job', 'js', 'javascript', 'script'],
        color: '#f7df1e',
        uiSchema: {
            color: '#f7df1e',
            border: { style: 'solid', width: 1, radius: 12 },
            icons: { default: 'script-js', working: 'loader-2', error: 'alert-triangle', done: 'check-circle' },
        },
        settingsSchema: {
            label: F_LABEL,
            code: { ...F_CODE, default: `export function activate(ctx) {\n   console.log('Hello from js');\n}` },
            language: { ...F_LANGUAGE, default: 'js' },
            sandbox: F_SANDBOX,
            color: { ...F_COLOR, default: '#f7df1e' },
        },
        stateSchema: {
            status: S_STATUS,
            execTime: S_EXEC_TIME,
            callsCount: S_CALLS_COUNT,
            logs: S_LOGS,
        },
    },
    // ── Job: TypeScript ──
    {
        type: 'job:ts', widgetType: 'job', subType: 'ts',
        label: 'TypeScript', description: 'TypeScript with type-safe activate()',
        tags: ['job', 'ts', 'typescript', 'script'],
        color: '#3178c6',
        uiSchema: {
            color: '#3178c6',
            border: { style: 'solid', width: 1, radius: 12 },
            icons: { default: 'script-ts', working: 'loader-2', error: 'alert-triangle', done: 'check-circle' },
        },
        settingsSchema: {
            label: F_LABEL,
            code: { ...F_CODE, default: `export function activate(ctx: Context) {\n   console.log('Hello from', ctx.node.name);\n}` },
            language: { ...F_LANGUAGE, default: 'ts' },
            sandbox: F_SANDBOX,
            color: { ...F_COLOR, default: '#3178c6' },
        },
        stateSchema: {
            status: S_STATUS,
            execTime: S_EXEC_TIME,
            callsCount: S_CALLS_COUNT,
            logs: S_LOGS,
        },
    },
    // ── Job: Shell ──
    {
        type: 'job:sh', widgetType: 'job', subType: 'sh',
        label: 'Shell', description: 'Shell script for system commands',
        tags: ['job', 'sh', 'shell', 'bash', 'script'],
        color: '#4caf50',
        uiSchema: {
            color: '#4caf50',
            border: { style: 'solid', width: 1, radius: 12 },
            icons: { default: 'script-sh', working: 'loader-2', error: 'alert-triangle', done: 'check-circle' },
        },
        settingsSchema: {
            label: F_LABEL,
            code: { ...F_CODE, default: `#!/bin/bash\necho "Hello from $NODE_NAME"` },
            language: { ...F_LANGUAGE, default: 'sh' },
            sandbox: F_SANDBOX,
            color: { ...F_COLOR, default: '#4caf50' },
        },
        stateSchema: {
            status: S_STATUS,
            execTime: S_EXEC_TIME,
            callsCount: S_CALLS_COUNT,
            logs: S_LOGS,
        },
    },
    // ── Job: Python ──
    {
        type: 'job:py', widgetType: 'job', subType: 'py',
        label: 'Python', description: 'Python for data processing and ML',
        tags: ['job', 'py', 'python', 'script', 'ml'],
        color: '#3776ab',
        uiSchema: {
            color: '#3776ab',
            border: { style: 'solid', width: 1, radius: 12 },
            icons: { default: 'script-py', working: 'loader-2', error: 'alert-triangle', done: 'check-circle' },
        },
        settingsSchema: {
            label: F_LABEL,
            code: { ...F_CODE, default: `def activate(ctx):\n    print(f"Hello from {ctx.node.name}")` },
            language: { ...F_LANGUAGE, default: 'py' },
            sandbox: F_SANDBOX,
            color: { ...F_COLOR, default: '#3776ab' },
        },
        stateSchema: {
            status: S_STATUS,
            execTime: S_EXEC_TIME,
            callsCount: S_CALLS_COUNT,
            logs: S_LOGS,
        },
    },

    // ── Informer: Static ──
    {
        type: 'informer:static', widgetType: 'informer', subType: 'static',
        label: 'Static Note', description: 'Post-it note, section label, heading, or caption',
        tags: ['informer', 'static', 'note', 'sticker'],
        color: '#fbbf24',
        uiSchema: {
            color: '#fbbf24',
            border: { style: 'solid', width: 1, radius: 3 },
            icons: { default: 'sticky-note' },
            palette: STICKER_PALETTE,
        },
        settingsSchema: {
            label: F_LABEL,
            content: { type: 'string', label: 'Content', description: 'Note body text', format: 'multiline' },
            color: { ...F_COLOR, default: 'yellow' },
        },
        stateSchema: {},
    },
    // ── Informer: Web ──
    {
        type: 'informer:web', widgetType: 'informer', subType: 'web',
        label: 'Web Embed', description: 'Embedded web page via iframe',
        tags: ['informer', 'web', 'iframe', 'embed'],
        color: '#8b5cf6',
        uiSchema: {
            color: '#8b5cf6',
            border: { style: 'solid', width: 1, radius: 12 },
            icons: { default: 'globe' },
        },
        settingsSchema: {
            label: F_LABEL,
            url: { type: 'string', label: 'URL', description: 'Web page URL to embed', format: 'url', required: true },
            color: { ...F_COLOR, default: '#8b5cf6' },
        },
        stateSchema: {},
    },

    // ── Expectation: Artifact ──
    {
        type: 'expectation:artifact', widgetType: 'expectation', subType: 'artifact',
        label: 'Artifact', description: 'Expects agent to generate an artifact',
        tags: ['expectation', 'artifact', 'assert'],
        color: '#ec4899',
        uiSchema: {
            color: '#ec4899',
            border: { style: 'dashed', width: 1.5, radius: 10 },
            icons: { default: 'file-text', done: 'check-circle', error: 'x-circle' },
        },
        settingsSchema: {
            label: F_LABEL,
            target: { type: 'string', label: 'Target', description: 'Expected artifact name (e.g. README.md)', required: true },
            color: { ...F_COLOR, default: '#ec4899' },
        },
        stateSchema: { status: S_ASSERTION },
    },
    // ── Expectation: Tool Call ──
    {
        type: 'expectation:tool-call', widgetType: 'expectation', subType: 'tool-call',
        label: 'Tool Call', description: 'Expects agent to call a specific tool',
        tags: ['expectation', 'tool', 'call', 'assert'],
        color: '#06b6d4',
        uiSchema: {
            color: '#06b6d4',
            border: { style: 'dashed', width: 1.5, radius: 10 },
            icons: { default: 'wrench', done: 'check-circle', error: 'x-circle' },
        },
        settingsSchema: {
            label: F_LABEL,
            target: { type: 'string', label: 'Target', description: 'Expected tool call (e.g. deploy())', required: true },
            color: { ...F_COLOR, default: '#06b6d4' },
        },
        stateSchema: { status: S_ASSERTION },
    },

    // ── User (default) ──
    {
        type: 'user:default', widgetType: 'user', subType: 'default',
        label: 'User', description: 'Human interaction node — reviews, approvals, manual gates',
        tags: ['user', 'human', 'review', 'approval'],
        color: '#f59e0b',
        uiSchema: {
            color: '#f59e0b',
            border: { style: 'solid', width: 1, radius: 12 },
            icons: { default: 'user-circle' },
        },
        settingsSchema: {
            label: F_LABEL,
            reviewTitle: { type: 'string', label: 'Review Title', description: 'Title shown in the review dialog' },
            reviewBody: { type: 'string', label: 'Review Body', description: 'Instructions for the reviewer', format: 'multiline' },
            color: { ...F_COLOR, default: '#f59e0b' },
        },
        stateSchema: {
            status: S_STATUS,
        },
    },

    // ── SubFlow (default) ──
    {
        type: 'subflow:default', widgetType: 'subflow', subType: 'default',
        label: 'SubFlow', description: 'Nested flow container',
        tags: ['subflow', 'nested', 'container'],
        color: '#6366f1',
        uiSchema: {
            color: '#6366f1',
            border: { style: 'solid', width: 1, radius: 16 },
            icons: { default: 'workflow', working: 'loader-2' },
        },
        settingsSchema: {
            label: F_LABEL,
            color: { ...F_COLOR, default: '#6366f1' },
        },
        stateSchema: {
            nodeCount: { type: 'number', label: 'Node Count', description: 'Number of nodes inside', readOnly: true, default: 0, min: 0 },
            avgExecTime: { type: 'string', label: 'Avg Exec Time', description: 'Average execution time of child nodes', readOnly: true, default: '—' },
            hasAI: { type: 'boolean', label: 'Has AI', description: 'Whether the subflow contains AI nodes', readOnly: true, default: false },
        },
    },

    // ── Group (default) ──
    {
        type: 'group:default', widgetType: 'group', subType: 'default',
        label: 'Group', description: 'Visual container that groups related nodes',
        tags: ['group', 'container', 'layout'],
        color: '#6366f1',
        uiSchema: {
            color: '#6366f1',
            border: { style: 'dashed', width: 2, radius: 16 },
            icons: { default: 'package' },
        },
        settingsSchema: {
            label: F_LABEL,
            color: { ...F_COLOR, default: '#6366f1' },
        },
        stateSchema: {},
    },

    // ── Starting (default) ──
    {
        type: 'starting:default', widgetType: 'starting', subType: 'default',
        label: 'Starting', description: 'Flow entry point — play button',
        tags: ['starting', 'entry', 'begin'],
        color: '#22c55e',
        uiSchema: {
            color: '#22c55e',
            border: { style: 'solid', width: 1, radius: 12 },
            icons: { default: 'play' },
        },
        settingsSchema: {
            label: F_LABEL,
            color: { ...F_COLOR, default: '#22c55e' },
        },
        stateSchema: {},
    },
]

// ── Registry API ────────────────────────────────────────────────────────────────

class SubTypeRegistry extends Registry<SubTypeDefinition> {
    constructor(subtypes: Omit<SubTypeDefinition, 'id'>[]) {
        super(subtypes.map(s => {
            const key = `${s.widgetType}:${s.subType}`
            return [key, { ...s, id: key }] as [string, SubTypeDefinition]
        }))
    }

    /** Get all subtypes for a widget type */
    getByWidget(widgetType: string): SubTypeDefinition[] {
        return this.getAll().filter(s => s.widgetType === widgetType)
    }

    /** Get a specific subtype definition */
    getBySubType(widgetType: string, subType: string): SubTypeDefinition | undefined {
        return this.get(`${widgetType}:${subType}`)
    }

    // ── Schema accessors ──

    /** Get the settings schema for a widget+subType. Falls back to 'default'. */
    getSettingsSchema(widgetType: string, subType?: string): Record<string, FieldSchema> {
        const def = this._resolve(widgetType, subType)
        return def?.settingsSchema ?? {}
    }

    /** Get the state schema for a widget+subType. Falls back to 'default'. */
    getStateSchema(widgetType: string, subType?: string): Record<string, FieldSchema> {
        const def = this._resolve(widgetType, subType)
        return def?.stateSchema ?? {}
    }

    // ── UI accessors (single source of truth) ──

    /** Get the full UI schema for a widget+subType. Falls back to 'default'. */
    getUISchema(widgetType: string, subType?: string): WidgetUISchema | undefined {
        return this._resolve(widgetType, subType)?.uiSchema
    }

    /** Resolve the primary accent color for a widget+subType */
    resolveColor(widgetType: string, subType?: string): string {
        return this._resolve(widgetType, subType)?.uiSchema.color ?? '#8b5cf6'
    }

    /** Resolve the icons object for a widget+subType */
    resolveIcons(widgetType: string, subType?: string): WidgetUISchema['icons'] {
        return this._resolve(widgetType, subType)?.uiSchema.icons ?? { default: 'package' }
    }

    /** Resolve border colors (gradient) for a widget+subType, or undefined */
    resolveBorderColors(widgetType: string, subType?: string): string[] | undefined {
        return this._resolve(widgetType, subType)?.uiSchema.borderColors
    }

    /** Resolve the named palette (e.g. sticker colors) for a widget+subType */
    resolvePalette(widgetType: string, subType?: string): Record<string, { bg: string; text: string; border: string }> | undefined {
        return this._resolve(widgetType, subType)?.uiSchema.palette
    }

    /** Get color for a specific subtype (legacy compat) */
    getColor(widgetType: string, subType: string): string | undefined {
        return this.getBySubType(widgetType, subType)?.color
    }

    // ── Default value extraction ──

    /** Extract default settings values from the settingsSchema */
    getDefaultSettings(widgetType: string, subType?: string): Record<string, any> {
        const schema = this.getSettingsSchema(widgetType, subType)
        const defaults: Record<string, any> = {}
        for (const [key, field] of Object.entries(schema)) {
            if (field.default !== undefined) defaults[key] = field.default
        }
        // Also inject subType itself and UI-derived defaults
        const def = this._resolve(widgetType, subType)
        if (def) {
            if (!defaults.color) defaults.color = def.uiSchema.color
            if (def.uiSchema.borderColors && !defaults.borderColors) {
                defaults.borderColors = def.uiSchema.borderColors
            }
            // language defaults to subType for job subtypes
            if (def.widgetType === 'job' && !defaults.language) {
                defaults.language = def.subType
            }
        }
        return defaults
    }

    /** Extract default state values from the stateSchema */
    getDefaultState(widgetType: string, subType?: string): Record<string, any> {
        const schema = this.getStateSchema(widgetType, subType)
        const defaults: Record<string, any> = {}
        for (const [key, field] of Object.entries(schema)) {
            if (field.default !== undefined) defaults[key] = field.default
        }
        return defaults
    }

    /** Resolve full node data by merging subtype defaults with overrides.
     *  Returns { settings, state } structure. */
    resolveNodeData(
        widgetType: string,
        subType?: string,
        overrides?: Record<string, any>,
    ): { settings: Record<string, any>; state: Record<string, any> } {
        const settingsDefaults = this.getDefaultSettings(widgetType, subType)
        const stateDefaults = this.getDefaultState(widgetType, subType)

        // Resolve which override keys belong to settings vs state
        const settingsKeys = new Set(Object.keys(this.getSettingsSchema(widgetType, subType)))
        const stateKeys = new Set(Object.keys(this.getStateSchema(widgetType, subType)))

        const settings = { ...settingsDefaults }
        const state = { ...stateDefaults }

        if (overrides) {
            for (const [key, value] of Object.entries(overrides)) {
                if (settingsKeys.has(key)) {
                    settings[key] = value
                } else if (stateKeys.has(key)) {
                    state[key] = value
                } else {
                    // Unknown keys go into settings as overrides
                    settings[key] = value
                }
            }
        }

        return { settings, state }
    }

    // ── Internal ──

    private _resolve(widgetType: string, subType?: string): SubTypeDefinition | undefined {
        if (subType && subType !== 'default') {
            const exact = this.get(`${widgetType}:${subType}`)
            if (exact) return exact
        }
        return this.get(`${widgetType}:default`)
    }
}

export const subTypeRegistry = new SubTypeRegistry(SUBTYPES)

// Expose for E2E testing
if (typeof window !== 'undefined') {
    ; (window as any).__subTypeRegistry = subTypeRegistry
}
