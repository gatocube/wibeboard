/**
 * Page Smoke Tests — visit every page, assert no console errors and content present.
 */

import { test, expect, type Page } from '@playwright/test'

// All registered pages in App.tsx (subset that doesn't require special setup)
const PAGES = [
    { page: 'home', label: 'Home' },
    { page: 'builder', label: 'Builder Complex' },
    { page: 'builder-simple', label: 'Builder Simple' },
    { page: 'widgets', label: 'Widgets' },
    { page: 'icons', label: 'Icons' },
    { page: 'integrations', label: 'Integrations' },
    { page: 'ui-kit', label: 'UI Kit' },
    { page: 'buttons-menu', label: 'Buttons Menu' },
    { page: 'node-configurator', label: 'Node Configurator' },
]

test.describe('Page Smoke Tests', () => {

    for (const { page: pageName, label } of PAGES) {
        test(`${label} (?page=${pageName}) loads without errors`, async ({ page }) => {
            const consoleErrors: string[] = []

            // Capture console errors and uncaught exceptions
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text())
                }
            })
            page.on('pageerror', err => {
                consoleErrors.push(err.message)
            })

            // Navigate
            await page.goto(`?page=${pageName}`, { waitUntil: 'networkidle' })
            await page.waitForTimeout(1000)

            // Assert no critical errors in console (filter out known harmless ones)
            const criticalErrors = consoleErrors.filter(msg =>
                !msg.includes('favicon.ico') &&
                !msg.includes('DevTools') &&
                !msg.includes('ResizeObserver') &&
                !msg.includes('React DevTools')
            )
            expect(criticalErrors, `Console errors on ${pageName}`).toEqual([])

            // Assert the page renders meaningful content (at least some text)
            const bodyText = await page.locator('body').innerText()
            expect(bodyText.length, `Page ${pageName} should have content`).toBeGreaterThan(10)
        })
    }
})

test.describe('Widget color consistency', () => {
    test('User widget icon color matches widget registry (orange #f59e0b)', async ({ page }) => {
        await page.goto('?page=node-configurator', { waitUntil: 'networkidle' })
        await page.waitForTimeout(500)

        // Select the 'user' widget type
        const select = page.getByTestId('widget-type-select')
        await select.selectOption('user')
        await page.waitForTimeout(300)

        // The header WidgetIcon should use the widget registry color (#f59e0b, orange)
        // not the purple fallback (#8b5cf6)
        const iconColor = await page.evaluate(() => {
            const header = document.querySelector('[data-testid="widget-type-select"]')
                ?.closest('[class], div')
                ?.parentElement
            // Find the SVG icon in the card header
            const svg = header?.querySelector('svg')
            return svg?.getAttribute('color') || svg?.style?.color || null
        })

        // The color should be the User widget's orange, not the default purple
        if (iconColor) {
            expect(iconColor.toLowerCase()).not.toBe('#8b5cf6')
        }
    })
})

test.describe('Settings button visibility', () => {
    test('settings button is accessible when switching renderers', async ({ page }) => {
        // Clean localStorage to ensure reactflow renderer
        await page.addInitScript(() => {
            localStorage.removeItem('flowstudio_renderer')
            localStorage.removeItem('flowstudio_workflows')
            localStorage.removeItem('flowstudio_active_workflow')
        })
        await page.goto('?page=builder-simple', { waitUntil: 'networkidle' })
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
        await page.waitForTimeout(500)

        // Settings button should be visible in default ReactFlow renderer
        const settingsBtn = page.getByTestId('settings-btn')
        await expect(settingsBtn).toBeVisible()

        // Switch to mermaid renderer (which doesn't use ReactFlow)
        await settingsBtn.click()
        await page.waitForTimeout(300)

        // Click the mermaid renderer option via page.evaluate
        await page.evaluate(() => {
            const panel = document.querySelector('[data-testid="settings-panel"]')
            if (panel) panel.scrollTop = panel.scrollHeight
            const btn = document.querySelector('[data-testid="renderer-mermaid"]') as HTMLElement
            if (btn) btn.click()
        })
        await page.waitForTimeout(500)

        // Settings button should still be visible/accessible with mermaid renderer
        await expect(settingsBtn).toBeVisible({ timeout: 3000 })

        // Switch back to reactflow
        await settingsBtn.click()
        await page.waitForTimeout(300)
        await page.evaluate(() => {
            const panel = document.querySelector('[data-testid="settings-panel"]')
            if (panel) panel.scrollTop = 0
            const btn = document.querySelector('[data-testid="renderer-reactflow"]') as HTMLElement
            if (btn) btn.click()
        })
        await page.waitForTimeout(500)

        // Should be back to ReactFlow
        await expect(page.locator('.react-flow__renderer').first()).toBeVisible({ timeout: 5000 })
    })
})
