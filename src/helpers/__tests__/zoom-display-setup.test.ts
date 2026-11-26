import type { ZoomCommandResult } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { useZoomDisplaySetupStore } from 'stores/zoom-display-setup';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __testables,
  askZoomDisplaySetup,
  canPlaceZoomForDisplaySetup,
  finishZoomDisplaySetup,
  getDueZoomDisplaySetup,
  hasMeetingStarted,
  isMediaOnItsOwnScreen,
  restoreMediaAfterZoomDisplaySetup,
  retryZoomDisplayPlacement,
  revealZoomForDisplaySetup,
  turnOffZoomDisplaySetup,
} from '../zoom-display-setup';

const state = vi.hoisted(() => ({
  currentState: {
    currentCongregation: 'cong-1' as null | string,
    currentSettings: {
      disableMediaFetching: false,
      enableMediaDisplayButton: true,
      zoomDisplaySetupHelp: true,
      zoomMeetingManagerEnable: false,
    },
    mediaWindowVisible: true,
  },
  // What happened to the media window and to Zoom, in order.
  events: [] as string[],
  platform: 'win32',
  zoomState: { automationsPaused: false },
}));

const mocks = vi.hoisted(() => ({
  getMediaScreenForZoom: vi.fn(),
  getMeetingStartToday: vi.fn<(now?: Date) => Date | null>(),
  isMwMeetingDay: vi.fn<(now?: Date) => boolean>(),
  isPresentationScreen: vi.fn(),
  putZoomSecondWindowFullScreen: vi.fn(),
  toggleMediaWindowVisibility: vi.fn(),
}));

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => state.currentState,
}));
vi.mock('stores/zoom-state', () => ({
  useZoomStateStore: () => state.zoomState,
}));
vi.mock('src/helpers/date', () => ({
  getMeetingStartToday: mocks.getMeetingStartToday,
  isMwMeetingDay: mocks.isMwMeetingDay,
}));
vi.mock('src/helpers/fs', () => ({
  getRendererPlatform: () => state.platform,
}));
vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: mocks.toggleMediaWindowVisibility,
}));
vi.mock('src/helpers/zoom', () => ({
  putZoomSecondWindowFullScreen: mocks.putZoomSecondWindowFullScreen,
}));
vi.mock('src/helpers/zoom-layout', () => ({
  getMediaScreenForZoom: mocks.getMediaScreenForZoom,
  isPresentationScreen: mocks.isPresentationScreen,
}));

const MINUTE = 60 * 1000;
// Thursday's meeting, at 19:30.
const MEETING_START = new Date(2026, 9, 15, 19, 30);
const TV = { height: 1080, width: 1920, x: 1920, y: 0 };

const at = (minutesBeforeMeeting: number) =>
  new Date(MEETING_START.getTime() - minutesBeforeMeeting * MINUTE);

const settings = () => state.currentState.currentSettings;

const fullScreenResult: ZoomCommandResult = {
  ok: true,
  secondWindow: {
    before: 'windowed',
    frame: TV,
    fullScreen: true,
    via: 'posted',
  },
};

/** Reveals Zoom, letting the media window's fade-out wait go by. */
const reveal = async () => {
  const revealing = revealZoomForDisplaySetup();
  await vi.advanceTimersByTimeAsync(2000);
  return revealing;
};

beforeEach(() => {
  vi.useFakeTimers();
  setActivePinia(createPinia());
  __testables.reset();
  state.events.length = 0;
  state.platform = 'win32';
  state.zoomState.automationsPaused = false;
  state.currentState.currentCongregation = 'cong-1';
  state.currentState.mediaWindowVisible = true;
  Object.assign(settings(), {
    disableMediaFetching: false,
    enableMediaDisplayButton: true,
    zoomDisplaySetupHelp: true,
    zoomMeetingManagerEnable: false,
  });
  mocks.getMeetingStartToday.mockReturnValue(MEETING_START);
  mocks.isMwMeetingDay.mockReturnValue(true);
  mocks.getMediaScreenForZoom.mockImplementation(async () => {
    state.events.push(
      `screen worked out (media ${state.currentState.mediaWindowVisible ? 'shown' : 'hidden'})`,
    );
    return TV;
  });
  mocks.toggleMediaWindowVisibility.mockImplementation((visible: boolean) => {
    state.currentState.mediaWindowVisible = visible;
    state.events.push(visible ? 'media shown' : 'media hidden');
  });
  mocks.putZoomSecondWindowFullScreen.mockImplementation(async () => {
    state.events.push('zoom placed');
    return fullScreenResult;
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('getDueZoomDisplaySetup', () => {
  it('is due for the midweek meeting from when music may start until it starts', () => {
    expect(getDueZoomDisplaySetup(at(80))).toBeNull();
    expect(getDueZoomDisplaySetup(at(75))).toEqual({
      key: `cong-1:${MEETING_START.toDateString()}`,
      meeting: 'mw',
    });
    expect(getDueZoomDisplaySetup(at(1))?.meeting).toBe('mw');
    expect(getDueZoomDisplaySetup(at(0))).toBeNull();
    expect(getDueZoomDisplaySetup(at(-10))).toBeNull();
  });

  it('asks about the speaker on a weekend meeting day', () => {
    mocks.isMwMeetingDay.mockReturnValue(false);
    expect(getDueZoomDisplaySetup(at(30))?.meeting).toBe('we');
  });

  it('is asked once per meeting, whatever the answer', () => {
    const due = getDueZoomDisplaySetup(at(30));
    expect(due).not.toBeNull();
    if (!due) return;

    askZoomDisplaySetup(due);

    expect(useZoomDisplaySetupStore().meeting).toBe('mw');
    expect(getDueZoomDisplaySetup(at(20))).toBeNull();
  });

  it.each([
    ['the question is turned off', { zoomDisplaySetupHelp: false }],
    ['media playback is off', { enableMediaDisplayButton: false }],
    ['media fetching is off', { disableMediaFetching: true }],
  ])('is never due when %s', (_, changed) => {
    Object.assign(settings(), changed);
    expect(getDueZoomDisplaySetup(at(30))).toBeNull();
  });

  it('is never due without a meeting start time today (or the Memorial)', () => {
    mocks.getMeetingStartToday.mockReturnValue(null);
    expect(getDueZoomDisplaySetup(at(30))).toBeNull();
    expect(hasMeetingStarted(at(30))).toBe(true);
  });

  it('is never due without a congregation', () => {
    state.currentState.currentCongregation = null;
    expect(getDueZoomDisplaySetup(at(30))).toBeNull();
  });
});

describe('hasMeetingStarted', () => {
  it('tells before from after the start', () => {
    expect(hasMeetingStarted(at(1))).toBe(false);
    expect(hasMeetingStarted(at(0))).toBe(true);
  });
});

describe('isMediaOnItsOwnScreen', () => {
  it('only counts the media window filling a screen of its own', async () => {
    const screens = [
      { id: 1, mainWindow: true },
      { id: 2, mediaWindow: true },
    ];
    vi.spyOn(globalThis.electronApi, 'getAllScreens').mockResolvedValue(
      screens as never,
    );
    mocks.isPresentationScreen.mockReturnValue(true);
    expect(await isMediaOnItsOwnScreen()).toBe(true);
    // Asked about the media window's screen only.
    expect(mocks.isPresentationScreen).toHaveBeenCalledWith(
      screens[1],
      screens,
    );
    expect(mocks.isPresentationScreen).toHaveBeenCalledTimes(1);

    mocks.isPresentationScreen.mockReturnValue(false);
    expect(await isMediaOnItsOwnScreen()).toBe(false);
  });
});

describe('canPlaceZoomForDisplaySetup', () => {
  it('needs the Zoom Meeting Manager, on Windows, with its automations running', () => {
    expect(canPlaceZoomForDisplaySetup()).toBe(false);
    settings().zoomMeetingManagerEnable = true;
    expect(canPlaceZoomForDisplaySetup()).toBe(true);
    state.zoomState.automationsPaused = true;
    expect(canPlaceZoomForDisplaySetup()).toBe(false);
    state.zoomState.automationsPaused = false;
    state.platform = 'darwin';
    expect(canPlaceZoomForDisplaySetup()).toBe(false);
  });
});

describe('revealZoomForDisplaySetup', () => {
  it('only hides the media display without the Zoom Meeting Manager', async () => {
    expect(await reveal()).toBeNull();
    expect(state.events).toEqual(['media hidden']);
    expect(mocks.putZoomSecondWindowFullScreen).not.toHaveBeenCalled();
  });

  it('puts Zoom full screen on the TV, worked out before the media display hides', async () => {
    settings().zoomMeetingManagerEnable = true;

    expect(await reveal()).toBe('full-screen');

    expect(state.events).toEqual([
      'screen worked out (media shown)',
      'media hidden',
      'zoom placed',
    ]);
    expect(mocks.putZoomSecondWindowFullScreen).toHaveBeenCalledWith(TV);
  });

  it.each<[string, ZoomCommandResult]>([
    [
      'not-full-screen',
      {
        ok: true,
        secondWindow: {
          before: 'windowed',
          frame: { ...TV, height: 800 },
          fullScreen: false,
          via: null,
        },
      },
    ],
    ['no-meeting', { error: 'meeting-not-found', ok: false }],
    ['no-second-window', { error: 'second-window-not-found', ok: false }],
    ['failed', { error: 'sharing', ok: false }],
    ['failed', { error: 'cancelled', ok: false }],
  ])('says %s from what the helper answered', async (placement, result) => {
    settings().zoomMeetingManagerEnable = true;
    mocks.putZoomSecondWindowFullScreen.mockResolvedValue(result);
    expect(await reveal()).toBe(placement);
  });

  it('fails without asking Zoom when the TV is not found', async () => {
    settings().zoomMeetingManagerEnable = true;
    mocks.getMediaScreenForZoom.mockResolvedValue(null);
    expect(await reveal()).toBe('failed');
    expect(mocks.putZoomSecondWindowFullScreen).not.toHaveBeenCalled();
  });

  it('tries again on the screen worked out the first time', async () => {
    settings().zoomMeetingManagerEnable = true;
    mocks.putZoomSecondWindowFullScreen.mockResolvedValueOnce({
      error: 'second-window-not-found',
      ok: false,
    });
    expect(await reveal()).toBe('no-second-window');

    expect(await retryZoomDisplayPlacement()).toBe('full-screen');

    expect(mocks.getMediaScreenForZoom).toHaveBeenCalledTimes(1);
    expect(mocks.putZoomSecondWindowFullScreen).toHaveBeenCalledTimes(2);
    expect(mocks.putZoomSecondWindowFullScreen).toHaveBeenLastCalledWith(TV);
  });
});

describe('finishing', () => {
  it('shows the media display again only if the setup hid it', async () => {
    restoreMediaAfterZoomDisplaySetup();
    expect(mocks.toggleMediaWindowVisibility).not.toHaveBeenCalled();

    await reveal();
    restoreMediaAfterZoomDisplaySetup();
    restoreMediaAfterZoomDisplaySetup();

    expect(state.events).toEqual(['media hidden', 'media shown']);
  });

  it('leaves a media display hidden beforehand as it was', async () => {
    state.currentState.mediaWindowVisible = false;
    await reveal();
    finishZoomDisplaySetup({ tour: false });
    expect(mocks.toggleMediaWindowVisibility).not.toHaveBeenCalled();
  });

  it('closes, then starts the tour when asked', () => {
    const store = useZoomDisplaySetupStore();
    store.open('we');

    finishZoomDisplaySetup({ tour: true });

    expect(store.meeting).toBeNull();
    expect(store.tourStep).toBe(0);
  });

  it('turns the question off for good on "Don\'t ask me again"', () => {
    const store = useZoomDisplaySetupStore();
    store.open('mw');

    turnOffZoomDisplaySetup();

    expect(settings().zoomDisplaySetupHelp).toBe(false);
    expect(store.meeting).toBeNull();
    expect(store.tourActive).toBe(false);
  });
});
