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
import { Plus, Settings, Pencil, Cpu, Code, UserCircle, Trash2, Copy, FileCode, Terminal, FileType, Brain, Wrench, Search } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────────

interface SubButton {
    key: string
    label: string
    icon: typeof Plus
    color: string
}

// Widget types — AI is in the center (index 1) so it fans out at y=0
const WIDGET_TYPES: SubButton[] = [
    { key: 'script', label: 'Script', icon: Code, color: '#f7df1e' },
    { key: 'ai', label: 'AI', icon: Cpu, color: '#8b5cf6' },
    { key: 'user', label: 'User', icon: UserCircle, color: '#22c55e' },
]

const AI_ROLES: SubButton[] = [
    { key: 'planner', label: 'Planner', icon: Brain, color: '#a78bfa' },
    { key: 'worker', label: 'Worker', icon: Wrench, color: '#8b5cf6' },
    { key: 'reviewer', label: 'Reviewer', icon: Search, color: '#c084fc' },
]

const CONFIG_ACTIONS: SubButton[] = [
    { key: 'rename', label: 'Rename', icon: Pencil, color: '#f59e0b' },
    { key: 'duplicate', label: 'Duplicate', icon: Copy, color: '#06b6d4' },
    { key: 'delete', label: 'Delete', icon: Trash2, color: '#ef4444' },
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
        touchAction: 'manipulation',
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

export function SwipeButtons(props: SwipeButtonsProps) {
    const {
        nodeId, currentLabel, activationMode = 'click',
        directions, noOverlap = false,
        onAddBefore, onAddAfter, onConfigure, onRename,
    } = props
    const dirs = directions ?? ['top', 'right', 'bottom', 'left']
    const [expanded, setExpanded] = useState<null | 'before' | 'after' | 'config'>(null)
    const [scriptExpanded, setScriptExpanded] = useState<null | 'after' | 'before'>(null)
    const [aiExpanded, setAiExpanded] = useState<null | 'after' | 'before'>(null)
    const [renaming, setRenaming] = useState(false)
    const [renameValue, setRenameValue] = useState(currentLabel)
    const inputRef = useRef<HTMLInputElement>(null)
    const [nodeRect, setNodeRect] = useState<DOMRect | null>(null)

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
        <div data-testid="swipe-buttons-menu"
            style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, zIndex: 1000, pointerEvents: 'none' }}>

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
                        onClick={() => {
                            if (sub.key === 'rename') {
                                setRenaming(true)
                                setExpanded(null)
                            } else {
                                onConfigure(nodeId, sub.key)
                                setExpanded(null)
                            }
                        }}
                    />
                ))}

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
                    onClick={() => setExpanded(prev => prev === 'after' ? null : 'after')}
                    onHover={() => { setExpanded('after'); setAiExpanded(null) }}
                />}

                {/* After sub-buttons: fan right — Script (top), AI (center), User (bottom) */}
                {show('right') && expanded === 'after' && WIDGET_TYPES.map((sub, i) => (
                    <MotionButton
                        key={`after-${sub.key}`}
                        testId={`ext-after-${sub.key}`}
                        pos={{ x: positions.right.x + TILE, y: positions.right.y + (i - 1) * TILE }}
                        icon={sub.icon}
                        label={sub.label}
                        color={sub.color}
                        delay={i * 0.03}
                        active={(sub.key === 'script' && scriptExpanded === 'after') || (sub.key === 'ai' && aiExpanded === 'after')}
                        onClick={() => {
                            if (sub.key === 'ai') {
                                // Direct click on AI → create Worker
                                onAddAfter(nodeId, 'ai:worker')
                                setExpanded(null); setScriptExpanded(null); setAiExpanded(null)
                            } else {
                                onAddAfter(nodeId, sub.key)
                                setExpanded(null); setScriptExpanded(null); setAiExpanded(null)
                            }
                        }}
                        onHover={
                            sub.key === 'script' ? () => { setScriptExpanded('after'); setAiExpanded(null) }
                                : sub.key === 'ai' ? () => { setAiExpanded('after'); setScriptExpanded(null) }
                                    : () => { setScriptExpanded(null); setAiExpanded(null) }
                        }
                    />
                ))}

                {/* After → Script sub-types: column to the right of Script button */}
                {show('right') && expanded === 'after' && scriptExpanded === 'after' && (() => {
                    const scriptBtnX = positions.right.x + TILE
                    const scriptBtnY = positions.right.y - TILE
                    const subPositions = [
                        { x: scriptBtnX + TILE, y: scriptBtnY - TILE },  // top
                        { x: scriptBtnX + TILE, y: scriptBtnY },          // center
                        { x: scriptBtnX + TILE, y: scriptBtnY + TILE },  // bottom
                    ]
                    return SCRIPT_TYPES.map((st, i) => (
                        <MotionButton
                            key={`after-script-${st.key}`}
                            testId={`ext-after-script-${st.key}`}
                            pos={subPositions[i]}
                            icon={st.icon}
                            label={st.label}
                            color={st.color}
                            delay={i * 0.03}
                            onClick={() => { onAddAfter(nodeId, `script:${st.key}`); setExpanded(null); setScriptExpanded(null); setAiExpanded(null) }}
                        />
                    ))
                })()}

                {/* After → AI roles: grid around the AI button */}
                {show('right') && expanded === 'after' && aiExpanded === 'after' && (() => {
                    const aiBtnX = positions.right.x + TILE
                    const aiBtnY = positions.right.y
                    const subPositions = [
                        { x: aiBtnX + TILE, y: aiBtnY - TILE },  // top-right
                        { x: aiBtnX + TILE, y: aiBtnY },          // right
                        { x: aiBtnX + TILE, y: aiBtnY + TILE },  // bottom-right
                    ]
                    return AI_ROLES.map((role, i) => (
                        <MotionButton
                            key={`after-ai-${role.key}`}
                            testId={`ext-after-ai-${role.key}`}
                            pos={subPositions[i]}
                            icon={role.icon}
                            label={role.label}
                            color={role.color}
                            delay={i * 0.03}
                            onClick={() => { onAddAfter(nodeId, `ai:${role.key}`); setExpanded(null); setScriptExpanded(null); setAiExpanded(null) }}
                        />
                    ))
                })()}

                {/* ── Rename (bottom) ── */}
                {show('bottom') && <MotionButton
                    key="rename"
                    testId="swipe-btn-rename"
                    pos={positions.bottom}
                    icon={Pencil}
                    label="Name"
                    color="#f59e0b"
                    delay={0.08}
                    dimmed={expanded !== null}
                    activationMode={activationMode}
                    onClick={() => { setRenaming(true); setExpanded(null) }}
                />}

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
                    onClick={() => setExpanded(prev => prev === 'before' ? null : 'before')}
                    onHover={() => { setExpanded('before'); setAiExpanded(null) }}
                />}

                {/* Before sub-buttons: fan left — Script (top), AI (center), User (bottom) */}
                {show('left') && expanded === 'before' && WIDGET_TYPES.map((sub, i) => (
                    <MotionButton
                        key={`before-${sub.key}`}
                        testId={`ext-before-${sub.key}`}
                        pos={{ x: positions.left.x - TILE, y: positions.left.y + (i - 1) * TILE }}
                        icon={sub.icon}
                        label={sub.label}
                        color={sub.color}
                        delay={i * 0.03}
                        active={(sub.key === 'script' && scriptExpanded === 'before') || (sub.key === 'ai' && aiExpanded === 'before')}
                        onClick={() => {
                            if (sub.key === 'ai') {
                                // Direct click on AI → create Worker
                                onAddBefore(nodeId, 'ai:worker')
                                setExpanded(null); setScriptExpanded(null); setAiExpanded(null)
                            } else {
                                onAddBefore(nodeId, sub.key)
                                setExpanded(null); setScriptExpanded(null); setAiExpanded(null)
                            }
                        }}
                        onHover={
                            sub.key === 'script' ? () => { setScriptExpanded('before'); setAiExpanded(null) }
                                : sub.key === 'ai' ? () => { setAiExpanded('before'); setScriptExpanded(null) }
                                    : () => { setScriptExpanded(null); setAiExpanded(null) }
                        }
                    />
                ))}

                {/* Before → Script sub-types: column to the left of Script button */}
                {show('left') && expanded === 'before' && scriptExpanded === 'before' && (() => {
                    const scriptBtnX = positions.left.x - TILE
                    const scriptBtnY = positions.left.y - TILE
                    const subPositions = [
                        { x: scriptBtnX - TILE, y: scriptBtnY - TILE },  // top
                        { x: scriptBtnX - TILE, y: scriptBtnY },          // center
                        { x: scriptBtnX - TILE, y: scriptBtnY + TILE },  // bottom
                    ]
                    return SCRIPT_TYPES.map((st, i) => (
                        <MotionButton
                            key={`before-script-${st.key}`}
                            testId={`ext-before-script-${st.key}`}
                            pos={subPositions[i]}
                            icon={st.icon}
                            label={st.label}
                            color={st.color}
                            delay={i * 0.03}
                            onClick={() => { onAddBefore(nodeId, `script:${st.key}`); setExpanded(null); setScriptExpanded(null); setAiExpanded(null) }}
                        />
                    ))
                })()}

                {/* Before → AI roles: grid around the AI button */}
                {show('left') && expanded === 'before' && aiExpanded === 'before' && (() => {
                    const aiBtnX = positions.left.x - TILE
                    const aiBtnY = positions.left.y
                    const subPositions = [
                        { x: aiBtnX - TILE, y: aiBtnY - TILE },  // top-left
                        { x: aiBtnX - TILE, y: aiBtnY },          // left
                        { x: aiBtnX - TILE, y: aiBtnY + TILE },  // bottom-left
                    ]
                    return AI_ROLES.map((role, i) => (
                        <MotionButton
                            key={`before-ai-${role.key}`}
                            testId={`ext-before-ai-${role.key}`}
                            pos={subPositions[i]}
                            icon={role.icon}
                            label={role.label}
                            color={role.color}
                            delay={i * 0.03}
                            onClick={() => { onAddBefore(nodeId, `ai:${role.key}`); setExpanded(null); setScriptExpanded(null); setAiExpanded(null) }}
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

    const handlePointerUp = useCallback(() => {
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
