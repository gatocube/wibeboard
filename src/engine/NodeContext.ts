/**
 * NodeContext — the `ctx` object passed to agent & script node components.
 *
 * Provides both the interface and a React context for accessing ctx
 * anywhere in the node component tree without prop drilling.
 *
 * Usage in node components:
 *   function JobNodeInner({ ctx }: { ctx: NodeContext }) {
 *       const { data, ui, messenger } = ctx
 *       const label = data.label
 *       const isDark = ui.themeType === 'night'
 *   }
 */

import { createContext, useContext } from 'react'
import type { AgentMessenger } from './AgentMessenger'

// ── UI metadata ─────────────────────────────────────────────────────────────

export interface NodeUI {
    /** Theme name: 'wibeglow' | 'pixel' | 'ghub' */
    themeName: string
    /** Theme variant: 'night' | 'day' | 'animated' | 'static' | 'pixel' | 'tui' */
    themeType: string
}

// ── Node Context ────────────────────────────────────────────────────────────

export interface NodeContext {
    /** The node's own ID */
    nodeId: string

    /** Messenger instance — contacts, inbox, knock, system commands */
    messenger: AgentMessenger

    /** Raw node data (label, status, progress, subType, etc.) */
    data: Record<string, any>

    /** UI/theme metadata */
    ui: NodeUI
}

// ── React context ───────────────────────────────────────────────────────────

const NodeCtxContext = createContext<NodeContext | undefined>(undefined)

/** Provider component — used by BaseNode to inject ctx */
export const NodeCtxProvider = NodeCtxContext.Provider

/** Hook to access ctx from anywhere inside a node component tree */
export function useNodeCtx(): NodeContext | undefined {
    return useContext(NodeCtxContext)
}
