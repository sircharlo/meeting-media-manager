import { expect, test } from '@playwright/test'
import jimp from 'jimp'
import { ElectronApplication, Page } from 'playwright'
import { version } from '../../package.json'
import { delay } from '../helpers/generalHelpers'
import {
  ipcRendererInvoke,
  startApp,
  openHomePage,
} from './../helpers/electronHelpers'
import prefs from './../mocks/prefs/prefsOld.json'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  electronApp = await startApp()
})

test.afterAll(async () => {
  await electronApp.close()
})

let page: Page

test('render the home page correctly', async () => {
  page = await openHomePage(electronApp, prefs)

  // Check that the correct congregation is loaded
  expect(page.locator(`text=${prefs.congregationName}`).innerText).toBeTruthy()

  // Test if title is correct
  const title = await page.title()
  expect(title).toBe('Home - Meeting Media Manager')
  await page.screenshot({ path: 'img/main/main-screen.png' })

  // Open date picker
  await page.locator('#week-select').click()
  // eslint-disable-next-line no-magic-numbers
  await delay(500)
  await page.screenshot({ path: 'img/main/date-picker.png' })
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
