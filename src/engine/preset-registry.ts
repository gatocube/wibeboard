/**
 * Preset Registry — standalone preset definitions for widget types.
 *
 * Each preset references a widget type and optionally a subType.
 * Presets define the default data for creating new nodes.
 *
 * Extends Registry<PresetDefinition> for standard get/getAll/search/has/keys.
 */

import { Registry, type RegistryItem } from './registry'
import type { WidgetUI } from './widget-registry'

// ── Types ───────────────────────────────────────────────────────────────────────

export interface PresetDefinition extends RegistryItem {
    /** Which widget type this preset belongs to */
    widgetType: string
    /** Sub-type within the widget (e.g. 'ai', 'sh', 'web') */
    subType?: string
    /** Default node data when creating from this preset */
    defaultData: Record<string, any>
    /** Optional UI overrides for this preset */
    ui?: Partial<WidgetUI>
}

// ── Preset Data ─────────────────────────────────────────────────────────────────

const PRESETS: Omit<PresetDefinition, 'id'>[] = [
    // ── Job presets ──
    {
        type: 'job-planner', widgetType: 'job', subType: 'ai',
        label: 'Planner', description: 'Strategic planning agent',
        tags: ['agent', 'planner', 'ai', 'strategy'],
        ui: { icons: { default: 'brain', working: 'loader-2' } },
        defaultData: { label: 'Planner', subType: 'ai', agent: 'Claude 3.5', color: '#8b5cf6', status: 'idle', execTime: '—', callsCount: 0 },
    },
    {
        type: 'job-worker', widgetType: 'job', subType: 'ai',
        label: 'Worker', description: 'Task execution agent',
        tags: ['agent', 'worker', 'ai', 'execute'],
        ui: { icons: { default: 'wrench', working: 'loader-2' } },
        defaultData: { label: 'Worker', subType: 'ai', agent: 'Claude 3.5', color: '#06b6d4', status: 'idle', execTime: '—', callsCount: 0 },
    },
    {
        type: 'job-reviewer', widgetType: 'job', subType: 'ai',
        label: 'Reviewer', description: 'Code review agent',
        tags: ['agent', 'reviewer', 'ai', 'review'],
        ui: { icons: { default: 'search', working: 'loader-2' } },
        defaultData: { label: 'Reviewer', subType: 'ai', agent: 'Claude 3.5', color: '#f59e0b', status: 'idle', execTime: '—', callsCount: 0 },
    },
    {
        type: 'job-js', widgetType: 'job', subType: 'js',
        label: 'JS Script', description: 'JavaScript with activate() entry',
        tags: ['script', 'javascript', 'js', 'code'],
        ui: { icons: { default: 'file-code', working: 'loader-2' } },
        defaultData: {
            label: 'script.js', subType: 'js', language: 'js',
            code: `export function activate(ctx) {\n   console.log('Hello from', ctx.node.name);\n}`,
        },
    },
    {
        type: 'job-ts', widgetType: 'job', subType: 'ts',
        label: 'TS Script', description: 'TypeScript with type-safe activate()',
        tags: ['script', 'typescript', 'ts', 'code'],
        ui: { icons: { default: 'file-code', working: 'loader-2' } },
        defaultData: {
            label: 'script.ts', subType: 'ts', language: 'ts',
            code: `export function activate(ctx: Context) {\n   console.log('Hello from', ctx.node.name);\n}`,
        },
    },
    {
        type: 'job-sh', widgetType: 'job', subType: 'sh',
        label: 'Shell Script', description: 'Shell script for system commands',
        tags: ['script', 'shell', 'bash', 'sh'],
        ui: { icons: { default: 'terminal', working: 'loader-2' } },
        defaultData: {
            label: 'script.sh', subType: 'sh', language: 'sh',
            code: `#!/bin/bash\necho "Hello from $NODE_NAME"`,
        },
    },
    {
        type: 'job-py', widgetType: 'job', subType: 'py',
        label: 'Python Script', description: 'Python for data processing and ML',
        tags: ['script', 'python', 'py', 'ml'],
        ui: { icons: { default: 'file-type', working: 'loader-2' } },
        defaultData: {
            label: 'script.py', subType: 'py', language: 'py',
            code: `def activate(ctx):\n    print(f"Hello from {ctx.node.name}")`,
        },
    },

    // ── SubFlow presets ──
    {
        type: 'subflow-default', widgetType: 'subflow',
        label: 'SubFlow', description: 'Nested sub-flow with summary stats',
        tags: ['subflow', 'nested', 'container'],
        defaultData: { label: 'SubFlow', nodeCount: 0, avgExecTime: '—', hasAI: false, color: '#6366f1' },
    },
    {
        type: 'subflow-ai-pipeline', widgetType: 'subflow',
        label: 'AI Pipeline', description: 'SubFlow containing AI agents — rainbow border',
        tags: ['subflow', 'ai', 'pipeline'],
        defaultData: { label: 'AI Pipeline', nodeCount: 3, avgExecTime: '4.2s', hasAI: true, color: '#8b5cf6' },
    },

    // ── Group presets ──
    {
        type: 'group-pipeline', widgetType: 'group',
        label: 'Pipeline', description: 'Processing pipeline container',
        tags: ['group', 'pipeline', 'container'],
        defaultData: { label: 'Pipeline', color: '#6366f1' },
    },
    {
        type: 'group-stage', widgetType: 'group',
        label: 'Stage', description: 'Distinct workflow stage',
        tags: ['group', 'stage', 'section'],
        defaultData: { label: 'Stage', color: '#10b981' },
    },

    // ── User presets ──
    {
        type: 'user-code-reviewer', widgetType: 'user',
        label: 'Code Reviewer', description: 'Human code review with approve/comment',
        tags: ['user', 'review', 'code'],
        defaultData: { label: 'Code Review', color: '#f59e0b', status: 'idle', reviewTitle: 'Code Review', reviewBody: 'Review the changes and approve or request modifications.' },
    },
    {
        type: 'user-approval', widgetType: 'user',
        label: 'Approval Gate', description: 'Manual approval before deployment',
        tags: ['user', 'approval', 'gate', 'deploy'],
        defaultData: { label: 'Approval', color: '#22c55e', status: 'idle', reviewTitle: 'Deploy Approval', reviewBody: 'Approve to start deployment.' },
    },

    // ── Informer presets ──
    {
        type: 'informer-sticker', widgetType: 'informer', subType: 'static',
        label: 'Sticker', description: 'Yellow post-it note',
        tags: ['informer', 'sticker', 'note', 'post-it'],
        defaultData: { label: 'Note', content: 'Remember to check this!', subType: 'static', color: 'yellow', isInteractiveInEditMode: false },
    },
    {
        type: 'informer-pink-sticker', widgetType: 'informer', subType: 'static',
        label: 'Pink Sticker', description: 'Pink post-it note',
        tags: ['informer', 'sticker', 'note', 'pink'],
        defaultData: { label: 'Important', content: '', subType: 'static', color: 'pink', isInteractiveInEditMode: false },
    },
    {
        type: 'informer-section', widgetType: 'informer', subType: 'static',
        label: 'Section', description: 'Label a section of the workflow',
        tags: ['informer', 'section', 'label'],
        defaultData: { label: 'Section', content: 'Group related nodes here', subType: 'static', color: '#6366f1', isInteractiveInEditMode: false },
    },
    {
        type: 'informer-heading', widgetType: 'informer', subType: 'static',
        label: 'Heading', description: 'Large text heading',
        tags: ['informer', 'heading', 'title'],
        defaultData: { label: 'Workflow Title', subType: 'static', color: '#e2e8f0', isInteractiveInEditMode: false },
    },
    {
        type: 'informer-caption', widgetType: 'informer', subType: 'static',
        label: 'Caption', description: 'Small description text',
        tags: ['informer', 'caption', 'description'],
        defaultData: { label: 'Step 1', content: 'Initialize the pipeline and fetch data', subType: 'static', color: '#94a3b8', isInteractiveInEditMode: false },
    },
    {
        type: 'informer-web', widgetType: 'informer', subType: 'web',
        label: 'Web Page', description: 'Embedded web page (iframe)',
        tags: ['informer', 'web', 'iframe', 'embed'],
        ui: { icons: { default: 'globe' }, color: '#8b5cf6' },
        defaultData: { label: 'Web View', subType: 'web', url: 'https://example.com', color: '#8b5cf6', isInteractiveInEditMode: true },
    },

    // ── Expectation presets ──
    {
        type: 'expectation-artifact', widgetType: 'expectation', subType: 'artifact',
        label: 'Artifact', description: 'Expects agent to generate an artifact',
        tags: ['expectation', 'artifact', 'assert'],
        defaultData: { label: 'Creates README.md', subType: 'artifact', target: 'README.md', status: 'pending' },
    },
    {
        type: 'expectation-tool-call', widgetType: 'expectation', subType: 'tool-call',
        label: 'Tool Call', description: 'Expects agent to call a specific tool',
        tags: ['expectation', 'tool', 'call', 'assert'],
        defaultData: { label: 'Calls deploy()', subType: 'tool-call', target: 'deploy()', status: 'pending' },
    },
    {
        type: 'expectation-pr', widgetType: 'expectation', subType: 'tool-call',
        label: 'Pull Request', description: 'Expects agent to create a pull request',
        tags: ['expectation', 'pr', 'pull-request'],
        defaultData: { label: 'Creates PR', subType: 'tool-call', target: 'create_pull_request()', status: 'pending' },
    },

    // ── Starting preset ──
    {
        type: 'starting-default', widgetType: 'starting',
        label: 'Start', description: 'Green play-button entry point',
        tags: ['start', 'entry', 'begin'],
        defaultData: { label: 'Start', color: '#22c55e' },
    },
]

// ── Preset Registry class ───────────────────────────────────────────────────────

export class PresetRegistry extends Registry<PresetDefinition> {
    constructor(presets: Omit<PresetDefinition, 'id'>[]) {
        super(presets.map(p => [p.type, { ...p, id: p.type }] as [string, PresetDefinition]))
    }

    /** Get all presets for a widget type */
    getByWidget(widgetType: string): PresetDefinition[] {
        return this.getAll().filter(p => p.widgetType === widgetType)
    }

    /** Get presets for a widget type + sub-type */
    getBySubType(widgetType: string, subType: string): PresetDefinition[] {
        return this.getAll().filter(p => p.widgetType === widgetType && p.subType === subType)
    }

    /** Get the first (default) preset for a widget type */
    getDefault(widgetType: string): PresetDefinition | undefined {
        return this.getAll().find(p => p.widgetType === widgetType)
    }
}

export const presetRegistry = new PresetRegistry(PRESETS)
