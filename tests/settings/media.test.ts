import { expect, test } from '@playwright/test'
import { ElectronApplication, Page } from 'playwright'
import { ipcRendererInvoke } from 'electron-playwright-helpers'
// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { join } from 'upath'
import { version } from '../../package.json'
import { getDate, strip } from '../helpers/generalHelpers'
import locale from './../../src/renderer/locales/en.json'
import prefs from './../mocks/prefs/prefsOld.json'
import { startApp, openHomePage } from './../helpers/electronHelpers'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  electronApp = await startApp()
})

test.afterAll(async () => {
  await electronApp.close()
})

test.beforeEach(async () => {
  if (!page) {
    page = await openHomePage(electronApp)

    // Open settings page
    await page.locator('[aria-label="settings"]').click()
  }
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

test('vlc playlist', async () => {
  test.slow()

  // Expand application setup
  await page.locator('button', { hasText: locale.optionsMedia }).click()

  // Enable vlc playlist option
  await page
    .locator(`text=${strip(locale.enableVlcPlaylistCreation, 'html')}`)
    .check()

  // Go back to home page
  await page.locator('[aria-label="home"]').click()

  // Verify home page
  expect(page.locator(`text=${prefs.congregationName}`).innerText).toBeTruthy()

  // Click on fetch button
  await page.locator('button', { hasText: locale.fetchMedia }).click()

  // Wait for jw sync to complete successfully
  await page.waitForSelector('div.success:has-text("JW.org (English)")', {
    timeout: 0,
  })

  // Test if the weekend media folder has a .xspf file
  const mediaPath = await ipcRendererInvoke(page, 'downloads')
  expect(
    existsSync(
      join(mediaPath, prefs.lang, getDate('we'), getDate('we') + '.xspf')
    )
  ).toBe(true)
})
