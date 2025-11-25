// eslint-env node

import type { FileItem, VideoDuration } from 'src/types';

import { videoDuration } from '@numairawan/video-duration';
import { type Dirent, exists, readdir, stat } from 'fs-extra';
import mime from 'mime';
import { type IOptions, parseFile } from 'music-metadata';
import url from 'node:url';
import { capturePreloadError } from 'preload/log';
import { join, normalize } from 'upath';

export const getVideoDuration = async (
  filePath: string,
): Promise<VideoDuration> => {
  return videoDuration(filePath);
};

export const parseMediaFile = async (filePath: string, options?: IOptions) => {
  return parseFile(filePath, options);
};

const isFileUrl = (testpath: string) => {
  if (!testpath) return false;
  try {
    return testpath.startsWith('file://');
  } catch (err) {
    capturePreloadError(err, {
      contexts: { fn: { name: 'isFileUrl', path: testpath } },
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

/**
 * Infers the extension of a file based on its type.
 * @param filename The name of the file.
 * @param filetype The type of the file.
 * @returns The filename with the inferred extension.
 * @example
 * inferExtension('A video.mp4') // A video.mp4
 * inferExtension('An audio file', 'audio/mpeg') // An audio file.mp3
 */
export const inferExtension = async (filename: string, filetype?: string) => {
  if (!filetype || /\.[0-9a-z]+$/i.test(filename)) return filename;

  try {
    const extractedExtension = mime.getExtension(filetype);
    return extractedExtension ? `${filename}.${extractedExtension}` : filename;
  } catch (e) {
    capturePreloadError(e);
    return filename;
  }
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
