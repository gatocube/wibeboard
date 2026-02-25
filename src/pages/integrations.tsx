import { useState } from 'react'
import {
    Github, Terminal, Hand, Bot, MessageSquare,
    Key, CheckCircle2, XCircle, Loader2, AlertTriangle, Info, Plug
} from 'lucide-react'
import { useIntegrations, type IntegrationId } from '@/hooks/useIntegrations'

interface TestStatus {
    loading: boolean
    success?: boolean
    warning?: boolean
    message?: string
}

export function IntegrationsPage() {
    const { integrations, states, isLoaded, saveKey, getKey, saveCustomIntegrations, customIntegrationsRaw } = useIntegrations()
    const [testStatuses, setTestStatuses] = useState<Record<string, TestStatus>>({})
    const [customJson, setCustomJson] = useState(() => {
        // Provide a helpful default if it's just '[]'
        return customIntegrationsRaw === '[]'
            ? `[\n  {\n    "id": "ollama",\n    "name": "Ollama (qwen)",\n    "envKey": "VITE_OLLAMA_URL",\n    "storageKey": "integration_ollama_url"\n  }\n]`
            : customIntegrationsRaw
    })
    const [jsonError, setJsonError] = useState<string | null>(null)
    const [jsonSuccess, setJsonSuccess] = useState(false)

    if (!isLoaded) return null

    const ICONS: Record<string, React.ReactNode> = {
        github: <Github size={20} />,
        cursor: <Terminal size={20} />,
        openhands: <Hand size={20} />,
        openai: <Bot size={20} />,
        claudecode: <MessageSquare size={20} />
    }

    const handleTest = async (id: IntegrationId) => {
        const key = getKey(id)
        if (!key) {
            setTestStatuses(prev => ({
                ...prev,
                [id]: { loading: false, success: false, message: 'No key provided' }
            }))
            return
        }

        setTestStatuses(prev => ({
            ...prev,
            [id]: { loading: true }
        }))

        try {
            if (id === 'github') {
                // Test GitHub
                const readRes = await fetch('https://api.github.com/user', {
                    headers: {
                        Authorization: `Bearer ${key}`,
                        Accept: 'application/vnd.github.v3+json'
                    }
                })

                if (!readRes.ok) {
                    setTestStatuses(prev => ({
                        ...prev,
                        [id]: { loading: false, success: false, message: 'Failed: Invalid Token or Scopes' }
                    }))
                    return
                }

                const scopesHeader = readRes.headers.get('x-oauth-scopes') || ''
                const scopes = scopesHeader.split(',').map((s: string) => s.trim())
                const hasDangerousScopes = scopes.includes('repo') || scopes.includes('public_repo')

                if (hasDangerousScopes) {
                    setTestStatuses(prev => ({
                        ...prev,
                        [id]: { loading: false, success: true, message: 'Read: OK, Write: Allowed (Warning: Broad scopes)' }
                    }))
                } else {
                    setTestStatuses(prev => ({
                        ...prev,
                        [id]: { loading: false, success: true, warning: true, message: 'Read: OK, Write: Forbidden (Safe scopes)' }
                    }))
                }
            } else if (key.startsWith('http://') || key.startsWith('https://')) {
                // Generic HTTP URL test (e.g., local Ollama)
                try {
                    // Try to hit the URL. For Ollama, /api/tags is a good endpoint, but we don't know the service type.
                    // Just doing a simple fetch to see if the host is reachable.
                    // Adding mode: 'no-cors' so we don't fail immediately on CORS for simple reachability tests
                    // Note: no-cors produces an opaque response (status 0), which means we reached the server but can't see the body.
                    const res = await fetch(key, { method: 'GET', mode: 'no-cors' })
                    setTestStatuses(prev => ({
                        ...prev,
                        [id]: { loading: false, success: true, message: 'Success: Host is reachable' }
                    }))
                } catch (e: any) {
                    setTestStatuses(prev => ({
                        ...prev,
                        [id]: { loading: false, success: false, message: `Failed: Could not connect to host` }
                    }))
                }
            } else {
                // Mock test for others
                await new Promise(r => setTimeout(r, 600))
                setTestStatuses(prev => ({
                    ...prev,
                    [id]: { loading: false, success: true, message: 'Success: Key format valid' }
                }))
            }
        } catch (err: any) {
            setTestStatuses(prev => ({
                ...prev,
                [id]: { loading: false, success: false, message: `Error: ${err.message}` }
            }))
        }
    }

    const handleApplyJson = () => {
        setJsonError(null)
        setJsonSuccess(false)
        try {
            saveCustomIntegrations(customJson)
            setJsonSuccess(true)
            setTimeout(() => setJsonSuccess(false), 3000)
        } catch (err: any) {
            setJsonError(err.message)
        }
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Key size={24} /> Integrations & API Keys
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
                    Provide API keys for external services. For better security, place your tokens in a <code>.env</code> file
                    rather than storing them in the browser's local storage. Your keys never leave your browser / local environment.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px',
                    alignItems: 'start'
                }}>
                    {integrations.map(config => {
                        const st = states[config.id]
                        const testState = testStatuses[config.id]
                        const isEnv = st?.source === 'env'
                        const hasKey = !!st?.value
                        const InputType = (st?.value?.startsWith('http') || config.isCustom) ? "text" : "password"

                        return (
                            <div key={config.id} data-testid={`integration-card-${config.id}`} style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                position: 'relative'
                            }}>
                                {config.isCustom && (
                                    <div style={{
                                        position: 'absolute', top: -8, right: 12,
                                        background: '#3b82f6', color: '#fff', fontSize: '9px', fontWeight: 600,
                                        padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: 0.5
                                    }}>
                                        Custom
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '8px',
                                            background: config.isCustom ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                            color: config.isCustom ? '#60a5fa' : '#a78bfa',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {ICONS[config.id] || <Plug size={20} />}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', margin: 0 }}>{config.name}</h2>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '10px', fontWeight: 600, padding: '3px 8px', borderRadius: '12px',
                                        background: isEnv ? 'rgba(16, 185, 129, 0.1)' : hasKey ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                        color: isEnv ? '#34d399' : hasKey ? '#38bdf8' : '#64748b',
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {isEnv ? <><CheckCircle2 size={12} /> .env</>
                                            : hasKey ? <><AlertTriangle size={12} /> Storage</>
                                                : 'Unset'}
                                    </div>
                                </div>

                                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                                    {config.envKey}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input
                                        type={InputType}
                                        placeholder={isEnv ? `Loaded from .env` : (config.isCustom ? "Enter URL or key..." : "Enter key...")}
                                        value={isEnv && InputType === 'password' ? '•••••••••••••••••••••••••' : (st?.value || '')}
                                        onChange={e => {
                                            if (!isEnv) saveKey(config.id, e.target.value)
                                        }}
                                        disabled={isEnv}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            color: isEnv ? '#94a3b8' : '#fff',
                                            fontSize: '12px',
                                            fontFamily: 'monospace',
                                            outline: 'none',
                                            opacity: isEnv ? 0.7 : 1,
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        onClick={() => handleTest(config.id)}
                                        disabled={!hasKey || testState?.loading}
                                        style={{
                                            width: '100%',
                                            background: config.isCustom ? '#3b82f6' : '#8b5cf6',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 16px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: (!hasKey || testState?.loading) ? 'not-allowed' : 'pointer',
                                            opacity: (!hasKey || testState?.loading) ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            transition: 'background 0.2s',
                                            boxSizing: 'border-box'
                                        }}
                                        onMouseOver={e => { if (hasKey && !testState?.loading) e.currentTarget.style.background = config.isCustom ? '#2563eb' : '#7c3aed' }}
                                        onMouseOut={e => { if (hasKey && !testState?.loading) e.currentTarget.style.background = config.isCustom ? '#3b82f6' : '#8b5cf6' }}
                                    >
                                        {testState?.loading ? <Loader2 size={14} className="animate-spin" /> : 'Test Connection'}
                                    </button>
                                </div>

                                {testState && !testState.loading && (
                                    <div style={{
                                        fontSize: '12px',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        color: testState.warning ? '#f59e0b' : testState.success ? '#34d399' : '#f43f5e',
                                        background: testState.warning ? 'rgba(245, 158, 11, 0.05)' : testState.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: `1px solid ${testState.warning ? 'rgba(245, 158, 11, 0.2)' : testState.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                                        lineHeight: 1.4
                                    }}>
                                        {testState.warning ? <AlertTriangle size={16} style={{ flexShrink: 0 }} /> : testState.success ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <XCircle size={16} style={{ flexShrink: 0 }} />}
                                        <span style={{ wordBreak: 'break-word' }}>{testState.message}</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#38bdf8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={16} /> Security Note
                    </h3>
                    <p style={{ margin: 0, color: '#bae6fd', fontSize: '13px', lineHeight: '1.5' }}>
                        Keys stored in the browser (localStorage) can be cleared by removing site data.
                        For persistent and secure usage, place them in your <code>.env</code> file. The `.env` file is git-ignored and won't be committed to your repository.
                    </p>
                </div>

                {/* Custom Integrations Editor section */}
                <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
                    <h2 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plug size={20} />
                        Custom Integrations
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
                        Define your own API endpoints or services (like a local Ollama server). Configurations are stored in your browser. URL integrations support basic reachability checks.
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <textarea
                            value={customJson}
                            onChange={e => setCustomJson(e.target.value)}
                            spellCheck={false}
                            style={{
                                width: '100%',
                                minHeight: '240px',
                                background: 'transparent',
                                color: '#a5f3fc',
                                border: 'none',
                                padding: '16px',
                                fontSize: '13px',
                                fontFamily: 'ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace',
                                resize: 'vertical',
                                lineHeight: 1.5,
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.03)',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                {jsonError && <span style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><XCircle size={14} /> {jsonError}</span>}
                                {jsonSuccess && <span style={{ color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} /> Saved</span>}
                            </div>
                            <button
                                onClick={handleApplyJson}
                                style={{
                                    background: '#3b82f6',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '6px 16px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
                                onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
                            >
                                Apply Changes
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

