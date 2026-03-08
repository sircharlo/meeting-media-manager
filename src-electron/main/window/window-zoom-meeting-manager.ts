import type { BrowserWindow, Video } from 'electron';
import type { ZoomMeetingManagerParams } from 'src/types';

import { HD_RESOLUTION, PLATFORM } from 'src-electron/constants';
import {
  createWindow,
  sendToWindow,
} from 'src-electron/main/window/window-base';
import { mediaWindowInfo } from 'src-electron/main/window/window-media';
import { askForMediaAccess } from 'src-electron/main/window/window-website';

export const zoomMeetingManagerWindowInfo = {
  zoomMeetingManagerWindow: null as BrowserWindow | null,
};

const buildMeetingUrl = (meetingId: string) =>
  `https://app.zoom.us/wc/${meetingId}/start?ref_from=launch&fromPWA=1`;

const injectZoomLoginAutomation = async (
  win: BrowserWindow,
  params: ZoomMeetingManagerParams,
) => {
  if (!params.username || !params.password) return;

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

  if (
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow &&
    !zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.isDestroyed()
  ) {
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.show();
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow.loadURL(
      buildMeetingUrl(params.meetingId),
    );
    return;
  }

  askForMediaAccess();

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
  const zoomSession = win.webContents.session;

  const allowedPermissions = new Set([
    'camera',
    'display-capture',
    'media',
    'microphone',
  ]);

  zoomSession.setPermissionCheckHandler((webContents, permission) => {
    if (!webContents || webContents.id !== win.webContents.id) return false;
    return allowedPermissions.has(permission as string);
  });

  zoomSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      if (webContents.id !== win.webContents.id) {
        callback(false);
        return;
      }

      callback(allowedPermissions.has(permission as string));
    },
  );

  zoomSession.setDisplayMediaRequestHandler(
    (_request, callback) => {
      const mediaWindow = mediaWindowInfo.mediaWindow;
      if (!mediaWindow || mediaWindow.isDestroyed()) {
        callback({});
        return;
      }

      const video: Video = {
        id: mediaWindow.getMediaSourceId(),
        name: mediaWindow.getTitle(),
      };

      callback({
        audio: 'loopback',
        video,
      });
    },
    { useSystemPicker: false },
  );

  win.loadURL(buildMeetingUrl(params.meetingId));

  win.webContents.on('did-finish-load', () => {
    injectZoomLoginAutomation(win, params).catch(console.error);
  });

  win.webContents.on('did-navigate-in-page', () => {
    injectZoomLoginAutomation(win, params).catch(console.error);
  });

  win.webContents.on('did-navigate', () => {
    injectZoomLoginAutomation(win, params).catch(console.error);
  });

  win.webContents.setWindowOpenHandler((details) => {
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow?.loadURL(details.url);
    return { action: 'deny' };
  });

  win.on('close', () => {
    sendToWindow(win, 'zoomMeetingManagerWindowClosed');
  });

  win.on('closed', () => {
    zoomMeetingManagerWindowInfo.zoomMeetingManagerWindow = null;
  });
};
