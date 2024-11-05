import type { NavigateWebsiteAction } from 'src/types';

import { captureMessage } from '@sentry/browser';
import { PLATFORM } from 'app/src-electron/constants';
import { errorCatcher } from 'app/src-electron/utils';
import { type BrowserWindow, systemPreferences, type Video } from 'electron';

import { createWindow, logToWindow, sendToWindow } from './window-base';
import { mainWindow } from './window-main';

export let websiteWindow: BrowserWindow | null = null;

/**
 * Creates the website window
 */
export async function createWebsiteWindow(lang?: string) {
  // If the window is already open, just focus it
  if (websiteWindow && !websiteWindow.isDestroyed()) {
    websiteWindow.show();
    return;
  }

  if (PLATFORM === 'darwin') {
    try {
      const cameraAccess = systemPreferences.getMediaAccessStatus('camera');
      captureMessage(`Camera access: ${cameraAccess}`);
      if (cameraAccess !== 'granted') {
        logToWindow(mainWindow, 'No camera access', cameraAccess, 'error');
        if (PLATFORM === 'darwin') {
          const cameraResult =
            await systemPreferences.askForMediaAccess('camera');
          captureMessage(`Camera result: ${cameraResult}`);
        }
      }

      const micAccess = systemPreferences.getMediaAccessStatus('microphone');
      captureMessage(`Mic access: ${micAccess}`);
      if (micAccess !== 'granted') {
        logToWindow(mainWindow, 'No microphone access', micAccess, 'error');
        if (PLATFORM === 'darwin') {
          const micResult =
            await systemPreferences.askForMediaAccess('microphone');
          captureMessage(`Mic result: ${micResult}`);
        }
      }
    } catch (e) {
      errorCatcher(e);
    }
  }

  // Create the browser window
  websiteWindow = createWindow(
    'website',
    {
      alwaysOnTop: true,
      height: 720,
      show: true,
      title: 'Website Stream',
      useContentSize: true,
      width: 1280,
    },
    lang,
  );

  websiteWindow.webContents.setVisualZoomLevelLimits(1, 5);
  websiteWindow.webContents.on('zoom-changed', (_, direction) => {
    zoomWebsiteWindow(direction);
  });

  // Prevent popups from opening new windows
  websiteWindow.webContents.setWindowOpenHandler((details) => {
    websiteWindow?.loadURL(details.url);
    return { action: 'deny' };
  });

  setAspectRatio();
  websiteWindow.on('resize', setAspectRatio);

  const video: Video = {
    id: websiteWindow.getMediaSourceId(),
    name: websiteWindow.getTitle(),
  };

  mainWindow?.webContents.session.setDisplayMediaRequestHandler(
    (_, callback) => {
      callback({ audio: 'loopback', video });
    },
  );

  websiteWindow.on('close', () => {
    sendToWindow(mainWindow, 'websiteWindowClosed');
  });
  websiteWindow.on('closed', () => {
    websiteWindow = null;
  });
}

export const zoomWebsiteWindow = (direction: 'in' | 'out') => {
  if (!websiteWindow) return;
  const currentZoom = websiteWindow.webContents.getZoomFactor();
  if (direction === 'in') {
    websiteWindow.webContents.setZoomFactor(currentZoom + 0.2);
  } else if (direction === 'out') {
    websiteWindow.webContents.zoomFactor = currentZoom - 0.2;
  }
};

export const navigateWebsiteWindow = (action: NavigateWebsiteAction) => {
  if (!websiteWindow) return;
  if (action === 'back') {
    websiteWindow.webContents.navigationHistory.goBack();
  } else if (action === 'forward') {
    websiteWindow.webContents.navigationHistory.goForward();
  } else if (action === 'refresh') {
    websiteWindow.webContents.reload();
  }
};

const setAspectRatio = () => {
  if (!websiteWindow) return;

  // Compute the new aspect ratio that, when the frame is removed, results in a 16:9 aspect ratio for the content
  const size = websiteWindow.getSize();
  const contentSize = websiteWindow.getContentSize();
  const frameSize = [size[0] - contentSize[0], size[1] - contentSize[1]];
  const aspectRatio = 16 / 9;
  const newAspectRatio =
    (contentSize[0] + frameSize[0]) /
    (contentSize[0] / aspectRatio + frameSize[1]);
  websiteWindow.setAspectRatio(newAspectRatio);
};
