import { Handle, Position, NodeToolbar } from '@xyflow/react'
import { Construction } from 'lucide-react'
import { WidgetIcon } from '@/components/WidgetIcon'
import { useCallback, useRef } from 'react'
import { WidgetSelector } from '@/components/WidgetSelector'

/**
 * PlaceholderNode — dashed "under construction" node.
 *
 * data.width / data.height — node dimensions (pixels)
 * data.gridCols / data.gridRows — grid cell counts for display
 * data.sizing — true during auto-resize phase
 * data.resizable — true when placed (enables bottom-right drag handle)
 * data.onResize — callback(width, height) for resize handle drag
 * data.hoveredWidget — WidgetDefinition | null for preview on hover
 * data.showSelector — true to show WidgetSelector via NodeToolbar
 * data.onSelectWidget — callback(widget, template) for WidgetSelector
 * data.onCancelSelector — callback for cancelling selection
 * data.onHoverWidget — callback(widget|null) for hover preview
 */
export function PlaceholderNode({ data }: { data: any }) {
    const sizing = data.sizing
    const resizable = data.resizable
    const w = data.width || 160
    const h = data.height || 100
    const gridCols = data.gridCols || '?'
    const gridRows = data.gridRows || '?'
    const hoveredWidget = data.hoveredWidget
    const showSelector = data.showSelector

    // ── Resize handle drag ──
    const dragRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)

    const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        dragRef.current = { startX: e.clientX, startY: e.clientY, startW: w, startH: h }

        const onMouseMove = (ev: MouseEvent) => {
            if (!dragRef.current) return
            const dx = ev.clientX - dragRef.current.startX
            const dy = ev.clientY - dragRef.current.startY
            const newW = Math.max(40, dragRef.current.startW + dx)
            const newH = Math.max(40, dragRef.current.startH + dy)
            data.onResize?.(newW, newH)
        }

        const onMouseUp = () => {
            dragRef.current = null
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }, [w, h, data])

    // ── Widget preview (on hover) ──
    const showPreview = !!hoveredWidget && !sizing

    return (
        <>
            {/* NodeToolbar — WidgetSelector that moves with pan/zoom */}
            <NodeToolbar
                isVisible={!!showSelector}
                position={Position.Right}
                offset={16}
                align="start"
                style={{ zIndex: 1000 }}
            >
                <WidgetSelector
                    rectSize={{ width: w, height: h }}
                    gridSize={{ cols: gridCols, rows: gridRows }}
                    onSelect={(widget, template) => data.onSelectWidget?.(widget, template)}
                    onCancel={() => data.onCancelSelector?.()}
                    onHoverWidget={(widget) => data.onHoverWidget?.(widget)}
                    embedded
                />
            </NodeToolbar>

            <div
                style={{
                    width: w,
                    height: h,
                    border: `2px dashed ${showPreview ? 'rgba(139,92,246,0.7)' : 'rgba(139,92,246,0.5)'}`,
                    borderRadius: 10,
                    background: showPreview
                        ? 'rgba(139,92,246,0.08)'
                        : sizing
                            ? 'rgba(139,92,246,0.04)'
                            : 'rgba(139,92,246,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                    transition: sizing ? 'none' : 'all 0.15s ease',
                    userSelect: 'none',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Handles */}
                <Handle type="target" position={Position.Left} style={{
                    background: '#8b5cf6', border: '2px solid rgba(139,92,246,0.3)', width: 8, height: 8,
                }} />
                <Handle type="source" position={Position.Right} style={{
                    background: '#64748b', border: '2px solid rgba(100,116,139,0.3)', width: 8, height: 8,
                }} />

                {showPreview ? (
                    /* ── Widget hover preview ── */
                    <>
                        <div style={{ fontSize: 24, opacity: 0.7, marginBottom: 2 }}>
                            <WidgetIcon type={hoveredWidget.type || ''} size={24} />
                        </div>
                        <div style={{
                            fontSize: 11, fontWeight: 600, color: '#8b5cf6',
                            fontFamily: 'Inter', textAlign: 'center', padding: '0 8px',
                        }}>
                            {hoveredWidget.name}
                        </div>
                        <div style={{
                            fontSize: 8, color: 'rgba(139,92,246,0.6)', fontFamily: 'Inter',
                            textAlign: 'center', padding: '0 12px', lineHeight: 1.3,
                            maxHeight: h - 60, overflow: 'hidden',
                        }}>
                            {hoveredWidget.description}
                        </div>
                        <div style={{
                            fontSize: 8, color: 'rgba(139,92,246,0.4)',
                            fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, marginTop: 2,
                        }}>
                            {gridCols}×{gridRows}
                        </div>
                    </>
                ) : (
                    /* ── Default placeholder content ── */
                    <>
                        <Construction size={sizing ? 16 : 20} style={{ color: 'rgba(139,92,246,0.5)' }} />
                        <div style={{
                            fontSize: 10, color: 'rgba(139,92,246,0.7)',
                            fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                        }}>
                            {gridCols}×{gridRows}
                        </div>
                        <div style={{
                            fontSize: 8, color: 'rgba(139,92,246,0.4)',
                            fontFamily: 'Inter', fontWeight: 500,
                            letterSpacing: 0.5, textTransform: 'uppercase',
                        }}>
                            {sizing ? 'sizing...' : resizable ? 'drag corner to resize' : 'select widget'}
                        </div>
                    </>
                )}

                {/* Corner markers when sizing */}
                {sizing && (
                    <>
                        {[
                            { top: 4, left: 4 }, { top: 4, right: 4 },
                            { bottom: 4, left: 4 }, { bottom: 4, right: 4 },
                        ].map((pos, i) => (
                            <div key={i} style={{
                                position: 'absolute', ...pos, width: 6, height: 6,
                                borderTop: pos.top !== undefined ? '1.5px solid rgba(139,92,246,0.4)' : 'none',
                                borderBottom: pos.bottom !== undefined ? '1.5px solid rgba(139,92,246,0.4)' : 'none',
                                borderLeft: pos.left !== undefined ? '1.5px solid rgba(139,92,246,0.4)' : 'none',
                                borderRight: pos.right !== undefined ? '1.5px solid rgba(139,92,246,0.4)' : 'none',
                            }} />
                        ))}
                    </>
                )}

                {/* Resize handle (bottom-right) */}
                {resizable && (
                    <div
                        className="nodrag nopan"
                        onMouseDown={onResizeMouseDown}
                        style={{
                            position: 'absolute', bottom: -4, right: -4,
                            width: 12, height: 12, borderRadius: 2,
                            background: '#8b5cf6', border: '1.5px solid rgba(139,92,246,0.6)',
                            cursor: 'nwse-resize', zIndex: 10,
                            boxShadow: '0 0 4px rgba(139,92,246,0.3)',
                        }}
                    />
                )}
            </div>
        </>
    )
}
