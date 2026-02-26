// ── Plugin System Boot ──────────────────────────────────────────────────────────
// Imports built-in plugins and registers them.

import { registerPlugin } from './plugin-registry'
import { helloWorldPlugin } from './builtins/hello-world'
import { aiChatPlugin } from './builtins/ai-chat'
import { reactIconsPlugin } from './builtins/react-icons'

// Register built-in plugins
registerPlugin(helloWorldPlugin)
registerPlugin(aiChatPlugin)
registerPlugin(reactIconsPlugin)

// Re-exports for convenience
export { PluginSidePanel } from './PluginSidePanel'
export { PluginBottomBar } from './PluginBottomBar'
export {
    getPlugins,
    getEnabledPlugins,
    isPluginEnabled,
    setPluginEnabled,
    getPluginSettings,
    savePluginSettings,
    registerPlugin,
    usePluginChange,
} from './plugin-registry'
export type { PluginDefinition, PluginMeta } from './types'
