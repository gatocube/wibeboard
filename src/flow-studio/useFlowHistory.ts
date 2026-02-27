/**
 * useFlowHistory — reusable undo/redo hook for FlowStudio consumers.
 *
 * Tracks a linear history of { nodes, edges } snapshots.
 * Returns undo/redo callbacks + canUndo/canRedo booleans
 * that can be passed directly to FlowStudio props.
 *
 * Usage:
 *   const { pushHistory, undo, redo, canUndo, canRedo, resetHistory } = useFlowHistory(updateWorkflow)
 *   // Call pushHistory(nodes, edges) after every meaningful change.
 *   // Pass undo, redo, canUndo, canRedo to <FlowStudio>.
 */

import { useCallback, useRef, useState } from 'react'
import type { Node, Edge } from '@xyflow/react'

interface HistoryEntry { nodes: Node[]; edges: Edge[] }

export function useFlowHistory(
    /** Called when undo/redo restores a snapshot */
    applySnapshot: (nodes: Node[], edges: Edge[]) => void,
) {
    const historyRef = useRef<HistoryEntry[]>([])
    const historyIndexRef = useRef(-1)
    const skipPushRef = useRef(false)
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    const updateState = useCallback(() => {
        setCanUndo(historyIndexRef.current > 0)
        setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }, [])

    /** Record a snapshot. Call after every meaningful node/edge change. */
    const pushHistory = useCallback((nodes: Node[], edges: Edge[]) => {
        if (skipPushRef.current) { skipPushRef.current = false; return }
        const idx = historyIndexRef.current
        historyRef.current = historyRef.current.slice(0, idx + 1)
        historyRef.current.push({ nodes, edges })
        historyIndexRef.current = historyRef.current.length - 1
        updateState()
    }, [updateState])

    /** Undo — go to previous snapshot */
    const undo = useCallback(() => {
        const idx = historyIndexRef.current
        if (idx <= 0) return
        historyIndexRef.current = idx - 1
        const entry = historyRef.current[idx - 1]
        skipPushRef.current = true
        applySnapshot(entry.nodes, entry.edges)
        updateState()
    }, [applySnapshot, updateState])

    /** Redo — go to next snapshot */
    const redo = useCallback(() => {
        const idx = historyIndexRef.current
        if (idx >= historyRef.current.length - 1) return
        historyIndexRef.current = idx + 1
        const entry = historyRef.current[idx + 1]
        skipPushRef.current = true
        applySnapshot(entry.nodes, entry.edges)
        updateState()
    }, [applySnapshot, updateState])

    /** Reset history (e.g. when switching workflows) */
    const resetHistory = useCallback((nodes: Node[], edges: Edge[]) => {
        historyRef.current = [{ nodes, edges }]
        historyIndexRef.current = 0
        updateState()
    }, [updateState])

    return { pushHistory, undo, redo, canUndo, canRedo, resetHistory }
}
