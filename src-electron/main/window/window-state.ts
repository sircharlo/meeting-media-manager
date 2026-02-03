import { PLATFORM } from 'app/src-electron/constants';
import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type Rectangle,
  screen,
} from 'electron';
import { ensureDirSync, readJsonSync, writeJsonSync } from 'fs-extra/esm';
import { debounce } from 'quasar';
import { captureElectronError } from 'src-electron/main/utils';
import upath from 'upath';

const { dirname, join } = upath;

export interface WindowState {
  displayBounds?: Rectangle;
  displayScaleFactor?: number;
  /** The saved height of loaded state. `defaultHeight` if the state has not been saved yet. */
  height: number;
  /** `true` if the window state was saved while the window was fullscreen. `undefined` if the state has not been saved yet. */
  isFullScreen?: boolean;
  /** `true` if the window state was saved while the window was maximized. `undefined` if the state has not been saved yet. */
  isMaximized?: boolean;
  /** The saved width of loaded state. `defaultWidth` if the state has not been saved yet. */
  width: number;
  /** The saved x coordinate of the loaded state. `undefined` if the state has not been saved yet. */
  x?: number;
  /** The saved y coordinate of the loaded state. `undefined` if the state has not been saved yet. */
  y?: number;
}

interface ExtraOptions {
  /** The name of file. Defaults to `window-state.json`. */
  configFileName?: string;
  /** The path where the state file should be written to. Defaults to `app.getPath('userData')`. */
  configFilePath?: string;
}

export class StatefulBrowserWindow {
  public win: BrowserWindow;

  private readonly fullStoreFileName: string;

  private readonly saveState = () => {
    try {
      ensureDirSync(dirname(this.fullStoreFileName));
      writeJsonSync(this.fullStoreFileName, this.state, { spaces: 2 });
    } catch (e) {
      captureElectronError(e, {
        contexts: { fn: { name: 'StatefulBrowserWindow.saveState' } },
      });
    }
  };

  private readonly updateState = () => {
    try {
      const winBounds = this.win.getBounds();

      // Save the window bounds if the window is not minimized
      if (!this.win.isMinimized()) {
        this.state.x = winBounds.x;
        this.state.y = winBounds.y;
        this.state.width = winBounds.width;
        this.state.height = winBounds.height;
      }

      // Save the maximized state if the window is maximized or in full screen
      this.state.isMaximized = this.win.isMaximized();
      this.state.isFullScreen = this.isEffectivelyFullScreen(
        this.win.isFullScreen(),
        winBounds,
        screen.getDisplayMatching(winBounds).bounds,
      );

      const display = screen.getDisplayMatching(winBounds);
      this.state.displayBounds = display.bounds;
      this.state.displayScaleFactor = display.scaleFactor;
    } catch (e) {
      captureElectronError(e, {
        contexts: { fn: { name: 'StatefulBrowserWindow.updateState' } },
      });
    }
  };

  // Save state after a period of 500ms of no changes
  private readonly saveStateDebounced = debounce(() => {
    this.updateState();
    this.saveState();
  }, 500);

  private readonly state: WindowState;

  constructor(options: BrowserWindowConstructorOptions & ExtraOptions) {
    const {
      configFileName = 'window-state.json',
      configFilePath = app.getPath('userData'),
    } = options;

    const newOptions = refineOptionsAndState(options);

    this.win = new BrowserWindow(newOptions);

    const {
      height = 600,
      isFullScreen,
      isMaximized,
      width = 800,
      x,
      y,
    } = newOptions;

    try {
      this.win.setBounds({ height, width, x, y });
    } catch {
      // This fails when opening the website window for some reason
    }

    this.state = { height, isFullScreen, isMaximized, width, x, y };

    this.fullStoreFileName = join(configFilePath, configFileName);

    this.manage();
  }

  isEffectivelyFullScreen = (
    windowIsFullScreen: boolean,
    windowBounds: Rectangle,
    screenBounds: Rectangle,
  ) => {
    const isEffectivelyFullscreen =
      screenBounds &&
      windowBounds.width >= screenBounds.width - 10 &&
      windowBounds.height >= screenBounds.height - 10;
    return windowIsFullScreen || isEffectivelyFullscreen;
  };

  // Unregister listeners and save state
  private readonly closedHandler = () => {
    this.unmanage();
    this.saveState();
  };

  private readonly closeHandler = () => {
    this.updateState();
  };

  private readonly manage = () => {
    if (this.state.isMaximized) {
      this.win.maximize();
    }

    if (this.state.isFullScreen) {
      this.win.setFullScreen(true);
    }

    this.win.on('resize', this.saveStateDebounced);
    this.win.on('move', this.saveStateDebounced);
    if (PLATFORM !== 'darwin') this.win.on('moved', this.saveStateDebounced); // On macOS, the 'moved' event is just an alias for 'move'

    this.win.on('close', this.closeHandler);
    this.win.on('closed', this.closedHandler);
  };
  private readonly unmanage = () => {
    this.win.removeListener('close', this.closeHandler);
    this.win.removeListener('closed', this.closedHandler);
  };
}

function ensureWindowVisibleOnSomeDisplay(state: WindowState) {
  const visible = screen.getAllDisplays().some((display) => {
    return windowWithinBounds(state, display.bounds);
  });

  return visible ? state : null;
}

function getMaxBounds(bounds: WindowState, boundsToCheck: Rectangle) {
  if (!bounds.x) bounds.x = 0;
  if (!bounds.y) bounds.y = 0;

  // If x or y are out of bounds because of window snapping, move them back
  const x = Math.max(bounds.x, boundsToCheck.x);
  const y = Math.max(bounds.y, boundsToCheck.y);

  // If the window overflows to the right or bottom, resize it
  const right = Math.min(
    bounds.x + bounds.width,
    boundsToCheck.x + boundsToCheck.width,
  );
  const bottom = Math.min(
    bounds.y + bounds.height,
    boundsToCheck.y + boundsToCheck.height,
  );

  return {
    height: Math.max(0, bottom - y),
    width: Math.max(0, right - x),
    x,
    y,
  };
}

function hasBounds(state: WindowState) {
  return (
    state &&
    Number.isInteger(state.x) &&
    Number.isInteger(state.y) &&
    Number.isInteger(state.width) &&
    state.width > 0 &&
    Number.isInteger(state.height) &&
    state.height > 0
  );
}

function refineOptionsAndState(
  options: BrowserWindowConstructorOptions & ExtraOptions,
): BrowserWindowConstructorOptions & {
  isFullScreen?: boolean;
  isMaximized?: boolean;
} {
  const {
    configFileName = 'window-state.json',
    configFilePath = app.getPath('userData'),
    ...restOriginalOptions
  } = options;

  let savedState: null | WindowState = null;

  try {
    savedState = readJsonSync(join(configFilePath, configFileName));
  } catch {
    // Don't care, use defaults
  }

  savedState = validateState(savedState);

  if (!savedState) return restOriginalOptions;

  const { height, isFullScreen, isMaximized, width, x, y } = savedState;

  return {
    ...restOriginalOptions,
    height,
    isFullScreen,
    isMaximized,
    width,
    x,
    y,
  };
}

function validateState(state: null | WindowState) {
  const isValid =
    state && (hasBounds(state) || state.isMaximized || state.isFullScreen);
  if (!isValid) return null;

  if (hasBounds(state) && state.displayBounds) {
    // for multi monitor support and scaling (devicePixelRatio)
    const display = screen.getDisplayMatching({
      height: state.displayBounds?.height || 0,
      width: state.displayBounds?.width || 0,
      x: state.x || 0,
      y: state.y || 0,
    });

    const scaleFactorRatio = state.displayScaleFactor
      ? state.displayScaleFactor / display.scaleFactor
      : 1;

    const maxBounds = getMaxBounds(state, display.bounds);

    state.width = Math.trunc(maxBounds.width * scaleFactorRatio);
    state.height = Math.trunc(maxBounds.height * scaleFactorRatio);
    state.x = Math.trunc(maxBounds.x * scaleFactorRatio);
    state.y = Math.trunc(maxBounds.y * scaleFactorRatio);

    return ensureWindowVisibleOnSomeDisplay(state);
  }

  return state;
}

function windowWithinBounds(state: WindowState, bounds: Rectangle) {
  if (
    state?.x === undefined ||
    state?.y === undefined ||
    state?.width === undefined ||
    state?.height === undefined
  ) {
    captureElectronError(new Error('Invalid window state'), {
      contexts: { fn: { bounds, name: 'windowWithinBounds', state } },
    });
    return false;
  }

  const notFullyRightOfBounds = state.x < bounds.x + bounds.width;
  const notFullyLeftOfBounds = state.x + state.width > bounds.x;
  const notFullyBelowBounds = state.y < bounds.y + bounds.height;
  const notFullyAboveBounds = state.y + state.height > bounds.y;

  if (
    notFullyRightOfBounds &&
    notFullyLeftOfBounds &&
    notFullyBelowBounds &&
    notFullyAboveBounds
  ) {
    console.log('Window is visible on the display');
    return true;
  } else {
    console.log('Window is not visible on the display');
    captureElectronError(new Error('Window is not visible on the display'), {
      contexts: {
        fn: {
          bounds,
          name: 'windowWithinBounds',
          notFullyAboveBounds,
          notFullyBelowBounds,
          notFullyLeftOfBounds,
          notFullyRightOfBounds,
          state,
        },
      },
    });
    return false;
  }
}
