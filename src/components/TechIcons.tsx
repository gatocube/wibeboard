/**
 * TechIcons — custom SVG icon components for technology logos.
 *
 * These are simplified, recognizable representations of tech brand logos
 * rendered as inline SVGs. Lucide doesn't include brand icons, so these
 * are hand-crafted SVG paths.
 *
 * Usage:
 *   <TechIcon name="react" size={24} />
 *   <TechIcon name="typescript" size={20} color="#3178c6" />
 */

import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'

interface TechIconProps {
    name: TechIconName
    size?: number
    color?: string
    style?: CSSProperties
}

export type TechIconName =
    | 'react' | 'vue' | 'nextjs' | 'svelte' | 'angular'
    | 'typescript' | 'javascript' | 'python' | 'rust' | 'go'
    | 'git' | 'github' | 'docker' | 'nodejs' | 'deno'

const TECH_COLORS: Record<TechIconName, string> = {
    react: '#61dafb', vue: '#42b883', nextjs: '#ffffff', svelte: '#ff3e00', angular: '#dd0031',
    typescript: '#3178c6', javascript: '#f7df1e', python: '#3776ab', rust: '#dea584', go: '#00add8',
    git: '#f05032', github: '#ffffff', docker: '#2496ed', nodejs: '#339933', deno: '#ffffff',
}

export function TechIcon({ name, size = 16, color, style }: TechIconProps) {
    const c = color || TECH_COLORS[name] || '#8b5cf6'
    const s = size
    const svgProps = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', style }

    switch (name) {
        case 'react':
            // Atom symbol with orbiting electrons
            return (
                <svg {...svgProps}>
                    <circle cx="12" cy="12" r="2.5" fill={c} />
                    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={c} strokeWidth="1" fill="none" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={c} strokeWidth="1" fill="none" transform="rotate(60 12 12)" />
                    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={c} strokeWidth="1" fill="none" transform="rotate(120 12 12)" />
                </svg>
            )

        case 'vue':
            // V-shaped double chevron
            return (
                <svg {...svgProps}>
                    <path d="M2 3h4l6 10.5L18 3h4L12 22z" fill={c} opacity="0.5" />
                    <path d="M6 3h3l3 5.5L15 3h3L12 16z" fill={c} />
                </svg>
            )

        case 'nextjs':
            // N in circle
            return (
                <svg {...svgProps}>
                    <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.5" fill="none" />
                    <path d="M8 16V8l9.5 12" stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <line x1="16" y1="8" x2="16" y2="13" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            )

        case 'svelte':
            // S-shaped flame
            return (
                <svg {...svgProps}>
                    <path d="M18 3.5c-2-2.5-6-2.5-8-.5L5 7c-2 2-2 5 0 7l.5.5c-1 2 .5 4.5 2.5 5.5 2 1 5 .5 6.5-1.5l5-4c2-2 2-5 0-7l-.5-.5c1-2-.5-4.5-2.5-5.5z" stroke={c} strokeWidth="1.5" fill="none" />
                    <path d="M10 14l4-3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )

        case 'angular':
            // Angular shield/A shape
            return (
                <svg {...svgProps}>
                    <path d="M12 2L3 6l1.5 12L12 22l7.5-4L21 6z" stroke={c} strokeWidth="1.5" fill="none" />
                    <path d="M12 6l-4.5 10h2l1-2.5h3l1 2.5h2z" fill={c} />
                    <path d="M10.5 12L12 8l1.5 4z" fill="#0d1117" />
                </svg>
            )

        case 'typescript':
            // TS in rounded rect
            return (
                <svg {...svgProps}>
                    <rect x="2" y="2" width="20" height="20" rx="3" fill={c} />
                    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#fff">TS</text>
                </svg>
            )

        case 'javascript':
            // JS in rounded rect
            return (
                <svg {...svgProps}>
                    <rect x="2" y="2" width="20" height="20" rx="3" fill={c} />
                    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fontFamily="monospace" fill="#000">JS</text>
                </svg>
            )

        case 'python':
            // Intertwined snakes
            return (
                <svg {...svgProps}>
                    <path d="M11.5 2C8 2 8 4 8 4v3h4v1H6s-4-.5-4 4 3 4 3 4h2v-3s0-2 2-2h4s2 0 2-2V4s0-2-3.5-2z" fill={c} />
                    <path d="M12.5 22c3.5 0 3.5-2 3.5-2v-3h-4v-1h6s4 .5 4-4-3-4-3-4h-2v3s0 2-2 2h-4s-2 0-2 2v4s0 2 3.5 2z" fill="#ffd43b" />
                    <circle cx="10" cy="5" r="1" fill="#fff" />
                    <circle cx="14" cy="19" r="1" fill="#fff" />
                </svg>
            )

        case 'rust':
            // Gear with R
            return (
                <svg {...svgProps}>
                    <circle cx="12" cy="12" r="8" stroke={c} strokeWidth="1.5" fill="none" />
                    {[0, 60, 120, 180, 240, 300].map(deg => (
                        <line key={deg} x1="12" y1="2" x2="12" y2="4.5" stroke={c} strokeWidth="2" strokeLinecap="round" transform={`rotate(${deg} 12 12)`} />
                    ))}
                    <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="monospace" fill={c}>R</text>
                </svg>
            )

        case 'go':
            // Go gopher-inspired
            return (
                <svg {...svgProps}>
                    <rect x="2" y="2" width="20" height="20" rx="4" fill={c} />
                    <text x="12" y="16.5" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="monospace" fill="#fff">Go</text>
                </svg>
            )

        case 'git':
            // Git branch icon
            return (
                <svg {...svgProps}>
                    <path d="M22.4 10.6L13.4 1.6c-.8-.8-2-.8-2.8 0L8.1 4.1l3.5 3.5c.4-.1.8-.2 1.2-.2 1.4 0 2.5 1.1 2.5 2.5 0 .4-.1.8-.2 1.2l3.4 3.4c.4-.1.8-.2 1.2-.2 1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5-2.5-1.1-2.5-2.5c0-.4.1-.8.2-1.2l-3.2-3.2v6.3c.9.4 1.5 1.3 1.5 2.3 0 1.4-1.1 2.5-2.5 2.5s-2.5-1.1-2.5-2.5c0-1 .6-1.9 1.5-2.3V9.8c-.9-.4-1.5-1.3-1.5-2.3 0-.4.1-.8.2-1.2L6.9 3.1 1.6 8.4c-.8.8-.8 2 0 2.8l9 9c.8.8 2 .8 2.8 0l9-9c.8-.8.8-2 0-2.8z" fill={c} />
                </svg>
            )

        case 'github':
            // GitHub octocat-inspired
            return (
                <svg {...svgProps}>
                    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.8.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 015 0c1.8-1.2 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.8-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0022 12c0-5.5-4.5-10-10-10z" fill={c} />
                </svg>
            )

        case 'docker':
            // Docker whale
            return (
                <svg {...svgProps}>
                    <path d="M13 4h3v3h-3zM9 4h3v3H9zM5 4h3v3H5zM9 1h3v3H9zM1 10s1-4 5-4h14c0 0 2 0 2 3s-2 3-3 3H3c-1 0-2-1-2-2z" stroke={c} strokeWidth="1.5" fill="none" />
                    <rect x="5.5" y="8" width="2.5" height="2.5" rx="0.3" fill={c} opacity="0.5" />
                    <rect x="8.5" y="8" width="2.5" height="2.5" rx="0.3" fill={c} opacity="0.5" />
                    <rect x="11.5" y="8" width="2.5" height="2.5" rx="0.3" fill={c} opacity="0.5" />
                    <path d="M3 14c1 5 6 8 12 7s8-5 8-5" stroke={c} strokeWidth="1" fill="none" strokeDasharray="2 2" />
                </svg>
            )

        case 'nodejs':
            // Node.js hexagon with N
            return (
                <svg {...svgProps}>
                    <path d="M12 2l8.5 5v10L12 22l-8.5-5V7z" stroke={c} strokeWidth="1.5" fill="none" />
                    <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="monospace" fill={c}>N</text>
                </svg>
            )

        case 'deno':
            // Deno dinosaur-inspired circle
            return (
                <svg {...svgProps}>
                    <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.5" fill="none" />
                    <circle cx="9" cy="9" r="2" fill={c} />
                    <path d="M9 15c2 3 6 3 8 0" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </svg>
            )

        default:
            return (
                <svg {...svgProps}>
                    <circle cx="12" cy="12" r="10" stroke={c} strokeWidth="1.5" fill="none" />
                    <text x="12" y="16" textAnchor="middle" fontSize="9" fill={c}>?</text>
                </svg>
            )
    }
}

// ── Animated Tech Icons ─────────────────────────────────────────────────────────

export type AnimatedTechIconName =
    | 'react-spin' | 'git-merge' | 'deploy' | 'ci-cd' | 'code-review'
    | 'build' | 'test-run' | 'hot-reload' | 'npm-install' | 'docker-build'
    | 'push' | 'pull' | 'branch-create' | 'lint' | 'compile'

const ANIMATED_TECH_COLORS: Record<AnimatedTechIconName, string> = {
    'react-spin': '#61dafb', 'git-merge': '#22c55e', 'deploy': '#8b5cf6',
    'ci-cd': '#f59e0b', 'code-review': '#06b6d4', 'build': '#f97316',
    'test-run': '#22c55e', 'hot-reload': '#ef4444', 'npm-install': '#cb3837',
    'docker-build': '#2496ed', 'push': '#22c55e', 'pull': '#3b82f6',
    'branch-create': '#a855f7', 'lint': '#f59e0b', 'compile': '#3178c6',
}

interface AnimatedTechIconProps {
    name: AnimatedTechIconName; size?: number; color?: string; style?: CSSProperties
}

export function AnimatedTechIcon({ name, size = 16, color, style }: AnimatedTechIconProps) {
    const c = color || ANIMATED_TECH_COLORS[name]
    const s = { display: 'inline-flex' as const, ...style }

    switch (name) {
        case 'react-spin':
            // React atom spinning
            return (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} style={s}>
                    <TechIcon name="react" size={size} color={c} />
                </motion.div>
            )

        case 'git-merge':
            // Merging branches animation
            return (
                <div style={{ position: 'relative', width: size, height: size, ...style }}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <circle cx="6" cy="4" r="2.5" fill={c} />
                        <circle cx="18" cy="4" r="2.5" fill={c} opacity="0.5" />
                        <motion.circle cx="12" cy="20" r="2.5" fill={c} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <path d="M6 6.5v5c0 3 2 5 6 8.5" stroke={c} strokeWidth="1.5" />
                        <motion.path d="M18 6.5v5c0 3-2 5-6 8.5" stroke={c} strokeWidth="1.5" strokeDasharray="3 3" animate={{ strokeDashoffset: [0, -12] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    </svg>
                </div>
            )

        case 'deploy':
            // Rocket launch
            return (
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <path d="M12 2c-3 4-3 8-1 14h2c2-6 2-10-1-14z" fill={c} />
                        <path d="M8 16l-2 4 5-2z" fill={c} opacity="0.5" />
                        <path d="M16 16l2 4-5-2z" fill={c} opacity="0.5" />
                        <motion.path d="M10 20c1 2 3 2 4 0" stroke="#f97316" strokeWidth="2" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.3, repeat: Infinity }} />
                    </svg>
                </motion.div>
            )

        case 'ci-cd':
            // Circular pipeline with flowing dots
            return (
                <div style={{ position: 'relative', width: size, height: size, ...style }}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5" strokeDasharray="4 2" fill="none" opacity="0.3" />
                        <motion.circle cx="12" cy="3" r="2" fill={c} animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ transformOrigin: '12px 12px' } as any} />
                    </svg>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                        <div style={{ width: size * 0.2, height: size * 0.2, borderRadius: '50%', background: c, position: 'absolute', top: '4%', left: '46%' }} />
                    </motion.div>
                </div>
            )

        case 'code-review':
            // Eye scanning code
            return (
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke={c} strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="3" fill={c} />
                        <line x1="7" y1="8" x2="10" y2="8" stroke={c} strokeWidth="1" opacity="0.5" />
                        <line x1="14" y1="16" x2="17" y2="16" stroke={c} strokeWidth="1" opacity="0.5" />
                    </svg>
                </motion.div>
            )

        case 'build':
            // Hammer building
            return (
                <motion.div animate={{ rotate: [0, -15, 0] }} transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }} style={{ ...s, transformOrigin: 'bottom right' }}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <path d="M10 2l4 4-8 8-4-4z" fill={c} />
                        <path d="M10 14l10 8-2 2-10-8z" fill={c} opacity="0.6" />
                    </svg>
                </motion.div>
            )

        case 'test-run':
            // Checkmarks appearing
            return (
                <div style={{ display: 'inline-flex', gap: size * 0.1, alignItems: 'center', ...style }}>
                    {[0, 1, 2].map(i => (
                        <motion.svg key={i} width={size * 0.3} height={size * 0.3} viewBox="0 0 24 24" animate={{ opacity: [0, 1, 1], scale: [0.5, 1, 1] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}>
                            <path d="M4 12l5 5L20 6" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </motion.svg>
                    ))}
                </div>
            )

        case 'hot-reload':
            // Lightning bolt flash
            return (
                <motion.div animate={{ opacity: [1, 0.3, 1], scale: [1, 0.9, 1] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L4 14h6l-1 8 9-12h-6z" fill={c} />
                    </svg>
                </motion.div>
            )

        case 'npm-install':
            // Download with package
            return (
                <motion.div animate={{ y: [0, 2, 0] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="14" width="20" height="8" rx="2" stroke={c} strokeWidth="1.5" fill="none" />
                        <motion.path d="M12 2v10m-3-3l3 3 3-3" stroke={c} strokeWidth="2" strokeLinecap="round" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.8, repeat: Infinity }} />
                        <text x="12" y="20" textAnchor="middle" fontSize="6" fontWeight="700" fontFamily="monospace" fill={c}>npm</text>
                    </svg>
                </motion.div>
            )

        case 'docker-build':
            // Docker whale with loading
            return (
                <motion.div animate={{ y: [0, -1, 0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <TechIcon name="docker" size={size} color={c} />
                </motion.div>
            )

        case 'push':
            // Arrow pushing up
            return (
                <motion.div animate={{ y: [2, -2, 2] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <path d="M12 19V5m-5 5l5-5 5 5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="4" y1="21" x2="20" y2="21" stroke={c} strokeWidth="1.5" />
                    </svg>
                </motion.div>
            )

        case 'pull':
            // Arrow pulling down
            return (
                <motion.div animate={{ y: [-2, 2, -2] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14m-5-5l5 5 5-5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="4" y1="3" x2="20" y2="3" stroke={c} strokeWidth="1.5" />
                    </svg>
                </motion.div>
            )

        case 'branch-create':
            // Branch forking animation
            return (
                <motion.div animate={{ scale: [0.95, 1.05, 0.95] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <circle cx="6" cy="6" r="2.5" fill={c} />
                        <circle cx="6" cy="18" r="2.5" fill={c} />
                        <motion.circle cx="18" cy="12" r="2.5" fill={c} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <path d="M6 8.5v7" stroke={c} strokeWidth="1.5" />
                        <motion.path d="M8.5 7c3 0 7 1 7 5" stroke={c} strokeWidth="1.5" fill="none" strokeDasharray="3 2" animate={{ strokeDashoffset: [0, -10] }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    </svg>
                </motion.div>
            )

        case 'lint':
            // Magnifying glass scanning
            return (
                <motion.div animate={{ x: [-2, 2, -2] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <circle cx="10" cy="10" r="7" stroke={c} strokeWidth="1.5" fill="none" />
                        <line x1="15.5" y1="15.5" x2="21" y2="21" stroke={c} strokeWidth="2" strokeLinecap="round" />
                        <path d="M7 8h6M7 11h4" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                    </svg>
                </motion.div>
            )

        case 'compile':
            // Gear turning with code
            return (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} style={s}>
                    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="5" stroke={c} strokeWidth="1.5" fill="none" />
                        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                            <line key={deg} x1="12" y1="2" x2="12" y2="5" stroke={c} strokeWidth="2" strokeLinecap="round" transform={`rotate(${deg} 12 12)`} />
                        ))}
                        <text x="12" y="14.5" textAnchor="middle" fontSize="6" fontWeight="700" fontFamily="monospace" fill={c}>{'{}'}</text>
                    </svg>
                </motion.div>
            )

        default:
            return <TechIcon name="react" size={size} color={c} />
    }
}

// ── Utility exports ─────────────────────────────────────────────────────────────

export const ALL_TECH_ICONS: TechIconName[] = [
    'react', 'vue', 'nextjs', 'svelte', 'angular',
    'typescript', 'javascript', 'python', 'rust', 'go',
    'git', 'github', 'docker', 'nodejs', 'deno',
]

export const ALL_ANIMATED_TECH_ICONS: { name: AnimatedTechIconName; label: string; color: string }[] = [
    { name: 'react-spin', label: 'React spinning atom', color: '#61dafb' },
    { name: 'git-merge', label: 'Git merge animation', color: '#22c55e' },
    { name: 'deploy', label: 'Rocket deploy', color: '#8b5cf6' },
    { name: 'ci-cd', label: 'CI/CD pipeline', color: '#f59e0b' },
    { name: 'code-review', label: 'Code review eye', color: '#06b6d4' },
    { name: 'build', label: 'Build hammer', color: '#f97316' },
    { name: 'test-run', label: 'Test checkmarks', color: '#22c55e' },
    { name: 'hot-reload', label: 'Hot reload flash', color: '#ef4444' },
    { name: 'npm-install', label: 'npm install', color: '#cb3837' },
    { name: 'docker-build', label: 'Docker build', color: '#2496ed' },
    { name: 'push', label: 'Git push', color: '#22c55e' },
    { name: 'pull', label: 'Git pull', color: '#3b82f6' },
    { name: 'branch-create', label: 'Branch create', color: '#a855f7' },
    { name: 'lint', label: 'Lint scanning', color: '#f59e0b' },
    { name: 'compile', label: 'Compile gear', color: '#3178c6' },
]

export { TECH_COLORS, ANIMATED_TECH_COLORS }
