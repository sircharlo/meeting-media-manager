/**
 * Example Playwright script for Electron
 * showing/testing various API features
 * in both renderer and main processes
 */
// eslint-disable-next-line import/named
import { expect, test } from '@playwright/test'
import { ipcRendererInvoke } from 'electron-playwright-helpers'
import jimp from 'jimp'
import { ElectronApplication, Page } from 'playwright'
import { version } from '../../package.json'
import { startApp, openHomePage } from './../helpers/electronHelpers'
import prefs from './../mocks/prefsOld.json'

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  electronApp = await startApp()
})

test.afterAll(async () => {
  await page.locator('[aria-label="Go to home"]').click()
  await electronApp.close()
})

test('render the presentation mode page correctly', async () => {
  page = await openHomePage(electronApp)
  const baseURL = page.url()

  // Open settings page
  await page.locator('[aria-label="settings"]').click()

  // Check for correct version
  expect((await page.locator('text=M³ v').innerText()).toLowerCase()).toBe(
    `m³ v${version}`
  )

  // Expand media setup
  await page.locator('button', { hasText: 'Media setup' }).click()

  // Turn media presention mode on
  await page
    .locator(
      'text=Present media on an external monitor or in a separate window'
    )
    .check()

  // Go back to home page
  await page.locator('[aria-label="home"]').click()

  // Verify home page
  expect(page.locator(`text=${prefs.congregationName}`).innerText).toBeTruthy()

  // Weird bug in Windows that changes the lang parameter after going back home (only when testing)
  await page.goto(baseURL)

  // Close media window
  await page.locator('[aria-label="toggleScreen"]').click()

  // Open presentation mode
  await page.locator('[aria-label="present"]').click()

  // Check for correct heading
  expect(await page.locator('h2').innerText()).toBe(`Meeting`)
})
/*
 test('send IPC message from renderer', async () => {
   // evaluate this script in render process
   // requires webPreferences.nodeIntegration true and contextIsolation false
   await page.evaluate(() => {
     // eslint-disable-next-line @typescript-eslint/no-var-requires
     require('electron').ipcRenderer.send('new-window')
   })
   const newPage = await electronApp.waitForEvent('window')
   expect(newPage).toBeTruthy()
   expect(await newPage.title()).toBe('Window 4')
   page = newPage
 }) */

test('receive IPC invoke/handle via renderer', async () => {
  // evaluate this script in RENDERER process and collect the result
  const result = await ipcRendererInvoke(page, 'appVersion')
  expect(result).toBe(version)
})

test('make sure two screenshots of the same page match', async ({ page }) => {
  // take a screenshot of the current page
  const screenshot1: Buffer = await page.screenshot()
  // create a visual hash using Jimp
  const screenshot1hash = (await jimp.read(screenshot1)).hash()
  // take a screenshot of the page
  const screenshot2: Buffer = await page.screenshot()
  // create a visual hash using Jimp
  const screenshot2hash = (await jimp.read(screenshot2)).hash()
  // compare the two hashes
  expect(screenshot1hash).toEqual(screenshot2hash)
})
