/* eslint-disable import/named */
import { platform } from 'os'
import { basename, dirname, join, resolve } from 'upath'
import * as ASAR from '@electron/asar'
import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  existsSync,
} from 'fs-extra'
import { expect, Page } from '@playwright/test'
import { _electron, ElectronApplication } from 'playwright'
import { name } from '../../package.json'
import { delay } from './generalHelpers'
import prefsNew from './../mocks/prefs/prefsNew.json'

export async function startApp(options: any = {}) {
  // find the latest build in the out directory
  const latestBuild = findLatestBuild('build')
  // parse the directory and find paths and other info
  const appInfo = parseElectronApp(latestBuild)
  // set the CI environment variable to true
  process.env.CI = 'e2e'

  const electronApp = await _electron.launch({
    ...options,
    args: [appInfo.main],
    executablePath:
      platform() === 'linux'
        ? join(appInfo.executable, appInfo.name)
        : appInfo.executable,
  })

  electronApp.on('window', async (page) => {
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

    if (filename === 'media' && !existsSync('img/present/default-bg.png')) {
      // eslint-disable-next-line no-magic-numbers
      await delay(1000)
      await page.screenshot({ path: 'img/present/default-bg.png' })
    }
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
  const prefs = prefsObject ?? prefsNew

  const appPath = (await ipcRendererInvoke(page, 'userData')) as string
  expect(appPath.endsWith(name)).toBe(true)

  const downloadsPath = (await ipcRendererInvoke(page, 'downloads')) as string
  if (prefs.app) {
    prefs.app.localOutputPath = downloadsPath
  } else {
    prefs.localOutputPath = downloadsPath
  }

  const congName = prefs.app
    ? prefs.app.congregationName
    : prefs.congregationName

  const onCongSelect = (await page.locator('.fa-building-user').count()) > 0
  const congPresent = (await page.locator(`text=${congName}`).count()) > 0

  // Insert mock preferences
  writeFileSync(join(appPath, `prefs-${congId}.json`), JSON.stringify(prefs))

  if (onCongSelect && congPresent) {
    if (await page.locator(`text=${congName}`).isVisible()) {
      // Select congregation from list
      await page.locator(`text=${congName}`).click()
    }
  } else if (onCongSelect) {
    // Click on first cong in list
    await page.locator(`.v-list-item`).first().click()
  } else if (page.url().includes('settings')) {
    // Open the home page as test congregation
    await page.goto(`app://./index.html#/?cong=${congId}`)
    await page.reload({ waitUntil: 'domcontentloaded' })
  }

  // While still on the settings page, click on the home page button, until the prefs are accepted as valid
  await delay(10 ** 3)
  let url = page.url()

  while (url.includes('settings')) {
    await page.getByRole('link', { disabled: false }).click()
    await delay(10 ** 3)
    url = page.url()
  }

  // If not on correct cong, switch cong through menu
  if ((await page.locator(`text=${congName}`).count()) !== 1) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator(`input#cong-select`).click()
    await page.locator(`text=${congName}`).last().click()
  }

  // Wait for page to finish loading
  await page.waitForLoadState('domcontentloaded')
  await page.waitForSelector('.fa-photo-film')
  await page.waitForSelector(`text=${congName}`)

  return page
}

export function ipcRendererInvoke(
  window: Page,
  message: string,
  ...args: unknown[]
): Promise<unknown> {
  return window.evaluate(
    async ({ message, args }) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ipcRenderer } = require('electron')
      return await ipcRenderer.invoke(message, ...args)
    },
    { message, args }
  )
}

function findLatestBuild(buildDirectory = 'out'): string {
  // root of your project
  const rootDir = resolve('./')
  // directory where the builds are stored
  const outDir = buildDirectory.startsWith('/')
    ? buildDirectory
    : join(rootDir, buildDirectory)
  // list of files in the out directory
  const builds = readdirSync(outDir)
  const platforms = [
    'win32',
    'win',
    'windows',
    'darwin',
    'mac',
    'macos',
    'osx',
    'linux',
    'ubuntu',
  ]
  const latestBuild = builds
    .map((fileName) => {
      // make sure it's a directory with "-" delimited platform in its name
      const stats = statSync(join(outDir, fileName))
      const isBuild = fileName
        .toLocaleLowerCase()
        .split('-')
        .some((part) => platforms.includes(part))
      if (stats.isDirectory() && isBuild) {
        return {
          name: fileName,
          time: statSync(join(outDir, fileName)).mtimeMs,
        }
      }
      return undefined
    })
    .sort((a, b) => {
      const aTime = a ? a.time : 0
      const bTime = b ? b.time : 0
      return bTime - aTime
    })
    .map((file) => {
      if (file) {
        return file.name
      }
      return undefined
    })[0]
  if (!latestBuild) {
    throw new Error('No build found in out directory')
  }
  return join(outDir, latestBuild)
}

type Architecture = 'x64' | 'x32' | 'arm64' | undefined
interface ElectronAppInfo {
  /** Path to the app's executable file */
  executable: string
  /** Path to the app's main (JS) file */
  main: string
  /** Name of the app */
  name: string
  /** Resources directory */
  resourcesDir: string
  /** True if the app is using asar */
  asar: boolean
  /** OS platform */
  platform: 'darwin' | 'win32' | 'linux'
  /** Architecture */
  arch: Architecture
}

function parseElectronApp(buildDir: string): ElectronAppInfo {
  console.log(`Parsing Electron app in ${buildDir}`)

  let platform = ''

  // in case the buildDir is the path to the app itself
  if (buildDir.endsWith('.app')) {
    buildDir = dirname(buildDir)
    platform = 'darwin'
  }
  if (buildDir.endsWith('.exe')) {
    buildDir = dirname(buildDir)
    platform = 'win32'
  }

  const baseName = basename(buildDir).toLowerCase()
  if (!platform) {
    // parse the directory name to figure out the platform
    if (baseName.includes('win')) {
      platform = 'win32'
    }
    if (
      baseName.includes('linux') ||
      baseName.includes('ubuntu') ||
      baseName.includes('debian')
    ) {
      platform = 'linux'
    }
    if (
      baseName.includes('darwin') ||
      baseName.includes('mac') ||
      baseName.includes('osx')
    ) {
      platform = 'darwin'
    }
  }

  if (!platform) {
    throw new Error(`Platform not found in directory name: ${baseName}`)
  }

  let arch: Architecture
  if (baseName.includes('x32') || baseName.includes('i386')) {
    arch = 'x32'
  }
  if (baseName.includes('x64')) {
    arch = 'x64'
  }
  if (baseName.includes('arm64')) {
    arch = 'arm64'
  }

  let executable: string
  let main: string
  let name: string
  let asar: boolean
  let resourcesDir: string

  if (platform === 'darwin') {
    // MacOS Structure
    // <buildDir>/
    //   <appName>.app/
    //     Contents/
    //       MacOS/
    //        <appName> (executable)
    //       Info.plist
    //       PkgInfo
    //       Resources/
    //         electron.icns
    //         file.icns
    //         app.asar (asar bundle) - or -
    //         app
    //           package.json
    //           (your app structure)
    const list = readdirSync(buildDir)
    const appBundle = list.find((fileName) => {
      return fileName.endsWith('.app')
    })
    if (!appBundle) {
      throw new Error(`Could not find app bundle in ${buildDir}`)
    }
    const appDir = join(buildDir, appBundle, 'Contents', 'MacOS')
    const appName = readdirSync(appDir)[0]
    executable = join(appDir, appName)

    resourcesDir = join(buildDir, appBundle, 'Contents', 'Resources')
    const resourcesList = readdirSync(resourcesDir)
    asar = resourcesList.includes('app.asar')

    let packageJson: { main: string; name: string }
    if (asar) {
      const asarPath = join(resourcesDir, 'app.asar')
      packageJson = JSON.parse(
        ASAR.extractFile(asarPath, 'package.json').toString('utf8')
      )
      main = join(asarPath, packageJson.main)
    } else {
      packageJson = JSON.parse(
        readFileSync(join(resourcesDir, 'app', 'package.json'), 'utf8')
      )
      main = join(resourcesDir, 'app', packageJson.main)
    }
    name = packageJson.name
  } else if (platform === 'win32') {
    // Windows Structure
    // <buildDir>/
    //   <appName>.exe (executable)
    //   resources/
    //     app.asar (asar bundle) - or -
    //     app
    //       package.json
    //       (your app structure)
    const list = readdirSync(buildDir)
    const exe = list.find((fileName) => {
      return fileName.endsWith('.exe')
    })
    if (!exe) {
      throw new Error(`Could not find executable in ${buildDir}`)
    }
    executable = join(buildDir, exe)

    resourcesDir = join(buildDir, 'resources')
    const resourcesList = readdirSync(resourcesDir)
    asar = resourcesList.includes('app.asar')

    let packageJson: { main: string; name: string }

    if (asar) {
      const asarPath = join(resourcesDir, 'app.asar')
      packageJson = JSON.parse(
        ASAR.extractFile(asarPath, 'package.json').toString('utf8')
      )
      main = join(asarPath, packageJson.main)
    } else {
      packageJson = JSON.parse(
        readFileSync(join(resourcesDir, 'app', 'package.json'), 'utf8')
      )
      main = join(resourcesDir, 'app', packageJson.main)
    }
    name = packageJson.name
  } else if (platform === 'linux') {
    // Linux Structure
    // <buildDir>/
    //   <appName> (executable)
    //   resources/
    //     app.asar (asar bundle) - or -
    //     app --- (untested - we're making assumptions here)
    //       package.json
    //       (your app structure)
    executable = join(buildDir, getLinuxExecutableName(baseName))
    resourcesDir = join(buildDir, 'resources')
    const resourcesList = readdirSync(resourcesDir)
    asar = resourcesList.includes('app.asar')

    let packageJson: { main: string; name: string }

    if (asar) {
      const asarPath = join(resourcesDir, 'app.asar')
      packageJson = JSON.parse(
        ASAR.extractFile(asarPath, 'package.json').toString('utf8')
      )
      main = join(asarPath, packageJson.main)
    } else {
      try {
        packageJson = JSON.parse(
          readFileSync(join(resourcesDir, 'app', 'package.json'), 'utf8')
        )
        main = join(resourcesDir, 'app', packageJson.main)
      } catch (err) {
        throw new Error(
          `Could not find package.json in ${resourcesDir}. Apparently we don't quite know how Electron works on Linux yet. Please submit a bug report or pull request!`
        )
      }
    }
    name = packageJson.name
  } else {
    throw new Error(`Platform not supported: ${platform}`)
  }
  return {
    executable,
    main,
    asar,
    name,
    platform,
    resourcesDir,
    arch,
  }
}

function getLinuxExecutableName(baseName: string): string {
  const tokens = baseName.split('-')
  const result = tokens.slice(0, tokens.length - 2).join('-')
  return result
}
