/**
 * BaseNode — foundational wrapper for all node types.
 *
 * Provides:
 *   - type / subtype classification
 *   - ctx (NodeContext) via React context → useNodeCtx()
 *   - Common data extraction
 *
 * Hierarchy:
 *   BaseNode         (type, subtype, ctx)
 *   └─ JobNode       type="job"     — does work (agents, scripts)
 *      └─ AgentNode  subtype="ai"   — AI-powered job
 *      └─ ScriptNode subtype="script" — code execution job
 *   └─ NoteNode      type="note"    — stickers, labels
 *   └─ GroupNode     type="group"   — grouping container
 *
 * Usage by theme-specific renderers:
 *   function JobNode({ data }) {
 *       return (
 *           <BaseNode data={data} type="job">
 *               {(ctx) => <MyRendering ctx={ctx} />}
 *           </BaseNode>
 *       )
 *   }
 */

import type { ReactNode } from 'react'
import type { NodeContext } from '@/engine/NodeContext'
import { NodeCtxProvider } from '@/engine/NodeContext'

export interface BaseNodeProps {
    /** Raw data from ReactFlow */
    data: any
    /** Node type category */
    type: string
    /** Node subtype specialization */
    subtype?: string
    /** Children — either ReactNode or render function receiving ctx */
    children: ReactNode | ((ctx: NodeContext | undefined) => ReactNode)
}

export function BaseNode({ data, type: _type, subtype: _subtype, children }: BaseNodeProps) {
    const ctx = data.ctx as NodeContext | undefined

    return (
        <NodeCtxProvider value={ctx}>
            {typeof children === 'function' ? children(ctx) : children}
        </NodeCtxProvider>
    )
}
