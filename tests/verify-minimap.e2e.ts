import { test, expect } from '@playwright/test'

test('minimap toggle and controls', async ({ page }) => {
    // Navigate to Simple Builder Demo
    await page.goto('http://localhost:5173/?page=builder-simple')
    await page.waitForLoadState('networkidle')

    // Wait for canvas to be ready
    await expect(page.locator('.react-flow__pane')).toBeVisible()

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

    // Take screenshot of the result
    await page.screenshot({ path: 'test-results/minimap-enabled.png', fullPage: true })
})
