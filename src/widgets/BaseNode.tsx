/**
 * BaseNode — foundational wrapper for all node types.
 *
 * Provides:
 *   - type / subType classification
 *   - ctx (NodeContext) via React context → useNodeCtx()
 *
 * Hierarchy:
 *   BaseNode             (type, subType, ctx)
 *   └─ JobNode           type="job"     — does work
 *      └─ subType="ai"                  — AI agent job (rainbow border)
 *      └─ subType="script"              — code execution job
 *   └─ NoteNode          type="note"
 *      └─ subType="sticker"             — colored sticky note
 *   └─ GroupNode         type="group"   — grouping container
 */

import type { ReactNode } from 'react'
import type { NodeContext } from '@/engine/NodeContext'
import { NodeCtxProvider } from '@/engine/NodeContext'

export interface BaseNodeProps {
    /** Raw data from ReactFlow */
    data: any
    /** Node type category (e.g. 'job', 'note', 'group') */
    type: string
    /** Node subType specialization (e.g. 'ai', 'script', 'sticker') */
    subType?: string
    /** Children — either ReactNode or render function receiving ctx */
    children: ReactNode | ((ctx: NodeContext | undefined) => ReactNode)
}

export function BaseNode({ data, children }: BaseNodeProps) {
    const ctx = data.ctx as NodeContext | undefined

    return (
        <NodeCtxProvider value={ctx}>
            {typeof children === 'function' ? children(ctx) : children}
        </NodeCtxProvider>
    )
}
