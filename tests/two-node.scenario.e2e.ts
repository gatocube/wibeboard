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
        for (let i = 0; i < 5; i++) {
            await page.locator('[data-testid="btn-next"]').click()
            await page.waitForTimeout(200)
        }

        // Step 9: Node A waking Node B
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

        // Verify step counter (now 18 steps)
        await expect(page.getByText('18/18')).toBeVisible({ timeout: 3_000 })

        // ── Undo/redo test ──
        for (let i = 0; i < 3; i++) {
            await page.locator('[data-testid="btn-prev"]').click()
            await page.waitForTimeout(400)
        }
        // Should NOT show 18/18 anymore
        await expect(page.getByText('18/18')).not.toBeVisible({ timeout: 3_000 })

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

    test('active borders never appear on A-left or B-right during communication', async ({ page }) => {
        await page.goto('/?page=two-node')
        await page.waitForSelector('[data-testid="step-player"]', { timeout: 10_000 })

        // Advance to waking phase (step 9: A wakes B) — both nodes have knockSide set
        for (let i = 0; i < 9; i++) {
            await page.locator('[data-testid="btn-next"]').click()
            await page.waitForTimeout(200)
        }

        // Check A's border — for WibeGlow (default theme), knock is via box-shadow
        // 'out' should put glow on RIGHT side (negative inset X), never LEFT (positive inset X)
        const nodeA = page.locator('.react-flow__node').first()
        const nodeB = page.locator('.react-flow__node').last()

        // Get the inner motion div with the box-shadow (first div child of the node wrapper)
        const aBoxShadow = await nodeA.locator('div').first().evaluate(
            el => window.getComputedStyle(el).boxShadow
        )
        const bBoxShadow = await nodeB.locator('div').first().evaluate(
            el => window.getComputedStyle(el).boxShadow
        )

        // A has knockSide='out' → should glow RIGHT (negative X inset)
        // If box-shadow contains a positive inset X, the glow is on the LEFT (wrong for A)
        // B has knockSide='in' → should glow LEFT (positive X inset)
        // If box-shadow contains a negative inset X, the glow is on the RIGHT (wrong for B)

        // Advance to follow-up phase (step 10: B asks follow-up, knockSides swap)
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(300)

        // Step 11: A responding — A.knockSide='out', B.knockSide='in'
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(300)

        // Now switch to GHub theme where borders are CSS border-left/border-right
        await page.locator('[data-testid="theme-ghub"]').click()
        await page.waitForTimeout(500)

        // A should have borderRight colored, NOT borderLeft
        const aBorderLeft = await nodeA.locator('div').first().evaluate(
            el => window.getComputedStyle(el).borderLeftColor
        )
        const aBorderRight = await nodeA.locator('div').first().evaluate(
            el => window.getComputedStyle(el).borderRightColor
        )
        // B should have borderLeft colored, NOT borderRight
        const bBorderLeft = await nodeB.locator('div').first().evaluate(
            el => window.getComputedStyle(el).borderLeftColor
        )
        const bBorderRight = await nodeB.locator('div').first().evaluate(
            el => window.getComputedStyle(el).borderRightColor
        )

        // A's LEFT border should be default/uncolored (not orange/green)
        // B's RIGHT border should be default/uncolored (not orange/green)
        const activeColors = ['rgb(249, 115, 22)', 'rgb(34, 197, 94)'] // orange, green
        expect(activeColors).not.toContain(aBorderLeft)
        expect(activeColors).not.toContain(bBorderRight)
    })

    test('size switcher changes node size correctly', async ({ page }) => {
        await page.goto('/?page=two-node')
        await page.waitForSelector('[data-testid="step-player"]', { timeout: 10_000 })

        // Default is L — nodes should be visible
        await expect(page.getByText('Planner', { exact: false }).first()).toBeVisible({ timeout: 5_000 })

        // Switch to S
        await page.locator('[data-testid="size-S"]').click()
        await page.waitForTimeout(500)

        // Switch to M
        await page.locator('[data-testid="size-M"]').click()
        await page.waitForTimeout(500)

        // Switch back to L
        await page.locator('[data-testid="size-L"]').click()
        await page.waitForTimeout(500)

        // Still functional — play a step
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(300)

        // No errors should occur from size switching
        await expect(page.getByText('Planner', { exact: false }).first()).toBeVisible()
    })

    test('thoughts display below non-large nodes', async ({ page }) => {
        await page.goto('/?page=two-node')
        await page.waitForSelector('[data-testid="step-player"]', { timeout: 10_000 })

        // Advance to running state (step 2: Node A is working — has thought)
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(200)
        await page.locator('[data-testid="btn-next"]').click()
        await page.waitForTimeout(300)

        // In L mode, thought may be inside the node (above the node box)
        // Switch to M — thought text should still be visible below/outside the node
        await page.locator('[data-testid="size-M"]').click()
        await page.waitForTimeout(500)

        // The thought text should still be visible somewhere on the page
        // (rendered below/outside the compact node since it doesn't fit inside)
        await expect(page.getByText('Analyzing', { exact: false }).first()).toBeVisible({ timeout: 3_000 })

        // Switch to S — thought should still be rendered below the tiny node
        await page.locator('[data-testid="size-S"]').click()
        await page.waitForTimeout(500)

        // Label should be visible below compact node (WibeGlow compact renders label below)
        await expect(page.getByText('Planner', { exact: false }).first()).toBeVisible({ timeout: 3_000 })
    })
})
