/**
 * Shared types for the FlowBuilder family of components.
 */

import type { Node, Edge, NodeTypes, OnNodesChange, Viewport } from '@xyflow/react'
import type { WidgetTemplate } from '@/engine/widget-registry'

// ── Visual types ────────────────────────────────────────────────────────────────

export type NodeSize = 'S' | 'M' | 'L'
export type ThemeKey = 'wibeglow' | 'pixel' | 'ghub'
export type ThemeMode = 'dark' | 'light'

// ── Connector phase (internal state machine) ────────────────────────────────────

export type ConnectorPhase =
    | { type: 'idle' }
    | { type: 'positioning'; sourceId: string; sourcePos: { x: number; y: number }; cursorPos: { x: number; y: number } }
    | { type: 'sizing'; placeholderId: string; sourceId: string | null; anchor: { x: number; y: number } }
    | { type: 'placed'; placeholderId: string; sourceId: string | null; anchor: { x: number; y: number }; gridCols: number; gridRows: number }

// ── FlowBuilder props ───────────────────────────────────────────────────────────

export interface FlowBuilderProps {
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
     * Called when a new node is fully created through the connector flow:
     *   handle click → position → resize → pick widget type.
     * Also called when a widget is dropped from the sidebar picker.
     */
    onNodeCreated?: (
        nodeId: string,
        widgetType: string,
        template: WidgetTemplate,
        rect: { x: number; y: number; width: number; height: number },
        sourceNodeId: string | null,
    ) => void
    /**
     * Called when a node creation is cancelled (ESC, right-click).
     * If not provided, FlowBuilder handles cleanup internally.
     */
    onNodeCancelled?: (placeholderId: string) => void
    /**
     * Called when "Add Before" is clicked on a node's action menu.
     * Inserts a new node between the clicked node and its predecessor.
     */
    onAddBefore?: (nodeId: string) => void
    /**
     * Called when "Add After" is clicked — appends a connected node.
     */
    onAddAfter?: (nodeId: string) => void
    /**
     * Called when "Configure" is clicked — opens configuration for the node.
     */
    onConfigure?: (nodeId: string) => void
    /**
     * Called when "Rename" is confirmed with a new name.
     */
    onRename?: (nodeId: string, newName: string) => void
}
