import { platform } from 'os'
import {
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Display,
  Point,
  screen,
} from 'electron'
import BrowserWinHandler from './BrowserWinHandler'

const AR_WIDTH = 16
const AR_HEIGHT = 9

export function setContentAspectRatio(win: BrowserWindow | null) {
  if (!win) return
  const [windowWidth, windowHeight] = win.getSize()
  const [contentWidth, contentHeight] = win.getContentSize()
  const simulatedContentHeight = contentWidth * (AR_HEIGHT / AR_WIDTH)
  const aspectRatio =
    windowWidth / (windowHeight - contentHeight + simulatedContentHeight)
  win.setAspectRatio(aspectRatio)
}

// Create a generic Media Window
export function createMediaWindow(windowOpts: BrowserWindowConstructorOptions) {
  const winHandler = new BrowserWinHandler({
    title: 'Media Window',
    roundedCorners: windowOpts.fullscreen,
    backgroundColor: 'black',
    width: 1280,
    height: 720,
    minHeight: 110,
    minWidth: 195,
    frame: false,
    thickFrame: false,
    show: false,
    ...windowOpts,
  })

  const win = winHandler.browserWindow as BrowserWindow
  win.setAspectRatio(AR_WIDTH / AR_HEIGHT)
  if (platform() !== 'darwin') {
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setMenuBarVisibility(false)
  }

  winHandler.loadPage('/media')

  win.once('ready-to-show', () => {
    win.show()
  })

  return winHandler
}

// Create a website controller window
export function createWebsiteController(
  opts: BrowserWindowConstructorOptions,
  maximize = true
) {
  const winHandler = new BrowserWinHandler({
    title: 'Website Controller Window',
    minHeight: 110,
    minWidth: 195,
    width: 1280,
    height: 720,
    ...opts,
  })

  const win = winHandler.browserWindow as BrowserWindow
  win.on('ready-to-show', () => {
    if (platform() === 'linux') {
      win.setAspectRatio(AR_WIDTH / AR_HEIGHT)
    } else {
      setContentAspectRatio(win)
    }
  })

  if (maximize) win.maximize()
  return winHandler
}

interface Screen extends Display {
  humanFriendlyNumber: number
}

// Get screen information
export function getScreenInfo(
  win: BrowserWindow | null,
  mediaWin: BrowserWindow | null
) {
  let displays: Screen[] = []
  const winMidpoints: { main?: Point; media?: Point } = {}
  const winCoordinates: { main?: Point; media?: Point } = {}
  if (win) {
    try {
      let posSize = win.getPosition().concat(win.getSize())
      winMidpoints.main = {
        x: posSize[0] + posSize[2] / 2,
        y: posSize[1] + posSize[3] / 2,
      }
      if (mediaWin) {
        posSize = mediaWin.getPosition().concat(win.getSize())
        winMidpoints.media = {
          x: posSize[0] + posSize[2] / 2,
          y: posSize[1] + posSize[3] / 2,
        }
      }
      displays = screen.getAllDisplays().map((display, i) => {
        return {
          ...display,
          humanFriendlyNumber: i + 1,
        }
      })
    } catch (err) {
      win?.webContents.send('notifyUser', [
        'errorUnknown',
        { type: 'error' },
        err,
      ])
      console.error(err)
    }
  }
  return {
    displays,
    winMidpoints,
    winCoordinates,
    otherScreens: displays.filter(
      (display) =>
        display.id !==
        screen.getDisplayNearestPoint(winMidpoints.main as Point).id
    ),
  }
}

// Show/hide media window
export function fadeWindow(
  win: BrowserWindow | null,
  browserWindow: BrowserWindow | null
) {
  if (!browserWindow) return
  if (!browserWindow.isVisible()) {
    browserWindow.show()
    win?.webContents.send('mediaWindowVisibilityChanged', 'shown')
  } else {
    browserWindow.hide()
    win?.webContents.send('mediaWindowVisibilityChanged', 'hidden')
  }
}

// Set position of the media window
export function setMediaWindowPosition(
  win: BrowserWindow | null,
  mediaWin: BrowserWindow | null,
  mediaWinOptions: {
    destination: number
    type: 'window' | 'fullscreen'
  }
) {
  try {
    if (mediaWin) {
      const screenInfo = getScreenInfo(win, mediaWin)
      const STARTING_POSITION = 50
      mediaWin.setBounds({
        x:
          (screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          )?.bounds?.x ?? 0) + STARTING_POSITION,
        y:
          (screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          )?.bounds?.y ?? 0) + STARTING_POSITION,
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
    win?.webContents.send('notifyUser', [
      'errorUnknown',
      { type: 'error' },
      err,
    ])
    console.error(err)
  }
}
