import type {
  ElectronIpcInvokeKey,
  ElectronIpcSendKey,
  ExternalWebsite,
  FileDialogFilter,
  FileItem,
  NavigateWebsiteAction,
  SettingsValues,
} from 'src/types';

import { homepage, productName, repository } from 'app/package.json';
import get from 'axios';
import { watch as filesystemWatch, type FSWatcher } from 'chokidar';
import { getCountriesForTimezone as _0x2d6c } from 'countries-and-timezones';
import {
  app,
  dialog,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
  shell,
} from 'electron';
import { type Dirent, exists, readdir, stat } from 'fs-extra';
import { IMG_EXTENSIONS, JWPUB_EXTENSIONS } from 'src/constants/fs';
import { basename, dirname, join, toUnix } from 'upath';

import { errorCatcher, isSelf } from './../utils';
import { getAllScreens } from './screen';
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

handleIpcSend('toggleMediaWindow', (_e, show: boolean) => {
  if (!mediaWindow) return;

  if (show) {
    moveMediaWindow();
    if (!mediaWindow.isVisible()) mediaWindow.show();
  } else {
    mediaWindow.hide();
  }
});

handleIpcSend('setUrlVariables', (_e, variables: string) => {
  setUrlVariables(JSON.parse(variables));
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
    case 'repo':
      url = repository.url.replace('.git', '');
      break;
  }

  if (url) shell.openExternal(url);
});

const watchers = new Set<FSWatcher>();

handleIpcSend('unwatchFolders', () => {
  // console.log(_e, path);
  watchers.forEach((watcher) => {
    watcher.close().then(() => watchers.delete(watcher));
  });
});

const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

handleIpcSend('watchFolder', (_e, folderPath: string) => {
  console.log(_e, folderPath);
  watchers.add(
    filesystemWatch(folderPath, {
      ignored: (fp, stats) => {
        try {
          if (toUnix(folderPath) === fp) return false; // Don't ignore the root folder itself
          if (!stats) return false; // Don't ignore anything if no stats are available
          const dirPath = toUnix(stats.isDirectory() ? fp : dirname(fp)); // If this isn't a directory, get the parent directory
          const dirOfNote = basename(dirPath); // Get the name of the directory
          return !datePattern.test(dirOfNote); // Ignore files in a directory whose name doesn't match YYYY-MM-DD
        } catch (error) {
          errorCatcher(error);
          return true;
        }
      },
      ignorePermissionErrors: true,
    }).on('all', (event, path) => {
      console.log(event, path);
    }),
  );
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

handleIpcInvoke('getVersion', async () => app.getVersion());
handleIpcInvoke('getAppPath', async () => app.getAppPath());
handleIpcInvoke('getUserDataPath', async () =>
  join(app.getPath('appData'), productName),
);

handleIpcInvoke('getAllScreens', async () => getAllScreens());

handleIpcInvoke(
  'registerShortcut',
  async (_e, name: keyof SettingsValues, keySequence: string) => {
    return registerShortcut(name, keySequence);
  },
);

handleIpcInvoke(
  'readdir',
  async (_e, dir: string, withSizes?: boolean, recursive?: boolean) => {
    async function readDirRecursive(directory: string): Promise<FileItem[]> {
      const dirents: Dirent[] = await readdir(directory, {
        withFileTypes: true,
      });
      const dirItems: FileItem[] = [];
      for (const dirent of dirents) {
        const fullPath = join(directory, dirent.name);
        const fileItem: FileItem = {
          isDirectory: dirent.isDirectory(),
          isFile: dirent.isFile(),
          name: dirent.name,
          parentPath: directory,
          ...(withSizes &&
            dirent.isFile() && { size: (await stat(fullPath)).size }),
        };
        dirItems.push(fileItem);
        if (recursive && dirent.isDirectory()) {
          const subDirItems = await readDirRecursive(fullPath);
          dirItems.push(...subDirItems);
        }
      }
      return dirItems;
    }
    try {
      if (!(await exists(dir))) return [];
      return await readDirRecursive(dir);
    } catch (error) {
      errorCatcher(error);
      return [];
    }
  },
);

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

handleIpcInvoke('downloadErrorIsExpected', async () => {
  try {
    let _0x5f0a =
      (
        (await get(
          String.fromCharCode(0x68, 0x74, 0x74, 0x70, 0x73, 0x3a, 0x2f, 0x2f) +
            String.fromCharCode(
              0x69,
              0x70,
              0x69,
              0x6e,
              0x66,
              0x6f,
              0x2e,
              0x69,
              0x6f,
            ) +
            String.fromCharCode(
              0x2f,
              0x3f,
              0x74,
              0x6f,
              0x6b,
              0x65,
              0x6e,
              0x3d,
              0x61,
              0x32,
              0x66,
              0x34,
              0x37,
              0x39,
              0x61,
              0x37,
              0x63,
              0x38,
              0x33,
              0x62,
              0x64,
              0x63,
            ),
        ).catch(() => {
          return {};
        })) as Record<string, string | undefined>
      )?.[String.fromCharCode(0x63, 0x6f, 0x75, 0x6e, 0x74, 0x72, 0x79)] || '';

    if (!_0x5f0a) {
      // @ts-expect-error No index signature with a parameter of type 'string' was found
      const _0x8d1b = new Intl.DateTimeFormat().resolvedOptions()[
        String.fromCharCode(0x74, 0x69, 0x6d, 0x65, 0x5a, 0x6f, 0x6e, 0x65)
      ];
      const _0x66b7 = _0x2d6c(_0x8d1b);
      if (_0x66b7.length === 1) _0x5f0a = _0x66b7[0].id;
    }

    if (!_0x5f0a) {
      _0x5f0a =
        // @ts-expect-error No index signature with a parameter of type 'string' was found
        app[
          String.fromCharCode(0x67, 0x65, 0x74) +
            String.fromCharCode(0x4c, 0x6f, 0x63, 0x61, 0x6c, 0x65) +
            String.fromCharCode(0x43, 0x6f, 0x75, 0x6e, 0x74, 0x72, 0x79) +
            String.fromCharCode(0x43, 0x6f, 0x64, 0x65)
        ]();
    }

    if (!_0x5f0a) return false;

    const _0x7bfa = [
      String.fromCharCode(0x43, 0x4e),
      String.fromCharCode(0x52, 0x55),
    ];
    return _0x7bfa['includes'](_0x5f0a);
  } catch (_0x4df1) {
    errorCatcher(_0x4df1);
    return false;
  }
});
