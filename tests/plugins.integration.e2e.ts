/**
 * AI Chat Plugin — Integration tests (require a running Ollama instance).
 *
 * These tests are EXCLUDED from default `npx playwright test` runs.
 * To run them:
 *   npm run test:integration
 *   TEST_RUNNER_HUMAN=1 npm run test:integration   # human mode
 *
 * Environment variables:
 *   OLLAMA_URL  — Ollama base URL (default: http://localhost:11434)
 *   OLLAMA_MODEL — Ollama model name (default: qwen2.5-coder:7b)
 */

import { test, expect } from '@playwright/test'
import { breath } from '../packages/test-runner/src/human.mjs'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b'

test.describe('AI Chat Plugin — Integration', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/?page=plugins')
        await page.evaluate(
            ({ url, model }) => {
                localStorage.removeItem('plugin_enabled')
                localStorage.setItem('plugin_settings_ai-chat', JSON.stringify({
                    ollamaUrl: url,
                    model: model,
                }))
            },
            { url: OLLAMA_URL, model: OLLAMA_MODEL },
        )
        await page.reload()
        await breath()
    })

    test('send message to Ollama and receive a streamed response', async ({ page }) => {
        test.setTimeout(120_000)

        // Enable the AI Chat plugin
        await page.getByTestId('plugin-toggle-ai-chat').click()
        await expect(page.getByTestId('ai-chat-panel')).toBeVisible()
        await breath()

        // Verify the configured model is shown
        await expect(page.getByTestId('ai-chat-panel')).toContainText(OLLAMA_MODEL)

        // Type a simple message
        const input = page.getByTestId('ai-chat-input')
        await input.fill('Reply with exactly: PONG')
        await breath()

        // Send the message
        await page.getByTestId('ai-chat-send').click()

        // User message should appear
        await expect(page.getByTestId('ai-chat-msg-user').first()).toContainText('Reply with exactly: PONG')
        await breath()

        // Wait for assistant response (streaming from Ollama)
        const assistantMsg = page.getByTestId('ai-chat-msg-assistant').first()
        await expect(assistantMsg).toBeVisible({ timeout: 60_000 })

        // The response should contain some text (Ollama is responding)
        await page.waitForFunction(
            () => {
                const el = document.querySelector('[data-testid="ai-chat-msg-assistant"]')
                return el && el.textContent && el.textContent.length > 2
            },
            { timeout: 60_000 },
        )

        // Verify the response contains PONG (the model should follow the instruction)
        await expect(assistantMsg).toContainText('PONG', { timeout: 60_000 })
        await breath(2000)
    })
})
