/**
 * Builder Demo Simple — E2E tests.
 *
 * Steps from docs/simple-demo.md:
 *  1. Start with only one starting node
 *  2. Starting node has no "Before" button
 *  3. After → Job = create default job node (JS script)
 *  4. On new node: After → Job = create another job node
 *  5. On last node: Before → Job = insert node between
 *  6. On inserted node: Config → Delete = node removed
 *  7. Undo (Cmd+Z) = deleted node restored
 */

import { test, expect, type Page } from '@playwright/test'
// @ts-ignore — .mjs has no type declarations
import { breath } from '../packages/test-runner/src/human.mjs'

test.setTimeout(90_000)

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Navigate to builder-simple page with clean localStorage */
async function openPage(page: Page) {
    // Inject cleanup script that runs BEFORE any page JS
    await page.addInitScript(() => {
        localStorage.removeItem('flowstudio_workflows')
        localStorage.removeItem('flowstudio_active_workflow')
    })
    await page.goto('?page=builder-simple')
    await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 5_000 })
}

/** Count nodes on the canvas */
async function nodeCount(page: Page) {
    return page.locator('.react-flow__node').count()
}

/** Count edges on the canvas */
async function edgeCount(page: Page) {
    return page.locator('.react-flow__edge').count()
}

/** Click a node by data-id — dispatches pointer events that FlowStudio needs for selection */
async function clickNode(page: Page, nodeId: string) {
    const node = page.locator(`.react-flow__node[data-id="${nodeId}"]`)
    await expect(node).toBeVisible({ timeout: 5_000 })
    await page.evaluate((nid) => {
        const el = document.querySelector(`.react-flow__node[data-id="${nid}"]`)
        if (el) {
            el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
            el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }))
        }
    }, nodeId)
    await page.waitForTimeout(400)
}

/**
 * Click a SwipeButtons button by test-id.
 *
 * Dispatches pointerenter + click in browser context — framer-motion
 * motion.button with position: fixed doesn't respond to Playwright's .click().
 */
async function clickSwipeBtn(page: Page, testId: string) {
    const btn = page.getByTestId(testId)
    await expect(btn).toBeVisible({ timeout: 5_000 })
    await page.evaluate((tid) => {
        const el = document.querySelector(`[data-testid="${tid}"]`)
        if (el) {
            el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, cancelable: true }))
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        }
    }, testId)
    await page.waitForTimeout(400)
}

/** Find the most recently added node ID (highest numeric timestamp) */
async function getLastNodeId(page: Page): Promise<string> {
    const nodes = page.locator('.react-flow__node')
    const count = await nodes.count()
    const ids: string[] = []
    for (let i = 0; i < count; i++) {
        const id = await nodes.nth(i).getAttribute('data-id')
        if (id) ids.push(id)
    }
    ids.sort((a, b) => {
        const tsA = parseInt(a.replace('node-', '')) || 0
        const tsB = parseInt(b.replace('node-', '')) || 0
        return tsB - tsA
    })
    return ids[0] || ''
}

// ── Test suite ───────────────────────────────────────────────────────────────

test.describe('Builder Demo Simple — flow construction', () => {

    test('full flow: add nodes, delete, and undo', async ({ page }) => {
        await openPage(page)
        await breath(1500)

        // ── Step 1: Start with only one starting node ──
        expect(await nodeCount(page)).toBe(1)
        expect(await edgeCount(page)).toBe(0)

        const startNode = page.locator('.react-flow__node[data-id="start-1"]')
        await expect(startNode).toBeVisible()

        // ── Step 2: Starting node has no "Before" button ──
        await clickNode(page, 'start-1')
        await expect(page.getByTestId('swipe-btn-add-after')).toBeVisible({ timeout: 5_000 })
        await expect(page.getByTestId('swipe-btn-configure')).toBeVisible()
        await expect(page.getByTestId('swipe-btn-add-before')).not.toBeVisible({ timeout: 2_000 })
        await breath()

        // ── Step 3: After → Job = create default job node (JS script) ──
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')

        await page.waitForTimeout(600)
        expect(await nodeCount(page)).toBe(2)
        expect(await edgeCount(page)).toBe(1)

        const firstNewNodeId = await getLastNodeId(page)
        expect(firstNewNodeId).toBeTruthy()
        await breath()

        // ── Step 4: On new node: After → Job = create another job node ──
        await page.waitForTimeout(600) // let autoFit pan
        await clickNode(page, firstNewNodeId)
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')

        await page.waitForTimeout(600)
        expect(await nodeCount(page)).toBe(3)
        expect(await edgeCount(page)).toBe(2)

        const secondNodeId = await getLastNodeId(page)
        expect(secondNodeId).toBeTruthy()
        await breath()

        // ── Step 5: On last node: Before → Job = insert node between ──
        await clickNode(page, secondNodeId)
        await clickSwipeBtn(page, 'swipe-btn-add-before')
        await clickSwipeBtn(page, 'ext-before-job')

        await page.waitForTimeout(600)
        expect(await nodeCount(page)).toBe(4)
        expect(await edgeCount(page)).toBe(3)

        const insertedNodeId = await getLastNodeId(page)
        expect(insertedNodeId).toBeTruthy()
        await breath()

        // ── Step 6: On inserted node: Config → Delete = node removed ──
        await clickNode(page, insertedNodeId)
        await clickSwipeBtn(page, 'swipe-btn-configure')
        await clickSwipeBtn(page, 'ext-cfg-delete')

        await page.waitForTimeout(600)
        expect(await nodeCount(page)).toBe(3)
        expect(await edgeCount(page)).toBe(1)
        await breath()

        // ── Step 7: Undo (Cmd+Z) = deleted node restored ──
        await page.keyboard.press('Meta+z')
        await page.waitForTimeout(600)
        expect(await nodeCount(page)).toBe(4)
        expect(await edgeCount(page)).toBe(3)
        await breath()

        // ── Step 8: Config → Settings = Configurator is visible ──
        // ── Step 8: Config → Settings = Configurator is visible ──
        await clickNode(page, insertedNodeId)

        await clickSwipeBtn(page, 'swipe-btn-configure')
        await clickSwipeBtn(page, 'ext-cfg-settings')

        const settingsPanel = page.getByTestId('node-settings-panel')
        await expect(settingsPanel).toBeVisible({ timeout: 5_000 })
        const rawBtn = page.getByTestId('settings-mode-raw')
        await expect(rawBtn).toBeVisible()
        await breath()
    })

    test('new workflow creation positions start node on the left', async ({ page }) => {
        await openPage(page)
        await breath(1000)

        // ── Verify workflow selector is visible ──
        await expect(page.getByTestId('workflow-selector')).toBeVisible()

        // ── Click "+ New" button ──
        await page.getByTestId('workflow-new-btn').click()
        await page.waitForTimeout(600)

        // ── Verify exactly 1 node (start node) in the new workflow ──
        expect(await nodeCount(page)).toBe(1)

        // ── Verify undo/redo bar is visible ──
        await expect(page.getByTestId('undo-redo-bar')).toBeVisible()

        // ── Verify the start node is in the left third of the viewport ──
        const startNode = page.locator('.react-flow__node').first()
        await expect(startNode).toBeVisible()

        const nodeBox = await startNode.boundingBox()
        const viewport = page.viewportSize()
        expect(nodeBox).toBeTruthy()
        expect(viewport).toBeTruthy()

        if (nodeBox && viewport) {
            // The start node's left edge should be within the left third
            const leftThird = viewport.width / 3
            expect(nodeBox.x).toBeLessThan(leftThird)
        }

        await breath()
    })
})
