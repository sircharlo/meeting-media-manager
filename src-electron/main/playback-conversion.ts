import type {
  PlaybackConversionProgress,
  PlaybackConversionRequest,
  PlaybackConversionResult,
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
 * uses the graphics card's encoder when it can, gets about half the
 * processor and runs below normal priority, leaving the rest for the meeting.
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
  if (support === undefined) {
    support = readFfmpegOutput(ffmpegPath, ['-filters']).then(
      (filters) => lists(filters, 'zscale') && lists(filters, 'tonemap'),
    );
    toneMappingSupport.set(ffmpegPath, support);
  }
  return support;
};

/**
 * Whether `ffmpeg -filters` or `ffmpeg -encoders` lists this name: it's the
 * second column (" .SC zscale  V->V  Apply resizing...").
 */
const lists = (list: string, name: string) =>
  list
    .split('\n')
    .some((line) => line.trim().split(' ').filter(Boolean)[1] === name);

/** An H.264 encoder, with its options for about the quality of x264's CRF 20. */
export interface VideoEncoder {
  name: string;
  options: string[];
}

export const SOFTWARE_ENCODER: VideoEncoder = {
  name: 'libx264',
  options: ['-preset', 'veryfast', '-crf', '20'],
};

// Graphics-card encoders, best first. They take a fraction of the processor
// time x264 does (a third with Intel's, measured), which keeps the meeting
// smooth while a file converts. Linux's others need a device set up first.
const HARDWARE_ENCODERS: Partial<Record<NodeJS.Platform, VideoEncoder[]>> = {
  darwin: [
    { name: 'h264_videotoolbox', options: ['-b:v', '8M', '-maxrate', '12M'] },
  ],
  linux: [
    {
      name: 'h264_nvenc',
      options: ['-preset', 'p4', '-rc', 'vbr', '-cq', '21', '-b:v', '0'],
    },
  ],
  win32: [
    {
      name: 'h264_nvenc',
      options: ['-preset', 'p4', '-rc', 'vbr', '-cq', '21', '-b:v', '0'],
    },
    {
      name: 'h264_qsv',
      options: ['-preset', 'faster', '-global_quality', '21'],
    },
    {
      name: 'h264_amf',
      options: [
        '-quality',
        'balanced',
        '-rc',
        'cqp',
        '-qp_i',
        '20',
        '-qp_p',
        '22',
      ],
    },
  ],
};

/** Whether an encoder works on this computer: one frame, through the conversion's own filters. */
const encodesHere = (ffmpegPath: string, encoder: VideoEncoder) =>
  new Promise<boolean>((resolve) => {
    execFile(
      ffmpegPath,
      [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        'color=c=black:s=320x240:d=0.2',
        '-frames:v',
        '1',
        '-vf',
        getVideoFilters(false),
        '-c:v',
        encoder.name,
        ...encoder.options,
        '-f',
        'null',
        '-',
      ],
      { timeout: PROBE_TIMEOUT_MS, windowsHide: true },
      (error) => {
        resolve(!error);
      },
    );
  });

const encoderChoices = new Map<string, Promise<VideoEncoder>>();

/**
 * The encoder to convert with: the best graphics-card one that works on this
 * computer, otherwise x264. ffmpeg lists every encoder it was built with,
 * whether the hardware is there or not (NVENC without an NVIDIA card fails to
 * load nvcuda.dll), so each is tried on one frame first, side by side since a
 * missing one can take seconds to fail. Decided once per ffmpeg.
 */
const chooseEncoder = (ffmpegPath: string) => {
  let choice = encoderChoices.get(ffmpegPath);
  if (choice === undefined) {
    choice = (async () => {
      const candidates = HARDWARE_ENCODERS[process.platform] ?? [];
      if (!candidates.length) return SOFTWARE_ENCODER;
      const encoders = await readFfmpegOutput(ffmpegPath, ['-encoders']);
      const listed = candidates.filter((encoder) =>
        lists(encoders, encoder.name),
      );
      const works = await Promise.all(
        listed.map((encoder) => encodesHere(ffmpegPath, encoder)),
      );
      return listed.find((_, index) => works[index]) ?? SOFTWARE_ENCODER;
    })();
    encoderChoices.set(ffmpegPath, choice);
  }
  return choice;
};

/** The input's video stream line, from ffmpeg's description of the file. */
const getVideoStreamLine = (description: string) =>
  description
    .split('\n')
    .find((line) => line.includes('Stream #') && line.includes(': Video:'));

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
  encoder,
  threads,
  toneMap,
}: {
  /** Null when only the sound needs converting: the picture is copied. */
  encoder: null | VideoEncoder;
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
  ...(encoder
    ? [
        '-c:v',
        encoder.name,
        ...encoder.options,
        '-vf',
        getVideoFilters(toneMap),
      ]
    : ['-c:v', 'copy']),
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

const isCancellation = (error: unknown) =>
  error instanceof Error && error.message === CONVERSION_CANCELLED;

/**
 * Runs one conversion with these output options, reporting its progress.
 * Rejects with CONVERSION_CANCELLED once cancelled; a partial output is
 * deleted either way.
 */
const runConversion = async (
  ffmpegPath: string,
  {
    id,
    onProgress,
    options,
    outputPath,
    sourcePath,
    totalSeconds,
  }: {
    id: string;
    onProgress: (progress: PlaybackConversionProgress) => void;
    options: string[];
    outputPath: string;
    sourcePath: string;
    totalSeconds: null | number;
  },
) => {
  const { default: ffmpeg } = await import('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);
  const command = (
    ffmpeg(sourcePath) as unknown as ConversionCommand
  ).outputOptions(options);

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
  } catch (error) {
    if (cancelledConversions.has(id)) {
      throw new Error(CONVERSION_CANCELLED, { cause: error });
    }
    throw error;
  } finally {
    activeConversions.delete(id);
  }
};

/**
 * Converts `request.sourcePath` into an H.264 / AAC MP4 at
 * `request.outputPath`, reporting progress along the way, with the
 * graphics card's encoder when this computer has one that works (see
 * chooseEncoder). Rejects with CONVERSION_CANCELLED once
 * cancelPlaybackConversion is called for it; a partial output is deleted
 * either way.
 * @returns The video encoder used ('copy' when only the sound needed it).
 */
export const convertForPlayback = async (
  ffmpegPath: string,
  request: PlaybackConversionRequest,
  onProgress: (progress: PlaybackConversionProgress) => void,
): Promise<PlaybackConversionResult> => {
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
  const run = (encoder: null | VideoEncoder) =>
    runConversion(ffmpegPath, {
      id,
      onProgress,
      options: getConversionOptions({
        encoder,
        threads: getThreadCount(),
        toneMap,
      }),
      outputPath,
      sourcePath,
      totalSeconds,
    });

  let encoder = keepVideo ? null : await chooseEncoder(ffmpegPath);
  try {
    await run(encoder);
  } catch (error) {
    if (!encoder || encoder === SOFTWARE_ENCODER || isCancellation(error)) {
      cancelledConversions.delete(id);
      throw error;
    }
    // A graphics-card encoder that passed its one-frame test can still fail
    // on a real file (a driver, a size it won't take): x264 from now on.
    encoderChoices.set(ffmpegPath, Promise.resolve(SOFTWARE_ENCODER));
    encoder = SOFTWARE_ENCODER;
    onProgress({ id, percent: 0 });
    try {
      await run(encoder);
    } finally {
      cancelledConversions.delete(id);
    }
  }
  cancelledConversions.delete(id);
  onProgress({ id, percent: 100 });
  return { encoder: encoder?.name ?? 'copy' };
};

/** Stops a conversion started by convertForPlayback. False if none was running. */
export const cancelPlaybackConversion = (id: string) => {
  const command = activeConversions.get(id);
  if (!command) return false;
  cancelledConversions.add(id);
  command.kill('SIGKILL');
  return true;
};
