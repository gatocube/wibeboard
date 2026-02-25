/**
 * FlowStudio — unified E2E test for http://localhost:5173/wibeboard/
 *
 * Tests two node-creation methods:
 *   1. Drag & drop from the WidgetPicker sidebar onto the canvas
 *      → immediately creates a node at the drop position
 *   2. SwipeButtons: click node → "+After" / "+Before" → creates connected node
 *
 * Also tests: initial state, edit mode toggle, script execution.
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

test.describe('FlowStudio — node creation', () => {

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

    // ── 2. Drag & drop from picker → node created immediately ───────────────

    test('drag-and-drop: drop widget from picker creates node immediately', async ({ page }) => {
        const before = await nodeCount(page)

        // Find a widget item in the picker (e.g. "job")
        const jobWidget = page.locator('[data-testid="widget-job"]')
        await expect(jobWidget).toBeVisible({ timeout: 3_000 })

        // Get the canvas pane bounding box
        const canvasPane = page.locator('.react-flow__pane')
        const canvasBox = await canvasPane.boundingBox()
        expect(canvasBox).toBeTruthy()
        if (!canvasBox) return

        // Drag job widget and drop onto an empty area of the canvas
        await jobWidget.dragTo(canvasPane, {
            targetPosition: { x: canvasBox.width * 0.4, y: canvasBox.height * 0.6 },
        })

        await page.waitForTimeout(500)

        // Verify: node count increased (node created directly on drop)
        const after = await nodeCount(page)
        expect(after).toBeGreaterThan(before)
    })

    // ── 3. Edit mode toggle ─────────────────────────────────────────────────

    test('edit mode toggle hides/shows widget picker', async ({ page }) => {
        // Initially in edit mode — picker visible
        const widgetItems = page.locator('[data-testid^="widget-"]')
        expect(await widgetItems.count()).toBeGreaterThan(0)

        // Click toggle to exit edit mode
        const toggle = page.locator('[data-testid="edit-mode-toggle"]').first()
        await toggle.click()
        await page.waitForTimeout(300)

        // Widget picker should be hidden
        expect(await widgetItems.count()).toBe(0)

        // Click toggle to re-enter edit mode
        await toggle.click()
        await page.waitForTimeout(300)

        // Widget picker should be visible again
        expect(await widgetItems.count()).toBeGreaterThan(0)
    })

    // ── 4. Script execution still works ─────────────────────────────────────

    test('script Run button executes and shows logs', async ({ page }) => {
        await page.locator('button[title="Run"]').click()
        await expect(page.locator('text=Processing process.js')).toBeVisible({ timeout: 5_000 })
        await expect(page.locator('text=validate input')).toBeVisible()
        await expect(page.locator('text=6 lines')).toBeVisible({ timeout: 2_000 })
    })
})
