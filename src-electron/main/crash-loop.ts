import { app } from 'electron';
import {
  readJsonResilientSync,
  writeJsonResilientSync,
} from 'src-electron/main/resilient-storage';
import { log } from 'src/shared/vanilla';

// Extracted from electron-main.ts (BE-6, full-audit-2026-09-04.md) for the
// same reason os-support.ts was: standalone, testable logic rather than code
// buried inside electron-main.ts's module-level bootstrap sequence, which
// has no test harness of its own.

const CRASH_COUNT_FILE = 'crash-count.json';

interface CrashState {
  /**
   * Whether the session that most recently held this file reached its own
   * normal shutdown path (see markCleanExit, called from electron-main.ts's
   * `will-quit` handler). A real crash, forced kill (e.g. Task Manager,
   * `kill -9`), or power loss never reaches that handler, so this stays
   * `false` (set defensively at the start of every session by
   * markSessionStartedUncleanly) unless the session actually exits cleanly.
   */
  cleanExit?: boolean;
  count?: number;
}

/**
 * Marks the current session as having reached its own normal shutdown path.
 * Call this from a quit-lifecycle handler that only ever fires on a
 * cooperative shutdown (this app calls it from `will-quit`, which - unlike
 * `before-quit` - isn't reached until any interactive "confirm quit" prompt
 * has already been resolved, so a cancelled-then-resumed quit attempt can't
 * mark a session "clean" before it's actually quitting).
 */
export function markCleanExit(): void {
  writeCrashState({ cleanExit: true, count: getCrashCount(readCrashState()) });
}

/**
 * Computes this launch's crash count and records it for next time. Previously
 * (before this fix), the count was incremented on every single launch and
 * only reset after 10 seconds of uptime - a heuristic that couldn't tell an
 * actual crash apart from an ordinary fast manual restart (closing and
 * reopening the app, or double-launching and closing one instance quickly),
 * both of which "didn't survive 10 seconds" identically. Gating on
 * `wasLastExitClean()` instead only increments when the previous session
 * never reached its own shutdown path at all - the actual signal for "this
 * probably crashed," not just "this session was short."
 *
 * BE-18 (full-audit-2026-09-05.md): a truly first-ever launch (no
 * crash-state file yet - `readCrashState()` returns `null`) used to look
 * just like a genuine prior crash, since both made the old
 * `wasLastExitClean()` return `false`, counting a fresh install's first
 * launch as crash #1. Checking for `state === null` explicitly (rather than
 * folding it into the same `cleanExit !== true` fallback `wasLastExitClean`
 * used) treats "no prior session at all" the same as a clean one.
 * @returns This launch's crash count (0 if the previous exit was clean, or
 * there was no previous session at all)
 */
export function recordStartupCrashCount(): number {
  const state = readCrashState();
  const crashCount =
    state === null || state.cleanExit === true ? 0 : getCrashCount(state) + 1;
  markSessionStartedUncleanly(crashCount);
  return crashCount;
}

function getCrashCount(state: CrashState | null): number {
  const count = state?.count;
  return typeof count === 'number' ? count : 0;
}

/**
 * Marks the current, just-started session as not yet cleanly exited -
 * called once at startup, immediately after computing this launch's crash
 * count, so that if this session ends up crashing, the *next* launch's
 * `readCrashState()` check correctly reports `cleanExit: false`.
 * @param count The crash count to persist alongside the flag
 */
function markSessionStartedUncleanly(count: number): void {
  writeCrashState({ cleanExit: false, count });
}

function readCrashState(): CrashState | null {
  try {
    return readJsonResilientSync(
      app.getPath('userData'),
      CRASH_COUNT_FILE,
    ) as CrashState | null;
  } catch (error) {
    log('Failed to read crash count:', 'electron', 'warn', error);
    return null;
  }
}

function writeCrashState(state: CrashState): void {
  try {
    writeJsonResilientSync(app.getPath('userData'), CRASH_COUNT_FILE, state);
  } catch (error) {
    log('Failed to write crash count:', 'electron', 'warn', error);
  }
}
