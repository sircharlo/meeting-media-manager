import { platform } from 'os'
import { expect, test } from '@playwright/test'
import { ElectronApplication, Page } from 'playwright'
import { version } from '../../package.json'
import { MS_IN_SEC } from './../../src/renderer/constants/general'
import { startApp, openHomePage } from './../helpers/electronHelpers'
import { delay } from './../helpers/generalHelpers'
import prefs from './../mocks/prefs/prefsOld.json'
import locale from './../../src/renderer/locales/en.json'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  electronApp = await startApp()
  page = await openHomePage(electronApp)
})

test.afterAll(async () => {
  await electronApp.close()
})

test('shuffle button works correctly', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  // Open settings page
  await page.locator('[aria-label="settings"]').click()

  // Check for correct version
  expect((await page.locator('text=M³ v').innerText()).toLowerCase()).toBe(
    `m³ v${version}`
  )

  // Expand meeting setup
  await page.locator('button', { hasText: locale.optionsMeetings }).click()

  // Turn shuffle music on
  await page.locator(`text=${locale.enableMusicButton}`).check({ force: true })

  // Go back to home page
  await page.locator('[aria-label="home"]').click()

  // Verify home page
  expect(page.locator(`text=${prefs.congregationName}`).innerText).toBeTruthy()

  // Click shuffle button
  const shuffleBtn = page.locator('[aria-label="shuffle"]')
  await shuffleBtn.click()

  // Verify orange color
  expect((await shuffleBtn.getAttribute('class'))?.includes('warning')).toBe(
    true
  )

  // Click shuffle button again
  await shuffleBtn.click()

  // Wait for stop icon to appear
  await page.waitForSelector('.fa-stop')
  await delay(4 * MS_IN_SEC)

  // Expect time remaining to appear
  expect(await shuffleBtn.innerText()).toMatch(/\d+:\d{2}/g)
  await shuffleBtn.highlight();

  await page.screenshot({ path: 'img/main/music-playing.png' })

  // Click shuffle button to stop
  await shuffleBtn.click()

  // Verify red color
  expect((await shuffleBtn.getAttribute('class'))?.includes('error')).toBe(true)

  // Click button again
  await shuffleBtn.click()

  // Wait 4 seconds for music fade out
  await delay(4 * MS_IN_SEC)

  if (platform() === 'darwin') await delay(8 * MS_IN_SEC)

  // Verify blue color
  expect((await shuffleBtn.getAttribute('class'))?.includes('info')).toBe(true)
})
