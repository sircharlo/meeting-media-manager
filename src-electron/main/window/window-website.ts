import type { BrowserWindow, Video } from 'electron';
import type { NavigateWebsiteAction } from 'src/types';

import { PLATFORM } from 'app/src-electron/constants';
import {
  askForMediaAccess,
  captureElectronError,
} from 'app/src-electron/utils';

import { createWindow, sendToWindow } from './window-base';
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

  askForMediaAccess();

  // Create the browser window
  websiteWindow = createWindow(
    'website',
    {
      alwaysOnTop: true,
      height: 720,
      show: true,
      title: 'Website Stream',
      useContentSize: PLATFORM !== 'darwin',
      width: 1280,
    },
    lang,
  );

  websiteWindow.center();

  websiteWindow.webContents.on('did-finish-load', () => {
    try {
      websiteWindow?.webContents.insertCSS(`
      .cursor {
        position: fixed;
        border-radius: 50%;
        transform: translateX(-50%) translateY(-50%);
        pointer-events: none;
        left: -100px;
        top: 50%;
        background-color: transparent;
        z-index: 10000;
        border: 5px solid rgba(255, 0, 0, 0.8);
        height: 50px;
        width: 50px;
        transition: transform 0.25s ease-out, background-color 0.25s ease-out;
      }
  
      .cursor-clicked {
        transform: translateX(-50%) translateY(-50%) scale(1.5);
        background-color: rgba(255, 0, 0, 0.8);
      }
    `);

      websiteWindow?.webContents.executeJavaScript(`
      const cursor = document.createElement('div');
      cursor.className = 'cursor';
      document.body.appendChild(cursor);
  
      const onMouseMove = (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      };
  
      const onMouseDown = () => {
        cursor.classList.add('cursor-clicked');
      };
  
      const onMouseUp = () => {
        setTimeout(() => {
          cursor.classList.remove('cursor-clicked');
        }, 250);
      };
      
      document.body.removeEventListener('mousemove', onMouseMove);
      document.body.addEventListener('mousemove', onMouseMove);
  
      document.body.removeEventListener('mousedown', onMouseDown);
      document.body.addEventListener('mousedown', onMouseDown);

      document.body.removeEventListener('mouseup', onMouseUp);
      document.body.addEventListener('mouseup', onMouseUp);
    `);
    } catch (e) {
      captureElectronError(e, {
        contexts: { fn: { name: 'createWebsiteWindow cursor indicator' } },
      });
    }
  });

  websiteWindow.webContents.setVisualZoomLevelLimits(1, 5);
  websiteWindow.webContents.on('zoom-changed', (_, direction) => {
    zoomWebsiteWindow(direction);
  });

  // Prevent popups from opening new windows
  websiteWindow.webContents.setWindowOpenHandler((details) => {
    websiteWindow?.loadURL(details.url);
    return { action: 'deny' };
  });

  if (PLATFORM === 'darwin') {
    websiteWindow.setAspectRatio(16 / 9, {
      height: websiteWindow.getSize()[1] - websiteWindow.getContentSize()[1],
      width: 0,
    });
  } else {
    setAspectRatio();
    websiteWindow.on('resize', setAspectRatio);
  }

  const video: Video = {
    id: websiteWindow.getMediaSourceId(),
    name: websiteWindow.getTitle(),
  };

  mainWindow?.webContents.session.setDisplayMediaRequestHandler(
    (_, callback) => {
      callback({ video });
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
  try {
    const currentZoom = websiteWindow.webContents.getZoomFactor();
    if (direction === 'in') {
      websiteWindow.webContents.setZoomFactor(Math.min(currentZoom + 0.2, 5));
    } else if (direction === 'out') {
      websiteWindow.webContents.zoomFactor = Math.max(0.1, currentZoom - 0.2);
    }
  } catch (e) {
    captureElectronError(e);
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
