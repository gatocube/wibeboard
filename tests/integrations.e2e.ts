import { test, expect } from '@playwright/test'

test.describe('Integrations Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wibeboard/?page=integrations')
    })

    test('GitHub token from .env is read-only and tested successfully', async ({ page }) => {
        // Find the GitHub card
        const card = page.getByTestId('integration-card-github')

        // It should indicate it's loaded from .env
        await expect(card).toContainText('.env')

        // The input should be disabled
        const input = card.locator('input[type="password"]')
        await expect(input).toBeDisabled()
        await expect(input).toHaveValue('•••••••••••••••••••••••••')

        // Click Test Connection
        const testBtn = card.locator('button', { hasText: 'Test Connection' })
        await expect(testBtn).toBeEnabled()
        await testBtn.click()

        // Wait for the result message
        // The response should indicate read is OK but write is Forbidden
        await expect(card.locator('text=Read: OK, Write: Forbidden')).toBeVisible({ timeout: 10000 })
    })

    test('Mock integration (Cursor) tests format validation', async ({ page }) => {
        const card = page.getByTestId('integration-card-cursor')

        // Assuming VITE_CURSOR_TOKEN is not in .env, input should be enabled
        const input = card.locator('input[type="password"]')
        await expect(input).toBeEnabled()

        // Button should be disabled initially
        const testBtn = card.locator('button', { hasText: 'Test Connection' })
        await expect(testBtn).toBeDisabled()

        // Type a mock key
        await input.fill('mock-cursor-key-123')
        await expect(testBtn).toBeEnabled()

        // Test connection
        await testBtn.click()

        // Wait for mock success
        await expect(card.locator('text=Success: Key format valid')).toBeVisible()

        // Verify key stays in localStorage (via reloading)
        await page.reload()

        const cardReloaded = page.getByTestId('integration-card-cursor')
        const inputReloaded = cardReloaded.locator('input[type="password"]')
        await expect(inputReloaded).toHaveValue('mock-cursor-key-123')
        await expect(cardReloaded).toContainText('Storage')
    })
})
