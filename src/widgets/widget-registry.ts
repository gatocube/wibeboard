/**
 * Re-export from the canonical widget and preset registries.
 * This module exists for backward compatibility with imports from '@/widgets/widget-registry'.
 */
export {
    widgetRegistry,
    GRID_CELL,
    MIN_NODE_SIZE,
    type WidgetDefinition,
    type WidgetCategory,
    type WidgetUI,
    type WidgetIcons,
} from '@/engine/widget-types-registry'

export {
    presetRegistry,
    type PresetDefinition,
} from '@/engine/widget-preset-registry'
