import { useState, useEffect, useCallback } from 'react'

export type IntegrationId = string

export interface IntegrationConfig {
    id: IntegrationId
    name: string
    envKey: string
    storageKey: string
    isCustom?: boolean
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
    const [states, setStates] = useState<Record<IntegrationId, IntegrationState>>({})
    const [customConfigs, setCustomConfigs] = useState<IntegrationConfig[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    const allIntegrations = [...INTEGRATIONS, ...customConfigs]

    const loadStates = useCallback((configs: IntegrationConfig[]) => {
        const newStates: Record<IntegrationId, IntegrationState> = {}

        for (const config of configs) {
            // Check process.env equivalent in Vite
            const envValue = (import.meta as any).env[config.envKey]
            if (envValue) {
                newStates[config.id] = { id: config.id, value: envValue, source: 'env' }
            } else {
                const storedValue = localStorage.getItem(config.storageKey)
                if (storedValue) {
                    newStates[config.id] = { id: config.id, value: storedValue, source: 'localStorage' }
                } else {
                    newStates[config.id] = { id: config.id, value: '', source: 'none' }
                }
            }
        }
        setStates(newStates)
    }, [])

    useEffect(() => {
        // Load custom integrations from localStorage
        let loadedCustomConfigs: IntegrationConfig[] = []
        try {
            const storedCustom = localStorage.getItem('custom_integrations')
            if (storedCustom) {
                loadedCustomConfigs = JSON.parse(storedCustom).map((c: any) => ({ ...c, isCustom: true }))
            }
        } catch (err) {
            console.error('Failed to parse custom_integrations from localStorage', err)
        }
        setCustomConfigs(loadedCustomConfigs)
        loadStates([...INTEGRATIONS, ...loadedCustomConfigs])
        setIsLoaded(true)
    }, [loadStates])

    const saveKey = (id: IntegrationId, value: string) => {
        const config = allIntegrations.find(i => i.id === id)
        if (!config) return

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

    const saveCustomIntegrations = (jsonString: string): boolean => {
        try {
            const parsed = JSON.parse(jsonString)
            if (!Array.isArray(parsed)) throw new Error('Must be an array of objects')
            const valid = parsed.every(c => c.id && c.name && c.storageKey)
            if (!valid) throw new Error('Each object must have at least id, name, and storageKey')

            const newConfigs = parsed.map((c: any) => ({
                id: c.id,
                name: c.name,
                envKey: c.envKey || `VITE_${c.id.toUpperCase()}_TOKEN`,
                storageKey: c.storageKey,
                isCustom: true
            }))

            localStorage.setItem('custom_integrations', JSON.stringify(newConfigs))
            setCustomConfigs(newConfigs)
            loadStates([...INTEGRATIONS, ...newConfigs])
            return true
        } catch (err) {
            console.error('Failed to save custom integrations:', err)
            throw err
        }
    }

    const getKey = (id: IntegrationId) => states[id]?.value || ''

    return {
        integrations: allIntegrations,
        states,
        isLoaded,
        saveKey,
        getKey,
        saveCustomIntegrations,
        customIntegrationsRaw: JSON.stringify(customConfigs, null, 2)
    }
}
