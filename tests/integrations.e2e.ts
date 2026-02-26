import { test, expect } from '@playwright/test'

test.describe('Integrations Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?page=integrations')
    })

    test('GitHub card shows enabled input and disabled test button when no token set', async ({ page }) => {
        const card = page.getByTestId('integration-card-github')
        await expect(card).toBeVisible()

        // Input should be enabled (editable) when no .env token
        const input = card.locator('input[type="password"]')
        await expect(input).toBeVisible()

        // Test Connection button should be disabled until a key is entered
        const testBtn = card.locator('button', { hasText: 'Test Connection' })
        await expect(testBtn).toBeDisabled()

        // Type a mock token
        await input.fill('ghp_mock_token_12345')
        await expect(testBtn).toBeEnabled()
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

    // ── Custom integrations (merged from verify-integrations.e2e.ts) ────

    test('custom integrations JSON editor saves and shows Ollama card', async ({ page }) => {
        // Navigate to integrations page via nav
        await page.goto('/?page=integrations')

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
    })
})
