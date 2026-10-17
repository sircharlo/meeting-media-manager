import { errorCatcher } from 'src/helpers/error-catcher';
import { log } from 'src/shared/vanilla';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createWatchFolderEventQueue,
  type WatchFolderEvent,
} from '../watch-folder-event-queue';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

vi.mock('src/shared/vanilla', () => ({
  log: vi.fn(),
}));

const DAY = '2026-10-16';
const DEBOUNCE_MS = 100;
const EVENT_TIMEOUT_MS = 5_000;
const PROCESS_MS = 300;

const makeEvent = (changedPath: string, event = 'add'): WatchFolderEvent => ({
  changedPath,
  day: DAY,
  event,
});

// A promise that never settles, like a media file whose <video> element
// never fires loadedmetadata or error.
const neverSettles = () =>
  new Promise<void>(() => {
    // intentionally left pending
  });

// A processor that keeps a model of the media list the watched folder feeds,
// like updateWatchFolderRef: "add" lists a file, "unlink" removes it, and a
// day-folder event ("addDir"/"unlinkDir") removes every file of that day.
// Each event takes PROCESS_MS, and changes the list once its work is done.
const createMediaListProcessor = (initiallyListed: string[] = []) => {
  const listed = new Set(initiallyListed);
  const started: string[] = [];

  const processEvent = vi.fn(async (event: WatchFolderEvent) => {
    started.push(`${event.event}:${event.changedPath}`);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, PROCESS_MS);
    });
    const changedPath = event.changedPath ?? '';
    if (event.event === 'add') listed.add(changedPath);
    if (event.event === 'unlink') listed.delete(changedPath);
    if (event.event === 'addDir' || event.event === 'unlinkDir') {
      listed.clear();
    }
  });

  return {
    getListed: () => [...listed].sort((a, b) => a.localeCompare(b)),
    processEvent,
    started,
  };
};

// A processor that takes PROCESS_MS per event (like the fs work a real
// watch-folder event can do on a cloud-synced folder), recording the order
// in which events start and the highest number of events in flight at once.
const createSlowProcessor = () => {
  const started: string[] = [];
  let inFlight = 0;
  let maxInFlight = 0;

  const processEvent = vi.fn(async (event: WatchFolderEvent) => {
    started.push(`${event.event}:${event.changedPath}`);
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, PROCESS_MS);
    });
    inFlight--;
  });

  return {
    getMaxInFlight: () => maxInFlight,
    processEvent,
    started,
  };
};

describe('createWatchFolderEventQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(errorCatcher).mockClear();
    vi.mocked(log).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('processes events that arrive during a slow drain exactly once, in order, without a second concurrent drain', async () => {
    const { getMaxInFlight, processEvent, started } = createSlowProcessor();
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('a.jpg'));
    // The debounced drain starts and begins the slow work on a.jpg.
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(started).toEqual(['add:a.jpg']);

    // A second event lands mid-drain; its own debounce fires while a.jpg is
    // still being processed.
    queue.queue(makeEvent('b.jpg'));
    queue.queue(makeEvent('a.jpg', 'unlink'));
    await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

    expect(started).toEqual(['add:a.jpg', 'add:b.jpg', 'unlink:a.jpg']);
    expect(getMaxInFlight()).toBe(1);
  });

  it('coalesces identical events that are still pending', async () => {
    const { processEvent, started } = createSlowProcessor();
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('a.jpg'));
    queue.queue(makeEvent('a.jpg'));
    queue.queue(makeEvent('b.jpg'));
    queue.queue(makeEvent('a.jpg'));
    await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

    expect(started).toEqual(['add:a.jpg', 'add:b.jpg']);
  });

  it('processes an identical event again when it arrives after the earlier copy was taken for processing', async () => {
    const { processEvent, started } = createSlowProcessor();
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('a.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(started).toEqual(['add:a.jpg']);

    // The file changed again after its first event was already picked up:
    // this must not be dropped as a duplicate.
    queue.queue(makeEvent('a.jpg'));
    await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

    expect(started).toEqual(['add:a.jpg', 'add:a.jpg']);
  });

  it('clear() drops pending events and their keys', async () => {
    const { processEvent, started } = createSlowProcessor();
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('a.jpg'));
    queue.queue(makeEvent('b.jpg'));
    queue.clear();
    // The cleared keys no longer block the same event from being queued
    // again straight away (e.g. the watcher re-scanning after a switch).
    queue.queue(makeEvent('a.jpg'));
    await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

    expect(started).toEqual(['add:a.jpg']);
  });

  it('clear() during a drain skips the rest of the batch being processed but not later events', async () => {
    const { processEvent, started } = createSlowProcessor();
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('old-a.jpg'));
    queue.queue(makeEvent('old-b.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(started).toEqual(['add:old-a.jpg']);

    // e.g. the watched folder was switched while old events were running.
    queue.clear();
    queue.queue(makeEvent('new.jpg'));
    await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

    expect(started).toEqual(['add:old-a.jpg', 'add:new.jpg']);
  });

  it('keeps processing later events when one event throws, and reports the error', async () => {
    const processed: string[] = [];
    const failure = new Error('boom');
    const processEvent = vi.fn(async (event: WatchFolderEvent) => {
      await Promise.resolve();
      if (event.changedPath === 'bad.jpg') throw failure;
      processed.push(event.changedPath ?? '');
    });
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('bad.jpg'));
    queue.queue(makeEvent('good.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 10);

    expect(processed).toEqual(['good.jpg']);
    expect(errorCatcher).toHaveBeenCalledTimes(1);
    expect(errorCatcher).toHaveBeenCalledWith(
      failure,
      expect.objectContaining({
        contexts: expect.objectContaining({
          fn: expect.objectContaining({ name: 'processWatchFolderEvent' }),
        }),
      }),
    );
  });

  it.each([
    {
      events: ['add', 'unlink', 'add'],
      expectedListed: ['a.jpg'],
      initiallyListed: [],
      replacement: 'a replaced file',
    },
    {
      events: ['unlink', 'add', 'unlink'],
      expectedListed: [],
      initiallyListed: ['a.jpg'],
      replacement: 'a file removed, restored and removed again',
    },
  ])(
    'keeps every pending change to $replacement, so the list matches the folder',
    async ({ events, expectedListed, initiallyListed }) => {
      const { getListed, processEvent, started } =
        createMediaListProcessor(initiallyListed);
      const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

      for (const event of events) queue.queue(makeEvent('a.jpg', event));
      await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

      expect(started).toEqual(events.map((event) => `${event}:a.jpg`));
      expect(getListed()).toEqual(expectedListed);
    },
  );

  it('keeps every change to a file replaced while a slow drain runs, long after the debounce', async () => {
    const { getListed, processEvent, started } = createMediaListProcessor();
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('slow.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(started).toEqual(['add:slow.jpg']);

    // A sync app replaces a.jpg while slow.jpg is still being processed. Each
    // event's own debounce fires, but all three wait for the same batch.
    queue.queue(makeEvent('a.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
    queue.queue(makeEvent('a.jpg', 'unlink'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
    queue.queue(makeEvent('a.jpg'));
    expect(started).toEqual(['add:slow.jpg']);
    await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

    expect(started).toEqual([
      'add:slow.jpg',
      'add:a.jpg',
      'unlink:a.jpg',
      'add:a.jpg',
    ]);
    expect(getListed()).toEqual(['a.jpg', 'slow.jpg']);
  });

  it('does not merge a file event into one queued before a day-folder event', async () => {
    const { getListed, processEvent, started } = createMediaListProcessor();
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    // The day folder is removed and re-created with a.jpg in it: the second
    // "add" must be applied after the folder events, which clear the day.
    queue.queue(makeEvent('a.jpg'));
    queue.queue(makeEvent(DAY, 'unlinkDir'));
    queue.queue(makeEvent(DAY, 'addDir'));
    queue.queue(makeEvent('a.jpg'));
    await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

    expect(started).toEqual([
      'add:a.jpg',
      `unlinkDir:${DAY}`,
      `addDir:${DAY}`,
      'add:a.jpg',
    ]);
    expect(getListed()).toEqual(['a.jpg']);
  });

  it('clear() lets the new folder events through even when an old event never settles', async () => {
    const started: string[] = [];
    const processEvent = vi.fn((event: WatchFolderEvent) => {
      started.push(event.changedPath ?? '');
      return event.changedPath === 'stuck.jpg'
        ? neverSettles()
        : Promise.resolve();
    });
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('stuck.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(started).toEqual(['stuck.jpg']);

    // e.g. the watched folder was switched while stuck.jpg hung.
    queue.clear();
    queue.queue(makeEvent('new.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);

    expect(started).toEqual(['stuck.jpg', 'new.jpg']);
  });

  it('a drain from before clear() that finally settles does not disturb the new one', async () => {
    const started: string[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    let releaseOld: (() => void) | undefined;
    const processEvent = vi.fn(async (event: WatchFolderEvent) => {
      const changedPath = event.changedPath ?? '';
      started.push(changedPath);
      if (changedPath.startsWith('old-')) {
        await new Promise<void>((resolve) => {
          releaseOld = resolve;
        });
        return;
      }
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>((resolve) => {
        setTimeout(resolve, PROCESS_MS);
      });
      inFlight--;
    });
    const queue = createWatchFolderEventQueue(processEvent, DEBOUNCE_MS);

    queue.queue(makeEvent('old-a.jpg'));
    queue.queue(makeEvent('old-b.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    queue.clear();
    queue.queue(makeEvent('new-a.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 50);
    expect(started).toEqual(['old-a.jpg', 'new-a.jpg']);

    // The old event settles while new-a.jpg is still being processed: the old
    // drain stops there, and must not let a second drain start beside the
    // new one.
    releaseOld?.();
    await vi.advanceTimersByTimeAsync(0);
    queue.queue(makeEvent('new-b.jpg'));
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
    expect(started).toEqual(['old-a.jpg', 'new-a.jpg']);
    await vi.advanceTimersByTimeAsync(PROCESS_MS * 10);

    expect(started).toEqual(['old-a.jpg', 'new-a.jpg', 'new-b.jpg']);
    expect(maxInFlight).toBe(1);
  });

  it('moves on to the next event, with a warning, when one never settles', async () => {
    const started: string[] = [];
    const processEvent = vi.fn((event: WatchFolderEvent) => {
      started.push(event.changedPath ?? '');
      return event.changedPath === 'stuck.jpg'
        ? neverSettles()
        : Promise.resolve();
    });
    const queue = createWatchFolderEventQueue(
      processEvent,
      DEBOUNCE_MS,
      EVENT_TIMEOUT_MS,
    );

    queue.queue(makeEvent('stuck.jpg'));
    queue.queue(makeEvent('next.jpg'));
    // Still waiting, in order, until the timeout.
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + EVENT_TIMEOUT_MS - 1);
    expect(started).toEqual(['stuck.jpg']);
    expect(log).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2);

    expect(started).toEqual(['stuck.jpg', 'next.jpg']);
    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      expect.any(String),
      'watchedFolder',
      'warn',
      { day: DAY, event: 'add' },
    );
  });
});
