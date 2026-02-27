/**
 * ToggleGroup — pill-style toggle group similar to shadcn/ui toggle-group.
 *
 * Usage:
 *   <ToggleGroup value={theme} onChange={setTheme}>
 *     <ToggleGroupItem value="wibeglow">WibeGlow</ToggleGroupItem>
 *     <ToggleGroupItem value="pixel">Pixel</ToggleGroupItem>
 *     <ToggleGroupItem value="ghub">GitHub</ToggleGroupItem>
 *   </ToggleGroup>
 */

import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'

// ── Context ──────────────────────────────────────────────────────────────────────

interface ToggleGroupContextValue {
    value: string
    onChange: (value: string) => void
    size: ToggleGroupSize
    variant: ToggleGroupVariant
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null)

// ── Types ────────────────────────────────────────────────────────────────────────

export type ToggleGroupSize = 'sm' | 'md' | 'lg'
export type ToggleGroupVariant = 'default' | 'outline'

export interface ToggleGroupProps {
    /** Currently selected value */
    value: string
    /** Called when selection changes */
    onChange: (value: string) => void
    /** Size variant */
    size?: ToggleGroupSize
    /** Visual variant */
    variant?: ToggleGroupVariant
    /** Active accent color (CSS color string) */
    activeColor?: string
    children: ReactNode
    /** Additional className */
    className?: string
    /** data-testid */
    testId?: string
    style?: CSSProperties
}

export interface ToggleGroupItemProps {
    /** Value for this option (must be unique within the group) */
    value: string
    children: ReactNode
    /** Optional data-testid override (default: `toggle-{value}`) */
    testId?: string
    /** If true, this item is disabled */
    disabled?: boolean
    style?: CSSProperties
}

// ── Size tokens ──────────────────────────────────────────────────────────────────

const SIZE_TOKENS: Record<ToggleGroupSize, { padding: string; fontSize: number; gap: number; radius: number; wrapRadius: number; wrapPad: number }> = {
    sm: { padding: '4px 10px', fontSize: 10, gap: 2, radius: 4, wrapRadius: 6, wrapPad: 2 },
    md: { padding: '5px 14px', fontSize: 11, gap: 2, radius: 5, wrapRadius: 7, wrapPad: 2 },
    lg: { padding: '7px 18px', fontSize: 12, gap: 3, radius: 6, wrapRadius: 8, wrapPad: 3 },
}

// ── ToggleGroup ──────────────────────────────────────────────────────────────────

export function ToggleGroup({
    value, onChange, size = 'md', variant = 'default', activeColor,
    children, className, testId, style,
}: ToggleGroupProps) {
    const tokens = SIZE_TOKENS[size]

    const wrapStyle: CSSProperties = variant === 'outline'
        ? {
            display: 'inline-flex', gap: tokens.gap,
            ...style,
        }
        : {
            display: 'inline-flex', gap: tokens.gap,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: tokens.wrapRadius, padding: tokens.wrapPad,
            ...style,
        }

    return (
        <ToggleGroupContext.Provider value={{ value, onChange, size, variant }}>
            <div
                role="group"
                className={className}
                data-testid={testId}
                style={wrapStyle}
                data-active-color={activeColor}
            >
                {children}
            </div>
        </ToggleGroupContext.Provider>
    )
}

// ── ToggleGroupItem ──────────────────────────────────────────────────────────────

export function ToggleGroupItem({ value, children, testId, disabled, style }: ToggleGroupItemProps) {
    const ctx = useContext(ToggleGroupContext)
    if (!ctx) throw new Error('ToggleGroupItem must be a child of ToggleGroup')

    const active = ctx.value === value
    const tokens = SIZE_TOKENS[ctx.size]

    // Read active color from parent wrapper's data attribute
    const activeColor = 'rgba(139,92,246,0.6)' // default purple

    const itemStyle: CSSProperties = ctx.variant === 'outline'
        ? {
            padding: tokens.padding, borderRadius: tokens.radius,
            border: active ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: tokens.fontSize, fontWeight: 600,
            background: active ? 'rgba(139,92,246,0.12)' : 'transparent',
            color: active ? '#e2e8f0' : '#64748b',
            opacity: disabled ? 0.4 : 1,
            transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
            ...style,
        }
        : {
            padding: tokens.padding, borderRadius: tokens.radius,
            border: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: tokens.fontSize, fontWeight: 600,
            background: active ? activeColor : 'transparent',
            color: active ? '#fff' : '#64748b',
            opacity: disabled ? 0.4 : 1,
            transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
            ...style,
        }

    return (
        <button
            role="radio"
            aria-checked={active}
            data-state={active ? 'on' : 'off'}
            data-testid={testId ?? `toggle-${value}`}
            disabled={disabled}
            style={itemStyle}
            onClick={() => {
                if (!disabled) ctx.onChange(value)
            }}
        >
            {children}
        </button>
    )
}
