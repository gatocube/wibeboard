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
        await expect(page.locator('text=Builder Demo')).toBeVisible()
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

        // Wait for log lines from the activate() function
        await expect(page.locator('text=Processing')).toBeVisible({ timeout: 5_000 })
        await expect(page.locator('text=validate input')).toBeVisible()
        await expect(page.locator('text=transform data')).toBeVisible()

        // Status bar: "✓ done · 6 lines"
        await expect(page.locator('text=6 lines')).toBeVisible({ timeout: 2_000 })
    })

    test('canvas supports pan', async ({ page }) => {
        const pane = page.locator('.react-flow__viewport')
        const initialTransform = await pane.getAttribute('style')

        const canvas = page.locator('.react-flow__renderer')
        const box = await canvas.boundingBox()
        if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
            await page.mouse.down()
            await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 50, { steps: 5 })
            await page.mouse.up()
        }

        const newTransform = await pane.getAttribute('style')
        expect(newTransform).not.toBe(initialTransform)
    })
})
