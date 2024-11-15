import type {
  ElectronIpcInvokeKey,
  ElectronIpcSendKey,
  ExternalWebsite,
  FileDialogFilter,
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
} from 'electron';

import { askForMediaAccess, getAppVersion, isSelf } from './../utils';
import { downloadFile } from './downloads';
import {
  openFileDialog,
  openFolderDialog,
  readDirectory,
  unwatchFolders,
  watchFolder,
} from './fs';
import { getAllScreens, setScreenPreferences } from './screen';
import { setUrlVariables } from './session';
import { registerShortcut, unregisterShortcut } from './shortcuts';
import { logToWindow } from './window/window-base';
import { mainWindow, toggleAuthorizedClose } from './window/window-main';
import { mediaWindow, moveMediaWindow } from './window/window-media';
import {
  createWebsiteWindow,
  navigateWebsiteWindow,
  websiteWindow,
  zoomWebsiteWindow,
} from './window/window-website';

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

handleIpcInvoke('getVersion', async () => getAppVersion());
handleIpcInvoke('getAppDataPath', async () => app.getPath('appData'));
handleIpcInvoke('getUserDataPath', async () => app.getPath('userData'));

handleIpcInvoke('getAllScreens', async () => getAllScreens());

handleIpcInvoke(
  'registerShortcut',
  async (_e, name: keyof SettingsValues, keySequence: string) =>
    registerShortcut(name, keySequence),
);

handleIpcInvoke(
  'readdir',
  async (_e, dir: string, withSizes?: boolean, recursive?: boolean) =>
    readDirectory(dir, withSizes, recursive),
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
