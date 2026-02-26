/**
 * Plugins Page — E2E tests for plugin toggle reactivity, permissions badge, and source viewer.
 */

import { test, expect } from '@playwright/test'
import { breath } from '../packages/test-runner/src/human.mjs'

test.describe('Plugins Page', () => {
    test.beforeEach(async ({ page }) => {
        // Clear plugin localStorage state so each test starts clean
        await page.goto('http://localhost:5173/wibeboard/?page=plugins')
        await page.evaluate(() => {
            localStorage.removeItem('plugin_enabled')
            localStorage.removeItem('plugin_settings_hello-world')
        })
        await page.reload()
        await breath()
    })

    test('hello-world plugin card is visible without permission badge', async ({ page }) => {
        const card = page.getByTestId('plugin-card-hello-world')
        await expect(card).toBeVisible()

        // Should show plugin name and version
        await expect(card).toContainText('Hello World')
        await expect(card).toContainText('v1.0.0')
        await breath()

        // Hello-world should NOT have a secrets:read permission badge
        const badge = page.getByTestId('plugin-badge-secrets-read-hello-world')
        await expect(badge).not.toBeVisible()
        await breath()
    })

    test('toggle plugin on/off reactively shows/hides plugin UI', async ({ page }) => {
        // Initially disabled — no side panel or bottom bar
        await expect(page.getByTestId('plugin-side-panel')).not.toBeVisible()
        await expect(page.getByTestId('plugin-bottom-bar')).not.toBeVisible()
        await breath()

        // Enable the plugin
        await page.getByTestId('plugin-toggle-hello-world').click()
        await breath()

        // Side panel and bottom bar should now appear
        await expect(page.getByTestId('plugin-side-panel')).toBeVisible()
        await expect(page.getByTestId('plugin-bottom-bar')).toBeVisible()

        // Bottom bar should show default status phrase
        await expect(page.getByTestId('hello-world-status')).toContainText('Hello, World!')

        // Side panel should show default side phrase
        await expect(page.getByTestId('hello-world-side')).toContainText('Hello from the side panel!')
        await breath(1500)

        // Disable the plugin
        await page.getByTestId('plugin-toggle-hello-world').click()
        await breath()

        // UI should disappear
        await expect(page.getByTestId('plugin-side-panel')).not.toBeVisible()
        await expect(page.getByTestId('plugin-bottom-bar')).not.toBeVisible()
        await breath()
    })

    test('plugin settings page shows View MDX Source', async ({ page }) => {
        // Expand the plugin card
        await page.getByTestId('plugin-card-hello-world').click()
        await breath()

        // "View MDX Source" button should be visible
        const sourceBtn = page.getByTestId('plugin-view-source-hello-world')
        await expect(sourceBtn).toBeVisible()
        await expect(sourceBtn).toContainText('View MDX Source')

        // Click to show source
        await sourceBtn.click()
        await breath()

        // Source code block should appear with MDX frontmatter (inside CodeEditor)
        const sourceBlock = page.getByTestId('plugin-source-hello-world')
        await expect(sourceBlock).toBeVisible()
        await expect(sourceBlock).toContainText('id: hello-world')

        // Button text should change
        await expect(sourceBtn).toContainText('Hide MDX Source')
        await breath(1500)

        // Click again to hide
        await sourceBtn.click()
        await expect(sourceBlock).not.toBeVisible()
        await breath()
    })
})

// ── AI Chat Plugin ─────────────────────────────────────────────────────────────

test.describe('AI Chat Plugin', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173/wibeboard/?page=plugins')
        await page.evaluate(() => {
            localStorage.removeItem('plugin_enabled')
            localStorage.removeItem('plugin_settings_ai-chat')
        })
        await page.reload()
        await breath()
    })

    test('ai-chat plugin card is visible with correct metadata', async ({ page }) => {
        const card = page.getByTestId('plugin-card-ai-chat')
        await expect(card).toBeVisible()
        await expect(card).toContainText('AI Chat')
        await expect(card).toContainText('v1.0.0')
        await breath()

        // Should show secrets:read badge
        const badge = page.getByTestId('plugin-badge-secrets-read-ai-chat')
        await expect(badge).toBeVisible()
        await breath()
    })

    test('enabling ai-chat shows side panel with chat UI', async ({ page }) => {
        // Enable the AI Chat plugin
        await page.getByTestId('plugin-toggle-ai-chat').click()
        await breath()

        // Side panel should appear with chat
        await expect(page.getByTestId('plugin-side-panel')).toBeVisible()
        await expect(page.getByTestId('ai-chat-panel')).toBeVisible()

        // Should show model name in header
        await expect(page.getByTestId('ai-chat-panel')).toContainText('qwen2.5-coder:7b')
        await breath()

        // Bottom bar should show AI status
        await expect(page.getByTestId('ai-chat-status')).toContainText('AI: qwen2.5-coder:7b')
        await breath()
    })

    test('ai-chat settings are configurable', async ({ page }) => {
        // Expand the AI Chat card
        await page.getByTestId('plugin-card-ai-chat').click()
        await breath()

        // Settings should show URL and model inputs
        const urlInput = page.getByTestId('ai-chat-url-input')
        const modelInput = page.getByTestId('ai-chat-model-input')
        await expect(urlInput).toBeVisible()
        await expect(modelInput).toBeVisible()

        // Default values
        await expect(urlInput).toHaveValue('http://localhost:11434')
        await expect(modelInput).toHaveValue('qwen2.5-coder:7b')
        await breath(1500)
    })
})

