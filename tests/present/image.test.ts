import { platform } from 'os'
// eslint-disable-next-line import/named
import { existsSync } from 'fs-extra'
import { sync } from 'fast-glob'
import { expect, test, ElectronApplication, Page } from '@playwright/test'
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
  test.slow()
  if (platform() === 'win32') {
    test.skip()
  }

  page = await openHomePage(electronApp)

  // Open settings page
  await page.locator('[aria-label="settings"]').click()
  if (platform() === 'darwin') {
    await delay(5 * 100)
  }

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
  const oneMeeting =
    sync(join(mediaPath, prefs.lang, '*'), {
      onlyDirectories: true,
      ignore: [join(mediaPath, prefs.lang, 'Recurring')],
    }).length === 1
  if (existsSync(join(mediaPath, prefs.lang, getDate())) || oneMeeting) {
    // Check if more actions button is present
    expect(
      await page
        .locator('[aria-label="More actions"]')
        .getAttribute('aria-label')
    ).toBeTruthy()
    await page.getByText(getDate(oneMeeting ? 'we' : 'mw')).click()
  }
  // Check for correct heading
  expect(await page.locator('h2').innerText()).toBe(locale.meeting)

  if (platform() === 'linux') {
    await page.screenshot({ path: 'img/present/meeting-picker.png' })
  }

  await page
    .getByRole('listitem')
    .nth(oneMeeting ? 0 : 1)
    .click()
  expect(
    await page.locator('[aria-label="More actions"]').getAttribute('aria-label')
  ).toBeTruthy()
})

test('play an image', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  await page.locator('#play').nth(1).click()
  expect(await page.locator('#stop').count()).toBe(1)

  if (platform() === 'linux') {
    await delay(10 * 100)
    await page.screenshot({ path: 'img/present/picture-playing.png' })
  }
})

test('stop an image', async () => {
  if (platform() === 'win32') {
    test.skip()
  }

  await page.locator('#stop').first().click()
  expect(await page.locator('#stop').count()).toBe(0)
})
