import { defineConfig, devices } from '@playwright/test'

const isHuman = process.env.TEST_RUNNER_HUMAN === '1'

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.e2e.ts',
    fullyParallel: !isHuman,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: isHuman ? 1 : process.env.CI ? 1 : undefined,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:5173/wibeboard/',
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
        url: 'http://localhost:5173/wibeboard/',
        reuseExistingServer: !process.env.CI,
    },
})
