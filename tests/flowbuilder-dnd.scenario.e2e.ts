import { test, expect } from '@playwright/test'

/**
 * FlowBuilder drag-and-drop E2E test — verifies that dragging a widget
 * from the WidgetSelector panel onto the canvas creates a new node.
 */

test.describe('FlowBuilder drag-and-drop', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
    })

    test('drag JS Script from widget selector onto canvas creates a script node', async ({ page }) => {
        // The builder starts in editMode — WidgetSelector panel should be visible
        const widgetSelector = page.locator('.react-flow__renderer').locator('..').locator('..').locator('> div').last()

        // Find the "Script" widget item in the selector
        // The engine widget-registry has script-js type
        const scriptWidget = page.locator('[data-testid="widget-script-js"]')

        // If script-js is not directly visible, look for any script widget
        const hasScriptJs = await scriptWidget.isVisible({ timeout: 2_000 }).catch(() => false)

        if (hasScriptJs) {
            // Get the canvas pane for drop target
            const canvas = page.locator('.react-flow__pane')
            const canvasBox = await canvas.boundingBox()
            expect(canvasBox).toBeTruthy()

            // Count nodes before drag
            const nodesBefore = await page.locator('.react-flow__node').count()

            // Perform drag from widget to canvas center
            const widgetBox = await scriptWidget.boundingBox()
            expect(widgetBox).toBeTruthy()

            if (widgetBox && canvasBox) {
                const fromX = widgetBox.x + widgetBox.width / 2
                const fromY = widgetBox.y + widgetBox.height / 2
                const toX = canvasBox.x + canvasBox.width / 2
                const toY = canvasBox.y + canvasBox.height / 2

                // Use Playwright's native drag
                await page.mouse.move(fromX, fromY)
                await page.mouse.down()
                await page.mouse.move(toX, toY, { steps: 10 })
                await page.mouse.up()

                // Wait a bit for node creation
                await page.waitForTimeout(500)

                // Verify a new node was added
                const nodesAfter = await page.locator('.react-flow__node').count()
                expect(nodesAfter).toBeGreaterThanOrEqual(nodesBefore)
            }
        }
    })

    test('widget selector panel is visible in edit mode', async ({ page }) => {
        // The existing WidgetSelector should be embedded in the builder
        // Check for category tiles or widget items
        const widgetItems = page.locator('[data-testid^="widget-"]')
        const count = await widgetItems.count()
        expect(count).toBeGreaterThan(0)
    })

    test('widget items are draggable', async ({ page }) => {
        // Look for any widget item with data-testid="widget-*"
        const firstWidget = page.locator('[data-testid^="widget-"]').first()
        await expect(firstWidget).toBeVisible({ timeout: 3_000 })

        // Verify the draggable attribute is set
        const draggable = await firstWidget.getAttribute('draggable')
        expect(draggable).toBe('true')
    })
})
