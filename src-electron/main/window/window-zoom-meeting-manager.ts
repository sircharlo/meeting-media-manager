import type { BrowserWindow, Video } from 'electron';
import type { ZoomMeetingManagerParams } from 'src/types';

import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';
import {
  createWindow,
  logToWindow,
  sendToWindow,
} from 'src-electron/main/window/window-base';
import { mainWindowInfo } from 'src-electron/main/window/window-main';
import { mediaWindowInfo } from 'src-electron/main/window/window-media';
import { askForMediaAccess } from 'src-electron/main/window/window-website';

export const zoomMeetingManagerWindowInfo = {
  zoomMeetingManagerWindow: null as BrowserWindow | null,
};

const zoomDebugLog = (
  msg: string,
  ctx: Record<string, unknown> = {},
  level: 'debug' | 'error' | 'info' | 'warn' = 'info',
) => {
  logToWindow(
    mainWindowInfo.mainWindow,
    `[Zoom Meeting Manager] ${msg}`,
    ctx,
    level,
  );
};

const buildMeetingUrl = (meetingId: string) =>
  `https://app.zoom.us/wc/${meetingId}/start?ref_from=launch&fromPWA=1`;

const injectZoomLoginAutomation = async (
  win: BrowserWindow,
  params: ZoomMeetingManagerParams,
) => {
  if (!params.username || !params.password) {
    zoomDebugLog(
      'Skipping auto-login injection (missing username or password)',
      {
        hasPassword: !!params.password,
        hasUsername: !!params.username,
      },
    );
    return;
  }

  await win.webContents.executeJavaScript(
    `(() => {
      if (!window.location.hostname.endsWith('zoom.us')) return;
      if (window.__mmmZoomLoginRunning) return;
      window.__mmmZoomLoginRunning = true;

      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const setInputValue = (input, value) => {
        if (!input || !value) return;
        const prototype = Object.getPrototypeOf(input);
        const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (setter) {
          setter.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const clickPrimaryButton = () => {
        const button = document.querySelector('#signin_btn_next') ||
          document.querySelector('button.zm-button--primary') ||
          document.querySelector('button[type="submit"]');
        if (button instanceof HTMLButtonElement && !button.disabled) {
          button.click();
          return true;
        }
        return false;
      };

      const username = ${JSON.stringify(params.username)};
      const password = ${JSON.stringify(params.password)};

      (async () => {
        for (let i = 0; i < 60; i += 1) {
          const emailInput = document.querySelector('#email') ||
            document.querySelector('input[name="account"]');
          if (emailInput instanceof HTMLInputElement) {
            setInputValue(emailInput, username);
            emailInput.focus();
            clickPrimaryButton();
            break;
          }
          await sleep(250);
        }

        for (let i = 0; i < 60; i += 1) {
          const passwordInput = document.querySelector('#password') ||
            document.querySelector('input[name="new-password"]') ||
            document.querySelector('input[type="password"]');
          if (passwordInput instanceof HTMLInputElement) {
            setInputValue(passwordInput, password);
            passwordInput.focus();
            clickPrimaryButton();
            break;
          }
          await sleep(250);
        }
      })();
    })();`,
    true,
  );
};

export const createZoomMeetingManagerWindow = (
  params: ZoomMeetingManagerParams,
) => {
  if (!params.meetingId) return;

  zoomDebugLog('Requested window open', {
    hasPassword: !!params.password,
    hasUsername: !!params.username,
    meetingId: params.meetingId,
  });

  if (
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow &&
    !zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.isDestroyed()
  ) {
    zoomDebugLog('Reusing existing Zoom Meeting Manager window');
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.show();
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.loadURL(
      buildMeetingUrl(params.meetingId),
    );
    return;
  }

  askForMediaAccess();
  zoomDebugLog('Requested microphone/camera permissions check');

  zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow = createWindow(
    'zoomMeetingManager',
    {
      alwaysOnTop: false,
      height: HD_RESOLUTION[1],
      show: true,
      title: 'Zoom Meeting Manager',
      useContentSize: PLATFORM !== 'darwin',
      webPreferences: {
        partition: 'persist:zoom-meeting-manager',
      },
      width: HD_RESOLUTION[0],
    },
  );

  const win = zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow;
  zoomDebugLog('Window created', { partition: 'persist:zoom-meeting-manager' });
  const zoomSession = win.webContents.session;

  const allowedPermissions = new Set([
    'camera',
    'display-capture',
    'media',
    'microphone',
  ]);

  zoomSession.setPermissionCheckHandler((webContents, permission) => {
    if (!webContents || webContents.id !== win.webContents.id) return false;
    const allowed = allowedPermissions.has(permission as string);
    zoomDebugLog(
      'Permission check',
      { allowed, permission },
      allowed ? 'debug' : 'warn',
    );
    return allowed;
  });

  zoomSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      if (webContents.id !== win.webContents.id) {
        callback(false);
        return;
      }

      const allowed = allowedPermissions.has(permission as string);
      zoomDebugLog(
        'Permission request',
        { allowed, permission },
        allowed ? 'info' : 'warn',
      );
      callback(allowed);
    },
  );

  zoomSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      zoomDebugLog('Display media request received', {
        frameUrl: request.frame?.url || null,
        securityOrigin: request.securityOrigin || null,
      });

      const mediaWindow = mediaWindowInfo.mediaWindow;
      if (!mediaWindow || mediaWindow.isDestroyed()) {
        zoomDebugLog(
          'No share source content: media window not available',
          {},
          'error',
        );
        callback({});
        return;
      }

      const video: Video = {
        id: mediaWindow.getMediaSourceId(),
        name: mediaWindow.getTitle(),
      };

      zoomDebugLog('Providing media window as display capture source', {
        mediaSourceId: video.id || null,
        mediaWindowTitle: video.name || null,
      });
      callback({
        audio: 'loopback',
        video,
      });
    },
    { useSystemPicker: false },
  );

  const meetingUrl = buildMeetingUrl(params.meetingId);
  zoomDebugLog('Loading meeting URL', { meetingUrl });
  win.loadURL(meetingUrl);

  win.webContents.on('did-finish-load', () => {
    zoomDebugLog('did-finish-load', { url: win.webContents.getURL() }, 'debug');
    injectZoomLoginAutomation(win, params).catch((error) => {
      zoomDebugLog(
        'Auto-login injection failed on did-finish-load',
        {
          error: String(error),
        },
        'error',
      );
    });
  });

  win.webContents.on('did-navigate-in-page', (_event, url) => {
    zoomDebugLog('did-navigate-in-page', { url }, 'debug');
    injectZoomLoginAutomation(win, params).catch((error) => {
      zoomDebugLog(
        'Auto-login injection failed on did-navigate-in-page',
        {
          error: String(error),
        },
        'error',
      );
    });
  });

  win.webContents.on('did-navigate', (_event, url) => {
    zoomDebugLog('did-navigate', { url }, 'debug');
    injectZoomLoginAutomation(win, params).catch((error) => {
      zoomDebugLog(
        'Auto-login injection failed on did-navigate',
        {
          error: String(error),
        },
        'error',
      );
    });
  });

  win.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      zoomDebugLog(
        'did-fail-load',
        {
          errorCode,
          errorDescription,
          isMainFrame,
          validatedURL,
        },
        isMainFrame ? 'error' : 'warn',
      );
    },
  );

  win.webContents.on(
    'console-message',
    (_event, level, message, line, sourceId) => {
      zoomDebugLog(
        'renderer console',
        { level, line, message, sourceId },
        'debug',
      );
    },
  );

  win.webContents.setWindowOpenHandler((details) => {
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow?.loadURL(details.url);
    return { action: 'deny' };
  });

  win.on('close', () => {
    zoomDebugLog('Window close requested');
    sendToWindow(win, 'zoomMeetingManagerWindowClosed');
  });

  win.on('closed', () => {
    zoomDebugLog('Window closed');
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow = null;
  });
};
