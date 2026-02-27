/**
 * Preset Registry — standalone preset definitions for widget types.
 *
 * Each preset has a unique `name` (e.g. 'job-ai') and references a widget
 * `type` (e.g. 'job') with an optional `subType`.
 * Presets define the default data for creating new nodes.
 *
 * Extends Registry<PresetDefinition> for standard get/getAll/search/has/keys.
 */

import { Registry, type RegistryItem } from './core'
import type { WidgetUI } from './widget-types-registry'

// ── Types ───────────────────────────────────────────────────────────────────────

export interface PresetDefinition extends RegistryItem {
    /** Unique preset key (e.g. 'job-ai', 'default') — also used as registry key */
    name: string
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
        name: 'job-ai', type: 'job', subType: 'ai',
        label: 'AI', description: 'AI Agent — Worker preset with multicolor border',
        tags: ['agent', 'ai', 'worker', 'default'],
        ui: { icons: { default: 'sparkles', working: 'loader-2' }, color: '#8b5cf6', borderColors: ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'] },
        defaultData: { label: 'AI Agent', subType: 'ai' },
    },
    {
        name: 'job-planner', type: 'job', subType: 'ai',
        label: 'Planner', description: 'Strategic planning agent',
        tags: ['agent', 'planner', 'ai', 'strategy'],
        ui: { icons: { default: 'brain', working: 'loader-2' }, color: '#8b5cf6', borderColors: ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'] },
        defaultData: { label: 'Planner', subType: 'ai' },
    },
    {
        name: 'job-worker', type: 'job', subType: 'ai',
        label: 'Worker', description: 'Task execution agent',
        tags: ['agent', 'worker', 'ai', 'execute'],
        ui: { icons: { default: 'wrench', working: 'loader-2' }, color: '#06b6d4', borderColors: ['#06b6d4', '#22c55e', '#f59e0b', '#8b5cf6'] },
        defaultData: { label: 'Worker', subType: 'ai', color: '#06b6d4', borderColors: ['#06b6d4', '#22c55e', '#f59e0b', '#8b5cf6'] },
    },
    {
        name: 'job-reviewer', type: 'job', subType: 'ai',
        label: 'Reviewer', description: 'Code review agent',
        tags: ['agent', 'reviewer', 'ai', 'review'],
        ui: { icons: { default: 'search', working: 'loader-2' }, color: '#f59e0b', borderColors: ['#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e'] },
        defaultData: { label: 'Reviewer', subType: 'ai', color: '#f59e0b', borderColors: ['#f59e0b', '#8b5cf6', '#06b6d4', '#22c55e'] },
    },
    {
        name: 'default', type: 'job', subType: 'js',
        label: 'Job', description: 'Default job — JavaScript script',
        tags: ['job', 'javascript', 'js', 'default'],
        ui: { icons: { default: 'briefcase', working: 'loader-2' }, color: '#f7df1e' },
        defaultData: { label: 'Job', subType: 'js' },
    },
    {
        name: 'job-script', type: 'job', subType: 'js',
        label: 'Script', description: 'Generic script preset',
        tags: ['script', 'javascript', 'js', 'code'],
        ui: { icons: { default: 'terminal', working: 'loader-2' }, color: '#f7df1e' },
        defaultData: { label: 'Script', subType: 'js' },
    },
    {
        name: 'job-js', type: 'job', subType: 'js',
        label: 'JS', description: 'JavaScript with activate() entry',
        tags: ['script', 'javascript', 'js', 'code'],
        ui: { icons: { default: 'script-js', working: 'loader-2' }, color: '#f7df1e' },
        defaultData: { label: 'script.js', subType: 'js' },
    },
    {
        name: 'job-ts', type: 'job', subType: 'ts',
        label: 'TS Script', description: 'TypeScript with type-safe activate()',
        tags: ['script', 'typescript', 'ts', 'code'],
        ui: { icons: { default: 'script-ts', working: 'loader-2' }, color: '#3178c6' },
        defaultData: { label: 'script.ts', subType: 'ts' },
    },
    {
        name: 'job-sh', type: 'job', subType: 'sh',
        label: 'Shell Script', description: 'Shell script for system commands',
        tags: ['script', 'shell', 'bash', 'sh'],
        ui: { icons: { default: 'script-sh', working: 'loader-2' }, color: '#4caf50' },
        defaultData: { label: 'script.sh', subType: 'sh' },
    },
    {
        name: 'job-py', type: 'job', subType: 'py',
        label: 'Python Script', description: 'Python for data processing and ML',
        tags: ['script', 'python', 'py', 'ml'],
        ui: { icons: { default: 'script-py', working: 'loader-2' }, color: '#3776ab' },
        defaultData: { label: 'script.py', subType: 'py' },
    },

    // ── SubFlow presets ──
    {
        name: 'default', type: 'subflow',
        label: 'SubFlow', description: 'Nested sub-flow with summary stats',
        tags: ['subflow', 'nested', 'container', 'default'],
        defaultData: { label: 'SubFlow', nodeCount: 0, avgExecTime: '—', hasAI: false, color: '#6366f1' },
    },
    {
        name: 'subflow-ai-pipeline', type: 'subflow',
        label: 'AI Pipeline', description: 'SubFlow containing AI agents — rainbow border',
        tags: ['subflow', 'ai', 'pipeline'],
        defaultData: { label: 'AI Pipeline', nodeCount: 3, avgExecTime: '4.2s', hasAI: true, color: '#8b5cf6' },
    },

    // ── Group presets ──
    {
        name: 'default', type: 'group',
        label: 'Pipeline', description: 'Processing pipeline container',
        tags: ['group', 'pipeline', 'container', 'default'],
        defaultData: { label: 'Pipeline', color: '#6366f1' },
    },
    {
        name: 'group-stage', type: 'group',
        label: 'Stage', description: 'Distinct workflow stage',
        tags: ['group', 'stage', 'section'],
        defaultData: { label: 'Stage', color: '#10b981' },
    },

    // ── User presets ──
    {
        name: 'default', type: 'user',
        label: 'Code Reviewer', description: 'Human code review with approve/comment',
        tags: ['user', 'review', 'code', 'default'],
        defaultData: { label: 'Code Review', color: '#f59e0b', status: 'idle', reviewTitle: 'Code Review', reviewBody: 'Review the changes and approve or request modifications.' },
    },
    {
        name: 'user-approval', type: 'user',
        label: 'Approval Gate', description: 'Manual approval before deployment',
        tags: ['user', 'approval', 'gate', 'deploy'],
        defaultData: { label: 'Approval', color: '#22c55e', status: 'idle', reviewTitle: 'Deploy Approval', reviewBody: 'Approve to start deployment.' },
    },

    // ── Informer presets ──
    {
        name: 'default', type: 'informer', subType: 'static',
        label: 'Sticker', description: 'Yellow post-it note',
        tags: ['informer', 'sticker', 'note', 'post-it', 'default'],
        ui: { color: '#fbbf24' },
        defaultData: { label: 'Note', content: 'Remember to check this!', subType: 'static', color: 'yellow', isInteractiveInEditMode: false },
    },
    {
        name: 'informer-pink-sticker', type: 'informer', subType: 'static',
        label: 'Pink Sticker', description: 'Pink post-it note',
        tags: ['informer', 'sticker', 'note', 'pink'],
        ui: { color: '#fbbf24' },
        defaultData: { label: 'Important', content: '', subType: 'static', color: 'pink', isInteractiveInEditMode: false },
    },
    {
        name: 'informer-section', type: 'informer', subType: 'static',
        label: 'Section', description: 'Label a section of the workflow',
        tags: ['informer', 'section', 'label'],
        ui: { color: '#fbbf24' },
        defaultData: { label: 'Section', content: 'Group related nodes here', subType: 'static', color: '#6366f1', isInteractiveInEditMode: false },
    },
    {
        name: 'informer-heading', type: 'informer', subType: 'static',
        label: 'Heading', description: 'Large text heading',
        tags: ['informer', 'heading', 'title'],
        ui: { color: '#fbbf24' },
        defaultData: { label: 'Workflow Title', subType: 'static', color: '#e2e8f0', isInteractiveInEditMode: false },
    },
    {
        name: 'informer-caption', type: 'informer', subType: 'static',
        label: 'Caption', description: 'Small description text',
        tags: ['informer', 'caption', 'description'],
        ui: { color: '#fbbf24' },
        defaultData: { label: 'Step 1', content: 'Initialize the pipeline and fetch data', subType: 'static', color: '#94a3b8', isInteractiveInEditMode: false },
    },
    {
        name: 'informer-web', type: 'informer', subType: 'web',
        label: 'Web Page', description: 'Embedded web page (iframe)',
        tags: ['informer', 'web', 'iframe', 'embed'],
        ui: { icons: { default: 'globe' }, color: '#8b5cf6' },
        defaultData: { label: 'Web View', subType: 'web', url: 'https://example.com', color: '#8b5cf6', isInteractiveInEditMode: true },
    },

    // ── Expectation presets ──
    {
        name: 'default', type: 'expectation', subType: 'artifact',
        label: 'Artifact', description: 'Expects agent to generate an artifact',
        tags: ['expectation', 'artifact', 'assert', 'default'],
        ui: { color: '#ec4899' },
        defaultData: { label: 'Creates README.md', subType: 'artifact', target: 'README.md', status: 'idle', color: '#ec4899' },
    },
    {
        name: 'expectation-tool-call', type: 'expectation', subType: 'tool-call',
        label: 'Tool Call', description: 'Expects agent to call a specific tool',
        tags: ['expectation', 'tool', 'call', 'assert'],
        ui: { color: '#06b6d4' },
        defaultData: { label: 'Calls deploy()', subType: 'tool-call', target: 'deploy()', status: 'idle', color: '#06b6d4' },
    },
    {
        name: 'expectation-pr', type: 'expectation', subType: 'tool-call',
        label: 'Pull Request', description: 'Expects agent to create a pull request',
        tags: ['expectation', 'pr', 'pull-request'],
        ui: { color: '#8b5cf6' },
        defaultData: { label: 'Creates PR', subType: 'tool-call', target: 'create_pull_request()', status: 'idle', color: '#8b5cf6' },
    },

    // ── Starting preset ──
    {
        name: 'default', type: 'starting',
        label: 'Start', description: 'Green play-button entry point',
        tags: ['start', 'entry', 'begin', 'default'],
        defaultData: { label: 'Start', color: '#22c55e' },
    },
]

// ── Preset Registry class ───────────────────────────────────────────────────────

import { customPresetStore } from './custom-preset-store'

export class PresetRegistry extends Registry<PresetDefinition> {
    private _listeners: (() => void)[] = []

    constructor(presets: Omit<PresetDefinition, 'id'>[]) {
        // Key presets by `type:name` to avoid collision (multiple 'default' names across widget types)
        super(presets.map(p => {
            const key = `${p.type}:${p.name}`
            return [key, { ...p, id: key }] as [string, PresetDefinition]
        }))
        // Load persisted custom presets and subscribe to store changes
        this._syncFromStore()
        customPresetStore.onChange(() => this._syncFromStore())
    }

    /** Get all presets for a widget type */
    getByWidget(widgetType: string): PresetDefinition[] {
        return this.getAll().filter(p => p.type === widgetType)
    }

    /** Get presets for a widget type + sub-type */
    getBySubType(widgetType: string, subType: string): PresetDefinition[] {
        return this.getAll().filter(p => p.type === widgetType && p.subType === subType)
    }

    /** Get the default preset for a widget type (name === 'default'). */
    getDefault(widgetType: string): PresetDefinition | undefined {
        return this.getAll().find(p => p.type === widgetType && p.name === 'default')
            ?? this.getAll().find(p => p.type === widgetType)
    }

    /** Get all custom presets (ordered as stored) */
    getCustomPresets(): PresetDefinition[] {
        return customPresetStore.getAll().map(p => {
            const key = `${p.type}:${p.name}`
            return { ...p, id: key, ui: p.ui as any }
        })
    }

    /** Register a custom preset and persist via Automerge */
    registerCustom(preset: Omit<PresetDefinition, 'id'>): PresetDefinition {
        const key = `${preset.type}:${preset.name}`
        const full: PresetDefinition = { ...preset, id: key }
        if (!full.tags.includes('custom')) full.tags = [...full.tags, 'custom']
        this.register(key, full)
        // Persist to Automerge store
        const { id, ...stored } = full
        customPresetStore.add(stored as any)
        this._notify()
        return full
    }

    /** Remove a custom preset and persist */
    removeCustom(presetKey: string): boolean {
        const preset = this.get(presetKey)
        if (!preset || !preset.tags.includes('custom')) return false
        const ok = this.unregister(presetKey)
        if (ok) {
            customPresetStore.remove(preset.name)
            this._notify()
        }
        return ok
    }

    /** Reorder custom presets (drag-to-reorder) */
    reorderCustom(from: number, to: number) {
        customPresetStore.reorder(from, to)
        this._notify()
    }

    /** Subscribe to changes (custom preset add/remove/reorder) */
    onChange(listener: () => void): () => void {
        this._listeners.push(listener)
        return () => { this._listeners = this._listeners.filter(l => l !== listener) }
    }

    /** Get unique sub-types for a widget type (derived from presets) */
    getSubTypes(widgetType: string): { value: string; label: string; color: string }[] {
        const presets = this.getByWidget(widgetType)
        const seen = new Map<string, { value: string; label: string; color: string }>()
        for (const p of presets) {
            if (p.subType && !seen.has(p.subType)) {
                seen.set(p.subType, {
                    value: p.subType,
                    label: p.label,
                    color: p.ui?.color ?? '#8b5cf6',
                })
            }
        }
        return Array.from(seen.values())
    }

    private _notify() {
        for (const l of this._listeners) l()
    }

    /** Sync custom presets from the Automerge store into the registry */
    private _syncFromStore() {
        // Remove old custom presets from registry
        for (const p of this.getAll()) {
            if (p.tags.includes('custom')) this.unregister(p.id)
        }
        // Re-add from store (preserving order)
        for (const p of customPresetStore.getAll()) {
            const key = `${p.type}:${p.name}`
            this.register(key, { ...p, id: key, ui: p.ui as any })
        }
        this._notify()
    }
}

export const presetRegistry = new PresetRegistry(PRESETS)

// Expose for E2E testing
if (typeof window !== 'undefined') {
    ; (window as any).__presetRegistry = presetRegistry
}
