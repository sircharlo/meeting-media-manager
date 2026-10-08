import { pathExists, remove } from 'fs-extra/esm';
import { createHash } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { getImageDimensions } from 'src-electron/main/image-size';
import { FULL_HD } from 'src/constants/media';
import { basename, changeExt, extname, join } from 'upath';

const conversionQueue = new Map<string, Promise<string>>();

/**
 * The minimal shape this module needs from a fluent-ffmpeg command.
 * Deliberately not the full (heavily overloaded) `FfmpegCommand` type, since
 * `fluent-ffmpeg` is only ever loaded dynamically here (see
 * `convertAudioToVideo`/`convertImageToVideo`) - callers cast their command
 * to this narrower shape.
 */
interface RunnableFfmpegCommand {
  kill: (signal: string) => unknown;
  on: (event: string, listener: (...args: unknown[]) => void) => unknown;
  save: (output: string) => unknown;
}

// Tracks in-progress ffmpeg conversions, keyed by their output path, so they
// can be killed on app quit (see cleanupFfmpegConversions) instead of being
// left as orphaned child processes - nothing previously kept a reference to
// the process fluent-ffmpeg spawns internally.
const activeFfmpegCommands = new Map<string, RunnableFfmpegCommand>();

/**
 * Runs an already-configured fluent-ffmpeg command to completion, tracking
 * it (see activeFfmpegCommands) and, on failure, deleting whatever partial
 * output it wrote. Without that cleanup, a failed/killed conversion can
 * leave a truncated but non-empty file at `convertedFilePath` that
 * `shouldUseExistingConversion` would later mistake for a valid cached
 * conversion and serve as-is.
 * @param command An `FfmpegCommand` with its inputs/options already set, not yet saved/run
 * @param convertedFilePath The output path to save to
 */
const runFfmpegCommand = (
  command: RunnableFfmpegCommand,
  convertedFilePath: string,
): Promise<void> => {
  activeFfmpegCommands.set(convertedFilePath, command);

  return new Promise<void>((resolve, reject) => {
    command.on('end', () => {
      activeFfmpegCommands.delete(convertedFilePath);
      resolve();
    });
    command.on('error', (err) => {
      activeFfmpegCommands.delete(convertedFilePath);
      remove(convertedFilePath)
        .catch(() => {
          // Best-effort: if this also fails, the original ffmpeg error is
          // still what matters and is reported below.
        })
        .finally(() => reject(err));
    });
    command.save(convertedFilePath);
  });
};

/**
 * Kills every in-progress ffmpeg conversion. Call on app quit so a spawned
 * ffmpeg child process is never left running after the app exits.
 */
export const cleanupFfmpegConversions = () => {
  for (const command of activeFfmpegCommands.values()) {
    try {
      command.kill('SIGKILL');
    } catch {
      // Best-effort: the app is quitting either way.
    }
  }
  activeFfmpegCommands.clear();
};

/**
 * Sanity-checks that `ffmpegPath` actually looks like the app's own
 * downloaded FFmpeg binary before it's handed to fluent-ffmpeg, which will
 * spawn whatever executable path it's given. The app's cache directory is
 * user-configurable, so this can't validate full path containment; it only
 * guards against a path that clearly isn't an FFmpeg binary (e.g. an
 * unrelated system executable) reaching the spawn call.
 * @param ffmpegPath The path to validate
 */
const assertValidFfmpegPath = async (ffmpegPath: string): Promise<void> => {
  if (!basename(ffmpegPath).toLowerCase().includes('ffmpeg')) {
    throw new Error(`Refusing to use non-FFmpeg path: ${ffmpegPath}`);
  }

  const stats = await stat(ffmpegPath);
  if (!stats.isFile()) {
    throw new Error(`FFmpeg path is not a file: ${ffmpegPath}`);
  }
};

const shouldUseExistingConversion = async (
  originalFile: string,
  convertedFilePath: string,
): Promise<boolean> => {
  if (!(await pathExists(convertedFilePath))) {
    return false;
  }

  const sourceStats = await stat(originalFile);
  const destStats = await stat(convertedFilePath);

  return destStats.mtimeMs > sourceStats.mtimeMs && destStats.size > 0;
};

const convertAudioToVideo = async (
  ffmpegPath: string,
  originalFile: string,
  convertedFilePath: string,
): Promise<void> => {
  const { default: ffmpeg } = await import('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);

  const command = ffmpeg(originalFile).noVideo();
  await runFfmpegCommand(
    command as unknown as RunnableFfmpegCommand,
    convertedFilePath,
  );
};

const convertImageToVideo = async (
  ffmpegPath: string,
  originalFile: string,
  convertedFilePath: string,
): Promise<void> => {
  const { default: ffmpeg } = await import('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);

  const { height, orientation, width } = await getImageDimensions(originalFile);

  const adjustedDimensions = getAdjustedDimensions(width, height, orientation);
  const convertedDimensions = resize(
    adjustedDimensions.width,
    adjustedDimensions.height,
    getMaxWidth(adjustedDimensions),
    getMaxHeight(adjustedDimensions),
  );

  if (!convertedDimensions) {
    throw new Error('Could not determine dimensions of image.');
  }

  const command = ffmpeg(originalFile)
    .inputOptions('-loop 1')
    .inputFormat('image2')
    .videoCodec('libx264')
    .size(`${convertedDimensions.width}x${convertedDimensions.height}`)
    .loop(5)
    .outputOptions('-pix_fmt', 'yuv420p')
    .outputOptions('-r', '30');
  await runFfmpegCommand(
    command as unknown as RunnableFfmpegCommand,
    convertedFilePath,
  );
};

const getAdjustedDimensions = (
  width: number | undefined,
  height: number | undefined,
  orientation: number | undefined,
): { height: number; width: number } => {
  if (!width || !height) {
    throw new Error('Could not determine dimensions of image.');
  }

  const shouldSwapDimensions = orientation && orientation >= 5;
  return shouldSwapDimensions
    ? { height: width, width: height }
    : { height, width };
};

const getMaxWidth = (dimensions: {
  height: number;
  width: number;
}): number | undefined => {
  const aspectRatio = FULL_HD.height / FULL_HD.width;
  const imageAspectRatio = dimensions.height / dimensions.width;

  if (aspectRatio <= imageAspectRatio) {
    return Math.min(FULL_HD.width, dimensions.width);
  }
  return undefined;
};

const getMaxHeight = (dimensions: {
  height: number;
  width: number;
}): number | undefined => {
  const aspectRatio = FULL_HD.height / FULL_HD.width;
  const imageAspectRatio = dimensions.height / dimensions.width;

  if (aspectRatio > imageAspectRatio) {
    return Math.min(FULL_HD.height, dimensions.height);
  }
  return undefined;
};

export const createVideoFromNonVideo = async (
  originalFile: string,
  ffmpegPath: string,
  outputDir?: string,
): Promise<string> => {
  const existingPromise = conversionQueue.get(originalFile);
  if (existingPromise) return existingPromise;

  const conversionPromise = (async (): Promise<string> => {
    await assertValidFfmpegPath(ffmpegPath);

    const convertedFilePath = outputDir
      ? join(
          outputDir,
          `${basename(originalFile, extname(originalFile))}-${createHash('sha1')
            .update(originalFile)
            .digest('hex')
            .slice(0, 8)}.mp4`,
        )
      : changeExt(originalFile, '.mp4');

    const canReuse = await shouldUseExistingConversion(
      originalFile,
      convertedFilePath,
    );

    if (!canReuse) {
      if (originalFile.toLowerCase().endsWith('.mp3')) {
        await convertAudioToVideo(ffmpegPath, originalFile, convertedFilePath);
      } else {
        await convertImageToVideo(ffmpegPath, originalFile, convertedFilePath);
      }
    }

    return convertedFilePath;
  })();

  conversionQueue.set(originalFile, conversionPromise);

  try {
    return await conversionPromise;
  } finally {
    conversionQueue.delete(originalFile);
  }
};

const resize = (
  x: number,
  y: number,
  xMax?: number,
  yMax?: number,
): { height: number; width: number } => {
  // Set default values for xMax and yMax if they are undefined
  const maxX = xMax ?? Infinity; // Use Infinity if no max value is provided
  const maxY = yMax ?? Infinity;

  if (maxX === Infinity && maxY === Infinity) {
    throw new Error('No maximum values given.');
  }

  if (maxX !== Infinity && (maxY === Infinity || x / y > maxX / maxY)) {
    // Width constrained or aspect ratio favors width.
    return {
      height: Math.round((maxX * y) / x),
      width: maxX,
    };
  }

  // Height constrained or aspect ratio favors height.
  return {
    height: maxY,
    width: Math.round((maxY * x) / y),
  };
};
