/**
 * Builder Scenario E2E Test — Full workflow
 *
 * Plays through the builder: run script → edit code → save → re-run.
 * Verifies no console errors throughout.
 */

import { test, expect } from '@playwright/test'

test.describe.configure({ mode: 'serial' })
test.setTimeout(60_000)

test.describe('Builder full scenario', () => {
    test('complete workflow: run → edit → save → re-run, no errors', async ({ page }) => {
        const consoleErrors: string[] = []

        page.on('pageerror', (err) =>
            consoleErrors.push(`[pageerror] ${err.message}`),
        )
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text()
                if (text.includes('shorthand and non-shorthand properties')) return
                consoleErrors.push(`[console.error] ${text}`)
            }
        })

        // Step 1: Load builder
        await page.goto('/')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
        await expect(page.locator('text=3 nodes')).toBeVisible()
        await expect(page.locator('text=Planner')).toBeVisible()
        await expect(page.locator('text=process.js')).toBeVisible()
        await expect(page.locator('text=Processing Pipeline')).toBeVisible()

        // Step 2: Run script
        await page.locator('button[title="Run"]').click()
        await expect(page.locator('text=Processing')).toBeVisible({ timeout: 5_000 })
        await expect(page.locator('text=validate input')).toBeVisible()
        await expect(page.locator('text=6 lines')).toBeVisible({ timeout: 2_000 })
        await page.waitForTimeout(500)

        // Step 3: Edit script
        await page.locator('button[title="Edit"]').click()
        await expect(page.locator('text=Configuring')).toBeVisible({ timeout: 3_000 })

        const saveButton = page.locator('button:has-text("Save")')
        await expect(saveButton).toBeVisible({ timeout: 3_000 })

        const textarea = page.locator('textarea')
        await expect(textarea).toBeVisible()
        const code = await textarea.inputValue()
        expect(code).toContain('activate')

        // Step 4: Save
        await page.waitForTimeout(300)
        await page.locator('button:has-text("Save")').click()
        await expect(page.locator('button[title="Run"]')).toBeVisible({ timeout: 5_000 })

        // Step 5: Re-run
        await page.locator('button[title="Run"]').click()
        await expect(page.locator('text=Processing')).toBeVisible({ timeout: 5_000 })

        // No errors
        if (consoleErrors.length > 0) {
            console.log('Console errors found:', consoleErrors)
        }
        expect(consoleErrors).toEqual([])
    })
})
