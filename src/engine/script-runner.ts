/**
 * Script Runner — execute JS code in the browser (no sandbox).
 *
 * Uses `new Function` to compile and run user code with access to:
 *   - `console` — a fake console that captures log/error output
 *   - `messenger` — the node's AgentMessenger instance
 *   - `nodeName` — label of the current node
 *
 * The script can call `messenger.send(...)` to send messages.
 *
 * @example
 *   const result = runScriptInBrowser(code, messenger, 'My Script')
 *   // result.logs => ['> Running...', 'Hello!', '> Done ✓']
 *   // result.status => 'done' | 'error'
 */

import type { AgentMessenger } from './AgentMessenger'

export interface ScriptResult {
    logs: string[]
    status: 'done' | 'error'
}

/**
 * Execute a JS script in the browser with access to AgentMessenger.
 *
 * The script runs synchronously via `new Function`. Any `console.log()`
 * calls are captured into the result logs. The `messenger` instance is
 * passed directly so scripts can send messages to other nodes.
 */
export function runScriptInBrowser(
    code: string,
    messenger: AgentMessenger,
    nodeName: string,
): ScriptResult {
    const logs: string[] = ['> Running...']

    const fakeConsole = {
        log: (...args: unknown[]) => {
            logs.push(args.map(a =>
                typeof a === 'object' ? JSON.stringify(a) : String(a),
            ).join(' '))
        },
        error: (...args: unknown[]) => {
            logs.push('ERROR: ' + args.map(String).join(' '))
        },
        warn: (...args: unknown[]) => {
            logs.push('WARN: ' + args.map(String).join(' '))
        },
    }

    try {
        // Strip `export` keywords so plain module-style code works
        const cleanCode = code.replace(/^export\s+/gm, '')

        // Build the function with messenger, console, and nodeName in scope
        const fn = new Function(
            'console',
            'messenger',
            'nodeName',
            `${cleanCode}\nif (typeof activate === 'function') activate({ messenger, nodeName });`,
        )

        fn(fakeConsole, messenger, nodeName)
        logs.push('> Done ✓')
        return { logs, status: 'done' }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logs.push(`ERROR: ${msg}`)
        return { logs, status: 'error' }
    }
}
