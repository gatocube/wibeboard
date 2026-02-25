/**
 * Node Factory — API for creating nodes with correct positioning.
 *
 * Centralizes node creation logic so consumer pages don't need to
 * hardcode positioning, spacing, or alignment. All positions follow
 * the grid-sizing guidelines.
 *
 * Rules enforced:
 *  - Starting node center is at (0, 0)
 *  - New nodes are placed 5 grid units (100px) from the source/target node
 *  - Nodes are center-aligned on the Y axis for straight horizontal edges
 *  - Sizes come from the widget registry
 */

import type { Node, Edge } from '@xyflow/react'
import { GRID_CELL, widgetRegistry } from './widget-registry'

const SPACING = GRID_CELL * 5  // 5 grid units = 100px

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Get a node's width from its data, style, or registry defaults */
function getNodeWidth(node: Node): number {
    return (typeof (node.style as any)?.width === 'number' ? (node.style as any).width : null)
        ?? (node.data?.width as number)
        ?? widgetRegistry.get(node.type || '')?.defaultWidth
        ?? 200
}

/** Get a node's height from its data, style, or registry defaults */
function getNodeHeight(node: Node): number {
    return (typeof (node.style as any)?.height === 'number' ? (node.style as any).height : null)
        ?? (node.data?.height as number)
        ?? widgetRegistry.get(node.type || '')?.defaultHeight
        ?? 120
}

/** Get default width for a widget type from the registry */
function getDefaultWidth(widgetType: string): number {
    return widgetRegistry.get(widgetType)?.defaultWidth ?? 200
}

/** Get default height for a widget type from the registry */
function getDefaultHeight(widgetType: string): number {
    return widgetRegistry.get(widgetType)?.defaultHeight ?? 120
}

// ── Edge factory ─────────────────────────────────────────────────────────────

function makeEdge(sourceId: string, targetId: string): Edge {
    return {
        id: `edge-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        animated: true,
        style: { stroke: '#8b5cf6', strokeWidth: 1.5 },
    }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a starting node centered at origin (0, 0).
 *
 * The node's top-left position is offset so that its center sits exactly
 * at the coordinate origin, per grid-sizing guidelines.
 */
export function createStartNode(
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

/**
 * Calculate position for a new node placed AFTER a source node.
 *
 * Positions the new node 5 grid units to the right of the source node,
 * with Y center-aligned for a straight horizontal edge.
 */
export function positionAfter(
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
 *
 * If a source node exists (incoming edge), places at the midpoint.
 * Otherwise, places 5 grid units to the left, Y center-aligned.
 */
export function positionBefore(
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

/**
 * Delete a node and bridge-reconnect its neighbors.
 *
 * When deleting A→B→C, creates A→C edges so the chain stays connected.
 * Returns updated nodes and edges arrays.
 */
export function deleteNodeWithReconnect(
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
            bridgeEdges.push(makeEdge(inc.source, out.target))
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

export { SPACING as NODE_SPACING, makeEdge }
