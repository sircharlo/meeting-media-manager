import { debounce } from 'quasar';
import { errorCatcher } from 'src/helpers/error-catcher';

// A watched-folder (chokidar) event as forwarded by the main process on
// 'watchFolderUpdate': { changedPath, day, event }.
export type WatchFolderEvent = Record<string, string>;

const getEventKey = (event: WatchFolderEvent) =>
  `${event.event}:${event.changedPath || ''}:${event.day || ''}`;

/**
 * Queues watched-folder events and processes them one at a time, in order.
 *
 * Bursts are coalesced by a debounce, and identical events still waiting are
 * only processed once. Only one drain ever runs: events queued while one is
 * in progress are picked up by it once its current batch is done, instead of
 * a second drain starting alongside it (the debounce doesn't wait for async
 * work, and each event can do slow filesystem work on cloud-synced folders).
 * An event's key is released as soon as its batch is taken, so the same
 * event arriving later (the file changed again) is processed again.
 */
export function createWatchFolderEventQueue(
  processEvent: (event: WatchFolderEvent) => Promise<void>,
  debounceMs = 100,
) {
  const pendingEvents: WatchFolderEvent[] = [];
  const pendingEventKeys = new Set<string>();
  let draining = false;
  // Bumped by clear(), so a drain in progress stops working through a batch
  // taken before it (e.g. events from a folder that is no longer watched).
  let generation = 0;

  const processSafely = async (event: WatchFolderEvent) => {
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

  const drain = async () => {
    // The running drain picks up anything queued since it started.
    if (draining) return;
    draining = true;
    try {
      while (pendingEvents.length) {
        const batchGeneration = generation;
        const batch = pendingEvents.splice(0);
        pendingEventKeys.clear();
        for (const event of batch) {
          if (batchGeneration !== generation) break;
          await processSafely(event); // NOSONAR: sequential - watch-folder events apply in order
        }
      }
    } finally {
      draining = false;
    }
  };

  const scheduleDrain = debounce(() => {
    void drain();
  }, debounceMs);

  const queue = (event: WatchFolderEvent) => {
    const eventKey = getEventKey(event);
    if (pendingEventKeys.has(eventKey)) return;
    pendingEventKeys.add(eventKey);
    pendingEvents.push(event);
    scheduleDrain();
  };

  const clear = () => {
    generation++;
    pendingEvents.length = 0;
    pendingEventKeys.clear();
    scheduleDrain.cancel();
  };

  return { clear, queue };
}
