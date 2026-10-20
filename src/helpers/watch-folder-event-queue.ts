import { debounce } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';

// A watched-folder (chokidar) event as forwarded by the main process on
// 'watchFolderUpdate': { changedPath, day, event }.
export type WatchFolderEvent = Record<string, string>;

// How long the queue waits for one event before moving on to the next, so an
// event that never settles (e.g. a <video> element reading a media file that
// fires neither loadedmetadata nor error) can't hold up every later event.
// Generous, as one event can do slow work on a cloud-synced folder.
const DEFAULT_EVENT_TIMEOUT_MS = 2 * 60_000;

// A day-folder event removes every watched item of its day, so it affects
// every file of that day, not just its own path.
const DAY_FOLDER_EVENTS = new Set(['addDir', 'unlinkDir']);

/**
 * Queues watched-folder events and processes them one at a time, in order.
 *
 * Bursts are coalesced by a debounce, and an event repeating the latest
 * pending event for the same file (same type) is merged into it: that one
 * reads the file only when it's processed, so it gives the same result. Any
 * other event is queued, so the outcome always matches the last event per
 * file: add, unlink, add keeps all three. A day-folder event is never merged,
 * and nothing queued before it absorbs a later event of its day.
 *
 * Only one drain runs per generation: events queued while one is in progress
 * are picked up by it once its current batch is done, instead of a second
 * drain starting alongside it (the debounce doesn't wait for async work, and
 * each event can do slow filesystem work on cloud-synced folders). Pending
 * events stop merging as soon as their batch is taken, so the same event
 * arriving later (the file changed again) is processed again.
 *
 * clear() starts a new generation: a drain of the old one stops where it is
 * without touching the queue, so even an old event that never settles can't
 * block the new folder's events. Within a generation, an event still running
 * after eventTimeoutMs is logged and left to finish on its own while the
 * queue moves on.
 */
export function createWatchFolderEventQueue(
  processEvent: (event: WatchFolderEvent) => Promise<void>,
  debounceMs = 100,
  eventTimeoutMs = DEFAULT_EVENT_TIMEOUT_MS,
) {
  const pendingEvents: WatchFolderEvent[] = [];
  // For each day, the type of the latest pending event of each of its files.
  const latestPendingTypes = new Map<string, Map<string, string>>();
  // Bumped by clear(), so a drain in progress stops working through a batch
  // taken before it (e.g. events from a folder that is no longer watched).
  let generation = 0;
  // The generation of the drain in progress, if any.
  let drainingGeneration: number | undefined;

  const runEvent = async (event: WatchFolderEvent) => {
    try {
      await processEvent(event);
    } catch (error) {
      errorCatcher(error, {
        contexts: {
          fn: {
            day: event.day,
            event: event.event,
            name: 'processWatchFolderEvent',
          },
        },
      });
    }
  };

  const processSafely = async (event: WatchFolderEvent) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<boolean>((resolve) => {
      timeoutId = setTimeout(() => resolve(true), eventTimeoutMs);
    });
    const timedOut = await Promise.race([
      runEvent(event).then(() => false),
      timeout,
    ]);
    clearTimeout(timeoutId);
    if (!timedOut) return;
    log(
      `Stopped waiting for a watched-folder event after ${eventTimeoutMs} ms; moving on to the next one`,
      'watchedFolder',
      'warn',
      { day: event.day, event: event.event },
    );
  };

  const drain = async () => {
    // The running drain picks up anything queued since it started.
    if (drainingGeneration === generation) return;
    const drainGeneration = generation;
    const isCurrent = () => drainGeneration === generation;
    drainingGeneration = drainGeneration;
    try {
      while (isCurrent() && pendingEvents.length) {
        const batch = pendingEvents.splice(0);
        latestPendingTypes.clear();
        for (const event of batch) {
          if (!isCurrent()) break;
          await processSafely(event); // NOSONAR: sequential - watch-folder events apply in order
        }
      }
    } finally {
      // A drain from before clear() leaves the new generation's state alone.
      if (isCurrent()) drainingGeneration = undefined;
    }
  };

  const scheduleDrain = debounce(() => {
    void drain();
  }, debounceMs);

  // Whether the event repeats the latest pending event for its file, and so
  // needn't be queued. Records it as that file's latest pending event if not.
  const mergeIntoPending = (event: WatchFolderEvent) => {
    const day = event.day ?? '';
    const eventType = event.event ?? '';
    if (DAY_FOLDER_EVENTS.has(eventType)) {
      // An event of this day queued before it must not absorb a later copy,
      // which would then apply before the day is cleared instead of after.
      latestPendingTypes.delete(day);
      return false;
    }
    const changedPath = event.changedPath ?? '';
    const latestTypes =
      latestPendingTypes.get(day) ?? new Map<string, string>();
    if (latestTypes.get(changedPath) === eventType) return true;
    latestTypes.set(changedPath, eventType);
    latestPendingTypes.set(day, latestTypes);
    return false;
  };

  const queue = (event: WatchFolderEvent) => {
    if (mergeIntoPending(event)) return;
    pendingEvents.push(event);
    scheduleDrain();
  };

  const clear = () => {
    generation++;
    pendingEvents.length = 0;
    latestPendingTypes.clear();
    scheduleDrain.cancel();
  };

  return { clear, queue };
}
