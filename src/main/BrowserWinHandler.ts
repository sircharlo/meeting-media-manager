/* eslint-disable n/no-callback-literal */
import { EventEmitter } from 'events'
import { platform } from 'os'
import {
  BrowserWindow,
  app,
  shell,
  BrowserWindowConstructorOptions,
} from 'electron'
const DEV_SERVER_URL = process.env.DEV_SERVER_URL
const isDev = process.env.NODE_ENV === 'development'
const appLongName = 'Meeting Media Manager'

export default class BrowserWinHandler {
  _eventEmitter: EventEmitter
  allowRecreate: boolean
  options: BrowserWindowConstructorOptions
  browserWindow: BrowserWindow | null
  /**
   * @param [options] {object} - browser window options
   * @param [allowRecreate] {boolean}
   */
  constructor(options: BrowserWindowConstructorOptions, allowRecreate = true) {
    this._eventEmitter = new EventEmitter()
    this.allowRecreate = allowRecreate
    this.options = options
    this.browserWindow = null
    this._createInstance()
  }

  _createInstance() {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    if (app.isReady()) this._create()
    else {
      app.once('ready', () => {
        this._create()
      })
    }

    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!this.allowRecreate) return
    app.on('activate', () => this._recreate())
  }

  _create() {
    this.browserWindow = new BrowserWindow({
      ...this.options,
      webPreferences: {
        ...this.options.webPreferences,
        backgroundThrottling: false,
        webSecurity: false,
        // webSecurity: !isDev, // disable on dev to allow loading local resources
        nodeIntegration: true, // allow loading modules via the require () function
        nodeIntegrationInWorker: true,
        contextIsolation: false, // https://github.com/electron/electron/issues/18037#issuecomment-806320028
      },
    })

    this.browserWindow.setMenuBarVisibility(isDev)

    // open external urls in a browser and prevent default
    this.browserWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    if (platform() === 'win32')
      this.browserWindow.setAppDetails({
        appId: appLongName,
      })

    /* session.defaultSession.webRequest.onHeadersReceived(
      {
        urls: [
          'https://download-a.akamaihd.net/*',
          'https://webdav.4shared.com/*',
        ],
      },
      (details, resolve) => {
        resolve({
          responseHeaders: {
            ...details.responseHeaders,
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    ) */

    this.browserWindow.on('closed', () => {
      // Dereference the window object
      this.browserWindow = null
    })
    this._eventEmitter.emit('created')
  }

  _recreate() {
    if (this.browserWindow === null) this._create()
  }

  /**
   * @callback onReadyCallback
   * @param {BrowserWindow}
   */

  /**
   *
   * @param callback {onReadyCallback}
   */
  onCreated(callback: (win: BrowserWindow) => void) {
    if (this.browserWindow !== null) return callback(this.browserWindow)
    this._eventEmitter.once('created', () => {
      callback(this.browserWindow as BrowserWindow)
    })
  }

  async loadPage(pagePath: string) {
    if (!this.browserWindow)
      return Promise.reject(
        new Error("The page could not be loaded before win 'created' event")
      )
    const serverUrl = isDev ? DEV_SERVER_URL : 'app://./index.html'
    const fullPath = serverUrl + '#' + pagePath
    await this.browserWindow.loadURL(fullPath)
  }

  /**
   *
   * @returns {Promise<BrowserWindow>}
   */
  created() {
    return new Promise((resolve) => {
      this.onCreated(() => resolve(this.browserWindow))
    })
  }
}
