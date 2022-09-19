import { platform } from 'os'
import { join } from 'upath'
// eslint-disable-next-line import/named
import { writeFileSync } from 'fs-extra'
import { expect } from '@playwright/test'
import {
  findLatestBuild,
  parseElectronApp,
  ipcRendererInvoke,
} from 'electron-playwright-helpers'
import { _electron as electron, ElectronApplication } from 'playwright'
import { name } from '../../package.json'
import prefsOld from './../mocks/prefs/prefsOld.json'

export async function startApp(options: any = {}) {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild('build')
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild)
  // set the CI environment variable to true
  process.env.CI = 'e2e'

  const electronApp = await electron.launch({
    ...options,
    args: [appInfo.main],
    executablePath:
      platform() === 'linux'
        ? join(appInfo.executable, appInfo.name)
        : appInfo.executable,
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

  return electronApp
}

export async function openHomePage(
  app: ElectronApplication,
  prefsObject?: any
) {
  // Set first browser window as page
  const page = await app.firstWindow()

  // Wait for page to finish loading
  await page.waitForLoadState('domcontentloaded')

  // Set mock preferences
  const congId = 'test'
  const prefs = prefsObject ?? prefsOld

  const appPath = (await ipcRendererInvoke(page, 'userData')) as string
  expect(appPath.endsWith(name)).toBe(true)

  const downloadsPath = (await ipcRendererInvoke(page, 'downloads')) as string
  prefs.localOutputPath = downloadsPath

  // Insert mock preferences
  writeFileSync(join(appPath, `prefs-${congId}.json`), JSON.stringify(prefs))

  // Open the home page as test congregation
  await page.goto(`app://./index.html?cong=${congId}`)
  await page.waitForSelector('.fa-photo-film')

  return page
}
