/**
 * flow-builder barrel — re-exports public API.
 */

export { FlowBuilder } from './FlowBuilder'
export { WidgetPicker } from './WidgetPicker'
export { WidgetConfigurator } from './WidgetConfigurator'
export { FlowBuilderSettings } from './FlowBuilderSettings'
export { ConnectorOverlay } from './ConnectorOverlay'
export { NodeButtonsMenu } from './NodeButtonsMenu'
export { NodeConfigPanel } from './NodeConfigPanel'

export type {
    FlowBuilderProps,
    NodeSize,
    ThemeKey,
    ThemeMode,
    ConnectorPhase,
} from './types'
