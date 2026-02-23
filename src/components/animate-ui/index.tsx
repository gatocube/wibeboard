'use client'
import { useMemo, memo, useRef, useEffect, useState, useCallback, type CSSProperties, type ReactNode } from 'react'
import { motion, AnimatePresence, type SpringOptions, type Variants, type HTMLMotionProps } from 'framer-motion'

// ────────────────────────────────────────────────────────────────────────────────
// 1. SlidingNumber — digit-by-digit slot animation
// ────────────────────────────────────────────────────────────────────────────────

const digitSpring: SpringOptions = { stiffness: 200, damping: 20, mass: 0.4 }

interface SlidingNumberProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
    number: number
    decimalPlaces?: number
    transition?: SpringOptions
    padStart?: boolean
}

const DIGITS = '0123456789'.split('')

const Digit = memo(function Digit({
    value,
    transition = digitSpring,
    style,
}: { value: string; transition?: SpringOptions; style?: CSSProperties }) {
    const idx = DIGITS.indexOf(value)
    return (
        <span style={{ display: 'inline-block', height: '1em', overflow: 'hidden', position: 'relative', verticalAlign: 'top', ...style }}>
            <motion.span
                animate={{ y: `${-idx}em` }}
                transition={{ type: 'spring', ...transition }}
                style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}
            >
                {DIGITS.map((d) => (
                    <span key={d} style={{ display: 'block', textAlign: 'center' }}>{d}</span>
                ))}
            </motion.span>
        </span>
    )
})

function SlidingNumber({ number: value, decimalPlaces = 0, transition, style, ...props }: SlidingNumberProps) {
    const formatted = useMemo(() => value.toFixed(decimalPlaces), [value, decimalPlaces])
    return (
        <motion.span style={{ display: 'inline-flex', fontVariantNumeric: 'tabular-nums', ...style }} {...props}>
            {formatted.split('').map((ch, i) =>
                ch === '.' || ch === '-'
                    ? <span key={`sep-${i}`} style={{ lineHeight: 1 }}>{ch}</span>
                    : <Digit key={`d-${i}`} value={ch} transition={transition} />
            )}
        </motion.span>
    )
}

// ────────────────────────────────────────────────────────────────────────────────
// 2. ShimmeringText — gradient sweep across text
// ────────────────────────────────────────────────────────────────────────────────

interface ShimmeringTextProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
    text: string
    duration?: number
    color?: string
    shimmeringColor?: string
}

function ShimmeringText({
    text,
    duration = 2,
    color = '#94a3b8',
    shimmeringColor = '#e2e8f0',
    style,
    ...props
}: ShimmeringTextProps) {
    return (
        <motion.span
            style={{
                backgroundImage: `linear-gradient(90deg, ${color} 0%, ${color} 40%, ${shimmeringColor} 50%, ${color} 60%, ${color} 100%)`,
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                ...style,
            }}
            animate={{ backgroundPositionX: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration, ease: 'linear' }}
            {...props}
        >
            {text}
        </motion.span>
    )
}

// ────────────────────────────────────────────────────────────────────────────────
// 3. SplittingText — letter-by-letter entrance
// ────────────────────────────────────────────────────────────────────────────────

interface SplittingTextProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
    text: string
    delay?: number
    duration?: number
    variant?: 'fade' | 'blur' | 'slide-up'
}

function SplittingText({ text, delay = 0.03, duration = 0.4, variant = 'blur', style, ...props }: SplittingTextProps) {
    const variants: Record<string, Variants> = {
        fade: {
            hidden: { opacity: 0 },
            visible: (i: number) => ({ opacity: 1, transition: { delay: i * delay, duration } }),
        },
        blur: {
            hidden: { opacity: 0, filter: 'blur(8px)' },
            visible: (i: number) => ({ opacity: 1, filter: 'blur(0px)', transition: { delay: i * delay, duration } }),
        },
        'slide-up': {
            hidden: { opacity: 0, y: 12 },
            visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * delay, duration } }),
        },
    }
    const chosen = variants[variant] ?? variants.blur
    return (
        <motion.span initial="hidden" animate="visible" style={{ display: 'inline-flex', flexWrap: 'wrap', ...style }} {...props}>
            {text.split('').map((ch, i) => (
                <motion.span key={`${ch}-${i}`} custom={i} variants={chosen} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
                    {ch}
                </motion.span>
            ))}
        </motion.span>
    )
}

// ────────────────────────────────────────────────────────────────────────────────
// 4. RippleButton — tap ripple effect
// ────────────────────────────────────────────────────────────────────────────────

interface RippleButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    children: ReactNode
    rippleColor?: string
}

interface Ripple { id: number; x: number; y: number }

function RippleButton({ children, rippleColor = 'rgba(255,255,255,0.3)', style, onClick, ...props }: RippleButtonProps) {
    const [ripples, setRipples] = useState<Ripple[]>([])
    const nextId = useRef(0)
    const btnRef = useRef<HTMLButtonElement>(null)

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = btnRef.current?.getBoundingClientRect()
        if (rect) {
            const id = nextId.current++
            setRipples(r => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }])
            setTimeout(() => setRipples(r => r.filter(rr => rr.id !== id)), 600)
        }
        if (onClick) (onClick as any)(e)
    }, [onClick])

    return (
        <motion.button
            ref={btnRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            style={{
                position: 'relative', overflow: 'hidden',
                padding: '10px 22px', borderRadius: 10,
                border: 'none', cursor: 'pointer',
                fontFamily: 'Inter', fontWeight: 600, fontSize: 13,
                ...style,
            }}
            {...props}
        >
            {children}
            <AnimatePresence>
                {ripples.map(r => (
                    <motion.span
                        key={r.id}
                        initial={{ scale: 0, opacity: 0.6 }}
                        animate={{ scale: 10, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{
                            position: 'absolute', left: r.x, top: r.y,
                            width: 20, height: 20, borderRadius: '50%',
                            background: rippleColor, pointerEvents: 'none',
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                ))}
            </AnimatePresence>
        </motion.button>
    )
}

// ────────────────────────────────────────────────────────────────────────────────
// 5. MotionGrid — animated cell grid
// ────────────────────────────────────────────────────────────────────────────────

interface MotionGridProps {
    gridSize: [number, number]
    frames: boolean[][][]  // frames[frameIdx][row][col] = active
    duration?: number     // ms per frame
    cellSize?: number
    gap?: number
    activeColor?: string
    inactiveColor?: string
}

function MotionGrid({
    gridSize,
    frames,
    duration = 200,
    cellSize = 24,
    gap = 3,
    activeColor = '#8b5cf6',
    inactiveColor = 'rgba(255,255,255,0.06)',
}: MotionGridProps) {
    const [frameIdx, setFrameIdx] = useState(0)
    useEffect(() => {
        if (frames.length <= 1) return
        const iv = setInterval(() => setFrameIdx(i => (i + 1) % frames.length), duration)
        return () => clearInterval(iv)
    }, [frames.length, duration])
    const current = frames[frameIdx] ?? frames[0]
    const [rows, cols] = gridSize
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`, gap }}>
            {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => {
                    const active = current?.[r]?.[c] ?? false
                    return (
                        <motion.div
                            key={`${r}-${c}`}
                            animate={{
                                backgroundColor: active ? activeColor : inactiveColor,
                                scale: active ? 1 : 0.85,
                            }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            style={{
                                width: cellSize, height: cellSize, borderRadius: 4,
                            }}
                        />
                    )
                })
            )}
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────────────
// 6. Tilt — 3D perspective tilt on mouse hover
// ────────────────────────────────────────────────────────────────────────────────

interface TiltProps extends HTMLMotionProps<'div'> {
    maxTilt?: number
    perspective?: number
}

function Tilt({ maxTilt = 10, perspective = 800, children, style, ...props }: TiltProps) {
    const [rotateX, setRotateX] = useState(0)
    const [rotateY, setRotateY] = useState(0)
    const ref = useRef<HTMLDivElement>(null)

    const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        const x = (e.clientX - rect.left) / rect.width - 0.5  // -0.5 to 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        setRotateX(-y * maxTilt * 2)
        setRotateY(x * maxTilt * 2)
    }, [maxTilt])

    const handleLeave = useCallback(() => {
        setRotateX(0)
        setRotateY(0)
    }, [])

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={handleLeave}
            animate={{ rotateX, rotateY }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.5 }}
            style={{ perspective, transformStyle: 'preserve-3d', ...style }}
            {...props}
        >
            {children}
        </motion.div>
    )
}

// ────────────────────────────────────────────────────────────────────────────────
// 7. AvatarGroup — overlapping avatars with hover spread
// ────────────────────────────────────────────────────────────────────────────────

interface AvatarDef {
    src?: string
    fallback: string
    tooltip?: string
    color?: string
}

interface AvatarGroupProps {
    avatars: AvatarDef[]
    size?: number
    overlap?: number  // negative margin to overlap
    hoverSpread?: number
}

function AvatarGroup({ avatars, size = 36, overlap = -12, hoverSpread = 8 }: AvatarGroupProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {avatars.map((av, i) => (
                <motion.div
                    key={i}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    animate={{
                        marginLeft: i === 0 ? 0 : hoveredIdx !== null ? hoverSpread : overlap,
                        scale: hoveredIdx === i ? 1.15 : 1,
                        zIndex: hoveredIdx === i ? 10 : avatars.length - i,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 17 }}
                    style={{
                        width: size, height: size, borderRadius: '50%',
                        background: av.color || '#475569',
                        border: '2px solid rgba(15,15,26,0.9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {av.src ? (
                        <img src={av.src} alt={av.fallback}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    ) : (
                        <span style={{ fontSize: size * 0.35, fontWeight: 700, color: '#e2e8f0', fontFamily: 'Inter' }}>
                            {av.fallback}
                        </span>
                    )}
                    {/* Tooltip */}
                    <AnimatePresence>
                        {hoveredIdx === i && av.tooltip && (
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 6 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                                style={{
                                    position: 'absolute', bottom: size + 6, left: '50%',
                                    transform: 'translateX(-50%)',
                                    padding: '3px 8px', borderRadius: 6,
                                    background: 'rgba(15,15,26,0.95)', border: '1px solid rgba(255,255,255,0.1)',
                                    fontSize: 10, color: '#e2e8f0', whiteSpace: 'nowrap',
                                    fontFamily: 'Inter', pointerEvents: 'none',
                                }}
                            >
                                {av.tooltip}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────────────
// Exports
// ────────────────────────────────────────────────────────────────────────────────

export { SlidingNumber, ShimmeringText, SplittingText, RippleButton, MotionGrid, Tilt, AvatarGroup }
export type { SlidingNumberProps, ShimmeringTextProps, SplittingTextProps, RippleButtonProps, MotionGridProps, TiltProps, AvatarGroupProps, AvatarDef }
