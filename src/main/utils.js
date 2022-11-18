import { platform } from 'os'
import { screen } from 'electron'
import BrowserWinHandler from './BrowserWinHandler'

const AR_WIDTH = 16
const AR_HEIGHT = 9

// Create a generic Media Window
export function createMediaWindow(windowOpts) {
  const winHandler = new BrowserWinHandler({
    title: 'Media Window',
    // roundedCorners: false, disabled again until this issue is fixed: https://github.com/electron/electron/issues/36251
    backgroundColor: 'black',
    width: 1280,
    height: 720,
    minHeight: 110,
    minWidth: 195,
    frame: false,
    thinkFrame: false,
    show: false,
    ...windowOpts,
  })

  const win = winHandler.browserWindow
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
export function createWebsiteController(opts, maximize = true) {
  const winHandler = new BrowserWinHandler({
    title: 'Website Controller Window',
    minHeight: 720,
    minWidth: 1280,
    width: 1280,
    height: 720,
    ...opts,
  })

  const win = winHandler.browserWindow
  win.setAspectRatio(AR_WIDTH / AR_HEIGHT)
  if (maximize) win.maximize()
  return winHandler
}

// Get screen information
export function getScreenInfo(win, mediaWin) {
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

// Show/hide media window
export function fadeWindow(win, browserWindow) {
  if (!browserWindow.isVisible()) {
    browserWindow.show()
    win.webContents.send('mediaWindowVisibilityChanged', 'shown')
  } else {
    browserWindow.hide()
    win.webContents.send('mediaWindowVisibilityChanged', 'hidden')
  }
}

// Set position of the media window
export function setMediaWindowPosition(win, mediaWin, mediaWinOptions) {
  try {
    if (mediaWin) {
      const screenInfo = getScreenInfo(win, mediaWin)
      const STARTING_POSITION = 50
      mediaWin.setBounds({
        x:
          screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          ).bounds.x + STARTING_POSITION,
        y:
          screenInfo.displays.find(
            (display) => display.id === mediaWinOptions.destination
          ).bounds.y + STARTING_POSITION,
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
