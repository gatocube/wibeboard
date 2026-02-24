import { useState, useEffect } from 'react'

export type IntegrationId = 'github' | 'cursor' | 'openhands' | 'openai' | 'claudecode'

export interface IntegrationConfig {
    id: IntegrationId
    name: string
    envKey: string
    storageKey: string
}

export const INTEGRATIONS: IntegrationConfig[] = [
    { id: 'github', name: 'GitHub', envKey: 'VITE_GITHUB_TOKEN', storageKey: 'integration_github_token' },
    { id: 'cursor', name: 'Cursor', envKey: 'VITE_CURSOR_TOKEN', storageKey: 'integration_cursor_token' },
    { id: 'openhands', name: 'OpenHands', envKey: 'VITE_OPENHANDS_TOKEN', storageKey: 'integration_openhands_token' },
    { id: 'openai', name: 'OpenAI', envKey: 'VITE_OPENAI_API_KEY', storageKey: 'integration_openai_key' },
    { id: 'claudecode', name: 'ClaudeCode', envKey: 'VITE_CLAUDE_TOKEN', storageKey: 'integration_claudecode_token' },
]

export interface IntegrationState {
    id: IntegrationId
    value: string
    source: 'env' | 'localStorage' | 'none'
}

export function useIntegrations() {
    const [states, setStates] = useState<Record<IntegrationId, IntegrationState>>({} as any)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const initialStates: Record<IntegrationId, IntegrationState> = {} as any

        for (const config of INTEGRATIONS) {
            // Check process.env equivalent in Vite
            const envValue = (import.meta as any).env[config.envKey]
            if (envValue) {
                initialStates[config.id] = { id: config.id, value: envValue, source: 'env' }
            } else {
                const storedValue = localStorage.getItem(config.storageKey)
                if (storedValue) {
                    initialStates[config.id] = { id: config.id, value: storedValue, source: 'localStorage' }
                } else {
                    initialStates[config.id] = { id: config.id, value: '', source: 'none' }
                }
            }
        }

        setStates(initialStates)
        setIsLoaded(true)
    }, [])

    const saveKey = (id: IntegrationId, value: string) => {
        const config = INTEGRATIONS.find(i => i.id === id)
        if (!config) return

        // We cannot save to env at runtime, so we only save to localStorage
        // If there's an env value, it overrides localStorage anyway, but we allow saving.
        if (value) {
            localStorage.setItem(config.storageKey, value)
            setStates(prev => ({
                ...prev,
                [id]: { id, value, source: 'localStorage' }
            }))
        } else {
            localStorage.removeItem(config.storageKey)
            setStates(prev => ({
                ...prev,
                [id]: { id, value: '', source: 'none' }
            }))
        }
    }

    const getKey = (id: IntegrationId) => states[id]?.value || ''

    return {
        integrations: INTEGRATIONS,
        states,
        isLoaded,
        saveKey,
        getKey
    }
}
