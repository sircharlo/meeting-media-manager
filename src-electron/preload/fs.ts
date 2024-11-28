import type { IOptions } from 'music-metadata';
import type { VideoDuration } from 'src/types';

import url from 'url';

import { errorCatcher } from '../utils';

export const getVideoDuration = async (
  filePath: string,
): Promise<VideoDuration> => {
  const { videoDuration } = await import('@numairawan/video-duration');
  return videoDuration(filePath);
};

export const parseMediaFile = async (filePath: string, options?: IOptions) => {
  const musicMetadata = await import('music-metadata');
  return musicMetadata.parseFile(filePath, options);
};

const isFileUrl = (path: string) => {
  if (!path) return false;
  try {
    return path.startsWith('file://');
  } catch (err) {
    errorCatcher(err, { contexts: { fn: { name: 'isFileUrl', path } } });
    return false;
  }
};

export const pathToFileURL = (path: string) => {
  if (!path) return '';
  if (isFileUrl(path)) return path;
  return url.pathToFileURL(path).href;
};

export const fileUrlToPath = (fileurl: string) => {
  if (!fileurl) return '';
  if (!isFileUrl(fileurl)) return fileurl;
  return url.fileURLToPath(fileurl);
};
