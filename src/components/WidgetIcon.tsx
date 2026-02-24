/**
 * WidgetIcon — centralized icon registry for widget types.
 *
 * Maps widget type strings to Lucide React icon components.
 * Includes animated variants for loading/active states.
 *
 * Usage:
 *   <WidgetIcon type="agent" size={16} />
 *   <AnimatedIcon name="spinner" size={20} />
 */

import { motion } from 'framer-motion'
import {
    Sparkles, Terminal, Package, CheckCircle2, StickyNote, Cpu,
    Bot, Braces, Code2, FileCode2, FileText, FolderTree,
    GitBranch, GitPullRequest, Globe, Hash, Layers, ListChecks,
    MessageSquare, Network, Play, Puzzle, Shield, Workflow, Zap,
    Database, Cloud, CloudUpload, CloudDownload, Lock, Unlock,
    Bell, BellRing, Eye, EyeOff, Bookmark, Heart, Star, Flame,
    Rocket, Send, Download, Upload, RefreshCw, Radio, Wifi,
    Activity, BarChart3, PieChart, Gauge, Hourglass, Radar, Scan,
    Target, Crosshair, Mic, Volume2,
    AlertTriangle, CheckCircle, Circle, CircleDot, Loader2, Timer, XCircle,
    Search, Clock, Magnet, Telescope, Satellite,
    Rewind, type LucideProps,
} from 'lucide-react'

// ── Icon mapping ────────────────────────────────────────────────────────────────

export type WidgetIconName =
    | 'agent' | 'script-js' | 'script-ts' | 'script-sh' | 'script-py'
    | 'group' | 'expectation' | 'note'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
    'agent': Sparkles, 'script-js': Terminal, 'script-ts': Terminal,
    'script-sh': Terminal, 'script-py': Terminal, 'group': Package,
    'expectation': CheckCircle2, 'note': StickyNote,
    'note-sticker': StickyNote, 'note-group': Package, 'note-label': StickyNote,
    'bot': Bot, 'api': Globe, 'webhook': Zap, 'workflow': Workflow,
    'function': Braces, 'code': Code2, 'file': FileCode2, 'doc': FileText,
    'folder': FolderTree, 'branch': GitBranch, 'pr': GitPullRequest,
    'chat': MessageSquare, 'network': Network, 'puzzle': Puzzle,
    'shield': Shield, 'checklist': ListChecks, 'hash': Hash,
    'layer': Layers, 'play': Play,
    'database': Database, 'cloud': Cloud, 'cloud-up': CloudUpload,
    'cloud-down': CloudDownload, 'lock': Lock, 'unlock': Unlock,
    'bell': Bell, 'bell-ring': BellRing, 'eye': Eye, 'eye-off': EyeOff,
    'bookmark': Bookmark, 'heart': Heart, 'star': Star, 'flame': Flame,
    'rocket': Rocket, 'send': Send, 'download': Download, 'upload': Upload,
    'sync': RefreshCw, 'radio': Radio, 'wifi': Wifi, 'activity': Activity,
    'bar-chart': BarChart3, 'pie-chart': PieChart, 'gauge': Gauge,
    'radar': Radar, 'scan': Scan, 'target': Target, 'crosshair': Crosshair,
    'mic': Mic, 'volume': Volume2,
}

export const WIDGET_ICON_COLORS: Record<string, string> = {
    'agent': '#8b5cf6', 'script-js': '#f7df1e', 'script-ts': '#3178c6',
    'script-sh': '#89e051', 'script-py': '#3776ab', 'group': '#6366f1',
    'expectation': '#10b981', 'note': '#f59e0b', 'note-sticker': '#fbbf24',
    'note-group': '#6366f1', 'note-label': '#94a3b8',
    'bot': '#8b5cf6', 'api': '#06b6d4', 'webhook': '#f97316',
    'workflow': '#a855f7', 'function': '#ec4899', 'code': '#60a5fa',
    'file': '#3b82f6', 'doc': '#94a3b8', 'folder': '#f59e0b',
    'branch': '#22c55e', 'pr': '#22c55e', 'chat': '#06b6d4',
    'network': '#8b5cf6', 'puzzle': '#f59e0b', 'shield': '#ef4444',
    'checklist': '#10b981', 'hash': '#6366f1', 'layer': '#a855f7',
    'play': '#22c55e',
    'database': '#f59e0b', 'cloud': '#60a5fa', 'cloud-up': '#22c55e',
    'cloud-down': '#3b82f6', 'lock': '#ef4444', 'unlock': '#22c55e',
    'bell': '#f59e0b', 'bell-ring': '#f97316', 'eye': '#8b5cf6',
    'eye-off': '#64748b', 'bookmark': '#f59e0b', 'heart': '#ef4444',
    'star': '#fbbf24', 'flame': '#f97316', 'rocket': '#8b5cf6',
    'send': '#3b82f6', 'download': '#22c55e', 'upload': '#3b82f6',
    'sync': '#06b6d4', 'radio': '#8b5cf6', 'wifi': '#22c55e',
    'activity': '#ef4444', 'bar-chart': '#3b82f6', 'pie-chart': '#a855f7',
    'gauge': '#f97316', 'radar': '#06b6d4', 'scan': '#22c55e',
    'target': '#ef4444', 'crosshair': '#64748b', 'mic': '#ef4444',
    'volume': '#3b82f6',
}

export const CATEGORY_ICONS: Record<string, React.ComponentType<LucideProps>> = {
    'AI': Sparkles, 'Script': Terminal, 'Expectation': CheckCircle2,
    'Note': StickyNote, 'Layout': Package, 'Integration': Globe,
    'Workflow': Workflow, 'Dev': Code2,
}

export const STATUS_ICONS: Record<string, React.ComponentType<LucideProps>> = {
    'idle': Circle, 'pending': CircleDot, 'running': Loader2,
    'done': CheckCircle, 'error': XCircle, 'warning': AlertTriangle, 'timer': Timer,
}

export const STATUS_COLORS: Record<string, string> = {
    'idle': '#64748b', 'pending': '#f59e0b', 'running': '#3b82f6',
    'done': '#22c55e', 'error': '#ef4444', 'warning': '#f97316', 'timer': '#8b5cf6',
}

// ── Component ────────────────────────────────────────────────────────────────────

interface WidgetIconProps {
    type: string; size?: number; color?: string
    className?: string; style?: React.CSSProperties
}

export function WidgetIcon({ type, size = 16, color, className, style }: WidgetIconProps) {
    const Icon = ICON_MAP[type] || Cpu
    return <Icon size={size} color={color || WIDGET_ICON_COLORS[type] || '#8b5cf6'} className={className} style={style} />
}

// ── Animated Icons ──────────────────────────────────────────────────────────────

export type AnimatedIconName =
    | 'spinner' | 'pulse' | 'thinking' | 'loading-dots' | 'processing' | 'success' | 'error-shake'
    | 'radar' | 'data-stream' | 'heartbeat' | 'orbit' | 'wave' | 'typing'
    | 'sync' | 'download' | 'signal' | 'hourglass' | 'ripple' | 'scan-line'
    // ── New: 30 additional animated icons ──
    | 'progress-ring' | 'progress-bar' | 'loading-wave' | 'bounce'
    | 'gear-spin' | 'upload-pulse' | 'search-scan' | 'clock-tick'
    | 'alert-flash' | 'check-bounce' | 'crossfade' | 'dna-helix'
    | 'fire-flicker' | 'lightning-bolt' | 'magnet-pull' | 'matrix-rain'
    | 'morse-code' | 'pendulum' | 'ping-pong' | 'pixel-load'
    | 'progress-dots' | 'radio-wave' | 'rewind' | 'satellite'
    | 'sparkle-burst' | 'stack-build' | 'telescope' | 'terminal-blink'
    | 'traffic-light' | 'waveform'

interface AnimatedIconProps {
    name: AnimatedIconName; size?: number; color?: string; style?: React.CSSProperties
}

export function AnimatedIcon({ name, size = 16, color = '#8b5cf6', style }: AnimatedIconProps) {
    const s = { display: 'inline-flex' as const, ...style }
    switch (name) {
        case 'spinner':
            return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={s}><Loader2 size={size} color={color} /></motion.div>

        case 'pulse':
            return <motion.div animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={s}><Circle size={size} color={color} fill={color} /></motion.div>

        case 'thinking':
            return <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={s}><Sparkles size={size} color={color} /></motion.div>

        case 'loading-dots':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.25, alignItems: 'center', ...style }}>
                    {[0, 1, 2].map(i => <motion.div key={i} animate={{ y: [0, -(size * 0.3), 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} style={{ width: size * 0.2, height: size * 0.2, borderRadius: '50%', background: color }} />)}
                </div>
            )

        case 'processing':
            return <motion.div animate={{ rotate: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={s}><Cpu size={size} color={color} /></motion.div>

        case 'success':
            return <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5, ease: 'easeOut' }} style={s}><CheckCircle size={size} color={color} /></motion.div>

        case 'error-shake':
            return <motion.div animate={{ x: [0, -3, 3, -3, 3, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }} style={s}><XCircle size={size} color={color} /></motion.div>

        case 'radar':
            return <motion.div animate={{ rotate: 360, opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={s}><Radar size={size} color={color} /></motion.div>

        case 'data-stream':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.12, alignItems: 'end', height: size, ...style }}>
                    {[0, 1, 2, 3, 4].map(i => <motion.div key={i} animate={{ height: [size * 0.2, size * 0.8, size * 0.2] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} style={{ width: size * 0.12, borderRadius: size * 0.06, background: color }} />)}
                </div>
            )

        case 'heartbeat':
            return <motion.div animate={{ scale: [1, 1.25, 1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', times: [0, 0.15, 0.3, 0.45, 0.6] }} style={s}><Heart size={size} color={color} fill={color} /></motion.div>

        case 'orbit':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', ...style }}>
                    <Circle size={size * 0.35} color={color} fill={color} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
                    {[0, 1, 2].map(i => (
                        <motion.div key={i} animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: i * 0.66 }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            <div style={{ width: size * 0.18, height: size * 0.18, borderRadius: '50%', background: color, position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', opacity: 0.8 }} />
                        </motion.div>
                    ))}
                </div>
            )

        case 'wave':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.08, alignItems: 'center', height: size, ...style }}>
                    {[0, 1, 2, 3, 4].map(i => <motion.div key={i} animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} style={{ width: size * 0.1, height: size * 0.7, borderRadius: size * 0.05, background: color, transformOrigin: 'center' }} />)}
                </div>
            )

        case 'typing':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.2, alignItems: 'center', ...style }}>
                    {[0, 1, 2].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }} style={{ width: size * 0.22, height: size * 0.22, borderRadius: '50%', background: color }} />)}
                </div>
            )

        case 'sync':
            return <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 1.5, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }} style={s}><RefreshCw size={size} color={color} /></motion.div>

        case 'download':
            return <motion.div animate={{ y: [0, 3, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} style={s}><Download size={size} color={color} /></motion.div>

        case 'signal':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
                    <Radio size={size * 0.5} color={color} style={{ position: 'relative', zIndex: 1 }} />
                    {[0, 1, 2].map(i => <motion.div key={i} animate={{ scale: [0.5, 1.5], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }} style={{ position: 'absolute', width: size * 0.6, height: size * 0.6, borderRadius: '50%', border: `1.5px solid ${color}` }} />)}
                </div>
            )

        case 'hourglass':
            return <motion.div animate={{ rotate: [0, 0, 180, 180] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 0.55, 1] }} style={s}><Hourglass size={size} color={color} /></motion.div>

        case 'ripple':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
                    <div style={{ width: size * 0.25, height: size * 0.25, borderRadius: '50%', background: color, position: 'relative', zIndex: 1 }} />
                    {[0, 1, 2].map(i => <motion.div key={i} animate={{ scale: [0.3, 2.5], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.66, ease: 'easeOut' }} style={{ position: 'absolute', width: size * 0.4, height: size * 0.4, borderRadius: '50%', border: `1px solid ${color}` }} />)}
                </div>
            )

        case 'scan-line':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', overflow: 'hidden', ...style }}>
                    <Scan size={size} color={color} style={{ opacity: 0.4 }} />
                    <motion.div animate={{ y: [0, size, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 2, background: color, boxShadow: `0 0 6px ${color}` }} />
                </div>
            )

        // ═══════════════════════════════════════════════════════════════════════
        // ── NEW: 30 additional animated icons ────────────────────────────────
        // ═══════════════════════════════════════════════════════════════════════

        // ── Progress & Loading ──────────────────────────────────────────────

        case 'progress-ring':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', ...style }}>
                    <svg width={size} height={size} viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke={`${color}22`} strokeWidth="3" />
                        <motion.circle cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray="97.4" initial={{ strokeDashoffset: 97.4 }}
                            animate={{ strokeDashoffset: [97.4, 0, 97.4] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }} />
                    </svg>
                </div>
            )

        case 'progress-bar':
            return (
                <div style={{ width: size * 1.5, height: size * 0.25, borderRadius: size * 0.125, background: `${color}22`, overflow: 'hidden', ...style }}>
                    <motion.div animate={{ x: ['-100%', '200%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: '40%', height: '100%', borderRadius: size * 0.125, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
                </div>
            )

        case 'loading-wave':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.06, alignItems: 'center', height: size, ...style }}>
                    {[0, 1, 2, 3, 4, 5, 6].map(i => <motion.div key={i} animate={{ scaleY: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }} style={{ width: size * 0.08, height: size * 0.6, borderRadius: size * 0.04, background: color, transformOrigin: 'center' }} />)}
                </div>
            )

        case 'bounce':
            return <motion.div animate={{ y: [0, -(size * 0.5), 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: [0.36, 0, 0.66, -0.56] }} style={s}><Circle size={size * 0.5} color={color} fill={color} /></motion.div>

        case 'progress-dots':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.3, alignItems: 'center', ...style }}>
                    {[0, 1, 2, 3, 4].map(i => <motion.div key={i} animate={{ opacity: [0.15, 1, 0.15] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }} style={{ width: size * 0.18, height: size * 0.18, borderRadius: '50%', background: color }} />)}
                </div>
            )

        case 'pixel-load':
            return (
                <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: size * 0.08, width: size, height: size, ...style }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => <motion.div key={i} animate={{ opacity: [0.1, 1, 0.1] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} style={{ borderRadius: size * 0.04, background: color }} />)}
                </div>
            )

        // ── Status & Feedback ────────────────────────────────────────────────

        case 'alert-flash':
            return <motion.div animate={{ opacity: [1, 0.2, 1], scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} style={s}><AlertTriangle size={size} color={color} /></motion.div>

        case 'check-bounce':
            return <motion.div animate={{ y: [0, -4, 0], scale: [1, 1.15, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeOut' }} style={s}><CheckCircle size={size} color={color} /></motion.div>

        case 'traffic-light':
            return (
                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: size * 0.12, alignItems: 'center', ...style }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => <motion.div key={i} animate={{ opacity: [0.2, 0.2, 1, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: 'easeInOut' }} style={{ width: size * 0.3, height: size * 0.3, borderRadius: '50%', background: c }} />)}
                </div>
            )

        // ── Tool/Action ──────────────────────────────────────────────────────

        case 'gear-spin':
            return <motion.div animate={{ rotate: [0, 120, 240, 360] }} transition={{ duration: 3, repeat: Infinity, ease: [0.4, 0, 0.2, 1], times: [0, 0.33, 0.66, 1] }} style={s}><Cpu size={size} color={color} /></motion.div>

        case 'upload-pulse':
            return <motion.div animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} style={s}><Upload size={size} color={color} /></motion.div>

        case 'search-scan':
            return <motion.div animate={{ x: [-2, 2, -2], rotate: [0, 5, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={s}><Search size={size} color={color} /></motion.div>

        case 'clock-tick':
            return <motion.div animate={{ rotate: [0, 0, 6, 0] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeOut', times: [0, 0.85, 0.9, 1] }} style={s}><Clock size={size} color={color} /></motion.div>

        case 'terminal-blink':
            return (
                <div style={{ position: 'relative', display: 'inline-flex', ...style }}>
                    <Terminal size={size} color={color} />
                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ position: 'absolute', bottom: size * 0.2, right: size * 0.2, width: size * 0.15, height: size * 0.35, background: color }} />
                </div>
            )

        case 'rewind':
            return <motion.div animate={{ rotate: [0, -360] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} style={s}><Rewind size={size} color={color} /></motion.div>

        // ── Data & Visualization ─────────────────────────────────────────────

        case 'waveform':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.06, alignItems: 'center', height: size, ...style }}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                        const h = [0.3, 0.6, 0.9, 0.5, 0.7, 1.0, 0.4, 0.8][i]
                        return <motion.div key={i} animate={{ scaleY: [h, 1 - h + 0.2, h] }} transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }} style={{ width: size * 0.07, height: size * 0.7, borderRadius: size * 0.035, background: color, transformOrigin: 'center' }} />
                    })}
                </div>
            )

        case 'radio-wave':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
                    <Radio size={size * 0.35} color={color} style={{ position: 'relative', zIndex: 1 }} />
                    {[0, 1, 2, 3].map(i => <motion.div key={i} animate={{ scale: [0.3, 2], opacity: [0.8, 0], borderWidth: [2, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }} style={{ position: 'absolute', width: size * 0.5, height: size * 0.5, borderRadius: '50%', border: `2px solid ${color}` }} />)}
                </div>
            )

        case 'matrix-rain':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.08, alignItems: 'flex-start', height: size, overflow: 'hidden', ...style }}>
                    {[0, 1, 2, 3, 4].map(i => <motion.div key={i} animate={{ y: [-(size * 0.5), size] }} transition={{ duration: 1 + i * 0.2, repeat: Infinity, delay: i * 0.3, ease: 'linear' }} style={{ width: size * 0.12, height: size * 0.3, borderRadius: size * 0.06, background: `linear-gradient(180deg, transparent, ${color})`, opacity: 0.8 }} />)}
                </div>
            )

        case 'stack-build':
            return (
                <div style={{ display: 'inline-flex', flexDirection: 'column-reverse', gap: size * 0.06, alignItems: 'center', ...style }}>
                    {[0, 1, 2, 3].map(i => <motion.div key={i} initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }} style={{ width: size * (0.5 + i * 0.12), height: size * 0.15, borderRadius: size * 0.04, background: color }} />)}
                </div>
            )

        // ── Effects & Decorative ─────────────────────────────────────────────

        case 'crossfade':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', ...style }}>
                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute' }}><Circle size={size} color={color} fill={`${color}33`} /></motion.div>
                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute' }}><CircleDot size={size} color={color} /></motion.div>
                </div>
            )

        case 'dna-helix':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.04, alignItems: 'center', height: size, ...style }}>
                    {[0, 1, 2, 3, 4, 5].map(i => <motion.div key={i} animate={{ y: [-(size * 0.2), size * 0.2, -(size * 0.2)] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }} style={{ width: size * 0.1, height: size * 0.1, borderRadius: '50%', background: i % 2 === 0 ? color : `${color}66` }} />)}
                </div>
            )

        case 'fire-flicker':
            return <motion.div animate={{ y: [0, -2, 0, -1, 0], scale: [1, 1.1, 0.95, 1.05, 1], opacity: [0.8, 1, 0.85, 1, 0.8] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} style={s}><Flame size={size} color={color} /></motion.div>

        case 'lightning-bolt':
            return <motion.div animate={{ opacity: [0.3, 1, 0.3, 1, 0.3], scale: [0.95, 1.1, 0.95, 1.05, 0.95] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', times: [0, 0.1, 0.2, 0.25, 1] }} style={s}><Zap size={size} color={color} /></motion.div>

        case 'magnet-pull':
            return <motion.div animate={{ rotate: [0, 10, -10, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={s}><Magnet size={size} color={color} /></motion.div>

        case 'sparkle-burst':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
                    <motion.div animate={{ scale: [0.8, 1.2, 0.8], rotate: [0, 180, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}><Sparkles size={size * 0.6} color={color} /></motion.div>
                    {[0, 1, 2, 3].map(i => <motion.div key={i} animate={{ scale: [0, 1, 0], opacity: [0, 0.8, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.375, ease: 'easeOut' }} style={{ position: 'absolute', width: size * 0.12, height: size * 0.12, borderRadius: '50%', background: color, top: `${20 + 20 * Math.sin(i * Math.PI / 2)}%`, left: `${20 + 20 * Math.cos(i * Math.PI / 2)}%` }} />)}
                </div>
            )

        case 'morse-code':
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.1, alignItems: 'center', ...style }}>
                    {[0.15, 0.4, 0.15, 0.15, 0.4].map((w, i) => <motion.div key={i} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1.5, delay: i * 0.2, ease: 'linear' }} style={{ width: size * w, height: size * 0.15, borderRadius: size * 0.075, background: color }} />)}
                </div>
            )

        case 'pendulum':
            return <motion.div animate={{ rotate: [-30, 30, -30] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={{ ...s, transformOrigin: 'top center' }}><Activity size={size} color={color} /></motion.div>

        case 'ping-pong':
            return <motion.div animate={{ x: [-(size * 0.3), size * 0.3, -(size * 0.3)] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} style={s}><div style={{ width: size * 0.25, height: size * 0.25, borderRadius: '50%', background: color }} /></motion.div>

        case 'satellite':
            return (
                <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
                        <Satellite size={size * 0.6} color={color} />
                    </motion.div>
                    <motion.div animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                        style={{ position: 'absolute', width: size * 0.8, height: size * 0.8, borderRadius: '50%', border: `1px solid ${color}` }} />
                </div>
            )

        case 'telescope':
            return <motion.div animate={{ rotate: [0, -5, 5, 0], y: [0, -2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} style={s}><Telescope size={size} color={color} /></motion.div>

        default:
            return <Cpu size={size} color={color} style={style} />
    }
}

// ── Utility ─────────────────────────────────────────────────────────────────────

export function getWidgetIconComponent(type: string): React.ComponentType<LucideProps> {
    return ICON_MAP[type] || Cpu
}

export interface IconEntry {
    name: string; type: string
    component: React.ComponentType<LucideProps>
    color: string; category: string
}

export function getAllIconEntries(): IconEntry[] {
    return Object.entries(ICON_MAP).map(([type, component]) => ({
        name: component.displayName || type,
        type,
        component,
        color: WIDGET_ICON_COLORS[type] || '#8b5cf6',
        category: type.startsWith('script-') ? 'Script' : type.startsWith('note-') ? 'Note' : 'Widget',
    }))
}
