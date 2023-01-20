import { platform } from 'os'
// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { sync } from 'fast-glob'
import { expect, test } from '@playwright/test'
import { ElectronApplication, Page } from 'playwright'
import { join } from 'upath'
import { version } from '../../package.json'
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
    // Check if toggle prefix button is present
    expect(
      await page
        .locator('[aria-label="More actions"]')
        .getAttribute('aria-label')
    ).toBeTruthy()
  } else {
    // Check for correct heading
    expect(await page.locator('h2').innerText()).toBe(locale.meeting)

    await page.screenshot({ path: 'img/present/meeting-picker.png' })
    await page.getByRole('listitem').nth(1).click()
    expect(
      await page
        .locator('[aria-label="More actions"]')
        .getAttribute('aria-label')
    ).toBeTruthy()
    await page.screenshot({ path: 'img/present/media-list.png' })
  }
})

test('play a video', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  await page.locator('#play').first().click()
  // eslint-disable-next-line no-magic-numbers
  await delay(2000)
  expect(await page.locator('#stop').count()).toBe(1)
})

test('scrub a video', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  await page.locator('#pause').first().click()

  expect(await page.locator('#stop').count()).toBe(1)

  await page.locator('.v-slider__track-container').click()
  // eslint-disable-next-line no-magic-numbers
  await delay(1000)
  await page.screenshot({ path: 'img/present/video-scrub.png' })
  await page.locator('#pause').first().click()
  // eslint-disable-next-line no-magic-numbers
  await delay(500)
  await page.screenshot({ path: 'img/present/video-playing.png' })
})

test('stop a video', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  await page.locator('#stop').first().click()
  await page.locator('#stop').first().click()
  expect(await page.locator('#stop').count()).toBe(0)
})
