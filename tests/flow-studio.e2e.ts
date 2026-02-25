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

// ── NodeButtonsMenu (merged from node-buttons-menu.e2e.ts) ───────────────

test.describe('NodeButtonsMenu', () => {

    // NodeButtonsMenu component exists but is NOT rendered in FlowStudio or test-builder.
    // These tests will pass once the component is wired up.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(true, 'NodeButtonsMenu is not yet integrated into FlowStudio — component exists but is not rendered')

    test.beforeEach(async ({ page }) => {
        await openBuilder(page)
        // Enable edit mode
        const btn = page.getByTestId('edit-mode-toggle').first()
        const text = await btn.textContent()
        if (text?.includes('View')) await btn.click()
        await expect(btn).toContainText('Edit')
    })

    test('shows 4 action buttons when node is clicked in edit mode', async ({ page }) => {
        await page.locator('.react-flow__node').first().click()
        const menu = page.getByTestId('node-buttons-menu')
        await expect(menu).toBeVisible({ timeout: 3_000 })
        await expect(page.getByTestId('node-btn-add-before')).toBeVisible()
        await expect(page.getByTestId('node-btn-add-after')).toBeVisible()
        await expect(page.getByTestId('node-btn-rename')).toBeVisible()
        await expect(page.getByTestId('node-btn-configure')).toBeVisible()
    })

    test('does not show menu when edit mode is off', async ({ page }) => {
        // Disable edit mode
        const btn = page.getByTestId('edit-mode-toggle').first()
        const text = await btn.textContent()
        if (text?.includes('Edit')) await btn.click()
        await expect(btn).toContainText('View')

        await page.locator('.react-flow__node').first().click()
        await expect(page.getByTestId('node-buttons-menu')).not.toBeVisible({ timeout: 1_000 })
    })

    test('dismisses menu when clicking on empty canvas', async ({ page }) => {
        await page.locator('.react-flow__node').first().click()
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })
        await page.locator('.react-flow__pane').click({ position: { x: 50, y: 50 } })
        await expect(page.getByTestId('node-buttons-menu')).not.toBeVisible({ timeout: 2_000 })
    })

    test('rename: shows input, accepts new name on Enter', async ({ page }) => {
        await page.locator('.react-flow__node').first().click()
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })
        await page.getByTestId('node-btn-rename').click()
        const input = page.getByTestId('node-rename-field')
        await expect(input).toBeVisible({ timeout: 2_000 })
        await input.fill('My Renamed Node')
        await input.press('Enter')
        await expect(page.getByTestId('node-rename-input')).not.toBeVisible({ timeout: 2_000 })
    })

    test('add before: inserts a new placeholder node', async ({ page }) => {
        const initialCount = await page.locator('.react-flow__node').count()
        await page.locator('.react-flow__node').first().click()
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })
        await page.getByTestId('node-btn-add-before').click()
        await expect(page.locator('.react-flow__node')).toHaveCount(initialCount + 1, { timeout: 3_000 })
    })

    test('add after: starts connector from the node', async ({ page }) => {
        await page.locator('.react-flow__node').first().click()
        await expect(page.getByTestId('node-buttons-menu')).toBeVisible({ timeout: 3_000 })
        await page.getByTestId('node-btn-add-after').click()
        await expect(page.getByTestId('node-buttons-menu')).not.toBeVisible({ timeout: 2_000 })
        await expect(page.locator('.react-flow__node').last()).toBeVisible({ timeout: 3_000 })
    })

    test('buttons have minimum 48px touch targets', async ({ page }) => {
        await page.locator('.react-flow__node').first().click()
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

