import type { IAudioMetadata } from 'music-metadata';
import type { MultimediaItem, PublicationFetcher, SongItem } from 'src/types';

import { Buffer } from 'buffer';
import { FULL_HD } from 'src/constants/media';
import { downloadFileIfNeeded, getJwMediaInfo } from 'src/helpers/jw-media';
import { isFileOfType, isImage, isVideo } from 'src/helpers/mediaPlayback';
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

const getPublicationsPath = () => path.join(getUserDataPath(), 'Publications');
const getFontsPath = () => path.join(getUserDataPath(), 'Fonts');

const getAdditionalMediaPath = () =>
  path.join(getUserDataPath(), 'Additional Media');

const getTempDirectory = async () => {
  const tempDirectory = path.join(getUserDataPath(), 'Temp');
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
      publication.pub +
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
    if (!(await fs.pathExists(dir))) {
      return [];
    }
    const files: SongItem[] = [];
    const items = (await readdir(dir)).filter((item) => item.name);
    for (const item of items) {
      const filePath = path.join(dir, item.name);
      if (item.isFile) {
        if (
          !filter ||
          path.basename(item.name.toLowerCase()).includes(filter.toLowerCase())
        ) {
          files.push({ path: filePath });
        }
      }
    }
    return files;
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

const getDurationFromMediaPath = async (mediaPath: string) => {
  const metadata = await getMetadataFromMediaPath(mediaPath);
  return metadata?.format?.duration || 0;
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
    errorCatcher(mediaPath + ': ' + error);
    return defaultMetadata;
  }
};

const getThumbnailFromMetadata = async (mediaPath: string) => {
  try {
    mediaPath = fileUrlToPath(mediaPath);
    if (!mediaPath || !(await fs.exists(mediaPath))) return '';
    const metadata = await parseMediaFile(mediaPath);
    if (metadata?.common?.picture?.length) {
      return URL.createObjectURL(
        new Blob([metadata.common.picture[0].data], {
          type: metadata.common.picture[0].format,
        }),
      );
    } else {
      return '';
    }
  } catch (error) {
    errorCatcher(mediaPath + ': ' + error);
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
          if (ctx) {
            ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height);
            const imageUrl = canvas.toDataURL('image/jpeg');
            try {
              // Save image asynchronously
              await fs.writeFile(
                thumbnailPath,
                Buffer.from(imageUrl.split(',')[1], 'base64'),
              );

              // Cleanup
              canvas.remove();
              videoRef.remove();
              resolve(thumbnailPath);
            } catch (error) {
              // Cleanup in case of error
              canvas.remove();
              videoRef.remove();
              reject(error);
            }
          } else {
            // Cleanup in case of error
            canvas.remove();
            videoRef.remove();
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
      reject(
        new Error('Error loading video: ' + err.message + ' ' + videoPath),
      );
    });
  });
};

const getThumbnailUrl = async (filepath: string, forceRefresh?: boolean) => {
  try {
    if (!filepath || !(await fs.exists(fileUrlToPath(filepath)))) return '';
    let thumbnailUrl = '';
    if (isImage(filepath)) {
      thumbnailUrl = getFileUrl(filepath);
    } else if (isVideo(filepath)) {
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
          fileformat: 'mp4',
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
        console.log(`Removing empty directory: ${dir}`);
        await fs.remove(dir);
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const disableUpdatesPath = path.join(
  getUserDataPath(),
  'Global Preferences',
  'disable-updates',
);

const updatesDisabled = () => fs.exists(disableUpdatesPath);

const disableUpdates = async () => {
  try {
    await fs.ensureFile(disableUpdatesPath);
    await fs.writeFile(disableUpdatesPath, 'true');
  } catch (error) {
    errorCatcher(error);
  }
};

const enableUpdates = async () => {
  try {
    await fs.remove(disableUpdatesPath);
  } catch (error) {
    errorCatcher(error);
  }
};

export {
  disableUpdates,
  disableUpdatesPath,
  enableUpdates,
  getAdditionalMediaPath,
  getDurationFromMediaPath,
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
  updatesDisabled,
};
