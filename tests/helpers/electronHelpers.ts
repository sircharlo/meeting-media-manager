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
import prefs from './../mocks/prefsOld.json'

export async function startApp() {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild('build')
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild)
  // set the CI environment variable to true
  process.env.CI = 'e2e'

  const electronApp = await electron.launch({
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

export async function openHomePage(app: ElectronApplication) {
  // Set first browser window as page
  const page = await app.firstWindow()

  // Insert mock preferences
  const congId = 'test'
  const appPath = (await ipcRendererInvoke(page, 'userData')) as string
  expect(appPath.endsWith(name)).toBe(true)
  const downloadsPath = (await ipcRendererInvoke(page, 'downloads')) as string
  prefs.localOutputPath = downloadsPath
  writeFileSync(join(appPath, `prefs-${congId}.json`), JSON.stringify(prefs))

  // Open the home page as test congregation
  await page.goto(`${page.url()}?cong=${congId}`)
  await page.waitForSelector('.fa-photo-film')

  return page
}
