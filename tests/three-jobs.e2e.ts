/**
 * Three Jobs Page — E2E tests.
 *
 * Verifies the pipeline execution: Starting(10) → +1 → ×3 → +1 = 34
 */

import { test, expect } from '@playwright/test'
// @ts-ignore — .mjs has no type declarations
import { breath } from '../packages/test-runner/src/human.mjs'

test.setTimeout(30_000)

test.describe('Three Jobs Pipeline', () => {

    test('page renders with 4 nodes and 3 edges', async ({ page }) => {
        await page.goto('?page=three-jobs')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })

        const nodes = page.locator('.react-flow__node')
        const edges = page.locator('.react-flow__edge')

        await expect(nodes).toHaveCount(4) // 1 starting + 3 jobs
        await expect(edges).toHaveCount(3)

        // Run button should be present and not disabled
        const runBtn = page.getByTestId('run-pipeline')
        await expect(runBtn).toBeVisible()
        await expect(runBtn).toBeEnabled()

        await breath()
    })

    test('pipeline produces correct output: (10 + 1) × 3 + 1 = 34', async ({ page }) => {
        await page.goto('?page=three-jobs')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })

        // Run the pipeline
        await page.getByTestId('run-pipeline').click()
        await page.waitForTimeout(500)

        // Final output should be visible
        const finalOutput = page.getByTestId('final-output')
        await expect(finalOutput).toBeVisible()
        await expect(finalOutput).toContainText('"counter":34')

        // Verify each node's state
        const stateStart = page.getByTestId('state-start')
        await expect(stateStart).toContainText('"counter":10')

        const stateAdd1 = page.getByTestId('state-add1-first')
        await expect(stateAdd1).toContainText('in: {"counter":10}')
        await expect(stateAdd1).toContainText('out: {"counter":11}')

        const stateMul3 = page.getByTestId('state-multiply3')
        await expect(stateMul3).toContainText('in: {"counter":11}')
        await expect(stateMul3).toContainText('out: {"counter":33}')

        const stateAdd1Last = page.getByTestId('state-add1-last')
        await expect(stateAdd1Last).toContainText('in: {"counter":33}')
        await expect(stateAdd1Last).toContainText('out: {"counter":34}')

        await breath()
    })

    test('reset clears pipeline state', async ({ page }) => {
        await page.goto('?page=three-jobs')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })

        // Run then reset
        await page.getByTestId('run-pipeline').click()
        await page.waitForTimeout(300)
        await expect(page.getByTestId('final-output')).toBeVisible()

        await page.getByTestId('reset-pipeline').click()
        await page.waitForTimeout(300)

        // Final output and node states should be gone
        await expect(page.getByTestId('final-output')).not.toBeVisible()
        await expect(page.getByTestId('node-states')).not.toBeVisible()

        // Run button should be re-enabled
        await expect(page.getByTestId('run-pipeline')).toBeEnabled()

        await breath()
    })
})
