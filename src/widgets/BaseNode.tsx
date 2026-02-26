/**
 * BaseNode — foundational wrapper for all node types.
 *
 * Provides:
 *   - type / subType classification
 *   - ctx (NodeContext) via React context → useNodeCtx()
 *     ctx.data — raw node data
 *     ctx.ui   — theme metadata (themeName, themeType)
 *     ctx.messenger — agent messaging
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
import type { NodeContext, NodeUI } from '@/engine/NodeContext'
import { NodeCtxProvider } from '@/engine/NodeContext'
import { DebugOverlay } from '@/widgets/DebugOverlay'

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

/** Derive UI metadata from data flags */
function buildUI(data: any): NodeUI {
    // Explicit theme info takes priority
    if (data._themeName) {
        return { themeName: data._themeName, themeType: data._themeType || 'night' }
    }
    // Infer from mode flags (backwards compat)
    if (data.dayMode) return { themeName: 'ghub', themeType: 'day' }
    if (data.staticMode) return { themeName: 'wibeglow', themeType: 'static' }
    if (data.tuiMode) return { themeName: 'pixel', themeType: 'tui' }
    return { themeName: 'wibeglow', themeType: 'night' }
}

export function BaseNode({ data, type, subType, children }: BaseNodeProps) {
    const rawCtx = data.ctx as { nodeId?: string; messenger?: any } | undefined
    const ui = buildUI(data)

    const ctx: NodeContext | undefined = rawCtx?.messenger
        ? {
            nodeId: rawCtx.nodeId || '',
            messenger: rawCtx.messenger,
            data,
            ui,
        }
        : {
            // Gallery / standalone mode — no messenger
            nodeId: '',
            messenger: undefined as any,
            data,
            ui,
        }

    return (
        <NodeCtxProvider value={ctx}>
            <div style={{ position: 'relative' }}>
                {typeof children === 'function' ? children(ctx) : children}
                {data.debugMode && (
                    <DebugOverlay
                        data={data}
                        nodeId={rawCtx?.nodeId || data._debugId}
                        type={type}
                        subType={subType}
                    />
                )}
            </div>
        </NodeCtxProvider>
    )
}
