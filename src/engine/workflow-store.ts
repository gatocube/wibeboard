/**
 * WorkflowStore — persists builder workflows using Automerge + IndexedDB.
 *
 * Each workflow is an Automerge document containing nodes and edges.
 * Documents are serialized to binary and stored in IndexedDB.
 * A lightweight index (JSON) tracks workflow metadata for the selector.
 *
 * Usage:
 *   const store = new WorkflowStore()
 *   await store.init()
 *   const workflows = await store.list()
 *   const doc = await store.create('My workflow')
 *   await store.save(doc)
 */

import * as Automerge from '@automerge/automerge'
import { generateId, now } from './core'

// ── Types ──────────────────────────────────────────────────────────────────

export interface WorkflowNode {
    id: string
    type: string
    position: { x: number; y: number }
    data: Record<string, unknown>
    width?: number
    height?: number
}

export interface WorkflowEdge {
    id: string
    source: string
    target: string
    animated?: boolean
    style?: Record<string, unknown>
}

export interface WorkflowDoc {
    [key: string]: unknown
    id: string
    name: string
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    createdAt: number
    updatedAt: number
}

export interface WorkflowMeta {
    id: string
    name: string
    updatedAt: number
    nodeCount: number
}

// ── IndexedDB helpers ──────────────────────────────────────────────────────

const DB_NAME = 'wibeboard-workflows'
const DB_VERSION = 1
const STORE_DOCS = 'docs'       // binary Automerge docs
const STORE_INDEX = 'index'     // lightweight metadata

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE_DOCS)) {
                db.createObjectStore(STORE_DOCS, { keyPath: 'id' })
            }
            if (!db.objectStoreNames.contains(STORE_INDEX)) {
                db.createObjectStore(STORE_INDEX, { keyPath: 'id' })
            }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

function idbGet<T>(db: IDBDatabase, store: string, key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly')
        const req = tx.objectStore(store).get(key)
        req.onsuccess = () => resolve(req.result as T | undefined)
        req.onerror = () => reject(req.error)
    })
}

function idbPut(db: IDBDatabase, store: string, value: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite')
        tx.objectStore(store).put(value)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

function idbDelete(db: IDBDatabase, store: string, key: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite')
        tx.objectStore(store).delete(key)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

function idbGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly')
        const req = tx.objectStore(store).getAll()
        req.onsuccess = () => resolve(req.result as T[])
        req.onerror = () => reject(req.error)
    })
}

// ── Store ──────────────────────────────────────────────────────────────────

// ID generation moved to engine/core/utils.ts

export class WorkflowStore {
    private db: IDBDatabase | null = null

    async init(): Promise<void> {
        this.db = await openDB()
    }

    private getDB(): IDBDatabase {
        if (!this.db) throw new Error('WorkflowStore not initialized — call init() first')
        return this.db
    }

    /** List all saved workflows (metadata only) */
    async list(): Promise<WorkflowMeta[]> {
        const metas = await idbGetAll<WorkflowMeta>(this.getDB(), STORE_INDEX)
        return metas.sort((a, b) => b.updatedAt - a.updatedAt)
    }

    /** Create a new empty workflow */
    async create(name: string): Promise<WorkflowDoc> {
        const ts = now()
        const doc: WorkflowDoc = {
            id: generateId('wf'),
            name,
            nodes: [],
            edges: [],
            createdAt: ts,
            updatedAt: ts,
        }
        await this.saveDoc(doc)
        return doc
    }

    /** Load a workflow by ID */
    async load(id: string): Promise<WorkflowDoc | undefined> {
        const record = await idbGet<{ id: string; binary: Uint8Array }>(this.getDB(), STORE_DOCS, id)
        if (!record) return undefined

        const amDoc = Automerge.load<WorkflowDoc>(record.binary)
        return Automerge.toJS(amDoc) as unknown as WorkflowDoc
    }

    /** Save a workflow (full doc with nodes/edges) */
    async save(doc: WorkflowDoc): Promise<void> {
        const updated = { ...doc, updatedAt: now() }
        await this.saveDoc(updated)
    }

    /** Delete a workflow */
    async delete(id: string): Promise<void> {
        const db = this.getDB()
        await idbDelete(db, STORE_DOCS, id)
        await idbDelete(db, STORE_INDEX, id)
    }

    /** Rename a workflow */
    async rename(id: string, name: string): Promise<void> {
        const doc = await this.load(id)
        if (!doc) return
        doc.name = name
        await this.save(doc)
    }

    // ── Internal ──

    private async saveDoc(doc: WorkflowDoc): Promise<void> {
        const db = this.getDB()

        // Create Automerge document and serialize to binary
        const amDoc = Automerge.from<WorkflowDoc>(doc)
        const binary = Automerge.save(amDoc)

        // Save binary
        await idbPut(db, STORE_DOCS, { id: doc.id, binary })

        // Save metadata index
        const meta: WorkflowMeta = {
            id: doc.id,
            name: doc.name,
            updatedAt: doc.updatedAt,
            nodeCount: doc.nodes.length,
        }
        await idbPut(db, STORE_INDEX, meta)
    }
}

// ── Singleton ──────────────────────────────────────────────────────────────

let _instance: WorkflowStore | null = null
let _initPromise: Promise<WorkflowStore> | null = null

export function getWorkflowStore(): Promise<WorkflowStore> {
    if (_instance) return Promise.resolve(_instance)
    if (_initPromise) return _initPromise
    _initPromise = (async () => {
        const store = new WorkflowStore()
        await store.init()
        _instance = store
        return store
    })()
    return _initPromise
}
