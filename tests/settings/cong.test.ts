import { platform } from 'os'
import { expect, test, ElectronApplication, Page } from '@playwright/test'
import { version } from '../../package.json'
import { delay } from '../helpers/generalHelpers'
import locale from '../../src/renderer/locales/en.json'
import { startApp, openHomePage } from '../helpers/electronHelpers'
import { MS_IN_SEC } from './../../src/renderer/constants/general'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  electronApp = await startApp()
  page = await openHomePage(electronApp)

  // Open settings page
  await page.locator('[aria-label="settings"]').click()
  if (platform() === 'darwin') {
    await delay(5 * 100)
  }
})

test.afterAll(async () => {
  await electronApp.close()
})

test('render the settings page correctly', async () => {
  // Check for correct version
  expect((await page.locator('text=M³ v').innerText()).toLowerCase()).toBe(
    `m³ v${version}`
  )

  // Test if title is correct
  const title = await page.title()
  expect(title).toBe('Settings - Meeting Media Manager')
})

test('screenshot settings', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  // Expand cong sync setup
  await page.locator('button', { hasText: locale.optionsCongSync }).click()

  if (platform() === 'linux') {
    await delay(MS_IN_SEC)
    await page.screenshot({ path: 'img/settings/cong.png' })
  }
})
