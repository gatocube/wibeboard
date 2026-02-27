/**
 * AsciiRenderer — experimental ASCII art renderer using beautiful-mermaid.
 * Converts nodes/edges to Mermaid syntax, then renders as Unicode/ASCII box art.
 *
 * Powered by https://github.com/lukilabs/beautiful-mermaid
 */

import { useMemo, useState } from 'react'
import { renderMermaidASCII } from 'beautiful-mermaid'
import type { Node, Edge } from '@xyflow/react'
import { toMermaidSyntax } from './mermaid-helpers'

// ── Types ──

interface RendererProps {
    nodes: Node[]
    edges: Edge[]
}

// ── Main renderer ──

export function AsciiFlowRenderer({ nodes, edges }: RendererProps) {
    const [useAscii, setUseAscii] = useState(false)

    const syntax = useMemo(() => toMermaidSyntax(nodes, edges), [nodes, edges])

    const asciiOutput = useMemo(() => {
        try {
            return renderMermaidASCII(syntax, {
                useAscii,
                paddingX: 3,
                paddingY: 2,
                colorMode: 'html',
            })
        } catch (e: any) {
            return `Error rendering ASCII:\n${e?.message || String(e)}`
        }
    }, [syntax, useAscii])

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
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
                color: '#a78bfa', fontSize: 10, fontWeight: 600,
                fontFamily: 'monospace', letterSpacing: '1px',
                backdropFilter: 'blur(8px)',
            }}>
                ⚗️ Experimental · ASCII Renderer
            </div>

            {/* ASCII / Unicode toggle */}
            <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                display: 'flex', gap: 4,
                padding: '2px 4px', borderRadius: 6,
                background: 'rgba(15,15,26,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}>
                <button
                    onClick={() => setUseAscii(false)}
                    style={{
                        background: !useAscii ? 'rgba(167,139,250,0.15)' : 'transparent',
                        color: !useAscii ? '#a78bfa' : '#64748b',
                        border: !useAscii ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
                        borderRadius: 4, padding: '3px 8px', fontSize: 10,
                        fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    Unicode
                </button>
                <button
                    onClick={() => setUseAscii(true)}
                    style={{
                        background: useAscii ? 'rgba(167,139,250,0.15)' : 'transparent',
                        color: useAscii ? '#a78bfa' : '#64748b',
                        border: useAscii ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
                        borderRadius: 4, padding: '3px 8px', fontSize: 10,
                        fontWeight: 600, cursor: 'pointer',
                        fontFamily: "'JetBrains Mono', monospace",
                    }}
                >
                    ASCII
                </button>
            </div>

            {/* Mermaid syntax preview */}
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

            {/* ASCII output */}
            <pre
                data-testid="ascii-output"
                dangerouslySetInnerHTML={{ __html: asciiOutput }}
                style={{
                    color: '#a78bfa',
                    fontSize: 14,
                    lineHeight: 1.3,
                    fontFamily: "'JetBrains Mono', 'Cascadia Code', 'SF Mono', 'Fira Code', monospace",
                    padding: 32,
                    margin: 0,
                    whiteSpace: 'pre',
                    textAlign: 'center',
                }}
            />
        </div>
    )
}
