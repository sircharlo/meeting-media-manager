import type {
  Display,
  ZoomLayoutTargets,
  ZoomPlacedWindows,
  ZoomWindowLayout,
  ZoomWindowState,
} from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { ZOOM_SETUP_ASSISTANT_DIALOG_ID } from 'src/constants/zoom';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __testables,
  arrangeZoomWindows,
  findZoomScreen,
  isPresentationScreen,
  isZoomLayoutEnabled,
  LAYOUT_POLL_INTERVAL_MS,
  startZoomLayoutWatcher,
  stopZoomLayoutWatcher,
  suggestZoomLayout,
} from '../zoom-layout';

const {
  countZoomMeetingParticipants,
  createTemporaryNotification,
  getZoomWindowLayout,
  isZoomCheckInProgress,
  openZoomParticipantsWhileSharing,
  placeZoomWindows,
} = vi.hoisted(() => ({
  countZoomMeetingParticipants: vi.fn(async () => 3),
  createTemporaryNotification: vi.fn(),
  getZoomWindowLayout: vi.fn<() => Promise<null | ZoomWindowLayout>>(),
  isZoomCheckInProgress: vi.fn(() => false),
  openZoomParticipantsWhileSharing: vi.fn(async () => true),
  placeZoomWindows:
    vi.fn<
      (
        targets: ZoomLayoutTargets,
        options?: { participantsOnly?: boolean; zoomOnly?: boolean },
      ) => Promise<null | ZoomPlacedWindows>
    >(),
}));

vi.mock('boot/i18n', () => ({ i18n: { global: { t: (key: string) => key } } }));
vi.mock('src/helpers/notifications', () => ({ createTemporaryNotification }));
vi.mock(import('src/helpers/fs'), async (importOriginal) => ({
  ...(await importOriginal()),
  getRendererPlatform: () => 'win32',
}));
vi.mock('src/helpers/zoom', () => ({
  countZoomMeetingParticipants,
  getZoomWindowLayout,
  isZoomCheckInProgress,
  openZoomParticipantsWhileSharing,
  placeZoomWindows,
}));

const frame = (x: number, width = 1000) => ({ height: 1000, width, x, y: 0 });

const PLACED_ZOOM = frame(800, 1120);

const TARGETS: ZoomLayoutTargets = {
  displayId: 1,
  fallback: false,
  m3: frame(0, 800),
  m3Handle: 42,
  snap: null,
  zoom: PLACED_ZOOM,
};

const window = (state: Partial<ZoomWindowState> = {}): ZoomWindowState => ({
  arranged: false,
  frame: frame(100),
  fullScreen: false,
  handle: 7,
  maximized: false,
  minimized: false,
  ...state,
});

const layout = (
  meeting: null | Partial<ZoomWindowState>,
  extra: Partial<ZoomWindowLayout> = {},
): ZoomWindowLayout => ({
  meeting: meeting ? window(meeting) : null,
  miniView: false,
  participants: null,
  second: null,
  sharing: false,
  userMovedListMsAgo: null,
  userMovedMsAgo: null,
  userMoving: false,
  ...extra,
});

const getZoomLayoutTargets = vi.fn<() => Promise<null | ZoomLayoutTargets>>();

/** One look at Zoom's windows, letting any wait in it run out. */
const look = async (seen: ZoomWindowLayout) => {
  const following = __testables.follow(seen);
  await vi.runAllTimersAsync();
  return following;
};

const enableLayout = (overrides = {}) => {
  useCongregationSettingsStore().congregations['cong'] = {
    ...defaultSettings,
    zoomMeetingManagerEnable: true,
  };
  useCurrentStateStore().currentCongregation = 'cong';
  Object.assign(useAppSettingsStore().zoomLayout, {
    enabled: true,
    ...overrides,
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-22T19:00:00'));
  setActivePinia(createPinia());
  __testables.reset();
  vi.clearAllMocks();
  getZoomLayoutTargets.mockResolvedValue(TARGETS);
  placeZoomWindows.mockResolvedValue({ snapped: false, zoom: PLACED_ZOOM });
  vi.stubGlobal('electronApi', {
    ...globalThis.electronApi,
    getZoomLayoutTargets,
  });
});

afterEach(() => {
  stopZoomLayoutWatcher();
  vi.useRealTimers();
});

describe('isZoomLayoutEnabled', () => {
  it('needs the Zoom Meeting Manager and the layout turned on', () => {
    expect(isZoomLayoutEnabled()).toBe(false);
    enableLayout({ enabled: false });
    expect(isZoomLayoutEnabled()).toBe(false);
    enableLayout();
    expect(isZoomLayoutEnabled()).toBe(true);
  });
});

describe('following Zoom’s windows', () => {
  beforeEach(() => {
    enableLayout();
  });

  it('arranges a new meeting’s windows once Zoom stops moving them, after opening the participants list', async () => {
    expect(await look(layout({ frame: frame(100) }))).toBe(true);
    expect(placeZoomWindows).not.toHaveBeenCalled();

    await look(layout({ frame: frame(100) }));
    expect(countZoomMeetingParticipants).toHaveBeenCalledTimes(1);
    expect(placeZoomWindows).toHaveBeenCalledWith(TARGETS, {
      zoomOnly: false,
    });
    // The main process got the preferences as a plain object.
    expect(getZoomLayoutTargets).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, m3Share: 0.4 }),
    );
  });

  it('leaves the participants list alone unless asked', async () => {
    enableLayout({ openParticipants: false });
    await look(layout({}));
    await look(layout({}));
    expect(countZoomMeetingParticipants).not.toHaveBeenCalled();
    expect(placeZoomWindows).toHaveBeenCalledTimes(1);
  });

  it('puts Zoom alone back once it moved on its own and stopped moving', async () => {
    await look(layout({}));
    await look(layout({}));
    placeZoomWindows.mockClear();

    // Where it was placed: nothing to do.
    await look(layout({ frame: PLACED_ZOOM }));
    // Its participants list closed: narrower, still moving, then settled.
    const narrower = { ...PLACED_ZOOM, width: 752 };
    await look(layout({ frame: narrower }));
    expect(placeZoomWindows).not.toHaveBeenCalled();
    await look(layout({ frame: narrower }));
    expect(placeZoomWindows).toHaveBeenCalledWith(TARGETS, { zoomOnly: true });
  });

  it('leaves Zoom where the user moved it until the next meeting', async () => {
    await look(layout({}));
    await look(layout({}));
    placeZoomWindows.mockClear();

    vi.advanceTimersByTime(10_000);
    const moved = { userMovedMsAgo: 2000 };
    await look(layout({ frame: frame(300) }, moved));
    await look(layout({ frame: frame(300) }, moved));
    expect(placeZoomWindows).not.toHaveBeenCalled();

    // The meeting closes; the next one is arranged again.
    expect(await look(layout(null))).toBe(false);
    await look(layout({ frame: frame(300) }, moved));
    await look(layout({ frame: frame(300) }, moved));
    expect(placeZoomWindows).toHaveBeenCalledTimes(1);
  });

  it('counts a move before M³ placed Zoom as no reason to leave it', async () => {
    vi.advanceTimersByTime(5000);
    await look(layout({}, { userMovedMsAgo: 60_000 }));
    await look(layout({}, { userMovedMsAgo: 60_000 }));
    placeZoomWindows.mockClear();
    await look(layout({ frame: frame(0) }, { userMovedMsAgo: 60_000 }));
    await look(layout({ frame: frame(0) }, { userMovedMsAgo: 60_000 }));
    expect(placeZoomWindows).toHaveBeenCalledTimes(1);
  });

  it('keeps the meeting while Zoom hides it to share, and puts it back after', async () => {
    await look(layout({}));
    await look(layout({}));
    placeZoomWindows.mockClear();

    expect(await look(layout(null, { sharing: true }))).toBe(true);
    // Back where Zoom likes, not where it was placed.
    await look(layout({ frame: frame(0) }));
    await look(layout({ frame: frame(0) }));
    expect(placeZoomWindows).toHaveBeenCalledWith(TARGETS, { zoomOnly: true });
    expect(countZoomMeetingParticipants).toHaveBeenCalledTimes(1);
  });

  it('leaves Zoom alone while minimized, moved by the user, or in its full screen', async () => {
    await look(layout({ minimized: true }));
    await look(layout({ minimized: true }));
    await look(layout({}, { userMoving: true }));
    await look(layout({}, { userMoving: true }));
    await look(layout({ fullScreen: true }));
    await look(layout({ fullScreen: true }));
    expect(placeZoomWindows).not.toHaveBeenCalled();
  });

  it('only keeps the first placement when asked not to put Zoom back', async () => {
    enableLayout({ keepInPlace: false });
    await look(layout({}));
    await look(layout({}));
    await look(layout({ frame: frame(0) }));
    await look(layout({ frame: frame(0) }));
    expect(placeZoomWindows).toHaveBeenCalledTimes(1);
  });

  it('arranges every window again when the screens change', async () => {
    enableLayout({ openParticipants: false });
    getZoomWindowLayout.mockResolvedValue(layout({ frame: PLACED_ZOOM }));
    startZoomLayoutWatcher();
    await vi.advanceTimersByTimeAsync(0); // seen once
    await vi.advanceTimersByTimeAsync(LAYOUT_POLL_INTERVAL_MS); // arranged
    await vi.advanceTimersByTimeAsync(LAYOUT_POLL_INTERVAL_MS); // in place
    expect(placeZoomWindows).toHaveBeenCalledTimes(1);

    globalThis.dispatchEvent(new CustomEvent('screen-trigger-update'));
    await vi.advanceTimersByTimeAsync(LAYOUT_POLL_INTERVAL_MS);
    expect(placeZoomWindows).toHaveBeenCalledTimes(2);
    expect(placeZoomWindows).toHaveBeenLastCalledWith(TARGETS, {
      zoomOnly: false,
    });
  });

  it('waits before trying again when placing the windows failed', async () => {
    placeZoomWindows.mockResolvedValue(null);
    await look(layout({}));
    await look(layout({}));
    await look(layout({}));
    expect(placeZoomWindows).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(30_000);
    await look(layout({}));
    expect(placeZoomWindows).toHaveBeenCalledTimes(2);
  });

  describe('while sharing', () => {
    const LIST_SPOT = { height: 360, width: 400, x: 760, y: 336 };

    const sharing = (extra: Partial<ZoomWindowLayout> = {}) =>
      layout(null, { sharing: true, ...extra });

    beforeEach(async () => {
      await look(layout({}));
      await look(layout({}));
      placeZoomWindows.mockClear();
      placeZoomWindows.mockResolvedValue({
        participants: PLACED_ZOOM,
        snapped: false,
      });
    });

    it('opens the participants list once, then keeps it at Zoom’s spot', async () => {
      await look(sharing());
      expect(openZoomParticipantsWhileSharing).toHaveBeenCalledTimes(1);

      const opened = sharing({ participants: window({ frame: LIST_SPOT }) });
      await look(opened);
      expect(placeZoomWindows).not.toHaveBeenCalled();
      await look(opened);
      expect(placeZoomWindows).toHaveBeenCalledWith(TARGETS, {
        participantsOnly: true,
      });

      await look(sharing({ participants: window({ frame: PLACED_ZOOM }) }));
      expect(placeZoomWindows).toHaveBeenCalledTimes(1);
      expect(openZoomParticipantsWhileSharing).toHaveBeenCalledTimes(1);
    });

    it('leaves the list closed once the user closed it, until the next share', async () => {
      await look(sharing());
      await look(sharing({ participants: window({ frame: LIST_SPOT }) }));
      await look(sharing());
      await look(sharing());
      expect(openZoomParticipantsWhileSharing).toHaveBeenCalledTimes(1);

      // The share ends (the meeting is back), then another starts.
      await look(layout({ frame: PLACED_ZOOM }));
      await look(sharing());
      expect(openZoomParticipantsWhileSharing).toHaveBeenCalledTimes(2);
    });

    it('leaves the list where the user moved it', async () => {
      await look(sharing({ participants: window({ frame: LIST_SPOT }) }));
      await look(sharing({ participants: window({ frame: LIST_SPOT }) }));
      expect(placeZoomWindows).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);
      const moved = sharing({
        participants: window({ frame: frame(50) }),
        userMovedListMsAgo: 1000,
      });
      await look(moved);
      await look(moved);
      expect(placeZoomWindows).toHaveBeenCalledTimes(1);
    });

    it('opens nothing when not asked to', async () => {
      useAppSettingsStore().zoomLayout.showParticipantsWhileSharing = false;
      await look(sharing());
      expect(openZoomParticipantsWhileSharing).not.toHaveBeenCalled();
    });
  });

  describe('telling the user', () => {
    interface Notice {
      actions?: { handler?: () => void; label?: string }[];
      message?: string;
    }
    const notices = () =>
      createTemporaryNotification.mock.calls.map(
        ([notice]) => notice as Notice,
      );
    const moveNotice = () =>
      notices().find((n) => n.message === 'zoom-layout-moved');

    it('says when M³ moved Zoom by itself, not when Zoom was already in place', async () => {
      await look(layout({ frame: PLACED_ZOOM }));
      await look(layout({ frame: PLACED_ZOOM }));
      expect(placeZoomWindows).toHaveBeenCalledTimes(1);
      expect(moveNotice()).toBeUndefined();

      await look(layout({ frame: frame(0) }));
      await look(layout({ frame: frame(0) }));
      expect(moveNotice()).toBeDefined();
    });

    it('leaves Zoom alone until M³ restarts when asked from the notice', async () => {
      await look(layout({}));
      await look(layout({}));
      expect(isZoomLayoutEnabled()).toBe(true);
      moveNotice()?.actions?.[0]?.handler?.();
      expect(isZoomLayoutEnabled()).toBe(false);
      // Still on for the next time M³ starts.
      expect(useAppSettingsStore().zoomLayout.enabled).toBe(true);
    });

    it('turns the window layout off for good when asked from the notice', async () => {
      await look(layout({}));
      await look(layout({}));
      moveNotice()?.actions?.[1]?.handler?.();
      expect(useAppSettingsStore().zoomLayout.enabled).toBe(false);
      expect(notices().at(-1)?.message).toBe('zoom-layout-turned-off');
    });

    it('says nothing when the user arranges the windows themselves', async () => {
      await arrangeZoomWindows();
      expect(createTemporaryNotification).not.toHaveBeenCalled();
    });
  });

  it('says once when Zoom’s screen isn’t there and it shares M³’s', async () => {
    getZoomLayoutTargets.mockResolvedValue({ ...TARGETS, fallback: true });
    await arrangeZoomWindows();
    await arrangeZoomWindows();
    expect(createTemporaryNotification).toHaveBeenCalledTimes(1);
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'zoom-layout-screen-missing' }),
    );
  });
});

describe('polling', () => {
  beforeEach(() => {
    enableLayout();
    getZoomWindowLayout.mockResolvedValue(layout({}));
  });

  it('stays out of the way while M³ uses Zoom or its setup assistant is open', async () => {
    useZoomStateStore().beginRun('zoom-run-generic');
    await __testables.pollZoomLayout();
    useZoomStateStore().endRun();
    useDialogStateStore().openDialog(
      ZOOM_SETUP_ASSISTANT_DIALOG_ID,
      'DialogZoomSetupAssistant',
    );
    await __testables.pollZoomLayout();
    expect(getZoomWindowLayout).not.toHaveBeenCalled();
  });

  it('looks often during a meeting', async () => {
    await __testables.pollZoomLayout();
    expect(getZoomWindowLayout).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(LAYOUT_POLL_INTERVAL_MS);
    expect(getZoomWindowLayout).toHaveBeenCalledTimes(2);
  });
});

describe('screens', () => {
  const display = (id: number, flags: Partial<Display> = {}) =>
    ({
      bounds: { height: 1080, width: 1920, x: id * 1920, y: 0 },
      id,
      ...flags,
    }) as Display;

  it('never offers the screen the media window fills', () => {
    const media = display(1, { mediaWindow: true });
    const screens = [display(0, { mainWindow: true }), media];
    expect(isPresentationScreen(media, screens)).toBe(true);
    useAppSettingsStore().screenPreferences.preferWindowed = true;
    expect(isPresentationScreen(media, screens)).toBe(false);
  });

  it('suggests a screen of Zoom’s own with three screens, else M³’s', () => {
    const spare = display(1);
    const three = [
      display(0, { mainWindow: true }),
      spare,
      display(2, { mediaWindow: true }),
    ];
    expect(suggestZoomLayout(three)).toEqual({
      alone: true,
      display: { bounds: spare.bounds, id: 1 },
    });
    expect(suggestZoomLayout(three.slice(0, 2))).toEqual({
      alone: false,
      display: null,
    });
  });

  it('finds the screen chosen, by id or bounds, else M³’s', () => {
    const other = display(1);
    const screens = [display(0, { mainWindow: true }), other];
    expect(findZoomScreen(screens, { display: null })?.id).toBe(0);
    expect(
      findZoomScreen(screens, { display: { bounds: other.bounds, id: 99 } })
        ?.id,
    ).toBe(1);
    expect(
      findZoomScreen(screens, {
        display: { bounds: { height: 1, width: 1, x: 0, y: 0 }, id: 99 },
      })?.id,
    ).toBe(0);
  });
});
