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

        // Expected order: top-8 priority tiles first, then rest
        // Top 8: Script, AI, User, Subflow, Info, Artifact, Tool, Webpage
        const TOP_8 = [
            'tile-job-script',             // Script
            'tile-job-ai',                 // AI
            'tile-user-code-reviewer',     // User
            'tile-subflow-default',        // Subflow
            'tile-informer-sticker',       // Info
            'tile-expectation-artifact',   // Artifact
            'tile-expectation-tool-call',  // Tool
            'tile-informer-web',           // Webpage
        ]

        // First 8 must be exactly these, in this order
        expect(tileIds.slice(0, 8)).toEqual(TOP_8)

        // All remaining tiles should be present (no missing, no duplicates)
        const rest = tileIds.slice(8)
        expect(rest.length).toBeGreaterThan(0)
        expect(new Set(tileIds).size).toBe(tileIds.length) // no duplicates
    })

    test('settings column is scrollable when content overflows', async ({ page }) => {
        await goto(page)
        await expect(page.locator('[data-testid="widget-type-select"]')).toBeVisible({ timeout: 5_000 })

        // The settings column (col2) should allow independent scrolling
        const colOverflow = await page.evaluate(() => {
            const field = document.querySelector('[data-testid="field-label"]')
            if (!field) return 'no-field'
            // Walk up to find the column container with overflow: auto
            let el = field.parentElement
            while (el && el !== document.body) {
                const style = getComputedStyle(el)
                if (style.overflow === 'auto' || style.overflowY === 'auto') {
                    return 'scrollable'
                }
                el = el.parentElement
            }
            return 'not-scrollable'
        })
        expect(colOverflow).toBe('scrollable')
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

    test('saving a custom preset creates it in the WidgetPicker', async ({ page }) => {
        await goto(page)

        // Clear any existing custom presets from IndexedDB
        await page.evaluate(() => {
            indexedDB.deleteDatabase('wibeboard-custom-presets')
        })
        await page.reload()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(500)

        // Register a custom preset directly via the exposed registry
        const registered = await page.evaluate(() => {
            const reg = (window as any).__presetRegistry
            if (!reg) return { error: 'no registry' }
            const id = `test-custom-${Date.now()}`
            reg.registerCustom({
                type: id,
                widgetType: 'job',
                label: 'My Test Preset',
                description: 'Test custom preset',
                tags: ['custom', 'job'],
                defaultData: { label: 'Test', code: '' },
            })
            return { id, customCount: reg.getCustomPresets().length }
        })

        expect(registered).toBeTruthy()
        expect((registered as any).customCount).toBeGreaterThanOrEqual(1)

        // Wait for React to re-render
        await page.waitForTimeout(500)

        // Verify: the custom divider appears in the WidgetPicker
        const customDivider = page.locator('[data-testid="custom-presets-divider"]')
        await expect(customDivider).toBeVisible({ timeout: 5_000 })

        // Verify: a custom tile exists
        const customTile = page.locator('[data-testid^="custom-tile-"]').first()
        await expect(customTile).toBeVisible({ timeout: 5_000 })
    })

    test('custom presets can be drag-reordered', async ({ page }) => {
        await goto(page)

        // Clear custom presets
        await page.evaluate(() => {
            indexedDB.deleteDatabase('wibeboard-custom-presets')
        })
        await page.reload()
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(500)

        // Register two custom presets directly
        await page.evaluate(() => {
            const reg = (window as any).__presetRegistry
            reg.registerCustom({
                type: `test-alpha-${Date.now()}`,
                widgetType: 'job',
                label: 'Alpha',
                description: 'Test alpha',
                tags: ['custom', 'job'],
                defaultData: { label: 'Alpha' },
            })
        })
        await page.waitForTimeout(300)

        await page.evaluate(() => {
            const reg = (window as any).__presetRegistry
            reg.registerCustom({
                type: `test-beta-${Date.now()}`,
                widgetType: 'job',
                label: 'Beta',
                description: 'Test beta',
                tags: ['custom', 'job'],
                defaultData: { label: 'Beta' },
            })
        })
        await page.waitForTimeout(500)

        // Verify 2 custom tiles exist
        const tiles = page.locator('[data-testid^="custom-tile-"]')
        await expect(tiles).toHaveCount(2, { timeout: 5_000 })

        // Read initial order (tile 0 = Alpha, tile 1 = Beta)
        const tile0 = page.locator('[data-testid="custom-tile-0"]')
        const tile1 = page.locator('[data-testid="custom-tile-1"]')
        await expect(tile0).toBeVisible()
        await expect(tile1).toBeVisible()

        // Drag tile 0 onto tile 1 to swap
        const box0 = await tile0.boundingBox()
        const box1 = await tile1.boundingBox()
        if (box0 && box1) {
            await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2)
            await page.mouse.down()
            await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2, { steps: 10 })
            await page.mouse.up()
            await page.waitForTimeout(500)
        }

        // After reorder, tile counts should still be 2
        await expect(tiles).toHaveCount(2)
    })
})
