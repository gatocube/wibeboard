/**
 * Core utility functions for the engine.
 *
 * Centralises common helpers to avoid duplication across the codebase.
 */

// ── ID generation ────────────────────────────────────────────────────────────────

let _counter = 0

/**
 * Generate a unique ID with an optional prefix.
 *
 * Format: `{prefix}-{timestamp}-{random}`
 *
 * @example generateId('node')  // "node-1709012345678-a3f1"
 * @example generateId('evt')   // "evt-1709012345678-k8z2"
 * @example generateId()        // "id-1709012345678-b7x9"
 */
export function generateId(prefix = 'id'): string {
    const ts = Date.now()
    const rand = Math.random().toString(36).slice(2, 6)
    return `${prefix}-${ts}-${rand}-${++_counter}`
}

/**
 * Generate a short unique ID (no timestamp, just random).
 *
 * @example shortId()  // "x7k2m9p1"
 */
export function shortId(): string {
    return Math.random().toString(36).slice(2, 10)
}

// ── Deep clone ───────────────────────────────────────────────────────────────────

/**
 * Deep-clone a value using structuredClone when available,
 * falling back to JSON round-trip.
 */
export function deepClone<T>(value: T): T {
    if (typeof structuredClone === 'function') return structuredClone(value)
    return JSON.parse(JSON.stringify(value))
}

// ── Timestamp helpers ────────────────────────────────────────────────────────────

/** Current timestamp in milliseconds */
export function now(): number {
    return Date.now()
}

// ── String helpers ───────────────────────────────────────────────────────────────

/** Truncate a string to `max` characters */
export function truncate(str: string, max: number): string {
    return str.length > max ? str.slice(0, max) : str
}

/** Capitalize the first letter of a string */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
