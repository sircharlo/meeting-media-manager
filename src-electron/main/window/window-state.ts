import {
  app,
  BrowserWindow,
  type BrowserWindowConstructorOptions,
  type Rectangle,
  screen,
} from 'electron';
import { ensureDirSync, readJsonSync, writeJsonSync } from 'fs-extra/esm';
import { dirname, join } from 'path';

import { captureElectronError } from './../utils';

interface ExtraOptions {
  /** The name of file. Defaults to `window-state.json`. */
  configFileName?: string;
  /** The path where the state file should be written to. Defaults to `app.getPath('userData')`. */
  configFilePath?: string;
  /** Should we automatically maximize the window, if it was last closed maximized. Defaults to `true`. */
  supportMaximize?: boolean;
}

interface State {
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

//const eventHandlingDelay = 100;

export class StatefulBrowserWindow {
  public win: BrowserWindow;

  private fullStoreFileName: string;

  /*private enterFullScreenHandler = () => {
    this.state.isFullScreen = true;
  };*/

  private state: State;

  /*private leaveFullScreenHandler = () => {
    this.state.isFullScreen = false;
  };*/

  constructor(options: BrowserWindowConstructorOptions & ExtraOptions) {
    const {
      configFileName = 'window-state.json',
      configFilePath = app.getPath('userData'),
      supportMaximize,
    } = options;

    const newOptions = refineOptionsAndState(options);

    this.win = new BrowserWindow(newOptions);

    const { height = 600, isMaximized, width = 800, x, y } = newOptions;

    try {
      this.win.setBounds({ height, width, x, y });
    } catch {
      // This fails when opening the website window for some reason
    }

    this.state = { height, isMaximized, width, x, y };

    this.fullStoreFileName = join(configFilePath, configFileName);

    this.manage(supportMaximize);
  }

  // Unregister listeners and save state
  private closedHandler = () => {
    this.unmanage();
    this.saveState();
  };

  private closeHandler = () => {
    this.updateState();
  };

  // Handles both 'resize' and 'move' events
  /*private stateChangeHandler = () => {
    clearTimeout(this.stateChangeTimer);
    this.stateChangeTimer = setTimeout(this.updateState, eventHandlingDelay);
  };

  private stateChangeTimer?: ReturnType<typeof setTimeout>;*/

  private manage = (supportMaximize?: boolean) => {
    if (supportMaximize && this.state.isMaximized) {
      this.win.maximize();
    }

    //this.win.on('resize', this.stateChangeHandler);
    //this.win.on('move', this.stateChangeHandler);
    this.win.on('close', this.closeHandler);
    this.win.on('closed', this.closedHandler);
    //this.win.on('enter-full-screen', this.enterFullScreenHandler);
    //this.win.on('leave-full-screen', this.leaveFullScreenHandler);
  };

  private saveState = () => {
    try {
      ensureDirSync(dirname(this.fullStoreFileName));
      writeJsonSync(this.fullStoreFileName, this.state);
    } catch (e) {
      captureElectronError(e);
    }
  };

  private unmanage = () => {
    //this.win.removeListener('resize', this.stateChangeHandler);
    //this.win.removeListener('move', this.stateChangeHandler);
    //clearTimeout(this.stateChangeTimer);
    this.win.removeListener('close', this.closeHandler);
    this.win.removeListener('closed', this.closedHandler);
    //this.win.removeListener('enter-full-screen', this.enterFullScreenHandler);
    //this.win.removeListener('leave-full-screen', this.leaveFullScreenHandler);
  };

  private updateState = () => {
    try {
      const winBounds = this.win.getBounds();
      if (this.win.isNormal()) {
        this.state.x = winBounds.x;
        this.state.y = winBounds.y;
        this.state.width = winBounds.width;
        this.state.height = winBounds.height;
      }

      this.state.isMaximized = this.win.isMaximized();

      const display = screen.getDisplayMatching(winBounds);
      this.state.displayBounds = display.bounds;
      this.state.displayScaleFactor = display.scaleFactor;
    } catch (e) {
      captureElectronError(e);
    }
  };
}

function ensureWindowVisibleOnSomeDisplay(state: State) {
  const visible = screen.getAllDisplays().some((display) => {
    return windowWithinBounds(state, display.bounds);
  });

  return visible ? state : null;
}

function getMaxBounds(bounds: State, boundsToCheck: Rectangle) {
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

function hasBounds(state: State) {
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
): BrowserWindowConstructorOptions & { isMaximized?: boolean } {
  const {
    configFileName = 'window-state.json',
    configFilePath = app.getPath('userData'),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supportMaximize,
    ...restOriginalOptions
  } = options;

  let savedState: null | State = null;

  try {
    savedState = readJsonSync(join(configFilePath, configFileName));
  } catch {
    // Don't care, use defaults
  }

  savedState = validateState(savedState);

  if (!savedState) return restOriginalOptions;

  const { height, isMaximized, width, x, y } = savedState;

  return { ...restOriginalOptions, height, isMaximized, width, x, y };
}

function validateState(state: null | State) {
  const isValid = state && (hasBounds(state) || state.isMaximized);
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

    state.width = ~~(maxBounds.width * scaleFactorRatio);
    state.height = ~~(maxBounds.height * scaleFactorRatio);
    state.x = ~~(maxBounds.x * scaleFactorRatio);
    state.y = ~~(maxBounds.y * scaleFactorRatio);

    return ensureWindowVisibleOnSomeDisplay(state);
  }

  return state;
}

function windowWithinBounds(state: State, bounds: Rectangle) {
  return (
    state.x !== undefined &&
    state.y !== undefined &&
    state.x >= bounds.x &&
    state.y >= bounds.y &&
    state.x + state.width <= bounds.x + bounds.width &&
    state.y + state.height <= bounds.y + bounds.height
  );
}
