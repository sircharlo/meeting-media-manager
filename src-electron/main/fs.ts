import type { FileDialogFilter, FileItem } from 'src/types';

import { dialog } from 'electron';
import { type Dirent, exists, readdir, stat } from 'fs-extra';
import {
  IMG_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
} from 'src/constants/fs';
import { join } from 'upath';

import { errorCatcher } from '../utils';
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

export async function readDirectory(
  dir: string,
  withSizes?: boolean,
  recursive?: boolean,
) {
  try {
    if (!(await exists(dir))) return [];
    return await readDirRecursive(dir, withSizes, recursive);
  } catch (error) {
    errorCatcher(error);
    return [];
  }
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
