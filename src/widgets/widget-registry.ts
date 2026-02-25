/**
 * Widget Registry — defines all available widgets for wibeboard.
 *
 * Each widget has templates for all 3 visual themes (pixel, ghub, wibeglow).
 * This is the core registry that the WidgetSelector and builder use.
 *
 * Widgets with `subTypes` can be switched between specializations (e.g. ai, js, ts).
 */

import type { TemplateName } from '@/templates/template-registry'

// ── Types ───────────────────────────────────────────────────────────────────────

export const GRID_CELL = 20
export const MIN_GRID = 3

export interface WidgetTemplate {
    name: string
    description: string
    defaultData: Record<string, any>
}

export type WidgetCategory = 'Job' | 'Script' | 'Expectation' | 'Assertion' | 'Note' | 'AI' | 'SubFlow'

export interface SubTypeDef {
    value: string
    label: string
    color?: string
}

export interface WidgetDefinition {
    type: string
    label: string
    icon: string
    category: WidgetCategory
    tags: string[]
    description: string
    color: string
    minWidth: number
    minHeight: number
    defaultWidth: number
    defaultHeight: number
    templates: WidgetTemplate[]
    disabled?: boolean
    /** Node type name per visual template (defaults to type) */
    nodeTypes?: Partial<Record<TemplateName, string>>
    /** Available sub-type specializations */
    subTypes?: SubTypeDef[]
}

// ── Widget Definitions ──────────────────────────────────────────────────────────

const WIDGETS: WidgetDefinition[] = [
    {
        type: 'job',
        label: 'Job',
        icon: 'sparkles',
        category: 'Job',
        tags: ['agent', 'worker', 'ai', 'llm', 'task', 'execute', 'script', 'code', 'python', 'typescript', 'javascript', 'shell'],
        description: 'AI agent or code script that executes tasks',
        color: '#8b5cf6',
        minWidth: 120, minHeight: 60,
        defaultWidth: 200, defaultHeight: 120,
        subTypes: [
            { value: 'ai', label: 'AI Agent', color: '#8b5cf6' },
            { value: 'js', label: 'JavaScript', color: '#f7df1e' },
            { value: 'ts', label: 'TypeScript', color: '#3178c6' },
            { value: 'sh', label: 'Shell', color: '#89e051' },
            { value: 'py', label: 'Python', color: '#3776ab' },
        ],
        templates: [
            {
                name: 'Planner',
                description: 'Strategic planning agent',
                defaultData: { label: 'Planner', subType: 'ai', agent: 'Claude 3.5', color: '#8b5cf6', status: 'idle', execTime: '—', callsCount: 0 },
            },
            {
                name: 'Worker',
                description: 'Task execution agent',
                defaultData: { label: 'Worker', subType: 'ai', agent: 'Claude 3.5', color: '#06b6d4', status: 'idle', execTime: '—', callsCount: 0 },
            },
            {
                name: 'Reviewer',
                description: 'Code review and validation agent',
                defaultData: { label: 'Reviewer', subType: 'ai', agent: 'Claude 3.5', color: '#f59e0b', status: 'idle', execTime: '—', callsCount: 0 },
            },
            {
                name: 'JS Script',
                description: 'JavaScript with activate() entry',
                defaultData: {
                    label: 'script.js', subType: 'js', language: 'js',
                    code: `export function activate(ctx) {\n   console.log('Hello from', ctx.node.name);\n}`,
                },
            },
            {
                name: 'TS Script',
                description: 'TypeScript with type-safe activate()',
                defaultData: {
                    label: 'script.ts', subType: 'ts', language: 'ts',
                    code: `export function activate(ctx: Context) {\n   console.log('Hello from', ctx.node.name);\n}`,
                },
            },
            {
                name: 'Shell Script',
                description: 'Shell script for system commands',
                defaultData: {
                    label: 'script.sh', subType: 'sh', language: 'sh',
                    code: `#!/bin/bash\necho "Hello from $NODE_NAME"`,
                },
            },
            {
                name: 'Python Script',
                description: 'Python for data processing and ML',
                defaultData: {
                    label: 'script.py', subType: 'py', language: 'py',
                    code: `def activate(ctx):\n    print(f"Hello from {ctx.node.name}")`,
                },
            },
        ],
    },
    // ── Group ──
    {
        type: 'group',
        label: 'Group',
        icon: 'package',
        category: 'AI',
        tags: ['group', 'container', 'subflow', 'scope', 'boundary'],
        description: 'Container that groups related nodes together',
        color: '#6366f1',
        minWidth: 200, minHeight: 150,
        defaultWidth: 400, defaultHeight: 300,
        templates: [
            {
                name: 'Default',
                description: 'Simple group container',
                defaultData: { label: 'Group', color: '#6366f1' },
            },
        ],
    },
    // ── User (human interaction) ──
    {
        type: 'user',
        label: 'User',
        icon: 'user',
        category: 'AI',
        tags: ['user', 'human', 'review', 'approval', 'gate', 'interaction'],
        description: 'Human interaction node for reviews, approvals, and manual gates',
        color: '#f59e0b',
        minWidth: 60, minHeight: 60,
        defaultWidth: 160, defaultHeight: 100,
        templates: [
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
    // ── Note ──
    {
        type: 'note',
        label: 'Note',
        icon: 'sticky-note',
        category: 'Note',
        tags: ['note', 'sticker', 'annotation', 'comment', 'post-it', 'label', 'group', 'section'],
        description: 'Annotation notes, stickers, and labels',
        color: '#fbbf24',
        minWidth: 60, minHeight: 60,
        defaultWidth: 160, defaultHeight: 120,
        subTypes: [
            { value: 'sticker', label: 'Sticker', color: '#fbbf24' },
            { value: 'group', label: 'Group Note', color: '#6366f1' },
            { value: 'group-note', label: 'Section', color: '#10b981' },
            { value: 'label', label: 'Label', color: '#94a3b8' },
        ],
        templates: [
            {
                name: 'Yellow Sticker',
                description: 'Classic yellow post-it',
                defaultData: { label: 'Note', content: 'Remember to check this!', subType: 'sticker', color: 'yellow' },
            },
            {
                name: 'Pink Sticker',
                description: 'Pink post-it note',
                defaultData: { label: 'Important', content: '', subType: 'sticker', color: 'pink' },
            },
            {
                name: 'Section',
                description: 'Label a section of the workflow',
                defaultData: { label: 'Section', content: 'Group related nodes here', subType: 'group-note', color: '#6366f1' },
            },
            {
                name: 'Heading',
                description: 'Large text heading',
                defaultData: { label: 'Workflow Title', subType: 'label', color: '#e2e8f0' },
            },
            {
                name: 'Caption',
                description: 'Small description text',
                defaultData: { label: 'Step 1', content: 'Initialize the pipeline', subType: 'label', color: '#94a3b8' },
            },
        ],
    },
    // ── Expectation ──
    {
        type: 'expectation',
        label: 'Expectation',
        icon: 'check-circle-2',
        category: 'Expectation',
        tags: ['expectation', 'assert', 'verify', 'check', 'artifact', 'tool', 'test'],
        description: 'Asserts that an agent produces an artifact or calls a tool',
        color: '#10b981',
        minWidth: 60, minHeight: 60,
        defaultWidth: 160, defaultHeight: 80,
        subTypes: [
            { value: 'artifact', label: 'Artifact', color: '#10b981' },
            { value: 'tool-call', label: 'Tool Call', color: '#06b6d4' },
        ],
        templates: [
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
    // ── Starting Node ──
    {
        type: 'starting',
        label: 'Starting Node',
        icon: 'play',
        category: 'Job',
        tags: ['start', 'entry', 'begin', 'trigger', 'flow', 'origin'],
        description: 'Entry point of a workflow — the first node in a flow',
        color: '#22c55e',
        minWidth: 60, minHeight: 60,
        defaultWidth: 60, defaultHeight: 60,
        templates: [
            {
                name: 'Start',
                description: 'Default starting point',
                defaultData: { label: 'Start', color: '#22c55e' },
            },
        ],
    },
    // ── SubFlow ──
    {
        type: 'subflow',
        label: 'SubFlow',
        icon: 'workflow',
        category: 'SubFlow',
        tags: ['subflow', 'scope', 'container', 'nested', 'group', 'boundary'],
        description: 'Nested flow — displays node count, avg exec time, and AI border',
        color: '#6366f1',
        minWidth: 120, minHeight: 80,
        defaultWidth: 280, defaultHeight: 160,
        templates: [
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
]

// ── Registry API ────────────────────────────────────────────────────────────────

class WidgetRegistry {
    private widgets: Map<string, WidgetDefinition> = new Map()
    private recentlyUsed: string[] = []
    private maxRecent = 8

    constructor(definitions: WidgetDefinition[]) {
        for (const def of definitions) {
            this.widgets.set(def.type, def)
        }
    }

    getAll(): WidgetDefinition[] {
        return Array.from(this.widgets.values())
    }

    get(type: string): WidgetDefinition | undefined {
        return this.widgets.get(type)
    }

    getCategories(): WidgetCategory[] {
        const seen = new Set<WidgetCategory>()
        const result: WidgetCategory[] = []
        for (const w of this.widgets.values()) {
            if (!seen.has(w.category)) {
                seen.add(w.category)
                result.push(w.category)
            }
        }
        return result
    }

    getByCategory(category: WidgetCategory): WidgetDefinition[] {
        return Array.from(this.widgets.values()).filter(w => w.category === category)
    }

    search(query: string): WidgetDefinition[] {
        const q = query.toLowerCase()
        return Array.from(this.widgets.values()).filter(w =>
            w.label.toLowerCase().includes(q) ||
            w.tags.some(t => t.includes(q)) ||
            w.description.toLowerCase().includes(q)
        )
    }

    markUsed(type: string): void {
        this.recentlyUsed = [type, ...this.recentlyUsed.filter(t => t !== type)].slice(0, this.maxRecent)
    }

    getRecent(): WidgetDefinition[] {
        return this.recentlyUsed
            .map(type => this.widgets.get(type))
            .filter((w): w is WidgetDefinition => !!w)
    }

    getRecentlyUsed(): WidgetDefinition[] {
        return this.getRecent()
    }

    getRecentForGrid(cols: number, rows: number): WidgetDefinition[] {
        return this.getRecentlyUsed().filter(w => {
            const minCols = Math.max(MIN_GRID, Math.ceil(w.minWidth / GRID_CELL))
            const minRows = Math.max(MIN_GRID, Math.ceil(w.minHeight / GRID_CELL))
            return minCols <= cols && minRows <= rows
        })
    }

    getRecentForSize(width: number, height: number): WidgetDefinition[] {
        return this.getRecentlyUsed().filter(w =>
            w.minWidth <= width && w.minHeight <= height
        )
    }

    getSuggestedForGrid(cols: number, rows: number): WidgetDefinition[] {
        return this.getAll().filter(w => {
            const minCols = Math.max(MIN_GRID, Math.ceil(w.minWidth / GRID_CELL))
            const minRows = Math.max(MIN_GRID, Math.ceil(w.minHeight / GRID_CELL))
            return minCols <= cols && minRows <= rows
        })
    }
}

export const widgetRegistry = new WidgetRegistry(WIDGETS)
