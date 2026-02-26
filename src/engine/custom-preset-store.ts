/**
 * CustomPresetStore — persists custom presets using Automerge + IndexedDB.
 *
 * Stores an ordered array of custom presets in an Automerge document.
 * Supports add, remove, reorder operations with change listeners.
 */

import * as Automerge from '@automerge/automerge'
// ── Types ───────────────────────────────────────────────────────────────────────

/** Serialisable preset (no functions, no id — reconstructed on load) */
export interface StoredPreset {
    type: string
    widgetType: string
    subType?: string
    label: string
    description: string
    tags: string[]
    defaultData: Record<string, any>
    ui?: Record<string, any>
}

interface PresetDoc {
    presets: StoredPreset[]
    [key: string]: unknown
}

// ── IndexedDB helpers ───────────────────────────────────────────────────────────

const DB_NAME = 'wibeboard-custom-presets'
const DB_VERSION = 1
const STORE_NAME = 'presets'
const DOC_KEY = 'custom-presets-doc'

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).get(key)
        req.onsuccess = () => resolve(req.result as T | undefined)
        req.onerror = () => reject(req.error)
    })
}

function idbPut(db: IDBDatabase, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put(value)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

// ── Store ───────────────────────────────────────────────────────────────────────

export class CustomPresetStore {
    private doc: Automerge.Doc<PresetDoc>
    private db: IDBDatabase | null = null
    private listeners: (() => void)[] = []
    private ready = false

    constructor() {
        this.doc = Automerge.from<PresetDoc>({ presets: [] })
        this.init()
    }

    private async init() {
        try {
            this.db = await openDB()
            const record = await idbGet<{ id: string; binary: Uint8Array }>(this.db, DOC_KEY)
            if (record?.binary) {
                this.doc = Automerge.load<PresetDoc>(record.binary)
            }
            this.ready = true
            this.notify()
        } catch (e) {
            console.warn('[CustomPresetStore] init failed, using in-memory', e)
            this.ready = true
        }
    }

    /** Get ordered list of stored presets */
    getAll(): StoredPreset[] {
        return Automerge.toJS(this.doc).presets ?? []
    }

    /** Add a preset at the end */
    add(preset: StoredPreset) {
        this.doc = Automerge.change(this.doc, `Add preset: ${preset.label}`, doc => {
            doc.presets.push({ ...preset })
        })
        this.persist()
        this.notify()
    }

    /** Remove a preset by type */
    remove(type: string): boolean {
        const idx = this.getAll().findIndex(p => p.type === type)
        if (idx < 0) return false
        this.doc = Automerge.change(this.doc, `Remove preset: ${type}`, doc => {
            doc.presets.splice(idx, 1)
        })
        this.persist()
        this.notify()
        return true
    }

    /** Reorder: move preset from index `from` to index `to` */
    reorder(from: number, to: number) {
        const presets = this.getAll()
        if (from < 0 || from >= presets.length || to < 0 || to >= presets.length || from === to) return
        this.doc = Automerge.change(this.doc, `Reorder: ${from} → ${to}`, doc => {
            const [item] = doc.presets.splice(from, 1)
            doc.presets.splice(to, 0, item)
        })
        this.persist()
        this.notify()
    }

    /** Subscribe to changes */
    onChange(listener: () => void): () => void {
        this.listeners.push(listener)
        return () => { this.listeners = this.listeners.filter(l => l !== listener) }
    }

    /** Whether the store has finished loading from IndexedDB */
    isReady(): boolean {
        return this.ready
    }

    private notify() {
        for (const l of this.listeners) l()
    }

    private async persist() {
        if (!this.db) return
        try {
            const binary = Automerge.save(this.doc)
            await idbPut(this.db, { id: DOC_KEY, binary })
        } catch (e) {
            console.warn('[CustomPresetStore] persist failed', e)
        }
    }
}

/** Singleton store instance */
export const customPresetStore = new CustomPresetStore()
