/**
 * ExtendedNodeButtonsMenu — enhanced version with sub-menus.
 *
 * When the user hovers Before/After, a fan of widget-type buttons
 * appears on the corresponding side: AI, Script, User.
 * When Configure is hovered, sub-options fan out above: Rename, Delete, Duplicate.
 *
 * Layout:
 *   Top:    Configure → fan: Rename | Delete | Duplicate
 *   Right:  After (+) → fan: AI | Script | User
 *   Bottom: Rename
 *   Left:   Before (+) → fan: AI | Script | User
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Settings, Pencil, Cpu, Code, UserCircle, Trash2, Copy } from 'lucide-react'

// ── Types ───────────────────────────────────────────────────────────────────────

interface SubButton {
    key: string
    label: string
    icon: typeof Plus
    color: string
}

const WIDGET_TYPES: SubButton[] = [
    { key: 'ai', label: 'AI', icon: Cpu, color: '#8b5cf6' },
    { key: 'script', label: 'Script', icon: Code, color: '#f7df1e' },
    { key: 'user', label: 'User', icon: UserCircle, color: '#22c55e' },
]

const CONFIG_ACTIONS: SubButton[] = [
    { key: 'rename', label: 'Rename', icon: Pencil, color: '#f59e0b' },
    { key: 'duplicate', label: 'Duplicate', icon: Copy, color: '#06b6d4' },
    { key: 'delete', label: 'Delete', icon: Trash2, color: '#ef4444' },
]

// ── Props ───────────────────────────────────────────────────────────────────────

export interface ExtendedNodeButtonsMenuProps {
    nodeId: string
    currentLabel: string
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


// ── Component ───────────────────────────────────────────────────────────────────

export function ExtendedNodeButtonsMenu(props: ExtendedNodeButtonsMenuProps) {
    const { nodeId, currentLabel, onAddBefore, onAddAfter, onConfigure, onRename } = props
    const [expanded, setExpanded] = useState<null | 'before' | 'after' | 'config'>(null)
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
    const positions = useMemo(() => {
        if (!nodeRect) return null
        const cx = nodeRect.left + nodeRect.width / 2
        const cy = nodeRect.top + nodeRect.height / 2
        const gapX = nodeRect.width / 2 + 16
        const gapY = nodeRect.height / 2 + 16
        return {
            top: { x: cx, y: cy - gapY },
            right: { x: cx + gapX, y: cy },
            bottom: { x: cx, y: cy + gapY },
            left: { x: cx - gapX, y: cy },
        }
    }, [nodeRect])

    if (!nodeRect || !positions) return null

    const stopEvents = {
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
        onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    }

    return (
        <div data-testid="extended-node-buttons-menu"
            style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, zIndex: 1000, pointerEvents: 'none' }}>

            <AnimatePresence>
                {/* ── Config (top) ── */}
                <MotionButton
                    key="config"
                    testId="ext-btn-configure"
                    pos={positions.top}
                    icon={Settings}
                    label="Config"
                    color="#06b6d4"
                    delay={0}
                    active={expanded === 'config'}
                    onClick={() => setExpanded(prev => prev === 'config' ? null : 'config')}
                    onHover={() => setExpanded('config')}
                />

                {/* Config sub-buttons: fan above */}
                {expanded === 'config' && CONFIG_ACTIONS.map((sub, i) => (
                    <MotionButton
                        key={`cfg-${sub.key}`}
                        testId={`ext-cfg-${sub.key}`}
                        pos={{ x: positions.top.x + (i - 1) * 56, y: positions.top.y - 58 }}
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

                {/* ── After (right) ── */}
                <MotionButton
                    key="after"
                    testId="ext-btn-add-after"
                    pos={positions.right}
                    icon={Plus}
                    label="After"
                    color="#22c55e"
                    delay={0.04}
                    active={expanded === 'after'}
                    onClick={() => setExpanded(prev => prev === 'after' ? null : 'after')}
                    onHover={() => setExpanded('after')}
                />

                {/* After sub-buttons: fan right */}
                {expanded === 'after' && WIDGET_TYPES.map((sub, i) => (
                    <MotionButton
                        key={`after-${sub.key}`}
                        testId={`ext-after-${sub.key}`}
                        pos={{ x: positions.right.x + 58, y: positions.right.y + (i - 1) * 56 }}
                        icon={sub.icon}
                        label={sub.label}
                        color={sub.color}
                        delay={i * 0.03}
                        onClick={() => { onAddAfter(nodeId, sub.key); setExpanded(null) }}
                    />
                ))}

                {/* ── Rename (bottom) ── */}
                <MotionButton
                    key="rename"
                    testId="ext-btn-rename"
                    pos={positions.bottom}
                    icon={Pencil}
                    label="Name"
                    color="#f59e0b"
                    delay={0.08}
                    onClick={() => { setRenaming(true); setExpanded(null) }}
                />

                {/* ── Before (left) ── */}
                <MotionButton
                    key="before"
                    testId="ext-btn-add-before"
                    pos={positions.left}
                    icon={Plus}
                    label="Before"
                    color="#8b5cf6"
                    delay={0.12}
                    active={expanded === 'before'}
                    onClick={() => setExpanded(prev => prev === 'before' ? null : 'before')}
                    onHover={() => setExpanded('before')}
                />

                {/* Before sub-buttons: fan left */}
                {expanded === 'before' && WIDGET_TYPES.map((sub, i) => (
                    <MotionButton
                        key={`before-${sub.key}`}
                        testId={`ext-before-${sub.key}`}
                        pos={{ x: positions.left.x - 58, y: positions.left.y + (i - 1) * 56 }}
                        icon={sub.icon}
                        label={sub.label}
                        color={sub.color}
                        delay={i * 0.03}
                        onClick={() => { onAddBefore(nodeId, sub.key); setExpanded(null) }}
                    />
                ))}
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

function MotionButton({ testId, pos, icon: Icon, label, color, delay = 0, size = 48, active, onClick, onHover }: {
    testId: string
    pos: { x: number; y: number }
    icon: typeof Plus
    label: string
    color: string
    delay?: number
    size?: number
    active?: boolean
    onClick: () => void
    onHover?: () => void
}) {
    const half = size / 2
    return (
        <motion.button
            data-testid={testId}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay, duration: 0.15, ease: 'easeOut' }}
            onClick={(e) => { e.stopPropagation(); onClick() }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerEnter={onHover ? (e) => {
                e.stopPropagation()
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${color}88`
                el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${color}33`
                onHover()
            } : (e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${color}88`
                el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${color}33`
            }}
            onPointerLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${color}44`
                el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${color}11`
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
