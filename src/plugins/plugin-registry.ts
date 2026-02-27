/**
 * Plugin Registry — centralized plugin management extending the base Registry.
 *
 * Migrated from flat array to Registry<PluginDefinition> for consistency
 * with WidgetRegistry, PresetRegistry, and IconRegistry.
 *
 * Extends Registry<PluginDefinition> to inherit get/getAll/has/keys/search + register/unregister.
 */

import { useEffect, useState } from 'react'
import { Registry } from '@/engine/core'
import type { PluginDefinition } from './types'

const STORAGE_PREFIX = 'plugin_settings_'
const ENABLED_KEY = 'plugin_enabled'

// ── Listener / reactive state ───────────────────────────────────────────────────

const listeners = new Set<() => void>()
function notify() { listeners.forEach(fn => fn()) }

/** React hook — re-renders when plugins are toggled or settings change. */
export function usePluginChange(): number {
    const [rev, setRev] = useState(0)
    useEffect(() => {
        const fn = () => setRev(n => n + 1)
        listeners.add(fn)
        return () => { listeners.delete(fn) }
    }, [])
    return rev
}

function getEnabledSet(): Set<string> {
    try {
        const raw = localStorage.getItem(ENABLED_KEY)
        return raw ? new Set(JSON.parse(raw)) : new Set<string>()
    } catch {
        return new Set<string>()
    }
}

function saveEnabledSet(set: Set<string>) {
    localStorage.setItem(ENABLED_KEY, JSON.stringify([...set]))
}

// ── PluginRegistry class ────────────────────────────────────────────────────────

export class PluginRegistry extends Registry<PluginDefinition> {
    constructor(entries: [string, PluginDefinition][] = []) {
        super(entries)
    }

    /** Register a plugin (uses meta.id as key, idempotent) */
    registerPlugin(def: PluginDefinition): void {
        if (this.has(def.meta.id)) return
        this.register(def.meta.id, def)
        // If already enabled (from localStorage), fire onEnable
        if (isPluginEnabled(def.meta.id)) {
            def.onEnable?.()
        }
    }

    /** Get only enabled plugins */
    getEnabled(): PluginDefinition[] {
        const enabled = getEnabledSet()
        return this.getAll().filter(p => enabled.has(p.meta.id))
    }

    /** Search plugins by label, description, or tags (via meta fields) */
    override search(query: string): PluginDefinition[] {
        const q = query.toLowerCase()
        return this.getAll().filter(p =>
            p.meta.name.toLowerCase().includes(q) ||
            p.meta.description.toLowerCase().includes(q) ||
            p.meta.id.toLowerCase().includes(q)
        )
    }
}

// ── Singleton instance ──────────────────────────────────────────────────────────

export const pluginRegistry = new PluginRegistry()

// ── Public API (backwards-compatible) ───────────────────────────────────────────

export function registerPlugin(def: PluginDefinition) {
    pluginRegistry.registerPlugin(def)
}

export function getPlugins(): PluginDefinition[] {
    return pluginRegistry.getAll()
}

export function getEnabledPlugins(): PluginDefinition[] {
    return pluginRegistry.getEnabled()
}

export function isPluginEnabled(id: string): boolean {
    return getEnabledSet().has(id)
}

export function setPluginEnabled(id: string, enabled: boolean) {
    const set = getEnabledSet()
    if (enabled) set.add(id); else set.delete(id)
    saveEnabledSet(set)
    // Fire lifecycle hooks
    const def = pluginRegistry.get(id)
    if (def) {
        if (enabled) def.onEnable?.(); else def.onDisable?.()
    }
    notify()
}

export function getPluginSettings(id: string): Record<string, any> {
    const def = pluginRegistry.get(id)
    const defaults = def?.defaultSettings ?? {}
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + id)
        return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
    } catch {
        return { ...defaults }
    }
}

export function savePluginSettings(id: string, settings: Record<string, any>) {
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(settings))
    notify()
}
