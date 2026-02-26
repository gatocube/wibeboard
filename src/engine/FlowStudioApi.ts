/**
 * FlowStudioApi — high-level API for managing a flow.
 *
 * Owns two stores:
 *  - `state`  — FlowStudioStore (MobX) for in-memory UI state
 *                (theme, mode, zoom, minimap, selectedNode)
 *  - `store`  — StepStore (Automerge) for persistent step execution
 *                (step state, undo/redo, play/pause — optional)
 *
 * Provides node CRUD with correct positioning:
 *  - `createStartNode()`      — centered at (0, 0)
 *  - `positionAfter()`        — 5gu right, Y center-aligned
 *  - `positionBefore()`       — left of target, Y center-aligned
 *  - `deleteWithReconnect()`  — bridge-reconnection
 *  - `makeEdge()`             — styled edge factory
 *
 * All positions follow the grid-sizing guidelines:
 *  - Starting node center is at (0, 0)
 *  - New nodes are placed 5 grid units (100px) from the source/target node
 *  - Nodes are center-aligned on the Y axis for straight horizontal edges
 *  - Sizes come from the widget registry
 */

import type { Node, Edge } from '@xyflow/react'
import { FlowStudioStore } from '../flow-studio/FlowStudioStore'
import type { StepStore } from './automerge-store'
import type { ThemeKey, NodeSize } from '../flow-studio/types'
import { GRID_CELL, widgetRegistry } from './widget-registry'

// ── Constants ────────────────────────────────────────────────────────────────

/** Standard node spacing: 5 grid units */
const SPACING = GRID_CELL * 5  // 100px

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Get a node's width from its data, style, or registry defaults */
function getNodeWidth(node: Node): number {
    return (typeof (node.style as any)?.width === 'number' ? (node.style as any).width : null)
        ?? (node.data?.width as number)
        ?? widgetRegistry.getDefaultWidthPx(node.type || '')
}

/** Get a node's height from its data, style, or registry defaults */
function getNodeHeight(node: Node): number {
    return (typeof (node.style as any)?.height === 'number' ? (node.style as any).height : null)
        ?? (node.data?.height as number)
        ?? widgetRegistry.getDefaultHeightPx(node.type || '')
}

/** Get default width in px for a widget type from the registry */
function getDefaultWidth(widgetType: string): number {
    return widgetRegistry.getDefaultWidthPx(widgetType)
}

/** Get default height in px for a widget type from the registry */
function getDefaultHeight(widgetType: string): number {
    return widgetRegistry.getDefaultHeightPx(widgetType)
}

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

    // ── Node creation ────────────────────────────────────────────────────

    /**
     * Create a starting node centered at origin (0, 0).
     *
     * The node's top-left position is offset so that its center sits exactly
     * at the coordinate origin, per grid-sizing guidelines.
     */
    createStartNode(
        id: string = 'start-1',
        data: Record<string, any> = { label: 'Start', color: '#22c55e' },
    ): Node {
        const w = getDefaultWidth('starting')
        const h = getDefaultHeight('starting')
        return {
            id,
            type: 'starting',
            position: { x: -w / 2, y: -h / 2 },
            data,
        }
    }

    // ── Positioning ──────────────────────────────────────────────────────

    /**
     * Calculate position for a new node placed AFTER a source node.
     * Places 5gu to the right, Y center-aligned for straight edges.
     */
    positionAfter(
        sourceNode: Node,
        newWidgetType: string,
        newData?: Record<string, any>,
    ): { x: number; y: number } {
        const sourceW = getNodeWidth(sourceNode)
        const sourceH = getNodeHeight(sourceNode)
        const newH = newData?.height ?? getDefaultHeight(newWidgetType)

        return {
            x: sourceNode.position.x + sourceW + SPACING,
            y: sourceNode.position.y + sourceH / 2 - newH / 2,
        }
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
        const newW = newData?.width ?? getDefaultWidth(newWidgetType)
        const targetH = getNodeHeight(targetNode)
        const newH = newData?.height ?? getDefaultHeight(newWidgetType)

        const x = sourceNode
            ? (sourceNode.position.x + targetNode.position.x) / 2
            : targetNode.position.x - newW - SPACING

        const y = targetNode.position.y + targetH / 2 - newH / 2

        return { x, y }
    }

    // ── Deletion ─────────────────────────────────────────────────────────

    /**
     * Delete a node and bridge-reconnect its neighbors.
     * A→B→C becomes A→C.
     */
    deleteWithReconnect(
        nodeId: string,
        nodes: Node[],
        edges: Edge[],
    ): { nodes: Node[]; edges: Edge[] } {
        const incomingEdges = edges.filter(e => e.target === nodeId)
        const outgoingEdges = edges.filter(e => e.source === nodeId)

        // Create bridge edges: each source → each target
        const bridgeEdges: Edge[] = []
        for (const inc of incomingEdges) {
            for (const out of outgoingEdges) {
                bridgeEdges.push(this.makeEdge(inc.source, out.target))
            }
        }

        return {
            nodes: nodes.filter(n => n.id !== nodeId),
            edges: [
                ...edges.filter(e => e.source !== nodeId && e.target !== nodeId),
                ...bridgeEdges,
            ],
        }
    }

    // ── Edge factory ─────────────────────────────────────────────────────

    /**
     * Create a styled edge between two nodes.
     */
    makeEdge(sourceId: string, targetId: string): Edge {
        return {
            id: `edge-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            animated: true,
            style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
        }
    }

    /** Standard node spacing (5 grid units = 100px) */
    static readonly SPACING = SPACING
}
