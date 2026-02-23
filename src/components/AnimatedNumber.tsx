/**
 * AnimatedNumber — tweening number display using framer-motion.
 *
 * Smoothly interpolates between old and new values with configurable
 * duration. Used in AgentNode stats row for calls count, progress, etc.
 */

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface AnimatedNumberProps {
    value: number
    /** Display format: 'int' or 'float' */
    format?: 'int' | 'float'
    /** Duration in seconds */
    duration?: number
    /** CSS styles */
    style?: React.CSSProperties
    /** Enable/disable animation */
    animate?: boolean
    /** Prefix (e.g. "⚡") */
    prefix?: string
    /** Suffix (e.g. "s") */
    suffix?: string
}

export function AnimatedNumber({
    value,
    format = 'int',
    duration = 0.5,
    style,
    animate: shouldAnimate = true,
    prefix = '',
    suffix = '',
}: AnimatedNumberProps) {
    const springValue = useSpring(0, {
        stiffness: 100,
        damping: 20,
        duration: duration * 1000,
    })

    const display = useTransform(springValue, (v: number) => {
        if (format === 'float') return `${prefix}${v.toFixed(1)}${suffix}`
        return `${prefix}${Math.round(v)}${suffix}`
    })

    const [displayText, setDisplayText] = useState(`${prefix}${value}${suffix}`)
    const prevValue = useRef(value)

    useEffect(() => {
        if (shouldAnimate && value !== prevValue.current) {
            springValue.set(value)
            prevValue.current = value
        } else if (!shouldAnimate) {
            setDisplayText(`${prefix}${format === 'float' ? value.toFixed(1) : value}${suffix}`)
        }
    }, [value, shouldAnimate, springValue, prefix, suffix, format])

    useEffect(() => {
        if (shouldAnimate) {
            return display.on('change', (v: string) => setDisplayText(v))
        }
    }, [display, shouldAnimate])

    // Set initial value
    useEffect(() => {
        springValue.set(value)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    if (!shouldAnimate) {
        return <span style={style}>{displayText}</span>
    }

    return (
        <motion.span
            style={style}
            data-testid="animated-number"
        >
            {displayText}
        </motion.span>
    )
}
