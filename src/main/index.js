/* eslint-disable import/named */
import {
  app,
  ipcMain,
  dialog,
  shell,
  screen,
  crashReporter,
  globalShortcut,
} from 'electron'
import Store from 'electron-store'
import { existsSync } from 'fs-extra'
import { join, normalize } from 'upath'
import { autoUpdater } from 'electron-updater'
import BrowserWinHandler from './BrowserWinHandler'
const os = require('os')
const adapter = require('axios/lib/adapters/http')
const axios = require('axios')

crashReporter.start({
  uploadToServer: false,
})

// Initialize the store
Store.initRenderer()

// Disable hardware acceleration if the user turned it off
try {
  if (existsSync(join(app.getPath('userData'), 'disableHardwareAcceleration')))
    app.disableHardwareAcceleration()
} catch (err) {
  console.error(err)
}

let win = null
let winHandler = null
let mediaWin = null
let mediaWinHandler = null
let closeAttempts = 0
let allowClose = true
let authorizedCloseMediaWin = false
const appLongName = 'Meeting Media Manager'

let iconType = 'png'
if (os.platform() === 'darwin') iconType = 'icns'
if (os.platform() === 'win32') iconType = 'ico'

function createMainWindow() {
  winHandler = new BrowserWinHandler({
    height: 700,
    width: 700,
    minWidth: 670,
    minHeight: 410,
    icon: join(__dirname, '../../build', 'icons', `icon.${iconType}`),
    title: appLongName,
  })

  win = winHandler.browserWindow

  win.on('will-move', () => {
    if (mediaWin) {
      const screenInfo = getScreenInfo()
      if (screenInfo.otherScreens.length > 0) {
        if (screenInfo.winMidpoints) {
          const mainWinSameAsMedia = Object.entries(screenInfo.winMidpoints)
            .map((item) => screen.getDisplayNearestPoint(item[1]))
            .every((val, _i, arr) => val.id === arr[0].id)
          if (mainWinSameAsMedia)
            win.webContents.send('moveMediaWindowToOtherScreen')
        }
      }
    }
  })

  win.on('close', (e) => {
    if (!allowClose && closeAttempts < 2) {
      e.preventDefault()
      win.webContents.send('notifyUser', [
        'cantCloseMediaWindowOpen',
        { type: 'warning' },
      ])
      closeAttempts++
      setTimeout(() => {
        closeAttempts--
      }, 10000)
    } else if (mediaWin) {
      mediaWin.destroy()
    }
  })

  winHandler.loadPage('/')
}

function fadeWindow(browserWindow) {
  if (!browserWindow.isVisible()) {
    browserWindow.show()
    win.webContents.send('mediaWindowVisibilityChanged', 'shown')
  } else {
    browserWindow.hide()
    win.webContents.send('mediaWindowVisibilityChanged', 'hidden')
  }
}

// Get screen information
function getScreenInfo() {
  let displays = []
  const winMidpoints = {}
  const winCoordinates = {}
  try {
    winCoordinates.main = win.getPosition().concat(win.getSize())
    winMidpoints.main = {
      x: winCoordinates.main[0] + winCoordinates.main[2] / 2,
      y: winCoordinates.main[1] + winCoordinates.main[3] / 2,
    }
    if (mediaWin) {
      winCoordinates.media = mediaWin.getPosition().concat(win.getSize())
      winMidpoints.media = {
        x: winCoordinates.media[0] + winCoordinates.media[2] / 2,
        y: winCoordinates.media[1] + winCoordinates.media[3] / 2,
      }
    }
    displays = screen.getAllDisplays().map((display, i) => {
      display.humanFriendlyNumber = i + 1
      return display
    })
  } catch (err) {
    console.error(err)
  }
  return {
    displays,
    winMidpoints,
    otherScreens: displays.filter(
      (display) =>
        display.id !== screen.getDisplayNearestPoint(winMidpoints.main).id
    ),
  }
}

function setMediaWindowPosition(mediaWinOptions) {
  try {
    if (mediaWin) {
      const screenInfo = getScreenInfo()
      mediaWin.setBounds({
        x:
          screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          ).bounds.x + 50,
        y:
          screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          ).bounds.y + 50,
        ...(mediaWinOptions.type === 'window' && { width: 1280 }),
        ...(mediaWinOptions.type === 'window' && { height: 720 }),
      })
      if (
        mediaWinOptions.type === 'fullscreen' &&
        screenInfo.otherScreens.length > 0 &&
        !mediaWin.isFullScreen()
      ) {
        mediaWin.setFullScreen(true)
      } else if (mediaWinOptions.type === 'window' && mediaWin.isFullScreen()) {
        mediaWin.setFullScreen(false)
      }
    }
  } catch (err) {
    console.error(err)
  }
}

function closeMediaWindow() {
  if (mediaWin) {
    authorizedCloseMediaWin = true
    mediaWin.close()
    mediaWin = null
    authorizedCloseMediaWin = false
  }
}

const gotTheLock = app.requestSingleInstanceLock()
if (gotTheLock) {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  // ipcMain event for general purposes
  ipcMain.handle('userData', () => normalize(app.getPath('userData')))
  ipcMain.handle('mediaWinOpen', () => !!mediaWin)
  ipcMain.handle('appData', () => normalize(app.getPath('appData')))
  ipcMain.handle('downloads', () => normalize(app.getPath('downloads')))
  ipcMain.handle('appVersion', () => app.getVersion())
  ipcMain.handle('getScreenInfo', () => getScreenInfo())

  ipcMain.on('runAtBoot', (_e, val) => {
    app.setLoginItemSettings({ openAtLogin: val })
  })

  ipcMain.on('openPath', (_e, path) => {
    shell.openPath(path)
  })
  ipcMain.handle('openDialog', async (_e, options) => {
    return await dialog.showOpenDialog(options)
  })

  ipcMain.on('restart', () => {
    app.relaunch()
    app.quit()
  })

  ipcMain.handle('registerShortcut', (_e, { shortcut, fn }) => {
    const functions = {
      toggleMediaWindow: () => {
        fadeWindow(mediaWin)
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
    return globalShortcut.register(shortcut, functions[fn])
  })
  ipcMain.on('unregisterShortcut', (_e, shortcut) => {
    globalShortcut.unregister(shortcut)
  })

  ipcMain.handle('getFromJWOrg', async (_e, opt) => {
    const options = {
      adapter,
      headers: {},
      params: {},
    }
    if (opt.headers) options.headers = opt.headers
    if (opt.params) options.params = opt.params
    try {
      const result = await axios.get(opt.url, options)
      return result.data
    } catch (e) {
      return e
    }
  })

  // ipcMain events for the presentation window
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

  // ipcMain events for the media window
  ipcMain.on('showMedia', (_e, media) => {
    mediaWin.webContents.send('showMedia', media)
    win.webContents.send('showingMedia', !!media)
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
  ipcMain.on('videoScrub', (_e, timeAsPercent) => {
    mediaWin.webContents.send('videoScrub', timeAsPercent)
  })
  ipcMain.on('startMediaDisplay', (_e, prefs) => {
    mediaWin.webContents.send('startMediaDisplay', prefs)
  })

  // ipcMain events to control the windows
  ipcMain.on('allowQuit', (_e, val) => {
    allowClose = val
  })
  ipcMain.on('setMediaWindowPosition', (_e, mediaWinOptions) => {
    setMediaWindowPosition(mediaWinOptions)
  })
  ipcMain.on('toggleMediaWindowFocus', () => {
    fadeWindow(mediaWin)
  })
  ipcMain.on('closeMediaWindow', () => {
    closeMediaWindow()
  })
  ipcMain.on('showMediaWindow', (_e, mediaWinOptions) => {
    if (!mediaWin) {
      const screenInfo = getScreenInfo()
      const windowOptions = {
        title: 'Media Window',
        icon: join(
          __dirname,
          '../../build',
          'icons',
          'videoPlayer',
          `videoPlayer.${iconType}`
        ),
        frame: false,
        backgroundColor: 'black',
        // roundedCorners: false, // waiting for https://github.com/electron/electron/issues/35403 to be fixed before enabling this
        minHeight: 110,
        width: 1280,
        height: 720,
        show: false,
        thickFrame: false,
        x:
          screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          ).bounds.x + 50,
        y:
          screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          ).bounds.y + 50,
      }
      if (mediaWinOptions.type === 'fullscreen') windowOptions.fullscreen = true
      mediaWinHandler = new BrowserWinHandler(windowOptions)
      mediaWin = mediaWinHandler.browserWindow
      if (os.platform() !== 'darwin') {
        mediaWin.setAlwaysOnTop(true, 'screen-saver')
        mediaWin.setMenuBarVisibility(false)
      }
      mediaWin.setAspectRatio(16 / 9)
      mediaWinHandler.loadPage('/media')
      mediaWin
        .on('close', (e) => {
          if (!authorizedCloseMediaWin) e.preventDefault()
        })
        .on('will-resize', () => {
          mediaWin.webContents.send('windowResizing', mediaWin.getSize())
        })
        .on('resized', () => {
          mediaWin.webContents.send('windowResized')
        })
        .once('ready-to-show', () => {
          mediaWin.show()
        })
      win.webContents.send('mediaWindowShown')
    } else {
      setMediaWindowPosition(mediaWinOptions)
    }
  })

  // Auto updater events
  ipcMain.on('checkForUpdates', () => {
    autoUpdater.checkForUpdates()
  })

  autoUpdater.on('error', (e) => {
    win.webContents.send('error', e)
    win.webContents.send('notifyUser', [
      'updateNotDownloaded',
      { type: 'warning' },
      e,
    ])
  })
  autoUpdater.on('update-available', (info) => {
    if (os.platform() === 'darwin') {
      win.webContents.send('macUpdate')
    } else {
      win.webContents.send('notifyUser', [
        'updateDownloading',
        { identifier: 'v' + info.version },
      ])
      autoUpdater.downloadUpdate()
    }
  })
  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('notifyUser', ['updateDownloaded'])
  })
  autoUpdater.logger = console
  autoUpdater.autoDownload = false

  // When ready create main window
  app.whenReady().then(() => {
    screen.on('display-removed', () => {
      win.webContents.send('displaysChanged')
    })
    screen.on('display-added', () => {
      win.webContents.send('displaysChanged')
    })
    createMainWindow()
  })

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    app.exit()
  })
} else {
  app.quit()
}

/*
app.on(
  'certificate-error',
  (event, _webContents, url, _error, _cert, callback) => {
    // Do some verification based on the URL to not allow potentially malicious certs:
    if (url.startsWith('https://localhost')) {
      // Hint: For more security, you may actually perform some checks against
      // the passed certificate (parameter "cert") right here

      event.preventDefault() // Stop Chromium from rejecting the certificate
      callback(true) // Trust this certificate
    } else callback(false) // Let Chromium do its thing
  }
)
*/
