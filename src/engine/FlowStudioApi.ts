/**
 * FlowStudioApi — high-level API for managing a flow.
 *
 * Owns two stores:
 *  - `state`  — FlowStudioStore (MobX) for in-memory UI state
 *                (theme, mode, zoom, minimap, selectedNode)
 *  - `store`  — StepStore (Automerge) for persistent step execution
 *                (step state, undo/redo, play/pause — optional)
 *
 * Exposes node CRUD methods with correct positioning:
 *  - `createStartNode()`   — centered at (0, 0)
 *  - `positionAfter()`     — 5gu right, Y center-aligned
 *  - `positionBefore()`    — left of target, Y center-aligned
 *  - `deleteWithReconnect()` — bridge-reconnection
 *  - `makeEdge()`          — styled edge factory
 *
 * Consumer pages create an instance and use it for all flow operations.
 */

import type { Node, Edge } from '@xyflow/react'
import { FlowStudioStore } from '../flow-studio/FlowStudioStore'
import type { StepStore } from './automerge-store'
import type { ThemeKey, NodeSize } from '../flow-studio/types'
import {
    createStartNode,
    positionAfter,
    positionBefore,
    deleteNodeWithReconnect,
    makeEdge,
    NODE_SPACING,
} from './node-factory'

// ── Types ────────────────────────────────────────────────────────────────────

export interface FlowStudioApiOptions {
    /** Initial theme (default: 'wibeglow') */
    theme?: ThemeKey
    /** Initial node size (default: 'M') */
    size?: NodeSize
    /** Optional StepStore for step-driven scenarios */
    stepStore?: StepStore
}

// ── API class ────────────────────────────────────────────────────────────────

export class FlowStudioApi {
    /** MobX store — in-memory UI state (theme, mode, selectedNode, etc.) */
    readonly state: FlowStudioStore

    /** Automerge store — persistent step execution (optional) */
    readonly store: StepStore | null

    constructor(options: FlowStudioApiOptions = {}) {
        this.state = new FlowStudioStore(options.theme, options.size)
        this.store = options.stepStore ?? null
    }

    // ── Node factory methods ─────────────────────────────────────────────

    /**
     * Create a starting node centered at origin (0, 0).
     */
    createStartNode(
        id: string = 'start-1',
        data: Record<string, any> = { label: 'Start', color: '#22c55e' },
    ): Node {
        return createStartNode(id, data)
    }

    /**
     * Calculate position for a new node placed AFTER a source node.
     * Places 5gu to the right, Y center-aligned for straight edges.
     */
    positionAfter(
        sourceNode: Node,
        newWidgetType: string,
        newData?: Record<string, any>,
    ): { x: number; y: number } {
        return positionAfter(sourceNode, newWidgetType, newData)
    }

    /**
     * Calculate position for a new node placed BEFORE a target node.
     * If a source exists, places at midpoint; otherwise 5gu left.
     */
    positionBefore(
        targetNode: Node,
        sourceNode: Node | null,
        newWidgetType: string,
        newData?: Record<string, any>,
    ): { x: number; y: number } {
        return positionBefore(targetNode, sourceNode, newWidgetType, newData)
    }

    /**
     * Delete a node and bridge-reconnect its neighbors.
     * A→B→C becomes A→C.
     */
    deleteWithReconnect(
        nodeId: string,
        nodes: Node[],
        edges: Edge[],
    ): { nodes: Node[]; edges: Edge[] } {
        return deleteNodeWithReconnect(nodeId, nodes, edges)
    }

    /**
     * Create a styled edge between two nodes.
     */
    makeEdge(sourceId: string, targetId: string): Edge {
        return makeEdge(sourceId, targetId)
    }

    /** Standard node spacing (5 grid units = 100px) */
    static readonly SPACING = NODE_SPACING
}
