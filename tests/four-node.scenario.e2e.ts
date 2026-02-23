/**
 * Four-Node Concurrent Scenario E2E Test
 *
 * Plays through the 4-node concurrent scenario, verifies
 * concurrent execution, step controls, and no errors.
 */

import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })
test.setTimeout(60_000)

test.describe('Four-node concurrent scenario', () => {
    test('play through all steps, verify concurrency, no errors', async ({ page }) => {
        const consoleErrors: string[] = []

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

        // Navigate directly to four-node scenario
        await page.goto('/?page=four-node')
        await page.waitForSelector('[data-testid="step-player"]', { timeout: 10_000 })

        // Verify initial state
        await expect(page.locator('[data-testid="step-label"]')).toContainText('Click', { timeout: 10_000 })

        // Verify all 4 nodes visible
        await expect(page.getByText('Orchestrator', { exact: false }).first()).toBeVisible({ timeout: 5_000 })
        await expect(page.getByText('Worker A', { exact: false }).first()).toBeVisible({ timeout: 5_000 })
        await expect(page.getByText('Worker B', { exact: false }).first()).toBeVisible({ timeout: 5_000 })
        await expect(page.getByText('Aggregator', { exact: false }).first()).toBeVisible({ timeout: 5_000 })

        // Step forward to concurrent phase (step 6 = "Workers running (concurrent)")
        for (let i = 0; i < 6; i++) {
            await page.locator('[data-testid="btn-next"]').click()
            await page.waitForTimeout(200)
        }
        await expect(page.locator('[data-testid="step-label"]')).toContainText('concurrent', { timeout: 3_000 })

        // Auto-play the rest
        await page.locator('[data-testid="btn-play"]').click()

        // Wait for completion
        await expect(page.locator('[data-testid="step-label"]')).toContainText('All nodes done', { timeout: 15_000 })

        // Verify step counter shows 19/19
        await expect(page.getByText('19/19')).toBeVisible({ timeout: 3_000 })

        // Reset
        await page.locator('[data-testid="btn-reset"]').click()
        await expect(page.locator('[data-testid="step-label"]')).toContainText('Click', { timeout: 5_000 })

        // No errors
        if (consoleErrors.length > 0) {
            console.log('Console errors found:', consoleErrors)
        }
        expect(consoleErrors).toEqual([])
    })
})
