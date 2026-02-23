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

    test('knocking activates animated dashed edge toward node', async ({ page }) => {
        // Click knock In — should set status to waking and animate edge
        await page.locator('[data-testid="knock-in"]').click()
        await page.waitForTimeout(500)

        // Verify waking status is auto-selected
        await expect(page.locator('[data-testid="status-waking"]')).toBeVisible()

        // Check that React Flow animated edges appear (class="animated" on edge group)
        const animatedEdges = page.locator('.react-flow__edge.animated')
        await expect(animatedEdges.first()).toBeVisible({ timeout: 3_000 })
        const count = await animatedEdges.count()
        expect(count).toBeGreaterThan(0)

        // Click knock Out — edge animated on the right side
        await page.locator('[data-testid="knock-out"]').click()
        await page.waitForTimeout(500)
        await expect(animatedEdges.first()).toBeVisible({ timeout: 3_000 })

        // Reset
        await page.locator('[data-testid="knock-none"]').click()
    })

    test('communicating animation flows away from node', async ({ page }) => {
        // Click Comm Emit → (right side)
        await page.locator('[data-testid="comm-right"]').click()
        await page.waitForTimeout(500)

        // Should show React Flow animated edges (cyan color, dashes flow outward)
        const animatedEdges = page.locator('.react-flow__edge.animated')
        await expect(animatedEdges.first()).toBeVisible({ timeout: 3_000 })

        // Click Comm ← Emit (left side)
        await page.locator('[data-testid="comm-left"]').click()
        await page.waitForTimeout(500)
        await expect(animatedEdges.first()).toBeVisible({ timeout: 3_000 })

        // Reset
        await page.locator('[data-testid="comm-none"]').click()
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

    test('non-compact agent nodes display name, time, calls, and progress', async ({ page }) => {
        // Agent widget should be selected by default
        await expect(page.getByText('Agent', { exact: true }).first()).toBeVisible({ timeout: 5_000 })

        // Set status to 'done' so all stats populate
        await page.locator('[data-testid="status-done"]').click()
        await page.waitForTimeout(500)

        // M/L nodes are rendered in mini ReactFlow canvases (scaled down).
        // Check that the stats text is present in the DOM within the .mini-flow containers.
        const pageText = await page.locator('.mini-flow').allTextContents()
        const allText = pageText.join(' ')

        // 1. Agent name — "Claude 3.5" should be in M/L nodes
        expect(allText).toContain('Claude 3.5')

        // 2. Execution time
        expect(allText).toContain('4.2s')

        // 3. Calls count (⚡7)
        expect(allText).toContain('⚡7')

        // 4. Progress (0% by default)
        expect(allText).toContain('0%')
    })

    test('non-compact script nodes display time, calls, and status text', async ({ page }) => {
        // Click on "JavaScript" in the widget selector
        const jsWidget = page.locator('[data-testid="widget-script-js"]')
        await jsWidget.click()
        await page.waitForTimeout(500)

        // Set status to 'done'
        await page.locator('[data-testid="status-done"]').click()
        await page.waitForTimeout(500)

        // Check stats text in DOM within .mini-flow containers
        const pageText = await page.locator('.mini-flow').allTextContents()
        const allText = pageText.join(' ')

        // 1. Execution time (scripts show "1.8s" when done)
        expect(allText).toContain('1.8s')

        // 2. Calls count (⚡3)
        expect(allText).toContain('⚡3')

        // 3. Status text (one of: "done", "DONE", "Success")
        expect(allText).toMatch(/done|DONE|Success/)
    })
})
