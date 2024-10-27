import type { BrowserWindow } from 'electron';
import type { ElectronIpcListenKey } from 'src/types';

import path from 'path';

import { PLATFORM } from './constants';
import { createWindow } from './window-base';

export let mediaWindow: BrowserWindow | undefined;

export function createMediaWindow() {
  // If the window is already open, just focus it
  if (mediaWindow && !mediaWindow.isDestroyed()) {
    mediaWindow.show();
    return;
  }

  // Create the browser window
  mediaWindow = createWindow(
    'media',
    {
      backgroundColor: 'black',
      frame: false,
      icon: path.resolve(path.join('icons', 'media-player.png')),
      minHeight: 110,
      minWidth: 195,
      show: false,
      thickFrame: false,
      title: 'Media Window',
    },
    720,
    1280,
  );

  // Force aspect ratio
  mediaWindow.setAspectRatio(16 / 9);

  // Hide menu bar
  if (PLATFORM !== 'darwin') mediaWindow.setMenuBarVisibility(false);

  mediaWindow.on('closed', () => {
    mediaWindow = undefined;
  });
}

export function sendToMediaWindow(
  channel: ElectronIpcListenKey,
  ...args: unknown[]
) {
  mediaWindow?.webContents.send(channel, ...args);
}
