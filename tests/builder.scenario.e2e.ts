import { test, expect } from '@playwright/test'

/**
 * Builder scenario E2E test — verifies the builder page renders correctly,
 * nodes are visible, and script execution works.
 */

test.describe('Builder Demo', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
    })

    test('renders the canvas with 3 nodes', async ({ page }) => {
        await expect(page.locator('text=3 nodes')).toBeVisible()
    })

    test('Agent node is visible with correct label', async ({ page }) => {
        const nodes = page.locator('.react-flow__node')
        await expect(nodes.locator('text=Planner')).toBeVisible()
        await expect(nodes.locator('text=Claude 3.5')).toBeVisible()
    })

    test('Script node is visible in configured mode', async ({ page }) => {
        await expect(page.locator('text=process.js')).toBeVisible()
        // Script at its default size (280×200) shows line count when idle
        await expect(page.locator('text=lines').first()).toBeVisible()
        await expect(page.locator('button[title="Run"]')).toBeVisible()
        await expect(page.locator('button[title="Edit"]')).toBeVisible()
    })

    test('Group node is visible with label', async ({ page }) => {
        const nodes = page.locator('.react-flow__node')
        await expect(nodes.locator('text=Processing Pipeline')).toBeVisible()
    })

    test('edge between Agent and Script is rendered', async ({ page }) => {
        await expect(page.locator('.react-flow__edge')).toHaveCount(1)
    })

    test('script Run button executes code and shows logs', async ({ page }) => {
        await page.locator('button[title="Run"]').click()
        await expect(page.locator('text=Processing')).toBeVisible({ timeout: 5_000 })
        await expect(page.locator('text=validate input')).toBeVisible()
        await expect(page.locator('text=transform data')).toBeVisible()
        await expect(page.locator('text=6 lines')).toBeVisible({ timeout: 2_000 })
    })

    test('canvas supports pan', async ({ page }) => {
        // Close sidebar to get more canvas space
        await page.locator('[data-testid="sidebar-toggle"]').click()
        await page.waitForTimeout(300)

        const pane = page.locator('.react-flow__viewport')
        const initialTransform = await pane.getAttribute('style')

        // Drag from bottom-right corner area which is below all nodes
        const canvas = page.locator('.react-flow__pane')
        const box = await canvas.boundingBox()
        if (box) {
            const startX = box.x + box.width * 0.85
            const startY = box.y + box.height * 0.85
            await page.mouse.move(startX, startY)
            await page.mouse.down()
            await page.mouse.move(startX - 120, startY - 80, { steps: 5 })
            await page.mouse.up()
        }

        const newTransform = await pane.getAttribute('style')
        expect(newTransform).not.toBe(initialTransform)
    })
})
