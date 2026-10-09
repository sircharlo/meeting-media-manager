import { describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/app-data'),
  },
}));

vi.mock('src-electron/constants', () => ({
  HD_RESOLUTION: [1920, 1080],
  PLATFORM: 'linux',
  WINDOW_MOVE_THROTTLE_MS: 100,
}));

vi.mock('src-electron/main/screen', () => ({
  getAllScreens: vi.fn(),
  getWindowScreen: vi.fn(),
}));

vi.mock('src-electron/main/utils', () => ({
  captureElectronError: vi.fn(),
  getIconPath: vi.fn(() => '/tmp/icon.png'),
}));

vi.mock('src-electron/main/window/window-base', () => ({
  createWindow: vi.fn(),
  loadWindowPrefs: vi.fn(),
}));

// BE-17 (full-audit-2026-09-05.md): getWindowedTimerBounds was previously
// inline inside setTimerWindowPosition (untestable on its own); extracted
// while porting window-media.ts's concurrency-safe mutex pattern here. The
// mutex/event-driven-wait mechanism itself is not covered by an automated
// test - window-media.ts's own, more mature equivalent (setWindowPosition/
// isMovingWindow) has none either, for the same reason: it needs heavy
// BrowserWindow event-timing mocking for a payoff this codebase has
// consistently judged disproportionate. Verified instead via lint/
// type-check and, if this is ever revisited, should be spot-checked on
// real multi-monitor hardware.
describe('window-timer getWindowedTimerBounds', () => {
  it('sizes the timer window as a fraction of the target screen, capped at 400x200', async () => {
    const { __testables } = await import('../window/window-timer');

    expect(
      __testables.getWindowedTimerBounds({
        height: 1080,
        width: 1920,
        x: 0,
        y: 0,
      }),
    ).toEqual({
      height: 200, // 20% of 1080 = 216, capped at 200
      width: 400, // 30% of 1920 = 576, capped at 400
      x: 1920 - 400 - 20,
      y: 1080 - 200 - 60,
    });
  });

  it('shrinks below the cap on a small screen and offsets from that screen origin', async () => {
    const { __testables } = await import('../window/window-timer');

    expect(
      __testables.getWindowedTimerBounds({
        height: 600,
        width: 800,
        x: 1920,
        y: 0,
      }),
    ).toEqual({
      height: 120, // 20% of 600
      width: 240, // 30% of 800
      x: 1920 + 800 - 240 - 20,
      y: 600 - 120 - 60,
    });
  });
});
