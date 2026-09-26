const { test, expect } = require('@playwright/test')

test('loading animation respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.getByRole('textbox', { name: 'Message' }).fill('shipping')
  await page.getByRole('button', { name: 'Send' }).click()
  const loading = page.locator('.message-content.loading span').first()
  await expect(loading).toBeVisible()
  expect(await loading.evaluate(el => getComputedStyle(el).animationName)).toBe('none')
})
