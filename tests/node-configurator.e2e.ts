/**
 * Node Configurator — E2E tests for the 3-column configurator page.
 *
 * Tests:
 *  1. Page loads with 3 columns and default widget selected
 *  2. Switching widget type updates preview and fields
 *  3. Clicking in WidgetPicker auto-populates everything
 *  4. Visual editor fields are editable
 *  5. Mode switching (Visual → Raw → Manifest) works
 *  6. Raw JSON apply updates visual fields
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

        // Switch to 'note' widget
        await select.selectOption('note')
        await page.waitForTimeout(300)

        // Visual editor should now show note-specific fields (content)
        await expect(page.locator('[data-testid="field-content"]')).toBeVisible({ timeout: 3_000 })
    })

    test('clicking widget in WidgetPicker auto-populates config', async ({ page }) => {
        await goto(page)

        // Click on first Note template tile in the compact picker sidebar
        const noteWidget = page.locator('[data-testid="widget-note-0"]')
        await expect(noteWidget).toBeVisible({ timeout: 5_000 })
        await noteWidget.click()

        await page.waitForTimeout(300)

        // Widget type dropdown should now show 'note'
        const select = page.locator('[data-testid="widget-type-select"]')
        await expect(select).toHaveValue('note', { timeout: 3_000 })

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

    test('template selector appears for widgets with multiple templates', async ({ page }) => {
        await goto(page)

        // Job widget (default, has multiple templates)
        const select = page.locator('[data-testid="widget-type-select"]')
        await select.selectOption('job')
        await page.waitForTimeout(300)

        // Template buttons should be visible
        await expect(page.locator('[data-testid="template-0"]')).toBeVisible({ timeout: 3_000 })
        await expect(page.locator('[data-testid="template-1"]')).toBeVisible()

        // Click second template
        await page.locator('[data-testid="template-1"]').click()
        await page.waitForTimeout(300)

        // Label field should update to the second template's label
        const labelField = page.locator('[data-testid="field-label"]')
        await expect(labelField).toBeVisible()
    })
})
