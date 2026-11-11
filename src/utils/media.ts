import type { IAudioMetadata } from 'music-metadata';
import type {
  DateInfo,
  MediaItem,
  MultimediaItem,
  PlaybackProblem,
} from 'src/types';

import {
  AUDIO_EXTENSIONS,
  HEIC_EXTENSIONS,
  JWL_PLAYLIST_EXTENSIONS,
  JWPUB_EXTENSIONS,
  PDF_EXTENSIONS,
  PURE_IMG_EXTENSIONS,
  SVG_EXTENSIONS,
  UNPLAYABLE_AUDIO_CODEC_PATTERN,
  UNPLAYABLE_VIDEO_CONTAINERS,
  VIDEO_EXTENSIONS,
  ZIP_EXTENSIONS,
} from 'src/constants/media';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';

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
// getUserMedia/getDisplayMedia rejections caused by the environment rather
// than by the app: the OS or user denying access (NotAllowedError), another
// app holding the device (NotReadableError), the capture source timing out
// or going away (AbortError), or no such device (NotFoundError).
const EXPECTED_MEDIA_ACCESS_ERROR_NAMES = [
  'AbortError',
  'NotAllowedError',
  'NotFoundError',
  'NotReadableError',
];

/**
 * Whether a camera/screen/tab capture request failed for an environmental
 * reason the user is (or should be) told about, rather than an app bug.
 * @param error The rejection from getUserMedia/getDisplayMedia
 * @returns Whether the failure is expected
 */
export const isExpectedMediaAccessError = (error: unknown) => {
  if (typeof error !== 'object' || error === null) return false;
  const { message, name } = error as { message?: unknown; name?: unknown };
  return EXPECTED_MEDIA_ACCESS_ERROR_NAMES.some(
    (expected) =>
      name === expected ||
      (typeof message === 'string' && message.startsWith(`${expected}:`)),
  );
};

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
 * capture of the media window, sized to the box that will display the
 * captured frames (CSS px, scaled by `devicePixelRatio`).
 *
 * Two things ride on these bounds:
 *
 * 1. Cost. Chromium scales the source down to fit inside the max, aspect
 *    preserved, at the source (GPU-side, before frames cross to the
 *    renderer), and delivers it as-is when it already fits. Capping at the
 *    displaying box means a 1080p/4K media window isn't captured and
 *    transferred at full size for a preview that can never show more than
 *    that box.
 * 2. Shape. For 'tab' sources specifically, Chromium's legacy-constraint
 *    parser (media_stream_constraints_util_video_content.cc) defaults to a
 *    FIXED_RESOLUTION policy whose fixed frame is the largest width and the
 *    largest height across *all* connected displays, combined - a shape that
 *    matches no window on a mixed-aspect setup - and letterboxes the source
 *    into it with black bars baked into every frame. That parser only
 *    considers explicit bounds when every min is > 1, and only picks the
 *    size-following ANY_WITHIN_LIMIT policy when they are neither a fixed
 *    size (min == max) nor a fixed aspect ratio (its check: floor(100*w/h)
 *    equal for min and max). The 2x2 min and the square-box nudge below
 *    keep both conditions true for any box.
 */
export const getCaptureSizeBounds = (
  width: number,
  height: number,
  devicePixelRatio = 1,
): CaptureSizeBounds => {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const scale = (value: number, floor: number, ceiling: number) =>
    Math.min(ceiling, Math.max(floor, Math.round((value || 0) * dpr)));

  let maxWidth = scale(width, CAPTURE_FLOOR.width, CAPTURE_CEILING.width);
  const maxHeight = scale(height, CAPTURE_FLOOR.height, CAPTURE_CEILING.height);

  // A (near-)square box would give the max the same approximate aspect
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
 * Error messages music-metadata throws when a file ends before its own
 * headers say it should - the normal outcome when a file that is still
 * downloading (or was copied incompletely) is read before it finished:
 * - strtok3 (every tokenizer) throws "End-Of-Stream" when it runs out of
 *   bytes mid-read.
 * - Since music-metadata 11.16.0, parsers check declared sizes against the
 *   file size up front, so a cut-short MP4/M4A fails with "Atom size exceeds
 *   remaining bytes: N > M" and a cut-short MP3 with "ID3v2 tag size N
 *   exceeds remaining file size M" instead.
 */
const TRUNCATED_MEDIA_ERROR_PATTERNS = [
  /^End-Of-Stream$/,
  /^Atom size exceeds remaining bytes: \d+ > \d+$/,
  /exceeds remaining file size/,
];

/**
 * Whether a metadata-parse failure signals a partial/truncated media file
 * rather than a real bug, so it should not be reported to Sentry. Matches on
 * the message (which survives the contextBridge crossing) rather than the
 * error class, which doesn't.
 */
const isTruncatedMediaError = (error: unknown) => {
  const message = (error as null | undefined | { message?: unknown })?.message;
  return (
    typeof message === 'string' &&
    TRUNCATED_MEDIA_ERROR_PATTERNS.some((pattern) => pattern.test(message))
  );
};

/**
 * Whether a media element failed in its (hardware) video decoder rather
 * than on the file: Chromium reports MEDIA_ERR_DECODE (code 3) as
 * PIPELINE_ERROR_DISCONNECTED when the decoder drops mid-playback, or
 * PIPELINE_ERROR_DECODE for a stream it chokes on (MMM-V2-3MH). The file
 * played fine up to that point, so disabling hardware acceleration
 * (software decoding) is what helps - not re-downloading the file.
 *
 * Not DECODER_ERROR_NOT_SUPPORTED: this machine has no decoder for the
 * format at all, such as HEVC on a graphics card that can't decode it
 * (MMM-V2-3NV). Chromium only decodes HEVC in hardware, so disabling
 * hardware acceleration would take away the only decoder there is.
 */
export const isGpuDecodeError = (
  error: null | undefined | { code?: number; message?: string },
) => {
  if (!error) return false;
  if (isNoDecoderError(error)) return false;
  return (
    error.code === 3 ||
    /decode|pipeline_error_disconnected/i.test(error.message ?? '')
  );
};

/**
 * Whether a media element failed because this computer has no decoder for
 * the file's format (DECODER_ERROR_NOT_SUPPORTED), such as HEVC on a graphics
 * card that can't decode it (MMM-V2-3NV): converting the file is what helps.
 */
export const isNoDecoderError = (
  error: null | undefined | { message?: string },
) => /decoder_error_not_supported/i.test(error?.message ?? '');

/**
 * How long a hidden media element may take to read what's needed from a
 * file (its duration, or a frame for its thumbnail) before that's given up
 * on. A file that never loads and never errors - a cloud placeholder that
 * never finishes downloading, a stalled network share - would otherwise be
 * waited on forever, along with anything queued behind it (such as the
 * watched-folder queue). Generous for a cloud file still being downloaded on
 * access, and short enough that a duration lookup and a thumbnail together
 * stay within the watched-folder queue's 2-minute watchdog.
 */
export const MEDIA_ELEMENT_TIMEOUT_MS = 45_000;

export class MediaElementTimeoutError extends Error {
  constructor(mediaPath: string) {
    super(`Gave up loading ${mediaPath} after ${MEDIA_ELEMENT_TIMEOUT_MS} ms`);
    this.name = 'MediaElementTimeoutError';
  }
}

/**
 * Waits for `loading` - work that settles once `element` has read enough of
 * `mediaPath` - for up to MEDIA_ELEMENT_TIMEOUT_MS. Past that, `element`
 * stops reading the file (releasing it) and a MediaElementTimeoutError is
 * thrown. The element's handlers are detached first, so emptying it can't
 * run them.
 * @param loading Settles when the element has loaded what's needed.
 * @param element The media element reading the file.
 * @param mediaPath The file being read, for the error message.
 * @returns What `loading` resolves to.
 */
export const withMediaElementTimeout = async <T>(
  loading: Promise<T>,
  element: HTMLMediaElement,
  mediaPath: string,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      element.onerror = null;
      element.onloadedmetadata = null;
      element.removeAttribute('src');
      element.load();
      reject(new MediaElementTimeoutError(mediaPath));
    }, MEDIA_ELEMENT_TIMEOUT_MS);
  });
  try {
    return await Promise.race([loading, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Whether Chromium can show a picture for a file that has a video track. With
 * no decoder for that track it either drops it and carries on without an
 * error event, leaving videoWidth at 0, or fails with
 * DECODER_ERROR_NOT_SUPPORTED when it has a decoder that can't take this
 * stream (MMM-V2-3NV). Checked on the element rather than against a list of
 * codecs because the answer depends on the machine: HEVC only decodes in
 * hardware.
 * @param filepath The path to the video file.
 * @returns 'unknown' for a file that won't load for any other reason.
 */
const checkPicture = async (filepath: string) => {
  const video = document.createElement('video');
  const loading = new Promise<'missing' | 'ok' | 'unknown'>((resolve) => {
    video.onloadedmetadata = () =>
      resolve(video.videoWidth > 0 ? 'ok' : 'missing');
    // A file that won't load for another reason is reported by the
    // thumbnail step.
    video.onerror = () =>
      resolve(isNoDecoderError(video.error) ? 'missing' : 'unknown');
  });
  video.preload = 'metadata';
  video.src = pathToFileURL(filepath);
  video.load();
  try {
    return await withMediaElementTimeout(loading, video, filepath);
  } finally {
    video.onerror = null;
    video.onloadedmetadata = null;
    video.removeAttribute('src');
    video.load();
  }
};

// A fixed locale, so the fingerprint is the same on every machine.
const joinCodecNames = (codecNames: string[]) =>
  [...new Set(codecNames)]
    .toSorted((a, b) => a.localeCompare(b, 'en'))
    .join('+');

const reportUnplayableTrack = (
  filepath: string,
  missing: 'picture' | 'sound',
  codecNames: string[],
) => {
  const codec = joinCodecNames(codecNames);
  const extension = parse(filepath).ext.toLowerCase().slice(1);
  // No file name: this only counts how often each combination turns up.
  errorCatcher(
    new Error(`Imported .${extension} has no ${missing}: ${codec}`),
    {
      contexts: {
        fn: { codec, extension, missing, name: 'reportUnplayableMediaTracks' },
      },
      fingerprint: ['media-unplayable-track', missing, extension, codec],
      level: 'warning',
      tags: {
        'media.codec': codec,
        'media.extension': extension,
        'media.missing': missing,
      },
    },
  );
};

/**
 * The codecs of the tracks this computer can't play: its picture, if it has
 * one that won't show, and its sound, if none of its sound tracks plays (one
 * playable language is enough).
 */
const findUnplayableTracks = async (
  filepath: string,
): Promise<{ picture?: string[]; sound?: string[] }> => {
  const extension = parse(filepath).ext.toLowerCase().slice(1);
  // Chromium won't open the container, and the parser can't read it either.
  if (UNPLAYABLE_VIDEO_CONTAINERS.includes(extension)) {
    return { picture: [extension.toUpperCase()] };
  }

  const { trackInfo } = (await parseMediaFile(filepath, { skipCovers: true }))
    .format;
  const found: { picture?: string[]; sound?: string[] } = {};

  const audioCodecs = trackInfo
    .filter((track) => track.audio)
    .map((track) => track.codecName ?? 'unknown');
  if (
    audioCodecs.length &&
    audioCodecs.every((codec) => UNPLAYABLE_AUDIO_CODEC_PATTERN.test(codec))
  ) {
    found.sound = audioCodecs;
  }

  const videoCodecs = trackInfo
    .filter((track) => track.video)
    .map((track) => track.codecName ?? 'unknown');
  if (videoCodecs.length && (await checkPicture(filepath)) === 'missing') {
    found.picture = videoCodecs;
  }
  return found;
};

/**
 * What keeps an audio or video file from playing on this computer: Chromium
 * accepts these files but plays them without a picture or without sound,
 * with no error to show for it. Null when nothing does, or when it can't be
 * told (a file that won't load at all is reported by the thumbnail step).
 * Never throws.
 * @param filepath The path to the file.
 * @param options.report Also tell Sentry, without the file name, so it
 * shows how often each extension/codec combination occurs.
 */
export const findPlaybackProblem = async (
  filepath: string,
  { report = false } = {},
): Promise<null | PlaybackProblem> => {
  try {
    const { picture, sound } = await findUnplayableTracks(filepath);
    if (report) {
      if (sound) reportUnplayableTrack(filepath, 'sound', sound);
      if (picture) reportUnplayableTrack(filepath, 'picture', picture);
    }
    // Converting for the picture converts the sound too.
    if (picture) return { codec: joinCodecNames(picture), missing: 'picture' };
    if (sound) return { codec: joinCodecNames(sound), missing: 'sound' };
    return null;
  } catch (error) {
    // A file the parser can't read is reported by getMetadataFromMediaPath.
    log('Could not check media tracks', 'mediaProcessing', 'warn', error);
    return null;
  }
};

// What music-metadata calls a codec (often an MP4 four-character code), as
// people know it. E-AC-3 before AC-3, which it contains.
const CODEC_NAMES: [RegExp, string][] = [
  [/^<?(?:hvc1|hev1)>?$|hevc|h\.?265/i, 'HEVC (H.265)'],
  [
    /^<?(?:mp4v|xvid|divx|dx50)>?$|mpeg-?4 ?(?:part ?2|visual)/i,
    'MPEG-4 Part 2',
  ],
  [/^<?(?:apch|apcn|apcs|apco|ap4h|ap4x)>?$|prores/i, 'ProRes'],
  [/^<?(?:mjpa|mjpb|jpeg)>?$|mjpe?g/i, 'Motion JPEG'],
  [/e-?ac-?3|ec-?3/i, 'E-AC-3'],
  [/ac-?3/i, 'AC-3'],
  [/dts/i, 'DTS'],
  [/alac/i, 'ALAC'],
  [/adpcm/i, 'ADPCM'],
];

/**
 * A PlaybackProblem's codec as people know it ("HEVC (H.265)", not "<hvc1>"),
 * or '' when it isn't known.
 */
export const describeCodec = (codec: string) =>
  [
    ...new Set(
      codec
        .split('+')
        .filter((name) => name && name !== 'unknown')
        .map(
          (name) =>
            CODEC_NAMES.find(([pattern]) => pattern.test(name))?.[1] ??
            name.replace(/^<(.+)>$/, '$1'),
        ),
    ),
  ].join(', ');

/**
 * Reports an imported file that Chromium will accept but can't fully play
 * (see findPlaybackProblem). Purely diagnostic: never throws, and is safe to
 * leave running in the background.
 * @param filepath The path to the imported audio or video file.
 */
export const reportUnplayableMediaTracks = async (filepath: string) => {
  await findPlaybackProblem(filepath, { report: true });
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
      const video = document.createElement('video');
      const loading = new Promise<void>((resolve, reject) => {
        video.src = pathToFileURL(mediaPath);
        video.onloadedmetadata = () => {
          metadata = {
            ...metadata,
            format: { ...metadata.format, duration: video.duration },
          };
          video.remove();
          resolve();
        };
        video.onerror = () => {
          video.remove();
          const rejectionError = new Error(
            `Failed to load video: ${mediaPath}`,
          );
          errorCatcher(rejectionError, {
            contexts: {
              fn: {
                // The 'error' event itself is empty ({"isTrusted":true}):
                // Chromium's reason is on the element's own MediaError.
                code: video.error?.code,
                mediaError: video.error?.message,
                mediaPath,
                name: 'getMetadataFromMediaPath',
              },
            },
          });
          reject(rejectionError);
        };
        video.load();
      });
      await withMediaElementTimeout(loading, video, mediaPath);
    }
    return metadata;
  } catch (error) {
    if (error instanceof Event || isTruncatedMediaError(error)) {
      return defaultMetadata;
    }
    // The video element's own onerror handler above already reported this
    // failure with the MediaError attached (MMM-V2-3N6) - reporting the
    // same error again here would only file a duplicate.
    if (
      error instanceof Error &&
      error.message.startsWith('Failed to load video:')
    ) {
      return defaultMetadata;
    }
    // Environmental (a file that never loads), not a bug: no report.
    if (error instanceof MediaElementTimeoutError) {
      log(error.message, 'mediaProcessing', 'warn');
      return defaultMetadata;
    }
    errorCatcher(error, {
      contexts: { fn: { mediaPath, name: 'getMetadataFromMediaPath' } },
    });
    return defaultMetadata;
  }
};
