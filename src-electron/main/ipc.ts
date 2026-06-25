import type {
  DiscussionCategory,
  ElectronIpcInvokeKey,
  ElectronIpcSendKey,
  ExternalWebsite,
  ExtractNestedZipEntryOptions,
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
import { pathExists } from 'fs-extra/esm';
import { arch, platform } from 'node:os';
import { PLATFORM } from 'src-electron/constants';
import { getLowDiskSpaceStatus } from 'src-electron/main/disk-space';
import {
  cancelAllDownloads,
  downloadFile,
  isDownloadComplete,
  isDownloadErrorExpected,
  pauseAllDownloads,
  resumeAllDownloads,
} from 'src-electron/main/downloads';
import { createVideoFromNonVideo } from 'src-electron/main/ffmpeg';
import {
  extractNestedZipEntry,
  getAppDataPath,
  getZipEntries,
  isUsablePath,
  openFileDialog,
  openFolderDialog,
  saveFileDialog,
  setPathProbeNotificationPaths,
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
  quitAndInstallUpdate,
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
  createTimerWindow,
  moveTimerWindow,
  timerWindowInfo,
} from 'src-electron/main/window/window-timer';
import {
  askForMediaAccess,
  createWebsiteWindow,
  navigateWebsiteWindow,
  websiteWindowInfo,
  zoomWebsiteWindow,
} from 'src-electron/main/window/window-website';
import { join } from 'upath';

const { openExternal, openPath } = shell;

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
      await moveMediaWindow();
      if (timerWindowInfo.timerWindow?.isVisible()) {
        await moveTimerWindow();
      }

      return enableFadeTransitions ? fadeMediaWindow('in') : win.show();
    }

    return enableFadeTransitions ? fadeMediaWindow('out') : win.hide();
  },
);

handleIpcSend('focusMediaWindow', () => {
  focusMediaWindow();
});

handleIpcSend('toggleTimerWindow', async (_e, show: boolean) => {
  if (show) {
    createTimerWindow();
    await moveTimerWindow();
  } else {
    timerWindowInfo.timerWindow?.close();
  }
});

handleIpcSend('askForMediaAccess', askForMediaAccess);

handleIpcSend('cancelAllDownloads', () => {
  cancelAllDownloads();
});

handleIpcSend('resumeAllDownloads', () => {
  resumeAllDownloads('renderer-manual');
});

handleIpcSend('pauseAllDownloads', () => {
  pauseAllDownloads('renderer-manual');
});

handleIpcSend('checkForUpdates', () => triggerUpdateCheck());

handleIpcSend('setElectronUrlVariables', (_e, variables: string) => {
  setElectronUrlVariables(JSON.parse(variables));
});

handleIpcSend('setPathProbeNotificationPaths', (_e, paths: string[]) => {
  setPathProbeNotificationPaths(paths);
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

handleIpcSend('navigateWebsiteWindow', (_e, action: NavigateWebsiteAction) => {
  navigateWebsiteWindow(action);
});

handleIpcSend('unregisterShortcut', (_e, keySequence: string) => {
  unregisterShortcut(keySequence);
});

handleIpcSend('unregisterAllShortcuts', () => {
  unregisterAllShortcuts();
});

handleIpcSend('moveMediaWindow', async (_e, displayNr, fullscreen) => {
  await moveMediaWindow(displayNr, fullscreen);
  if (timerWindowInfo.timerWindow?.isVisible()) {
    await moveTimerWindow();
  }
});

handleIpcSend('moveTimerWindow', async (_e, displayNr, fullscreen) => {
  await moveTimerWindow(displayNr, fullscreen);
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

async function isOS64Bit() {
  try {
    if (platform() === 'win32' && process.env.SystemRoot) {
      // Check for the existence of the SysWOW64 directory
      // PROGRAMFILES environment variable points to "C:\Program Files (x86)" for 32-bit apps on 64-bit systems
      // process.env.SystemRoot points to the Windows directory (e.g., C:\Windows)
      const sysWOW64Path = join(process.env.SystemRoot, 'SysWOW64');
      return await pathExists(sysWOW64Path);
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

handleIpcInvoke(
  'isArchitectureMismatch',
  async () => process.arch === 'ia32' && (await isOS64Bit()),
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
  async (_e, path: string, ffmpegPath: string, outputDir?: string) =>
    createVideoFromNonVideo(path, ffmpegPath, outputDir),
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

handleIpcInvoke(
  'saveFileDialog',
  async (_e, defaultPath: string, filter?: FileDialogFilter) =>
    saveFileDialog(defaultPath, filter),
);

handleIpcInvoke('openFolder', async (_e, path: string) => openPath(path));

handleIpcInvoke(
  'unzip',
  async (_e, input: string, output: string, opts?: UnzipOptions) =>
    unzipFile(input, output, opts),
);

handleIpcInvoke('unwatchFolders', async () => unwatchFolders());
handleIpcInvoke('watchFolder', async (_e, folderPath: string) =>
  watchFolder(folderPath),
);

handleIpcInvoke('getZipEntries', async (_e, zipPath: string) =>
  getZipEntries(zipPath),
);

handleIpcInvoke(
  'extractNestedZipEntry',
  async (
    _e,
    input: string,
    outerEntryName: string,
    output: string,
    opts: ExtractNestedZipEntryOptions,
  ) => extractNestedZipEntry(input, outerEntryName, output, opts),
);

handleIpcSend('quitAndInstall', () => {
  quitAndInstallUpdate();
});

handleIpcSend('relaunchApp', () => {
  toggleAuthorizedClose(true);
  app.relaunch();
  app.quit();
});
