// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { sync } from 'fast-glob'
import { expect, test } from '@playwright/test'
import { ElectronApplication, Page } from 'playwright'
import { ipcRendererInvoke } from 'electron-playwright-helpers'
import { join } from 'upath'
import { getDate } from './../helpers/generalHelpers'
import { startApp, openHomePage } from './../helpers/electronHelpers'
import prefs from './../mocks/prefs/prefsOld.json'
import locale from './../../src/renderer/locales/en.json'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  electronApp = await startApp()
})

test.afterAll(async () => {
  await electronApp.close()
})

let page: Page

test('render the home page correctly', async () => {
  page = await openHomePage(electronApp)

  // Check that the correct congregation is loaded
  expect(page.locator(`text=${prefs.congregationName}`).innerText).toBeTruthy()

  // Test if title is correct
  const title = await page.title()
  expect(title).toBe('Home - Meeting Media Manager')
})

test('fetch is successfull', async () => {
  // Click on fetch button
  await page.locator('button', { hasText: locale.fetchMedia }).click()

  // Wait for jw sync to complete successfully
  await page.waitForSelector('div.success:has-text("JW.org (English)")')

  // Check if recurring media has a success state
  expect(
    await page
      .locator('.v-card', { hasText: locale.recurring })
      .getAttribute('class')
  ).toContain('success')

  // Test if the media folder has a E folder for English media
  const mediaPath = await ipcRendererInvoke(page, 'downloads')
  expect(existsSync(join(mediaPath, prefs.lang))).toBe(true)

  // Test if the weekend media folder has media files
  expect(
    sync(join(mediaPath, prefs.lang, getDate('we'), '*')).length
  ).toBeGreaterThan(0)
})
