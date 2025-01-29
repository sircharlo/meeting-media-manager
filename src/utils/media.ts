import type { IAudioMetadata } from 'music-metadata';
import type { MultimediaItem } from 'src/types';

import {
  AUDIO_EXTENSIONS,
  HEIC_EXTENSIONS,
  JWL_PLAYLIST_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
  PURE_IMG_EXTENSIONS,
  SVG_EXTENSIONS,
  VIDEO_EXTENSIONS,
  ZIP_EXTENSIONS,
} from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';

/**
 * Checks if a file is of a certain type.
 * @param filepath The path to the file.
 * @param validExtensions The valid extensions for the file type.
 * @returns The result of the check.
 * @example
 * isFileOfType('some-file.mp4', ['mp4', 'mov']) // true
 * isFileOfType('some-file.mp4', ['mp3', 'wav']) // false
 */
const isFileOfType = (filepath: string, validExtensions: string[]) => {
  try {
    if (!filepath) return false;
    const fileExtension = window.electronApi.path
      .parse(filepath)
      .ext.toLowerCase()
      .slice(1);
    return validExtensions.includes(fileExtension);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

/**
 * Checks if a file is an image.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isImage = (filepath?: string) => {
  if (!filepath) return false;
  return isFileOfType(filepath, PURE_IMG_EXTENSIONS);
};

/**
 * Checks if a file is a HEIC image.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isHeic = (filepath: string) => {
  return isFileOfType(filepath, HEIC_EXTENSIONS);
};

/**
 * Checks if a file is an SVG image.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isSvg = (filepath: string) => {
  return isFileOfType(filepath, SVG_EXTENSIONS);
};

/**
 * Checks if a file is a video.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isVideo = (filepath: string) => {
  return isFileOfType(filepath, VIDEO_EXTENSIONS);
};

/**
 * Checks if a file is an audio file.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isAudio = (filepath: string) => {
  return isFileOfType(filepath, AUDIO_EXTENSIONS);
};

/**
 * Checks if a file is a PDF.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isPdf = (filepath: string) => {
  return isFileOfType(filepath, PDF_EXTENSIONS);
};

/**
 * Tests if a file is an archive.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isArchive = (filepath: string) => {
  return isFileOfType(filepath, ZIP_EXTENSIONS);
};

/**
 * Checks if a file is a JWPUB.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isJwpub = (filepath?: string) => {
  return isFileOfType(filepath ?? '', JWPUB_EXTENSIONS);
};

/**
 * Checks if a file is a JW playlist.
 * @param filepath The path to the file.
 * @returns The result of the check.
 */
export const isJwPlaylist = (filepath: string) => {
  return isFileOfType(filepath, JWL_PLAYLIST_EXTENSIONS);
};

/**
 * Checks if a media item is a song.
 * @param multimediaItem The multimedia item to check.
 * @returns False if the multimedia item is not a song, otherwise the track number.
 */
export const isSong = (multimediaItem: MultimediaItem) => {
  if (
    !multimediaItem.FilePath ||
    !isVideo(multimediaItem.FilePath) ||
    !multimediaItem.Track ||
    !multimediaItem.KeySymbol?.includes('sjj')
  ) {
    return false;
  }
  return multimediaItem.Track.toString();
};

/**
 * Checks if a file is a remote file.
 * @param file The file to check.
 * @returns Whether the file is a remote file.
 */
export const isRemoteFile = (
  file: File | { filename?: string; filetype?: string; path: string },
): file is { filename?: string; filetype?: string; path: string } => {
  if (!file.path) return false;
  return file.path.startsWith('http://') || file.path.startsWith('https://');
};

/**
 * Checks if a url is an image string.
 * @param url The url to check.
 * @returns Whether the url is an image string.
 */
export const isImageString = (url: string) => {
  if (!url) return false;
  return url.startsWith('data:image');
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
    const { default: mime } = await import('mime');
    const extractedExtension = mime.extension(filetype);
    return extractedExtension ? `${filename}.${extractedExtension}` : filename;
  } catch (e) {
    errorCatcher(e);
    return filename;
  }
};

/**
 * Gets the metadata of a media file.
 * @param mediaPath The path to the media file.
 * @returns The metadata of the media file.
 */
export const getMetadataFromMediaPath = async (
  mediaPath: string,
): Promise<IAudioMetadata> => {
  const defaultMetadata: IAudioMetadata = {
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
    mediaPath = window.electronApi.fileUrlToPath(mediaPath);
    if (!mediaPath || !(await window.electronApi.fs.exists(mediaPath))) {
      return defaultMetadata;
    }

    let metadata = defaultMetadata;
    if (isFileOfType(mediaPath, ['mov'])) {
      const videoDuration =
        await window.electronApi.getVideoDuration(mediaPath);
      metadata = {
        ...metadata,
        format: { ...metadata.format, duration: videoDuration?.seconds || 0 },
      };
    } else {
      metadata = await window.electronApi.parseMediaFile(mediaPath);
    }

    if (!metadata.format.duration) {
      await new Promise<void>((resolve, reject) => {
        const video = document.createElement('video');
        video.src = window.electronApi.pathToFileURL(mediaPath);
        video.onloadedmetadata = () => {
          metadata = {
            ...metadata,
            format: { ...metadata.format, duration: video.duration },
          };
          video.remove();
          resolve();
        };
        video.onerror = (error) => {
          if (typeof error === 'string') {
            errorCatcher(new Error(error));
          }
          video.remove();
          reject(error);
        };
        video.load();
      });
    }
    return metadata;
  } catch (error) {
    errorCatcher(error, {
      contexts: { fn: { mediaPath, name: 'getMetadataFromMediaPath' } },
    });
    return defaultMetadata;
  }
};
