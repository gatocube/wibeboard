/**
 * EventsPanel — collapsible bottom panel showing AgentMessenger events.
 *
 * Displays all messages sent by script nodes with timestamp,
 * sender, and payload. Sits at the bottom of the FlowStudio canvas.
 */

import { useState } from 'react'

export interface FlowEvent {
    id: string
    timestamp: number
    nodeId: string
    nodeName: string
    type: 'message' | 'log' | 'error'
    content: string
}

export function EventsPanel({ events }: { events: FlowEvent[] }) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div
            data-testid="events-panel"
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 20,
                background: 'rgba(10, 10, 20, 0.95)',
                borderTop: '1px solid rgba(139, 92, 246, 0.2)',
                backdropFilter: 'blur(12px)',
                fontFamily: "'JetBrains Mono', monospace",
                transition: 'all 0.2s',
            }}
        >
            {/* Header */}
            <div
                data-testid="events-panel-header"
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#8b5cf6' }}>⚡</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.5px' }}>
                        EVENTS
                    </span>
                    {events.length > 0 && (
                        <span style={{
                            fontSize: 8,
                            color: '#8b5cf6',
                            background: 'rgba(139,92,246,0.15)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontWeight: 600,
                        }}>
                            {events.length}
                        </span>
                    )}
                </div>
                <span style={{ fontSize: 10, color: '#475569' }}>
                    {collapsed ? '▲' : '▼'}
                </span>
            </div>

            {/* Event list */}
            {!collapsed && (
                <div
                    data-testid="events-list"
                    style={{
                        maxHeight: 120,
                        overflowY: 'auto',
                        padding: '4px 0',
                    }}
                >
                    {events.length === 0 ? (
                        <div style={{
                            padding: '8px 12px',
                            fontSize: 9,
                            color: '#334155',
                            fontStyle: 'italic',
                        }}>
                            No events yet — run a script to see messages here
                        </div>
                    ) : (
                        events.map(evt => (
                            <div
                                key={evt.id}
                                data-testid={`event-${evt.id}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: 8,
                                    padding: '2px 12px',
                                    fontSize: 9,
                                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                                }}
                            >
                                <span style={{ color: '#475569', flexShrink: 0, fontSize: 8 }}>
                                    {new Date(evt.timestamp).toLocaleTimeString('en-US', {
                                        hour12: false,
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                    })}
                                </span>
                                <span style={{
                                    color: evt.type === 'error' ? '#ef4444'
                                        : evt.type === 'message' ? '#8b5cf6'
                                            : '#64748b',
                                    flexShrink: 0,
                                    fontWeight: 600,
                                    fontSize: 8,
                                }}>
                                    {evt.nodeName}
                                </span>
                                <span style={{
                                    color: evt.type === 'error' ? '#fca5a5' : '#94a3b8',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {evt.content}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
