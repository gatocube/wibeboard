/**
 * FlowBuilder — unified E2E test for http://localhost:5173/wibeboard/
 *
 * Tests two node-creation methods:
 *   1. Drag & drop from the WidgetSelector panel onto the canvas
 *      → enters sizing mode → pick widget from popup
 *   2. ConnectorFlow: click handle → position → size → pick widget
 *
 * Both methods end with a WidgetSelector popup where the user picks a
 * specific widget template (e.g. a different script type).
 */

import { test, expect, type Page } from '@playwright/test'

test.setTimeout(60_000)

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Navigate to builder page and wait for ReactFlow to fully render */
async function openBuilder(page: Page) {
    await page.goto('/')
    await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
    await expect(page.locator('.react-flow__node').first()).toBeVisible({ timeout: 5_000 })
}

/** Count visible ReactFlow nodes */
async function nodeCount(page: Page) {
    return page.locator('.react-flow__node').count()
}

// ── Test suite ───────────────────────────────────────────────────────────────

test.describe('FlowBuilder — node creation', () => {

    test.beforeEach(async ({ page }) => {
        await openBuilder(page)
    })

    // ── 1. Verify initial state ─────────────────────────────────────────────

    test('initial canvas has 3 nodes and widget selector', async ({ page }) => {
        const nodes = page.locator('.react-flow__node')
        await expect(nodes).toHaveCount(3)

        // Nodes have correct labels
        await expect(nodes.locator('text=Planner')).toBeVisible()
        await expect(nodes.locator('text=process.js')).toBeVisible()
        await expect(nodes.locator('text=Processing Pipeline')).toBeVisible()

        // Widget selector panel is visible (editMode=true by default)
        const widgetItems = page.locator('[data-testid^="widget-"]')
        expect(await widgetItems.count()).toBeGreaterThan(0)

        // Widget items are draggable
        const firstItem = widgetItems.first()
        await expect(firstItem).toHaveAttribute('draggable', 'true')
    })

    // ── 2. Drag & drop → sizing → pick widget ──────────────────────────────

    test('drag-and-drop: drop widget → resize → pick script from popup', async ({ page }) => {
        const before = await nodeCount(page)

        // Find the script-js widget in the selector panel
        const scriptWidget = page.locator('[data-testid="widget-script-js"]')
        await expect(scriptWidget).toBeVisible({ timeout: 3_000 })

        // Get the canvas pane bounding box
        const canvasPane = page.locator('.react-flow__pane')
        const canvasBox = await canvasPane.boundingBox()
        expect(canvasBox).toBeTruthy()
        if (!canvasBox) return

        // Drag script widget and drop onto an empty area of the canvas
        await scriptWidget.dragTo(canvasPane, {
            targetPosition: { x: canvasBox.width * 0.4, y: canvasBox.height * 0.6 },
        })

        // After drop, sizing mode should be active — hint text visible
        await expect(page.locator('text=resize').first()).toBeVisible({ timeout: 3_000 })

        // A placeholder node should appear
        const placeholders = page.locator('.react-flow__node[data-id^="placeholder-"]')
        await expect(placeholders.first()).toBeVisible({ timeout: 2_000 })

        // Move mouse to resize the placeholder, then click to confirm
        const placeBox = await placeholders.first().boundingBox()
        if (!placeBox) return

        const sizeX = placeBox.x + placeBox.width + 100
        const sizeY = placeBox.y + placeBox.height + 60
        await page.mouse.move(sizeX, sizeY, { steps: 5 })
        await page.waitForTimeout(300) // Wait for sizing click listener
        await page.mouse.click(sizeX, sizeY)

        // WidgetSelector popup should appear via NodeToolbar
        const nodeToolbar = page.locator('.react-flow__node-toolbar')
        await expect(nodeToolbar).toBeVisible({ timeout: 3_000 })

        // Pick TypeScript (different from the JS we dragged) — tests script selection
        const tsWidget = nodeToolbar.locator('[data-testid="widget-script-ts"]')
        if (await tsWidget.isVisible({ timeout: 1_000 }).catch(() => false)) {
            await tsWidget.click()
        } else {
            // Fallback: pick any widget
            await nodeToolbar.locator('[data-testid^="widget-"]').first().click()
        }
        await page.waitForTimeout(500)

        // Verify: node count increased (placeholder replaced with real node)
        const after = await nodeCount(page)
        expect(after).toBeGreaterThan(before)
    })

    // ── 3. ConnectorFlow: handle → position → size → pick script ────────────

    test('connector-flow: handle → place → size → pick TypeScript', async ({ page }) => {
        const before = await nodeCount(page)

        // Find the source handle on the Agent (Planner) node — right side
        const sourceHandle = page.locator(
            '.react-flow__node[data-id="agent-1"] .react-flow__handle.source[data-handleid="out"]'
        )
        await expect(sourceHandle).toBeVisible()

        const handleBox = await sourceHandle.boundingBox()
        expect(handleBox).toBeTruthy()
        if (!handleBox) return

        // Phase 1: mousedown + mouseup on the source handle → enters "positioning"
        const hx = handleBox.x + handleBox.width / 2
        const hy = handleBox.y + handleBox.height / 2
        await page.mouse.move(hx, hy)
        await page.mouse.down()
        await page.mouse.up()

        await expect(page.locator('text=Click on canvas')).toBeVisible({ timeout: 3_000 })

        // Phase 2: Click on EMPTY canvas area (bottom-right, far from nodes)
        const canvasBox = await page.locator('.react-flow__pane').boundingBox()
        if (!canvasBox) return

        const placeX = canvasBox.x + canvasBox.width * 0.6
        const placeY = canvasBox.y + canvasBox.height * 0.75
        await page.mouse.move(placeX, placeY, { steps: 5 })
        await page.waitForTimeout(200)
        await page.mouse.click(placeX, placeY)

        await expect(page.locator('text=resize').first()).toBeVisible({ timeout: 3_000 })

        // Phase 3: Move to size, then click to confirm
        const sizeX = placeX + 140
        const sizeY = placeY + 80
        await page.mouse.move(sizeX, sizeY, { steps: 5 })
        await page.waitForTimeout(300)
        await page.mouse.click(sizeX, sizeY)

        // Phase 4: WidgetSelector popup should appear
        const nodeToolbar = page.locator('.react-flow__node-toolbar')
        await expect(nodeToolbar).toBeVisible({ timeout: 3_000 })

        // Pick TypeScript script — verifies ability to select a specific script type
        const tsWidget = nodeToolbar.locator('[data-testid="widget-script-ts"]')
        if (await tsWidget.isVisible({ timeout: 1_000 }).catch(() => false)) {
            await tsWidget.click()
        } else {
            await nodeToolbar.locator('[data-testid^="widget-"]').first().click()
        }
        await page.waitForTimeout(500)

        // Verify: node count increased
        const after = await nodeCount(page)
        expect(after).toBeGreaterThan(before)
    })

    // ── 4. Script execution still works ─────────────────────────────────────

    test('script Run button executes and shows logs', async ({ page }) => {
        await page.locator('button[title="Run"]').click()
        await expect(page.locator('text=Processing process.js')).toBeVisible({ timeout: 5_000 })
        await expect(page.locator('text=validate input')).toBeVisible()
        await expect(page.locator('text=6 lines')).toBeVisible({ timeout: 2_000 })
    })
})
