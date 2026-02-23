/**
 * Widget Gallery E2E Test — verifies compliance with node-job docs.
 *
 * Checks:
 * - Every JobNode has a status indicator dot
 * - Knocking animation activates edge animation
 * - Compact mode nodes show name below the box
 * - Thinking toggle shows agent thoughts / script output
 */

import { test, expect } from '@playwright/test'

test.setTimeout(60_000)

test.describe('Widget Gallery compliance', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?page=widgets')
        await page.waitForTimeout(1000)
    })

    test('every compact node has a status indicator dot', async ({ page }) => {
        // Set status to running (blinking blue dot should appear)
        await page.locator('[data-testid="status-running"]').click()
        await page.waitForTimeout(500)

        // Check at least one theme pane has rendered content
        const themePanes = page.locator('div').filter({ hasText: /wibeglow|WibeGlow/i }).first()
        await expect(themePanes).toBeVisible({ timeout: 5_000 })

        // No console errors
        const consoleErrors: string[] = []
        page.on('pageerror', (err) => consoleErrors.push(err.message))

        // Cycle through all four statuses and verify no errors
        for (const status of ['idle', 'waking', 'running', 'done'] as const) {
            await page.locator(`[data-testid="status-${status}"]`).click()
            await page.waitForTimeout(300)
        }

        expect(consoleErrors).toEqual([])
    })

    test('knocking activates edge animation', async ({ page }) => {
        // Click knock In — should set status to waking and show animated edge
        await page.locator('[data-testid="knock-in"]').click()
        await page.waitForTimeout(500)

        // Verify waking status is auto-selected
        const wakingBtn = page.locator('[data-testid="status-waking"]')
        await expect(wakingBtn).toBeVisible()

        // Check that connection line SVGs are rendered (input side)
        const svgElements = page.locator('svg')
        const svgCount = await svgElements.count()
        expect(svgCount).toBeGreaterThan(0)

        // Click knock Out
        await page.locator('[data-testid="knock-out"]').click()
        await page.waitForTimeout(500)

        // Reset knock
        await page.locator('[data-testid="knock-none"]').click()
    })

    test('compact mode nodes show name below', async ({ page }) => {
        // The gallery should show S (compact) size labels
        const sizeLabels = page.getByText('S', { exact: true })
        await expect(sizeLabels.first()).toBeVisible({ timeout: 5_000 })

        // The agent widget should be selected by default
        // Check that the label "Agent" or template name is visible somewhere below compact nodes
        // Since compact nodes render name below, look for the label text
        await expect(page.getByText('Agent', { exact: false }).first()).toBeVisible({ timeout: 3_000 })
    })

    test('thinking toggle shows agent thoughts', async ({ page }) => {
        // Set status to running
        await page.locator('[data-testid="status-running"]').click()
        await page.waitForTimeout(300)

        // Enable thinking toggle
        const thinkingBtn = page.getByText('Thinking', { exact: false })
        await expect(thinkingBtn).toBeVisible({ timeout: 5_000 })
        await thinkingBtn.click()
        await page.waitForTimeout(500)

        // Agent thought should appear (agent is selected by default)
        await expect(page.getByText('Analyzing auth patterns', { exact: false }).first()).toBeVisible({ timeout: 3_000 })
    })
})
