const { test, expect } = require('@playwright/test')

for (const width of [320, 390]) {
  test(`composer remains inside chat panel at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 })
    await page.goto('/')
    for (const hideFlow of [false, true]) {
      if (hideFlow) await page.getByRole('button', { name: 'Hide Flow' }).click()
      const layout = await page.evaluate(() => {
        const chat = document.querySelector('.chat').getBoundingClientRect()
        const input = document.querySelector('.input-area input').getBoundingClientRect()
        const send = document.querySelector('.input-area button').getBoundingClientRect()
        return { chat: { top: chat.top, bottom: chat.bottom }, input: { top: input.top, bottom: input.bottom }, send: { top: send.top, bottom: send.bottom } }
      })
      for (const key of ['input', 'send']) {
        expect(layout[key].top, `${key} top`).toBeGreaterThanOrEqual(layout.chat.top)
        expect(layout[key].bottom, `${key} bottom`).toBeLessThanOrEqual(layout.chat.bottom)
      }
    }
  })

  test(`phone layout at ${width}px with both flow states`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 })
    await page.goto('/')
    for (const hideFlow of [false, true]) {
      if (hideFlow) await page.getByRole('button', { name: 'Hide Flow' }).click()
      const metrics = await page.evaluate(() => {
        const box = selector => {
          const { left, right, width } = document.querySelector(selector).getBoundingClientRect()
          return { left, right, width }
        }
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          input: box('.input-area input'), send: box('.input-area button'),
          toggle: box('.toggle-btn'), width: document.documentElement.clientWidth
        }
      })
      expect(metrics.overflow).toBeLessThanOrEqual(0)
      for (const key of ['input', 'send', 'toggle']) {
        expect(metrics[key].left).toBeGreaterThanOrEqual(0)
        expect(metrics[key].right).toBeLessThanOrEqual(metrics.width)
        expect(metrics[key].width).toBeGreaterThan(0)
      }
    }
  })
}
