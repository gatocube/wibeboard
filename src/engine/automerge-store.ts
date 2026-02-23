/**
 * Automerge Step Store — manages flow execution state with undo/redo history.
 *
 * Each scenario defines a list of Steps. The store:
 * - Tracks current step index
 * - Applies step mutations to an Automerge document
 * - Provides prev/next/reset/play controls
 * - Exposes full undo/redo via Automerge change history
 */

import * as Automerge from '@automerge/automerge'

// ── Types ──────────────────────────────────────────────────────────────────

export interface NodeState {
    id: string
    status: 'idle' | 'waking' | 'running' | 'done' | 'error'
    logs: string[]
    artifacts: string[]
    progress: number
    knockSide?: 'in' | 'out' | null
}

export interface FlowState {
    [key: string]: unknown
    stepIndex: number
    stepLabel: string
    nodes: { [id: string]: NodeState }
    completed: boolean
}

export interface StepDef {
    label: string
    apply: (state: FlowState) => void
}

// ── Store ──────────────────────────────────────────────────────────────────

export class StepStore {
    private doc: Automerge.Doc<FlowState>
    private history: Automerge.Doc<FlowState>[] = []
    private steps: StepDef[]
    private listeners: Set<() => void> = new Set()
    private playTimer: ReturnType<typeof setInterval> | null = null

    constructor(nodeIds: string[], steps: StepDef[]) {
        this.steps = steps

        // Initialize Automerge document
        const nodes: { [id: string]: NodeState } = {}
        for (const id of nodeIds) {
            nodes[id] = { id, status: 'idle', logs: [], artifacts: [], progress: 0 }
        }

        this.doc = Automerge.from<FlowState>({
            stepIndex: -1,
            stepLabel: 'Click ▶ to start',
            nodes,
            completed: false,
        })
        this.history = [this.doc]
    }

    /** Subscribe to state changes */
    subscribe(fn: () => void): () => void {
        this.listeners.add(fn)
        return () => { this.listeners.delete(fn) }
    }

    private notify() {
        this.listeners.forEach(fn => fn())
    }

    /** Get current state (read-only) */
    getState(): FlowState {
        return this.doc
    }

    /** Get current step index */
    get currentStep(): number {
        return this.doc.stepIndex
    }

    /** Total number of steps */
    get totalSteps(): number {
        return this.steps.length
    }

    /** Whether all steps are done */
    get isCompleted(): boolean {
        return this.doc.completed
    }

    /** Whether auto-play is active */
    get isPlaying(): boolean {
        return this.playTimer !== null
    }

    /** Go to next step */
    next(): boolean {
        const nextIdx = this.doc.stepIndex + 1
        if (nextIdx >= this.steps.length) return false

        const step = this.steps[nextIdx]
        this.doc = Automerge.change(this.doc, `Step ${nextIdx}: ${step.label}`, doc => {
            doc.stepIndex = nextIdx
            doc.stepLabel = step.label
            step.apply(doc)
            if (nextIdx === this.steps.length - 1) {
                doc.completed = true
            }
        })
        this.history.push(this.doc)
        this.notify()
        return true
    }

    /** Go to previous step (undo) */
    prev(): boolean {
        if (this.history.length <= 1) return false
        this.history.pop()
        this.doc = Automerge.clone(this.history[this.history.length - 1])
        this.notify()
        return true
    }

    /** Reset to initial state */
    reset() {
        this.stopPlay()
        this.doc = Automerge.clone(this.history[0])
        this.history = [this.doc]
        this.notify()
    }

    /** Auto-play steps with delay */
    startPlay(delayMs = 600) {
        if (this.playTimer) return
        this.playTimer = setInterval(() => {
            if (!this.next()) {
                this.stopPlay()
            }
        }, delayMs)
        // Execute first step immediately
        this.next()
    }

    /** Stop auto-play */
    stopPlay() {
        if (this.playTimer) {
            clearInterval(this.playTimer)
            this.playTimer = null
            this.notify()
        }
    }
}
