import type { Display, ZoomLayoutPreferences } from 'src/types';

import { DEFAULT_ZOOM_LAYOUT } from 'src/shared/zoom-layout';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAllScreens = vi.fn<() => Display[]>();
const dipToScreenRect = vi.fn(
  (_window: unknown, rect: Electron.Rectangle) => rect,
);

const { constants, mainWindowInfo, mediaWindowInfo, timerWindowInfo } =
  vi.hoisted(() => ({
    constants: { PLATFORM: 'win32' },
    mainWindowInfo: { mainWindow: null as null | Record<string, unknown> },
    mediaWindowInfo: { mediaWindow: null as null | Record<string, unknown> },
    timerWindowInfo: { timerWindow: null as null | Record<string, unknown> },
  }));

vi.mock('electron', () => ({ screen: { dipToScreenRect } }));
vi.mock('src-electron/constants', () => constants);
vi.mock('src-electron/main/screen', () => ({ getAllScreens }));
vi.mock('src-electron/main/utils', () => ({ captureElectronError: vi.fn() }));
vi.mock('src-electron/main/window/window-main', () => ({ mainWindowInfo }));
vi.mock('src-electron/main/window/window-media', () => ({ mediaWindowInfo }));
vi.mock('src-electron/main/window/window-timer', () => ({ timerWindowInfo }));

const { getZoomLayoutTargets } = await import('../zoom-layout');

const M3_HANDLE = 0x1234;

const rect = (x: number, y: number, width: number, height: number) => ({
  height,
  width,
  x,
  y,
});

// The developer's desk: an HD screen on each side of an ultrawide one, the
// media window full screen on the right one, M³ on the ultrawide.
const LEFT = {
  bounds: rect(-1920, 360, 1920, 1080),
  id: 1,
  workArea: rect(-1920, 360, 1920, 1080),
} as Display;
const MIDDLE = {
  bounds: rect(0, 0, 3440, 1440),
  id: 2,
  mainWindow: true,
  workArea: rect(0, 0, 3440, 1392),
} as Display;
const RIGHT = {
  bounds: rect(3440, 360, 1920, 1080),
  id: 3,
  mediaWindow: true,
  workArea: rect(3440, 360, 1920, 1080),
} as Display;

const windowFilling = (bounds: Electron.Rectangle, fullScreen = true) => ({
  getBounds: () => bounds,
  isDestroyed: () => false,
  isFullScreen: () => fullScreen,
});

const prefs = (overrides: Partial<ZoomLayoutPreferences> = {}) => ({
  ...DEFAULT_ZOOM_LAYOUT,
  enabled: true,
  ...overrides,
});

const onScreen = (display: Display) => ({
  bounds: { ...display.bounds },
  id: display.id,
});

describe('getZoomLayoutTargets', () => {
  beforeEach(() => {
    constants.PLATFORM = 'win32';
    getAllScreens.mockReturnValue([LEFT, MIDDLE, RIGHT]);
    dipToScreenRect.mockImplementation((_window, r) => r);
    const handle = Buffer.alloc(8);
    handle.writeBigUInt64LE(BigInt(M3_HANDLE));
    mainWindowInfo.mainWindow = {
      getNativeWindowHandle: () => handle,
      isDestroyed: () => false,
      isFullScreen: () => false,
    };
    mediaWindowInfo.mediaWindow = windowFilling(RIGHT.bounds);
    timerWindowInfo.timerWindow = null;
  });

  it('puts Zoom alone on its screen, M³ filling its own, and Zoom’s second window over the media window', () => {
    expect(
      getZoomLayoutTargets(
        prefs({ alone: true, display: onScreen(LEFT), m3Fills: true }),
      ),
    ).toEqual({
      displayId: 1,
      fallback: false,
      m3: MIDDLE.workArea,
      m3Handle: M3_HANDLE,
      second: RIGHT.bounds,
      snap: null,
      zoom: LEFT.workArea,
    });
  });

  it('leaves M³ where it is when Zoom is alone and M³ is not to fill its screen', () => {
    const targets = getZoomLayoutTargets(
      prefs({ alone: true, display: onScreen(LEFT) }),
    );
    expect(targets?.m3).toBeUndefined();
    expect(targets?.m3Handle).toBeUndefined();
  });

  it('shares Zoom’s screen with M³ by the chosen proportion, side by side', () => {
    const targets = getZoomLayoutTargets(
      prefs({
        display: onScreen(LEFT),
        m3First: false,
        m3Share: 0.4,
        snapWithWindows: true,
      }),
    );
    expect(targets).toMatchObject({
      m3: rect(-768, 360, 768, 1080),
      m3Handle: M3_HANDLE,
      snap: 'zoom-left',
      zoom: rect(-1920, 360, 1152, 1080),
    });
  });

  it('shares M³’s screen when none is chosen', () => {
    const targets = getZoomLayoutTargets(prefs({ m3Share: 0.5 }));
    expect(targets).toMatchObject({
      displayId: 2,
      fallback: false,
      m3: rect(0, 0, 1720, 1392),
      zoom: rect(1720, 0, 1720, 1392),
    });
  });

  it('keeps each window to its smallest size whatever the proportion saved', () => {
    const targets = getZoomLayoutTargets(
      prefs({ display: onScreen(LEFT), m3Share: 0.9 }),
    );
    // Zoom keeps 972 DIPs with its participants list docked.
    expect(targets?.zoom.width).toBe(972);
  });

  it('never puts Zoom on the media window’s screen: it shares M³’s instead', () => {
    const targets = getZoomLayoutTargets(prefs({ display: onScreen(RIGHT) }));
    expect(targets).toMatchObject({ displayId: 2, fallback: true });
  });

  it('finds the chosen screen by its bounds when its id changed, else falls back', () => {
    const moved = { bounds: LEFT.bounds, id: 99 };
    expect(getZoomLayoutTargets(prefs({ display: moved }))).toMatchObject({
      displayId: 1,
      fallback: false,
    });
    const unplugged = { bounds: rect(9000, 0, 800, 600), id: 99 };
    expect(getZoomLayoutTargets(prefs({ display: unplugged }))).toMatchObject({
      displayId: 2,
      fallback: true,
    });
  });

  it('counts a windowed media window as taking no screen', () => {
    mediaWindowInfo.mediaWindow = windowFilling(
      rect(3500, 400, 800, 450),
      false,
    );
    const targets = getZoomLayoutTargets(prefs({ display: onScreen(RIGHT) }));
    expect(targets).toMatchObject({ displayId: 3, fallback: false });
    expect(targets?.second).toBeUndefined();
  });

  it('places in physical pixels', () => {
    dipToScreenRect.mockImplementation((_window, r) => ({
      height: r.height * 2,
      width: r.width * 2,
      x: r.x * 2,
      y: r.y * 2,
    }));
    const targets = getZoomLayoutTargets(prefs({ m3Share: 0.5 }));
    expect(targets?.zoom).toEqual(rect(3440, 0, 3440, 2784));
  });

  it('works out nothing off Windows', () => {
    constants.PLATFORM = 'darwin';
    expect(getZoomLayoutTargets(prefs())).toBeNull();
  });
});
