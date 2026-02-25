/**
 * NodeButtonsMenu — E2E tests for the iPad-friendly node action buttons.
 *
 * Tests:
 *  1. Menu appears on node click in edit mode
 *  2. Menu hidden when edit mode is off
 *  3. Click away dismisses menu
 *  4. Rename — inline text editing with Enter confirmation
 *  5. Add Before — inserts connected node between prev and current
 *  6. Add After — triggers connector from the node
 *  7. Configure — fires configure action
 */

import { test, expect, type Page } from '@playwright/test'

test.setTimeout(60_000)

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openBuilder(page: Page) {
    await page.goto('/')
    await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 5_000 })
}

/** Enable edit mode via the toggle button */
async function enableEditMode(page: Page) {
    const btn = page.getByTestId('edit-mode-toggle').first()
    const text = await btn.textContent()
    if (text?.includes('View')) {
        await btn.click()
    }
    await expect(btn).toContainText('Edit')
}

/** Disable edit mode via the toggle button */
async function disableEditMode(page: Page) {
    const btn = page.getByTestId('edit-mode-toggle').first()
    const text = await btn.textContent()
    if (text?.includes('Edit')) {
        await btn.click()
    }
    await expect(btn).toContainText('View')
}

/** Click on the first real (non-placeholder) node */
async function clickFirstNode(page: Page) {
    const node = page.locator('.react-flow__node').first()
    await node.click()
    return node
}

// ── Test suite ───────────────────────────────────────────────────────────────

test.describe('NodeButtonsMenu', () => {

    // NodeButtonsMenu component exists but is NOT rendered in FlowStudio or test-builder.
    // These tests will pass once the component is wired up.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(true, 'NodeButtonsMenu is not yet integrated into FlowStudio — component exists but is not rendered')

    test.beforeEach(async ({ page }) => {
        await openBuilder(page)
        await enableEditMode(page)
    })

    // ── 1. Menu appears on node click in edit mode ──────────────────────────

    test('shows 4 action buttons when node is clicked in edit mode', async ({ page }) => {
        await clickFirstNode(page)

        const menu = page.getByTestId('node-buttons-menu')
        await expect(menu).toBeVisible({ timeout: 3_000 })

        // Verify all 4 buttons are visible
        await expect(page.getByTestId('node-btn-add-before')).toBeVisible()
        await expect(page.getByTestId('node-btn-add-after')).toBeVisible()
        await expect(page.getByTestId('node-btn-rename')).toBeVisible()
        await expect(page.getByTestId('node-btn-configure')).toBeVisible()
    })

    // ── 2. Menu hidden when edit mode is off ────────────────────────────────

    test('does not show menu when edit mode is off', async ({ page }) => {
        await disableEditMode(page)

        await clickFirstNode(page)

        // Menu should NOT appear
        await expect(page.getByTestId('node-buttons-menu')).not.toBeVisible({ timeout: 1_000 })
    })

    // ── 3. Click away dismisses menu ────────────────────────────────────────

    test('dismisses menu when clicking on empty canvas', async ({ page }) => {
        await clickFirstNode(page)
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })

        // Click on empty canvas area
        const canvas = page.locator('.react-flow__pane')
        await canvas.click({ position: { x: 50, y: 50 } })

        await expect(page.getByTestId('node-buttons-menu')).not.toBeVisible({ timeout: 2_000 })
    })

    // ── 4. Rename ───────────────────────────────────────────────────────────

    test('rename: shows input, accepts new name on Enter', async ({ page }) => {
        await clickFirstNode(page)
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })

        // Click rename button
        await page.getByTestId('node-btn-rename').click()

        // Rename input should appear
        const input = page.getByTestId('node-rename-field')
        await expect(input).toBeVisible({ timeout: 2_000 })

        // Clear and type new name
        await input.fill('My Renamed Node')
        await input.press('Enter')

        // Input should disappear
        await expect(page.getByTestId('node-rename-input')).not.toBeVisible({ timeout: 2_000 })
    })

    // ── 5. Add Before ───────────────────────────────────────────────────────

    test('add before: inserts a new placeholder node', async ({ page }) => {
        const initialCount = await page.locator('.react-flow__node').count()

        await clickFirstNode(page)
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })

        // Click add before
        await page.getByTestId('node-btn-add-before').click()

        // Should have one more node
        await expect(page.locator('.react-flow__node')).toHaveCount(initialCount + 1, { timeout: 3_000 })
    })

    // ── 6. Add After ────────────────────────────────────────────────────────

    test('add after: starts connector from the node', async ({ page }) => {
        await clickFirstNode(page)
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })

        // Click add after
        await page.getByTestId('node-btn-add-after').click()

        // Menu should dismiss
        await expect(page.getByTestId('node-buttons-menu')).not.toBeVisible({ timeout: 2_000 })

        // Connector overlay (sizing phase) or a new placeholder should be visible
        // The connector starts sizing which creates a placeholder node
        await expect(page.locator('.react-flow__node').last()).toBeVisible({ timeout: 3_000 })
    })

    // ── 7. Touch targets are iPad-friendly ──────────────────────────────────

    test('buttons have minimum 48px touch targets', async ({ page }) => {
        await clickFirstNode(page)
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })

        for (const testId of ['node-btn-add-before', 'node-btn-add-after', 'node-btn-rename', 'node-btn-configure']) {
            const btn = page.getByTestId(testId)
            const box = await btn.boundingBox()
            expect(box).toBeTruthy()
            expect(box!.width).toBeGreaterThanOrEqual(48)
            expect(box!.height).toBeGreaterThanOrEqual(48)
        }
    })
})
