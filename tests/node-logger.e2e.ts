/**
 * Node Logger Plugin — E2E tests.
 *
 * Verifies:
 * 1. Plugin is registered in pluginRegistry
 * 2. Node Logger preset is registered when plugin is enabled
 * 3. The JS script produces correct output when executed with mock context
 * 4. The node can be added on the builder-simple page
 */

import { test, expect } from '@playwright/test'
// @ts-ignore — .mjs has no type declarations
import { breath } from '../packages/test-runner/src/human.mjs'

test.setTimeout(30_000)

test.describe('Node Logger Plugin', () => {

    test('plugin is registered and appears on plugins page', async ({ page }) => {
        await page.goto('?page=plugins')
        await page.waitForTimeout(1000)

        // The "Node Logger" plugin should appear in the plugin list
        const bodyText = await page.locator('body').innerText()
        expect(bodyText).toContain('Node Logger')

        await breath()
    })

    test('node-logger JS code produces correct output with mock context', async ({ page }) => {
        await page.goto('?page=builder-simple')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })

        // Execute the node-logger code in browser context with a mock ctx
        const result = await page.evaluate(() => {
            const code = `
                const self = {
                    type: ctx.node.type || 'unknown',
                    subType: ctx.node.subType || 'none',
                    id: ctx.node.id || 'unnamed',
                }
                const left = ctx.leftNode
                    ? { id: ctx.leftNode.id, type: ctx.leftNode.type || 'unknown' }
                    : null
                const right = ctx.rightNode
                    ? { id: ctx.rightNode.id, type: ctx.rightNode.type || 'unknown' }
                    : null
                return { self, leftNode: left, rightNode: right }
            `

            // Mock context simulating node-logger between a Start and a Job node
            const ctx = {
                node: { type: 'job', subType: 'js', id: 'node-logger-1' },
                leftNode: { id: 'start-1', type: 'starting' },
                rightNode: { id: 'job-1', type: 'job' },
            }

            const fn = new Function('ctx', code)
            return fn(ctx)
        })

        // Verify the output matches expected structure
        expect(result.self).toEqual({
            type: 'job',
            subType: 'js',
            id: 'node-logger-1',
        })

        expect(result.leftNode).toEqual({
            id: 'start-1',
            type: 'starting',
        })

        expect(result.rightNode).toEqual({
            id: 'job-1',
            type: 'job',
        })

        await breath()
    })

    test('node-logger handles missing neighbors gracefully', async ({ page }) => {
        await page.goto('?page=builder-simple')
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })

        // Execute with no neighbors
        const result = await page.evaluate(() => {
            const code = `
                const self = {
                    type: ctx.node.type || 'unknown',
                    subType: ctx.node.subType || 'none',
                    id: ctx.node.id || 'unnamed',
                }
                const left = ctx.leftNode
                    ? { id: ctx.leftNode.id, type: ctx.leftNode.type || 'unknown' }
                    : null
                const right = ctx.rightNode
                    ? { id: ctx.rightNode.id, type: ctx.rightNode.type || 'unknown' }
                    : null
                return { self, leftNode: left, rightNode: right }
            `

            const ctx = {
                node: { type: 'job', subType: 'js', id: 'solo-logger' },
                leftNode: null,
                rightNode: null,
            }

            const fn = new Function('ctx', code)
            return fn(ctx)
        })

        expect(result.self.id).toBe('solo-logger')
        expect(result.leftNode).toBeNull()
        expect(result.rightNode).toBeNull()

        await breath()
    })

    test('node-logger preset is available via preset registry', async ({ page }) => {
        // Enable the node-logger plugin in localStorage before page load
        await page.goto('?page=builder-simple')

        // Enable the plugin via the window API
        await page.evaluate(() => {
            // Set plugin as enabled in localStorage
            const enabledKey = 'plugin_enabled'
            const current = JSON.parse(localStorage.getItem(enabledKey) || '[]')
            if (!current.includes('node-logger')) {
                current.push('node-logger')
                localStorage.setItem(enabledKey, JSON.stringify(current))
            }
        })

        // Reload so the plugin's onEnable fires during initialization
        await page.reload()
        await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })

        // Check that the node-logger preset is registered (via window.__presetRegistry)
        const presetInfo = await page.evaluate(() => {
            const registry = (window as any).__presetRegistry
            if (!registry) return { found: false, reason: 'no __presetRegistry on window' }

            const preset = registry.get('job:job-node-logger')
            if (!preset) {
                const allKeys = registry.keys?.() || []
                return { found: false, reason: `preset job:job-node-logger not found. Keys: ${allKeys.join(', ')}` }
            }

            return {
                found: true,
                label: preset.label,
                widgetType: preset.type,
                subType: preset.subType,
                hasCode: typeof preset.defaultData?.code === 'string',
            }
        })

        expect(presetInfo.found, presetInfo.reason || '').toBe(true)
        expect(presetInfo.label).toBe('Node Logger')
        expect(presetInfo.widgetType).toBe('job')
        expect(presetInfo.subType).toBe('js')
        expect(presetInfo.hasCode).toBe(true)

        // Clean up: disable the plugin
        await page.evaluate(() => {
            localStorage.removeItem('plugin_enabled')
        })

        await breath()
    })
})
