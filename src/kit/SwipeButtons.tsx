/**
 * SwipeButtons — radial action menu optimised for touchscreen devices.
 *
 * This component provides a convenient method to use menus on touchscreen
 * devices like iPad. It is ideal for frequently used actions, because it
 * trains the user to rely on the same gestures/movements for the same
 * actions — building muscle memory over time.
 *
 * Activation modes:
 *   click  — menu appears on tap / click (default)
 *   hold   — menu appears after a long-press (~500 ms) with a progress ring
 *   swipe  — menu appears instantly on hover / pointer-enter
 *
 * Layout (default wibeboard configuration):
 *   Top:    Configure (orange) → fan: Rename | Delete | Duplicate
 *   Right:  After (+) purple  → fan: Script | AI → roles | User
 *   Bottom: Rename
 *   Left:   Before (+) purple → fan: Script | AI → roles | User
 *
 * Designed to be reusable across projects.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Settings, Cpu, Code, UserCircle, Trash2, FileCode, Terminal, FileType, Brain, Wrench, Search, Paperclip, Clock, StickyNote, Briefcase, ClipboardCheck, Workflow } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────────

interface SubButton {
    key: string
    label: string
    icon: typeof Plus
    color: string
}

// Top-level sub-buttons for Add (Before / After)
const ADD_NODE_TYPES: SubButton[] = [
    { key: 'subflow', label: 'SubFlow', icon: Workflow, color: '#6366f1' },
    { key: 'job', label: 'Job', icon: Briefcase, color: '#8b5cf6' },
    { key: 'recent', label: 'Recent', icon: Clock, color: '#64748b' },
]

// Job sub-types (children of Job)
const JOB_TYPES: SubButton[] = [
    { key: 'user', label: 'User', icon: UserCircle, color: '#f59e0b' },
    { key: 'script', label: 'Script', icon: Code, color: '#89e051' },
    { key: 'ai', label: 'AI', icon: Cpu, color: '#8b5cf6' },
]

const AI_ROLES: SubButton[] = [
    { key: 'planner', label: 'Planner', icon: Brain, color: '#a78bfa' },
    { key: 'worker', label: 'Worker', icon: Wrench, color: '#8b5cf6' },
    { key: 'reviewer', label: 'Reviewer', icon: Search, color: '#c084fc' },
]

const CONFIG_ACTIONS: SubButton[] = [
    { key: 'attach', label: 'Attach', icon: Paperclip, color: '#06b6d4' },
    { key: 'settings', label: 'Settings', icon: Settings, color: '#f59e0b' },
    { key: 'delete', label: 'Delete', icon: Trash2, color: '#ef4444' },
]

const ATTACH_TYPES: SubButton[] = [
    { key: 'expectation', label: 'Expect', icon: ClipboardCheck, color: '#22d3ee' },
    { key: 'note', label: 'Note', icon: StickyNote, color: '#fbbf24' },
]

const SCRIPT_TYPES: SubButton[] = [
    { key: 'js', label: 'JS', icon: FileCode, color: '#f7df1e' },
    { key: 'sh', label: 'SH', icon: Terminal, color: '#4ade80' },
    { key: 'py', label: 'PY', icon: FileType, color: '#3b82f6' },
]

// Virtual tile grid — all button positions snap to multiples of TILE
const TILE = 56

// ── Props ───────────────────────────────────────────────────────────────────────

export type SwipeButtonsActivation = 'click' | 'hold' | 'swipe'
export type SwipeButtonsDirection = 'top' | 'right' | 'bottom' | 'left' | 'bottom-right'

export interface SwipeButtonsProps {
    nodeId: string
    currentLabel: string
    /** Activation mode: click (default), hold (long-press), swipe (hover) */
    activationMode?: SwipeButtonsActivation
    /** Which directions to show buttons (default: all 4 cardinal) */
    directions?: SwipeButtonsDirection[]
    /** When true, buttons are pushed out so they never overlap the node */
    noOverlap?: boolean
    onAddBefore: (nodeId: string, widgetType: string) => void
    onAddAfter: (nodeId: string, widgetType: string) => void
    onConfigure: (nodeId: string, action: string) => void
    onRename: (nodeId: string, newName: string) => void
    onDismiss: () => void
}

// ── Shared button style ─────────────────────────────────────────────────────────

function btnStyle(color: string, size = 48): React.CSSProperties {
    return {
        width: size, height: size,
        borderRadius: size <= 40 ? 12 : 14,
        border: `1.5px solid ${color}44`,
        background: 'rgba(15,15,26,0.92)',
        backdropFilter: 'blur(12px)',
        color,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2,
        fontFamily: 'Inter',
        padding: 0,
        boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${color}11`,
        transition: 'border-color 0.15s, box-shadow 0.15s',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
    }
}

// CSS keyframe for hold progress ring (injected once)
let holdKeyframeInjected = false
function ensureHoldKeyframe() {
    if (holdKeyframeInjected) return
    holdKeyframeInjected = true
    const style = document.createElement('style')
    style.textContent = `@keyframes swipe-btn-hold-fill { from { stroke-dashoffset: var(--circ); } to { stroke-dashoffset: 0; } }`
    document.head.appendChild(style)
}


// ── Component ───────────────────────────────────────────────────────────────────

/**
 * Touch-drag tracking for swipe mode.
 * On iPad, pointerEnter doesn't fire during a touch drag. Instead, we
 * track touchmove → elementFromPoint to detect which button the finger
 * is hovering, then call onSwipeHit(testId) to expand sub-menus.
 *
 * Also handles pointermove for CDP-based testing (Chromium converts
 * touch to pointer events).
 *
 * Note: We call onSwipeHit instead of dispatching synthetic PointerEvent
 * because React's event delegation doesn't catch programmatically
 * dispatched native DOM events.
 */
function useTouchSwipe(
    activationMode: SwipeButtonsActivation,
    onSwipeHit: (testId: string | null) => void,
) {
    const lastHitRef = useRef<string | null>(null)
    const activePointerRef = useRef<number | null>(null)
    const lastHighlightRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        if (activationMode !== 'swipe') return

        // ── Shared hit-test logic ──
        function hitTest(x: number, y: number) {
            const el = document.elementFromPoint(x, y) as HTMLElement | null
            if (!el) return
            const btn = el.closest('[data-testid]') as HTMLElement | null
            const testId = btn?.getAttribute('data-testid') || null

            if (testId !== lastHitRef.current) {
                // Remove highlight from previous button
                if (lastHighlightRef.current) {
                    const prev = lastHighlightRef.current
                    prev.style.borderColor = ''
                    prev.style.boxShadow = ''
                    lastHighlightRef.current = null
                }
                lastHitRef.current = testId
                // Highlight new button and call onSwipeHit
                if (btn && testId) {
                    btn.style.borderColor = 'rgba(255,255,255,0.3)'
                    btn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5), 0 0 12px rgba(255,255,255,0.1)'
                    lastHighlightRef.current = btn
                }
                onSwipeHit(testId)
            }
        }

        function hitClick(x: number, y: number) {
            const el = document.elementFromPoint(x, y) as HTMLElement | null
            const btn = el?.closest('[data-testid]') as HTMLElement | null
            if (btn) btn.click()
            lastHitRef.current = null
            if (lastHighlightRef.current) {
                lastHighlightRef.current.style.borderColor = ''
                lastHighlightRef.current.style.boxShadow = ''
                lastHighlightRef.current = null
            }
        }

        // ── Touch events (real iPad) ──
        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault()
        }

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault()
            const touch = e.touches[0]
            if (touch) hitTest(touch.clientX, touch.clientY)
        }

        const handleTouchEnd = (e: TouchEvent) => {
            const touch = e.changedTouches[0]
            if (touch) hitClick(touch.clientX, touch.clientY)
        }

        // ── Pointer events (CDP touch → pointer conversion) ──
        const handlePointerDown = (e: PointerEvent) => {
            if (e.pointerType === 'touch') {
                activePointerRef.current = e.pointerId
                e.preventDefault()
            }
        }

        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerType === 'touch' && activePointerRef.current === e.pointerId) {
                e.preventDefault()
                hitTest(e.clientX, e.clientY)
            }
        }

        const handlePointerUp = (e: PointerEvent) => {
            if (e.pointerType === 'touch' && activePointerRef.current === e.pointerId) {
                hitClick(e.clientX, e.clientY)
                activePointerRef.current = null
            }
        }

        document.addEventListener('touchstart', handleTouchStart, { passive: false })
        document.addEventListener('touchmove', handleTouchMove, { passive: false })
        document.addEventListener('touchend', handleTouchEnd, { passive: false })
        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)

        return () => {
            document.removeEventListener('touchstart', handleTouchStart)
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('touchend', handleTouchEnd)
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }
    }, [activationMode, onSwipeHit])
}

export function SwipeButtons(props: SwipeButtonsProps) {
    const {
        nodeId, currentLabel, activationMode = 'click',
        directions, noOverlap = false,
        onAddBefore, onAddAfter, onConfigure, onRename,
    } = props
    const dirs = directions ?? ['top', 'right', 'bottom', 'left']
    const [expanded, setExpanded] = useState<null | 'before' | 'after' | 'config'>(null)
    const [jobExpanded, setJobExpanded] = useState<null | 'after' | 'before'>(null)
    const [scriptExpanded, setScriptExpanded] = useState<null | 'after' | 'before'>(null)
    const [aiExpanded, setAiExpanded] = useState<null | 'after' | 'before'>(null)
    const [attachExpanded, setAttachExpanded] = useState(false)
    const [renaming, setRenaming] = useState(false)
    const [renameValue, setRenameValue] = useState(currentLabel)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [nodeRect, setNodeRect] = useState<DOMRect | null>(null)

    const resetSubs = useCallback(() => {
        setJobExpanded(null); setScriptExpanded(null); setAiExpanded(null); setAttachExpanded(false)
    }, [])

    // Touch-drag tracking for swipe mode
    // Handle swipe hit — map testId to expand actions
    const handleSwipeHit = useCallback((testId: string | null) => {
        if (!testId) return
        // First-level buttons
        if (testId === 'swipe-btn-add-after') {
            setExpanded('after'); resetSubs()
        } else if (testId === 'swipe-btn-add-before') {
            setExpanded('before'); resetSubs()
        } else if (testId === 'swipe-btn-configure') {
            setExpanded('config')
        }
        // After sub-buttons
        else if (testId === 'ext-after-job') {
            setJobExpanded('after'); setScriptExpanded(null); setAiExpanded(null)
        } else if (testId.startsWith('ext-after-script-')) {
            setScriptExpanded('after')
        } else if (testId.startsWith('ext-after-ai-')) {
            setAiExpanded('after')
        }
        // Before sub-buttons
        else if (testId === 'ext-before-job') {
            setJobExpanded('before'); setScriptExpanded(null); setAiExpanded(null)
        } else if (testId.startsWith('ext-before-script-')) {
            setScriptExpanded('before')
        } else if (testId.startsWith('ext-before-ai-')) {
            setAiExpanded('before')
        }
        // Config sub-buttons
        else if (testId === 'ext-cfg-attach') {
            setAttachExpanded(true)
        }
    }, [resetSubs])

    useTouchSwipe(activationMode, handleSwipeHit)

    // Track node screen position
    useEffect(() => {
        const update = () => {
            const el = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement | null
            if (el) setNodeRect(el.getBoundingClientRect())
        }
        update()
        const interval = setInterval(update, 50)
        return () => clearInterval(interval)
    }, [nodeId])

    // Focus rename input
    useEffect(() => {
        if (renaming) {
            setRenameValue(currentLabel)
            setTimeout(() => inputRef.current?.select(), 50)
        }
    }, [renaming, currentLabel])

    const handleRenameConfirm = useCallback(() => {
        const trimmed = renameValue.trim()
        if (trimmed && trimmed !== currentLabel) onRename(nodeId, trimmed)
        setRenaming(false)
    }, [renameValue, currentLabel, nodeId, onRename])

    const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { e.preventDefault(); handleRenameConfirm() }
        else if (e.key === 'Escape') { e.preventDefault(); setRenaming(false) }
    }, [handleRenameConfirm])

    // Button positions
    const BTN_SIZE = 48
    const positions = useMemo(() => {
        if (!nodeRect) return null
        const cx = nodeRect.left + nodeRect.width / 2
        const cy = nodeRect.top + nodeRect.height / 2
        // noOverlap: push buttons far enough that they don't cover the node
        const gapX = noOverlap
            ? nodeRect.width / 2 + BTN_SIZE / 2 + 4
            : nodeRect.width / 2 + 16
        const gapY = noOverlap
            ? nodeRect.height / 2 + BTN_SIZE / 2 + 4
            : nodeRect.height / 2 + 16

        return {
            top: { x: cx, y: cy - gapY },
            right: { x: cx + gapX, y: cy },
            bottom: { x: cx, y: cy + gapY },
            left: { x: cx - gapX, y: cy },
            'bottom-right': { x: cx + gapX * 0.85, y: cy + gapY * 0.85 },
        }
    }, [nodeRect, noOverlap])

    if (!nodeRect || !positions) return null

    const show = (d: SwipeButtonsDirection) => dirs.includes(d)

    const stopEvents = {
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    }

    return (
        <div ref={containerRef} data-testid="swipe-buttons-menu"
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                zIndex: 1000, pointerEvents: 'none',
                touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
            }}>

            <AnimatePresence>
                {/* ── Config (top) — orange ── */}
                {show('top') && <MotionButton
                    key="config"
                    testId="swipe-btn-configure"
                    pos={positions.top}
                    icon={Settings}
                    label="Config"
                    color="#f59e0b"
                    delay={0}
                    active={expanded === 'config'}
                    dimmed={expanded !== null && expanded !== 'config'}
                    activationMode={activationMode}
                    onClick={() => setExpanded(prev => prev === 'config' ? null : 'config')}
                    onHover={() => setExpanded('config')}
                />}

                {/* Config sub-buttons: fan above */}
                {show('top') && expanded === 'config' && CONFIG_ACTIONS.map((sub, i) => (
                    <MotionButton
                        key={`cfg-${sub.key}`}
                        testId={`ext-cfg-${sub.key}`}
                        pos={{ x: positions.top.x + (i - 1) * TILE, y: positions.top.y - TILE }}
                        icon={sub.icon}
                        label={sub.label}
                        color={sub.color}
                        delay={i * 0.03}
                        active={sub.key === 'attach' && attachExpanded}
                        onClick={() => {
                            if (sub.key === 'attach') {
                                setAttachExpanded(prev => !prev)
                            } else {
                                onConfigure(nodeId, sub.key)
                                setExpanded(null); resetSubs()
                            }
                        }}
                        onHover={
                            sub.key === 'attach' ? () => setAttachExpanded(true)
                                : () => setAttachExpanded(false)
                        }
                    />
                ))}

                {/* Config → Attach sub-types: fan above the Attach button */}
                {show('top') && expanded === 'config' && attachExpanded && (() => {
                    const attachBtnX = positions.top.x + (0 - 1) * TILE  // Attach is at index 0
                    const attachBtnY = positions.top.y - TILE
                    return ATTACH_TYPES.map((at, i) => (
                        <MotionButton
                            key={`cfg-attach-${at.key}`}
                            testId={`ext-cfg-attach-${at.key}`}
                            pos={{ x: attachBtnX + (i === 0 ? -TILE : TILE), y: attachBtnY - TILE }}
                            icon={at.icon}
                            label={at.label}
                            color={at.color}
                            delay={i * 0.03}
                            onClick={() => { onConfigure(nodeId, `attach:${at.key}`); setExpanded(null); resetSubs() }}
                        />
                    ))
                })()}

                {/* ── After (right) — purple ── */}
                {show('right') && <MotionButton
                    key="after"
                    testId="swipe-btn-add-after"
                    pos={positions.right}
                    icon={Plus}
                    label="After"
                    color="#8b5cf6"
                    delay={0.04}
                    active={expanded === 'after'}
                    dimmed={expanded !== null && expanded !== 'after'}
                    activationMode={activationMode}
                    onClick={() => { setExpanded(prev => prev === 'after' ? null : 'after'); resetSubs() }}
                    onHover={() => { setExpanded('after'); resetSubs() }}
                />}

                {/* After sub-buttons: fan right — User (top), Job (center), Recent (bottom) */}
                {show('right') && expanded === 'after' && ADD_NODE_TYPES.map((sub, i) => (
                    <MotionButton
                        key={`after-${sub.key}`}
                        testId={`ext-after-${sub.key}`}
                        pos={{ x: positions.right.x + TILE, y: positions.right.y + (i - 1) * TILE }}
                        icon={sub.icon}
                        label={sub.label}
                        color={sub.color}
                        delay={i * 0.03}
                        active={sub.key === 'job' && jobExpanded === 'after'}
                        onClick={() => {
                            onAddAfter(nodeId, sub.key)
                            setExpanded(null); resetSubs()
                        }}
                        onHover={
                            sub.key === 'job' ? () => { setJobExpanded('after'); setScriptExpanded(null); setAiExpanded(null) }
                                : () => { setJobExpanded(null); setScriptExpanded(null); setAiExpanded(null) }
                        }
                    />
                ))}

                {/* After → Job sub-types: Sleep, Script & AI */}
                {show('right') && expanded === 'after' && jobExpanded === 'after' && (() => {
                    const jobBtnX = positions.right.x + TILE
                    const jobBtnY = positions.right.y  // Job is at center (index 1)
                    return JOB_TYPES.map((jt, i) => (
                        <MotionButton
                            key={`after-job-${jt.key}`}
                            testId={`ext-after-job-${jt.key}`}
                            pos={{ x: jobBtnX + TILE, y: jobBtnY + (i - 1) * TILE }}
                            icon={jt.icon}
                            label={jt.label}
                            color={jt.color}
                            delay={i * 0.03}
                            active={(jt.key === 'script' && scriptExpanded === 'after') || (jt.key === 'ai' && aiExpanded === 'after')}
                            onClick={() => {
                                if (jt.key === 'user') {
                                    onAddAfter(nodeId, 'user')
                                    setExpanded(null); resetSubs()
                                } else if (jt.key === 'script') {
                                    onAddAfter(nodeId, 'script:js')
                                    setExpanded(null); resetSubs()
                                } else if (jt.key === 'ai') {
                                    onAddAfter(nodeId, 'ai:worker')
                                    setExpanded(null); resetSubs()
                                }
                            }}
                            onHover={
                                jt.key === 'script' ? () => { setScriptExpanded('after'); setAiExpanded(null) }
                                    : jt.key === 'ai' ? () => { setAiExpanded('after'); setScriptExpanded(null) }
                                        : () => { setScriptExpanded(null); setAiExpanded(null) }
                            }
                        />
                    ))
                })()}

                {/* After → Job → Script sub-types */}
                {show('right') && expanded === 'after' && jobExpanded === 'after' && scriptExpanded === 'after' && (() => {
                    const scriptBtnX = positions.right.x + TILE * 2
                    const scriptBtnY = positions.right.y - TILE
                    return SCRIPT_TYPES.map((st, i) => (
                        <MotionButton
                            key={`after-script-${st.key}`}
                            testId={`ext-after-script-${st.key}`}
                            pos={{ x: scriptBtnX + TILE, y: scriptBtnY + (i - 1) * TILE }}
                            icon={st.icon}
                            label={st.label}
                            color={st.color}
                            delay={i * 0.03}
                            onClick={() => { onAddAfter(nodeId, `script:${st.key}`); setExpanded(null); resetSubs() }}
                        />
                    ))
                })()}

                {/* After → Job → AI roles */}
                {show('right') && expanded === 'after' && jobExpanded === 'after' && aiExpanded === 'after' && (() => {
                    const aiBtnX = positions.right.x + TILE * 2
                    const aiBtnY = positions.right.y + TILE
                    return AI_ROLES.map((role, i) => (
                        <MotionButton
                            key={`after-ai-${role.key}`}
                            testId={`ext-after-ai-${role.key}`}
                            pos={{ x: aiBtnX + TILE, y: aiBtnY + (i - 1) * TILE }}
                            icon={role.icon}
                            label={role.label}
                            color={role.color}
                            delay={i * 0.03}
                            onClick={() => { onAddAfter(nodeId, `ai:${role.key}`); setExpanded(null); resetSubs() }}
                        />
                    ))
                })()}

                {/* ── Before (left) — purple ── */}
                {show('left') && <MotionButton
                    key="before"
                    testId="swipe-btn-add-before"
                    pos={positions.left}
                    icon={Plus}
                    label="Before"
                    color="#8b5cf6"
                    delay={0.12}
                    active={expanded === 'before'}
                    dimmed={expanded !== null && expanded !== 'before'}
                    activationMode={activationMode}
                    onClick={() => { setExpanded(prev => prev === 'before' ? null : 'before'); resetSubs() }}
                    onHover={() => { setExpanded('before'); resetSubs() }}
                />}

                {/* Before sub-buttons: fan left — User (top), Job (center), Recent (bottom) */}
                {show('left') && expanded === 'before' && ADD_NODE_TYPES.map((sub, i) => (
                    <MotionButton
                        key={`before-${sub.key}`}
                        testId={`ext-before-${sub.key}`}
                        pos={{ x: positions.left.x - TILE, y: positions.left.y + (i - 1) * TILE }}
                        icon={sub.icon}
                        label={sub.label}
                        color={sub.color}
                        delay={i * 0.03}
                        active={sub.key === 'job' && jobExpanded === 'before'}
                        onClick={() => {
                            onAddBefore(nodeId, sub.key)
                            setExpanded(null); resetSubs()
                        }}
                        onHover={
                            sub.key === 'job' ? () => { setJobExpanded('before'); setScriptExpanded(null); setAiExpanded(null) }
                                : () => { setJobExpanded(null); setScriptExpanded(null); setAiExpanded(null) }
                        }
                    />
                ))}

                {/* Before → Job sub-types: User, Script & AI */}
                {show('left') && expanded === 'before' && jobExpanded === 'before' && (() => {
                    const jobBtnX = positions.left.x - TILE
                    const jobBtnY = positions.left.y
                    return JOB_TYPES.map((jt, i) => (
                        <MotionButton
                            key={`before-job-${jt.key}`}
                            testId={`ext-before-job-${jt.key}`}
                            pos={{ x: jobBtnX - TILE, y: jobBtnY + (i - 1) * TILE }}
                            icon={jt.icon}
                            label={jt.label}
                            color={jt.color}
                            delay={i * 0.03}
                            active={(jt.key === 'script' && scriptExpanded === 'before') || (jt.key === 'ai' && aiExpanded === 'before')}
                            onClick={() => {
                                if (jt.key === 'user') {
                                    onAddBefore(nodeId, 'user')
                                    setExpanded(null); resetSubs()
                                } else if (jt.key === 'script') {
                                    onAddBefore(nodeId, 'script:js')
                                    setExpanded(null); resetSubs()
                                } else if (jt.key === 'ai') {
                                    onAddBefore(nodeId, 'ai:worker')
                                    setExpanded(null); resetSubs()
                                }
                            }}
                            onHover={
                                jt.key === 'script' ? () => { setScriptExpanded('before'); setAiExpanded(null) }
                                    : jt.key === 'ai' ? () => { setAiExpanded('before'); setScriptExpanded(null) }
                                        : () => { setScriptExpanded(null); setAiExpanded(null) }
                            }
                        />
                    ))
                })()}

                {/* Before → Job → Script sub-types */}
                {show('left') && expanded === 'before' && jobExpanded === 'before' && scriptExpanded === 'before' && (() => {
                    const scriptBtnX = positions.left.x - TILE * 2
                    const scriptBtnY = positions.left.y - TILE
                    return SCRIPT_TYPES.map((st, i) => (
                        <MotionButton
                            key={`before-script-${st.key}`}
                            testId={`ext-before-script-${st.key}`}
                            pos={{ x: scriptBtnX - TILE, y: scriptBtnY + (i - 1) * TILE }}
                            icon={st.icon}
                            label={st.label}
                            color={st.color}
                            delay={i * 0.03}
                            onClick={() => { onAddBefore(nodeId, `script:${st.key}`); setExpanded(null); resetSubs() }}
                        />
                    ))
                })()}

                {/* Before → Job → AI roles */}
                {show('left') && expanded === 'before' && jobExpanded === 'before' && aiExpanded === 'before' && (() => {
                    const aiBtnX = positions.left.x - TILE * 2
                    const aiBtnY = positions.left.y + TILE
                    return AI_ROLES.map((role, i) => (
                        <MotionButton
                            key={`before-ai-${role.key}`}
                            testId={`ext-before-ai-${role.key}`}
                            pos={{ x: aiBtnX - TILE, y: aiBtnY + (i - 1) * TILE }}
                            icon={role.icon}
                            label={role.label}
                            color={role.color}
                            delay={i * 0.03}
                            onClick={() => { onAddBefore(nodeId, `ai:${role.key}`); setExpanded(null); resetSubs() }}
                        />
                    ))
                })()}
            </AnimatePresence>

            {/* Rename inline input */}
            <AnimatePresence>
                {renaming && (
                    <motion.div
                        data-testid="ext-rename-input"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        style={{
                            position: 'fixed',
                            left: (nodeRect.left + nodeRect.width / 2) - 100,
                            top: positions.bottom.y + 32,
                            width: 200,
                            pointerEvents: 'auto',
                        }}
                        {...stopEvents}
                    >
                        <input
                            ref={inputRef}
                            data-testid="ext-rename-field"
                            type="text"
                            value={renameValue}
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            onBlur={handleRenameConfirm}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: '1.5px solid rgba(245,158,11,0.4)',
                                background: 'rgba(15,15,26,0.95)',
                                backdropFilter: 'blur(12px)',
                                color: '#e2e8f0',
                                fontSize: 13, fontWeight: 600,
                                fontFamily: 'Inter',
                                outline: 'none', textAlign: 'center',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ textAlign: 'center', marginTop: 4, fontSize: 8, color: '#64748b', fontFamily: 'Inter' }}>
                            Enter to confirm · ESC to cancel
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ── MotionButton ────────────────────────────────────────────────────────────────

function MotionButton({ testId, pos, icon: Icon, label, color, delay = 0, size = 48, active, dimmed, onClick, onHover, activationMode = 'click' }: {
    testId: string
    pos: { x: number; y: number }
    icon: typeof Plus
    label: string
    color: string
    delay?: number
    size?: number
    active?: boolean
    dimmed?: boolean
    onClick: () => void
    onHover?: () => void
    activationMode?: SwipeButtonsActivation
}) {
    const half = size / 2
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [holdProgress, setHoldProgress] = useState(false)

    // Clear hold timer on unmount
    useEffect(() => () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }, [])

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation()
        if (activationMode === 'hold' && onHover) {
            setHoldProgress(true)
            holdTimerRef.current = setTimeout(() => {
                setHoldProgress(false)
                onHover()
            }, 500)
        }
    }, [activationMode, onHover])

    const handlePointerUp = useCallback((e?: React.PointerEvent) => {
        e?.stopPropagation()
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current)
            holdTimerRef.current = null
        }
        setHoldProgress(false)
    }, [])

    const handlePointerEnter = useCallback((e: React.PointerEvent) => {
        e.stopPropagation()
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = `${color}88`
        el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${color}33`
        if (activationMode === 'swipe' && onHover) {
            onHover()
        } else if (activationMode === 'click' && onHover) {
            onHover()
        }
    }, [activationMode, onHover, color])

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        if (activationMode === 'hold') return // hold mode uses pointer events
        onClick()
    }, [activationMode, onClick])

    // SVG ring for hold progress
    const ringRadius = half + 2
    const circumference = 2 * Math.PI * ringRadius

    // Inject keyframe on first render
    useEffect(() => { ensureHoldKeyframe() }, [])

    return (
        <motion.button
            data-testid={testId}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: dimmed ? 0.35 : 1, scale: dimmed ? 0.85 : 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay, duration: 0.15, ease: 'easeOut' }}
            onClick={handleClick}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${color}44`
                el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${color}11`
                handlePointerUp()
            }}
            style={{
                position: 'fixed',
                left: pos.x - half,
                top: pos.y - half,
                pointerEvents: 'auto',
                ...btnStyle(color, size),
                ...(active ? { borderColor: `${color}aa`, boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 16px ${color}44` } : {}),
            }}
        >
            {/* Hold progress ring */}
            {holdProgress && (
                <svg
                    style={{
                        position: 'absolute',
                        left: -4, top: -4,
                        width: size + 8, height: size + 8,
                        pointerEvents: 'none',
                    }}
                >
                    <circle
                        cx={(size + 8) / 2}
                        cy={(size + 8) / 2}
                        r={ringRadius}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={`${circumference}`}
                        style={{
                            // @ts-expect-error CSS custom property
                            '--circ': `${circumference}`,
                            animation: 'swipe-btn-hold-fill 0.5s linear forwards',
                        }}
                    />
                </svg>
            )}
            <Icon size={size <= 40 ? 14 : 18} strokeWidth={2} />
            <span style={{
                fontSize: size <= 40 ? 6 : 7,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.3,
                lineHeight: 1,
                opacity: 0.85,
            }}>
                {label}
            </span>
        </motion.button>
    )
}
