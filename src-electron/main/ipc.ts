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
import {
  downloadFile,
  isDownloadErrorExpected,
} from 'src-electron/main/downloads';
import { createVideoFromNonVideo } from 'src-electron/main/ffmpeg';
import {
  openFileDialog,
  openFolderDialog,
  unwatchFolders,
  unzipFile,
  watchFolder,
} from 'src-electron/main/fs';
import { getAllScreens } from 'src-electron/main/screen';
import { setElectronUrlVariables, shouldQuit } from 'src-electron/main/session';
import {
  registerShortcut,
  unregisterAllShortcuts,
  unregisterShortcut,
} from 'src-electron/main/shortcuts';
import { triggerUpdateCheck } from 'src-electron/main/updater';
import {
  captureElectronError,
  getSharedDataPath,
  isSelf,
} from 'src-electron/main/utils';
import { logToWindow } from 'src-electron/main/window/window-base';
import {
  mainWindow,
  toggleAuthorizedClose,
} from 'src-electron/main/window/window-main';
import {
  fadeInMediaWindow,
  fadeOutMediaWindow,
  focusMediaWindow,
  mediaWindow,
  moveMediaWindow,
} from 'src-electron/main/window/window-media';
import {
  askForMediaAccess,
  createWebsiteWindow,
  navigateWebsiteWindow,
  websiteWindow,
  zoomWebsiteWindow,
} from 'src-electron/main/window/window-website';
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
    if (!isSelf(e.senderFrame?.url)) {
      logToWindow(
        mainWindow,
        `Blocked IPC send from ${e.senderFrame?.url}`,
        {},
        'warn',
      );
      return;
    } else {
      logToWindow(mainWindow, 'on', { args, channel }, 'debug');
    }
    listener(e, ...args);
  });
}

handleIpcSend(
  'toggleMediaWindow',
  async (_e, show: boolean, enableFadeTransitions = false) => {
    if (!mediaWindow) return;
    if (show) {
      moveMediaWindow();
      if (!mediaWindow.isVisible()) {
        if (enableFadeTransitions) {
          await fadeInMediaWindow(300);
        } else {
          mediaWindow.show();
        }
      }
    } else {
      if (enableFadeTransitions) {
        await fadeOutMediaWindow(300);
      } else {
        mediaWindow.hide();
      }
    }
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
  if (shouldQuit) app.quit();
  else if (mainWindow && !mainWindow.isDestroyed()) mainWindow.close();
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
      websiteWindow?.close();
    }
  },
);

handleIpcSend('zoomWebsiteWindow', (_e, direction: 'in' | 'out') => {
  zoomWebsiteWindow(direction);
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
    if (!isSelf(e.senderFrame?.url)) {
      logToWindow(
        mainWindow,
        `Blocked IPC invoke from ${e.senderFrame?.url}`,
        {},
        'warn',
      );
      return null;
    } else {
      logToWindow(mainWindow, 'handle', { args, channel }, 'debug');
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

handleIpcInvoke('getAppDataPath', async () => app.getPath('appData'));
handleIpcInvoke('getSharedDataPath', async () => getSharedDataPath());
handleIpcInvoke('getUserDataPath', async () => app.getPath('userData'));
handleIpcInvoke('getLocales', async () => app.getPreferredSystemLanguages());

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

handleIpcSend('quitAndInstall', () => {
  autoUpdater.quitAndInstall(false, true);
});
