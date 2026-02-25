import { test, expect } from '@playwright/test'

test('custom integrations', async ({ page }) => {
    await page.goto('http://localhost:5173/')
    await page.waitForLoadState('networkidle')

    // Navigate to integrations page
    await page.getByTestId('nav-integrations').click()
    await expect(page.getByText('Integrations & API Keys')).toBeVisible()

    // Find the custom integrations JSON editor
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()

    // Apply the default JSON
    await page.getByText('Apply Changes').click()
    await expect(page.getByText('Saved')).toBeVisible()

    // Wait for the custom integration card to appear
    const ollamaCard = page.getByTestId('integration-card-ollama')
    await expect(ollamaCard).toBeVisible()

    // Fill the URL
    await ollamaCard.locator('input[type="text"]').fill('http://localhost:11434')

    // Test connection
    await ollamaCard.locator('button:has-text("Test Connection")').click()

    // Wait for success message
    await expect(ollamaCard.getByText(/Success: Host is reachable|Failed:/)).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'test-results/integrations.png', fullPage: true })
})
