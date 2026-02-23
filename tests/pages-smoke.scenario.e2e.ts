/**
 * Pages Smoke Check — clicks through all pages, no errors.
 */

import { test, expect } from '@playwright/test'

test.setTimeout(60_000)

test.describe('Pages smoke check', () => {
    test('navigate all pages without errors', async ({ page }) => {
        const consoleErrors: string[] = []
        const visitedPages: string[] = []

        page.on('pageerror', (err) =>
            consoleErrors.push(`[pageerror] ${err.message}`),
        )
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text()
                if (text.includes('shorthand and non-shorthand properties')) return
                consoleErrors.push(`[console.error] ${text}`)
            }
        })

        // 1. Builder page (default)
        await page.goto('/')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
        await expect(page.locator('text=3 nodes')).toBeVisible()
        await expect(page.locator('text=Planner')).toBeVisible()
        visitedPages.push('builder')

        // 2. Navigate to widgets using top nav button (exact match)
        await page.getByRole('button', { name: 'widgets', exact: true }).click()
        await expect(page.locator('text=WibeGlow Template')).toBeVisible({ timeout: 5_000 })
        visitedPages.push('widgets/wibeglow')

        // Switch templates — use exact match to avoid sidebar text
        await page.getByRole('button', { name: 'Pixel', exact: true }).click()
        await expect(page.locator('text=Pixel Template')).toBeVisible({ timeout: 3_000 })
        visitedPages.push('widgets/pixel')

        await page.getByRole('button', { name: 'GitHub', exact: true }).click()
        await expect(page.locator('text=GitHub Template')).toBeVisible({ timeout: 3_000 })
        visitedPages.push('widgets/github')

        // 3. Home page via sidebar (sidebar is open by default on wide screens)
        await page.locator('[data-testid="nav-home"]').click()
        await page.waitForTimeout(500)
        visitedPages.push('home')

        // 4. Back to Builder via sidebar
        await page.locator('[data-testid="nav-builder"]').click({ timeout: 3_000 })
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
        await expect(page.locator('text=Planner')).toBeVisible()
        visitedPages.push('builder (return)')

        console.log(`Visited ${visitedPages.length} pages:`)
        visitedPages.forEach((p) => console.log(`  ✓ ${p}`))
        expect(visitedPages.length).toBeGreaterThanOrEqual(5)

        if (consoleErrors.length > 0) {
            console.log('Console errors found:', consoleErrors)
        }
        expect(consoleErrors).toEqual([])
    })
})
