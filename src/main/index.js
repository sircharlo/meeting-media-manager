/* eslint-disable import/named */
import { app, ipcMain, nativeTheme, screen, session } from 'electron'
import { init } from '@sentry/electron'
import { initRenderer } from 'electron-store'
import { existsSync } from 'fs-extra'
import { join, normalize } from 'upath'
import { autoUpdater } from 'electron-updater'
import BrowserWinHandler from './BrowserWinHandler'
import {
  getScreenInfo,
  fadeWindow,
  setMediaWindowPosition,
  createMediaWindow,
  createWebsiteController,
} from './utils'
require('dotenv').config()
const { platform } = require('os')
const windowStateKeeper = require('electron-window-state')
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
let win = null
let winHandler = null
let website = false
let mediaWin = null
let mediaWinHandler = null
let websiteController = null
let websiteControllerWinHandler = null
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
      win.webContents.send('moveMediaWindowToOtherScreen')
    }
  }
}

function onClose(e) {
  const MS_IN_SEC = 1000

  if (!allowClose && closeAttempts < 2) {
    e.preventDefault()
    win.webContents.send('notifyUser', [
      'cantCloseMediaWindowOpen',
      { type: 'warning' },
    ])
    closeAttempts++
    setTimeout(() => {
      closeAttempts--
    }, 10 * MS_IN_SEC)
  } else if (mediaWin) {
    mediaWin.destroy()
  }
}

// Main window
function createMainWindow(pos = { width: 700, height: 700 }) {
  winHandler = new BrowserWinHandler({
    x: pos.x,
    y: pos.y,
    height: pos.height,
    width: pos.width,
    minWidth: 670,
    minHeight: 435,
    title: appLongName,
  })

  win = winHandler.browserWindow

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
    win.webContents.send('themeUpdated', nativeTheme.shouldUseDarkColors)
  })

  ipcMain.on('setTheme', (_e, val) => {
    nativeTheme.themeSource = val
  })

  ipcMain.on('runAtBoot', (_e, val) => {
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

  ipcMain.on('toggleAutoUpdate', (val) => {
    autoUpdater.autoInstallOnAppQuit = val
  })

  ipcMain.on('openPath', (_e, path) => {
    require('electron').shell.openPath(
      path.replaceAll('/', platform() === 'win32' ? '\\' : '/')
    )
  })
  ipcMain.handle('openDialog', async (_e, options) => {
    const result = await require('electron').dialog.showOpenDialog(options)
    return result
  })

  ipcMain.on('restart', () => {
    const RESTART_CODE = 250
    if (isDev) {
      app.exit(RESTART_CODE)
    } else {
      let options
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

  ipcMain.handle('registerShortcut', (_e, { shortcut, fn }) => {
    const globalShortcut = require('electron').globalShortcut
    const functions = {
      toggleMediaWindow: () => {
        fadeWindow(win, mediaWin)
      },
      openPresentMode: () => {
        win.webContents.send('openPresentMode')
      },
      toggleMusicShuffle: () => {
        win.webContents.send('toggleMusicShuffle')
      },
      setObsScene: () => {
        win.webContents.send('setObsScene', +shortcut.split('+')[1])
      },
      previousMediaItem: () => {
        win.webContents.send('play', 'previous')
      },
      nextMediaItem: () => {
        win.webContents.send('play', 'next')
      },
    }
    if (globalShortcut.isRegistered(shortcut)) {
      globalShortcut.unregister(shortcut)
    }
    return globalShortcut.register(shortcut, functions[fn])
  })
  ipcMain.on('unregisterShortcut', (_e, shortcut) => {
    const globalShortcut = require('electron').globalShortcut
    if (globalShortcut.isRegistered(shortcut)) {
      globalShortcut.unregister(shortcut)
    }
  })

  ipcMain.handle('getFromJWOrg', async (_e, opt) => {
    const options = {
      adapter: require('axios/lib/adapters/http'),
      headers: {},
      params: {},
    }
    if (opt.headers) options.headers = opt.headers
    if (opt.params) options.params = opt.params
    try {
      const result = await require('axios').get(opt.url, options)
      return result.data
    } catch (e) {
      return e
    }
  })

  // IpcMain events for the presentation window
  ipcMain.on('videoProgress', (_e, percent) => {
    win.webContents.send('videoProgress', percent)
  })
  ipcMain.on('videoEnd', () => {
    win.webContents.send('videoEnd')
    win.webContents.send('showingMedia', false)
  })
  ipcMain.on('videoPaused', () => {
    win.webContents.send('videoPaused')
  })
  ipcMain.on('readyToListen', () => {
    win.webContents.send('readyToListen')
  })

  // IpcMain events for the media window
  ipcMain.on('showMedia', (_e, media) => {
    mediaWin.webContents.send('showMedia', media)
    win.webContents.send('showingMedia', [
      !!media,
      media ? !!media.start : false,
    ])
  })
  ipcMain.on('hideMedia', () => {
    mediaWin.webContents.send('hideMedia')
    win.webContents.send('showingMedia', false)
  })
  ipcMain.on('pauseVideo', () => {
    mediaWin.webContents.send('pauseVideo')
  })
  ipcMain.on('playVideo', () => {
    mediaWin.webContents.send('playVideo')
  })
  ipcMain.on('scrollWebsite', (_e, pos) => {
    mediaWin.webContents.send('scrollWebsite', pos)
  })
  ipcMain.on('clickOnWebsite', (_e, target) => {
    mediaWin.webContents.send('clickOnWebsite', target)
  })
  ipcMain.on('openWebsite', (_e, url) => {
    win.webContents.send('showingMedia', [true, true])
    if (website && websiteController) {
      mediaWinHandler.loadPage('/browser?url=' + url)
      websiteControllerWinHandler.loadPage(
        '/browser?controller=true&url=' + url
      )
      return
    }

    // eslint-disable-next-line no-magic-numbers
    mediaWin.setMinimumSize(1280, 720)
    mediaWinHandler.loadPage('/browser?url=' + url)
    website = true

    const windowOpts = {
      x: win.getBounds().x,
      y: win.getBounds().y,
    }

    const mediaFullscreen = mediaWin.isFullScreen()

    if (!mediaFullscreen) {
      windowOpts.width = mediaWin.getBounds().width
      windowOpts.height = mediaWin.getBounds().height
    }
    websiteControllerWinHandler = createWebsiteController(
      windowOpts,
      mediaFullscreen
    )
    websiteController = websiteControllerWinHandler.browserWindow
    websiteControllerWinHandler.loadPage('/browser?controller=true&url=' + url)

    websiteController.on('close', () => {
      win.webContents.send('showingMedia', [false, false])
      mediaWinHandler.loadPage('/media')
      // eslint-disable-next-line no-magic-numbers
      mediaWin.setMinimumSize(195, 110)
      website = false
    })
  })
  ipcMain.on('toggleSubtitles', (_e, enabled) => {
    mediaWin.webContents.send('toggleSubtitles', enabled)
  })
  ipcMain.on('videoScrub', (_e, timeAsPercent) => {
    mediaWin.webContents.send('videoScrub', timeAsPercent)
  })
  ipcMain.on('startMediaDisplay', (_e, prefs) => {
    mediaWin.webContents.send('startMediaDisplay', prefs)
  })
  ipcMain.on('zoom', (_e, deltaY) => {
    mediaWin.webContents.send('zoom', deltaY)
  })
  ipcMain.on('pan', (_e, cors) => {
    mediaWin.webContents.send('pan', cors)
  })

  // IpcMain events to control the windows
  ipcMain.on('allowQuit', (_e, val) => {
    allowClose = val
  })
  ipcMain.on('setMediaWindowPosition', (_e, mediaWinOptions) => {
    setMediaWindowPosition(win, mediaWin, mediaWinOptions)
  })
  ipcMain.on('toggleMediaWindowFocus', () => {
    fadeWindow(win, mediaWin)
  })
  ipcMain.on('closeMediaWindow', () => {
    closeMediaWindow()
  })
  ipcMain.on('showMediaWindow', (_e, mediaWinOptions) => {
    if (!mediaWin) {
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
          screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          ).bounds.x + STARTING_POSITION,
        y:
          screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          ).bounds.y + STARTING_POSITION,
      }

      mediaWinHandler = createMediaWindow(windowOptions)
      mediaWin = mediaWinHandler.browserWindow

      mediaWin
        .on('close', (e) => {
          if (!authorizedCloseMediaWin) e.preventDefault()
        })
        .on('will-resize', () => {
          // Not working on Linux
          mediaWin.webContents.send('windowResizing', mediaWin.getSize())
          win.webContents.send('resetZoom')
          mediaWin.webContents.send('resetZoom')
        })
        .on('resize', () => {
          if (platform() === 'linux') {
            win.webContents.send('resetZoom')
            mediaWin.webContents.send('resetZoom')
          }
        })
        .on('resized', () => {
          // Not working on Linux
          mediaWin.webContents.send('windowResized')
        })

      win.webContents.send('mediaWindowShown')
    } else {
      setMediaWindowPosition(win, mediaWin, mediaWinOptions)
    }
  })

  // Auto updater events
  autoUpdater.logger = console
  autoUpdater.autoDownload = false

  ipcMain.on('checkForUpdates', () => {
    autoUpdater.checkForUpdates()
  })

  autoUpdater.on('error', (e) => {
    win.webContents.send('notifyUser', [
      'updateError',
      { type: 'error', identifier: e.message },
      e,
    ])
  })
  autoUpdater.on('update-available', (info) => {
    if (platform() === 'darwin') {
      win.webContents.send('macUpdate')
    } else {
      win.webContents.send('notifyUser', [
        'updateDownloading',
        { identifier: 'v' + info.version },
      ])
      autoUpdater.downloadUpdate().catch((e) => {
        win.webContents.send('notifyUser', [
          'updateNotDownloaded',
          { type: 'warning' },
          e,
        ])
      })
    }
  })
  autoUpdater.on('update-downloaded', () => {
    updateDownloaded = true
    win.webContents.send('notifyUser', ['updateDownloaded'])
  })

  // When ready create main window
  app.whenReady().then(() => {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.jw.org/*'] },
      (details, resolve) => {
        let cookies =
          'cookieConsent-STRICTLY_NECESSARY=true; cookieConsent-FUNCTIONAL=true; cookieConsent-DIAGNOSTIC=false; cookieConsent-USAGE=false; ckLang=E;'
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
        details.responseHeaders['x-frame-options'] = 'ALLOWALL'
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
      win.webContents.send('displaysChanged')
    })
    screen.on('display-added', () => {
      win.webContents.send('displaysChanged')
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
