import type {
  PlaybackConversionProgress,
  PlaybackConversionRequest,
} from 'src/types';

import { execFile } from 'node:child_process';
import {
  availableParallelism,
  constants as osConstants,
  setPriority,
} from 'node:os';
import {
  assertValidFfmpegPath,
  runFfmpegCommand,
  type RunnableFfmpegCommand,
} from 'src-electron/main/ffmpeg';
import { FULL_HD } from 'src/constants/media';

/**
 * Converts a file Chromium can't fully play on this computer into an H.264 /
 * AAC MP4, which it can play everywhere. Used for a video whose picture has no
 * decoder here (HEVC on a graphics card without HEVC decoding, MPEG-4 Part 2,
 * an AVI container) or whose sound has none (AC-3, DTS). One file at a time is
 * the caller's business: a conversion takes a lot of processing power, so it
 * gets about half the processor and runs below normal priority, leaving the
 * rest for the meeting.
 */

export const CONVERSION_CANCELLED = 'conversion-cancelled';

const PROBE_TIMEOUT_MS = 20_000;
const PROGRESS_INTERVAL_MS = 500;

// ffmpeg's "time=00:01:02.50" on its progress lines, and the input's
// "Duration: 00:10:00.00".
const TIME_PATTERN = /time=(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/;
const DURATION_PATTERN = /Duration: (\d+):(\d{2}):(\d{2}(?:\.\d+)?)/;
// PQ (HDR10, Dolby Vision) and HLG: shown washed out unless tone-mapped.
const HDR_TRANSFER_PATTERN = /smpte2084|arib-std-b67/;

interface ConversionCommand extends RunnableFfmpegCommand {
  ffmpegProc?: { pid?: number };
  outputOptions: (options: string[]) => ConversionCommand;
}

const activeConversions = new Map<string, ConversionCommand>();
const cancelledConversions = new Set<string>();

/** What ffmpeg prints for `args`, whether it succeeds or not. */
const readFfmpegOutput = (ffmpegPath: string, args: string[]) =>
  new Promise<string>((resolve) => {
    execFile(
      ffmpegPath,
      ['-hide_banner', ...args],
      {
        maxBuffer: 4 * 1024 * 1024,
        timeout: PROBE_TIMEOUT_MS,
        windowsHide: true,
      },
      (_error, stdout, stderr) => {
        resolve(`${stdout}\n${stderr}`);
      },
    );
  });

const toneMappingSupport = new Map<string, Promise<boolean>>();

/**
 * Whether this ffmpeg build can tone-map HDR to SDR: it needs the zscale
 * filter (zimg), which not every build has.
 */
const canToneMap = (ffmpegPath: string) => {
  let support = toneMappingSupport.get(ffmpegPath);
  if (!support) {
    support = readFfmpegOutput(ffmpegPath, ['-filters']).then(
      (filters) =>
        /^\s*\S+\s+zscale\s/m.test(filters) &&
        /^\s*\S+\s+tonemap\s/m.test(filters),
    );
    toneMappingSupport.set(ffmpegPath, support);
  }
  return support;
};

/** The input's video stream line, from ffmpeg's description of the file. */
const getVideoStreamLine = (description: string) =>
  description
    .split(/\r?\n/)
    .find((line) => /Stream #\d+:\d+.*: Video:/.test(line));

const toSeconds = (match: null | RegExpExecArray) =>
  match
    ? Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
    : null;

/**
 * The video filters: HDR tone-mapped to SDR when it can be, then scaled down
 * (never up) to fit Full HD, like converted images, and 8-bit 4:2:0, the only
 * H.264 every decoder takes.
 */
export const getVideoFilters = (toneMap: boolean) =>
  [
    toneMap
      ? 'zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv'
      : null,
    `scale=w='min(${FULL_HD.width},iw)':h='min(${FULL_HD.height},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
    // Rounding to even sizes leaves the pixels a hair off square otherwise.
    'setsar=1',
    'format=yuv420p',
  ]
    .filter(Boolean)
    .join(',');

/** About half the processor, so the meeting keeps the rest. */
const getThreadCount = () =>
  Math.max(2, Math.floor(availableParallelism() / 2));

export const getConversionOptions = ({
  keepVideo,
  threads,
  toneMap,
}: {
  keepVideo: boolean;
  threads: number;
  toneMap: boolean;
}) => [
  // The first picture stream (not cover art) and the first sound stream, if
  // there are any; subtitles, data and chapters stay behind.
  '-map',
  '0:V:0?',
  '-map',
  '0:a:0?',
  '-sn',
  '-dn',
  '-map_chapters',
  '-1',
  ...(keepVideo
    ? ['-c:v', 'copy']
    : [
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '20',
        '-vf',
        getVideoFilters(toneMap),
      ]),
  '-threads',
  String(threads),
  '-c:a',
  'aac',
  '-b:a',
  '192k',
  '-ac',
  '2',
  // Playable from the start of the file before all of it is read.
  '-movflags',
  '+faststart',
  '-f',
  'mp4',
];

/**
 * Converts `request.sourcePath` into an H.264 / AAC MP4 at
 * `request.outputPath`, reporting progress along the way. Rejects with
 * CONVERSION_CANCELLED once cancelPlaybackConversion is called for it; a
 * partial output is deleted either way.
 */
export const convertForPlayback = async (
  ffmpegPath: string,
  request: PlaybackConversionRequest,
  onProgress: (progress: PlaybackConversionProgress) => void,
): Promise<void> => {
  const {
    durationSeconds,
    id,
    keepVideo = false,
    outputPath,
    sourcePath,
  } = request;
  if (activeConversions.has(id)) throw new Error(`Already converting ${id}`);
  await assertValidFfmpegPath(ffmpegPath);

  const description = await readFfmpegOutput(ffmpegPath, ['-i', sourcePath]);
  const isHdr = HDR_TRANSFER_PATTERN.test(
    getVideoStreamLine(description) ?? '',
  );
  const toneMap = !keepVideo && isHdr && (await canToneMap(ffmpegPath));
  const totalSeconds =
    durationSeconds || toSeconds(DURATION_PATTERN.exec(description)) || null; // NOSONAR: 0 means unknown too

  const { default: ffmpeg } = await import('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);
  const command = (
    ffmpeg(sourcePath) as unknown as ConversionCommand
  ).outputOptions(
    getConversionOptions({ keepVideo, threads: getThreadCount(), toneMap }),
  );

  let lastSent = 0;
  // Its stderr rather than fluent-ffmpeg's 'progress' event, which only has
  // a percentage after running ffprobe, a binary M³ doesn't download.
  command.on('stderr', (line) => {
    if (!totalSeconds) return;
    const seconds = toSeconds(TIME_PATTERN.exec(String(line)));
    if (seconds === null) return;
    const now = Date.now();
    if (now - lastSent < PROGRESS_INTERVAL_MS) return;
    lastSent = now;
    onProgress({
      id,
      percent: Math.min(99, Math.max(0, (seconds / totalSeconds) * 100)),
    });
  });
  command.on('start', () => {
    // Cancelled while fluent-ffmpeg was still checking ffmpeg's capabilities,
    // when there was no process to stop yet.
    if (cancelledConversions.has(id)) {
      command.kill('SIGKILL');
      return;
    }
    const pid = command.ffmpegProc?.pid;
    if (!pid) return;
    try {
      setPriority(pid, osConstants.priority.PRIORITY_BELOW_NORMAL);
    } catch {
      // Not allowed everywhere; a conversion at normal priority still works.
    }
  });

  activeConversions.set(id, command);
  try {
    await runFfmpegCommand(command, outputPath);
    onProgress({ id, percent: 100 });
  } catch (error) {
    if (cancelledConversions.has(id))
      throw new Error(CONVERSION_CANCELLED, { cause: error });
    throw error;
  } finally {
    activeConversions.delete(id);
    cancelledConversions.delete(id);
  }
};

/** Stops a conversion started by convertForPlayback. False if none was running. */
export const cancelPlaybackConversion = (id: string) => {
  const command = activeConversions.get(id);
  if (!command) return false;
  cancelledConversions.add(id);
  command.kill('SIGKILL');
  return true;
};
