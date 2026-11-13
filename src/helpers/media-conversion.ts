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
 * can: H.264 / AAC MP4s, which play everywhere, or AAC M4As for sound-only
 * files (see src-electron/main/playback-conversion).
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
const { ensureDir, move, pathExists, remove, rename, stat } = fs;

// A count picks the plural form; named values fill in the message.
const t = (key: string, values?: number | Record<string, unknown>) =>
  (i18n.global.t as (key: string, values: unknown) => string)(
    key,
    values ?? {},
  );

// Extensions whose container holds the converted H.264 / AAC as is, so the
// converted file can take the original's place, path and all.
const IN_PLACE_EXTENSIONS = new Set(['m4a', 'm4v', 'mov', 'mp4']);
const DATE_FOLDER_NAME = /^\d{4}-\d{2}-\d{2}$/;
const MEETING_SOON_MINUTES = 60;
const NOTICE_GROUPING_MS = 1500;
const MOVE_RETRIES = 5;
const MOVE_RETRY_DELAY_MS = 1000;
const CHECK_CONCURRENCY = 2;

/** Thrown where a conversion stops once it's cancelled. */
class ConversionCancelled extends Error {}

/** A failure the user can act on, already said in their language. */
class ConversionFailure extends Error {}

/**
 * What a file converts into: an MP4, or an M4A for a sound-only file. The
 * media window picks its player by the extension, and plays an MP4 in a
 * video player, black where the yeartext should show.
 */
const getConvertedExtension = (sourcePath: string) =>
  isAudio(sourcePath) ? '.m4a' : '.mp4';

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

const hasItemsForFile = (path: string) => findItemsForFile(path).length > 0;

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
// Which notice is the open one: one closed late mustn't forget a newer one.
let noticeCount = 0;
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
  const notice = ++noticeCount;
  updateNotice = createTemporaryNotification({
    ...getNoticeContent(items),
    // Closed some other way too (switching profiles closes every notice):
    // updating it then shows nothing, so the next file found opens a new one.
    onDismiss: () => {
      if (notice === noticeCount) forgetNotice();
    },
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
  if (running !== undefined) return running;

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
 * for it, and offers to convert it. Playing it stays possible: that it
 * failed once doesn't make it fail every time.
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
    problem: {
      codec: 'unknown',
      fromPlayback: true,
      missing: isAudio(path) ? 'sound' : 'picture',
    },
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
 * it), named after the file and what makes it unique (its path, and the size
 * and modification time in `key`: a replaced file needs converting again).
 */
const getWatchedConversionPath = async (sourcePath: string, key: string) => {
  const dateFolder = basename(dirname(sourcePath));
  const folder = DATE_FOLDER_NAME.test(dateFolder) ? dateFolder : 'undated';
  const name = basename(sourcePath, extname(sourcePath));
  // The same path either way: the folder watcher reports Windows paths with
  // backslashes, items carry them as file URLs.
  const hash = await hashOf(`${normalize(sourcePath)}|${key}`);
  return join(
    await getConvertedMediaPath(),
    folder,
    `${name}-${hash}${getConvertedExtension(sourcePath)}`,
  );
};

/**
 * The converted copy of a watched-folder file, if it was converted on this
 * computer and hasn't changed since. Never throws.
 */
export const findWatchedConversion = async (sourcePath: string) => {
  try {
    const path = await getWatchedConversionPath(
      sourcePath,
      await getFileKey(sourcePath),
    );
    return (await pathExists(path)) ? path : null;
  } catch {
    return null;
  }
};

const isInFolder = (path: string, folder: string) =>
  normalize(path)
    .toLowerCase()
    .startsWith(`${normalize(folder).toLowerCase()}/`);

/**
 * Deletes the converted copies these items played, and their thumbnails,
 * once no item plays them any more: their watched file left the folder (the
 * items still playing it are gone). Only ever files in the Converted Media
 * folder. Never throws.
 * @param fileUrls The files the items that were taken off played.
 */
export const removeOrphanedConversions = async (
  fileUrls: (string | undefined)[],
) => {
  try {
    const folder = await getConvertedMediaPath();
    const orphans = [...new Set(fileUrls)]
      .filter((url): url is string => !!url)
      .map((url) => fileUrlToPath(url))
      .filter((path) => isInFolder(path, folder) && !hasItemsForFile(path));
    await Promise.all(
      orphans
        .flatMap((path) => [path, changeExt(path, '.jpg')])
        .map((path) => remove(path).catch(() => undefined)),
    );
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: { count: fileUrls.length, name: 'removeOrphanedConversions' },
      },
    });
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

// Conversions past the point of no return: their file is going in place, so
// cancelling can no longer take it back.
const committedJobs = new Set<string>();

/**
 * Cancels a conversion, at any point before its file is in place: a queued
 * one never starts, ffmpeg is stopped (or never started), and a finished one
 * isn't put in place.
 */
export const cancelMediaConversion = async (id: string) => {
  const store = useMediaConversionStore();
  const job = store.jobs.find((j) => j.id === id);
  if (!job || !isActiveConversion(job) || committedJobs.has(id)) return;
  const wasConverting = job.status === 'converting';
  // The conversion stops at its next step, and ffmpeg at once.
  store.updateJob(id, { finishedAt: Date.now(), status: 'cancelled' });
  if (wasConverting) await cancelPlaybackConversion(id);
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

const stopIfCancelled = (id: string) => {
  if (isCancelled(id)) throw new ConversionCancelled(id);
};

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

/**
 * Records why a conversion stopped: it was cancelled, or it failed (told to
 * Sentry when that wasn't expected).
 */
const recordStop = (
  job: MediaConversionJob,
  error: unknown,
  tempPath: string,
) => {
  const store = useMediaConversionStore();
  if (
    error instanceof ConversionCancelled ||
    // The main process's, through IPC.
    (error instanceof Error &&
      error.message.includes('conversion-cancelled')) ||
    isCancelled(job.id)
  ) {
    store.updateJob(job.id, { finishedAt: Date.now(), status: 'cancelled' });
    return;
  }
  const expected = error instanceof ConversionFailure;
  store.updateJob(job.id, {
    error: expected ? error.message : t('media-conversion-failed-error'),
    finishedAt: Date.now(),
    status: 'failed',
  });
  if (expected) return;
  errorCatcher(
    new Error(
      withoutFileName(error, [job.sourcePath, tempPath].filter(Boolean)),
    ),
    {
      contexts: {
        fn: {
          codec: job.problem.codec,
          extension: extname(job.sourcePath).toLowerCase().slice(1),
          missing: job.problem.missing,
          name: 'convertMediaForPlayback',
          source: job.source,
        },
      },
    },
  );
};

const convertJob = async (id: string) => {
  const store = useMediaConversionStore();
  const job = store.jobs.find((j) => j.id === id);
  if (!job) return;
  store.updateJob(id, { startedAt: Date.now(), status: 'preparing' });
  const temp = { path: '' };
  try {
    const encoder = await convertAndPlace(job, temp);
    store.updateJob(id, {
      finishedAt: Date.now(),
      percent: 100,
      status: 'done',
    });
    log('Converted media to play on this computer', 'mediaProcessing', 'log', {
      encoder,
      missing: job.problem.missing,
      seconds: Math.round((Date.now() - (job.startedAt ?? Date.now())) / 1000),
    });
  } catch (error) {
    recordStop(job, error, temp.path);
  } finally {
    committedJobs.delete(id);
    if (temp.path) await remove(temp.path).catch(() => undefined);
  }
};

/**
 * Converts a job's file and puts the result in place, stopping wherever it's
 * cancelled until then. Sets `temp.path` as soon as it's known, for the
 * caller to delete whatever happens.
 * @returns The video encoder used.
 */
const convertAndPlace = async (
  job: MediaConversionJob,
  temp: { path: string },
) => {
  const { id } = job;
  const store = useMediaConversionStore();
  // The version converted: a watched file's copy is filed under it, and a
  // file that changes meanwhile isn't replaced with what it was.
  const sourceKey = await getFileKey(job.sourcePath).catch(() => null);
  if (!sourceKey) {
    throw new ConversionFailure(t('media-conversion-failed-missing'));
  }
  const ffmpegPath = await setupFFmpeg();
  stopIfCancelled(id);
  if (!ffmpegPath) {
    throw new ConversionFailure(t('media-conversion-failed-no-converter'));
  }
  listenForProgress();
  temp.path = join(
    await getTempPath(),
    `conversion-${id}${getConvertedExtension(job.sourcePath)}`,
  );
  await ensureDir(dirname(temp.path));
  // Nothing awaited from here to the request, so a cancel can't slip in
  // between and be overwritten.
  stopIfCancelled(id);
  store.updateJob(id, {
    percent: job.durationSeconds ? 0 : null,
    status: 'converting',
  });
  const { encoder } = await convertForPlayback(ffmpegPath, {
    durationSeconds: job.durationSeconds,
    id,
    keepVideo: job.problem.missing === 'sound',
    outputPath: temp.path,
    sourcePath: job.sourcePath,
  });
  // Cancelled just as ffmpeg finished.
  stopIfCancelled(id);
  const finalPath = await placeConvertedFile(job, temp.path, sourceKey);
  store.checks[finalPath] = {
    key: await getFileKey(finalPath),
    problem: null,
  };
  await updateConvertedItems(job, finalPath);
  return encoder;
};

const isPlaying = (path: string) => {
  const { mediaPlaying } = useCurrentStateStore();
  return !!mediaPlaying.url && fileUrlToPath(mediaPlaying.url) === path;
};

/**
 * Waits while `inUse` says a file plays. Given the conversion's id, a cancel
 * meanwhile stops it.
 */
const waitWhilePlaying = async (inUse: () => boolean, id?: string) => {
  while (inUse()) {
    if (id) stopIfCancelled(id);
    await sleep(MOVE_RETRY_DELAY_MS); // NOSONAR: waits for playback to stop
  }
};

/**
 * Stops a conversion whose file changed, or went away, while it converted:
 * what it made is of what the file was.
 */
const assertUnchanged = async (job: MediaConversionJob, sourceKey: string) => {
  const key = await getFileKey(job.sourcePath).catch(() => null);
  if (key === sourceKey) return;
  log(
    'The file changed while it converted: not using the conversion',
    'mediaProcessing',
    'warn',
    { before: sourceKey, now: key, source: job.source },
  );
  throw new ConversionFailure(
    t(
      key ? 'media-conversion-failed-error' : 'media-conversion-failed-missing',
    ),
  );
};

/**
 * Where an imported file's converted copy goes: its own path when its
 * container holds H.264 / AAC as is, otherwise an .mp4 (an .m4a for sound
 * only) beside it, never over another file.
 */
const getImportedDestination = async ({
  id,
  sourcePath,
}: MediaConversionJob) => {
  const extension = extname(sourcePath).toLowerCase().slice(1);
  if (IN_PLACE_EXTENSIONS.has(extension)) return sourcePath;
  const name = basename(sourcePath, extname(sourcePath));
  const convertedExtension = getConvertedExtension(sourcePath);
  const beside = join(dirname(sourcePath), `${name}${convertedExtension}`);
  return (await pathExists(beside))
    ? join(
        dirname(sourcePath),
        `${name}-${id.slice(0, 8)}${convertedExtension}`,
      )
    : beside;
};

/**
 * Runs a file operation, retrying for a moment: a file just shown (its
 * thumbnail, a preview) or just written (antivirus) can stay locked.
 */
const withRetries = async (operation: () => Promise<unknown>) => {
  for (let attempt = 1; ; attempt++) {
    try {
      await operation(); // NOSONAR: retried in order
      return;
    } catch (error) {
      if (attempt >= MOVE_RETRIES) throw error;
      await sleep(MOVE_RETRY_DELAY_MS); // NOSONAR: retried in order
    }
  }
};

/**
 * Puts the converted file at `destination` without losing what's there until
 * it's fully replaced: the file is moved beside it first (a copy when the
 * cache is on another drive, which can fail half-way, on a full disk or a
 * dropped network share), then renamed over it in one step. If either
 * fails, `destination` is left as it was. A cancel stops it until then.
 */
const putInPlace = async (
  job: MediaConversionJob,
  tempPath: string,
  destination: string,
) => {
  // Not a media file's name, so nothing takes it for one meanwhile.
  const staging = `${destination}.${job.id.slice(0, 8)}.converting`;
  try {
    await withRetries(() => move(tempPath, staging, { overwrite: true }));
    stopIfCancelled(job.id);
    committedJobs.add(job.id);
    await withRetries(() => rename(staging, destination));
  } catch (error) {
    committedJobs.delete(job.id);
    await remove(staging).catch(() => undefined);
    throw error;
  }
};

/**
 * Deletes the thumbnails M³ saved beside the original and its replacement
 * (see getThumbnailUrl): pictures of what the original showed, a black
 * frame when its picture didn't play. A sound-only file has none, and a
 * picture that's in the media list itself (an image named like the video)
 * stays.
 */
const removeStaleThumbnails = async (
  job: MediaConversionJob,
  destination: string,
) => {
  if (isAudio(job.sourcePath)) return;
  const thumbnails = new Set(
    [job.sourcePath, destination].map((path) => changeExt(path, '.jpg')),
  );
  await Promise.all(
    [...thumbnails]
      .filter((path) => !hasItemsForFile(path))
      .map((path) => remove(path).catch(() => undefined)),
  );
};

/**
 * Puts the converted file where it belongs, once the file stops playing. An
 * imported file is replaced (it's M³'s own copy); a watched one gets its
 * converted copy in the cache, filed under the version converted.
 * @returns Where it went.
 */
const placeConvertedFile = async (
  job: MediaConversionJob,
  tempPath: string,
  sourceKey: string,
) => {
  await waitWhilePlaying(() => isPlaying(job.sourcePath), job.id);
  await assertUnchanged(job, sourceKey);

  if (job.source === 'watched') {
    const destination = await getWatchedConversionPath(
      job.sourcePath,
      sourceKey,
    );
    await ensureDir(dirname(destination));
    await putInPlace(job, tempPath, destination);
    return destination;
  }

  const destination = await getImportedDestination(job);
  await putInPlace(job, tempPath, destination);
  if (destination !== job.sourcePath) {
    await remove(job.sourcePath).catch(() => undefined);
  }
  await removeStaleThumbnails(job, destination);
  return destination;
};

/**
 * Points the converted item at its new file, with a fresh thumbnail, once
 * it's no longer playing the old one. An item added from the website
 * becomes a local file like any other: its size is the new file's, and its
 * stream (the original, which doesn't play here) is no longer played or
 * downloaded again in its place.
 */
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
  const { size } = await stat(finalPath);
  // Started again meanwhile: the item stays the one playing until it stops.
  await waitWhilePlaying(() =>
    items.some(
      (item) =>
        !!item.fileUrl &&
        item.fileUrl !== fileUrl &&
        isPlaying(fileUrlToPath(item.fileUrl)),
    ),
  );
  for (const item of items) {
    item.fileUrl = fileUrl;
    item.thumbnailUrl = thumbnailUrl;
    if (!item.duration && duration) item.duration = duration;
    if (item.filesize !== undefined) item.filesize = size;
    delete item.streamUrl;
  }
};
