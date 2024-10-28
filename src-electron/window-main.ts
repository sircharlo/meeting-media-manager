import pkg from 'app/package.json';
import { app, type BrowserWindow } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'fs-extra';
import { join } from 'upath';

import { errorCatcher } from './utils';
import { closeAllWindows, createWindow, sendToWindow } from './window-base';
import { createMediaWindow } from './window-media';

export let mainWindow: BrowserWindow | null = null;
export let authorizedClose = false;

export function createMainWindow() {
  // If the window is already open, just focus it
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    return;
  }

  // Fix Window snapping issues in window state keeper
  fixWindowSnapping();

  // Create the browser window
  mainWindow = createWindow('main');

  mainWindow.webContents.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  );

  mainWindow.on('close', (e) => {
    if (authorizedClose) {
      closeAllWindows();
    } else {
      e.preventDefault();
      sendToWindow(mainWindow, 'attemptedClose');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMediaWindow();
}

export function toggleAuthorizedClose(authorized: boolean) {
  authorizedClose = authorized;
}

// See: https://github.com/sircharlo/mmm-refactor/discussions/2#discussioncomment-10870709
function fixWindowSnapping() {
  try {
    const windowStateFilePath = join(
      app.getPath('appData'),
      pkg.productName,
      'window-state.json',
    );

    if (existsSync(windowStateFilePath)) {
      const mainWindowState = JSON.parse(
        readFileSync(windowStateFilePath, 'utf8'),
      );

      const maximumThreshold = 30;
      const { displayBounds, height, width, x, y } = mainWindowState;
      const overflowX = x + width - displayBounds.width - displayBounds.x;
      const overflowY = y + height - displayBounds.height - displayBounds.y;

      if (0 < overflowX && overflowX < maximumThreshold)
        mainWindowState.width -= overflowX;
      if (0 < overflowY && overflowY < maximumThreshold)
        mainWindowState.height -= overflowY;

      if (x < displayBounds.x && x > displayBounds.x - maximumThreshold)
        mainWindowState.x = displayBounds.x;
      if (y < displayBounds.y && y > displayBounds.y - maximumThreshold)
        mainWindowState.y = displayBounds.y;

      writeFileSync(windowStateFilePath, JSON.stringify(mainWindowState));
    }
  } catch (error) {
    errorCatcher(error);
  }
}
