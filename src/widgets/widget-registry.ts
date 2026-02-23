/**
 * Widget Registry — defines all available widgets for wibeboard.
 *
 * Each widget has templates for all 3 visual themes (pixel, ghub, wibeglow).
 * This is the core registry that the WidgetSelector and builder use.
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

export type WidgetCategory = 'AI' | 'Script' | 'Expectation' | 'Assertion' | 'Note'

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
}

// ── Widget Definitions ──────────────────────────────────────────────────────────

const WIDGETS: WidgetDefinition[] = [
    {
        type: 'agent',
        label: 'Agent',
        icon: 'sparkles',
        category: 'AI',
        tags: ['agent', 'worker', 'ai', 'llm', 'task', 'execute'],
        description: 'AI agent that executes tasks, calls tools, and produces output',
        color: '#8b5cf6',
        minWidth: 120, minHeight: 60,
        defaultWidth: 200, defaultHeight: 120,
        templates: [
            {
                name: 'Default',
                description: 'General-purpose agent',
                defaultData: { label: 'Agent', agent: 'Default', color: '#8b5cf6', status: 'idle' },
            },
            {
                name: 'Planner',
                description: 'Agent that creates plans and delegates',
                defaultData: { label: 'Planner', agent: 'Planner', color: '#6366f1', status: 'idle' },
            },
        ],
    },
    // ── Script widgets ──
    {
        type: 'script-js',
        label: 'JavaScript',
        icon: 'terminal',
        category: 'Script',
        tags: ['script', 'javascript', 'js', 'code', 'function'],
        description: 'JavaScript script with activate() entry point',
        color: '#f7df1e',
        minWidth: 200, minHeight: 140,
        defaultWidth: 280, defaultHeight: 200,
        templates: [
            {
                name: 'Default',
                description: 'Standard JS script',
                defaultData: {
                    label: 'script.js',
                    language: 'js',
                    code: `export function activate(ctx) {\n   console.log('Hello from', ctx.node.name);\n}`,
                },
            },
        ],
    },
    {
        type: 'script-ts',
        label: 'TypeScript',
        icon: 'terminal',
        category: 'Script',
        tags: ['script', 'typescript', 'ts', 'code', 'typed'],
        description: 'TypeScript script with type-safe activate() entry point',
        color: '#3178c6',
        minWidth: 200, minHeight: 140,
        defaultWidth: 280, defaultHeight: 200,
        disabled: true,
        templates: [
            {
                name: 'Default',
                description: 'Standard TS script',
                defaultData: {
                    label: 'script.ts', language: 'ts',
                    code: `export function activate(ctx: Context) {\n   console.log('Hello from', ctx.node.name);\n}`,
                },
            },
        ],
    },
    {
        type: 'script-sh',
        label: 'Shell',
        icon: 'terminal',
        category: 'Script',
        tags: ['script', 'shell', 'bash', 'sh', 'command'],
        description: 'Shell script for system commands and automation',
        color: '#89e051',
        minWidth: 200, minHeight: 140,
        defaultWidth: 280, defaultHeight: 200,
        disabled: true,
        templates: [
            {
                name: 'Default',
                description: 'Standard shell script',
                defaultData: { label: 'script.sh', language: 'sh', code: `#!/bin/bash\necho "Hello from $NODE_NAME"` },
            },
        ],
    },
    {
        type: 'script-py',
        label: 'Python',
        icon: 'terminal',
        category: 'Script',
        tags: ['script', 'python', 'py', 'code', 'ml'],
        description: 'Python script for data processing and ML tasks',
        color: '#3776ab',
        minWidth: 200, minHeight: 140,
        defaultWidth: 280, defaultHeight: 200,
        disabled: true,
        templates: [
            {
                name: 'Default',
                description: 'Standard Python script',
                defaultData: { label: 'script.py', language: 'py', code: `def activate(ctx):\n    print(f"Hello from {ctx.node.name}")` },
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
    // ── Note widgets ──
    {
        type: 'note-sticker',
        label: 'Sticker',
        icon: 'sticky-note',
        category: 'Note',
        tags: ['note', 'sticker', 'annotation', 'comment', 'post-it'],
        description: 'Post-it style note for quick annotations',
        color: '#fbbf24',
        minWidth: 60, minHeight: 60,
        defaultWidth: 160, defaultHeight: 120,
        templates: [
            {
                name: 'Yellow Sticker',
                description: 'Classic yellow post-it',
                defaultData: { label: 'Note', content: 'Remember to check this!', variant: 'sticker', color: 'yellow' },
            },
            {
                name: 'Pink Sticker',
                description: 'Pink post-it note',
                defaultData: { label: 'Important', content: '', variant: 'sticker', color: 'pink' },
            },
        ],
    },
    {
        type: 'note-group',
        label: 'Group Note',
        icon: 'sticky-note',
        category: 'Note',
        tags: ['note', 'group', 'section', 'background', 'container'],
        description: 'Background label for grouping nodes',
        color: '#6366f1',
        minWidth: 200, minHeight: 120,
        defaultWidth: 400, defaultHeight: 250,
        templates: [
            {
                name: 'Section',
                description: 'Label a section of the workflow',
                defaultData: { label: 'Section', content: 'Group related nodes here', variant: 'group-note', color: '#6366f1' },
            },
        ],
    },
    {
        type: 'note-label',
        label: 'Label',
        icon: 'sticky-note',
        category: 'Note',
        tags: ['note', 'label', 'text', 'markdown', 'heading'],
        description: 'Text label with optional markdown',
        color: '#94a3b8',
        minWidth: 60, minHeight: 40,
        defaultWidth: 200, defaultHeight: 80,
        templates: [
            {
                name: 'Heading',
                description: 'Large text heading',
                defaultData: { label: 'Workflow Title', variant: 'label', color: '#e2e8f0' },
            },
            {
                name: 'Caption',
                description: 'Small description text',
                defaultData: { label: 'Step 1', content: 'Initialize the pipeline', variant: 'label', color: '#94a3b8' },
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
