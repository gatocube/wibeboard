/**
 * StepPlayer — transport controls + step indicator for scenario playback.
 *
 * Shows: step counter, label, prev/next/play/pause/reset buttons.
 */

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react'
import { StepStore } from './automerge-store'

interface StepPlayerProps {
    store: StepStore
}

export function StepPlayer({ store }: StepPlayerProps) {
    const [state, setState] = useState(store.getState())
    const [playing, setPlaying] = useState(false)

    useEffect(() => {
        return store.subscribe(() => {
            setState(store.getState())
            setPlaying(store.isPlaying)
        })
    }, [store])

    const handlePrev = useCallback(() => store.prev(), [store])
    const handleNext = useCallback(() => store.next(), [store])
    const handleReset = useCallback(() => store.reset(), [store])
    const handlePlayPause = useCallback(() => {
        if (store.isPlaying) {
            store.stopPlay()
        } else {
            store.startPlay(600)
        }
    }, [store])

    const step = state.stepIndex
    const total = store.totalSteps

    return (
        <div
            data-testid="step-player"
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px',
                background: 'rgba(15,15,30,0.95)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                userSelect: 'none',
            }}
        >
            {/* Transport controls */}
            <div style={{ display: 'flex', gap: 2 }}>
                <ControlButton
                    testId="btn-reset"
                    icon={<RotateCcw size={12} />}
                    onClick={handleReset}
                    title="Reset"
                />
                <ControlButton
                    testId="btn-prev"
                    icon={<SkipBack size={12} />}
                    onClick={handlePrev}
                    disabled={step < 0}
                    title="Previous step"
                />
                <ControlButton
                    testId="btn-play"
                    icon={playing ? <Pause size={12} /> : <Play size={12} />}
                    onClick={handlePlayPause}
                    disabled={state.completed}
                    accent
                    title={playing ? 'Pause' : 'Play'}
                />
                <ControlButton
                    testId="btn-next"
                    icon={<SkipForward size={12} />}
                    onClick={handleNext}
                    disabled={state.completed}
                    title="Next step"
                />
            </div>

            {/* Step indicator */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#8b5cf6', fontWeight: 600 }}>
                    {step < 0 ? '—' : `${step + 1}/${total}`}
                </span>
                <span data-testid="step-label" style={{ color: '#94a3b8' }}>
                    {state.stepLabel}
                </span>
            </div>

            {/* Progress bar */}
            <div style={{
                width: 100, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
            }}>
                <div style={{
                    width: `${total > 0 ? ((step + 1) / total) * 100 : 0}%`,
                    height: '100%', borderRadius: 2,
                    background: state.completed ? '#28c840' : '#8b5cf6',
                    transition: 'width 0.3s',
                }} />
            </div>
        </div>
    )
}


function ControlButton({ icon, onClick, disabled, accent, title, testId }: {
    icon: React.ReactNode
    onClick: () => void
    disabled?: boolean
    accent?: boolean
    title: string
    testId: string
}) {
    return (
        <button
            data-testid={testId}
            onClick={onClick}
            disabled={disabled}
            title={title}
            style={{
                width: 26, height: 26, borderRadius: 5, border: 'none',
                background: accent ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                color: disabled ? '#334155' : accent ? '#8b5cf6' : '#94a3b8',
                cursor: disabled ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: disabled ? 0.4 : 1,
                transition: 'all 0.15s',
            }}
        >
            {icon}
        </button>
    )
}
