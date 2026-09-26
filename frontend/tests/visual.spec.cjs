const { test, expect } = require('@playwright/test')
const fs = require('node:fs')
const path = require('node:path')

for (const [width, height] of [[1440, 900], [390, 844], [320, 568]]) {
  test(`visual review at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    for (const state of ['flow', 'chat']) {
      if (state === 'chat') await page.getByRole('button', { name: 'Hide Flow' }).click()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      const name = `securebot-after-${width}-${state}.png`
      const screenshot = await page.screenshot({ fullPage: true })
      await testInfo.attach(name, { body: screenshot, contentType: 'image/png' })
      if (process.env.CAPTURE_DIR) {
        fs.mkdirSync(process.env.CAPTURE_DIR, { recursive: true })
        fs.writeFileSync(path.join(process.env.CAPTURE_DIR, name), screenshot)
      }
    }
  })
}
