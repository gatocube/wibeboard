import { useState, useEffect } from 'react'
import { TestBuilderPage } from '@/pages/test-builder'
import BuilderSimplePage from '@/pages/builder-simple'
import { TestWidgetsPage } from '@/pages/test-widgets'
import { TwoNodeScenarioPage } from '@/pages/two-node-scenario'
import { FourNodeConcurrentPage } from '@/pages/four-node-concurrent'
import { IconsGalleryPage } from '@/pages/test-icons'
import { AIScriptScenarioPage } from '@/pages/ai-script-scenario'
import { IntegrationsPage } from '@/pages/integrations'
import { UIKitPage } from '@/pages/ui-kit'
import { ButtonsMenuPage } from '@/pages/buttons-menu'
import NodeConfiguratorPage from '@/pages/node-configurator'
import { FpsMeter } from '@/components/FpsMeter'
import { Menu, X, Layout, Layers, Home, GitBranch, Network, Palette, Workflow, Key, Settings } from 'lucide-react'

type Page = 'home' | 'builder' | 'builder-simple' | 'two-node' | 'four-node' | 'ai-script' | 'widgets' | 'icons' | 'integrations' | 'ui-kit' | 'buttons-menu' | 'node-configurator'

interface NavItem {
    id: Page
    label: string
    icon: React.ReactNode
    description: string
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Home', icon: <Home size={14} />, description: 'Overview' },
    { id: 'builder', label: 'Builder Demo Complex', icon: <Layout size={14} />, description: 'Flow builder with Agent, Script & Group nodes' },
    { id: 'builder-simple', label: 'Builder Demo Simple', icon: <Layout size={14} />, description: 'Minimal flow starting from a single node' },
    { id: 'two-node', label: 'Two-Node Scenario', icon: <GitBranch size={14} />, description: 'Tool calling + artifact publishing' },
    { id: 'four-node', label: 'Four-Node Concurrent', icon: <Network size={14} />, description: 'Parallel workers with aggregation' },
    { id: 'ai-script', label: 'AI + Script', icon: <Workflow size={14} />, description: 'Agent → Tests → Review → Deploy' },
    { id: 'integrations', label: 'Integrations', icon: <Key size={14} />, description: 'API keys for AI & external services' },
    { id: 'widgets', label: 'Widget Gallery', icon: <Layers size={14} />, description: 'Browse all templates and widgets' },
    { id: 'icons', label: 'Icon Reference', icon: <Palette size={14} />, description: 'All icons used in wibeboard' },
    { id: 'ui-kit', label: 'UI Kit', icon: <Layers size={14} />, description: 'Reusable components & demos' },
    { id: 'buttons-menu', label: 'Buttons Menu', icon: <Layers size={14} />, description: 'Node action menus' },
    { id: 'node-configurator', label: 'Node Configurator', icon: <Settings size={14} />, description: 'Explore & configure node types' },
]

export function App() {
    // Support ?page=X for direct navigation (used by E2E tests)
    const initialPage = (): Page => {
        const params = new URLSearchParams(window.location.search)
        const p = params.get('page')
        if (p && ['home', 'builder', 'builder-simple', 'two-node', 'four-node', 'ai-script', 'widgets', 'icons', 'integrations', 'ui-kit', 'buttons-menu', 'node-configurator'].includes(p)) {
            return p as Page
        }
        return 'builder'
    }
    const [page, setPage] = useState<Page>(initialPage)
    const isWideScreen = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
    const [sidebarOpen, setSidebarOpen] = useState(isWideScreen)

    const navigate = (p: Page) => {
        setPage(p)
        // Update URL so pages are bookmarkable
        const base = window.location.pathname
        const url = p === 'builder' ? base : `${base}?page=${p}`
        window.history.replaceState({}, '', url)
        // On narrow screens, close sidebar after navigation
        if (!isWideScreen) setSidebarOpen(false)
    }

    // Handle browser popstate (back/forward) — not strictly needed but nice
    useEffect(() => {
        const handler = () => {
            const params = new URLSearchParams(window.location.search)
            const p = params.get('page') as Page | null
            if (p && ['home', 'builder', 'builder-simple', 'two-node', 'four-node', 'ai-script', 'widgets', 'icons', 'integrations', 'ui-kit', 'buttons-menu', 'node-configurator'].includes(p)) {
                setPage(p)
            } else {
                setPage('builder')
            }
        }
        window.addEventListener('popstate', handler)
        return () => window.removeEventListener('popstate', handler)
    }, [])

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <FpsMeter />
            {/* Top bar */}
            <nav style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 16px',
                background: 'rgba(15,15,30,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                zIndex: 200, flexShrink: 0,
            }}>
                {/* Hamburger */}
                <button
                    data-testid="sidebar-toggle"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none',
                        background: sidebarOpen ? 'rgba(139,92,246,0.15)' : 'transparent',
                        color: sidebarOpen ? '#8b5cf6' : '#64748b',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                >
                    {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
                </button>

                <span
                    onClick={() => navigate('home')}
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
                        onClick={() => navigate(p)}
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

            {/* Content area with sidebar */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex' }}>
                {/* Sliding sidebar */}
                <div
                    data-testid="sidebar"
                    style={{
                        width: sidebarOpen ? 240 : 0,
                        overflow: 'hidden',
                        background: 'rgba(10,10,20,0.98)',
                        borderRight: sidebarOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
                        flexShrink: 0,
                        display: 'flex', flexDirection: 'column',
                        zIndex: 150,
                        visibility: sidebarOpen ? 'visible' : 'hidden',
                        opacity: sidebarOpen ? 1 : 0,
                    }}
                >
                    <div style={{
                        padding: '16px 14px 10px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <div style={{
                            fontSize: 9, fontWeight: 600, color: '#475569',
                            textTransform: 'uppercase', letterSpacing: '1px',
                            fontFamily: "'JetBrains Mono', monospace",
                        }}>
                            Examples
                        </div>
                    </div>

                    <div style={{
                        padding: '6px 8px', flex: 1, display: 'flex',
                        flexDirection: 'column', gap: 2,
                    }}>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                data-testid={`nav-${item.id}`}
                                onClick={() => navigate(item.id)}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: 10,
                                    padding: '8px 10px', borderRadius: 6,
                                    border: 'none', cursor: 'pointer',
                                    background: page === item.id ? 'rgba(139,92,246,0.12)' : 'transparent',
                                    textAlign: 'left',
                                    transition: 'all 0.15s',
                                    width: '100%',
                                }}
                            >
                                <div style={{
                                    width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                                    background: page === item.id ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${page === item.id ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: page === item.id ? '#8b5cf6' : '#64748b',
                                }}>
                                    {item.icon}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 11, fontWeight: 600,
                                        color: page === item.id ? '#e2e8f0' : '#94a3b8',
                                        fontFamily: 'Inter',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {item.label}
                                    </div>
                                    <div style={{
                                        fontSize: 9, color: '#475569',
                                        fontFamily: 'Inter', marginTop: 1,
                                        whiteSpace: 'nowrap', overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {item.description}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '10px 14px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                        <a
                            href="https://github.com/gatocube/wibeboard"
                            target="_blank"
                            rel="noopener"
                            style={{
                                fontSize: 9, color: '#475569', textDecoration: 'none',
                                fontFamily: "'JetBrains Mono', monospace",
                                display: 'flex', alignItems: 'center', gap: 4,
                            }}
                        >
                            github.com/gatocube/wibeboard
                        </a>
                    </div>
                </div>

                {/* Page content */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {page === 'home' && <HomePage onNavigate={navigate} />}
                    {page === 'builder' && <TestBuilderPage />}
                    {page === 'builder-simple' && <BuilderSimplePage />}
                    {page === 'two-node' && <TwoNodeScenarioPage />}
                    {page === 'four-node' && <FourNodeConcurrentPage />}
                    {page === 'ai-script' && <AIScriptScenarioPage />}
                    {page === 'widgets' && <TestWidgetsPage />}
                    {page === 'icons' && <IconsGalleryPage />}
                    {page === 'integrations' && <IntegrationsPage />}
                    {page === 'ui-kit' && <UIKitPage />}
                    {page === 'buttons-menu' && <ButtonsMenuPage />}
                    {page === 'node-configurator' && <NodeConfiguratorPage />}
                </div>
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
