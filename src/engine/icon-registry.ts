/**
 * Icon Registry — centralized icon definitions extending the base Registry.
 *
 * Each icon item maps a string key to a React component and default color.
 * Extends Registry<IconDefinition> to inherit get/getAll/has/keys/search.
 */

import type { ComponentType } from 'react'
import { Registry, type RegistryItem } from './core'

// ── Types ───────────────────────────────────────────────────────────────────────

export interface IconDefinition extends RegistryItem {
    /** React component for this icon */
    component: ComponentType<any>
    /** Default color (hex) */
    color: string
    /** Optional category / grouping */
    category?: string
}

// ── IconRegistry class ──────────────────────────────────────────────────────────

export class IconRegistry extends Registry<IconDefinition> {
    constructor(entries: Omit<IconDefinition, 'id'>[]) {
        super(entries.map(e => [e.type, { ...e, id: e.type }] as [string, IconDefinition]))
    }

    /** Get the React component for an icon type, with fallback */
    getComponent(type: string, fallback?: ComponentType<any>): ComponentType<any> {
        return this.get(type)?.component ?? fallback ?? (() => null)
    }

    /** Get the default color for an icon type */
    getColor(type: string): string {
        return this.get(type)?.color ?? '#8b5cf6'
    }

    /** Get all icons in a specific category */
    getByCategory(category: string): IconDefinition[] {
        return this.getAll().filter(i => i.category === category)
    }
}
