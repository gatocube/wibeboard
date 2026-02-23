import { useEffect, useRef, useState } from 'react'

/**
 * FpsMeter — lightweight FPS counter using requestAnimationFrame.
 *
 * Shows current FPS, colored green (≥50), yellow (30-49), or red (<30).
 * Renders in a small fixed overlay. Toggle visibility with `visible` prop.
 */
export function FpsMeter({ visible = true }: { visible?: boolean }) {
    const [fps, setFps] = useState(0)
    const frameRef = useRef(0)
    const lastRef = useRef(performance.now())
    const rafRef = useRef(0)

    useEffect(() => {
        if (!visible) return

        const tick = (now: number) => {
            frameRef.current++
            const delta = now - lastRef.current

            if (delta >= 1000) {
                setFps(Math.round((frameRef.current * 1000) / delta))
                frameRef.current = 0
                lastRef.current = now
            }
            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(rafRef.current)
    }, [visible])

    if (!visible) return null

    const color = fps >= 50 ? '#22c55e' : fps >= 30 ? '#f59e0b' : '#ef4444'

    return (
        <div style={{
            position: 'fixed', top: 8, right: 8, zIndex: 9999,
            padding: '2px 8px', borderRadius: 4,
            background: 'rgba(0,0,0,0.75)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 700,
            color, letterSpacing: '-0.5px',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${color}33`,
            minWidth: 48, textAlign: 'center',
        }}>
            {fps} <span style={{ fontSize: 8, fontWeight: 400, opacity: 0.7 }}>FPS</span>
        </div>
    )
}
