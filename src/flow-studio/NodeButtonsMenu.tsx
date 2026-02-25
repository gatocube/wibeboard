/**
 * NodeButtonsMenu — iPad-friendly action buttons around a selected node.
 *
 * Rendered as a fixed-position overlay that tracks the node's screen position.
 * 4 glassmorphism buttons at cardinal positions around the node:
 *   Top:    Configure   (opens node config)
 *   Right:  Add After   (appends connected node)
 *   Bottom: Rename      (inline text editing)
 *   Left:   Add Before  (inserts node between prev and current)
 *
 * Touch targets: min 48×48px per Apple HIG.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Settings, Pencil } from 'lucide-react'

// ── Button layout ───────────────────────────────────────────────────────────────

interface MenuButton {
    key: string
    label: string
    shortLabel: string
    icon: typeof Plus
    testId: string
    position: 'top' | 'right' | 'bottom' | 'left'
    color: string
}

const BUTTONS: MenuButton[] = [
    { key: 'configure', label: 'Configure', shortLabel: 'Config', icon: Settings, testId: 'node-btn-configure', position: 'top', color: '#06b6d4' },
    { key: 'addAfter', label: 'Add After', shortLabel: 'After', icon: Plus, testId: 'node-btn-add-after', position: 'right', color: '#22c55e' },
    { key: 'rename', label: 'Rename', shortLabel: 'Name', icon: Pencil, testId: 'node-btn-rename', position: 'bottom', color: '#f59e0b' },
    { key: 'addBefore', label: 'Add Before', shortLabel: 'Before', icon: Plus, testId: 'node-btn-add-before', position: 'left', color: '#8b5cf6' },
]

// ── Props ───────────────────────────────────────────────────────────────────────

export interface NodeButtonsMenuProps {
    /** The selected node's ID */
    nodeId: string
    /** Node width (for positioning) */
    nodeWidth: number
    /** Node height (for positioning) */
    nodeHeight: number
    /** Current node label (for rename) */
    currentLabel: string
    /** Callbacks */
    onAddBefore: (nodeId: string) => void
    onAddAfter: (nodeId: string) => void
    onConfigure: (nodeId: string) => void
    onRename: (nodeId: string, newName: string) => void
    /** Dismiss the menu */
    onDismiss: () => void
}

// ── Component ───────────────────────────────────────────────────────────────────

export function NodeButtonsMenu(props: NodeButtonsMenuProps) {
    const { nodeId, currentLabel, onAddBefore, onAddAfter, onConfigure, onRename } = props
    const [renaming, setRenaming] = useState(false)
    const [renameValue, setRenameValue] = useState(currentLabel)
    const inputRef = useRef<HTMLInputElement>(null)
    const [nodeRect, setNodeRect] = useState<DOMRect | null>(null)

    // Track node screen position via polling (handles pan/zoom)
    useEffect(() => {
        const update = () => {
            const el = document.querySelector(`[data-id="${nodeId}"]`) as HTMLElement | null
            if (el) {
                setNodeRect(el.getBoundingClientRect())
            }
        }
        update()
        const interval = setInterval(update, 50) // 20fps position tracking
        return () => clearInterval(interval)
    }, [nodeId])

    // Focus input when entering rename mode
    useEffect(() => {
        if (renaming) {
            setRenameValue(currentLabel)
            setTimeout(() => inputRef.current?.select(), 50)
        }
    }, [renaming, currentLabel])

    const handleClick = useCallback((key: string) => {
        switch (key) {
            case 'addBefore':
                onAddBefore(nodeId)
                break
            case 'addAfter':
                onAddAfter(nodeId)
                break
            case 'configure':
                onConfigure(nodeId)
                break
            case 'rename':
                setRenaming(true)
                break
        }
    }, [nodeId, onAddBefore, onAddAfter, onConfigure])

    const handleRenameConfirm = useCallback(() => {
        const trimmed = renameValue.trim()
        if (trimmed && trimmed !== currentLabel) {
            onRename(nodeId, trimmed)
        }
        setRenaming(false)
    }, [renameValue, currentLabel, nodeId, onRename])

    const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleRenameConfirm()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            setRenaming(false)
        }
    }, [handleRenameConfirm])

    // Compute button positions relative to node center on screen
    const buttonPositions = useMemo(() => {
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

    if (!nodeRect || !buttonPositions) return null

    return (
        <div
            data-testid="node-buttons-menu"
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: 0, height: 0,
                zIndex: 1000,
                pointerEvents: 'none',
            }}
        >
            <AnimatePresence>
                {BUTTONS.map((btn, i) => {
                    const pos = buttonPositions[btn.position]
                    const Icon = btn.icon

                    return (
                        <motion.button
                            key={btn.key}
                            data-testid={btn.testId}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ delay: i * 0.04, duration: 0.15, ease: 'easeOut' }}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleClick(btn.key)
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            style={{
                                position: 'fixed',
                                left: pos.x - 24,
                                top: pos.y - 24,
                                width: 48, height: 48,
                                borderRadius: 14,
                                border: `1.5px solid ${btn.color}44`,
                                background: 'rgba(15,15,26,0.92)',
                                backdropFilter: 'blur(12px)',
                                color: btn.color,
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                gap: 2,
                                pointerEvents: 'auto',
                                fontFamily: 'Inter',
                                padding: 0,
                                boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${btn.color}11`,
                                transition: 'border-color 0.15s, box-shadow 0.15s',
                                WebkitTapHighlightColor: 'transparent',
                                touchAction: 'manipulation',
                            }}
                            onPointerEnter={(e) => {
                                const el = e.currentTarget
                                el.style.borderColor = `${btn.color}88`
                                el.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${btn.color}33`
                            }}
                            onPointerLeave={(e) => {
                                const el = e.currentTarget
                                el.style.borderColor = `${btn.color}44`
                                el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${btn.color}11`
                            }}
                        >
                            <Icon size={18} strokeWidth={2} />
                            <span style={{
                                fontSize: 7, fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: 0.3,
                                lineHeight: 1,
                                opacity: 0.85,
                            }}>
                                {btn.shortLabel}
                            </span>
                        </motion.button>
                    )
                })}
            </AnimatePresence>

            {/* Rename inline input */}
            <AnimatePresence>
                {renaming && (
                    <motion.div
                        data-testid="node-rename-input"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        style={{
                            position: 'fixed',
                            left: (nodeRect.left + nodeRect.width / 2) - 100,
                            top: buttonPositions.bottom.y + 32,
                            width: 200,
                            pointerEvents: 'auto',
                        }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onPointerDown={e => e.stopPropagation()}
                    >
                        <input
                            ref={inputRef}
                            data-testid="node-rename-field"
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
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: 'Inter',
                                outline: 'none',
                                textAlign: 'center',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{
                            textAlign: 'center', marginTop: 4,
                            fontSize: 8, color: '#64748b',
                            fontFamily: 'Inter',
                        }}>
                            Enter to confirm · ESC to cancel
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
