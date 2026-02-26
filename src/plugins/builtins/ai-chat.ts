import React from 'react'
import type { PluginDefinition } from '../types'

/**
 * ── AI Chat Plugin ────────────────────────────────────────────────────────────
 *
 * version: 1.0.0
 * description: Chat with a local AI model via Ollama.
 *              Renders a chat interface in the side panel.
 * author: wibeboard
 * permissions:
 *   - secrets:read
 */

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

// ── Ollama streaming client ────────────────────────────────────────────────────

async function* streamChat(
    baseUrl: string,
    model: string,
    messages: ChatMessage[],
    signal?: AbortSignal,
): AsyncGenerator<string> {
    const url = `${baseUrl.replace(/\/+$/, '')}/api/chat`
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true }),
        signal,
    })
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`)
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()!
        for (const line of lines) {
            if (!line.trim()) continue
            try {
                const json = JSON.parse(line)
                if (json.message?.content) yield json.message.content
            } catch { /* skip malformed */ }
        }
    }
}

// ── Chat Component (side panel) ────────────────────────────────────────────────

function ChatPanel({ settings }: { settings: Record<string, any> }) {
    const [messages, setMessages] = React.useState<ChatMessage[]>([])
    const [input, setInput] = React.useState('')
    const [streaming, setStreaming] = React.useState(false)
    const abortRef = React.useRef<AbortController | null>(null)
    const scrollRef = React.useRef<HTMLDivElement>(null)

    const baseUrl = settings.ollamaUrl || 'http://localhost:11434'
    const model = settings.model || 'qwen2.5-coder:7b'

    React.useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        const text = input.trim()
        if (!text || streaming) return
        const userMsg: ChatMessage = { role: 'user', content: text }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setStreaming(true)

        const ac = new AbortController()
        abortRef.current = ac

        try {
            let assistantContent = ''
            setMessages([...newMessages, { role: 'assistant', content: '' }])

            for await (const chunk of streamChat(baseUrl, model, newMessages, ac.signal)) {
                assistantContent += chunk
                setMessages([...newMessages, { role: 'assistant', content: assistantContent }])
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setMessages(prev => [...prev.slice(0, -1), {
                    role: 'assistant', content: `⚠️ Error: ${err.message}`,
                }])
            }
        } finally {
            setStreaming(false)
            abortRef.current = null
        }
    }

    const handleStop = () => {
        abortRef.current?.abort()
    }

    const handleClear = () => {
        abortRef.current?.abort()
        setMessages([])
        setStreaming(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return React.createElement('div', {
        'data-testid': 'ai-chat-panel',
        style: {
            display: 'flex', flexDirection: 'column', height: '100%',
            gap: 0, fontFamily: 'Inter, sans-serif',
        },
    },
        // Header
        React.createElement('div', {
            style: {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 8,
            },
        },
            React.createElement('span', {
                style: { fontSize: 12, fontWeight: 600, color: '#c084fc' },
            }, `🤖 ${model}`),
            React.createElement('button', {
                'data-testid': 'ai-chat-clear',
                onClick: handleClear,
                style: {
                    background: 'none', border: 'none', color: '#64748b',
                    fontSize: 10, cursor: 'pointer', padding: '2px 6px',
                },
            }, 'Clear'),
        ),

        // Messages
        React.createElement('div', {
            ref: scrollRef,
            'data-testid': 'ai-chat-messages',
            style: {
                flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
                gap: 8, paddingRight: 4,
            },
        },
            messages.length === 0
                ? React.createElement('div', {
                    style: { color: '#475569', fontSize: 11, textAlign: 'center', padding: 20 },
                }, 'Send a message to start chatting.')
                : messages.map((m, i) => React.createElement('div', {
                    key: i,
                    'data-testid': `ai-chat-msg-${m.role}`,
                    style: {
                        padding: '8px 10px', borderRadius: 8,
                        fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        background: m.role === 'user'
                            ? 'rgba(139,92,246,0.1)'
                            : 'rgba(255,255,255,0.04)',
                        color: m.role === 'user' ? '#c084fc' : '#e2e8f0',
                        border: `1px solid ${m.role === 'user'
                            ? 'rgba(139,92,246,0.15)'
                            : 'rgba(255,255,255,0.06)'}`,
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '90%',
                    },
                }, m.content || (streaming ? '...' : ''))),
        ),

        // Input
        React.createElement('div', {
            style: {
                display: 'flex', gap: 6, marginTop: 8,
                borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8,
            },
        },
            React.createElement('textarea', {
                'data-testid': 'ai-chat-input',
                value: input,
                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value),
                onKeyDown: handleKeyDown,
                placeholder: 'Type a message...',
                rows: 2,
                style: {
                    flex: 1, background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
                    padding: '6px 10px', color: '#fff', fontSize: 12,
                    fontFamily: 'Inter, sans-serif', outline: 'none', resize: 'none',
                },
            }),
            React.createElement('button', {
                'data-testid': streaming ? 'ai-chat-stop' : 'ai-chat-send',
                onClick: streaming ? handleStop : handleSend,
                disabled: !streaming && !input.trim(),
                style: {
                    alignSelf: 'flex-end', padding: '6px 12px', borderRadius: 6,
                    border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: streaming ? '#ef4444' : '#8b5cf6',
                    color: '#fff',
                    opacity: (!streaming && !input.trim()) ? 0.5 : 1,
                },
            }, streaming ? '■ Stop' : 'Send'),
        ),
    )
}

// ── Plugin Definition ──────────────────────────────────────────────────────────

export const aiChatPlugin: PluginDefinition = {
    meta: {
        id: 'ai-chat',
        name: 'AI Chat',
        version: '1.0.0',
        description: 'Chat with a local AI model via Ollama. Renders in the side panel.',
        author: 'wibeboard',
        permissions: ['secrets:read'],
        source: `---
id: ai-chat
name: AI Chat
version: 1.0.0
description: Chat with a local AI model via Ollama
author: wibeboard
permissions:
  - secrets:read
---

# AI Chat Plugin

Provides a streaming chat interface connected to a local Ollama instance.

## Settings

\`\`\`tsx
<input label="Ollama URL" bind="ollamaUrl" default="http://localhost:11434" />
<input label="Model" bind="model" default="qwen2.5-coder:7b" />
\`\`\`

## Side Panel

\`\`\`tsx
<ChatPanel baseUrl={settings.ollamaUrl} model={settings.model} />
\`\`\`
`,
    },

    defaultSettings: {
        ollamaUrl: 'http://localhost:11434',
        model: 'qwen2.5-coder:7b',
    },

    // ── Side Panel ──────────────────────────────────────────────────────────────
    renderSidePanel(settings) {
        return React.createElement(ChatPanel, { settings })
    },

    // ── Bottom Bar ──────────────────────────────────────────────────────────────
    renderBottomBar(settings) {
        const model = settings.model || 'qwen2.5-coder:7b'
        return React.createElement('span', {
            'data-testid': 'ai-chat-status',
            style: { display: 'flex', alignItems: 'center', gap: 4 },
        },
            React.createElement('span', null, '🤖'),
            React.createElement('span', null, `AI: ${model}`),
        )
    },

    // ── Settings ────────────────────────────────────────────────────────────────
    renderSettings(settings, onUpdate) {
        const inputStyle: React.CSSProperties = {
            width: '100%',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '8px 12px',
            color: '#fff',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            outline: 'none',
            boxSizing: 'border-box' as const,
        }

        return React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column', gap: 16 },
        },
            // Ollama URL
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                React.createElement('label', {
                    style: { fontSize: 12, fontWeight: 600, color: '#94a3b8' },
                }, 'Ollama URL'),
                React.createElement('input', {
                    'data-testid': 'ai-chat-url-input',
                    type: 'text',
                    value: settings.ollamaUrl ?? 'http://localhost:11434',
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        onUpdate({ ...settings, ollamaUrl: e.target.value }),
                    style: inputStyle,
                }),
                React.createElement('div', {
                    style: { fontSize: 10, color: '#64748b' },
                }, 'The base URL of your Ollama server'),
            ),
            // Model
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                React.createElement('label', {
                    style: { fontSize: 12, fontWeight: 600, color: '#94a3b8' },
                }, 'Model'),
                React.createElement('input', {
                    'data-testid': 'ai-chat-model-input',
                    type: 'text',
                    value: settings.model ?? 'qwen2.5-coder:7b',
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        onUpdate({ ...settings, model: e.target.value }),
                    style: inputStyle,
                }),
                React.createElement('div', {
                    style: { fontSize: 10, color: '#64748b' },
                }, 'The Ollama model to use (e.g. qwen2.5-coder:7b, llama3, mistral)'),
            ),
        )
    },
}
