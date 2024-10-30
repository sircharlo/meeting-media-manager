import type {
  ElectronIpcInvokeKey,
  ElectronIpcSendKey,
  ExternalWebsite,
  FileDialogFilter,
} from 'src/types';

import { homepage, repository } from 'app/package.json';
import {
  app,
  dialog,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  shell,
} from 'electron';
import { IMG_EXTENSIONS, JWPUB_EXTENSIONS } from 'src/constants/fs';

import { isSelf } from './../utils';
import { logToWindow } from './window/window-base';
import { mainWindow, toggleAuthorizedClose } from './window/window-main';

// IPC send/on

function handleIpcSend(
  channel: ElectronIpcSendKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (event: IpcMainEvent, ...args: any[]) => void,
) {
  ipcMain.on(channel, (e, ...args) => {
    if (!isSelf(e.senderFrame.url)) {
      logToWindow(
        mainWindow,
        `Blocked IPC send from ${e.senderFrame.url}`,
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

handleIpcSend('authorizedClose', () => {
  toggleAuthorizedClose(true);
  mainWindow?.close();
});

handleIpcSend('openExternal', (_e, website: ExternalWebsite) => {
  let url: string | undefined;

  switch (website) {
    case 'docs':
      url = homepage;
      break;
    case 'repo':
      url = repository.url.replace('.git', '');
      break;
  }

  if (url) shell.openExternal(url);
});

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
    if (!isSelf(e.senderFrame.url)) {
      logToWindow(
        mainWindow,
        `Blocked IPC invoke from ${e.senderFrame.url}`,
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

handleIpcInvoke('getVersion', async () => {
  return app.getVersion();
});

handleIpcInvoke(
  'openFileDialog',
  async (_e, single: boolean, filter: FileDialogFilter) => {
    if (!mainWindow) return;

    const filters: Electron.FileFilter[] = [];

    if (!filter) {
      filters.push({ extensions: ['*'], name: 'All files' });
    } else if (filter === 'jwpub+image') {
      filters.push({
        extensions: JWPUB_EXTENSIONS.concat(IMG_EXTENSIONS),
        name: 'JWPUB + Images',
      });
    }

    if (filter?.includes('jwpub')) {
      filters.push({ extensions: JWPUB_EXTENSIONS, name: 'JWPUB' });
    }
    if (filter?.includes('image')) {
      filters.push({ extensions: IMG_EXTENSIONS, name: 'Images' });
    }

    return dialog.showOpenDialog(mainWindow, {
      filters,
      properties: single ? ['openFile'] : ['openFile', 'multiSelections'],
    });
  },
);
