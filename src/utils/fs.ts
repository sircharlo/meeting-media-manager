import type { PublicationFetcher } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';

import { isEmpty } from './general';

// This might belong in a different file if used in multiple places
const getPubId = ({ docid, issue, langwritten, pub }: PublicationFetcher) =>
  [pub || docid, langwritten, issue].filter((p) => !isEmpty(p)).join('_');

export const isFileUrl = (path: string) => path.startsWith('file://');

// Paths

const PUBLICATION_FOLDER = 'Publications';
const getUserDataPath = async (paths: string[], create = false) => {
  const dir = window.electronApi.path.join(
    await window.electronApi.getUserDataPath(),
    ...paths,
  );
  if (create) {
    try {
      await window.electronApi.fs.ensureDir(dir);
    } catch (e) {
      errorCatcher(e);
    }
  }
  return dir;
};

export const getFontsPath = () => getUserDataPath(['Fonts']);
export const getTempPath = () => getUserDataPath(['Temp'], true);
export const getPublicationsPath = () => getUserDataPath([PUBLICATION_FOLDER]);
export const getAdditionalMediaPath = () =>
  getUserDataPath(['Additional Media']);

// Directories

export const getParentDirectory = (filepath: string) => {
  if (!filepath) return '';
  if (isFileUrl(filepath)) {
    filepath = window.electronApi.fileUrlToPath(filepath);
  }
  return window.electronApi.path.dirname(filepath);
};

export const getPublicationDirectory = async (
  publication: PublicationFetcher,
) => {
  return getUserDataPath([PUBLICATION_FOLDER, getPubId(publication)], true);
};

const isEmptyDir = async (directory: string) => {
  try {
    const files = await window.electronApi.readdir(directory);
    return files.length === 0;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const removeEmptyDir = async (directory: string) => {
  if (await isEmptyDir(directory)) {
    await window.electronApi.fs.remove(directory);
  }
};

export const removeEmptyDirs = async (rootDir: string) => {
  try {
    const dirs = (await window.electronApi.readdir(rootDir))
      .filter((item) => item.isDirectory)
      .map((item) => window.electronApi.path.join(rootDir, item.name));

    dirs.forEach((dir) => removeEmptyDir(dir));
  } catch (error) {
    errorCatcher(error);
  }
};

// Files

export const getPublicationDirectoryContents = async (
  publication: PublicationFetcher,
  filter?: string,
) => {
  try {
    const dir = await getPublicationDirectory(publication);
    if (!(await window.electronApi.fs.pathExists(dir))) return [];
    const items = await window.electronApi.readdir(dir);
    return items
      .filter(
        (item) =>
          item.isFile &&
          (!filter || item.name.toLowerCase().includes(filter.toLowerCase())),
      )
      .map((item) => ({ path: window.electronApi.path.join(dir, item.name) }));
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

export const trimFilepathAsNeeded = (filepath: string) => {
  const fileDir = window.electronApi.path.dirname(filepath);
  let filepathSize = new Blob([filepath]).size;
  while (filepathSize > 230) {
    const uniqueId =
      '_' +
      Math.floor(Math.random() * Date.now())
        .toString(16)
        .slice(0, 4);

    const overBy = filepathSize - 230 + uniqueId.length;

    const baseName = window.electronApi.path
      .basename(filepath)
      .slice(0, -window.electronApi.path.extname(filepath).length);

    const newBaseName = baseName.slice(0, -overBy) + uniqueId;

    filepath = window.electronApi.path.join(
      fileDir,
      newBaseName + window.electronApi.path.extname(filepath),
    );

    filepathSize = new Blob([filepath]).size;
  }
  return filepath;
};

// Disable Updates File

const disableUpdatesPath = () =>
  getUserDataPath(['Global Preferences', 'disable-updates']);

export const updatesDisabled = async () =>
  window.electronApi.fs.exists(await disableUpdatesPath());

export const enableUpdates = async () => {
  try {
    await window.electronApi.fs.remove(await disableUpdatesPath());
  } catch (error) {
    errorCatcher(error);
  }
};

export const disableUpdates = async () => {
  try {
    await window.electronApi.fs.writeFile(await disableUpdatesPath(), 'true');
  } catch (error) {
    errorCatcher(error);
  }
};
