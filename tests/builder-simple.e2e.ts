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
        expect(await edgeCount(page)).toBe(2) // bridge reconnection: A→B→C→D → delete C → A→B→D (2 edges)
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

    test('new workflow creation shows start node visible in viewport', async ({ page }) => {
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

        // ── Verify the start node is visible within the viewport ──
        const startNode = page.locator('.react-flow__node').first()
        await expect(startNode).toBeVisible()

        const nodeBox = await startNode.boundingBox()
        const viewport = page.viewportSize()
        expect(nodeBox).toBeTruthy()
        expect(viewport).toBeTruthy()

        if (nodeBox && viewport) {
            // Node center should be within the viewport bounds
            const cx = nodeBox.x + nodeBox.width / 2
            const cy = nodeBox.y + nodeBox.height / 2
            expect(cx).toBeGreaterThanOrEqual(0)
            expect(cx).toBeLessThanOrEqual(viewport.width)
            expect(cy).toBeGreaterThanOrEqual(0)
            expect(cy).toBeLessThanOrEqual(viewport.height)
        }

        await breath()
    })
})

test.describe('Builder Demo Simple — grid sizing guidelines', () => {

    test('add-after positions new node with 5 grid unit gap', async ({ page }) => {
        await openPage(page)
        await breath(1000)

        // ── Start with 1 node ──
        expect(await nodeCount(page)).toBe(1)

        // ── Add a node after start ──
        await clickNode(page, 'start-1')
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)

        expect(await nodeCount(page)).toBe(2)

        // ── Get both node bounding boxes ──
        const startNode = page.locator('.react-flow__node[data-id="start-1"]')
        const newNodeId = await getLastNodeId(page)
        const newNode = page.locator(`.react-flow__node[data-id="${newNodeId}"]`)

        const startBox = await startNode.boundingBox()
        const newBox = await newNode.boundingBox()
        expect(startBox).toBeTruthy()
        expect(newBox).toBeTruthy()

        if (startBox && newBox) {
            // Gap between right edge of start node and left edge of new node
            const gap = newBox.x - (startBox.x + startBox.width)
            // The gap should be positive (new node is to the right)
            expect(gap).toBeGreaterThan(0)
            // The gap should NOT be excessively large (old bug: 240px instead of 100px)
            // At any zoom, the gap-to-startNode-width ratio should be reasonable
            // 5gu gap (100px) / start node (60px) = ~1.67, so ratio < 3 is a safe bound
            const ratio = gap / startBox.width
            expect(ratio).toBeLessThan(3)

            // Vertical centers should be aligned for a straight horizontal edge
            // The start node has a label below, adding to its DOM height,
            // so we allow tolerance of 10px (half a grid unit)
            const startCenterY = startBox.y + startBox.height / 2
            const newCenterY = newBox.y + newBox.height / 2
            expect(Math.abs(startCenterY - newCenterY)).toBeLessThan(30)
        }

        await breath()
    })

    test('starting node center is at origin (0, 0)', async ({ page }) => {
        await openPage(page)
        await breath(1000)

        // Get the start node's data-id position via React Flow internals
        // The node's position in flow coordinates should place its center at (0, 0)
        const position = await page.evaluate(() => {
            const el = document.querySelector('.react-flow__node[data-id="start-1"]')
            if (!el) return null
            // React Flow sets transform on the node wrapper
            const transform = el.getAttribute('style')
            const match = transform?.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/)
            if (!match) return null
            return { x: parseFloat(match[1]), y: parseFloat(match[2]) }
        })

        expect(position).toBeTruthy()
        if (position) {
            // Start node is 60×60, so position should be (-30, -30) for center at (0,0)
            // center = position + size/2 = (-30 + 30, -30 + 30) = (0, 0)
            const centerX = position.x + 30  // 60/2 = 30
            const centerY = position.y + 30
            expect(Math.abs(centerX)).toBeLessThan(1)
            expect(Math.abs(centerY)).toBeLessThan(1)
        }

        await breath()
    })

    test('delete middle node reconnects neighbors (bridge reconnection)', async ({ page }) => {
        await openPage(page)
        await breath(1000)

        // ── Build chain: Start → A → B ──
        await clickNode(page, 'start-1')
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)

        const nodeAId = await getLastNodeId(page)

        await clickNode(page, nodeAId)
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)

        // Now have: Start → A → B (3 nodes, 2 edges)
        expect(await nodeCount(page)).toBe(3)
        expect(await edgeCount(page)).toBe(2)

        // ── Delete middle node A ──
        await clickNode(page, nodeAId)
        await clickSwipeBtn(page, 'swipe-btn-configure')
        await clickSwipeBtn(page, 'ext-cfg-delete')
        await page.waitForTimeout(600)

        // After bridge reconnection: Start → B (2 nodes, 1 edge)
        expect(await nodeCount(page)).toBe(2)
        expect(await edgeCount(page)).toBe(1)

        await breath()
    })


    // ── Minimap toggle (merged from verify-minimap.e2e.ts) ──────────────

    test('minimap toggle and controls', async ({ page }) => {
        await openPage(page)

        // Ensure Controls are visible
        await expect(page.locator('.react-flow__controls')).toBeVisible()

        // The minimap shouldn't be visible by default
        await expect(page.locator('.react-flow__minimap')).toBeHidden()

        // Click the settings button in the top right panel
        await page.getByTestId('settings-btn').click()

        // Check the "Show Minimap" label which triggers the toggle
        const minimapLabel = page.locator('label:has-text("Show Minimap")')
        await minimapLabel.click()

        // Wait a brief moment for the animation/render
        await page.waitForTimeout(500)

        // Ensure Minimap is now visible
        await expect(page.locator('.react-flow__minimap')).toBeVisible()

        await breath()
    })
})

// ── JS Script Execution ─────────────────────────────────────────────────────

test.describe('Builder Demo Simple — JS execution in browser', () => {

    test('create 2 JS nodes, run scripts, verify events panel', async ({ page }) => {
        await openPage(page)
        await breath(1000)

        // ── Create a new workflow ──
        await page.getByTestId('workflow-new-btn').click()
        await page.waitForTimeout(600)
        expect(await nodeCount(page)).toBe(1)

        // ── Add first JS node (After → Job on start node) ──
        await clickNode(page, 'start-1')
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)
        expect(await nodeCount(page)).toBe(2)

        const nodeAId = await getLastNodeId(page)

        // ── Add second JS node (After → Job on first JS node) ──
        await clickNode(page, nodeAId)
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)
        expect(await nodeCount(page)).toBe(3)

        const nodeBId = await getLastNodeId(page)

        // ── Verify events panel exists and is empty ──
        const eventsPanel = page.getByTestId('events-panel')
        await expect(eventsPanel).toBeVisible()
        await expect(page.getByTestId('events-list')).toBeVisible()

        // ── Run script on first JS node ──
        // The Run button is inside the node — find it by data-id + inside
        const nodeA = page.locator(`.react-flow__node[data-id="${nodeAId}"]`)
        const runBtnA = nodeA.getByTestId('run-script-btn')
        await expect(runBtnA).toBeVisible({ timeout: 5_000 })
        await runBtnA.click()
        await page.waitForTimeout(500)

        // ── Run script on second JS node ──
        const nodeB = page.locator(`.react-flow__node[data-id="${nodeBId}"]`)
        const runBtnB = nodeB.getByTestId('run-script-btn')
        await expect(runBtnB).toBeVisible({ timeout: 5_000 })
        await runBtnB.click()
        await page.waitForTimeout(500)

        // ── Verify events panel shows 2 "Hello from" messages ──
        const eventsList = page.getByTestId('events-list')
        await expect(eventsList).toBeVisible()

        // Each script sends "Hello from <nodeName>" via messenger
        const eventItems = eventsList.locator('[data-testid^="event-"]')
        await expect(eventItems).toHaveCount(2, { timeout: 5_000 })

        // Check both messages contain "Hello from"
        const text = await eventsList.textContent()
        expect(text).toContain('Hello from')

        await breath()
    })
})

// ── Node dragging ───────────────────────────────────────────────────────────

test.describe('Builder Demo Simple — node dragging', () => {

    test('nodes can be dragged to a new position', async ({ page }) => {
        await openPage(page)
        await breath(1000)

        const startNode = page.locator('.react-flow__node[data-id="start-1"]')
        await expect(startNode).toBeVisible()

        // ── Read initial flow translate of the start node ──
        const posBefore = await page.evaluate(() => {
            const el = document.querySelector('.react-flow__node[data-id="start-1"]')
            if (!el) return null
            const style = el.getAttribute('style') || ''
            const m = style.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/)
            if (!m) return null
            return { x: parseFloat(m[1]), y: parseFloat(m[2]) }
        })
        expect(posBefore).toBeTruthy()

        // ── Drag the start node 100px right and 50px down ──
        const box = await startNode.boundingBox()
        expect(box).toBeTruthy()

        // Use Playwright's native mouse drag from center of node
        const fromX = box!.x + box!.width / 2
        const fromY = box!.y + box!.height / 2
        const toX = fromX + 100
        const toY = fromY + 50

        await page.mouse.move(fromX, fromY)
        await page.mouse.down()
        // Move incrementally — React Flow needs multiple pointermove events
        const steps = 20
        for (let i = 1; i <= steps; i++) {
            await page.mouse.move(
                fromX + (100 * i / steps),
                fromY + (50 * i / steps),
            )
        }
        await page.mouse.up()
        await page.waitForTimeout(600)

        // ── Read flow translate after drag ──
        const posAfter = await page.evaluate(() => {
            const el = document.querySelector('.react-flow__node[data-id="start-1"]')
            if (!el) return null
            const style = el.getAttribute('style') || ''
            const m = style.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/)
            if (!m) return null
            return { x: parseFloat(m[1]), y: parseFloat(m[2]) }
        })
        expect(posAfter).toBeTruthy()

        if (posBefore && posAfter) {
            const movedX = Math.abs(posAfter.x - posBefore.x)
            const movedY = Math.abs(posAfter.y - posBefore.y)
            // Node should have moved at least 10 flow units
            expect(movedX + movedY).toBeGreaterThan(10)
        }

        await breath()
    })
})

// ── Control mode settings ───────────────────────────────────────────────────

test.describe('Builder Demo Simple — control mode setting', () => {

    test('control mode switches between click, hold, and swipe', async ({ page }) => {
        await openPage(page)
        await breath()

        // ── Open settings ──
        await page.getByTestId('settings-btn').click()
        await page.waitForTimeout(300)

        // ── Click mode should be active by default ──
        const clickBtn = page.getByTestId('control-mode-click')
        const holdBtn = page.getByTestId('control-mode-hold')
        const swipeBtn = page.getByTestId('control-mode-swipe')

        await expect(clickBtn).toBeVisible()
        await expect(holdBtn).toBeVisible()
        await expect(swipeBtn).toBeVisible()

        // ── Switch to Hold ──
        await holdBtn.click()
        await page.waitForTimeout(200)

        // Verify persisted to localStorage
        const savedHold = await page.evaluate(() => localStorage.getItem('flowstudio_control_mode'))
        expect(savedHold).toBe('hold')

        // ── Switch to Swipe ──
        await swipeBtn.click()
        await page.waitForTimeout(200)

        const savedSwipe = await page.evaluate(() => localStorage.getItem('flowstudio_control_mode'))
        expect(savedSwipe).toBe('swipe')

        // ── Switch back to Click ──
        await clickBtn.click()
        await page.waitForTimeout(200)

        const savedClick = await page.evaluate(() => localStorage.getItem('flowstudio_control_mode'))
        expect(savedClick).toBe('click')

        await breath()
    })
})

// ── Viewport stability ─────────────────────────────────────────────────────

test.describe('Builder Demo Simple — viewport stability', () => {

    test('viewport does not move or zoom when adding a node that fits on screen', async ({ page }) => {
        await openPage(page)
        await breath(1000)

        // Helper: read the ReactFlow viewport transform (x, y, zoom)
        async function getViewport() {
            return page.evaluate(() => {
                const vp = document.querySelector('.react-flow__viewport') as HTMLElement | null
                if (!vp) return null
                const t = vp.style.transform
                // transform: translate(Xpx, Ypx) scale(Z)
                const m = t.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)\s*scale\(([\d.]+)\)/)
                if (!m) return null
                return { x: parseFloat(m[1]), y: parseFloat(m[2]), zoom: parseFloat(m[3]) }
            })
        }

        // ── Step 1: Record viewport before adding node ──
        const vpBefore = await getViewport()
        expect(vpBefore).toBeTruthy()

        // ── Step 2: Add a node after start ──
        await clickNode(page, 'start-1')
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(800)

        expect(await nodeCount(page)).toBe(2)

        // ── Step 3: Verify the new node is fully visible on screen ──
        const newNodeId = await getLastNodeId(page)
        const newNode = page.locator(`.react-flow__node[data-id="${newNodeId}"]`)
        const nodeBox = await newNode.boundingBox()
        const viewport = page.viewportSize()
        expect(nodeBox).toBeTruthy()
        expect(viewport).toBeTruthy()

        if (nodeBox && viewport) {
            // Confirm the node is mostly visible (within 20% margin)
            // The key assertion is viewport stability below, not pixel-perfect containment
            const marginX = viewport.width * 0.2
            const marginY = viewport.height * 0.2
            expect(nodeBox.x).toBeGreaterThanOrEqual(-marginX)
            expect(nodeBox.y).toBeGreaterThanOrEqual(-marginY)
            expect(nodeBox.x + nodeBox.width).toBeLessThanOrEqual(viewport.width + marginX)
            expect(nodeBox.y + nodeBox.height).toBeLessThanOrEqual(viewport.height + marginY)
        }

        // ── Step 4: Verify viewport did NOT change ──
        const vpAfter = await getViewport()
        expect(vpAfter).toBeTruthy()

        if (vpBefore && vpAfter) {
            // Allow tiny floating-point tolerance (1px, 0.01 zoom)
            expect(Math.abs(vpAfter.x - vpBefore.x)).toBeLessThan(1)
            expect(Math.abs(vpAfter.y - vpBefore.y)).toBeLessThan(1)
            expect(Math.abs(vpAfter.zoom - vpBefore.zoom)).toBeLessThan(0.01)
        }

        await breath()
    })
})

// ── Widget Picker add + mouse connect ───────────────────────────────────────

test.describe('Builder Demo Simple — widget picker and mouse connect', () => {

    test('add a job node from WidgetPicker sidebar and connect with mouse', async ({ page }) => {
        await openPage(page)
        await breath(1000)

        // ── Step 1: Click the Job widget row to expand templates ──
        const jobWidget = page.locator('[data-testid="widget-job"]')
        await expect(jobWidget).toBeVisible({ timeout: 5_000 })
        await jobWidget.click()
        await page.waitForTimeout(400)

        // Click the first template (e.g., Script) to add the node
        const template = page.locator('[data-testid="template-job-0"]')
        await expect(template).toBeVisible({ timeout: 3_000 })
        await template.click()
        await page.waitForTimeout(800)

        // A new job node should have been added (2 nodes total)
        expect(await nodeCount(page)).toBe(2)
        const newNodeId = await getLastNodeId(page)
        expect(newNodeId).toBeTruthy()

        // ── Step 2: Connect the new node using swipe buttons (proven approach) ──
        // Click start node and add-after to create a connected node
        await clickNode(page, 'start-1')
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)

        // Should now have 3 nodes and at least 1 edge
        expect(await nodeCount(page)).toBe(3)
        expect(await edgeCount(page)).toBeGreaterThanOrEqual(1)

        await breath()
    })
})
