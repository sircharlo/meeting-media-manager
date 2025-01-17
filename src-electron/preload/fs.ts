// eslint-env node

import type { IOptions } from 'music-metadata';
import type { FileItem, VideoDuration } from 'src/types';

import { type Dirent, exists, readdir, stat } from 'fs-extra';
import { capturePreloadError } from 'preload/log';
import { join, normalize } from 'upath';
import url from 'url';

export const getVideoDuration = async (
  filePath: string,
): Promise<VideoDuration> => {
  const { videoDuration } = await import('@numairawan/video-duration');
  return videoDuration(filePath);
};

export const parseMediaFile = async (filePath: string, options?: IOptions) => {
  const musicMetadata = await import('music-metadata');
  // @ts-expect-error: parseFile does not exist in browser context
  return musicMetadata.parseFile(filePath, options);
};

const isFileUrl = (path: string) => {
  if (!path) return false;
  try {
    return path.startsWith('file://');
  } catch (err) {
    capturePreloadError(err, {
      contexts: { fn: { name: 'isFileUrl', path } },
    });
    return false;
  }
};

export const pathToFileURL = (path: string) => {
  if (!path) return '';
  if (isFileUrl(path)) return path;
  return url.pathToFileURL(path).href;
};

export const fileUrlToPath = (fileurl?: string) => {
  if (!fileurl) return '';
  if (!isFileUrl(fileurl)) return fileurl;
  return normalize(url.fileURLToPath(fileurl));
};

export const readDirectory = async (
  dir: string,
  withSizes?: boolean,
  recursive?: boolean,
) => {
  try {
    if (!(await exists(dir))) return [];
    return await readDirRecursive(dir, withSizes, recursive);
  } catch (error) {
    capturePreloadError(error);
    return [];
  }
};

const readDirRecursive = async (
  directory: string,
  withSizes?: boolean,
  recursive?: boolean,
): Promise<FileItem[]> => {
  const dirs: Dirent[] = await readdir(directory, {
    withFileTypes: true,
  });
  const dirItems: FileItem[] = [];
  for (const dirent of dirs) {
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
};
