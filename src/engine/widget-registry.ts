/**
 * Widget Registry — available node types for the builder.
 *
 * Each widget has: type, label, icon, category, description, templates.
 * Templates define default data for creating new nodes.
 *
 * Ported from magnetic-filament's widget-registry.ts (scoped to wibeboard types).
 */

export const GRID_CELL = 20  // px per grid cell
export const MIN_GRID = 2    // minimum grid dimension (2×2 = 40×40)

export interface WidgetTemplate {
    name: string
    description: string
    defaultData: Record<string, any>
}

export type WidgetCategory = 'AI' | 'Script' | 'Layout' | 'Note' | 'Expectation'

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
}

// ── Widget Definitions ─────────────────────────────────────────────────────────

const WIDGETS: WidgetDefinition[] = [
    {
        type: 'agent',
        label: 'Agent',
        icon: 'sparkles',
        category: 'AI',
        tags: ['agent', 'worker', 'ai', 'llm', 'task', 'execute'],
        description: 'AI agent that executes tasks with tool calls',
        color: '#8b5cf6',
        minWidth: 160, minHeight: 100,
        defaultWidth: 200, defaultHeight: 120,
        templates: [
            {
                name: 'Planner',
                description: 'Strategic planning agent',
                defaultData: { label: 'Planner', agent: 'Claude 3.5', color: '#8b5cf6', status: 'idle', execTime: '—', callsCount: 0 },
            },
            {
                name: 'Worker',
                description: 'Task execution agent',
                defaultData: { label: 'Worker', agent: 'Claude 3.5', color: '#06b6d4', status: 'idle', execTime: '—', callsCount: 0 },
            },
            {
                name: 'Reviewer',
                description: 'Code review and validation agent',
                defaultData: { label: 'Reviewer', agent: 'Claude 3.5', color: '#f59e0b', status: 'idle', execTime: '—', callsCount: 0 },
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
        minWidth: 200, minHeight: 160,
        defaultWidth: 280, defaultHeight: 200,
        templates: [{
            name: 'Script',
            description: 'JavaScript with activate() entry',
            defaultData: {
                label: 'script.js', language: 'js',
                code: `export function activate(ctx) {\n   console.log('Hello from', ctx.node.name);\n}`,
            },
        }],
    },
    {
        type: 'script-ts',
        label: 'TypeScript',
        icon: 'terminal',
        category: 'Script',
        tags: ['script', 'typescript', 'ts', 'code', 'typed'],
        description: 'TypeScript script with type-safe activate() entry point',
        color: '#3178c6',
        minWidth: 200, minHeight: 160,
        defaultWidth: 280, defaultHeight: 200,
        templates: [{
            name: 'Script',
            description: 'TypeScript with activate() entry',
            defaultData: {
                label: 'script.ts', language: 'ts',
                code: `export function activate(ctx: Context) {\n   console.log('Hello from', ctx.node.name);\n}`,
            },
        }],
    },
    {
        type: 'script-sh',
        label: 'Shell',
        icon: 'terminal',
        category: 'Script',
        tags: ['script', 'shell', 'bash', 'sh', 'command'],
        description: 'Shell script for system commands',
        color: '#4caf50',
        minWidth: 200, minHeight: 160,
        defaultWidth: 280, defaultHeight: 200,
        templates: [{
            name: 'Script',
            description: 'Shell script',
            defaultData: {
                label: 'script.sh', language: 'sh',
                code: `#!/bin/bash\necho "Hello from $NODE_NAME"`,
            },
        }],
    },
    {
        type: 'script-py',
        label: 'Python',
        icon: 'terminal',
        category: 'Script',
        tags: ['script', 'python', 'py', 'code', 'ml'],
        description: 'Python script for data processing and ML',
        color: '#3776ab',
        minWidth: 200, minHeight: 160,
        defaultWidth: 280, defaultHeight: 200,
        templates: [{
            name: 'Script',
            description: 'Python with activate() entry',
            defaultData: {
                label: 'script.py', language: 'py',
                code: `def activate(ctx):\n    print(f"Hello from {ctx.node.name}")`,
            },
        }],
    },
    // ── Layout ──
    {
        type: 'group',
        label: 'Group',
        icon: 'package',
        category: 'Layout',
        tags: ['group', 'container', 'pipeline', 'section'],
        description: 'Container that groups related nodes',
        color: '#6366f1',
        minWidth: 200, minHeight: 120,
        defaultWidth: 400, defaultHeight: 200,
        templates: [
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
    // ── Note widgets ──
    {
        type: 'note-sticker',
        label: 'Sticker',
        icon: 'sticky-note',
        category: 'Note',
        tags: ['note', 'sticker', 'annotation', 'comment', 'post-it'],
        description: 'Post-it style note that can be placed anywhere',
        color: '#fbbf24',
        minWidth: 60, minHeight: 60,
        defaultWidth: 160, defaultHeight: 120,
        templates: [
            {
                name: 'Sticker',
                description: 'Yellow post-it note',
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
        tags: ['note', 'group', 'background', 'section', 'container'],
        description: 'Background label for grouping nodes together',
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
        tags: ['note', 'label', 'text', 'markdown', 'heading', 'image'],
        description: 'Text label with optional markdown and images',
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
                defaultData: { label: 'Step 1', content: 'Initialize the pipeline and fetch data', variant: 'label', color: '#94a3b8' },
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
        minWidth: 60, minHeight: 40,
        defaultWidth: 160, defaultHeight: 60,
        templates: [
            {
                name: 'Artifact',
                description: 'Expects agent to generate an artifact',
                defaultData: { label: 'Creates README.md', variant: 'artifact', target: 'README.md', status: 'pending' },
            },
            {
                name: 'Tool Call',
                description: 'Expects agent to call a specific tool',
                defaultData: { label: 'Calls deploy()', variant: 'tool-call', target: 'deploy()', status: 'pending' },
            },
            {
                name: 'Pull Request',
                description: 'Expects agent to create a pull request',
                defaultData: { label: 'Creates PR', variant: 'tool-call', target: 'create_pull_request()', status: 'pending' },
            },
        ],
    },
]

// ── Registry API ───────────────────────────────────────────────────────────────

class WidgetRegistry {
    private widgets = WIDGETS
    private usedTypes = new Set<string>()

    getAll(): WidgetDefinition[] {
        return this.widgets
    }

    getByType(type: string): WidgetDefinition | undefined {
        return this.widgets.find(w => w.type === type)
    }

    getCategories(): WidgetCategory[] {
        return [...new Set(this.widgets.map(w => w.category))]
    }

    getByCategory(category: WidgetCategory): WidgetDefinition[] {
        return this.widgets.filter(w => w.category === category)
    }

    search(query: string): WidgetDefinition[] {
        const q = query.toLowerCase()
        return this.widgets.filter(w =>
            w.label.toLowerCase().includes(q) ||
            w.description.toLowerCase().includes(q) ||
            w.tags.some(t => t.includes(q))
        )
    }

    markUsed(type: string) {
        this.usedTypes.add(type)
    }

    getRecent(): WidgetDefinition[] {
        return this.widgets.filter(w => this.usedTypes.has(w.type))
    }
}

export const widgetRegistry = new WidgetRegistry()
