/**
 * NodeContext — the `ctx` object passed to agent & script node components.
 *
 * Provides both the interface and a React context for accessing ctx
 * anywhere in the node component tree without prop drilling.
 *
 * Usage in node components:
 *   function MyNode({ data }) {
 *       const ctx = useNodeCtx()  // from React context (set by BaseNode)
 *       ctx?.messenger.getContacts()
 *   }
 */

import { createContext, useContext } from 'react'
import type { AgentMessenger } from './AgentMessenger'

export interface NodeContext {
    /** The node's own ID */
    nodeId: string

    /** Messenger instance — contacts, inbox, knock, system commands */
    messenger: AgentMessenger
}

// ── React context ───────────────────────────────────────────────────────────

const NodeCtxContext = createContext<NodeContext | undefined>(undefined)

/** Provider component — used by BaseNode to inject ctx */
export const NodeCtxProvider = NodeCtxContext.Provider

/** Hook to access ctx from anywhere inside a node component tree */
export function useNodeCtx(): NodeContext | undefined {
    return useContext(NodeCtxContext)
}
