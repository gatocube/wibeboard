/**
 * Widget Registry — available node types for the builder.
 *
 * Each widget has: type, label, ui, category, description, presets.
 * Presets define default data for creating new nodes.
 *
 * The `subTypes` array lists the available sub-type specializations.
 * For widgets with subTypes, presets carry `subType` in defaultData.
 *
 * ALL sizes are stored in **grid units** (gu).
 * Use GRID_CELL to convert: pixels = gu * GRID_CELL.
 */

import { Registry, type RegistryItem } from './registry'

export const GRID_CELL = 20       // px per grid unit
export const MIN_NODE_SIZE = 3    // minimum node dimension: 3×3 gu (60×60 px)

// ── UI types ────────────────────────────────────────────────────────────────────

/** Per-state icon names (Lucide icon keys) */
export interface WidgetIcons {
    default: string
    working?: string    // shown during execution
    error?: string      // shown on failure
    done?: string       // shown on completion
}

/** Visual / layout properties for a widget */
export interface WidgetUI {
    icons: WidgetIcons
    color: string
    /** Default size in grid units */
    defaultSize: { w: number; h: number }
}

// ── Template types ──────────────────────────────────────────────────────────────

export interface WidgetPreset {
    name: string
    description: string
    defaultData: Record<string, any>
    /** Optional per-preset UI overrides (icons, color, size) */
    ui?: Partial<WidgetUI>
}

// ── Widget definition ───────────────────────────────────────────────────────────

export type WidgetCategory = 'AI' | 'Script' | 'Job' | 'Layout' | 'Informer' | 'Expectation' | 'Starting' | 'SubFlow'

export interface WidgetDefinition extends RegistryItem {
    category: WidgetCategory
    ui: WidgetUI
    presets: WidgetPreset[]
    disabled?: boolean
    /** Available sub-types for this widget */
    subTypes?: { value: string; label: string; color?: string }[]
}

// ── Widget Definitions ─────────────────────────────────────────────────────────

const WIDGETS: Omit<WidgetDefinition, 'id'>[] = [
    {
        type: 'job',
        label: 'Job',
        category: 'Job',
        tags: ['agent', 'worker', 'ai', 'llm', 'task', 'execute', 'script', 'code', 'python', 'typescript', 'javascript', 'shell'],
        description: 'AI agent or code script that executes tasks',
        ui: {
            icons: { default: 'briefcase', working: 'loader-2', error: 'alert-triangle', done: 'check-circle' },
            color: '#8b5cf6',
            defaultSize: { w: 10, h: 6 },
        },
        subTypes: [
            { value: 'ai', label: 'AI Agent', color: '#8b5cf6' },
            { value: 'js', label: 'JavaScript', color: '#f7df1e' },
            { value: 'ts', label: 'TypeScript', color: '#3178c6' },
            { value: 'sh', label: 'Shell', color: '#4caf50' },
            { value: 'py', label: 'Python', color: '#3776ab' },
        ],
        presets: [
            {
                name: 'Planner',
                description: 'Strategic planning agent',
                ui: { icons: { default: 'brain', working: 'loader-2' } },
                defaultData: { label: 'Planner', subType: 'ai', agent: 'Claude 3.5', color: '#8b5cf6', status: 'idle', execTime: '—', callsCount: 0 },
            },
            {
                name: 'Worker',
                description: 'Task execution agent',
                ui: { icons: { default: 'wrench', working: 'loader-2' } },
                defaultData: { label: 'Worker', subType: 'ai', agent: 'Claude 3.5', color: '#06b6d4', status: 'idle', execTime: '—', callsCount: 0 },
            },
            {
                name: 'Reviewer',
                description: 'Code review agent',
                ui: { icons: { default: 'search', working: 'loader-2' } },
                defaultData: { label: 'Reviewer', subType: 'ai', agent: 'Claude 3.5', color: '#f59e0b', status: 'idle', execTime: '—', callsCount: 0 },
            },
            {
                name: 'JS Script',
                description: 'JavaScript with activate() entry',
                ui: { icons: { default: 'file-code', working: 'loader-2' } },
                defaultData: {
                    label: 'script.js', subType: 'js', language: 'js',
                    code: `export function activate(ctx) {\n   console.log('Hello from', ctx.node.name);\n}`,
                },
            },
            {
                name: 'TS Script',
                description: 'TypeScript with type-safe activate()',
                ui: { icons: { default: 'file-code', working: 'loader-2' } },
                defaultData: {
                    label: 'script.ts', subType: 'ts', language: 'ts',
                    code: `export function activate(ctx: Context) {\n   console.log('Hello from', ctx.node.name);\n}`,
                },
            },
            {
                name: 'Shell Script',
                description: 'Shell script for system commands',
                ui: { icons: { default: 'terminal', working: 'loader-2' } },
                defaultData: {
                    label: 'script.sh', subType: 'sh', language: 'sh',
                    code: `#!/bin/bash\necho "Hello from $NODE_NAME"`,
                },
            },
            {
                name: 'Python Script',
                description: 'Python for data processing and ML',
                ui: { icons: { default: 'file-type', working: 'loader-2' } },
                defaultData: {
                    label: 'script.py', subType: 'py', language: 'py',
                    code: `def activate(ctx):\n    print(f"Hello from {ctx.node.name}")`,
                },
            },
        ],
    },
    // ── SubFlow ──
    {
        type: 'subflow',
        label: 'SubFlow',
        category: 'SubFlow',
        tags: ['subflow', 'scope', 'container', 'nested', 'group', 'boundary'],
        description: 'Nested flow — displays node count, avg exec time, and AI border',
        ui: {
            icons: { default: 'workflow', working: 'loader-2' },
            color: '#6366f1',
            defaultSize: { w: 14, h: 8 },
        },
        presets: [
            {
                name: 'SubFlow',
                description: 'Nested sub-flow with summary stats',
                defaultData: { label: 'SubFlow', nodeCount: 0, avgExecTime: '—', hasAI: false, color: '#6366f1' },
            },
            {
                name: 'AI Pipeline',
                description: 'SubFlow containing AI agents — rainbow border',
                defaultData: { label: 'AI Pipeline', nodeCount: 3, avgExecTime: '4.2s', hasAI: true, color: '#8b5cf6' },
            },
        ],
    },
    // ── Layout ──
    {
        type: 'group',
        label: 'Group',
        category: 'Layout',
        tags: ['group', 'container', 'pipeline', 'section'],
        description: 'Container that groups related nodes',
        ui: {
            icons: { default: 'package' },
            color: '#6366f1',
            defaultSize: { w: 20, h: 10 },
        },
        presets: [
            {
                name: 'Pipeline',
                description: 'Processing pipeline container',
                defaultData: { label: 'Pipeline', color: '#6366f1' },
            },
            {
                name: 'Stage',
                description: 'Distinct workflow stage',
                defaultData: { label: 'Stage', color: '#10b981' },
            },
        ],
    },
    // ── User (human interaction) ──
    {
        type: 'user',
        label: 'User',
        category: 'Job',
        tags: ['user', 'human', 'review', 'approval', 'gate', 'interaction'],
        description: 'Human interaction node for reviews, approvals, and manual gates',
        ui: {
            icons: { default: 'user-circle' },
            color: '#f59e0b',
            defaultSize: { w: 8, h: 5 },
        },
        presets: [
            {
                name: 'Code Reviewer',
                description: 'Human code review with approve/comment',
                defaultData: { label: 'Code Review', color: '#f59e0b', status: 'idle', reviewTitle: 'Code Review', reviewBody: 'Review the changes and approve or request modifications.' },
            },
            {
                name: 'Approval Gate',
                description: 'Manual approval before deployment',
                defaultData: { label: 'Approval', color: '#22c55e', status: 'idle', reviewTitle: 'Deploy Approval', reviewBody: 'Approve to start deployment.' },
            },
        ],
    },
    // ── Informer ──
    {
        type: 'informer',
        label: 'Informer',
        category: 'Informer',
        tags: ['informer', 'note', 'sticker', 'annotation', 'comment', 'post-it', 'label', 'group', 'section', 'web', 'iframe'],
        description: 'Static or interactive informer — notes, stickers, labels, and embedded web content',
        ui: {
            icons: { default: 'sticky-note' },
            color: '#fbbf24',
            defaultSize: { w: 8, h: 6 },
        },
        subTypes: [
            { value: 'static', label: 'Static', color: '#fbbf24' },
            { value: 'interactive', label: 'Interactive', color: '#06b6d4' },
            { value: 'web', label: 'Web', color: '#8b5cf6' },
        ],
        presets: [
            {
                name: 'Sticker',
                description: 'Yellow post-it note',
                defaultData: { label: 'Note', content: 'Remember to check this!', subType: 'static', color: 'yellow', isInteractiveInEditMode: false },
            },
            {
                name: 'Pink Sticker',
                description: 'Pink post-it note',
                defaultData: { label: 'Important', content: '', subType: 'static', color: 'pink', isInteractiveInEditMode: false },
            },
            {
                name: 'Section',
                description: 'Label a section of the workflow',
                defaultData: { label: 'Section', content: 'Group related nodes here', subType: 'static', color: '#6366f1', isInteractiveInEditMode: false },
            },
            {
                name: 'Heading',
                description: 'Large text heading',
                defaultData: { label: 'Workflow Title', subType: 'static', color: '#e2e8f0', isInteractiveInEditMode: false },
            },
            {
                name: 'Caption',
                description: 'Small description text',
                defaultData: { label: 'Step 1', content: 'Initialize the pipeline and fetch data', subType: 'static', color: '#94a3b8', isInteractiveInEditMode: false },
            },
            {
                name: 'Web Page',
                description: 'Embedded web page (iframe)',
                ui: { icons: { default: 'globe' }, color: '#8b5cf6' },
                defaultData: { label: 'Web View', subType: 'web', url: 'https://example.com', color: '#8b5cf6', isInteractiveInEditMode: true },
            },
        ],
    },
    // ── Expectation ──
    {
        type: 'expectation',
        label: 'Expectation',
        category: 'Expectation',
        tags: ['expectation', 'assert', 'verify', 'check', 'artifact', 'tool', 'test'],
        description: 'Asserts that an agent produces an artifact or calls a tool',
        ui: {
            icons: { default: 'clipboard-check', done: 'check-circle' },
            color: '#10b981',
            defaultSize: { w: 8, h: 4 },
        },
        subTypes: [
            { value: 'artifact', label: 'Artifact', color: '#10b981' },
            { value: 'tool-call', label: 'Tool Call', color: '#06b6d4' },
        ],
        presets: [
            {
                name: 'Artifact',
                description: 'Expects agent to generate an artifact',
                defaultData: { label: 'Creates README.md', subType: 'artifact', target: 'README.md', status: 'pending' },
            },
            {
                name: 'Tool Call',
                description: 'Expects agent to call a specific tool',
                defaultData: { label: 'Calls deploy()', subType: 'tool-call', target: 'deploy()', status: 'pending' },
            },
            {
                name: 'Pull Request',
                description: 'Expects agent to create a pull request',
                defaultData: { label: 'Creates PR', subType: 'tool-call', target: 'create_pull_request()', status: 'pending' },
            },
        ],
    },
    // ── Starting (flow entry point) ──
    {
        type: 'starting',
        label: 'Starting',
        category: 'Starting',
        tags: ['start', 'begin', 'entry', 'trigger', 'play'],
        description: 'Entry point of the flow — a play-button node',
        ui: {
            icons: { default: 'play' },
            color: '#22c55e',
            defaultSize: { w: 3, h: 3 },
        },
        presets: [
            {
                name: 'Start',
                description: 'Green play-button entry point',
                defaultData: { label: 'Start', color: '#22c55e' },
            },
        ],
    },
]

// ── Registry API ───────────────────────────────────────────────────────────────

class WidgetRegistry extends Registry<WidgetDefinition> {
    private usedTypes = new Set<string>()

    constructor(widgets: Omit<WidgetDefinition, 'id'>[]) {
        // Auto-set id = type for each widget
        const withIds = widgets.map(w => ({ ...w, id: w.type }) as WidgetDefinition)
        super(withIds.map(w => [w.type, w]))
    }

    /** Alias for get() */
    getByType(type: string): WidgetDefinition | undefined {
        return this.get(type)
    }

    getCategories(): WidgetCategory[] {
        return [...new Set(this.getAll().map(w => w.category))]
    }

    getByCategory(category: WidgetCategory): WidgetDefinition[] {
        return this.getAll().filter(w => w.category === category)
    }

    search(query: string): WidgetDefinition[] {
        const q = query.toLowerCase()
        return this.getAll().filter(w =>
            w.label.toLowerCase().includes(q) ||
            w.description.toLowerCase().includes(q) ||
            w.tags.some(t => t.includes(q))
        )
    }

    markUsed(type: string) {
        this.usedTypes.add(type)
    }

    getRecent(): WidgetDefinition[] {
        return this.getAll().filter(w => this.usedTypes.has(w.type))
    }

    // ── Pixel helpers (convert grid units → px) ──

    /** Default width in pixels for a widget type */
    getDefaultWidthPx(type: string): number {
        const def = this.get(type)
        return (def?.ui.defaultSize.w ?? 10) * GRID_CELL
    }

    /** Default height in pixels for a widget type */
    getDefaultHeightPx(type: string): number {
        const def = this.get(type)
        return (def?.ui.defaultSize.h ?? 6) * GRID_CELL
    }

    /** Get icon name for a widget, optionally for a specific state */
    getIcon(type: string, state?: keyof WidgetIcons): string {
        const def = this.get(type)
        if (!def) return 'package'
        const icons = def.ui.icons
        if (state && icons[state]) return icons[state]!
        return icons.default
    }
}

export const widgetRegistry = new WidgetRegistry(WIDGETS)
