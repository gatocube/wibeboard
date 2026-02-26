import { defineConfig, devices } from '@playwright/test'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Read .env manually (no dotenv dependency needed)
const envPath = resolve(process.cwd(), '.env')
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const [key, ...rest] = trimmed.split('=')
        if (key && !process.env[key]) process.env[key] = rest.join('=')
    }
}

const isHuman = process.env.TEST_RUNNER_HUMAN === '1'
const isIntegration = process.env.TEST_INTEGRATION === '1'
const devPort = process.env.VITE_DEV_PORT || '5173'
const baseURL = `http://localhost:${devPort}/wibeboard/`

export default defineConfig({
    testDir: './tests',
    testMatch: isIntegration ? '**/*.integration.e2e.ts' : '**/*.e2e.ts',
    testIgnore: isIntegration ? [] : ['**/*.integration.e2e.ts'],
    fullyParallel: !isHuman,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: isHuman ? 1 : process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
        baseURL,
        trace: 'on-first-retry',
        headless: !isHuman,
        ...(isHuman ? { cursor: 'css' } : {}),
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
    },
})
