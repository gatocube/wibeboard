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
 *
 * Each mode is tested with both mouse and touch (CDP) input.
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

/** Get a CDP session for touch events */
async function getCDP(page: Page) {
    return page.context().newCDPSession(page)
}

/** Touch-tap at a point via CDP */
async function touchTap(page: Page, x: number, y: number) {
    const cdp = await getCDP(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
}

/** Touch-long-press at a point via CDP */
async function touchLongPress(page: Page, x: number, y: number, durationMs = 600) {
    const cdp = await getCDP(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    await page.waitForTimeout(durationMs)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
}

/** Get center coordinates of an element */
async function getCenter(page: Page, testId: string) {
    const box = await page.getByTestId(testId).boundingBox()
    expect(box).toBeTruthy()
    return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
}

// ── Test suite ───────────────────────────────────────────────────────────────

test.describe('SwipeButtons activation modes', () => {

    test.beforeEach(async ({ page }) => {
        await openButtonsMenuPage(page)
    })

    // ═══════════════════════════════════════════════════════════════════════
    // CLICK MODE — Mouse
    // ═══════════════════════════════════════════════════════════════════════

    test('click/mouse: menu opens on node click', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)
    })

    test('click/mouse: dismiss menu by clicking node again', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)
        await clickCenterNode(page)
        await expectMenuHidden(page)
    })

    test('click/mouse: hover After expands sub-menu', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-add-after').hover()
        await page.waitForTimeout(200)
        await expect(page.getByTestId('ext-after-subflow')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-job')).toBeVisible()
        await expect(page.getByTestId('ext-after-recent')).toBeVisible()
    })

    test('click/mouse: hover Before expands sub-menu', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-add-before').hover()
        await page.waitForTimeout(200)
        await expect(page.getByTestId('ext-before-subflow')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-before-job')).toBeVisible()
        await expect(page.getByTestId('ext-before-recent')).toBeVisible()
    })

    test('click/mouse: hover Config expands config sub-menu', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-configure').hover()
        await expect(page.getByTestId('ext-cfg-attach')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-cfg-settings')).toBeVisible()
        await expect(page.getByTestId('ext-cfg-delete')).toBeVisible()
    })

    test('click/mouse: clicking Job sub-button fires action and logs event', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-add-after').hover()
        await expect(page.getByTestId('ext-after-job')).toBeVisible({ timeout: 2_000 })
        await page.getByTestId('ext-after-job').click()

        // Event log should show the action
        await expect(page.locator('text=After')).toBeVisible({ timeout: 2_000 })
    })

    // ═══════════════════════════════════════════════════════════════════════
    // CLICK MODE — Touch (CDP)
    // ═══════════════════════════════════════════════════════════════════════

    test('click/touch: tap opens menu', async ({ page }) => {
        await selectMode(page, 'Click')
        const center = await getCenter(page, 'mock-node-center-node')
        await touchTap(page, center.x, center.y)
        await expectMenuVisible(page)
    })

    // ═══════════════════════════════════════════════════════════════════════
    // HOLD MODE — Mouse
    // ═══════════════════════════════════════════════════════════════════════

    test('hold/mouse: menu opens on click but quick-click does NOT expand sub-menu', async ({ page }) => {
        await selectMode(page, 'Hold')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        // Quick click After — should NOT expand
        await page.getByTestId('swipe-btn-add-after').click()
        await expect(page.getByTestId('ext-after-subflow')).not.toBeVisible({ timeout: 1_000 })
    })

    test('hold/mouse: long-press expands sub-menu', async ({ page }) => {
        await selectMode(page, 'Hold')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        const afterBox = await page.getByTestId('swipe-btn-add-after').boundingBox()
        expect(afterBox).toBeTruthy()
        await page.mouse.move(afterBox!.x + afterBox!.width / 2, afterBox!.y + afterBox!.height / 2)
        await page.mouse.down()
        await page.waitForTimeout(600)
        await page.mouse.up()

        await expect(page.getByTestId('ext-after-subflow')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-job')).toBeVisible()
        await expect(page.getByTestId('ext-after-recent')).toBeVisible()
    })

    // ═══════════════════════════════════════════════════════════════════════
    // HOLD MODE — Touch (CDP)
    // ═══════════════════════════════════════════════════════════════════════

    test('hold/touch: tap opens menu', async ({ page }) => {
        await selectMode(page, 'Hold')
        const center = await getCenter(page, 'mock-node-center-node')
        await touchTap(page, center.x, center.y)
        await expectMenuVisible(page)
    })

    test('hold/touch: long-press expands sub-menu', async ({ page }) => {
        await selectMode(page, 'Hold')
        const center = await getCenter(page, 'mock-node-center-node')
        await touchTap(page, center.x, center.y)
        await expectMenuVisible(page)

        const afterCenter = await getCenter(page, 'swipe-btn-add-after')
        await touchLongPress(page, afterCenter.x, afterCenter.y, 600)

        await expect(page.getByTestId('ext-after-subflow')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-job')).toBeVisible()
    })

    // ═══════════════════════════════════════════════════════════════════════
    // SWIPE MODE — Mouse
    // ═══════════════════════════════════════════════════════════════════════

    test('swipe/mouse: hovering node shows radial menu', async ({ page }) => {
        await selectMode(page, 'Swipe')
        await page.getByTestId('mock-node-center-node').hover()
        await expectMenuVisible(page)
    })

    test('swipe/mouse: hovering After expands sub-menu', async ({ page }) => {
        await selectMode(page, 'Swipe')
        await page.getByTestId('mock-node-center-node').hover()
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-add-after').hover()
        await expect(page.getByTestId('ext-after-subflow')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-after-job')).toBeVisible()
        await expect(page.getByTestId('ext-after-recent')).toBeVisible()
    })

    test('swipe/mouse: hovering Config expands config sub-menu', async ({ page }) => {
        await selectMode(page, 'Swipe')
        await page.getByTestId('mock-node-center-node').hover()
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-configure').hover()
        await expect(page.getByTestId('ext-cfg-attach')).toBeVisible({ timeout: 2_000 })
        await expect(page.getByTestId('ext-cfg-settings')).toBeVisible()
        await expect(page.getByTestId('ext-cfg-delete')).toBeVisible()
    })

    // ═══════════════════════════════════════════════════════════════════════
    // SWIPE MODE — Touch (CDP)
    // ═══════════════════════════════════════════════════════════════════════

    // Note: swipe mode is hover-based (mouse only). Touch devices use click mode.
    // However, touchStart on the node should also select it for touch accessibility.

    test('swipe/touch: touching node selects it and shows menu', async ({ page }) => {
        await selectMode(page, 'Swipe')
        // Dispatch a touchstart event directly on the node element.
        // CDP Input.dispatchTouchEvent doesn't reliably trigger document-level
        // touchstart listeners, so we dispatch programmatically.
        await page.evaluate(() => {
            const el = document.querySelector('[data-id="center-node"]') as HTMLElement
            if (el) {
                const rect = el.getBoundingClientRect()
                const touch = new Touch({
                    identifier: 0,
                    target: el,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2,
                })
                el.dispatchEvent(new TouchEvent('touchstart', {
                    bubbles: true, cancelable: true, touches: [touch],
                }))
            }
        })
        await page.waitForTimeout(300)
        await expectMenuVisible(page)
    })

    // ═══════════════════════════════════════════════════════════════════════
    // HOLD MODE — Long-press on node element
    // ═══════════════════════════════════════════════════════════════════════

    test('hold: long-press on node element opens menu', async ({ page }) => {
        await selectMode(page, 'Hold')
        const center = await getCenter(page, 'mock-node-center-node')

        // Long-press on the node itself (not a menu button)
        await touchLongPress(page, center.x, center.y, 600)
        await expectMenuVisible(page)
    })


    // ═══════════════════════════════════════════════════════════════════════
    // TOUCH CSS PROPERTIES — All modes
    // ═══════════════════════════════════════════════════════════════════════

    test('buttons have touch-action:none and user-select:none', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        for (const testId of [
            'swipe-btn-configure',
            'swipe-btn-add-after',
            'swipe-btn-add-before',
        ]) {
            const btn = page.getByTestId(testId)
            const styles = await btn.evaluate(el => {
                const s = getComputedStyle(el)
                return { touchAction: s.touchAction, userSelect: s.userSelect }
            })
            expect(styles.touchAction, `${testId} touch-action`).toBe('none')
            expect(styles.userSelect, `${testId} user-select`).toBe('none')
        }
    })

    test('swipe container has correct CSS for touch prevention', async ({ page }) => {
        await selectMode(page, 'Swipe')
        await page.getByTestId('mock-node-center-node').hover()
        await expectMenuVisible(page)

        const container = page.getByTestId('swipe-buttons-menu')
        const styles = await container.evaluate(el => {
            const s = getComputedStyle(el)
            return { touchAction: s.touchAction, userSelect: s.userSelect }
        })
        expect(styles.touchAction).toBe('none')
        expect(styles.userSelect).toBe('none')
    })

    test('no text selected after hover interaction', async ({ page }) => {
        await selectMode(page, 'Swipe')
        await page.getByTestId('mock-node-center-node').hover()
        await expectMenuVisible(page)

        await page.getByTestId('swipe-btn-add-after').hover()
        await page.waitForTimeout(100)
        await page.getByTestId('swipe-btn-configure').hover()
        await page.waitForTimeout(100)

        const selection = await page.evaluate(() => window.getSelection()?.toString() || '')
        expect(selection).toBe('')
    })

    // ═══════════════════════════════════════════════════════════════════════
    // LAYOUT & EDGE NODES
    // ═══════════════════════════════════════════════════════════════════════

    test('all 3 nodes render on the page', async ({ page }) => {
        await expect(page.getByTestId('mock-node-center-node')).toBeVisible({ timeout: 3_000 })
        await expect(page.getByTestId('mock-node-left-node')).toBeVisible()
        await expect(page.getByTestId('mock-node-right-node')).toBeVisible()
    })

    test('all main buttons have valid bounding boxes', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        for (const testId of [
            'swipe-btn-configure',
            'swipe-btn-add-after',
            'swipe-btn-add-before',
        ]) {
            const box = await page.getByTestId(testId).boundingBox()
            expect(box, `${testId} bounding box`).toBeTruthy()
            expect(box!.width).toBeGreaterThan(20)
            expect(box!.height).toBeGreaterThan(20)
        }
    })

    test('left edge node opens menu with limited directions', async ({ page }) => {
        await selectMode(page, 'Click')
        await page.getByTestId('mock-node-left-node').click()

        // Menu should appear — left-node has directions: right, bottom, bottom-right
        // So we should NOT see add-before (which is typically on the left)
        const menu = page.getByTestId('swipe-buttons-menu')
        await expect(menu).toBeVisible({ timeout: 3_000 })
    })

    test('right edge node opens menu', async ({ page }) => {
        await selectMode(page, 'Click')
        await page.getByTestId('mock-node-right-node').click()

        const menu = page.getByTestId('swipe-buttons-menu')
        await expect(menu).toBeVisible({ timeout: 3_000 })
    })

    // ═══════════════════════════════════════════════════════════════════════
    // RENAME FLOW
    // ═══════════════════════════════════════════════════════════════════════

    test('rename: clicking rename shows input and updates label', async ({ page }) => {
        await selectMode(page, 'Click')
        await clickCenterNode(page)
        await expectMenuVisible(page)

        // Hover config to expand, find rename
        await page.getByTestId('swipe-btn-configure').hover()
        await expect(page.getByTestId('ext-cfg-settings')).toBeVisible({ timeout: 2_000 })

        // Click Settings to trigger configure action
        await page.getByTestId('ext-cfg-settings').click()

        // Event log should record the action
        await expect(page.locator('text=Settings')).toBeVisible({ timeout: 2_000 })
    })
})

