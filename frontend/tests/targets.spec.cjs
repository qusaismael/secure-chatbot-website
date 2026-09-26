const { test, expect } = require('@playwright/test')

for (const width of [320, 390]) {
  test(`interactive hit targets are at least 44px at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 })
    await page.goto('/')
    for (const selector of ['.header-actions a', '.header-actions button', '.simulation-note a', '.test-btn', '.input-area button', '.architecture-header button']) {
      const boxes = await page.locator(selector).evaluateAll(elements => elements.map(el => {
        const { width, height } = el.getBoundingClientRect()
        return { width, height, text: el.textContent.trim() }
      }))
      expect(boxes.length, selector).toBeGreaterThan(0)
      for (const box of boxes) {
        expect(box.width, `${selector} ${box.text} width`).toBeGreaterThanOrEqual(44)
        expect(box.height, `${selector} ${box.text} height`).toBeGreaterThanOrEqual(44)
      }
    }
  })
}
