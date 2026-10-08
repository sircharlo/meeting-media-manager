import type { SongItem } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { describe, expect, it, vi } from 'vitest';

import { calculateOptimalSongQueue } from '../background-music';

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

const makeSong = (path: string, duration?: number): SongItem => ({
  duration,
  path,
});

describe('calculateOptimalSongQueue', () => {
  it('builds a queue that cycles the library to fill the available time', () => {
    const songLibrary = [
      makeSong('a.mp3', 60),
      makeSong('b.mp3', 90),
      makeSong('c.mp3', 120),
    ];

    const { queue, startOffsetSeconds } = calculateOptimalSongQueue(
      songLibrary,
      [],
      200,
    );

    const totalDuration = queue.reduce(
      (sum, song) => sum + (song.duration ?? 0),
      0,
    );
    expect(totalDuration).toBeGreaterThanOrEqual(200);
    expect(startOffsetSeconds).toBe(totalDuration - 200);
    expect(errorCatcher).not.toHaveBeenCalled();
  });

  it('returns an empty queue immediately when there is no time to fill', () => {
    const result = calculateOptimalSongQueue([makeSong('a.mp3', 60)], [], 0);

    expect(result).toEqual({ queue: [], startOffsetSeconds: 0 });
  });

  // FE-16 (full-audit-2026-09-05.md): songLibrary.length never decreases
  // (shift-then-push cycles the same songs), so an all-zero/undefined-
  // duration library previously made totalDuration never advance - an
  // infinite loop with no `await` inside it, pinning the renderer's JS
  // thread. This is the actual regression check: without the iteration
  // cap, this test would hang forever instead of failing.
  it('does not hang forever when every song has a zero/undefined duration', () => {
    const songLibrary = [
      makeSong('a.mp3', 0),
      makeSong('b.mp3'),
      makeSong('c.mp3', 0),
    ];

    const { queue } = calculateOptimalSongQueue(songLibrary, [], 200);

    expect(queue.length).toBeGreaterThan(0);
    expect(errorCatcher).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        contexts: expect.objectContaining({
          fn: expect.objectContaining({
            name: 'calculateOptimalSongQueue',
          }),
        }),
      }),
    );
  });
});
