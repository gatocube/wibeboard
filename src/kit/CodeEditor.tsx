/**
 * CodeEditor — reusable code editor with syntax highlighting.
 *
 * Built on CodeMirror 6 with:
 *  - Syntax highlighting for JSON, JavaScript, TypeScript, Python, Shell
 *  - One-dark theme (matches wibeboard dark UI)
 *  - Line numbers
 *  - Read-only mode support
 *  - Lint/error markers (via @codemirror/lint — ready for future validation)
 *
 * Usage:
 *   <CodeEditor value={json} onChange={setJson} language="json" />
 *   <CodeEditor value={code} language="typescript" readOnly />
 */

import { useRef, useEffect, useMemo, type CSSProperties } from 'react'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { EditorState, type Extension } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { lintGutter } from '@codemirror/lint'

// ── Language map ────────────────────────────────────────────────────────────────

export type CodeLanguage = 'json' | 'javascript' | 'typescript' | 'python' | 'shell' | 'text'

function langExtension(lang: CodeLanguage): Extension[] {
    switch (lang) {
        case 'json': return [json()]
        case 'javascript': return [javascript()]
        case 'typescript': return [javascript({ typescript: true })]
        case 'python': return [python()]
        case 'shell': return [] // no shell grammar, fallback to plain text
        case 'text': return []
    }
}

// ── Props ────────────────────────────────────────────────────────────────────────

export interface CodeEditorProps {
    /** Current value */
    value: string
    /** Called on content change (not called if readOnly) */
    onChange?: (value: string) => void
    /** Language for syntax highlighting */
    language?: CodeLanguage
    /** Make the editor read-only */
    readOnly?: boolean
    /** Min height in px (default: 200) */
    minHeight?: number
    /** Max height in px (default: 500) */
    maxHeight?: number
    /** Extra className */
    className?: string
    /** Extra style */
    style?: CSSProperties
    /** data-testid for the wrapper */
    testId?: string
}

// ── Dark theme overrides to match wibeboard ─────────────────────────────────────

const wibeDarkTheme = EditorView.theme({
    '&': {
        backgroundColor: 'rgba(0,0,0,0.3)',
        fontSize: '12px',
        fontFamily: "'JetBrains Mono', ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace",
    },
    '.cm-content': {
        caretColor: '#a5f3fc',
        padding: '8px 0',
    },
    '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: '#a5f3fc',
    },
    '.cm-activeLine': {
        backgroundColor: 'rgba(139,92,246,0.06)',
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'rgba(139,92,246,0.08)',
    },
    '.cm-gutters': {
        backgroundColor: 'rgba(0,0,0,0.2)',
        color: '#475569',
        border: 'none',
        borderRight: '1px solid rgba(255,255,255,0.04)',
    },
    '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 4px',
        minWidth: '28px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: 'rgba(139,92,246,0.3)',
    },
    '.cm-selectionMatch': {
        backgroundColor: 'rgba(139,92,246,0.15)',
    },
    '.cm-foldPlaceholder': {
        backgroundColor: 'rgba(139,92,246,0.2)',
        border: 'none',
        color: '#8b5cf6',
    },
})

// ── Component ────────────────────────────────────────────────────────────────────

export function CodeEditor({
    value,
    onChange,
    language = 'json',
    readOnly = false,
    minHeight = 200,
    maxHeight = 500,
    className,
    style,
    testId,
}: CodeEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    // Build extensions
    const extensions = useMemo(() => {
        const exts: Extension[] = [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            history(),
            bracketMatching(),
            foldGutter(),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            oneDark,
            wibeDarkTheme,
            lintGutter(),
            keymap.of([...defaultKeymap, ...historyKeymap]),
            ...langExtension(language),
            EditorView.lineWrapping,
        ]

        if (readOnly) {
            exts.push(EditorState.readOnly.of(true))
        } else {
            exts.push(EditorView.updateListener.of(update => {
                if (update.docChanged) {
                    onChangeRef.current?.(update.state.doc.toString())
                }
            }))
        }

        return exts
    }, [language, readOnly])

    // Create editor on mount
    useEffect(() => {
        if (!containerRef.current) return

        const state = EditorState.create({
            doc: value,
            extensions,
        })

        const view = new EditorView({
            state,
            parent: containerRef.current,
        })

        viewRef.current = view

        return () => {
            view.destroy()
            viewRef.current = null
        }
        // Only recreate when extensions change (language/readOnly)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [extensions])

    // Update value from outside (when switching tabs, templates, etc.)
    useEffect(() => {
        const view = viewRef.current
        if (!view) return
        const current = view.state.doc.toString()
        if (current !== value) {
            view.dispatch({
                changes: { from: 0, to: current.length, insert: value },
            })
        }
    }, [value])

    return (
        <div
            ref={containerRef}
            className={className}
            data-testid={testId}
            style={{
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                overflow: 'auto',
                minHeight,
                maxHeight,
                ...style,
            }}
        />
    )
}
