import type {
  DiscussionCategory,
  ElectronIpcInvokeKey,
  ElectronIpcSendKey,
  ExternalWebsite,
  FileDialogFilter,
  JwSiteParams,
  MediaAccessStatus,
  NavigateWebsiteAction,
  SettingsValues,
  UnzipOptions,
  ZoomUIElement,
} from 'src/types';

import { homepage, repository } from 'app/package.json';
import {
  app,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  shell,
  systemPreferences,
} from 'electron';
import electronUpdater from 'electron-updater';
const { autoUpdater } = electronUpdater;
import { pathExistsSync } from 'fs-extra/esm';
import { arch, platform } from 'node:os';
import { PLATFORM } from 'src-electron/constants';
import { getLowDiskSpaceStatus } from 'src-electron/main/disk-space';
import {
  downloadFile,
  isDownloadComplete,
  isDownloadErrorExpected,
} from 'src-electron/main/downloads';
import { createVideoFromNonVideo } from 'src-electron/main/ffmpeg';
import {
  getAppDataPath,
  getZipEntries,
  isUsablePath,
  openFileDialog,
  openFolderDialog,
  unwatchFolders,
  unzipFile,
  watchFolder,
} from 'src-electron/main/fs';
import { getAllScreens } from 'src-electron/main/screen';
import { quitStatus, setElectronUrlVariables } from 'src-electron/main/session';
import {
  registerShortcut,
  unregisterAllShortcuts,
  unregisterShortcut,
} from 'src-electron/main/shortcuts';
import {
  getBetaUpdatesPath,
  getUpdatesDisabledPath,
  triggerUpdateCheck,
} from 'src-electron/main/updater';
import {
  captureElectronError,
  getSharedDataPath,
  isSelf,
} from 'src-electron/main/utils';
import { logToWindow } from 'src-electron/main/window/window-base';
import {
  mainWindowInfo,
  toggleAuthorizedClose,
} from 'src-electron/main/window/window-main';
import {
  fadeMediaWindow,
  focusMediaWindow,
  mediaWindowInfo,
  moveMediaWindow,
} from 'src-electron/main/window/window-media';
import {
  askForMediaAccess,
  createWebsiteWindow,
  navigateWebsiteWindow,
  websiteWindowInfo,
  zoomWebsiteWindow,
} from 'src-electron/main/window/window-website';
import {
  ensureRequirementsInstalled,
  isPythonInstalled,
  startZoomHelper,
  stopZoomHelper,
} from 'src-electron/main/zoom-helper-manager';
import upath from 'upath';

const { openExternal, openPath } = shell;
const { join } = upath;

// IPC send/on

function handleIpcSend(
  channel: ElectronIpcSendKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (event: IpcMainEvent, ...args: any[]) => void,
) {
  ipcMain.on(channel, (e, ...args) => {
    if (isSelf(e.senderFrame?.url)) {
      logToWindow(mainWindowInfo.mainWindow, 'on', { args, channel }, 'debug');
    } else {
      logToWindow(
        mainWindowInfo.mainWindow,
        `Blocked IPC send from ${e.senderFrame?.url}`,
        {},
        'warn',
      );
      return;
    }
    listener(e, ...args);
  });
}

handleIpcSend(
  'toggleMediaWindow',
  async (_e, show: boolean, enableFadeTransitions = false) => {
    const win = mediaWindowInfo.mediaWindow;
    if (!win) return;

    if (show) {
      moveMediaWindow();

      return enableFadeTransitions ? fadeMediaWindow('in') : win.show();
    }

    return enableFadeTransitions ? fadeMediaWindow('out') : win.hide();
  },
);

handleIpcSend('focusMediaWindow', () => {
  focusMediaWindow();
});

handleIpcSend('askForMediaAccess', askForMediaAccess);

handleIpcSend('checkForUpdates', () => triggerUpdateCheck());

handleIpcSend('setElectronUrlVariables', (_e, variables: string) => {
  setElectronUrlVariables(JSON.parse(variables));
});

handleIpcSend('authorizedClose', () => {
  toggleAuthorizedClose(true);
  if (quitStatus.shouldQuit) app.quit();
  else if (
    mainWindowInfo.mainWindow &&
    !mainWindowInfo.mainWindow.isDestroyed()
  )
    mainWindowInfo.mainWindow.close();
});

handleIpcSend('toggleOpenAtLogin', (_e, openAtLogin: boolean) => {
  app.setLoginItemSettings({ openAtLogin });
});

handleIpcSend(
  'toggleWebsiteWindow',
  (_e, show: boolean, websiteParams?: JwSiteParams) => {
    if (show) {
      createWebsiteWindow(websiteParams);
    } else {
      websiteWindowInfo.websiteWindow?.close();
    }
  },
);

handleIpcSend('zoomWebsiteWindow', (_e, direction: 'in' | 'out') => {
  zoomWebsiteWindow(direction);
});

handleIpcSend('launchZoomMeeting', (_e, meetingId: string) => {
  if (!meetingId) return;
  openExternal(
    `zoommtg://zoom.us/join?confno=${encodeURIComponent(meetingId)}`,
  );
});

handleIpcSend('navigateWebsiteWindow', (_e, action: NavigateWebsiteAction) => {
  navigateWebsiteWindow(action);
});

handleIpcSend('unregisterShortcut', (_e, keySequence: string) => {
  unregisterShortcut(keySequence);
});

handleIpcSend('unregisterAllShortcuts', () => {
  unregisterAllShortcuts();
});

handleIpcSend('moveMediaWindow', (_e, displayNr, fullscreen) => {
  moveMediaWindow(displayNr, fullscreen);
});

handleIpcSend('openExternal', (_e, website: ExternalWebsite) => {
  let url: string | undefined;

  switch (website) {
    case 'docs':
      url = homepage;
      break;
    case 'latestRelease':
      url = repository.url.replace('.git', '/releases/latest');
      break;
    case 'repo':
      url = repository.url.replace('.git', '');
      break;
  }

  if (url) openExternal(url);
});

handleIpcSend(
  'openDiscussion',
  (_e, category: DiscussionCategory, title: string, params = '{}') => {
    const search = new URLSearchParams({
      category,
      title,
      ...JSON.parse(params),
    }).toString();
    openExternal(
      `${repository.url.replace('.git', '/discussions/new')}?${search}`,
    );
  },
);

handleIpcSend('unwatchFolders', () => unwatchFolders());
handleIpcSend('watchFolder', (_e, folderPath: string) =>
  watchFolder(folderPath),
);

// IPC invoke/handle

function handleIpcInvoke<T = unknown>(
  channel: ElectronIpcInvokeKey,
  listener: (
    event: IpcMainInvokeEvent,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<T>,
) {
  ipcMain.handle(channel, (e, ...args) => {
    if (isSelf(e.senderFrame?.url)) {
      logToWindow(
        mainWindowInfo.mainWindow,
        'handle',
        { args, channel },
        'debug',
      );
    } else {
      logToWindow(
        mainWindowInfo.mainWindow,
        `Blocked IPC invoke from ${e.senderFrame?.url}`,
        {},
        'warn',
      );
      return null;
    }
    return listener(e, ...args);
  });
}

function isOS64Bit() {
  try {
    if (platform() === 'win32') {
      // Check for the existence of the SysWOW64 directory
      // PROGRAMFILES environment variable points to "C:\Program Files (x86)" for 32-bit apps on 64-bit systems
      // process.env.SystemRoot points to the Windows directory (e.g., C:\Windows)
      const sysWOW64Path = join(process.env.SystemRoot, 'SysWOW64');
      return pathExistsSync(sysWOW64Path);
    } else {
      // For macOS and Linux, the os.arch() is usually reliable for the OS's capability
      // (e.g., 'x64' or 'arm64')
      return arch()?.includes('64') ?? false;
    }
  } catch (e) {
    captureElectronError(e, {
      contexts: {
        fn: {
          args: {
            arch: arch(),
            platform: platform(),
            SystemRoot: process?.env?.SystemRoot,
          },
          name: 'isOS64Bit',
        },
      },
    });
    return false;
  }
}

handleIpcInvoke('getAppDataPath', async () => getAppDataPath());
handleIpcInvoke('getBetaUpdatesPath', async () => getBetaUpdatesPath());
handleIpcInvoke('getLowDiskSpaceStatus', async () => getLowDiskSpaceStatus());
handleIpcInvoke('getUpdatesDisabledPath', async () => getUpdatesDisabledPath());
handleIpcInvoke('getSharedDataPath', async () => getSharedDataPath());
handleIpcInvoke('getUserDataPath', async () => app.getPath('userData'));
handleIpcInvoke('getLocales', async () => app.getPreferredSystemLanguages());
handleIpcInvoke('isUsablePath', async (_e, p: string) => isUsablePath(p));
handleIpcInvoke('isZoomPythonInstalled', async () => isPythonInstalled());
handleIpcInvoke('ensureZoomRequirements', async () =>
  ensureRequirementsInstalled(),
);
handleIpcSend('startZoomHelper', () => startZoomHelper());
handleIpcSend('stopZoomHelper', () => stopZoomHelper());

handleIpcInvoke(
  'isArchitectureMismatch',
  async () => process.arch === 'ia32' && isOS64Bit(),
);

handleIpcInvoke(
  'getScreenAccessStatus',
  async (): Promise<MediaAccessStatus> =>
    PLATFORM === 'linux'
      ? 'granted'
      : systemPreferences.getMediaAccessStatus('screen'),
);

handleIpcInvoke('getAllScreens', async () => getAllScreens());
handleIpcInvoke('isDownloadComplete', async (_e, downloadId: string) =>
  isDownloadComplete(downloadId),
);
handleIpcInvoke('isDownloadErrorExpected', async () =>
  isDownloadErrorExpected(),
);

handleIpcInvoke(
  'registerShortcut',
  async (_e, name: keyof SettingsValues, keySequence: string) =>
    registerShortcut(name, keySequence),
);

handleIpcInvoke(
  'createVideoFromNonVideo',
  async (_e, path: string, ffmpegPath: string) =>
    createVideoFromNonVideo(path, ffmpegPath),
);

handleIpcInvoke(
  'downloadFile',
  async (
    _e,
    url: string,
    saveDir: string,
    destFilename?: string,
    lowPriority = false,
  ) => downloadFile(url, saveDir, destFilename, lowPriority),
);

handleIpcInvoke(
  'openFileDialog',
  async (_e, single: boolean, filter: FileDialogFilter) =>
    openFileDialog(single, filter),
);

handleIpcInvoke('openFolderDialog', async () => openFolderDialog());

handleIpcInvoke('openFolder', async (_e, path: string) => openPath(path));

handleIpcInvoke(
  'unzip',
  async (_e, input: string, output: string, opts?: UnzipOptions) =>
    unzipFile(input, output, opts),
);

handleIpcInvoke('listZoomWindows', async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/windows');
    const data = (await res.json()) as {
      result: ZoomUIElement[];
      success: boolean;
    };

    return data.result || [];
  } catch (error) {
    logToWindow(
      mainWindowInfo.mainWindow,
      'Failed to list Zoom windows',
      { error: String(error) },
      'error',
    );
    return [];
  }
});

async function sendZoomWindowKeysInternal(handle: number, keys: string) {
  try {
    const res = await fetch('http://127.0.0.1:5000/send_keys', {
      body: JSON.stringify({ keys, window_handle: handle }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const data = (await res.json()) as {
      success: boolean;
    };
    return data.success;
  } catch (error) {
    logToWindow(
      mainWindowInfo.mainWindow,
      'Failed to send keys to Zoom window',
      { error: String(error), handle, keys },
      'error',
    );
    return false;
  }
}

async function showControlsIfHidden(handle: number) {
  try {
    console.log('showControlsIfHidden', handle);
    const url = new URL('http://127.0.0.1:5000/dialog_children');
    url.searchParams.append('class_name', 'ZPControlPanelClass');
    url.searchParams.append('parent_handle', String(handle));

    const res = await fetch(url.toString());
    const data = (await res.json()) as {
      result: ZoomUIElement[];
      success: boolean;
    };
    console.log(data);

    if (!data.success || !data.result?.length) {
      const success = await sendZoomWindowKeysInternal(handle, '%');
      if (success) {
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
      }
    }
  } catch (error) {
    logToWindow(
      mainWindowInfo.mainWindow,
      'Failed to check/show Zoom controls',
      { error: String(error), handle },
      'error',
    );
  }
}

// handleIpcInvoke('listZoomWindowChildren', async (_e, handle: number) => {
//   try {
//     const res = await fetch(
//       `http://127.0.0.1:5000/window_children?window_handle=${handle}`,
//     );
//     const data = (await res.json()) as {
//       result: ZoomUIElement[];
//       success: boolean;
//     };

//     return data.result || [];
//   } catch (error) {
//     logToWindow(
//       mainWindowInfo.mainWindow,
//       'Failed to list Zoom window children',
//       { error: String(error) },
//       'error',
//     );
//     return [];
//   }
// });

handleIpcInvoke(
  'getZoomDialogChildren',
  async (_e, className: string, parentHandle?: number) => {
    try {
      const url = new URL('http://127.0.0.1:5000/dialog_children');
      url.searchParams.append('class_name', className);
      if (parentHandle) {
        url.searchParams.append('parent_handle', String(parentHandle));
      }

      const res = await fetch(url.toString());
      const data = (await res.json()) as {
        result: ZoomUIElement[];
        success: boolean;
      };

      return data.result || [];
    } catch (error) {
      logToWindow(
        mainWindowInfo.mainWindow,
        'Failed to get Zoom dialog children',
        { className, error: String(error), parentHandle },
        'error',
      );
      return [];
    }
  },
);

handleIpcInvoke('getZipEntries', async (_e, zipPath: string) =>
  getZipEntries(zipPath),
);

handleIpcSend('quitAndInstall', () => {
  autoUpdater.quitAndInstall(false, true);
});

handleIpcInvoke(
  'sendZoomWindowKeys',
  async (_e, handle: number, keys: string) =>
    sendZoomWindowKeysInternal(handle, keys),
);

handleIpcInvoke(
  'clickZoomElement',
  async (_e, handle: number, options: Partial<ZoomUIElement>) => {
    try {
      await showControlsIfHidden(handle);

      const res = await fetch('http://127.0.0.1:5000/click_button', {
        body: JSON.stringify({
          button: options.title,
          control_id: options.control_id,
          handle: options.handle,
          window_handle: handle,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = (await res.json()) as {
        success: boolean;
      };
      return data.success;
    } catch (error) {
      logToWindow(
        mainWindowInfo.mainWindow,
        'Failed to click Zoom element',
        { error: String(error), handle, options },
        'error',
      );
      return false;
    }
  },
);

handleIpcInvoke(
  'getZoomElementTitle',
  async (_e, handle: number, controlId: string) => {
    try {
      await showControlsIfHidden(handle);
      const url = new URL('http://127.0.0.1:5000/get_element_title');
      url.searchParams.append('window_handle', String(handle));
      url.searchParams.append('control_id', controlId);

      const res = await fetch(url.toString());
      const data = (await res.json()) as {
        success: boolean;
        title?: string;
      };
      return data.success ? data.title : null;
    } catch (error) {
      logToWindow(
        mainWindowInfo.mainWindow,
        'Failed to get Zoom element title',
        { controlId, error: String(error), handle },
        'error',
      );
      return null;
    }
  },
);
