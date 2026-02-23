/**
 * Two-Node Scenario E2E Test
 *
 * Navigates to scenario page, plays through all steps,
 * verifies tool_call + artifact creation, tests undo/redo, checks for errors.
 */

import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })
test.setTimeout(60_000)

test.describe('Two-node scenario with Automerge player', () => {
    test('play through all steps, verify tool calls and artifacts, no errors', async ({ page }) => {
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

        // Navigate directly
        await page.goto('/?page=two-node')
        await page.waitForSelector('[data-testid="step-player"]', { timeout: 10_000 })
        await expect(page.locator('[data-testid="step-label"]')).toContainText('Click', { timeout: 10_000 })

        // Verify both nodes
        await expect(page.getByText('Planner', { exact: false }).first()).toBeVisible({ timeout: 5_000 })
        await expect(page.getByText('Executor', { exact: false }).first()).toBeVisible({ timeout: 5_000 })

        // ── Step through to tool call phase ──
        // Step 1: Node A waking up
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(300)
        // Step 2: Node A is working
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(300)
        // Step 3: Node A calling tool: search
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(300)

        // Verify tool call is visible in step label
        await expect(page.locator('[data-testid="step-label"]')).toContainText('calling tool', { timeout: 3_000 })

        // Verify tool call appears in log panel
        await expect(page.getByText('tool_call: search', { exact: false }).first()).toBeVisible({ timeout: 3_000 })

        // ── Step through to waking phase (step 8: A wakes B) ──
        // Steps 4-7: continue through tool calls and artifact publishing
        for (let i = 0; i < 4; i++) {
            await page.locator('[data-testid="btn-next"]').click()
            await page.waitForTimeout(200)
        }

        // Step 8: Node A waking Node B
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(300)
        await expect(page.locator('[data-testid="step-label"]')).toContainText('waking', { timeout: 3_000 })
        // Verify waking log entry
        await expect(page.getByText('Waking Executor B', { exact: false }).first()).toBeVisible({ timeout: 3_000 })

        // Play through remaining steps to end
        await page.locator('[data-testid="btn-play"]').click()
        await expect(page.locator('[data-testid="step-label"]')).toContainText('Both nodes done', { timeout: 15_000 })

        // ── Verify artifacts created ──
        await expect(page.getByText('auth-plan.md', { exact: false }).first()).toBeVisible({ timeout: 3_000 })
        await expect(page.getByText('auth-module.ts', { exact: false }).first()).toBeVisible({ timeout: 3_000 })

        // Verify step counter (now 17 steps)
        await expect(page.getByText('17/17')).toBeVisible({ timeout: 3_000 })

        // ── Undo/redo test ──
        for (let i = 0; i < 3; i++) {
            await page.locator('[data-testid="btn-prev"]').click()
            await page.waitForTimeout(400)
        }
        // Should NOT show 17/17 anymore
        await expect(page.getByText('17/17')).not.toBeVisible({ timeout: 3_000 })

        // Reset
        await page.locator('[data-testid="btn-reset"]').click()
        await page.waitForTimeout(500)
        await expect(page.locator('[data-testid="step-label"]')).toContainText('Click', { timeout: 5_000 })

        // No errors
        if (consoleErrors.length > 0) {
            console.log('Console errors found:', consoleErrors)
        }
        expect(consoleErrors).toEqual([])
    })
})
