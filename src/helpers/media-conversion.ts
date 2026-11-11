import type { QNotifyUpdateOptions } from 'quasar';
import type { MediaConversionJob, MediaItem, PlaybackProblem } from 'src/types';

import { i18n } from 'boot/i18n';
import { getTodaysMeetingStartDateTime } from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getThumbnailUrl, setupFFmpeg } from 'src/helpers/fs';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { log, uuid } from 'src/shared/vanilla';
import { getConvertedMediaPath, getTempPath } from 'src/utils/fs';
import {
  findPlaybackProblem,
  getMetadataFromMediaPath,
  isAudio,
  isVideo,
} from 'src/utils/media';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import {
  isActiveConversion,
  useMediaConversionStore,
} from 'stores/media-conversion';
import { ref, watch } from 'vue';

/**
 * Files that can't play on this computer, and converting them into ones that
 * can: H.264 / AAC MP4s, which play everywhere (see
 * src-electron/main/playback-conversion).
 *
 * Whether a file plays depends on the computer, not just the file (HEVC only
 * decodes in hardware), so a file is checked when it's added, again in each
 * session when its date's media list shows, and once more if it fails to
 * play. Converting is never automatic: it takes a lot of processing power,
 * so the user confirms it, warned when the meeting is close.
 *
 * An imported file is M³'s own copy, so the converted file replaces it. A
 * watched-folder file is the user's (and can be synced to other computers
 * that play it fine), so the converted copy is kept in the cache instead,
 * and the watched folder's item plays it.
 */

const {
  basename,
  cancelPlaybackConversion,
  changeExt,
  convertForPlayback,
  dirname,
  extname,
  fileUrlToPath,
  fs,
  join,
  normalize,
  onMediaConversionProgress,
  pathToFileURL,
} = globalThis.electronApi;
const { ensureDir, move, pathExists, remove, stat } = fs;

// A count picks the plural form; named values fill in the message.
const t = (key: string, values?: number | Record<string, unknown>) =>
  (i18n.global.t as (key: string, values: unknown) => string)(
    key,
    values ?? {},
  );

// Extensions whose container holds the converted H.264 / AAC as is, so the
// converted file can take the original's place, path and all.
const IN_PLACE_EXTENSIONS = new Set(['m4v', 'mov', 'mp4']);
const DATE_FOLDER_NAME = /^\d{4}-\d{2}-\d{2}$/;
const MEETING_SOON_MINUTES = 60;
const NOTICE_GROUPING_MS = 1500;
const MOVE_RETRIES = 5;
const MOVE_RETRY_DELAY_MS = 1000;
const CHECK_CONCURRENCY = 2;

/** A failure the user can act on, already said in their language. */
class ConversionFailure extends Error {}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

// ─── Finding items ───────────────────────────────────────────────────────────

// Every profile's, not just the open one's: a conversion can finish after
// switching to another profile, and its item still needs its new file.
const forEachMediaItem = (visit: (item: MediaItem) => void) => {
  const walk = (items?: MediaItem[]) => {
    for (const item of items ?? []) {
      visit(item);
      walk(item.children);
    }
  };
  for (const days of Object.values(useJwStore().lookupPeriod)) {
    for (const day of days ?? []) {
      for (const section of day.mediaSections ?? []) walk(section.items);
    }
  }
};

const findItems = (match: (item: MediaItem) => boolean) => {
  const found: MediaItem[] = [];
  forEachMediaItem((item) => {
    if (match(item)) found.push(item);
  });
  return found;
};

const findItemsForFile = (path: string) =>
  findItems((item) => !!item.fileUrl && fileUrlToPath(item.fileUrl) === path);

/** Whether M³ can convert this item: a file imported into it, or a watched one. */
export const canConvertMediaItem = (item: MediaItem) =>
  (item.source === 'additional' || item.source === 'watched') &&
  !!item.fileUrl &&
  (item.isVideo || item.isAudio);

// ─── Checking ────────────────────────────────────────────────────────────────

const getFileKey = async (path: string) => {
  const { mtimeMs, size } = await stat(path);
  return `${size}:${mtimeMs}`;
};

const checksInFlight = new Map<string, Promise<null | PlaybackProblem>>();
let checksRunning = 0;
const checkQueue: (() => void)[] = [];

// Each check loads the file in a hidden <video>: a couple at a time is
// plenty, even for a long media list.
const withCheckSlot = async <T>(check: () => Promise<T>) => {
  if (checksRunning >= CHECK_CONCURRENCY) {
    await new Promise<void>((resolve) => {
      checkQueue.push(resolve);
    });
  }
  checksRunning++;
  try {
    return await check();
  } finally {
    checksRunning--;
    checkQueue.shift()?.();
  }
};

// ─── The "can't play" notice ─────────────────────────────────────────────────

// The files the open notice is about. It only lists those still waiting to
// be converted (not converting, converted or failed), so converting one from
// its item takes it off, and the notice closes once none are left.
const noticePaths = ref<string[]>([]);
let pendingNotices: string[] = [];
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
let updateNotice: ((props?: QNotifyUpdateOptions) => void) | undefined;
let stopWatchingNotice: (() => void) | undefined;

const isWaitingForConversion = (item: MediaItem) => {
  if (!canConvertMediaItem(item) || !item.fileUrl) return false;
  const store = useMediaConversionStore();
  if (!store.problemFor(fileUrlToPath(item.fileUrl))) return false;
  const job = store.jobForItem(item.uniqueId);
  return !job || job.status === 'cancelled';
};

const getNoticeItems = () => [
  ...new Map(
    noticePaths.value
      .flatMap(findItemsForFile)
      .filter(isWaitingForConversion)
      .map((item) => [item.uniqueId, item]),
  ).values(),
];

const forgetNotice = () => {
  noticePaths.value = [];
  updateNotice = undefined;
};

const getNoticeContent = (items: MediaItem[]) => {
  const [first] = items;
  return {
    actions: [
      {
        color: 'dark',
        handler: () => {
          requestMediaConversion(getNoticeItems());
          forgetNotice();
        },
        label: t(items.length === 1 ? 'convert-media' : 'convert-all-media'),
      },
      { color: 'dark', handler: forgetNotice, icon: 'close', round: true },
    ],
    caption: t('media-cannot-play-here-notice-caption', items.length),
    message:
      items.length === 1 && first
        ? t('media-cannot-play-here-notice', { title: first.title })
        : t('media-cannot-play-here-notice-many', { count: items.length }),
  };
};

/** Opens, updates or closes the notice to match the files still waiting. */
const refreshNotice = () => {
  const items = getNoticeItems();
  if (!items.length) {
    updateNotice?.();
    forgetNotice();
    return;
  }
  if (updateNotice) {
    updateNotice(getNoticeContent(items));
    return;
  }
  updateNotice = createTemporaryNotification({
    ...getNoticeContent(items),
    timeout: 0,
    type: 'warning',
  });
};

/** Says which files can't play, a moment after they're found, in one notice. */
const noticeUnplayable = (path: string) => {
  if (!pendingNotices.includes(path)) pendingNotices.push(path);
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    const paths = pendingNotices;
    pendingNotices = [];
    noticePaths.value = [...new Set([...noticePaths.value, ...paths])];
    // Kept up to date from then on: conversions starting, files changing.
    stopWatchingNotice ??= watch(
      () =>
        getNoticeItems()
          .map((item) => item.uniqueId)
          .join('|'),
      refreshNotice,
    );
    refreshNotice();
  }, NOTICE_GROUPING_MS);
};

/**
 * Checks whether a file plays on this computer, once per session (again if
 * the file changes). Never throws.
 * @param fileUrlOrPath The file.
 * @param options.notify Say so in a notice if it doesn't, the first time.
 * @param options.report Also tell Sentry (without the file name), for files
 * just imported.
 * @returns What keeps it from playing, or null.
 */
export const checkMediaPlayback = async (
  fileUrlOrPath: string,
  { notify = false, report = false } = {},
): Promise<null | PlaybackProblem> => {
  const path = fileUrlToPath(fileUrlOrPath);
  if (!path || !(isVideo(path) || isAudio(path))) return null;
  const running = checksInFlight.get(path);
  if (running) return running;

  const check = (async () => {
    let key: string;
    try {
      key = await getFileKey(path);
    } catch {
      return null; // not there (yet): checked once it is
    }
    const store = useMediaConversionStore();
    const known = store.checks[path];
    if (known?.key === key) return known.problem;

    const problem = await withCheckSlot(() =>
      findPlaybackProblem(path, { report }),
    );
    store.checks[path] = { key, problem };
    if (problem && notify && !known?.problem) noticeUnplayable(path);
    return problem;
  })().finally(() => checksInFlight.delete(path));

  checksInFlight.set(path, check);
  return check;
};

/**
 * Records a file that failed to play because this computer has no decoder
 * for it, and offers to convert it.
 */
export const markUnplayable = async (fileUrl: string) => {
  const path = fileUrlToPath(fileUrl);
  if (!path) return;
  const store = useMediaConversionStore();
  if (store.problemFor(path)) {
    noticeUnplayable(path);
    return;
  }
  let key: string;
  try {
    key = await getFileKey(path);
  } catch {
    return;
  }
  store.checks[path] = {
    key,
    problem: { codec: 'unknown', missing: 'picture' },
  };
  noticeUnplayable(path);
};

// ─── Watched-folder copies ───────────────────────────────────────────────────

const hashOf = async (text: string) => {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12);
};

/**
 * Where the converted copy of a watched-folder file goes: in the cache, in a
 * folder named after the watched file's date folder (so it's cleaned up with
 * it), named after the file and what makes it unique (its path, size and
 * modification time: a replaced file needs converting again).
 */
const getWatchedConversionPath = async (sourcePath: string) => {
  const dateFolder = basename(dirname(sourcePath));
  const folder = DATE_FOLDER_NAME.test(dateFolder) ? dateFolder : 'undated';
  const name = basename(sourcePath, extname(sourcePath));
  // The same path either way: the folder watcher reports Windows paths with
  // backslashes, items carry them as file URLs.
  const hash = await hashOf(
    `${normalize(sourcePath)}|${await getFileKey(sourcePath)}`,
  );
  return join(await getConvertedMediaPath(), folder, `${name}-${hash}.mp4`);
};

/**
 * The converted copy of a watched-folder file, if it was converted on this
 * computer and hasn't changed since. Never throws.
 */
export const findWatchedConversion = async (sourcePath: string) => {
  try {
    const path = await getWatchedConversionPath(sourcePath);
    return (await pathExists(path)) ? path : null;
  } catch {
    return null;
  }
};

// ─── Converting ──────────────────────────────────────────────────────────────

const minutesUntilMeeting = () => {
  const start = getTodaysMeetingStartDateTime();
  if (!start) return null;
  const minutes = (start.getTime() - Date.now()) / 60_000;
  return minutes > 0 ? Math.ceil(minutes) : null;
};

/** How soon the meeting starts, if it's soon enough to warn about. */
export const getMeetingSoonMinutes = () => {
  const minutes = minutesUntilMeeting();
  return minutes !== null && minutes <= MEETING_SOON_MINUTES ? minutes : null;
};

/**
 * Asks the user to confirm converting these items (see
 * MediaConversionConfirm), leaving out the ones already converting.
 */
export const requestMediaConversion = (items: MediaItem[]) => {
  const store = useMediaConversionStore();
  const toConvert = items.filter(
    (item) =>
      canConvertMediaItem(item) &&
      !isActiveConversion(store.jobForItem(item.uniqueId)),
  );
  if (toConvert.length) store.pendingConfirmation = toConvert;
};

/** Queues the conversion of these items, once confirmed. */
export const startMediaConversion = (items: MediaItem[]) => {
  const store = useMediaConversionStore();
  for (const item of items) {
    if (!canConvertMediaItem(item) || !item.fileUrl) continue;
    if (isActiveConversion(store.jobForItem(item.uniqueId))) continue;
    const sourcePath = fileUrlToPath(item.fileUrl);
    store.jobs.push({
      durationSeconds: item.duration || undefined, // NOSONAR: 0 is unknown
      id: uuid(),
      mediaUniqueId: item.uniqueId,
      percent: null,
      problem: store.problemFor(sourcePath) ?? {
        codec: 'unknown',
        missing: 'picture',
      },
      source: item.source === 'watched' ? 'watched' : 'additional',
      sourcePath,
      status: 'queued',
      title: item.title || basename(sourcePath), // NOSONAR: '' uses the file name
    });
  }
  void runQueue();
};

export const cancelMediaConversion = async (id: string) => {
  const store = useMediaConversionStore();
  const job = store.jobs.find((j) => j.id === id);
  if (!job) return;
  if (job.status === 'converting') {
    await cancelPlaybackConversion(id);
    return;
  }
  if (isActiveConversion(job)) {
    store.updateJob(id, { finishedAt: Date.now(), status: 'cancelled' });
  }
};

let stopListening: (() => void) | undefined;
const listenForProgress = () => {
  stopListening ??= onMediaConversionProgress(({ id, percent }) => {
    const store = useMediaConversionStore();
    const job = store.jobs.find((j) => j.id === id);
    if (job?.status === 'converting') {
      store.updateJob(id, { percent });
    }
  });
};

let queueRunning = false;

/** Converts the queued files one at a time: each takes a lot of the processor. */
const runQueue = async () => {
  if (queueRunning) return;
  queueRunning = true;
  try {
    const store = useMediaConversionStore();
    let next = store.jobs.find((job) => job.status === 'queued');
    while (next) {
      await convertJob(next.id); // NOSONAR: one at a time on purpose
      next = store.jobs.find((job) => job.status === 'queued');
    }
  } finally {
    queueRunning = false;
  }
};

const isCancelled = (id: string) =>
  useMediaConversionStore().jobs.find((job) => job.id === id)?.status ===
  'cancelled';

/** Its message, with the file's path and name taken out. */
const withoutFileName = (error: unknown, paths: string[]) => {
  let message = error instanceof Error ? error.message : String(error);
  for (const path of paths) {
    message = message
      .replaceAll(path, '<file>')
      .replaceAll(basename(path), '<file>');
  }
  return message;
};

const convertJob = async (id: string) => {
  const store = useMediaConversionStore();
  const job = store.jobs.find((j) => j.id === id);
  if (!job) return;
  store.updateJob(id, { startedAt: Date.now(), status: 'preparing' });
  let tempPath = '';
  try {
    if (!(await pathExists(job.sourcePath))) {
      throw new ConversionFailure(t('media-conversion-failed-missing'));
    }
    const ffmpegPath = await setupFFmpeg();
    if (isCancelled(id)) return;
    if (!ffmpegPath) {
      throw new ConversionFailure(t('media-conversion-failed-no-converter'));
    }
    listenForProgress();
    tempPath = join(await getTempPath(), `conversion-${id}.mp4`);
    await ensureDir(dirname(tempPath));
    store.updateJob(id, {
      percent: job.durationSeconds ? 0 : null,
      status: 'converting',
    });
    await convertForPlayback(ffmpegPath, {
      durationSeconds: job.durationSeconds,
      id,
      keepVideo: job.problem.missing === 'sound',
      outputPath: tempPath,
      sourcePath: job.sourcePath,
    });
    const finalPath = await placeConvertedFile(job, tempPath);
    store.checks[finalPath] = {
      key: await getFileKey(finalPath),
      problem: null,
    };
    await updateConvertedItems(job, finalPath);
    store.updateJob(id, {
      finishedAt: Date.now(),
      percent: 100,
      status: 'done',
    });
    log('Converted media to play on this computer', 'mediaProcessing', 'log', {
      missing: job.problem.missing,
      seconds: Math.round((Date.now() - (job.startedAt ?? Date.now())) / 1000),
    });
  } catch (error) {
    if (String(error).includes('conversion-cancelled') || isCancelled(id)) {
      store.updateJob(id, { finishedAt: Date.now(), status: 'cancelled' });
      return;
    }
    const message =
      error instanceof ConversionFailure
        ? error.message
        : t('media-conversion-failed-error');
    store.updateJob(id, {
      error: message,
      finishedAt: Date.now(),
      status: 'failed',
    });
    if (!(error instanceof ConversionFailure)) {
      const extension = extname(job.sourcePath).toLowerCase().slice(1);
      errorCatcher(
        new Error(
          withoutFileName(error, [job.sourcePath, tempPath].filter(Boolean)),
        ),
        {
          contexts: {
            fn: {
              codec: job.problem.codec,
              extension,
              missing: job.problem.missing,
              name: 'convertMediaForPlayback',
              source: job.source,
            },
          },
        },
      );
    }
  } finally {
    if (tempPath) await remove(tempPath).catch(() => undefined);
  }
};

const isPlaying = (path: string) => {
  const { mediaPlaying } = useCurrentStateStore();
  return !!mediaPlaying.url && fileUrlToPath(mediaPlaying.url) === path;
};

/**
 * Moves the converted file where it belongs. An imported file is replaced
 * (it's M³'s own copy), waiting for it to stop playing first; a watched one
 * gets its converted copy in the cache.
 */
const placeConvertedFile = async (
  job: MediaConversionJob,
  tempPath: string,
) => {
  let destination: string;
  if (job.source === 'watched') {
    destination = await getWatchedConversionPath(job.sourcePath);
    await ensureDir(dirname(destination));
  } else {
    const extension = extname(job.sourcePath).toLowerCase().slice(1);
    destination = IN_PLACE_EXTENSIONS.has(extension)
      ? job.sourcePath
      : join(
          dirname(job.sourcePath),
          `${basename(job.sourcePath, extname(job.sourcePath))}.mp4`,
        );
    if (destination !== job.sourcePath && (await pathExists(destination))) {
      destination = join(
        dirname(job.sourcePath),
        `${basename(job.sourcePath, extname(job.sourcePath))}-${job.id.slice(0, 8)}.mp4`,
      );
    }
    while (isPlaying(job.sourcePath)) await sleep(MOVE_RETRY_DELAY_MS); // NOSONAR: waits for playback to stop
  }

  // A file just shown (its thumbnail, a preview) can stay locked a moment.
  for (let attempt = 1; ; attempt++) {
    try {
      await move(tempPath, destination, { overwrite: true }); // NOSONAR: retried in order
      break;
    } catch (error) {
      if (attempt >= MOVE_RETRIES) throw error;
      await sleep(MOVE_RETRY_DELAY_MS); // NOSONAR: retried in order
    }
  }
  if (job.source === 'additional') {
    if (destination !== job.sourcePath) {
      await remove(job.sourcePath).catch(() => undefined);
    }
    // The thumbnail saved next to the file is of what the original showed,
    // a black frame when its picture didn't play.
    await Promise.all(
      [job.sourcePath, destination].map((path) =>
        remove(changeExt(path, '.jpg')).catch(() => undefined),
      ),
    );
  }
  return destination;
};

/** Points the converted item at its new file, with a fresh thumbnail. */
const updateConvertedItems = async (
  job: MediaConversionJob,
  finalPath: string,
) => {
  const fileUrl = pathToFileURL(finalPath);
  const items = findItems((item) => item.uniqueId === job.mediaUniqueId);
  const thumbnailUrl = await getThumbnailUrl(finalPath, true);
  const duration = items.some((item) => !item.duration)
    ? (await getMetadataFromMediaPath(finalPath)).format.duration || 0 // NOSONAR: NaN is unknown
    : 0;
  for (const item of items) {
    item.fileUrl = fileUrl;
    item.thumbnailUrl = thumbnailUrl;
    if (!item.duration && duration) item.duration = duration;
  }
};
