import type { ReactNode } from 'react'

/** Known plugin permissions (GitHub-style). */
export type PluginPermission = 'secrets:read'

/** Metadata header for a plugin (mirrors MDX frontmatter). */
export interface PluginMeta {
    id: string
    name: string
    version: string
    description: string
    author?: string
    icon?: ReactNode
    /** Permissions this plugin requires. */
    permissions?: PluginPermission[]
    /** Raw source text (MDX / TSX) shown in the source viewer. */
    source?: string
}

/** Full plugin definition — metadata + settings + 3 render slots. */
export interface PluginDefinition {
    meta: PluginMeta

    /** Default settings (persisted per-plugin in localStorage). */
    defaultSettings: Record<string, any>

    /** Called when the plugin is enabled. */
    onEnable?: () => void

    /** Called when the plugin is disabled. */
    onDisable?: () => void

    /** Right side panel (main UI). Multiple plugins → tabs. */
    renderSidePanel?: (settings: Record<string, any>) => ReactNode

    /** Bottom status bar — small indications. */
    renderBottomBar?: (settings: Record<string, any>) => ReactNode

    /** Plugin settings page — configure the plugin. */
    renderSettings?: (
        settings: Record<string, any>,
        onUpdate: (next: Record<string, any>) => void,
    ) => ReactNode
}
