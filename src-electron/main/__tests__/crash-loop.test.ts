import { beforeEach, describe, expect, it, vi } from 'vitest';

// BE-6 (full-audit-2026-09-04.md): the crash counter previously incremented
// on every single launch (reset only after 10 survived seconds), so it
// couldn't tell an actual crash apart from an ordinary fast manual restart -
// both "didn't survive 10 seconds" identically. It's now gated on whether
// the *previous* session ever reached its own clean-shutdown path.
const mocks = vi.hoisted(() => ({
  getPath: vi.fn(() => '/data'),
  log: vi.fn(),
}));

let storedState: null | Record<string, unknown> = null;

vi.mock('electron', () => ({
  app: { getPath: mocks.getPath },
}));

vi.mock('src-electron/main/resilient-storage', () => ({
  readJsonResilientSync: vi.fn(() => storedState),
  writeJsonResilientSync: vi.fn(
    (_dir: string, _file: string, data: unknown) => {
      storedState = data as Record<string, unknown>;
    },
  ),
}));

vi.mock('src/shared/vanilla', () => ({
  log: mocks.log,
}));

describe('recordStartupCrashCount', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    storedState = null;
  });

  it('starts at 1 on a fresh install (no prior state)', async () => {
    const { recordStartupCrashCount } = await import('../crash-loop');

    expect(recordStartupCrashCount()).toBe(1);
    expect(storedState).toEqual({ cleanExit: false, count: 1 });
  });

  it('increments when the previous session never reached a clean exit', async () => {
    storedState = { cleanExit: false, count: 2 };
    const { recordStartupCrashCount } = await import('../crash-loop');

    expect(recordStartupCrashCount()).toBe(3);
  });

  it('resets to 0 (not incrementing) when the previous session exited cleanly - the actual fix for BE-6', async () => {
    // Simulates: the app was quit normally last time (will-quit fired and
    // called markCleanExit), then the user relaunched quickly afterward.
    // The old "didn't survive 10 seconds" heuristic couldn't distinguish
    // this from a real crash loop.
    storedState = { cleanExit: true, count: 2 };
    const { recordStartupCrashCount } = await import('../crash-loop');

    expect(recordStartupCrashCount()).toBe(0);
    expect(storedState).toEqual({ cleanExit: false, count: 0 });
  });

  it('marks the new session as not-yet-clean immediately, before any crash could occur', async () => {
    const { recordStartupCrashCount } = await import('../crash-loop');

    recordStartupCrashCount();

    expect(storedState).toMatchObject({ cleanExit: false });
  });
});

describe('markCleanExit', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    storedState = null;
  });

  it('flips cleanExit to true while preserving the current count', async () => {
    storedState = { cleanExit: false, count: 2 };
    const { markCleanExit } = await import('../crash-loop');

    markCleanExit();

    expect(storedState).toEqual({ cleanExit: true, count: 2 });
  });

  it('a full crash-free launch-then-quit cycle leaves the count untouched and marked clean', async () => {
    storedState = { cleanExit: false, count: 2 };
    const { markCleanExit, recordStartupCrashCount } =
      await import('../crash-loop');

    // Launch: previous exit wasn't clean (a real crash last time), so this
    // increments once more...
    expect(recordStartupCrashCount()).toBe(3);
    // ...then this session shuts down normally.
    markCleanExit();

    expect(storedState).toEqual({ cleanExit: true, count: 3 });

    // Next launch: since that exit was clean, the streak resets rather than
    // continuing to climb from 3.
    expect(recordStartupCrashCount()).toBe(0);
  });
});
