import type { JwSiteParams, NavigateWebsiteAction } from 'src/types';

import { type BrowserWindow, systemPreferences, type Video } from 'electron';
import { captureElectronError } from 'main/utils';
import {
  createWindow,
  logToWindow,
  sendToWindow,
} from 'main/window/window-base';
import { mainWindow } from 'main/window/window-main';
import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';

export let websiteWindow: BrowserWindow | null = null;

/**
 * Creates the website window
 */
export async function createWebsiteWindow(websiteParams?: JwSiteParams) {
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
      height: HD_RESOLUTION[1],
      show: true,
      title: 'Website Stream',
      useContentSize: PLATFORM !== 'darwin',
      width: HD_RESOLUTION[0],
    },
    websiteParams,
  );

  websiteWindow.center();

  websiteWindow.webContents.on('did-finish-load', () => {
    try {
      websiteWindow?.webContents.insertCSS(
        `
        .cursor {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          left: -100px;
          top: 50%;
          background-color: transparent;
          z-index: 10000;
          border: 10px solid rgba(0, 123, 255, 0.8);
          height: 100px;
          width: 100px;
          box-sizing: border-box;
          transition: transform 0.2s ease-out, background-color 0.2s ease-out, border-color 0.2s ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .cursor-left {
          border-color: rgba(40, 167, 69, 0.8);
          background-color: rgba(40, 167, 69, 0.3);
        }
        .cursor-right {
          border-color: rgba(255, 165, 0, 0.8);
          background-color: rgba(255, 165, 0, 0.3);
        }
        .cursor-double {
          border-color: rgba(128, 0, 128, 0.8);
          background-color: rgba(128, 0, 128, 0.3);
        }
        .cursor-clicked {
          transform: scale(1.2);
        }
        .cursor-pulse {
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }`,
      );

      websiteWindow?.webContents.executeJavaScript(
        `
        const cursor = document.createElement('div');
        cursor.className = 'cursor cursor-pulse';
        document.body.appendChild(cursor);
        
        let clickTimeout;
        let lastClickTime = 0;
        
        const onMouseMove = (e) => {
          cursor.style.left = (e.clientX - 50) + 'px';
          cursor.style.top = (e.clientY - 50) + 'px';
        };
        
        const clearClick = () => {
          cursor.classList.remove('cursor-left', 'cursor-right', 'cursor-double', 'cursor-clicked');
          cursor.innerHTML = '';
          clearTimeout(clickTimeout);
        };
        
        const onMouseDown = (e) => {
          clearClick();
          cursor.classList.add('cursor-clicked');
          if (e.button === 0) {
            cursor.classList.add('cursor-left');
          } else if (e.button === 2) {
            cursor.classList.add('cursor-right');
          }
        };
        
        const onMouseUp = () => {
          clickTimeout = setTimeout(clearClick, 500);
        };
        
        const onDblClick = (e) => {
          clearClick();
          cursor.classList.add('cursor-clicked', 'cursor-double');
          clickTimeout = setTimeout(clearClick, 1000);
        };
        
        document.body.addEventListener('mousemove', onMouseMove, { passive: true });
        document.body.addEventListener('mousedown', onMouseDown, { passive: true });
        document.body.addEventListener('mouseup', onMouseUp, { passive: true });
        document.body.addEventListener('dblclick', onDblClick, { passive: true });
        document.body.addEventListener('contextmenu', (e) => e.preventDefault());`,
      );
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
    const websiteWindowSize = websiteWindow?.getSize();
    const websiteWindowContentSize = websiteWindow?.getContentSize();
    if (!websiteWindowSize || !websiteWindowContentSize) return;
    const websiteWindowHeight = websiteWindowSize[1] ?? 0;
    const websiteWindowContentHeight = websiteWindowContentSize[1] ?? 0;
    websiteWindow?.setAspectRatio(16 / 9, {
      height: websiteWindowHeight - websiteWindowContentHeight,
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
    websiteWindow?.webContents.setZoomFactor(1);
    sendToWindow(mainWindow, 'websiteWindowClosed');
  });
  websiteWindow.on('closed', () => {
    websiteWindow = null;
  });
}

/**
 * Asks for media access for the camera and microphone
 */
export const askForMediaAccess = async () => {
  if (PLATFORM !== 'darwin') return;
  const types = ['camera', 'microphone'] as const;

  for (const type of types) {
    try {
      const access = systemPreferences.getMediaAccessStatus(type);
      if (access !== 'granted') {
        logToWindow(mainWindow, `No ${type} access`, access, 'error');
        const result = await systemPreferences.askForMediaAccess(type);
        logToWindow(mainWindow, `${type} result:`, result, 'debug');
      }
    } catch (e) {
      captureElectronError(e, {
        contexts: { fn: { name: 'askForMediaAccess' } },
      });
    }
  }
};

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
    captureElectronError(e, {
      contexts: { fn: { name: 'zoomWebsiteWindow' } },
    });
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
  const sizeWidth = size[0] ?? 0;
  const sizeHeight = size[1] ?? 0;
  if (!sizeWidth || !sizeHeight) return;
  const contentSize = websiteWindow.getContentSize();
  const contentSizeWidth = contentSize[0] ?? 0;
  const contentSizeHeight = contentSize[1] ?? 0;
  if (!contentSizeWidth) return;
  const frameSize = [
    sizeWidth - contentSizeWidth,
    sizeHeight - contentSizeHeight,
  ];
  const frameSizeWidth = frameSize[0] ?? 0;
  const frameSizeHeight = frameSize[1] ?? 0;
  if (!frameSizeWidth || !frameSizeHeight) return;
  const aspectRatio = 16 / 9;
  const newAspectRatio =
    (contentSizeWidth + frameSizeWidth) /
    (contentSizeWidth / aspectRatio + frameSizeHeight);
  websiteWindow.setAspectRatio(newAspectRatio);
};
