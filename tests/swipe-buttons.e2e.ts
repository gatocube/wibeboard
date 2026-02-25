/**
 * SwipeButtons — E2E tests for activation modes.
 *
 * Tests the three activation modes on the ?page=buttons-menu demo page:
 *  1. Click mode — menu opens on tap/click
 *  2. Hold mode — menu opens after long-press (~500 ms)
 *  3. Swipe mode — sub-menus expand on hover
 *
 * Each test verifies that the radial menu appears and interaction buttons
 * become visible, confirming the activation mode works end-to-end.
 */

import { test, expect, type Page } from '@playwright/test'

test.setTimeout(60_000)

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openButtonsMenuPage(page: Page) {
    await page.goto('?page=buttons-menu')
    // Wait for the SwipeButtons page to render
    await expect(page.locator('h1')).toContainText('SwipeButtons', { timeout: 10_000 })
}

/** Click a mock node to show the SwipeButtons radial menu */
async function clickCenterNode(page: Page) {
    const node = page.getByTestId('mock-node-center-node')
    await node.click()
}

/** Select an activation mode pill */
async function selectMode(page: Page, mode: 'Click' | 'Hold' | 'Swipe') {
    await page.locator(`button:has-text("${mode}")`).first().click()
}

/** Assert the four main radial buttons are visible */
async function expectMenuVisible(page: Page) {
    // The wrapper div is 0×0 (position: fixed overlay), so check individual buttons
    await expect(page.getByTestId('swipe-btn-configure')).toBeVisible({ timeout: 3_000 })
    await expect(page.getByTestId('swipe-btn-add-after')).toBeVisible()
    await expect(page.getByTestId('swipe-btn-rename')).toBeVisible()
    await expect(page.getByTestId('swipe-btn-add-before')).toBeVisible()
}

/** Assert the menu is not visible */
async function expectMenuHidden(page: Page) {
    await expect(page.getByTestId('swipe-btn-configure')).not.toBeVisible({ timeout: 2_000 })
}

// ── Test suite ───────────────────────────────────────────────────────────────

test.describe('SwipeButtons activation modes', () => {

    test.beforeEach(async ({ page }) => {
        await openButtonsMenuPage(page)
    })

    // ── 1. Click mode ────────────────────────────────────────────────────

    test('click mode: menu opens on node click, buttons visible', async ({ page }) => {
        await selectMode(page, 'Click')

        // Click the center node
        await clickCenterNode(page)

        // Radial menu should appear with 4 main buttons
        await expectMenuVisible(page)

        // Hover the "After" button — in click mode, hover expands sub-menu for drill-down
        const afterBtn = page.getByTestId('swipe-btn-add-after')
        await afterBtn.hover()
        await page.waitForTimeout(200)

        // Sub-buttons (Script, AI, User) should appear
        await expect(page.getByTestId('ext-after-script')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-ai')).toBeVisible()
        await expect(page.getByTestId('ext-after-user')).toBeVisible()
    })

    test('click mode: dismiss menu by clicking node again', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        // Click the node again to toggle the menu off
        await clickCenterNode(page)

        await expectMenuHidden(page)
    })

    // ── 2. Hold mode ─────────────────────────────────────────────────────

    test('hold mode: menu does NOT open on quick click', async ({ page }) => {
        await selectMode(page, 'Hold')

        // Click the node to show the radial menu
        await clickCenterNode(page)
        await expectMenuVisible(page)

        // In hold mode, quick-clicking a main button should NOT expand sub-menu
        const afterBtn = page.getByTestId('swipe-btn-add-after')
        await afterBtn.click()

        // Sub-buttons should NOT appear (hold requires long-press)
        await expect(page.getByTestId('ext-after-script')).not.toBeVisible({ timeout: 1_000 })
    })

    test('hold mode: menu expands on long-press', async ({ page }) => {
        await selectMode(page, 'Hold')

        // Click center node to show radial buttons
        await clickCenterNode(page)
        await expectMenuVisible(page)

        // Long-press the After button (hold ~600ms > 500ms threshold)
        const afterBtn = page.getByTestId('swipe-btn-add-after')
        const afterBox = await afterBtn.boundingBox()
        expect(afterBox).toBeTruthy()

        await page.mouse.move(afterBox!.x + afterBox!.width / 2, afterBox!.y + afterBox!.height / 2)
        await page.mouse.down()
        await page.waitForTimeout(600) // wait > 500ms hold threshold
        await page.mouse.up()

        // Sub-buttons should now be visible
        await expect(page.getByTestId('ext-after-script')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-ai')).toBeVisible()
        await expect(page.getByTestId('ext-after-user')).toBeVisible()
    })

    // ── 3. Swipe mode ────────────────────────────────────────────────────

    test('swipe mode: sub-menu expands on hover', async ({ page }) => {
        await selectMode(page, 'Swipe')

        // Click node to show radial buttons (click still shows the top-level menu)
        await clickCenterNode(page)
        await expectMenuVisible(page)

        // Hover the After button — in swipe mode this should expand sub-menu
        const afterBtn = page.getByTestId('swipe-btn-add-after')
        await afterBtn.hover()

        // Sub-buttons should appear on hover
        await expect(page.getByTestId('ext-after-script')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-ai')).toBeVisible()
        await expect(page.getByTestId('ext-after-user')).toBeVisible()
    })

    test('swipe mode: config sub-menu expands on hover', async ({ page }) => {
        await selectMode(page, 'Swipe')

        await clickCenterNode(page)
        await expectMenuVisible(page)

        // Hover the Config button
        const configBtn = page.getByTestId('swipe-btn-configure')
        await configBtn.hover()

        // Config sub-buttons should appear
        await expect(page.getByTestId('ext-cfg-rename')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-cfg-duplicate')).toBeVisible()
        await expect(page.getByTestId('ext-cfg-delete')).toBeVisible()
    })

    // ── Touch targets ────────────────────────────────────────────────────

    test('all buttons have valid bounding boxes', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        for (const testId of [
            'swipe-btn-configure',
            'swipe-btn-add-after',
            'swipe-btn-rename',
            'swipe-btn-add-before',
        ]) {
            const btn = page.getByTestId(testId)
            const box = await btn.boundingBox()
            expect(box, `${testId} should have a bounding box`).toBeTruthy()
            // Buttons should be at least 20px — actual size depends on viewport scaling
            expect(box!.width, `${testId} width > 0`).toBeGreaterThan(20)
            expect(box!.height, `${testId} height > 0`).toBeGreaterThan(20)
        }
    })

    // ── Multi-section layout ─────────────────────────────────────────────

    test('all 3 preview sections render with nodes', async ({ page }) => {
        // Center node
        await expect(page.getByTestId('mock-node-center-node')).toBeVisible({ timeout: 3_000 })

        // Left corner node  
        await expect(page.getByTestId('mock-node-left-node')).toBeVisible({ timeout: 3_000 })

        // Right edge node
        await expect(page.getByTestId('mock-node-right-node')).toBeVisible({ timeout: 3_000 })
    })
})
