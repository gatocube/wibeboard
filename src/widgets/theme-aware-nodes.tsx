/**
 * Theme-aware node type map.
 *
 * Creates React Flow `nodeTypes` that read the active theme from
 * FlowStudioStore and render the correct template's component.
 * Falls back to wibeglow when a template doesn't implement a widget.
 */

import React, { useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import type { NodeProps } from '@xyflow/react'
import { FlowStudioStore } from '@/flow-studio/FlowStudioStore'
import type { ThemeKey } from '@/flow-studio/types'

// ── Template components ─────────────────────────────────────────────────────────

import * as wibeglow from './wibeglow'
import * as pixel from './pixel'
import * as ghub from './ghub'

// ── Component maps per template ─────────────────────────────────────────────────

type NodeComponent = React.ComponentType<any>

const THEME_COMPONENTS: Record<ThemeKey, Record<string, NodeComponent>> = {
    wibeglow: {
        starting: wibeglow.StartingNode,
        job: wibeglow.JobNode,
        user: wibeglow.UserNode,
        subflow: wibeglow.SubFlowNode,
        group: wibeglow.GroupNode,
        informer: wibeglow.InformerNode,
        expectation: wibeglow.ExpectationNode,
        artifact: wibeglow.ArtifactNode,
    },
    pixel: {
        job: pixel.JobNode,
        informer: pixel.InformerNode,
    },
    ghub: {
        job: ghub.JobNode,
        informer: ghub.InformerNode,
    },
}

// ── Theme-aware wrapper factory ─────────────────────────────────────────────────

function createThemeAwareNode(widgetType: string, store: FlowStudioStore) {
    const Component = observer(function ThemeAwareNode(props: NodeProps) {
        const theme = store.theme
        const Comp = THEME_COMPONENTS[theme]?.[widgetType]
            ?? THEME_COMPONENTS.wibeglow[widgetType]
        if (!Comp) return null
        return <Comp {...props} />
    })
    Component.displayName = `ThemeAware_${widgetType}`
    return Component
}

// ── Public API ──────────────────────────────────────────────────────────────────

/**
 * Build a `nodeTypes` map where each entry delegates to the correct
 * template component based on `store.theme`.
 *
 * Usage:
 *   const nodeTypes = useThemeAwareNodeTypes(store)
 *   <ReactFlow nodeTypes={nodeTypes} ... />
 */
export function useThemeAwareNodeTypes(
    store: FlowStudioStore,
    widgetTypes: string[] = ['starting', 'job', 'user', 'subflow', 'group', 'informer', 'expectation', 'artifact'],
): Record<string, React.ComponentType<any>> {
    // Memoize on store identity only — the observer inside each wrapper
    // handles re-render when store.theme changes
    return useMemo(() => {
        const types: Record<string, React.ComponentType<any>> = {}
        for (const wt of widgetTypes) {
            types[wt] = createThemeAwareNode(wt, store)
        }
        return types
    }, [store]) // eslint-disable-line react-hooks/exhaustive-deps
}
