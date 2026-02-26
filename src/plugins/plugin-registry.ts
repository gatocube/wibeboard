import { useEffect, useState } from 'react'
import type { PluginDefinition } from './types'

const STORAGE_PREFIX = 'plugin_settings_'
const ENABLED_KEY = 'plugin_enabled'

// ── Internal state ──────────────────────────────────────────────────────────────

const plugins: PluginDefinition[] = []
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

// ── Public API ──────────────────────────────────────────────────────────────────

export function registerPlugin(def: PluginDefinition) {
    if (plugins.some(p => p.meta.id === def.meta.id)) return // idempotent
    plugins.push(def)
    // If already enabled (from localStorage), fire onEnable
    if (isPluginEnabled(def.meta.id)) {
        def.onEnable?.()
    }
}

export function getPlugins(): PluginDefinition[] {
    return plugins
}

export function getEnabledPlugins(): PluginDefinition[] {
    const enabled = getEnabledSet()
    return plugins.filter(p => enabled.has(p.meta.id))
}

export function isPluginEnabled(id: string): boolean {
    return getEnabledSet().has(id)
}

export function setPluginEnabled(id: string, enabled: boolean) {
    const set = getEnabledSet()
    if (enabled) set.add(id); else set.delete(id)
    saveEnabledSet(set)
    // Fire lifecycle hooks
    const def = plugins.find(p => p.meta.id === id)
    if (def) {
        if (enabled) def.onEnable?.(); else def.onDisable?.()
    }
    notify()
}

export function getPluginSettings(id: string): Record<string, any> {
    const def = plugins.find(p => p.meta.id === id)
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

