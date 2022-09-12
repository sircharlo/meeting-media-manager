/**
 * Example Playwright script for Electron
 * showing/testing various API features
 * in both renderer and main processes
 */
import { join } from 'upath'
import { expect, test } from '@playwright/test'
import {
  findLatestBuild,
  parseElectronApp,
  ipcRendererInvoke,
} from 'electron-playwright-helpers'
import jimp from 'jimp'
import { ElectronApplication, Page, _electron as electron } from 'playwright'
import { version } from '../package.json'

let electronApp: ElectronApplication

test.beforeAll(async () => {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild('build')
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild)
  console.log(appInfo)
  // set the CI environment variable to true
  process.env.CI = 'e2e'
  electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: join(appInfo.executable, appInfo.name),
  })
  electronApp.on('window', (page) => {
    const filename = page.url()?.split('/').pop()
    console.log(`Window opened: ${filename}`)

    // capture errors
    page.on('pageerror', (error) => {
      console.error(error)
    })
    // capture console messages
    page.on('console', (msg) => {
      console.log(msg.text())
    })
  })
})

test.afterAll(async () => {
  await electronApp.close()
})

let page: Page

test('renders the first page', async () => {
  page = await electronApp.firstWindow()
  await page.waitForSelector('svg')
  const buildingUserIcon = await page.$eval('svg', (el) =>
    el.classList.contains('fa-building-user')
  )
  expect(buildingUserIcon).toBe(true)
  const title = await page.title()
  expect(title).toBe('M³ - Meeting Media Manager')
})

test(`cong list exists`, async () => {
  expect(await page.$('.v-list')).toBeTruthy()
})

test('click the test cong to go to the main page', async () => {
  await page.click('div[role="listitem"]')
  const photoFilmIcon = await page.waitForSelector('.fa-photo-film')
  expect(photoFilmIcon).toBeTruthy()
})

test('Home page has correct title', async () => {
  const title = await page.title()
  expect(title).toBe('Home - Meeting Media Manager')
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
