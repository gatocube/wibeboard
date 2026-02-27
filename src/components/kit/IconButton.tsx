/**
 * IconButton — reusable colored icon button for the wibeboard UI kit.
 *
 * Glassmorphism pill/rounded-square buttons with customizable color,
 * icon, label, and size. iPad-friendly touch targets (min 44px).
 *
 * Color presets match the wibeboard theme palette.
 */

import { type ReactNode, useCallback, useRef, type CSSProperties } from 'react'

// ── Color presets ───────────────────────────────────────────────────────────────

export const ICON_BUTTON_COLORS = {
    purple: '#8b5cf6',
    green: '#22c55e',
    yellow: '#f59e0b',
    cyan: '#06b6d4',
    red: '#ef4444',
    blue: '#3b82f6',
    emerald: '#10b981',
    pink: '#ec4899',
    orange: '#f97316',
    indigo: '#6366f1',
    slate: '#64748b',
} as const

export type IconButtonColor = keyof typeof ICON_BUTTON_COLORS

// ── Sizes ───────────────────────────────────────────────────────────────────────

export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface SizeSpec {
    box: number
    iconSize: number
    labelSize: number
    radius: number
    gap: number
}

const SIZES: Record<IconButtonSize, SizeSpec> = {
    xs: { box: 28, iconSize: 12, labelSize: 6, radius: 6, gap: 1 },
    sm: { box: 36, iconSize: 14, labelSize: 7, radius: 8, gap: 2 },
    md: { box: 48, iconSize: 18, labelSize: 8, radius: 12, gap: 2 },
    lg: { box: 56, iconSize: 22, labelSize: 9, radius: 14, gap: 3 },
}

// ── Props ───────────────────────────────────────────────────────────────────────

export interface IconButtonProps {
    /** Lucide icon or any ReactNode */
    icon: ReactNode
    /** Optional short label below the icon */
    label?: string
    /** Color preset name or raw hex string */
    color?: IconButtonColor | string
    /** Button size */
    size?: IconButtonSize
    /** Click handler */
    onClick?: (e: React.MouseEvent) => void
    /** Whether the button is active/selected */
    active?: boolean
    /** Disable the button */
    disabled?: boolean
    /** Tooltip */
    title?: string
    /** data-testid */
    testId?: string
    /** Extra inline style */
    style?: CSSProperties
    /** Make draggable */
    draggable?: boolean
    /** Drag start handler */
    onDragStart?: (e: React.DragEvent) => void
    /** Additional className */
    className?: string
}

// ── Component ───────────────────────────────────────────────────────────────────

export function IconButton({
    icon,
    label,
    color: colorProp = 'purple',
    size = 'md',
    onClick,
    active = false,
    disabled = false,
    title,
    testId,
    style: extraStyle,
    draggable,
    onDragStart,
    className,
}: IconButtonProps) {
    const elRef = useRef<HTMLButtonElement>(null)
    const spec = SIZES[size]

    // Resolve color: if it's a preset key, use the hex; otherwise treat as raw hex
    const resolvedColor = (ICON_BUTTON_COLORS as Record<string, string>)[colorProp] ?? colorProp

    const bgAlpha = active ? '25' : '15'
    const borderAlpha = active ? '55' : '33'
    const hoverBgAlpha = '30'
    const hoverBorderAlpha = '66'

    const handleMouseEnter = useCallback(() => {
        const el = elRef.current
        if (!el || disabled) return
        el.style.background = `${resolvedColor}${hoverBgAlpha}`
        el.style.borderColor = `${resolvedColor}${hoverBorderAlpha}`
        el.style.transform = 'scale(1.06)'
    }, [resolvedColor, disabled])

    const handleMouseLeave = useCallback(() => {
        const el = elRef.current
        if (!el) return
        el.style.background = `${resolvedColor}${bgAlpha}`
        el.style.borderColor = `${resolvedColor}${borderAlpha}`
        el.style.transform = 'scale(1)'
    }, [resolvedColor, bgAlpha, borderAlpha])

    return (
        <button
            ref={elRef}
            data-testid={testId}
            title={title}
            disabled={disabled}
            draggable={draggable}
            onDragStart={onDragStart}
            className={className}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onPointerDown={e => e.stopPropagation()}
            style={{
                width: spec.box,
                height: spec.box,
                minWidth: spec.box,
                minHeight: spec.box,
                borderRadius: spec.radius,
                background: `${resolvedColor}${bgAlpha}`,
                border: `1px solid ${resolvedColor}${borderAlpha}`,
                color: resolvedColor,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spec.gap,
                padding: 0,
                fontFamily: 'Inter',
                transition: 'all 0.15s',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                ...extraStyle,
            }}
        >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </span>
            {label && (
                <span style={{
                    fontSize: spec.labelSize,
                    fontWeight: 600,
                    lineHeight: 1,
                    color: 'inherit',
                    opacity: 0.85,
                    textTransform: 'uppercase',
                    letterSpacing: 0.3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: spec.box - 4,
                }}>
                    {label}
                </span>
            )}
        </button>
    )
}
