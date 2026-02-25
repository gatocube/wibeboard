/**
 * SwipeButtons — E2E tests for activation modes.
 *
 * Tests the three activation modes on the ?page=buttons-menu demo page:
 *  1. Click mode — menu opens on tap/click
 *  2. Hold mode — menu opens after long-press (~500 ms)
 *  3. Swipe mode — sub-menus expand on hover
 *
 * Button hierarchy (per docs/swipe-buttons-menu.md):
 *  Add (Before/After) → User | Job (→ Script/AI) | Recent
 *  Config → Attach (→ Expectation/Note) | Settings | Delete
 */

import { test, expect, type Page } from '@playwright/test'

test.setTimeout(60_000)

// ── Helpers ──────────────────────────────────────────────────────────────────

async function openButtonsMenuPage(page: Page) {
    await page.goto('?page=buttons-menu')
    await expect(page.locator('text=SwipeButtons')).toBeVisible({ timeout: 10_000 })
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

/** Assert the 3 main radial buttons are visible (Config, After, Before) */
async function expectMenuVisible(page: Page) {
    await expect(page.getByTestId('swipe-btn-configure')).toBeVisible({ timeout: 3_000 })
    await expect(page.getByTestId('swipe-btn-add-after')).toBeVisible()
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
        await clickCenterNode(page)

        // Radial menu should appear with 3 main buttons
        await expectMenuVisible(page)

        // Hover the "After" button — sub-menu expands (User, Job, Recent)
        const afterBtn = page.getByTestId('swipe-btn-add-after')
        await afterBtn.hover()
        await page.waitForTimeout(200)

        // Sub-buttons should appear
        await expect(page.getByTestId('ext-after-subflow')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-job')).toBeVisible()
        await expect(page.getByTestId('ext-after-recent')).toBeVisible()
    })

    test('click mode: dismiss menu by clicking node again', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        await clickCenterNode(page)
        await expectMenuHidden(page)
    })

    // ── 2. Hold mode ─────────────────────────────────────────────────────

    test('hold mode: menu does NOT open on quick click', async ({ page }) => {
        await selectMode(page, 'Hold')

        await clickCenterNode(page)
        await expectMenuVisible(page)

        // Quick-clicking After should NOT expand sub-menu in hold mode
        const afterBtn = page.getByTestId('swipe-btn-add-after')
        await afterBtn.click()

        await expect(page.getByTestId('ext-after-subflow')).not.toBeVisible({ timeout: 1_000 })
    })

    test('hold mode: menu expands on long-press', async ({ page }) => {
        await selectMode(page, 'Hold')

        await clickCenterNode(page)
        await expectMenuVisible(page)

        // Long-press the After button
        const afterBtn = page.getByTestId('swipe-btn-add-after')
        const afterBox = await afterBtn.boundingBox()
        expect(afterBox).toBeTruthy()

        await page.mouse.move(afterBox!.x + afterBox!.width / 2, afterBox!.y + afterBox!.height / 2)
        await page.mouse.down()
        await page.waitForTimeout(600)
        await page.mouse.up()

        // Sub-buttons should now be visible
        await expect(page.getByTestId('ext-after-subflow')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-job')).toBeVisible()
        await expect(page.getByTestId('ext-after-recent')).toBeVisible()
    })

    // ── 3. Swipe mode ────────────────────────────────────────────────────

    test('swipe mode: hovering node shows radial menu', async ({ page }) => {
        await selectMode(page, 'Swipe')

        const node = page.getByTestId('mock-node-center-node')
        await node.hover()

        await expectMenuVisible(page)

        // Hover After — sub-menu should expand
        const afterBtn = page.getByTestId('swipe-btn-add-after')
        await afterBtn.hover()

        await expect(page.getByTestId('ext-after-subflow')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-job')).toBeVisible()
        await expect(page.getByTestId('ext-after-recent')).toBeVisible()
    })

    test('swipe mode: hovering config expands config sub-menu', async ({ page }) => {
        await selectMode(page, 'Swipe')

        await page.getByTestId('mock-node-center-node').hover()
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-configure').hover()

        // Config sub-buttons: Attach, Settings, Delete
        await expect(page.getByTestId('ext-cfg-attach')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-cfg-settings')).toBeVisible()
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
            'swipe-btn-add-before',
        ]) {
            const btn = page.getByTestId(testId)
            const box = await btn.boundingBox()
            expect(box, `${testId} should have a bounding box`).toBeTruthy()
            expect(box!.width, `${testId} width > 0`).toBeGreaterThan(20)
            expect(box!.height, `${testId} height > 0`).toBeGreaterThan(20)
        }
    })

    // ── Multi-section layout ─────────────────────────────────────────────

    test('all 3 preview sections render with nodes', async ({ page }) => {
        await expect(page.getByTestId('mock-node-center-node')).toBeVisible({ timeout: 3_000 })
        await expect(page.getByTestId('mock-node-left-node')).toBeVisible({ timeout: 3_000 })
        await expect(page.getByTestId('mock-node-right-node')).toBeVisible({ timeout: 3_000 })
    })

    // ── Touch event tests ────────────────────────────────────────────────

    test('touch: tap opens menu in click mode', async ({ page }) => {
        await selectMode(page, 'Click')

        const node = page.getByTestId('mock-node-center-node')
        const box = await node.boundingBox()
        expect(box).toBeTruthy()
        const cx = box!.x + box!.width / 2
        const cy = box!.y + box!.height / 2

        // Use CDP to dispatch real touch events
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: cx, y: cy }],
        })
        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchEnd',
            touchPoints: [],
        })

        await expectMenuVisible(page)
        await cdp.detach()
    })

    test('touch: buttons have touch-action:none to prevent text selection', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        // All radial buttons should have touch-action:none and user-select:none
        for (const testId of [
            'swipe-btn-configure',
            'swipe-btn-add-after',
            'swipe-btn-add-before',
        ]) {
            const btn = page.getByTestId(testId)
            const styles = await btn.evaluate(el => {
                const s = getComputedStyle(el)
                return {
                    touchAction: s.touchAction,
                    userSelect: s.userSelect,
                }
            })
            expect(styles.touchAction, `${testId} touch-action`).toBe('none')
            expect(styles.userSelect, `${testId} user-select`).toBe('none')
        }
    })

    test('touch: swipe container has correct CSS for touch prevention', async ({ page }) => {
        await selectMode(page, 'Swipe')
        await page.getByTestId('mock-node-center-node').hover()
        await expectMenuVisible(page)

        const container = page.getByTestId('swipe-buttons-menu')
        const styles = await container.evaluate(el => {
            const s = getComputedStyle(el)
            return {
                touchAction: s.touchAction,
                userSelect: s.userSelect,
            }
        })
        expect(styles.touchAction).toBe('none')
        expect(styles.userSelect).toBe('none')
    })

    test('touch: no text selected after hover interaction', async ({ page }) => {
        await selectMode(page, 'Swipe')

        // Hover across multiple buttons
        const node = page.getByTestId('mock-node-center-node')
        await node.hover()
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-add-after').hover()
        await page.waitForTimeout(100)
        await page.getByTestId('swipe-btn-configure').hover()
        await page.waitForTimeout(100)

        const selection = await page.evaluate(() => window.getSelection()?.toString() || '')
        expect(selection).toBe('')
    })
})
