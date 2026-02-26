/**
 * Node Configurator — E2E tests for the 3-column configurator page.
 *
 * Tests:
 *  1. Page loads with 3 columns and default widget selected
 *  2. Switching widget type updates preview and fields
 *  3. Clicking in WidgetPicker auto-populates everything
 *  4. Visual editor fields are editable
 *  5. Mode switching (Visual → Raw → Manifest) works
 *  6. Widget picker tiles follow the expected order
 */

import { test, expect } from '@playwright/test'

const goto = async (page: any) => {
    await page.goto('/?page=node-configurator')
    await page.waitForLoadState('networkidle')
}

test.describe('Node Configurator', () => {
    test('page loads with 3-column layout', async ({ page }) => {
        await goto(page)

        // Widget type selector should be visible
        await expect(page.locator('[data-testid="widget-type-select"]')).toBeVisible({ timeout: 5_000 })

        // Preview card should be visible
        await expect(page.locator('text=Preview').first()).toBeVisible()
        await expect(page.locator('text=Debug Preview')).toBeVisible()

        // WidgetPicker should be visible (embedded)
        await expect(page.locator('text=Pick a widget')).toBeVisible()

        // Configuration panel should be visible
        await expect(page.locator('text=Configuration')).toBeVisible()

        // Mode switcher buttons
        await expect(page.locator('[data-testid="mode-visual"]')).toBeVisible()
        await expect(page.locator('[data-testid="mode-raw"]')).toBeVisible()
        await expect(page.locator('[data-testid="mode-manifest"]')).toBeVisible()
    })

    test('switching widget type via dropdown updates fields', async ({ page }) => {
        await goto(page)

        const select = page.locator('[data-testid="widget-type-select"]')
        await expect(select).toBeVisible({ timeout: 5_000 })

        // Switch to 'informer' widget
        await select.selectOption('informer')
        await page.waitForTimeout(300)

        // Visual editor should now show informer-specific fields (content)
        await expect(page.locator('[data-testid="field-content"]')).toBeVisible({ timeout: 3_000 })
    })

    test('clicking widget in WidgetPicker auto-populates config', async ({ page }) => {
        await goto(page)

        // Click on the Sticker preset tile in the compact picker sidebar
        const stickerTile = page.locator('[data-testid="tile-informer-sticker"]')
        await expect(stickerTile).toBeVisible({ timeout: 5_000 })
        await stickerTile.click()

        await page.waitForTimeout(300)

        // Widget type dropdown should now show 'informer'
        const select = page.locator('[data-testid="widget-type-select"]')
        await expect(select).toHaveValue('informer', { timeout: 3_000 })

        // Note-specific fields should appear
        await expect(page.locator('[data-testid="field-content"]')).toBeVisible({ timeout: 3_000 })
    })

    test('editing a field in visual mode updates live', async ({ page }) => {
        await goto(page)

        const labelField = page.locator('[data-testid="field-label"]')
        await expect(labelField).toBeVisible({ timeout: 5_000 })

        // Clear and type new label
        await labelField.fill('My Custom Node')
        await page.waitForTimeout(200)

        // The label value should reflect in the input
        await expect(labelField).toHaveValue('My Custom Node')
    })

    test('mode switching: Visual → Raw → Manifest', async ({ page }) => {
        await goto(page)

        // Start in Visual mode (default)
        await expect(page.locator('[data-testid="field-label"]')).toBeVisible({ timeout: 5_000 })

        // Switch to Raw mode
        await page.locator('[data-testid="mode-raw"]').click()
        await expect(page.locator('[data-testid="raw-editor"]')).toBeVisible({ timeout: 3_000 })
        await expect(page.locator('[data-testid="raw-apply"]')).toBeVisible()

        // Switch to Manifest mode
        await page.locator('[data-testid="mode-manifest"]').click()
        await expect(page.locator('[data-testid="manifest-editor"]')).toBeVisible({ timeout: 3_000 })

        // Back to Visual
        await page.locator('[data-testid="mode-visual"]').click()
        await expect(page.locator('[data-testid="field-label"]')).toBeVisible({ timeout: 3_000 })
    })

    test('widget picker tiles follow the expected order', async ({ page }) => {
        await goto(page)

        // Wait for tiles to render
        await expect(page.locator('[data-testid^="tile-"]').first()).toBeVisible({ timeout: 5_000 })

        // Collect all tile test IDs in DOM order
        const tileIds = await page.locator('[data-testid^="tile-"]').evaluateAll(
            (els: Element[]) => els.map(el => el.getAttribute('data-testid')!)
        )

        // Expected order:
        // Scripts → AI → User → SubFlow → Informer → Expectation → Group → Starting
        const EXPECTED_ORDER = [
            'tile-job-default', 'tile-job-script', 'tile-job-js',
            'tile-job-ts', 'tile-job-sh', 'tile-job-py',
            'tile-job-ai', 'tile-job-planner', 'tile-job-worker', 'tile-job-reviewer',
            'tile-user-code-reviewer', 'tile-user-approval',
            'tile-subflow-default', 'tile-subflow-ai-pipeline',
            'tile-informer-sticker', 'tile-informer-pink-sticker',
            'tile-informer-section', 'tile-informer-heading',
            'tile-informer-caption', 'tile-informer-web',
            'tile-expectation-artifact', 'tile-expectation-tool-call', 'tile-expectation-pr',
            'tile-group-pipeline', 'tile-group-stage',
            'tile-starting-default',
        ]

        expect(tileIds).toEqual(EXPECTED_ORDER)
    })

    test('page is scrollable when content overflows', async ({ page }) => {
        await goto(page)
        await expect(page.locator('[data-testid="widget-type-select"]')).toBeVisible({ timeout: 5_000 })

        // The page container should allow scrolling (overflow: auto, not hidden)
        const pageOverflow = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="widget-type-select"]')?.closest('div[style]') as HTMLElement | null
            if (!el) return 'no-element'
            // Walk up to find the page container
            let parent = el.parentElement
            while (parent && parent !== document.body) {
                const style = getComputedStyle(parent)
                if (style.overflow === 'auto' || style.overflowY === 'auto' ||
                    style.overflow === 'scroll' || style.overflowY === 'scroll') {
                    return 'scrollable'
                }
                parent = parent.parentElement
            }
            return 'not-scrollable'
        })
        expect(pageOverflow).toBe('scrollable')
    })

    test('changing label in config updates the preview node', async ({ page }) => {
        await goto(page)

        const labelField = page.locator('[data-testid="field-label"]')
        await expect(labelField).toBeVisible({ timeout: 5_000 })

        // Type a unique label
        const testLabel = 'MyUniqueTestNode'
        await labelField.fill(testLabel)
        await page.waitForTimeout(400)

        // The preview card should now contain the new label text
        const previewSection = page.locator('text=Preview').first().locator('..')
        const previewText = await previewSection.locator('..').textContent()
        expect(previewText).toContain(testLabel)
    })
})
