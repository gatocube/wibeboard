/**
 * Widget Registry — root widget type definitions for the builder.
 *
 * Each widget defines: type, label, ui, category, description, subTypes.
 * Presets are stored separately in preset-registry.ts.
 *
 * ALL sizes are stored in **grid units** (gu).
 * Use GRID_CELL to convert: pixels = gu * GRID_CELL.
 */

import { Registry, type RegistryItem } from './registry'

export const GRID_CELL = 20       // px per grid unit
export const MIN_NODE_SIZE = 3    // minimum node dimension: 3×3 gu (60×60 px)

// ── UI types ────────────────────────────────────────────────────────────────────

export interface WidgetIcons {
    default: string
    working?: string
    error?: string
    done?: string
}

export interface WidgetUI {
    icons: WidgetIcons
    color: string
    defaultSize: { w: number; h: number }
}

// ── Widget definition ───────────────────────────────────────────────────────────

export type WidgetCategory = 'AI' | 'Script' | 'Job' | 'Layout' | 'Informer' | 'Expectation' | 'Starting' | 'SubFlow'

export interface WidgetDefinition extends RegistryItem {
    category: WidgetCategory
    ui: WidgetUI
    /** Preset ID used when creating a node with no explicit preset */
    defaultPreset: string
    disabled?: boolean
    /** Available sub-types for this widget */
    subTypes?: { value: string; label: string; color?: string }[]
}

// ── Widget Definitions ─────────────────────────────────────────────────────────

const WIDGETS: Omit<WidgetDefinition, 'id'>[] = [
    {
        type: 'job',
        defaultPreset: 'job-default',
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
    },
    // ── SubFlow ──
    {
        type: 'subflow',
        defaultPreset: 'subflow-default',
        label: 'SubFlow',
        category: 'SubFlow',
        tags: ['subflow', 'scope', 'container', 'nested', 'group', 'boundary'],
        description: 'Nested flow — displays node count, avg exec time, and AI border',
        ui: {
            icons: { default: 'workflow', working: 'loader-2' },
            color: '#6366f1',
            defaultSize: { w: 14, h: 8 },
        },
    },
    // ── Layout ──
    {
        type: 'group',
        defaultPreset: 'group-pipeline',
        label: 'Group',
        category: 'Layout',
        tags: ['group', 'container', 'pipeline', 'section'],
        description: 'Container that groups related nodes',
        ui: {
            icons: { default: 'package' },
            color: '#6366f1',
            defaultSize: { w: 20, h: 10 },
        },
    },
    // ── User (human interaction) ──
    {
        type: 'user',
        defaultPreset: 'user-code-reviewer',
        label: 'User',
        category: 'Job',
        tags: ['user', 'human', 'review', 'approval', 'gate', 'interaction'],
        description: 'Human interaction node for reviews, approvals, and manual gates',
        ui: {
            icons: { default: 'user-circle' },
            color: '#f59e0b',
            defaultSize: { w: 8, h: 5 },
        },
    },
    // ── Informer ──
    {
        type: 'informer',
        defaultPreset: 'informer-sticker',
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
    },
    // ── Expectation ──
    {
        type: 'expectation',
        defaultPreset: 'expectation-artifact',
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
    },
    // ── Starting (flow entry point) ──
    {
        type: 'starting',
        defaultPreset: 'starting-default',
        label: 'Starting',
        category: 'Starting',
        tags: ['start', 'begin', 'entry', 'trigger', 'play'],
        description: 'Entry point of the flow — a play-button node',
        ui: {
            icons: { default: 'play' },
            color: '#22c55e',
            defaultSize: { w: 3, h: 3 },
        },
    },
]

// ── Registry API ───────────────────────────────────────────────────────────────

class WidgetRegistry extends Registry<WidgetDefinition> {
    private usedTypes = new Set<string>()

    constructor(widgets: Omit<WidgetDefinition, 'id'>[]) {
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
