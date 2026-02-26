/**
 * resolveState — compatibility helper for widget node data.
 *
 * The canonical data shape nests runtime fields under `data.state`:
 *   { label: 'Planner', state: { status: 'running', execTime: '1.3s', ... } }
 *
 * This helper resolves the `state` sub-object from either:
 *  - Nested format:  data.state.status  (preferred)
 *  - Legacy flat:    data.status         (backwards compat)
 *
 * Usage in widget components:
 *   const state = resolveState(data)
 *   // then use state.status, state.execTime, etc.
 */

export interface NodeState {
    status?: string
    currentTask?: string
    thought?: string
    progress?: number
    execTime?: string
    callsCount?: number
}

const STATE_KEYS: (keyof NodeState)[] = [
    'status', 'currentTask', 'thought', 'progress', 'execTime', 'callsCount',
]

export function resolveState(data: Record<string, any>): NodeState {
    if (data.state && typeof data.state === 'object') return data.state
    // Legacy flat format — pick state fields from top-level
    const state: Record<string, any> = {}
    for (const key of STATE_KEYS) {
        if (key in data) state[key] = data[key]
    }
    return state
}
