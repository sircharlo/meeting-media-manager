import type {
  ElectronIpcInvokeKey,
  ElectronIpcSendKey,
  ExternalWebsite,
} from 'src/types';

import { homepage, repository } from 'app/package.json';
import { app, ipcMain, shell } from 'electron';

import { isSelf } from './utils';
import {
  logToMainWindow,
  mainWindow,
  toggleAuthorizedClose,
} from './window-main';

// IPC send/on

function handleIpcSend(
  channel: ElectronIpcSendKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listener: (event: Electron.IpcMainEvent, ...args: any[]) => void,
) {
  ipcMain.on(channel, (e, ...args) => {
    if (!isSelf(e.senderFrame.url)) {
      logToMainWindow(`Blocked IPC send from ${e.senderFrame.url}`, {}, 'warn');
      return;
    } else {
      logToMainWindow('on', { args, channel }, 'debug');
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
    event: Electron.IpcMainInvokeEvent,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) => Promise<T>,
) {
  ipcMain.handle(channel, (e, ...args) => {
    if (!isSelf(e.senderFrame.url)) {
      logToMainWindow(
        `Blocked IPC invoke from ${e.senderFrame.url}`,
        {},
        'warn',
      );
      return null;
    } else {
      logToMainWindow('handle', { args, channel }, 'debug');
    }
    return listener(e, ...args);
  });
}

handleIpcInvoke('getVersion', async () => {
  return app.getVersion();
});
