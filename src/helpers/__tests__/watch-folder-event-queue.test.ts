import { errorCatcher } from 'src/helpers/error-catcher';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createWatchFolderEventQueue,
  type WatchFolderEvent,
} from '../watch-folder-event-queue';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

const DEBOUNCE_MS = 100;
const PROCESS_MS = 300;

const makeEvent = (changedPath: string, event = 'add'): WatchFolderEvent => ({
  changedPath,
  day: '2026-10-16',
  event,
});

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
});
