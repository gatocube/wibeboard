/**
 * MermaidRenderer — experimental renderer that converts nodes/edges to
 * a Mermaid flowchart and renders it as SVG.
 */

import { useEffect, useRef, useMemo, useState } from 'react'
import mermaid from 'mermaid'
import type { Node, Edge } from '@xyflow/react'
import { toMermaidSyntax } from './mermaid-helpers'

// ── Types ──

interface RendererProps {
    nodes: Node[]
    edges: Edge[]
}

// ── Component ──

export function MermaidRenderer({ nodes, edges }: RendererProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [svgHtml, setSvgHtml] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    const syntax = useMemo(() => toMermaidSyntax(nodes, edges), [nodes, edges])

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            themeVariables: {
                primaryColor: '#1e1b4b',
                primaryBorderColor: '#8b5cf6',
                primaryTextColor: '#e2e8f0',
                lineColor: '#8b5cf6',
                secondaryColor: '#1a1a2e',
                tertiaryColor: '#0f0f23',
                fontFamily: 'Inter, sans-serif',
                fontSize: '12px',
            },
            flowchart: {
                curve: 'basis',
                padding: 16,
                htmlLabels: true,
            },
        })
    }, [])

    useEffect(() => {
        let cancelled = false

        async function render() {
            try {
                const id = `mermaid-${Date.now()}`
                const { svg } = await mermaid.render(id, syntax)
                if (!cancelled) {
                    setSvgHtml(svg)
                    setError(null)
                }
            } catch (e: any) {
                if (!cancelled) {
                    setError(e?.message || 'Mermaid render error')
                }
            }
        }

        render()
        return () => { cancelled = true }
    }, [syntax])

    return (
        <div style={{
            width: '100%', height: '100%', position: 'relative',
            background: '#0a0a14', overflow: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {/* Experimental badge */}
            <div style={{
                position: 'absolute', top: 12, left: 12, zIndex: 10,
                padding: '4px 10px', borderRadius: 6,
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#22c55e', fontSize: 10, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px',
                backdropFilter: 'blur(8px)',
            }}>
                ⚗️ Experimental · Mermaid Renderer
            </div>

            {/* Mermaid syntax preview toggle */}
            <details style={{
                position: 'absolute', bottom: 12, left: 12, zIndex: 10,
                background: 'rgba(0,0,0,0.6)', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '4px 10px', maxWidth: 400,
                backdropFilter: 'blur(8px)',
            }}>
                <summary style={{
                    color: '#64748b', fontSize: 10, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600,
                }}>
                    View Mermaid Source
                </summary>
                <pre style={{
                    color: '#94a3b8', fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'pre-wrap', marginTop: 6, lineHeight: 1.5,
                    maxHeight: 200, overflow: 'auto',
                }}>
                    {syntax}
                </pre>
            </details>

            {error ? (
                <div style={{ color: '#ef4444', fontSize: 12, fontFamily: 'Inter', padding: 24 }}>
                    Mermaid Error: {error}
                </div>
            ) : (
                <div
                    ref={containerRef}
                    dangerouslySetInnerHTML={{ __html: svgHtml }}
                    style={{
                        padding: 32,
                        maxWidth: '90%',
                        maxHeight: '90%',
                        overflow: 'auto',
                    }}
                />
            )}
        </div>
    )
}
