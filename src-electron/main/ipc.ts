import type {
  DiscussionCategory,
  ElectronIpcInvokeKey,
  ElectronIpcSendKey,
  ExternalWebsite,
  FileDialogFilter,
  MediaAccessStatus,
  NavigateWebsiteAction,
  SettingsValues,
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
import { downloadFile } from 'main/downloads';
import { createVideoFromNonVideo } from 'main/ffmpeg';
import {
  openFileDialog,
  openFolderDialog,
  unwatchFolders,
  watchFolder,
} from 'main/fs';
import { getAllScreens, setScreenPreferences } from 'main/screen';
import { setUrlVariables } from 'main/session';
import {
  registerShortcut,
  unregisterAllShortcuts,
  unregisterShortcut,
} from 'main/shortcuts';
import { triggerUpdateCheck } from 'main/updater';
import { isSelf } from 'main/utils';
import { logToWindow } from 'main/window/window-base';
import { mainWindow, toggleAuthorizedClose } from 'main/window/window-main';
import { mediaWindow, moveMediaWindow } from 'main/window/window-media';
import {
  askForMediaAccess,
  createWebsiteWindow,
  navigateWebsiteWindow,
  websiteWindow,
  zoomWebsiteWindow,
} from 'main/window/window-website';
import { PLATFORM } from 'src-electron/constants';

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

handleIpcSend('toggleMediaWindow', (_e, show: boolean) => {
  if (!mediaWindow) return;

  if (show) {
    moveMediaWindow();
    if (!mediaWindow.isVisible()) mediaWindow.show();
  } else {
    mediaWindow.hide();
  }
});

handleIpcSend('askForMediaAccess', askForMediaAccess);

handleIpcSend('checkForUpdates', () => triggerUpdateCheck());

handleIpcSend('setUrlVariables', (_e, variables: string) => {
  setUrlVariables(JSON.parse(variables));
});

handleIpcSend('setScreenPreferences', (_e, prefs: string) => {
  setScreenPreferences(JSON.parse(prefs));
});

handleIpcSend('authorizedClose', () => {
  toggleAuthorizedClose(true);
  mainWindow?.close();
});

handleIpcSend('toggleOpenAtLogin', (_e, openAtLogin: boolean) => {
  app.setLoginItemSettings({ openAtLogin });
});

handleIpcSend('toggleWebsiteWindow', (_e, show: boolean, lang?: string) => {
  if (show) {
    createWebsiteWindow(lang);
  } else {
    websiteWindow?.close();
  }
});

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

handleIpcSend('moveMediaWindow', (_e, displayNr, fullscreen, noEvent) => {
  moveMediaWindow(displayNr, fullscreen, noEvent);
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

  if (url) shell.openExternal(url);
});

handleIpcSend(
  'openDiscussion',
  (_e, category: DiscussionCategory, title: string, params = '{}') => {
    const search = new URLSearchParams({
      category,
      title,
      ...JSON.parse(params),
    }).toString();
    shell.openExternal(
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

handleIpcInvoke('getAppDataPath', async () => app.getPath('appData'));
handleIpcInvoke('getUserDataPath', async () => app.getPath('userData'));
handleIpcInvoke('getLocales', async () => app.getPreferredSystemLanguages());

handleIpcInvoke(
  'getScreenAccessStatus',
  async (): Promise<MediaAccessStatus> =>
    PLATFORM === 'linux'
      ? 'granted'
      : systemPreferences.getMediaAccessStatus('screen'),
);

handleIpcInvoke('getAllScreens', async () => getAllScreens());

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
