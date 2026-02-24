/**
 * Widget Registry — available node types for the builder.
 *
 * Each widget has: type, label, icon, category, description, templates.
 * Templates define default data for creating new nodes.
 *
 * The `subTypes` array lists the available sub-type specializations.
 * For widgets with subTypes, templates carry `subType` in defaultData.
 */

export const GRID_CELL = 20  // px per grid cell
export const MIN_GRID = 2    // minimum grid dimension (2×2 = 40×40)

export interface WidgetTemplate {
    name: string
    description: string
    defaultData: Record<string, any>
}

export type WidgetCategory = 'AI' | 'Script' | 'Job' | 'Layout' | 'Note' | 'Expectation'

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
    /** Available sub-types for this widget */
    subTypes?: { value: string; label: string; color?: string }[]
}

// ── Widget Definitions ─────────────────────────────────────────────────────────

const WIDGETS: WidgetDefinition[] = [
    {
        type: 'job',
        label: 'Job',
        icon: 'sparkles',
        category: 'Job',
        tags: ['agent', 'worker', 'ai', 'llm', 'task', 'execute', 'script', 'code', 'python', 'typescript', 'javascript', 'shell'],
        description: 'AI agent or code script that executes tasks',
        color: '#8b5cf6',
        minWidth: 60, minHeight: 60,
        defaultWidth: 200, defaultHeight: 120,
        subTypes: [
            { value: 'ai', label: 'AI Agent', color: '#8b5cf6' },
            { value: 'js', label: 'JavaScript', color: '#f7df1e' },
            { value: 'ts', label: 'TypeScript', color: '#3178c6' },
            { value: 'sh', label: 'Shell', color: '#4caf50' },
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
                description: 'Code review agent',
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
    // ── User (human interaction) ──
    {
        type: 'user',
        label: 'User',
        icon: 'user',
        category: 'Job',
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
        minWidth: 60, minHeight: 40,
        defaultWidth: 160, defaultHeight: 120,
        subTypes: [
            { value: 'sticker', label: 'Sticker', color: '#fbbf24' },
            { value: 'group', label: 'Group Note', color: '#6366f1' },
            { value: 'group-note', label: 'Section', color: '#10b981' },
            { value: 'label', label: 'Label', color: '#94a3b8' },
        ],
        templates: [
            {
                name: 'Sticker',
                description: 'Yellow post-it note',
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
                defaultData: { label: 'Step 1', content: 'Initialize the pipeline and fetch data', subType: 'label', color: '#94a3b8' },
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
]

// ── Backward compatibility helpers ─────────────────────────────────────────────

/** Map old compound types → { type, subType } */
function resolveType(typeStr: string): { type: string; subType?: string } {
    if (typeStr === 'agent') return { type: 'job', subType: 'ai' }
    if (typeStr.startsWith('script-')) return { type: 'job', subType: typeStr.replace('script-', '') }
    if (typeStr.startsWith('note-')) return { type: 'note', subType: typeStr.replace('note-', '') }
    return { type: typeStr }
}

// ── Registry API ───────────────────────────────────────────────────────────────

class WidgetRegistry {
    private widgets = WIDGETS
    private usedTypes = new Set<string>()

    getAll(): WidgetDefinition[] {
        return this.widgets
    }

    get(type: string): WidgetDefinition | undefined {
        // Direct match first
        const direct = this.widgets.find(w => w.type === type)
        if (direct) return direct
        // Try resolving old compound type
        const { type: resolved } = resolveType(type)
        return this.widgets.find(w => w.type === resolved)
    }

    getByType(type: string): WidgetDefinition | undefined {
        return this.get(type)
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
