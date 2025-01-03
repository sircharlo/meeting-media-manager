import type {
  Asset,
  MultimediaItem,
  PublicationFetcher,
  Release,
} from 'src/types';

import { Buffer } from 'buffer';
import { Platform } from 'quasar';
import { FULL_HD } from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import { downloadFileIfNeeded, getJwMediaInfo } from 'src/helpers/jw-media';
import { useJwStore } from 'src/stores/jw';
import { fetchJson } from 'src/utils/api';
import { getPublicationDirectory } from 'src/utils/fs';
import { isAudio, isImage, isVideo } from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';

const getThumbnailFromMetadata = async (mediaPath: string) => {
  try {
    mediaPath = window.electronApi.fileUrlToPath(mediaPath);
    if (!mediaPath || !(await window.electronApi.fs.exists(mediaPath)))
      return '';
    const metadata = await window.electronApi.parseMediaFile(mediaPath);
    const thumbnailData = metadata?.common?.picture?.[0]?.data || null;
    const thumbnailFormat = metadata?.common?.picture?.[0]?.format || null;
    if (thumbnailData?.length && thumbnailFormat) {
      try {
        const parentDir = window.electronApi.path.dirname(mediaPath);

        const currentState = useCurrentStateStore();
        const watcherEnabled =
          currentState.currentSettings?.enableFolderWatcher || false;
        const watchDir = currentState.currentSettings?.folderToWatch
          ? window.electronApi.path.resolve(
              currentState.currentSettings?.folderToWatch,
            )
          : null;
        if (!watcherEnabled || !watchDir || !parentDir.startsWith(watchDir)) {
          const thumbnailPath = window.electronApi.path.join(
            window.electronApi.path.dirname(mediaPath),
            `${window.electronApi.path.basename(mediaPath, window.electronApi.path.extname(mediaPath))}.${thumbnailFormat.split('/')[1]}`,
          );
          await window.electronApi.fs.writeFile(thumbnailPath, thumbnailData);
          return window.electronApi.pathToFileURL(thumbnailPath);
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
    ? window.electronApi.path.resolve(
        currentState.currentSettings?.folderToWatch,
      )
    : null;

  const videoFileUrl = videoPath;
  videoPath = window.electronApi.fileUrlToPath(videoPath);
  thumbnailPath = window.electronApi.fileUrlToPath(thumbnailPath);

  if (!(await window.electronApi.fs.pathExists(videoPath))) {
    throw new Error(`Video file does not exist: ${videoPath}`);
  }

  const url = await getThumbnailFromMetadata(videoFileUrl);
  if (url) {
    return url;
  }

  return new Promise((resolve, reject) => {
    const videoRef = document.createElement('video');
    videoRef.src = window.electronApi.pathToFileURL(videoPath);
    videoRef.load();

    videoRef.addEventListener(
      'loadeddata',
      () => {
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
              const imageData = Buffer.from(
                imageUrl.split(',')[1] ?? '',
                'base64',
              );

              const saveImage = async () => {
                await window.electronApi.fs.writeFile(thumbnailPath, imageData);
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
                  !window.electronApi.path
                    .dirname(thumbnailPath)
                    .startsWith(watchDir)
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
          { once: true, passive: true },
        );

        videoRef.currentTime = 5; // Seek to 5 seconds to get the thumbnail
      },
      { passive: true },
    );

    videoRef.addEventListener(
      'error',
      (e) => {
        // Cleanup in case of error
        videoRef.remove();
        reject(
          new Error(e.message || e.error.message || 'Unknown VideoRef Error', {
            cause: e.error,
          }),
        );
      },
      { passive: true },
    );
  });
};

export const getThumbnailUrl = async (
  filepath?: string,
  forceRefresh?: boolean,
) => {
  try {
    if (!filepath) return '';
    filepath = window.electronApi.fileUrlToPath(filepath);
    if (!filepath || !(await window.electronApi.fs.exists(filepath))) return '';
    let thumbnailUrl = '';
    if (isImage(filepath)) {
      thumbnailUrl = window.electronApi.pathToFileURL(filepath);
    } else if (isVideo(filepath) || isAudio(filepath)) {
      const thumbnailPath = filepath.split('.')[0] + '.jpg';
      if (await window.electronApi.fs.exists(thumbnailPath)) {
        thumbnailUrl = window.electronApi.pathToFileURL(thumbnailPath);
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
        const subtitlesFilename = window.electronApi.path.basename(subtitles);
        const subDirectory = await getPublicationDirectory(
          subtitleFetcher,
          currentState.currentSettings?.cacheFolder,
        );
        await downloadFileIfNeeded({
          dir: subDirectory,
          filename: subtitlesFilename,
          url: subtitles,
        });
        subtitlesPath = window.electronApi.path.join(
          subDirectory,
          subtitlesFilename,
        );
        if (await window.electronApi.fs.exists(subtitlesPath)) {
          subtitlesUrl = window.electronApi.pathToFileURL(subtitlesPath);
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
    const jwStore = useJwStore();
    const currentState = useCurrentStateStore();
    if (!currentState.currentCongregation) return;
    jwStore.lookupPeriod[currentState.currentCongregation]?.forEach((day) => {
      day.dynamicMedia = day.dynamicMedia.filter(
        (media) => media.source !== 'watched',
      );
    });
    window.electronApi.unwatchFolders();
    if (folder) window.electronApi.watchFolder(folder);
  } catch (error) {
    errorCatcher(error);
  }
};

/**
 * Sets up FFmpeg.
 *
 * Downloads and extracts the latest version of FFmpeg if needed, and stores the path to the executable in the current state store.
 *
 * @returns The path to the FFmpeg executable, or an empty string if the setup failed.
 */
export const setupFFmpeg = async (): Promise<string> => {
  try {
    const currentState = useCurrentStateStore();
    if (currentState.ffmpegPath) return currentState.ffmpegPath;

    const ffmpegReleases = await fetchLatestRelease();
    const target =
      Platform.is.platform === 'mac' ? 'macos' : Platform.is.platform;
    const version = getValidVersion(ffmpegReleases, target);

    const ffmpegDir = await getFFmpegDirectory();
    const ffmpegZipPath = window.electronApi.path.join(ffmpegDir, version.name);

    if (await validateExistingFile(ffmpegZipPath, version.size, ffmpegDir)) {
      return currentState.ffmpegPath;
    }

    await downloadFfmpeg(
      version.browser_download_url,
      ffmpegZipPath,
      ffmpegDir,
    );
    const ffmpegPath = await decompressAndFindFFmpeg(ffmpegZipPath, ffmpegDir);

    currentState.ffmpegPath = ffmpegPath;
    return ffmpegPath;
  } catch (e: unknown) {
    errorCatcher(e);
    return '';
  }
};

// Decompress FFmpeg and find executable
async function decompressAndFindFFmpeg(
  zipPath: string,
  dir: string,
): Promise<string> {
  const ffmpegPaths = await window.electronApi.decompress(zipPath, dir);
  if (!ffmpegPaths?.length) {
    throw new Error('Could not decompress FFmpeg.');
  }
  const ffmpegFile = ffmpegPaths.find((f) => f.path.includes('ffmpeg'));
  if (!ffmpegFile) {
    throw new Error('Could not find FFmpeg.');
  }
  return window.electronApi.path.join(dir, ffmpegFile.path);
}

// Download FFmpeg
async function downloadFfmpeg(
  url: string,
  zipPath: string,
  dir: string,
): Promise<void> {
  const downloadId = await window.electronApi.downloadFile(url, dir);

  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (!downloadId) {
        clearInterval(interval);
        reject(new Error('Download failed'));
      } else {
        const progress = useCurrentStateStore().downloadProgress[downloadId];
        if (progress?.complete) {
          clearInterval(interval);
          resolve();
        }
      }
    }, 500);
  });
}

// Fetch the latest FFmpeg release
async function fetchLatestRelease(): Promise<Release> {
  const ffmpegReleases = await fetchJson<Release>(
    'https://api.github.com/repos/vot/ffbinaries-prebuilt/releases/latest',
  );
  if (!ffmpegReleases?.assets?.length) {
    throw new Error('Could not determine FFmpeg version.');
  }
  return ffmpegReleases;
}

// Get the FFmpeg directory path
async function getFFmpegDirectory(): Promise<string> {
  const ffmpegDir = window.electronApi.path.join(
    await window.electronApi.getUserDataPath(),
    'ffmpeg',
  );
  return ffmpegDir;
}

// Get a valid FFmpeg version for the target platform
function getValidVersion(releases: Release, target: string): Asset {
  const versions = releases.assets.filter(
    (a) => a.name.includes(`${target}-64`) && a.name.includes('ffmpeg'),
  );
  if (!versions.length || !versions[0]) {
    throw new Error(`Could not find valid FFmpeg versions for ${target}`);
  }
  return versions[0];
}

// Validate if an existing file is usable
async function validateExistingFile(
  zipPath: string,
  size: number,
  dir: string,
): Promise<boolean> {
  if (await window.electronApi.fs.pathExists(zipPath)) {
    const zipStat = await window.electronApi.fs.stat(zipPath);
    if (zipStat.size === size) {
      const exeName =
        (await window.electronApi.fs.readdir(dir)).find(
          (f) => f !== window.electronApi.path.basename(zipPath),
        ) || '';
      if (exeName) {
        const exePath = window.electronApi.path.join(dir, exeName);
        useCurrentStateStore().ffmpegPath = exePath;
        return true;
      }
    }
  }
  return false;
}
