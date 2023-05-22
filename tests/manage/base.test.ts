import { platform } from 'os'
import { expect, test, ElectronApplication, Page } from '@playwright/test'
import jimp from 'jimp'
import { delay } from '../helpers/generalHelpers'
import { version } from '../../package.json'
import {
  startApp,
  openHomePage,
  ipcRendererInvoke,
} from './../helpers/electronHelpers'
import locale from './../../src/renderer/locales/en.json'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  electronApp = await startApp()
})

test.afterAll(async () => {
  await electronApp.close()
})

let page: Page

test('render the add media page correctly', async () => {
  page = await openHomePage(electronApp)

  // Open add page
  await page.locator('.v-card', { hasText: locale.recurring }).click()
  if (platform() === 'darwin') {
    await delay(5 * 100)
  }

  // Check for correct heading
  expect(await page.locator('h1').innerText()).toBe(locale.recurring)

  // Test if title is correct
  const title = await page.title()
  expect(title).toBe('Manage Recurring - M³')
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
