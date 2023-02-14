import { platform } from 'os'
// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { sync } from 'fast-glob'
import { expect, test } from '@playwright/test'
import { ElectronApplication, Page } from 'playwright'
import { join } from 'upath'
import { version } from '../../package.json'
import { MS_IN_SEC } from './../../src/renderer/constants/general'
import {
  startApp,
  openHomePage,
  ipcRendererInvoke,
} from './../helpers/electronHelpers'
import { delay, getDate } from './../helpers/generalHelpers'
import prefs from './../mocks/prefs/prefsOld.json'
import locale from './../../src/renderer/locales/en.json'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  if (platform() === 'win32') {
    return
  }

  electronApp = await startApp()
})

test.afterAll(async () => {
  if (platform() === 'win32') {
    return
  }

  if (page) {
    await page.locator('[aria-label="Go to home"]').click()
  }
  if (electronApp) await electronApp.close()
})

test('render the presentation mode page correctly', async () => {
  test.slow()
  if (platform() === 'win32') {
    test.skip()
  }

  page = await openHomePage(electronApp)

  // Open settings page
  await page.locator('[aria-label="settings"]').click()

  // Check for correct version
  expect((await page.locator('text=M³ v').innerText()).toLowerCase()).toBe(
    `m³ v${version}`
  )

  // Expand media setup
  await page.locator('button', { hasText: locale.optionsMedia }).click()

  // Turn media presentation mode on
  await page.locator(`text=${locale.enableMediaDisplayButton}`).check()

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

  // Open presentation mode
  await page.locator('[aria-label="present"]').click()

  // If one date or todays date, that one gets opened automatically
  const mediaPath = await ipcRendererInvoke(page, 'downloads')
  if (
    existsSync(join(mediaPath, prefs.lang, getDate())) ||
    sync(join(mediaPath, prefs.lang, '*'), {
      onlyDirectories: true,
      ignore: [join(mediaPath, prefs.lang, 'Recurring')],
    }).length === 1
  ) {
    // Check if more actions button is present
    expect(
      await page
        .locator('[aria-label="More actions"]')
        .getAttribute('aria-label')
    ).toBeTruthy()
  } else {
    // Check for correct heading
    expect(await page.locator('h2').innerText()).toBe(locale.meeting)
    await page.getByRole('listitem').nth(0).click()
    expect(
      await page
        .locator('[aria-label="More actions"]')
        .getAttribute('aria-label')
    ).toBeTruthy()
  }
})

test('play a video', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  await page.locator('#play').first().click()
  await delay(2 * MS_IN_SEC)
  expect(await page.locator('#stop').count()).toBe(1)
})

test('scrub a video', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  await page.locator('#pause').first().click()

  expect(await page.locator('#stop').count()).toBe(1)

  await page.locator('.v-slider__track-container').click()

  if (platform() === 'linux') {
    await delay(MS_IN_SEC)
    await page.screenshot({ path: 'img/present/video-scrub.png' })
  }

  await page.locator('#pause').first().click()

  if (platform() === 'linux') {
    await delay(5 * 100)
    await page.screenshot({ path: 'img/present/video-playing.png' })
  }
})

test('stop a video', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  await page.locator('#stop').first().click()
  await page.locator('#stop').first().click()
  expect(await page.locator('#stop').count()).toBe(0)
})
