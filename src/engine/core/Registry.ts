/**
 * Registry<T> — generic base class for key-based registries.
 *
 * Provides common operations: get, getAll, search, has, keys.
 * Subclasses supply items and define the key extractor.
 *
 * Items that implement RegistryItem get search() for free.
 */

/** Common fields for any registry item */
export interface RegistryItem {
    /** Unique key within the registry */
    id: string
    /** Item type (domain-specific classifier) */
    type: string
    /** Human-readable label */
    label: string
    /** Description of the item */
    description: string
    /** Searchable tags */
    tags: string[]
    /** Semantic version (e.g. '1.0.0') */
    version?: string
    /** Arbitrary metadata */
    metadata?: Record<string, unknown>
    /** Parent ID for tree-like hierarchies (flat storage) */
    parentId?: string
}

export abstract class Registry<T> {
    protected items: Map<string, T>

    constructor(entries: [string, T][] = []) {
        this.items = new Map(entries)
    }

    /** Get item by key */
    get(key: string): T | undefined {
        return this.items.get(key)
    }

    /** Check if key exists */
    has(key: string): boolean {
        return this.items.has(key)
    }

    /** Get all items */
    getAll(): T[] {
        return Array.from(this.items.values())
    }

    /** Get all registered keys */
    keys(): string[] {
        return Array.from(this.items.keys())
    }

    /** Number of registered items */
    get size(): number {
        return this.items.size
    }

    /** Register a new item */
    register(key: string, item: T): void {
        this.items.set(key, item)
    }

    /** Remove an item */
    unregister(key: string): boolean {
        return this.items.delete(key)
    }

    /** Search items — works when T extends RegistryItem */
    search(query: string): T[] {
        const q = query.toLowerCase()
        return this.getAll().filter(item => {
            const r = item as unknown as RegistryItem
            if (typeof r.label !== 'string') return false
            return (
                r.label.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q) ||
                r.tags?.some(t => t.includes(q))
            )
        })
    }
}
