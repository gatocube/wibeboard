import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const devPort = parseInt(env.VITE_DEV_PORT || '5173', 10)
    const previewPort = parseInt(env.VITE_PREVIEW_PORT || '4173', 10)

    return {
        plugins: [
            react(),
            wasm(),
            topLevelAwait(),
            visualizer({
                emitFile: true,
                filename: 'stats.html',
                template: 'treemap'
            }),
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
            },
        },
        base: '/wibeboard/',
        server: { port: devPort },
        preview: { port: previewPort },
        build: {
            sourcemap: true,
        },
    }
})
