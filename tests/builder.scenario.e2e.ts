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
        await expect(page.locator('text=Planner')).toBeVisible()
        await expect(page.locator('text=Claude 3.5')).toBeVisible()
    })

    test('Script node is visible in configured mode', async ({ page }) => {
        await expect(page.locator('text=process.js')).toBeVisible()
        await expect(page.locator('text=No output yet')).toBeVisible()
        await expect(page.locator('button[title="Run"]')).toBeVisible()
        await expect(page.locator('button[title="Edit"]')).toBeVisible()
    })

    test('Group node is visible with label', async ({ page }) => {
        await expect(page.locator('text=Processing Pipeline')).toBeVisible()
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
        const pane = page.locator('.react-flow__viewport')
        const initialTransform = await pane.getAttribute('style')

        // Use the pane element to drag from an empty area (bottom-right corner is usually empty)
        const canvas = page.locator('.react-flow__pane')
        const box = await canvas.boundingBox()
        if (box) {
            // Start from bottom-right area which is less likely to hit nodes
            const startX = box.x + box.width * 0.9
            const startY = box.y + box.height * 0.9
            await page.mouse.move(startX, startY)
            await page.mouse.down()
            await page.mouse.move(startX - 100, startY - 50, { steps: 5 })
            await page.mouse.up()
        }

        const newTransform = await pane.getAttribute('style')
        expect(newTransform).not.toBe(initialTransform)
    })
})
