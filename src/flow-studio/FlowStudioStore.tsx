/**
 * FlowStudioStore — MobX store for shared FlowStudio UI state.
 *
 * Manages: theme, mode, zoomAutosize, currentSize, selectedNodeId.
 * Connector state machine stays component-local (tightly coupled to pointer events).
 */

import { makeAutoObservable, action } from 'mobx'
import { createContext, useContext } from 'react'
import type { ThemeKey, ThemeMode, NodeSize } from './types'

// ── Store ────────────────────────────────────────────────────────────────────

export class FlowStudioStore {
    // ── Settings ──
    theme: ThemeKey = 'wibeglow'
    mode: ThemeMode = 'dark'
    zoomAutosize: boolean = false
    currentSize: NodeSize = 'M'

    // ── Node selection (player buttons / SwipeButtons menu) ──
    selectedNodeId: string | null = null

    constructor(initialTheme?: ThemeKey, initialSize?: NodeSize) {
        if (initialTheme) this.theme = initialTheme
        if (initialSize) this.currentSize = initialSize
        makeAutoObservable(this, {
            setTheme: action,
            setMode: action,
            setZoomAutosize: action,
            setCurrentSize: action,
            setSelectedNodeId: action,
            toggleSelectedNode: action,
            clearSelectedNode: action,
        })
    }

    // ── Actions ──

    setTheme(theme: ThemeKey) {
        this.theme = theme
    }

    setMode(mode: ThemeMode) {
        this.mode = mode
    }

    setZoomAutosize(enabled: boolean) {
        this.zoomAutosize = enabled
    }

    setCurrentSize(size: NodeSize) {
        this.currentSize = size
    }

    setSelectedNodeId(nodeId: string | null) {
        this.selectedNodeId = nodeId
    }

    toggleSelectedNode(nodeId: string) {
        this.selectedNodeId = this.selectedNodeId === nodeId ? null : nodeId
    }

    clearSelectedNode() {
        this.selectedNodeId = null
    }
}

// ── React Context ────────────────────────────────────────────────────────────

const FlowStudioContext = createContext<FlowStudioStore | null>(null)

export function FlowStudioStoreProvider({
    store,
    children,
}: {
    store: FlowStudioStore
    children: React.ReactNode
}) {
    return (
        <FlowStudioContext.Provider value= { store } >
        { children }
        </FlowStudioContext.Provider>
    )
}

export function useFlowStudioStore(): FlowStudioStore {
    const store = useContext(FlowStudioContext)
    if (!store) {
        throw new Error('useFlowStudioStore must be used within a FlowStudioStoreProvider')
    }
    return store
}
