/**
 * resolve-collisions.ts — Node collision detection & resolution.
 *
 * Implements the naive O(n²) algorithm from the React Flow blog:
 * https://xyflow.com/blog/node-collision-detection-algorithms
 *
 * For each overlapping pair, pushes apart along the axis with
 * smallest overlap. Iterates until no collisions remain.
 */

import type { Node } from '@xyflow/react'
import { GRID_CELL } from '@/engine/widget-types-registry'

export interface CollisionOptions {
    /** Minimum gap between nodes in px (default: GRID_CELL = 20px = 1 grid unit) */
    margin?: number
    /** Max iterations to prevent infinite loops (default: 50) */
    maxIterations?: number
    /** ID of the node that was just moved/created — it stays fixed, others move */
    anchorId?: string
}

/** Get node bounding box */
function getRect(node: Node) {
    const w = (node.measured?.width ?? node.width ?? (node.style as any)?.width) || 100
    const h = (node.measured?.height ?? node.height ?? (node.style as any)?.height) || 60
    return {
        x: node.position.x,
        y: node.position.y,
        w: typeof w === 'number' ? w : parseFloat(w),
        h: typeof h === 'number' ? h : parseFloat(h),
    }
}

/** Check if two rects overlap (with margin) */
function overlaps(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
    margin: number,
): boolean {
    return (
        a.x < b.x + b.w + margin &&
        a.x + a.w + margin > b.x &&
        a.y < b.y + b.h + margin &&
        a.y + a.h + margin > b.y
    )
}

/**
 * Resolve all node overlaps by pushing apart along the axis with smallest overlap.
 *
 * @param nodes - Current nodes array
 * @param options - Collision resolution options
 * @returns New nodes array with resolved positions
 */
export function resolveCollisions(nodes: Node[], options: CollisionOptions = {}): Node[] {
    const {
        margin = GRID_CELL,
        maxIterations = 50,
        anchorId,
    } = options

    // Clone positions so we can mutate
    const positions = nodes.map(n => ({ ...n.position }))

    for (let iter = 0; iter < maxIterations; iter++) {
        let moved = false

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const ri = { ...getRect(nodes[i]), ...positions[i] }
                const rj = { ...getRect(nodes[j]), ...positions[j] }

                // Use node dimensions from getRect but position from our mutable copy
                ri.x = positions[i].x
                ri.y = positions[i].y
                rj.x = positions[j].x
                rj.y = positions[j].y

                if (!overlaps(ri, rj, margin)) continue

                // Calculate overlap on each axis
                const overlapX = Math.min(ri.x + ri.w + margin, rj.x + rj.w + margin) -
                    Math.max(ri.x, rj.x)
                const overlapY = Math.min(ri.y + ri.h + margin, rj.y + rj.h + margin) -
                    Math.max(ri.y, rj.y)

                // Push apart along axis with smallest overlap
                if (overlapX < overlapY) {
                    const shift = overlapX / 2
                    const leftIdx = ri.x <= rj.x ? i : j
                    const rightIdx = leftIdx === i ? j : i

                    if (anchorId && nodes[leftIdx].id === anchorId) {
                        positions[rightIdx].x += shift * 2
                    } else if (anchorId && nodes[rightIdx].id === anchorId) {
                        positions[leftIdx].x -= shift * 2
                    } else {
                        positions[leftIdx].x -= shift
                        positions[rightIdx].x += shift
                    }
                } else {
                    const shift = overlapY / 2
                    const topIdx = ri.y <= rj.y ? i : j
                    const bottomIdx = topIdx === i ? j : i

                    if (anchorId && nodes[topIdx].id === anchorId) {
                        positions[bottomIdx].y += shift * 2
                    } else if (anchorId && nodes[bottomIdx].id === anchorId) {
                        positions[topIdx].y -= shift * 2
                    } else {
                        positions[topIdx].y -= shift
                        positions[bottomIdx].y += shift
                    }
                }

                moved = true
            }
        }

        if (!moved) break
    }

    // Snap to grid and return updated nodes
    return nodes.map((node, i) => {
        const snappedX = Math.round(positions[i].x / GRID_CELL) * GRID_CELL
        const snappedY = Math.round(positions[i].y / GRID_CELL) * GRID_CELL

        if (snappedX === node.position.x && snappedY === node.position.y) {
            return node // no change
        }

        return {
            ...node,
            position: { x: snappedX, y: snappedY },
        }
    })
}

/**
 * Find a non-overlapping position for a new node, starting from the desired position
 * and offsetting by SPACING (3 grid units) from the nearest node.
 */
export function findNonOverlappingPosition(
    nodes: Node[],
    newWidth: number,
    newHeight: number,
    desiredPosition: { x: number; y: number },
): { x: number; y: number } {
    const SPACING = GRID_CELL * 5 // 5 grid units = 100px

    const newRect = {
        x: desiredPosition.x,
        y: desiredPosition.y,
        w: newWidth,
        h: newHeight,
    }

    // Check if desired position is clear
    let hasOverlap = false
    for (const node of nodes) {
        const r = getRect(node)
        if (overlaps(newRect, r, SPACING)) {
            hasOverlap = true
            break
        }
    }

    if (!hasOverlap) return desiredPosition

    // Try shifting right, then down, then diagonally
    const offsets = [
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: 1 },  // down
        { dx: 1, dy: 1 },  // diagonal
        { dx: -1, dy: 0 }, // left
        { dx: 0, dy: -1 }, // up
    ]

    for (const { dx, dy } of offsets) {
        for (let step = 1; step <= 10; step++) {
            const candidate = {
                x: desiredPosition.x + dx * step * (newWidth + SPACING),
                y: desiredPosition.y + dy * step * (newHeight + SPACING),
                w: newWidth,
                h: newHeight,
            }

            let clear = true
            for (const node of nodes) {
                const r = getRect(node)
                if (overlaps(candidate, r, SPACING)) {
                    clear = false
                    break
                }
            }

            if (clear) {
                return {
                    x: Math.round(candidate.x / GRID_CELL) * GRID_CELL,
                    y: Math.round(candidate.y / GRID_CELL) * GRID_CELL,
                }
            }
        }
    }

    // Fallback: just offset right
    return {
        x: Math.round((desiredPosition.x + newWidth + SPACING) / GRID_CELL) * GRID_CELL,
        y: Math.round(desiredPosition.y / GRID_CELL) * GRID_CELL,
    }
}
