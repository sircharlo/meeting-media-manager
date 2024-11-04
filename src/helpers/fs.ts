import type { PathLike } from 'fs-extra';
import type { IAudioMetadata } from 'music-metadata';
import type { MultimediaItem, PublicationFetcher } from 'src/types';

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
  readDirectory,
} = window.electronApi;

const getPublicationsPath = () => path.join(getUserDataPath(), 'Publications');
const getFontsPath = () => path.join(getUserDataPath(), 'Fonts');

const getAdditionalMediaPath = () =>
  path.join(getUserDataPath(), 'Additional Media');

const getTempDirectory = () => {
  const tempDirectory = path.join(getUserDataPath(), 'Temp');
  fs.ensureDirSync(tempDirectory);
  return tempDirectory;
};

const getPublicationDirectory = (
  publication: PublicationFetcher,
  noIssue = false,
) => {
  try {
    const dir = path.join(
      getPublicationsPath(),
      publication.pub +
        '_' +
        publication.langwritten +
        (publication.issue !== undefined && !noIssue
          ? '_' + publication.issue.toString()
          : ''),
    );
    fs.ensureDirSync(dir);
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

const getPublicationDirectoryContents = (
  publication: PublicationFetcher,
  filter?: string,
) => {
  try {
    const dir = getPublicationDirectory(publication);
    if (!fs.existsSync(dir)) return [];
    const files = readDirectory(dir, {
      filter: (file) => {
        if (!filter || !file.path) return true;
        return path
          .basename(file.path.toLowerCase())
          .includes(filter.toLowerCase());
      },
      nodir: true,
    });
    return [...files];
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
    if (!mediaPath || !fs.existsSync(mediaPath)) return defaultMetadata;
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
    if (!mediaPath || !fs.existsSync(mediaPath)) return '';
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

const getThumbnailFromVideoPath: (
  videoPath: string,
  thumbnailPath: string,
) => Promise<string> = (videoPath: string, thumbnailPath: string) => {
  return new Promise((resolve, reject) => {
    if (!videoPath) {
      reject();
      return;
    }
    const videoFileUrl = videoPath;
    videoPath = fileUrlToPath(videoPath);
    thumbnailPath = fileUrlToPath(thumbnailPath);
    if (!fs.existsSync(videoPath)) {
      reject();
      return;
    }

    getThumbnailFromMetadata(videoFileUrl).then((url) => {
      if (url) {
        resolve(url);
      } else {
        const videoRef = document.createElement('video');
        videoRef.src = getFileUrl(videoPath);
        videoRef.load();

        videoRef.addEventListener('loadeddata', () => {
          videoRef.addEventListener(
            'seeked',
            () => {
              const canvas = document.createElement('canvas');
              canvas.width = FULL_HD.width;
              canvas.height = FULL_HD.height;

              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(videoRef, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL('image/jpeg');
                // save to file
                fs.writeFileSync(
                  thumbnailPath,
                  Buffer.from(imageUrl.split(',')[1], 'base64'),
                );

                // Cleanup
                canvas.remove();
                videoRef.remove();

                resolve(thumbnailPath);
              } else {
                // Cleanup in case of error
                canvas.remove();
                videoRef.remove();
                reject(new Error('Failed to get canvas context'));
              }
            },
            { once: true },
          );
          videoRef.currentTime = 5;
        });

        videoRef.addEventListener('error', (err) => {
          // Cleanup in case of error
          videoRef.remove();
          reject(
            new Error('Error loading video: ' + err.message + ' ' + videoPath),
          );
        });
      }
    });
  });
};

const getThumbnailUrl = async (filepath: string, forceRefresh?: boolean) => {
  try {
    if (!filepath || !fs.existsSync(fileUrlToPath(filepath))) return '';
    let thumbnailUrl = '';
    if (isImage(filepath)) {
      thumbnailUrl = getFileUrl(filepath);
    } else if (isVideo(filepath)) {
      const thumbnailPath = filepath.split('.')[0] + '.jpg';
      if (fs.existsSync(thumbnailPath)) {
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
        const subDirectory = getPublicationDirectory(subtitleFetcher);
        await downloadFileIfNeeded({
          dir: subDirectory,
          filename: subtitlesFilename,
          url: subtitles,
        });
        subtitlesPath = path.join(subDirectory, subtitlesFilename);
        if (fs.existsSync(subtitlesPath)) {
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

const isEmptyDir = (directory: PathLike) => {
  try {
    return fs.readdirSync(directory).length === 0;
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};
const removeEmptyDirs = (rootDir: string) => {
  try {
    if (!fs.existsSync(rootDir)) return;
    const dirs = readDirectory(rootDir, {
      depthLimit: -1,
      nodir: false,
      nofile: true,
    })
      .map((item) => item.path)
      .sort((a, b) => b.length - a.length);
    dirs.forEach((dir) => {
      if (isEmptyDir(dir)) {
        console.log(`Removing empty directory: ${dir}`);
        fs.rmdirSync(dir);
      }
    });
  } catch (error) {
    errorCatcher(error);
  }
};

const disableUpdatesPath = path.join(
  getUserDataPath(),
  'Global Preferences',
  'disable-updates',
);

const updatesDisabled = () => fs.existsSync(disableUpdatesPath);

const disableUpdates = () => {
  try {
    fs.ensureFileSync(disableUpdatesPath);
    fs.writeFileSync(disableUpdatesPath, 'true');
  } catch (error) {
    errorCatcher(error);
  }
};

const enableUpdates = () => {
  try {
    fs.removeSync(disableUpdatesPath);
  } catch (error) {
    errorCatcher(error);
  }
};

const watchExternalFolder = (folder: string) => {
  if (!fs.existsSync(folder)) return;
  try {
    fs.accessSync(folder, fs.constants.R_OK);
    window.electronApi.unwatchFolders();
    window.electronApi.watchFolder(folder);
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
  watchExternalFolder,
};
