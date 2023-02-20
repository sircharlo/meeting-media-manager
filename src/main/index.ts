/* eslint-disable import/named */
/* eslint-disable @typescript-eslint/no-var-requires */
import { platform } from 'os'
import { existsSync } from 'fs-extra'
import {
  app,
  ipcMain,
  nativeTheme,
  screen,
  Point,
  session,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Event,
  RelaunchOptions,
  OpenDialogOptions,
} from 'electron'
import { init } from '@sentry/electron'
import { initRenderer } from 'electron-store'
import { join, normalize } from 'upath'
import { autoUpdater } from 'electron-updater'
import windowStateKeeper = require('electron-window-state')
import BrowserWinHandler from './BrowserWinHandler'
import {
  getScreenInfo,
  fadeWindow,
  setContentAspectRatio,
  setMediaWindowPosition,
  createMediaWindow,
  createWebsiteController,
} from './utils'
import { ElectronStore } from './../renderer/types'
require('dotenv').config()
const isDev = process.env.NODE_ENV === 'development'

app.commandLine.appendSwitch('disable-site-isolation-trials') // Allow listeners to work in iFrames

const initSentry =
  !!process.env.SENTRY_DSN &&
  !!process.env.SENTRY_ORG &&
  !!process.env.SENTRY_PROJECT &&
  !!process.env.SENTRY_AUTH_TOKEN

if (initSentry) {
  init({
    environment: isDev ? 'development' : 'production',
    dist: platform().replace('32', ''),
    enabled: !process.env.SENTRY_DISABLE,
    release: `meeting-media-manager@${
      isDev || !process.env.CI ? 'dev' : app.getVersion()
    }`,
    dsn: process.env.SENTRY_DSN,
  })
}

// Initialize the store
initRenderer()

// Disable hardware acceleration if the user turned it off
try {
  if (existsSync(join(app.getPath('userData'), 'disableHardwareAcceleration')))
    app.disableHardwareAcceleration()
} catch (err) {
  console.error(err)
}

// Initial values
let win: BrowserWindow | null = null
let winHandler: BrowserWinHandler | null = null
let website = false
let mediaWin: BrowserWindow | null = null
let mediaWinHandler: BrowserWinHandler | null = null
let websiteController: BrowserWindow | null = null
let websiteControllerWinHandler: BrowserWinHandler | null = null
let closeAttempts = 0
let allowClose = true
let updateDownloaded = false
let authorizedCloseMediaWin = false
const appLongName = 'Meeting Media Manager'

// Set correct app icon
let iconType = 'png'
if (platform() === 'darwin') iconType = 'icns'
if (platform() === 'win32') iconType = 'ico'

function onMove() {
  if (!mediaWin) return
  const screenInfo = getScreenInfo(win, mediaWin)
  if (screenInfo.winMidpoints && screenInfo.otherScreens.length > 0) {
    const mainWinSameAsMedia = Object.entries(screenInfo.winMidpoints)
      .map((item) => screen.getDisplayNearestPoint(item[1]))
      .every((val, _i, arr) => val.id === arr[0].id)

    if (mainWinSameAsMedia) {
      win?.webContents.send('moveMediaWindowToOtherScreen')
    }
  }
}

function onClose(e: Event) {
  const MS_IN_SEC = 1000
  if ((!allowClose || website) && closeAttempts < 2) {
    e.preventDefault()
    win?.webContents.send('notifyUser', [
      'cantCloseMediaWindowOpen',
      { type: 'warning' },
    ])
    closeAttempts++
    setTimeout(() => {
      closeAttempts--
    }, 10 * MS_IN_SEC)
  } else {
    websiteController?.destroy()
    mediaWin?.destroy()
  }
}

interface Pos {
  x?: number
  y?: number
  width?: number
  height?: number
  manage?: (win: BrowserWindow) => void
}

// Main window
function createMainWindow(pos: Pos = { width: 700, height: 700 }) {
  winHandler = new BrowserWinHandler({
    x: pos.x,
    y: pos.y,
    height: pos.height,
    width: pos.width,
    minWidth: 670,
    minHeight: 475,
    title: appLongName,
  })

  win = winHandler.browserWindow as BrowserWindow

  if (pos.manage) {
    pos.manage(win)
  }

  win.on('move', onMove)
  win.on('close', onClose)

  winHandler.loadPage('/')
}

function closeMediaWindow() {
  if (mediaWin) {
    authorizedCloseMediaWin = true
    mediaWin.close()
    mediaWin = null
    mediaWinHandler = null
    authorizedCloseMediaWin = false
  }
}

// Prevent opening the app multiple times
const gotTheLock = app.requestSingleInstanceLock()
if (gotTheLock) {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  // IpcMain events for general purposes
  ipcMain.handle('userData', () => normalize(app.getPath('userData')))
  ipcMain.handle('mediaWinOpen', () => !!mediaWin)
  ipcMain.handle('mediaWinVisible', () => mediaWin && mediaWin.isVisible())
  ipcMain.handle('appData', () => normalize(app.getPath('appData')))
  ipcMain.handle('downloads', () => normalize(app.getPath('downloads')))
  ipcMain.handle('appVersion', () => app.getVersion())
  ipcMain.handle('getScreenInfo', () => getScreenInfo(win, mediaWin))
  ipcMain.handle('darkMode', () => nativeTheme.shouldUseDarkColors)

  nativeTheme.on('updated', () => {
    win?.webContents.send('themeUpdated', nativeTheme.shouldUseDarkColors)
  })

  ipcMain.on('setTheme', (_e, val: 'system' | 'light' | 'dark') => {
    nativeTheme.themeSource = val
  })

  ipcMain.on('runAtBoot', (_e, val: boolean) => {
    app.setLoginItemSettings({ openAtLogin: val })
  })

  ipcMain.on('exit', () => {
    app.exit()
  })

  ipcMain.on('installNow', () => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall(false)
    }
  })

  ipcMain.on('toggleAutoUpdate', (_e, val: boolean) => {
    autoUpdater.autoInstallOnAppQuit = val
  })

  ipcMain.on('openPath', (_e, path: string) => {
    require('electron').shell.openPath(
      path.replaceAll('/', platform() === 'win32' ? '\\' : '/')
    )
  })
  ipcMain.handle('openDialog', async (_e, options: OpenDialogOptions) => {
    const result = await require('electron').dialog.showOpenDialog(options)
    return result
  })

  ipcMain.on('restart', () => {
    const RESTART_CODE = 250
    if (isDev) {
      app.exit(RESTART_CODE)
    } else {
      let options: RelaunchOptions = {}
      if (process.env.APPIMAGE) {
        options = {
          execPath: process.env.APPIMAGE,
          args: ['--appimage-extract-and-run'],
        }
      }
      app.relaunch(options)
      app.quit()
    }
  })

  ipcMain.handle(
    'registerShortcut',
    (
      _e,
      { shortcut, fn }: { shortcut: string; fn: keyof typeof functions }
    ) => {
      const globalShortcut = require('electron').globalShortcut
      const functions = {
        toggleMediaWindow: () => {
          fadeWindow(win, mediaWin)
        },
        openPresentMode: () => {
          win?.webContents.send('openPresentMode')
        },
        toggleMusicShuffle: () => {
          win?.webContents.send('toggleMusicShuffle')
        },
        setObsScene: () => {
          win?.webContents.send('setObsScene', +shortcut.split('+')[1])
        },
        previousMediaItem: () => {
          win?.webContents.send('play', 'previous')
        },
        nextMediaItem: () => {
          win?.webContents.send('play', 'next')
        },
      }
      if (globalShortcut.isRegistered(shortcut)) {
        globalShortcut.unregister(shortcut)
      }
      return globalShortcut.register(shortcut, functions[fn])
    }
  )
  ipcMain.on('unregisterShortcut', (_e, shortcut: string) => {
    const globalShortcut = require('electron').globalShortcut
    if (globalShortcut.isRegistered(shortcut)) {
      globalShortcut.unregister(shortcut)
    }
  })

  ipcMain.handle('getFromJWOrg', async (_e, opt) => {
    const options = {
      adapter: require('axios/lib/adapters/http'),
      ...opt,
    }
    options.url = undefined
    try {
      const result: any = await require('axios').get(opt.url, options)
      return result.data
    } catch (e) {
      return e
    }
  })

  // IpcMain events for the presentation window
  ipcMain.on('videoProgress', (_e, percent: number[]) => {
    win?.webContents.send('videoProgress', percent)
  })
  ipcMain.on('videoEnd', () => {
    win?.webContents.send('videoEnd')
    win?.webContents.send('showingMedia', false)
  })
  ipcMain.on('videoPaused', () => {
    win?.webContents.send('videoPaused')
  })
  ipcMain.on('readyToListen', () => {
    win?.webContents.send('readyToListen')
  })

  // IpcMain events for the media window
  ipcMain.on(
    'showMedia',
    (
      _e,
      media: {
        src: string
        stream?: boolean
        start?: string
        end?: string
      } | null
    ) => {
      mediaWin?.webContents.send('showMedia', media)
      win?.webContents.send('showingMedia', [!!media, !!media?.start])
    }
  )
  ipcMain.on('hideMedia', () => {
    mediaWin?.webContents.send('hideMedia')
    win?.webContents.send('showingMedia', false)
  })
  ipcMain.on('pauseVideo', () => {
    mediaWin?.webContents.send('pauseVideo')
  })
  ipcMain.on('playVideo', () => {
    mediaWin?.webContents.send('playVideo')
  })
  ipcMain.on('moveMouse', (_e, pos: Point) => {
    mediaWin?.webContents.send('moveMouse', pos)
  })
  ipcMain.on('sendSize', () => {
    websiteController?.webContents.send('mediaSize', mediaWin?.getContentSize())
    websiteController?.webContents.send(
      'winSize',
      websiteController?.getContentSize()
    )
  })
  ipcMain.on('scrollWebsite', (_e, pos: Point) => {
    mediaWin?.webContents.send('scrollWebsite', pos)
  })
  ipcMain.on(
    'clickOnWebsite',
    (
      _e,
      target: {
        tag: string
        id: string
        className?: string
        text: string | null
        alt: string | null
        src: string | null
        href: string | null
      }
    ) => {
      mediaWin?.webContents.send('clickOnWebsite', target)
    }
  )
  ipcMain.on('openWebsite', (_e, url: string) => {
    win?.webContents.send('showingMedia', [true, true])
    if (website && websiteControllerWinHandler) {
      mediaWinHandler?.loadPage('/browser?url=' + url)
      websiteControllerWinHandler.loadPage(
        '/browser?controller=true&url=' + url
      )
      return
    }

    const MIN_WIDTH = 1280
    const MIN_HEIGHT = 720
    mediaWin?.setMinimumSize(MIN_WIDTH, MIN_HEIGHT)
    mediaWinHandler?.loadPage('/browser?url=' + url)
    website = true

    const windowOpts: BrowserWindowConstructorOptions = {
      x: win?.getBounds().x,
      y: win?.getBounds().y,
    }

    const mediaFullscreen = mediaWin?.isFullScreen()

    if (!mediaFullscreen) {
      windowOpts.width = mediaWin?.getBounds().width
      windowOpts.height = mediaWin?.getBounds().height
    }
    websiteControllerWinHandler = createWebsiteController(
      windowOpts,
      mediaFullscreen
    )
    websiteController =
      websiteControllerWinHandler.browserWindow as BrowserWindow
    websiteControllerWinHandler.loadPage('/browser?controller=true&url=' + url)

    websiteController
      .on('resize', () => {
        if (!websiteController?.isMaximized()) {
          websiteController?.webContents.send(
            'mediaSize',
            mediaWin?.getContentSize()
          )
          websiteController?.webContents.send(
            'winSize',
            websiteController?.getContentSize()
          )
        }
      })
      // Not available for Linux
      .on('resized', () => {
        setContentAspectRatio(websiteController)
      })
      .on('unmaximize', () => {
        websiteController?.webContents.send(
          'mediaSize',
          mediaWin?.getContentSize()
        )
        websiteController?.webContents.send(
          'winSize',
          websiteController?.getContentSize()
        )
      })
      .on('maximize', () => {
        websiteController?.webContents.send('mediaSize', [0, 0])
        websiteController?.webContents.send('winSize', [0, 0])
      })
      .on('close', () => {
        win?.webContents.send('showingMedia', [false, false])
        mediaWinHandler?.loadPage('/media')
        const MIN_WIDTH = 195
        const MIN_HEIGHT = 110
        mediaWin?.setMinimumSize(MIN_WIDTH, MIN_HEIGHT)
        website = false
        allowClose = false
        closeAttempts = 0
      })

    websiteController.webContents.send('mediaSize', mediaWin?.getContentSize())
    websiteController.webContents.send(
      'winSize',
      websiteController.getContentSize()
    )
  })
  ipcMain.on(
    'toggleSubtitles',
    (_e, payload: { enabled: boolean; top: boolean }) => {
      mediaWin?.webContents.send('toggleSubtitles', payload)
    }
  )
  ipcMain.on('videoScrub', (_e, timeAsPercent: number) => {
    mediaWin?.webContents.send('videoScrub', timeAsPercent)
  })
  ipcMain.on('startMediaDisplay', (_e, prefs: ElectronStore) => {
    mediaWin?.webContents.send('startMediaDisplay', prefs)
  })
  ipcMain.on('zoom', (_e, deltaY: number) => {
    mediaWin?.webContents.send('zoom', deltaY)
  })
  ipcMain.on('pan', (_e, coords: Point) => {
    mediaWin?.webContents.send('pan', coords)
  })

  // IpcMain events to control the windows
  ipcMain.on('allowQuit', (_e, val: boolean) => {
    allowClose = val
  })
  ipcMain.on('toggleMediaWindowFocus', () => {
    fadeWindow(win, mediaWin)
  })
  ipcMain.on('closeMediaWindow', () => {
    closeMediaWindow()
  })
  ipcMain.on(
    'showMediaWindow',
    (
      _e,
      mediaWinOptions: {
        destination: number
        type: 'fullscreen' | 'window'
      }
    ) => {
      if (
        mediaWin &&
        platform() === 'darwin' &&
        (mediaWinOptions.type === 'window') === mediaWin.isFullScreen()
      ) {
        closeMediaWindow()
      }

      if (mediaWin) {
        setMediaWindowPosition(win, mediaWin, mediaWinOptions)
      } else {
        const screenInfo = getScreenInfo(win, mediaWin)
        const STARTING_POSITION = 50

        const windowOptions = {
          icon: join(
            process.resourcesPath,
            'videoPlayer',
            `videoPlayer.${iconType}`
          ),
          fullscreen: mediaWinOptions.type === 'fullscreen',
          x:
            (screenInfo.displays.find(
              (display) => display.id === mediaWinOptions.destination
            )?.bounds?.x ?? 0) + STARTING_POSITION,
          y:
            (screenInfo.displays.find(
              (display) => display.id === mediaWinOptions.destination
            )?.bounds?.y ?? 0) + STARTING_POSITION,
        }

        mediaWinHandler = createMediaWindow(windowOptions)
        mediaWin = mediaWinHandler.browserWindow as BrowserWindow

        mediaWin
          .on('close', (e) => {
            if (!authorizedCloseMediaWin) e.preventDefault()
          })
          .on('will-resize', () => {
            // Not working on Linux
            mediaWin?.webContents.send('windowResizing', mediaWin.getSize())
            win?.webContents.send('resetZoom')
            mediaWin?.webContents.send('resetZoom')
          })
          .on('resize', () => {
            websiteController?.webContents.send(
              'mediaSize',
              mediaWin?.getContentSize()
            )
            websiteController?.webContents.send(
              'winSize',
              websiteController?.getContentSize()
            )
            if (platform() === 'linux') {
              win?.webContents.send('resetZoom')
              mediaWin?.webContents.send('resetZoom')
            }
          })
          // Not available for Linux
          .on('resized', () => {
            mediaWin?.webContents.send('windowResized')
          })

        win?.webContents.send('mediaWindowShown')
      }
    }
  )

  // Auto updater events
  autoUpdater.logger = console
  autoUpdater.autoDownload = false

  ipcMain.on('checkForUpdates', () => {
    autoUpdater.checkForUpdates()
  })

  autoUpdater.on('error', (e) => {
    win?.webContents.send('notifyUser', ['updateError', { type: 'error' }, e])
  })
  autoUpdater.on('update-available', (info) => {
    if (platform() === 'darwin') {
      win?.webContents.send('macUpdate')
    } else {
      win?.webContents.send('notifyUser', [
        'updateDownloading',
        { identifier: 'v' + info.version },
      ])
      autoUpdater.downloadUpdate().catch((e) => {
        win?.webContents.send('notifyUser', [
          'updateNotDownloaded',
          { type: 'warning' },
          e,
        ])
      })
    }
  })
  autoUpdater.on('update-downloaded', () => {
    updateDownloaded = true
    win?.webContents.send('notifyUser', [
      'updateDownloaded',
      {
        persistent: true,
      },
    ])
  })

  // When ready create main window
  app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.jw.org/*'] },
      (details, resolve) => {
        let cookies = 'ckLang=E;'
        if (details.requestHeaders.cookie) {
          cookies += ' ' + details.requestHeaders.cookie
        } else if (details.requestHeaders.Cookie) {
          cookies += ' ' + details.requestHeaders.Cookie
        }
        details.requestHeaders = {
          ...details.requestHeaders,
          Cookie: cookies,
          'User-Agent': details.requestHeaders['User-Agent'].replace(
            /Electron\/\d+\.\d+\.\d+ /,
            ''
          ),
        }
        resolve({ requestHeaders: details.requestHeaders })
      }
    )

    session.defaultSession.webRequest.onHeadersReceived(
      { urls: ['*://*.jw.org/*'] },
      (details, resolve) => {
        if (!details.responseHeaders) details.responseHeaders = {}
        details.responseHeaders['x-frame-options'] = ['ALLOWALL']
        details.responseHeaders['content-security-policy'] = []
        const setCookie = details.responseHeaders['set-cookie']
        if (setCookie) {
          details.responseHeaders['set-cookie'] = setCookie.map((c) =>
            c
              .replace('HttpOnly', 'Secure')
              .replace('Secure', 'SameSite=None; Secure')
          )
        }
        resolve({ responseHeaders: details.responseHeaders })
      }
    )

    screen.on('display-removed', () => {
      win?.webContents.send('displaysChanged')
    })
    screen.on('display-added', () => {
      win?.webContents.send('displaysChanged')
    })
    createMainWindow(
      windowStateKeeper({
        defaultWidth: 700,
        defaultHeight: 700,
      })
    )
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    app.exit()
  })
} else {
  app.quit()
}
