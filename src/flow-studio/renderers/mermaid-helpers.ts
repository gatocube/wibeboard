/**
 * mermaid-helpers — shared utilities for converting nodes/edges to Mermaid syntax.
 * Used by both MermaidRenderer (SVG output) and AsciiRenderer (ASCII output).
 */

import type { Node, Edge } from '@xyflow/react'

/** Sanitize label for Mermaid (escape quotes, brackets) */
export function sanitize(text: string): string {
    return text.replace(/"/g, "'").replace(/[[\]{}()]/g, '')
}

/** Generate a Mermaid-safe ID from an arbitrary node ID */
export function mermaidId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_')
}

/** Convert nodes + edges to Mermaid flowchart definition */
export function toMermaidSyntax(nodes: Node[], edges: Edge[]): string {
    const lines: string[] = ['flowchart LR']

    for (const node of nodes) {
        const label = sanitize(String((node.data as any)?.label || node.id))
        const wtype = String((node.data as any)?.widgetType || node.type || '')
        const status = (node.data as any)?.status
        const mid = mermaidId(node.id)

        // Use different shapes based on widget type
        if (wtype === 'start' || wtype === 'starting') {
            lines.push(`    ${mid}(["▶ ${label}"])`)
        } else if (wtype === 'ai') {
            lines.push(`    ${mid}{{"🤖 ${label}"}}`)
        } else if (wtype === 'user') {
            lines.push(`    ${mid}[/"👤 ${label}"/]`)
        } else if (wtype === 'info') {
            lines.push(`    ${mid}(("ℹ️ ${label}"))`)
        } else {
            lines.push(`    ${mid}["${label}"]`)
        }

        // Apply status-based styling
        if (status === 'success') {
            lines.push(`    style ${mid} fill:#065f46,stroke:#22c55e,color:#fff`)
        } else if (status === 'failed') {
            lines.push(`    style ${mid} fill:#7f1d1d,stroke:#ef4444,color:#fff`)
        } else if (status === 'working') {
            lines.push(`    style ${mid} fill:#78350f,stroke:#f59e0b,color:#fff`)
        } else {
            lines.push(`    style ${mid} fill:#1e1b4b,stroke:#8b5cf6,color:#e2e8f0`)
        }
    }

    for (const edge of edges) {
        const src = mermaidId(edge.source)
        const tgt = mermaidId(edge.target)
        const label = (edge as any).label
        if (label) {
            lines.push(`    ${src} -->|${sanitize(String(label))}| ${tgt}`)
        } else {
            lines.push(`    ${src} --> ${tgt}`)
        }
    }

    return lines.join('\n')
}
