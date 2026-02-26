/**
 * FlowStudioStore — MobX store for shared FlowStudio UI state.
 *
 * Manages: theme, mode, zoomAutosize, currentSize, selectedNodeId.
 * Connector state machine stays component-local (tightly coupled to pointer events).
 */

import { makeAutoObservable, action } from 'mobx'
import { createContext, useContext } from 'react'
import type { ThemeKey, ThemeMode, NodeSize, RendererType } from './types'

export type ControlMode = 'click' | 'hold' | 'swipe'

// ── Store ────────────────────────────────────────────────────────────────────

export class FlowStudioStore {
    // ── Settings ──
    theme: ThemeKey = 'wibeglow'
    mode: ThemeMode = 'dark'
    zoomAutosize: boolean = false
    currentSize: NodeSize = 'M'
    showMinimap: boolean = false
    controlMode: ControlMode = 'click'
    debugMode: boolean = false
    renderer: RendererType = 'reactflow'

    // ── Node selection (player buttons / SwipeButtons menu) ──
    selectedNodeId: string | null = null

    constructor(initialTheme?: ThemeKey, initialSize?: NodeSize) {
        if (initialTheme) this.theme = initialTheme
        if (initialSize) this.currentSize = initialSize

        try {
            const savedMinimap = localStorage.getItem('flowstudio_show_minimap')
            if (savedMinimap === '1') this.showMinimap = true
            if (savedMinimap === '0') this.showMinimap = false
            const savedControl = localStorage.getItem('flowstudio_control_mode')
            if (savedControl === 'click' || savedControl === 'hold' || savedControl === 'swipe') {
                this.controlMode = savedControl
            }
            const savedDebug = localStorage.getItem('flowstudio_debug_mode')
            if (savedDebug === '1') this.debugMode = true
            const savedRenderer = localStorage.getItem('flowstudio_renderer') as RendererType | null
            if (savedRenderer && ['reactflow', 'three-fiber', 'ascii', 'mermaid', 'mobile'].includes(savedRenderer)) {
                this.renderer = savedRenderer
            }
        } catch (e) { }

        makeAutoObservable(this, {
            setTheme: action,
            setMode: action,
            setZoomAutosize: action,
            setCurrentSize: action,
            setShowMinimap: action,
            setControlMode: action,
            setDebugMode: action,
            setRenderer: action,
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

    setShowMinimap(show: boolean) {
        this.showMinimap = show
        try {
            localStorage.setItem('flowstudio_show_minimap', show ? '1' : '0')
        } catch (e) { }
    }

    setControlMode(mode: ControlMode) {
        this.controlMode = mode
        try {
            localStorage.setItem('flowstudio_control_mode', mode)
        } catch (e) { }
    }

    setDebugMode(enabled: boolean) {
        this.debugMode = enabled
        try {
            localStorage.setItem('flowstudio_debug_mode', enabled ? '1' : '0')
        } catch (e) { }
    }

    setRenderer(renderer: RendererType) {
        this.renderer = renderer
        try {
            localStorage.setItem('flowstudio_renderer', renderer)
        } catch (e) { }
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
        <FlowStudioContext.Provider value={store} >
            {children}
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
