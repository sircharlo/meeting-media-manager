import type { FileDialogFilter, FileItem } from 'src/types';

import { watch as filesystemWatch, type FSWatcher } from 'chokidar';
import { dialog } from 'electron';
import fse, { type Dirent, type Stats } from 'fs-extra';
const { exists, readdir, stat } = fse;
import {
  IMG_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
} from 'src/constants/media';
import upath from 'upath';
const { basename, dirname, join, toUnix } = upath;

import { captureElectronError } from './utils';
import { sendToWindow } from './window/window-base';
import { mainWindow } from './window/window-main';

export async function openFileDialog(
  single: boolean,
  filter: FileDialogFilter,
) {
  if (!mainWindow) return;

  const filters: Electron.FileFilter[] = [];

  if (!filter) {
    filters.push({ extensions: ['*'], name: 'All files' });
  }

  if (filter?.includes('jwpub+image+pdf')) {
    filters.push({
      extensions:
        JWPUB_EXTENSIONS.concat(IMG_EXTENSIONS).concat(PDF_EXTENSIONS),
      name: 'JWPUB + Images + PDF',
    });
  }

  if (filter?.includes('jwpub+image')) {
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
}

export async function openFolderDialog() {
  if (!mainWindow) return;
  return dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
}

const watchers = new Set<FSWatcher>();
const datePattern = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export async function readDirectory(
  dir: string,
  withSizes?: boolean,
  recursive?: boolean,
) {
  try {
    if (!(await exists(dir))) return [];
    return await readDirRecursive(dir, withSizes, recursive);
  } catch (error) {
    captureElectronError(error);
    return [];
  }
}

export async function unwatchFolders() {
  for (const watcher of watchers) {
    try {
      if (!watcher?.closed) await watcher?.close();
      watchers.delete(watcher);
    } catch (error) {
      captureElectronError(error);
    }
  }
}

export async function watchFolder(folderPath: string) {
  watchers.add(
    filesystemWatch(folderPath, {
      atomic: false,
      awaitWriteFinish: true,
      ignored: (fp: string, stats?: Stats) => {
        try {
          if (toUnix(folderPath) === fp) return false; // Don't ignore the root folder itself
          if (!stats) return false; // Don't ignore anything if no stats are available
          const dirPath = toUnix(stats.isDirectory() ? fp : dirname(fp)); // If this isn't a directory, get the parent directory
          const dirOfNote = basename(dirPath); // Get the name of the directory
          return !datePattern.test(dirOfNote); // Ignore files in a directory whose name doesn't match YYYY-MM-DD
        } catch (error) {
          captureElectronError(error);
          return true;
        }
      },
      ignorePermissionErrors: true,
    })
      .on('error', (e) => {
        captureElectronError(e);
      })
      .on('all', (event, changedPath, stats) => {
        try {
          if (!changedPath || (!stats && !event.includes('unlink'))) return; // Don't do anything if no stats are available or if no path is available
          if (changedPath instanceof Error) {
            captureElectronError(changedPath);
            return;
          }
          const dirPath = toUnix(
            stats?.isDirectory() || event === 'unlinkDir'
              ? changedPath
              : dirname(changedPath),
          ); // If this isn't a directory, get the parent directory
          const dirOfNote = basename(dirPath); // Get the name of the directory
          sendToWindow(mainWindow, 'watchFolderUpdate', {
            changedPath,
            day: dirOfNote,
            event,
          });
        } catch (error) {
          captureElectronError(error);
          return true;
        }
      }),
  );
}

async function readDirRecursive(
  directory: string,
  withSizes?: boolean,
  recursive?: boolean,
): Promise<FileItem[]> {
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
      const subDirItems = await readDirRecursive(
        fullPath,
        withSizes,
        recursive,
      );
      dirItems.push(...subDirItems);
    }
  }
  return dirItems;
}
