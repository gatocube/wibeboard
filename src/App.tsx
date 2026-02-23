import { useState } from 'react'
import { TestBuilderPage } from '@/pages/test-builder'
import { TestWidgetsPage } from '@/pages/test-widgets'

type Page = 'home' | 'builder' | 'widgets'

export function App() {
    const [page, setPage] = useState<Page>('builder')

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Nav bar */}
            <nav style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 16px',
                background: 'rgba(15,15,30,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                zIndex: 100, flexShrink: 0,
            }}>
                <span
                    onClick={() => setPage('home')}
                    style={{
                        fontSize: 14, fontWeight: 700, color: '#8b5cf6',
                        cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: '-0.5px',
                    }}
                >
                    wibeboard
                </span>
                <span style={{ color: '#1e293b' }}>|</span>
                {(['builder', 'widgets'] as Page[]).map(p => (
                    <button
                        key={p}
                        onClick={() => setPage(p)}
                        style={{
                            padding: '3px 8px', borderRadius: 4,
                            border: 'none', cursor: 'pointer',
                            background: page === p ? 'rgba(139,92,246,0.15)' : 'transparent',
                            color: page === p ? '#8b5cf6' : '#64748b',
                            fontSize: 10, fontWeight: 500,
                            fontFamily: 'Inter',
                            transition: 'all 0.15s',
                        }}
                    >
                        {p}
                    </button>
                ))}
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 8, color: '#334155', fontFamily: "'JetBrains Mono', monospace" }}>
                    v0.1.0
                </span>
            </nav>

            {/* Page content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {page === 'home' && <HomePage onNavigate={setPage} />}
                {page === 'builder' && <TestBuilderPage />}
                {page === 'widgets' && <TestWidgetsPage />}
            </div>
        </div>
    )
}


// ── Home Page ──────────────────────────────────────────────────────────────────

function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 20,
        }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: '#8b5cf6', fontFamily: "'JetBrains Mono', monospace" }}>
                wibeboard
            </div>
            <div style={{ fontSize: 14, color: '#64748b', fontFamily: 'Inter', textAlign: 'center', maxWidth: 400 }}>
                Interactive widget-based flow builder with customizable visual themes.
                <br />Like n8n, but with interactive widget nodes.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                    onClick={() => onNavigate('builder')}
                    style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none',
                        background: '#8b5cf6', color: '#fff',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'Inter',
                    }}
                >
                    Builder Demo
                </button>
                <button
                    onClick={() => onNavigate('widgets')}
                    style={{
                        padding: '8px 20px', borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent', color: '#94a3b8',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'Inter',
                    }}
                >
                    Widget Gallery
                </button>
            </div>
        </div>
    )
}
