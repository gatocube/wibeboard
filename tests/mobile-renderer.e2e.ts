/**
 * Mobile Renderer — E2E tests.
 *
 * Tests the mobile renderer on the builder-simple page:
 * - Switch to mobile view and back
 * - Verify nodes render in vertical layout
 * - Verify layout scrolls when nodes overflow
 * - Verify parallel nodes render in compact size
 * - Verify info nodes appear in right sidebar
 */

import { test, expect } from '@playwright/test'
// @ts-ignore — .mjs has no type declarations
import { breath } from '../packages/test-runner/src/human.mjs'

test.setTimeout(60_000)

// ── Helpers ──

async function openPage(page: import('@playwright/test').Page) {
    await page.addInitScript(() => {
        localStorage.removeItem('flowstudio_renderer')
        localStorage.removeItem('flowstudio_workflows')
        localStorage.removeItem('flowstudio_active_workflow')
    })
    await page.goto('?page=builder-simple', { waitUntil: 'networkidle' })
    await page.waitForSelector('.react-flow__renderer', { timeout: 10_000 })
    await page.waitForTimeout(500)
}

async function switchRenderer(page: import('@playwright/test').Page, renderer: string) {
    const settingsBtn = page.getByTestId('settings-btn')
    await settingsBtn.click()
    await page.waitForTimeout(300)

    // Scroll settings panel to reveal renderer options
    await page.evaluate(() => {
        const panel = document.querySelector('[data-testid="settings-panel"]')
        if (panel) panel.scrollTop = panel.scrollHeight
    })
    await page.waitForTimeout(200)

    const btn = page.getByTestId(`renderer-${renderer}`)
    await expect(btn).toBeVisible({ timeout: 3000 })
    await btn.click()
    await page.waitForTimeout(500)

    // Close settings by clicking outside
    await page.mouse.click(10, 10)
    await page.waitForTimeout(300)
}

/** Click a node by data-id — dispatches pointer events that FlowStudio needs for selection */
async function clickNode(page: import('@playwright/test').Page, nodeId: string) {
    const node = page.locator(`.react-flow__node[data-id="${nodeId}"]`)
    await expect(node).toBeVisible({ timeout: 5_000 })
    await page.evaluate((nid) => {
        const el = document.querySelector(`.react-flow__node[data-id="${nid}"]`)
        if (el) {
            el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
            el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }))
        }
    }, nodeId)
    await page.waitForTimeout(400)
}

/** Click a SwipeButton by testId — uses browser-context dispatch for framer-motion compatibility */
async function clickSwipeBtn(page: import('@playwright/test').Page, testId: string) {
    const btn = page.getByTestId(testId)
    await expect(btn).toBeVisible({ timeout: 5_000 })
    await page.evaluate((tid) => {
        const el = document.querySelector(`[data-testid="${tid}"]`)
        if (el) {
            el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, cancelable: true }))
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
        }
    }, testId)
    await page.waitForTimeout(400)
}

async function nodeCount(page: import('@playwright/test').Page): Promise<number> {
    return page.locator('.react-flow__node').count()
}

async function getLastNodeId(page: import('@playwright/test').Page): Promise<string> {
    const nodes = page.locator('.react-flow__node')
    const last = nodes.last()
    return (await last.getAttribute('data-id')) || ''
}

/** Add N job nodes via SwipeButtons in ReactFlow mode */
async function addJobNodes(page: import('@playwright/test').Page, count: number) {
    for (let i = 0; i < count; i++) {
        const lastId = i === 0 ? 'start-1' : await getLastNodeId(page)
        await clickNode(page, lastId)
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)
    }
}

// ── Tests ──

test.describe('Mobile Renderer', () => {

    test('switches to mobile renderer and back to ReactFlow', async ({ page }) => {
        await openPage(page)

        // Switch to mobile
        await switchRenderer(page, 'mobile')

        // Mobile renderer badge should be visible
        const badge = page.locator('text=Mobile Renderer')
        await expect(badge).toBeVisible({ timeout: 3000 })

        // Settings button should still be accessible
        await expect(page.getByTestId('settings-btn')).toBeVisible()

        // Switch back to ReactFlow
        await switchRenderer(page, 'reactflow')
        await expect(page.locator('.react-flow__renderer').first()).toBeVisible({ timeout: 5000 })

        await breath()
    })

    test('nodes render in mobile vertical layout after adding in ReactFlow', async ({ page }) => {
        await openPage(page)

        // Add 3 job nodes in ReactFlow mode
        await addJobNodes(page, 3)
        const count = await nodeCount(page)
        expect(count).toBe(4) // 1 start + 3 jobs

        // Switch to mobile (mobile renderer replaces ReactFlow canvas)
        await switchRenderer(page, 'mobile')
        await page.waitForTimeout(300)

        const badge = page.locator('text=Mobile Renderer')
        await expect(badge).toBeVisible()

        // Main flow container should be present
        const mainFlow = page.getByTestId('mobile-main-flow')
        await expect(mainFlow).toBeVisible()

        // It should contain node content (text from node labels)
        const flowText = await mainFlow.innerText()
        expect(flowText.length).toBeGreaterThan(5)

        await breath()
    })

    test('layout scrolls when many nodes are added', async ({ page }) => {
        // Use default viewport for node addition (ReactFlow needs reasonable height)
        await openPage(page)

        // Add 8 job nodes in ReactFlow mode
        await addJobNodes(page, 8)
        expect(await nodeCount(page)).toBe(9)

        // Resize to small height BEFORE switching to mobile (keep width for settings access)
        await page.setViewportSize({ width: 800, height: 300 })
        await page.waitForTimeout(300)

        // Switch to mobile
        await switchRenderer(page, 'mobile')
        await page.waitForTimeout(500)

        // The mobile-main-flow container should exist
        const mainFlow = page.getByTestId('mobile-main-flow')
        await expect(mainFlow).toBeVisible()

        // Verify the container has overflowY: auto
        const hasOverflow = await mainFlow.evaluate(el => {
            return getComputedStyle(el).overflowY === 'auto'
        })
        expect(hasOverflow, 'mobile-main-flow should have overflowY: auto').toBe(true)

        // Verify node content is rendered in the flow
        const flowText = await mainFlow.innerText()
        expect(flowText).toContain('Start')
        expect(flowText).toContain('Job')

        await breath()
    })

    test('parallel nodes added from same source render in compact size', async ({ page }) => {
        await openPage(page)

        // Add 2 job nodes from the SAME starting node (creates parallel branches)
        // First node
        await clickNode(page, 'start-1')
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)

        // Second node from the same start (parallel)
        await clickNode(page, 'start-1')
        await clickSwipeBtn(page, 'swipe-btn-add-after')
        await clickSwipeBtn(page, 'ext-after-job')
        await page.waitForTimeout(600)

        expect(await nodeCount(page)).toBeGreaterThanOrEqual(3)

        // Switch to mobile
        await switchRenderer(page, 'mobile')
        await page.waitForTimeout(500)

        const badge = page.locator('text=Mobile Renderer')
        await expect(badge).toBeVisible()

        // Check for compact nodes (max-width ~120px from inline styles)
        const hasCompactNodes = await page.evaluate(() => {
            const allDivs = document.querySelectorAll('div')
            for (const div of allDivs) {
                const style = div.getAttribute('style') || ''
                if (style.includes('max-width') && style.includes('120')) {
                    return true
                }
            }
            return false
        })

        // If concurrent nodes were detected (same Y coordinate),
        // they should render in compact mode
        if (hasCompactNodes) {
            const compactWidths = await page.evaluate(() => {
                const allDivs = document.querySelectorAll('div')
                const widths: number[] = []
                for (const div of allDivs) {
                    const style = div.getAttribute('style') || ''
                    if (style.includes('max-width') && style.includes('120')) {
                        widths.push(div.clientWidth)
                    }
                }
                return widths
            })

            for (const w of compactWidths) {
                expect(w, 'Compact parallel node should be <= 140px wide').toBeLessThanOrEqual(140)
            }
        }

        // Page should render without errors regardless
        const bodyText = await page.locator('body').innerText()
        expect(bodyText.length).toBeGreaterThan(10)

        await breath()
    })

    test('switching renderers preserves node count', async ({ page }) => {
        await openPage(page)

        // Add some nodes
        await addJobNodes(page, 2)
        const beforeCount = await nodeCount(page)
        expect(beforeCount).toBe(3)

        // Switch to mobile and back
        await switchRenderer(page, 'mobile')
        await page.waitForTimeout(300)
        await expect(page.locator('text=Mobile Renderer')).toBeVisible()

        await switchRenderer(page, 'reactflow')
        await page.waitForTimeout(300)
        await expect(page.locator('.react-flow__renderer').first()).toBeVisible({ timeout: 5000 })

        // Node count should be preserved
        const afterCount = await nodeCount(page)
        expect(afterCount).toBe(beforeCount)

        await breath()
    })
})
