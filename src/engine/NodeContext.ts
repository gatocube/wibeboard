/**
 * NodeContext — the `ctx` object passed to agent & script node components.
 *
 * Accessed via `data.ctx` inside a ReactFlow node component:
 *   function AgentNode({ data }: { data: any }) {
 *       const ctx = data.ctx as NodeContext | undefined
 *       if (ctx) {
 *           ctx.messenger.getContacts()
 *           ctx.messenger.send('node-b', 'text', 'Hello!')
 *       }
 *   }
 *
 * The ctx is optional — nodes should still render correctly without it
 * (e.g. in the widget gallery where there is no live flow).
 */

import type { AgentMessenger } from './AgentMessenger'

export interface NodeContext {
    /** The node's own ID */
    nodeId: string

    /** Messenger instance — contacts, inbox, knock, system commands */
    messenger: AgentMessenger
}
