/**
 * Shared types for the FlowStudio family of components.
 */

import type { Node, Edge, NodeTypes, OnNodesChange, Viewport } from '@xyflow/react'
import type { WidgetTemplate } from '@/engine/widget-registry'

// ── Visual types ────────────────────────────────────────────────────────────────

export type NodeSize = 'S' | 'M' | 'L'
export type ThemeKey = 'wibeglow' | 'pixel' | 'ghub'
export type ThemeMode = 'dark' | 'light'

// ── FlowStudio props ────────────────────────────────────────────────────────────

export interface FlowStudioProps {
    nodes: Node[]
    edges: Edge[]
    nodeTypes: NodeTypes
    children?: React.ReactNode
    onNodesChange?: OnNodesChange
    defaultViewport?: Viewport
    nodesDraggable?: boolean
    nodesConnectable?: boolean
    panOnDrag?: boolean
    zoomOnScroll?: boolean
    fitView?: boolean
    /** Current node size */
    currentSize?: NodeSize
    /** Called when zoom-autosize changes the node size */
    onSizeChange?: (size: NodeSize) => void
    /** Current theme */
    currentTheme?: ThemeKey
    /** Called when theme changes */
    onThemeChange?: (theme: ThemeKey) => void
    /** Extra style for the wrapper div */
    wrapperStyle?: React.CSSProperties
    /** Background color override */
    bgColor?: string
    /** Grid gap */
    gridGap?: number
    /** Show widget picker sidebar and editing handles */
    editMode?: boolean
    /**
     * Called when a new node is created via:
     *  - Drag from WidgetPicker sidebar
     *  - Click on a widget in the sidebar picker
     */
    onNodeCreated?: (
        nodeId: string,
        widgetType: string,
        template: WidgetTemplate,
        rect: { x: number; y: number; width: number; height: number },
        sourceNodeId: string | null,
    ) => void
    /**
     * Called when "Add Before" is clicked — widgetType is 'ai', 'script', 'sleep', or 'user'.
     */
    onAddBefore?: (nodeId: string, widgetType: string) => void
    /**
     * Called when "Add After" is clicked — widgetType is 'ai', 'script', 'sleep', or 'user'.
     */
    onAddAfter?: (nodeId: string, widgetType: string) => void
    /**
     * Called when a configure action is selected — action is 'rename', 'delete', or 'duplicate'.
     */
    onConfigure?: (nodeId: string, action: string) => void
    /**
     * Called when "Rename" is confirmed with a new name.
     */
    onRename?: (nodeId: string, newName: string) => void
    /**
     * When returns true for a given nodeId, the "Before" SwipeButton is hidden.
     * Useful for starting/entry-point nodes that shouldn't have predecessors.
     */
    hideBeforeButton?: (nodeId: string) => boolean
    /**
     * When provided, replaces the default WidgetPicker in the right sidebar.
     * Useful for showing a node configuration panel after creation.
     */
    sidebarContent?: React.ReactNode
}
