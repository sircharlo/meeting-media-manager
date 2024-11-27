import type { IAudioMetadata } from 'music-metadata';
import type { MultimediaItem, PublicationFetcher } from 'src/types';

import { Buffer } from 'buffer';
import { FULL_HD } from 'src/constants/media';
import { downloadFileIfNeeded, getJwMediaInfo } from 'src/helpers/jw-media';
import {
  isAudio,
  isFileOfType,
  isImage,
  isVideo,
} from 'src/helpers/mediaPlayback';
import { useCurrentStateStore } from 'src/stores/current-state';

import { errorCatcher } from './error-catcher';

const {
  fileUrlToPath,
  fs,
  getUserDataPath,
  getVideoDuration,
  isFileUrl,
  parseMediaFile,
  path,
  pathToFileURL,
  readdir,
} = window.electronApi;

const getPublicationsPath = async () =>
  path.join(await getUserDataPath(), 'Publications');
const getFontsPath = async () => path.join(await getUserDataPath(), 'Fonts');

const getAdditionalMediaPath = async () =>
  path.join(await getUserDataPath(), 'Additional Media');

const getTempDirectory = async () => {
  const tempDirectory = path.join(await getUserDataPath(), 'Temp');
  await fs.ensureDir(tempDirectory);
  return tempDirectory;
};

const getPublicationDirectory = async (
  publication: PublicationFetcher,
  noIssue = false,
) => {
  try {
    const publicationsPath = await getPublicationsPath();
    const dir = path.join(
      publicationsPath,
      (publication.pub || publication.docid) +
        '_' +
        publication.langwritten +
        (publication.issue !== undefined && !noIssue
          ? '_' + publication.issue.toString()
          : ''),
    );
    await fs.ensureDir(dir);
    return dir;
  } catch (error) {
    errorCatcher(error);
    return path.resolve('./');
  }
};

const getParentDirectory = (filepath: string) => {
  if (!filepath) return '';
  if (isFileUrl(filepath)) filepath = fileUrlToPath(filepath);
  return path.dirname(filepath);
};

const getPublicationDirectoryContents = async (
  publication: PublicationFetcher,
  filter?: string,
) => {
  try {
    const dir = await getPublicationDirectory(publication);
    if (!(await fs.pathExists(dir))) return [];
    const items = await readdir(dir);
    return items
      .filter(
        (item) =>
          item.isFile &&
          (!filter || item.name.toLowerCase().includes(filter.toLowerCase())),
      )
      .map((item) => ({ path: path.join(dir, item.name) }));
  } catch (error) {
    errorCatcher(error);
    return [];
  }
};

const getFileUrl = (path: string) => {
  if (!path) return '';
  if (isFileUrl(path)) return path;
  return pathToFileURL(path);
};

const trimFilepathAsNeeded = (filepath: string) => {
  const fileDir = path.dirname(filepath);
  let filepathSize = new Blob([filepath]).size;
  while (filepathSize > 230) {
    const uniqueId =
      '_' +
      Math.floor(Math.random() * Date.now())
        .toString(16)
        .slice(0, 4);
    const overBy = filepathSize - 230 + uniqueId.length;
    const baseName = path
      .basename(filepath)
      .slice(0, -path.extname(filepath).length);
    const newBaseName = baseName.slice(0, -overBy) + uniqueId;
    filepath = path.join(fileDir, newBaseName + path.extname(filepath));
    filepathSize = new Blob([filepath]).size;
  }
  return filepath;
};

const getMetadataFromMediaPath = async (
  mediaPath: string,
): Promise<IAudioMetadata> => {
  const defaultMetadata = {
    common: {
      disk: { no: null, of: null },
      movementIndex: { no: null, of: null },
      title: '',
      track: { no: null, of: null },
    },
    format: {
      duration: 0,
      tagTypes: [],
      trackInfo: [],
    },
    native: {},
    quality: { warnings: [] },
  };
  try {
    mediaPath = fileUrlToPath(mediaPath);
    if (!mediaPath || !(await fs.exists(mediaPath))) return defaultMetadata;
    if (isFileOfType(mediaPath, ['mov'])) {
      const videoDuration = await getVideoDuration(mediaPath);
      defaultMetadata.format.duration = videoDuration?.seconds || 0;
      return defaultMetadata;
    }
    return await parseMediaFile(mediaPath);
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { mediaPath, name: 'getMetadataFromMediaPath' } },
    });
    return defaultMetadata;
  }
};

const getThumbnailFromMetadata = async (mediaPath: string) => {
  try {
    mediaPath = fileUrlToPath(mediaPath);
    if (!mediaPath || !(await fs.exists(mediaPath))) return '';
    const metadata = await parseMediaFile(mediaPath);
    const thumbnailData = metadata?.common?.picture?.[0]?.data || null;
    const thumbnailFormat = metadata?.common?.picture?.[0]?.format || null;
    if (thumbnailData?.length && thumbnailFormat) {
      try {
        const parentDir = path.dirname(mediaPath);

        const currentState = useCurrentStateStore();
        const watcherEnabled =
          currentState.currentSettings?.enableFolderWatcher || false;
        const watchDir = currentState.currentSettings?.folderToWatch
          ? path.resolve(currentState.currentSettings?.folderToWatch)
          : null;
        if (!watcherEnabled || !watchDir || !parentDir.startsWith(watchDir)) {
          const thumbnailPath = path.join(
            path.dirname(mediaPath),
            `${path.basename(mediaPath, path.extname(mediaPath))}.${thumbnailFormat.split('/')[1]}`,
          );
          await fs.writeFile(thumbnailPath, thumbnailData);
          return getFileUrl(thumbnailPath);
        }
      } catch (error) {
        errorCatcher(error);
      }
      return URL.createObjectURL(
        new Blob([thumbnailData], {
          type: thumbnailFormat,
        }),
      );
    } else {
      return '';
    }
  } catch (error) {
    if (!mediaPath?.toLowerCase().endsWith('.mov')) {
      errorCatcher(error, {
        contexts: { fn: { mediaPath, name: 'getThumbnailFromMetadata' } },
      });
    }
    return '';
  }
};

const getThumbnailFromVideoPath = async (
  videoPath: string,
  thumbnailPath: string,
): Promise<string> => {
  if (!videoPath) {
    throw new Error('Invalid video path');
  }

  const currentState = useCurrentStateStore();
  const watcherEnabled =
    currentState.currentSettings?.enableFolderWatcher || false;
  const watchDir = currentState.currentSettings?.folderToWatch
    ? path.resolve(currentState.currentSettings?.folderToWatch)
    : null;

  const videoFileUrl = videoPath;
  videoPath = fileUrlToPath(videoPath);
  thumbnailPath = fileUrlToPath(thumbnailPath);

  if (!(await fs.pathExists(videoPath))) {
    throw new Error('Video file does not exist');
  }

  const url = await getThumbnailFromMetadata(videoFileUrl);
  if (url) {
    return url;
  }

  return new Promise((resolve, reject) => {
    const videoRef = document.createElement('video');
    videoRef.src = getFileUrl(videoPath);
    videoRef.load();

    videoRef.addEventListener('loadeddata', () => {
      videoRef.addEventListener(
        'seeked',
        async () => {
          const canvas = document.createElement('canvas');
          canvas.width = FULL_HD.width;
          canvas.height = FULL_HD.height;

          const ctx = canvas.getContext('2d');

          const cleanup = () => {
            canvas.remove();
            videoRef.remove();
          };

          if (ctx) {
            ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height);
            const imageUrl = canvas.toDataURL('image/jpeg');
            const imageData = Buffer.from(imageUrl.split(',')[1], 'base64');

            const saveImage = async () => {
              await fs.writeFile(thumbnailPath, imageData);
              return thumbnailPath;
            };

            const generateBlobURL = () => {
              return URL.createObjectURL(
                new Blob([imageData], { type: 'image/jpeg' }),
              );
            };

            try {
              if (
                !watcherEnabled ||
                !watchDir ||
                !path.dirname(thumbnailPath).startsWith(watchDir)
              ) {
                resolve(await saveImage());
              } else {
                resolve(generateBlobURL());
              }
              cleanup();
            } catch (error) {
              cleanup();
              reject(error);
            }
          } else {
            cleanup();
            reject(new Error('Failed to get canvas context'));
          }
        },
        { once: true },
      );

      videoRef.currentTime = 5; // Seek to 5 seconds to get the thumbnail
    });

    videoRef.addEventListener('error', (err) => {
      // Cleanup in case of error
      videoRef.remove();
      reject(err);
    });
  });
};

const getThumbnailUrl = async (filepath: string, forceRefresh?: boolean) => {
  try {
    filepath = fileUrlToPath(filepath);
    if (!filepath || !(await fs.exists(filepath))) return '';
    let thumbnailUrl = '';
    if (isImage(filepath)) {
      thumbnailUrl = getFileUrl(filepath);
    } else if (isVideo(filepath) || isAudio(filepath)) {
      const thumbnailPath = filepath.split('.')[0] + '.jpg';
      if (await fs.exists(thumbnailPath)) {
        thumbnailUrl = getFileUrl(thumbnailPath);
      } else {
        thumbnailUrl = await getThumbnailFromVideoPath(filepath, thumbnailPath);
      }
    }
    return thumbnailUrl + (forceRefresh ? '?timestamp=' + Date.now() : '');
  } catch (error) {
    errorCatcher(error);
    return '';
  }
};

const getSubtitlesUrl = async (
  multimediaItem: MultimediaItem,
  comparisonDuration: number,
) => {
  try {
    const currentState = useCurrentStateStore();
    let subtitlesUrl = '';
    if (currentState.currentSettings?.enableSubtitles) {
      if (
        isVideo(multimediaItem.FilePath) &&
        multimediaItem.KeySymbol &&
        multimediaItem.Track
      ) {
        let subtitlesPath = multimediaItem.FilePath.split('.')[0] + '.vtt';
        const subtitleLang = currentState.currentSettings?.langSubtitles;
        const subtitleFetcher: PublicationFetcher = {
          fileformat: 'MP4',
          issue: multimediaItem.IssueTagNumber,
          langwritten: subtitleLang ?? currentState.currentSettings?.lang,
          pub: multimediaItem.KeySymbol,
          track: multimediaItem.Track,
        };
        const { duration, subtitles } = await getJwMediaInfo(subtitleFetcher);
        if (!subtitles) return '';
        if (duration && Math.abs(duration - comparisonDuration) > 10)
          throw new Error(
            'Duration mismatch: ' + JSON.stringify(subtitleFetcher),
          );
        const subtitlesFilename = path.basename(subtitles);
        const subDirectory = await getPublicationDirectory(subtitleFetcher);
        await downloadFileIfNeeded({
          dir: subDirectory,
          filename: subtitlesFilename,
          url: subtitles,
        });
        subtitlesPath = path.join(subDirectory, subtitlesFilename);
        if (await fs.exists(subtitlesPath)) {
          subtitlesUrl = getFileUrl(subtitlesPath);
        } else {
          subtitlesUrl = '';
        }
      } else {
        subtitlesUrl = '';
      }
    }
    return subtitlesUrl;
  } catch (error) {
    errorCatcher(error);
    return '';
  }
};

const isEmptyDir = async (directory: string) => {
  try {
    const files = await readdir(directory);
    return files.length === 0;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const removeEmptyDirs = async (rootDir: string) => {
  try {
    if (!(await fs.pathExists(rootDir))) return;
    const dirs = (await readdir(rootDir))
      .filter((item) => item.isDirectory)
      .map((item) => path.join(rootDir, item.name))
      .sort((a, b) => b.length - a.length);
    for (const dir of dirs) {
      if (await isEmptyDir(dir)) {
        await fs.remove(dir);
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const disableUpdatesPath = async () =>
  path.join(await getUserDataPath(), 'Global Preferences', 'disable-updates');

const updatesDisabled = async () => fs.exists(await disableUpdatesPath());

const disableUpdates = async () => {
  try {
    await fs.ensureFile(await disableUpdatesPath());
    await fs.writeFile(await disableUpdatesPath(), 'true');
  } catch (error) {
    errorCatcher(error);
  }
};

const enableUpdates = async () => {
  try {
    await fs.remove(await disableUpdatesPath());
  } catch (error) {
    errorCatcher(error);
  }
};

const watchExternalFolder = async (folder?: string) => {
  try {
    const currentState = useCurrentStateStore();
    currentState.watchFolderMedia = {};
    window.electronApi.unwatchFolders();
    if (folder) window.electronApi.watchFolder(folder);
  } catch (error) {
    errorCatcher(error);
  }
};

export {
  disableUpdates,
  enableUpdates,
  getAdditionalMediaPath,
  getFileUrl,
  getFontsPath,
  getMetadataFromMediaPath,
  getParentDirectory,
  getPublicationDirectory,
  getPublicationDirectoryContents,
  getPublicationsPath,
  getSubtitlesUrl,
  getTempDirectory,
  getThumbnailUrl,
  removeEmptyDirs,
  trimFilepathAsNeeded,
  updatesDisabled,
  watchExternalFolder,
};
