import type { IAudioMetadata } from 'music-metadata';
import type { DateInfo, MediaItem, MultimediaItem } from 'src/types';

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

const {
  fileUrlToPath,
  fs,
  getVideoDuration,
  parse,
  parseMediaFile,
  pathToFileURL,
} = globalThis.electronApi;
const { pathExists } = fs;

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
    const fileExtension = parse(filepath).ext.toLowerCase().slice(1);
    return validExtensions.includes(fileExtension);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

/**
 * Checks if a filepath is likely a file.
 * @param filepath The path to the file.
 * @returns The result of the check.
 * @example
 * isLikelyFile('some_file.mp4') // true
 * isLikelyFile('some_file') // false
 */
export const isLikelyFile = (filepath: string): boolean => {
  try {
    if (!filepath) return false;
    const ext = parse(filepath).ext;
    return !!ext;
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
 * Stops every track of a live camera/screen-capture MediaStream. Detaching
 * an element's srcObject alone does NOT stop capture - the camera/screen
 * keeps recording (OS privacy indicator stays lit) until each track is
 * explicitly stopped.
 */
export const stopMediaStreamTracks = (
  srcObject: MediaProvider | null | undefined,
) => {
  if (srcObject instanceof MediaStream) {
    // getAudioTracks()/getVideoTracks() rather than the getTracks()
    // combinator - functionally identical per spec (getTracks() is defined
    // as exactly their union), but some MediaStream implementations (e.g.
    // happy-dom, used in this project's component tests) only implement the
    // two more specific accessors.
    srcObject
      .getAudioTracks()
      .concat(srcObject.getVideoTracks())
      .forEach((track) => track.stop());
  }
};

/**
 * Largest rectangle with `sourceWidth`:`sourceHeight` proportions that fits
 * inside a `targetWidth` x `targetHeight` box, centered - the same geometry
 * as CSS `object-fit: contain`. Meant as the destination rect for a canvas
 * drawImage() call, which otherwise stretches the source to whatever box it
 * is handed. Falls back to the full target box when any size is unusable.
 */
export const getContainFitRect = (
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
) => {
  if (!(
    sourceWidth > 0 &&
    sourceHeight > 0 &&
    targetWidth > 0 &&
    targetHeight > 0
  )) {
    return { height: targetHeight, width: targetWidth, x: 0, y: 0 };
  }

  const scale = Math.min(
    targetWidth / sourceWidth,
    targetHeight / sourceHeight,
  );
  const width = Math.round(sourceWidth * scale);
  const height = Math.round(sourceHeight * scale);

  return {
    height,
    width,
    x: Math.round((targetWidth - width) / 2),
    y: Math.round((targetHeight - height) / 2),
  };
};

export interface CaptureSizeBounds {
  maxHeight: number;
  maxWidth: number;
  minHeight: number;
  minWidth: number;
}

const CAPTURE_MIN_DIMENSION = 2;
const CAPTURE_FLOOR = { height: 180, width: 320 };
const CAPTURE_CEILING = { height: 2160, width: 3840 };

/**
 * Legacy (`mandatory`) size bounds for a Chromium `chromeMediaSource: 'tab'`
 * capture of the media window, sized to the viewport that will display the
 * captured frames (CSS px, scaled by `devicePixelRatio`).
 *
 * Two things ride on these bounds:
 *
 * 1. Cost. Chromium scales the source down to fit inside the max, aspect
 *    preserved, at the source (GPU-side, before frames cross to the
 *    renderer), and delivers it as-is when it already fits. Capping at the
 *    displaying viewport means a 1080p/4K media window isn't captured,
 *    transferred and redrawn at full size for a preview that can never show
 *    more than that viewport.
 * 2. Shape. For 'tab' sources specifically, Chromium's legacy-constraint
 *    parser (media_stream_constraints_util_video_content.cc) defaults to a
 *    FIXED_RESOLUTION policy whose fixed frame is the largest width and the
 *    largest height across *all* connected displays, combined - a shape that
 *    matches no window on a mixed-aspect setup - and letterboxes the source
 *    into it with black bars baked into every frame. That parser only
 *    considers explicit bounds when every min is > 1, and only picks the
 *    size-following ANY_WITHIN_LIMIT policy when they are neither a fixed
 *    size (min == max) nor a fixed aspect ratio (its check: floor(100*w/h)
 *    equal for min and max). The 2x2 min and the square-viewport nudge
 *    below keep both conditions true for any viewport.
 */
export const getCaptureSizeBounds = (
  viewportWidth: number,
  viewportHeight: number,
  devicePixelRatio = 1,
): CaptureSizeBounds => {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const scale = (value: number, floor: number, ceiling: number) =>
    Math.min(ceiling, Math.max(floor, Math.round((value || 0) * dpr)));

  let maxWidth = scale(
    viewportWidth,
    CAPTURE_FLOOR.width,
    CAPTURE_CEILING.width,
  );
  const maxHeight = scale(
    viewportHeight,
    CAPTURE_FLOOR.height,
    CAPTURE_CEILING.height,
  );

  // A (near-)square viewport would give the max the same approximate aspect
  // as the 2x2 min, which Chromium reads as a fixed-aspect request (and
  // letterboxes accordingly). Widen it by 1% - a cap, so harmless.
  if (Math.floor((100 * maxWidth) / maxHeight) === 100) {
    maxWidth = Math.ceil(maxHeight * 1.01);
  }

  return {
    maxHeight,
    maxWidth,
    minHeight: CAPTURE_MIN_DIMENSION,
    minWidth: CAPTURE_MIN_DIMENSION,
  };
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
export const isRemoteFile = (file: File | string): boolean => {
  if (!file) return false;

  let filePath: string;

  if (typeof file === 'string') {
    filePath = file;
  } else if (file instanceof File) {
    const path = globalThis.electronApi?.getLocalPathFromFileObject?.(file);
    if (typeof path !== 'string') return false;
    filePath = path;
  } else {
    return false;
  }

  return /^https?:\/\//i.test(filePath);
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
 * Derives a filename search mask from a publication media id, for use as a
 * native file dialog's `defaultPath` hint. Media file names are usually the
 * pubMediaId plus some zero-padding/resolution suffix (e.g. pubMediaId
 * `S-337-26v_F_2` vs file `S-337-26v_F_02_r720P.mp4`), so the last
 * underscore-delimited segment is replaced with a wildcard rather than
 * matched literally.
 * @param pubMediaId The publication media id to derive a mask from.
 * @returns A wildcard filename mask, or undefined if no id was given.
 * @example
 * getFileNameMaskFromPubMediaId('S-337-26v_F_2') // 'S-337-26v_F_*'
 * getFileNameMaskFromPubMediaId('nwt')           // 'nwt*'
 */
export const getFileNameMaskFromPubMediaId = (
  pubMediaId?: string,
): string | undefined => {
  if (!pubMediaId) return undefined;
  return pubMediaId.includes('_')
    ? `${pubMediaId.replace(/_[^_]*$/, '_')}*`
    : `${pubMediaId}*`;
};

/**
 * Gets visible meeting items from a DateInfo, optionally filtered to songs
 * only. Extracted from MediaCalendarPage.vue's `getVisibleMeetingSongs()`.
 */
export const getVisibleMeetingItems = (
  dateInfo: DateInfo | null | undefined,
  opts?: { songsOnly?: boolean },
): MediaItem[] => {
  return (dateInfo?.mediaSections ?? []).flatMap((section) =>
    (section.items ?? []).filter(
      (item) => !item.hidden && (!opts?.songsOnly || item.tag?.type === 'song'),
    ),
  );
};

/**
 * Whether a metadata-parse failure signals a partial/truncated media file
 * rather than a real bug. music-metadata (via strtok3) throws an
 * "End-Of-Stream" error when it runs out of bytes mid-parse - the normal
 * outcome when a file that is still downloading (or was copied incompletely)
 * is read before it finished, so it should not be reported to Sentry. The
 * same message string is produced by every strtok3 tokenizer, so matching
 * the message (which survives the contextBridge crossing) is more reliable
 * than matching the class instance.
 */
const isEndOfStreamError = (error: unknown) =>
  (error as null | undefined | { message?: string })?.message ===
  'End-Of-Stream';

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
    mediaPath = fileUrlToPath(mediaPath);
    if (!mediaPath || !(await pathExists(mediaPath))) {
      return defaultMetadata;
    }

    let metadata = defaultMetadata;
    if (isFileOfType(mediaPath, ['mov', '3gp'])) {
      const videoDuration = await getVideoDuration(mediaPath);
      metadata = {
        ...metadata,
        format: { ...metadata.format, duration: videoDuration?.seconds || 0 },
      };
    } else {
      metadata = await parseMediaFile(mediaPath);
    }

    if (!metadata.format.duration) {
      await new Promise<void>((resolve, reject) => {
        const video = document.createElement('video');
        video.src = pathToFileURL(mediaPath);
        video.onloadedmetadata = () => {
          metadata = {
            ...metadata,
            format: { ...metadata.format, duration: video.duration },
          };
          video.remove();
          resolve();
        };
        video.onerror = (event) => {
          video.remove();
          const rejectionError = new Error(
            `Failed to load video: ${mediaPath}`,
          );
          errorCatcher(rejectionError, {
            contexts: {
              fn: {
                event: JSON.stringify(event, Object.getOwnPropertyNames(event)),
                mediaPath,
                name: 'getMetadataFromMediaPath',
              },
            },
          });
          reject(rejectionError);
        };
        video.load();
      });
    }
    return metadata;
  } catch (error) {
    if (error instanceof Event || isEndOfStreamError(error)) {
      return defaultMetadata;
    }
    errorCatcher(error, {
      contexts: { fn: { mediaPath, name: 'getMetadataFromMediaPath' } },
    });
    return defaultMetadata;
  }
};
