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
import { getPublicationDirectory } from 'src/utils/fs';

import { errorCatcher } from './error-catcher';

const {
  fileUrlToPath,
  fs,
  getVideoDuration,
  parseMediaFile,
  path,
  pathToFileURL,
} = window.electronApi;

export const getMetadataFromMediaPath = async (
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
          return pathToFileURL(thumbnailPath);
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
    videoRef.src = pathToFileURL(videoPath);
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

export const getThumbnailUrl = async (
  filepath: string,
  forceRefresh?: boolean,
) => {
  try {
    filepath = fileUrlToPath(filepath);
    if (!filepath || !(await fs.exists(filepath))) return '';
    let thumbnailUrl = '';
    if (isImage(filepath)) {
      thumbnailUrl = pathToFileURL(filepath);
    } else if (isVideo(filepath) || isAudio(filepath)) {
      const thumbnailPath = filepath.split('.')[0] + '.jpg';
      if (await fs.exists(thumbnailPath)) {
        thumbnailUrl = pathToFileURL(thumbnailPath);
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

export const getSubtitlesUrl = async (
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
          subtitlesUrl = pathToFileURL(subtitlesPath);
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

export const watchExternalFolder = async (folder?: string) => {
  try {
    const currentState = useCurrentStateStore();
    currentState.watchFolderMedia = {};
    window.electronApi.unwatchFolders();
    if (folder) window.electronApi.watchFolder(folder);
  } catch (error) {
    errorCatcher(error);
  }
};
