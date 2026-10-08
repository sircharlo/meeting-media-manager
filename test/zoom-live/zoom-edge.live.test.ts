import type { ChildProcess } from 'node:child_process';
import type { ZoomMeetingState } from 'src/types';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  canRunLive,
  createHelper,
  ensureMeeting,
  openFakeMediaWindow,
  print,
  sleep,
  titles,
  videoCommand,
} from './support';
import {
  findWindowByTitle,
  focusWindow,
  getCursor,
  getForegroundWindow,
  getScreens,
  getWindowRect,
  isMinimized,
  minimizeWindow,
  moveWindow,
  restoreWindow,
  setCursor,
  toggleZoomAlwaysShowControls,
} from './windows';

// The situations a real computer throws at the Zoom helper beyond the happy
// path: Zoom's toolbar auto-hidden, its window minimized or on another
// monitor, actions with nothing to do, and side effects the helper must not
// have. Needs only the host in the meeting.

const TOOLBAR_HIDE_TIMEOUT_MS = 12_000;

describe.skipIf(!canRunLive)('Zoom helper, live edge cases', () => {
  const helper = createHelper();
  let fakeMediaWindow: ChildProcess | undefined;
  let meetingHandle = 0;
  let originalBounds: ReturnType<typeof getWindowRect> | undefined;
  /** Whether this test switched Zoom's toolbar to auto-hide (to undo it). */
  let switchedToAutoHide = false;

  const meeting = async (reveal = false): Promise<ZoomMeetingState> => {
    const result = await helper.request({ reveal, type: 'meeting' });
    expect(result.ok).toBe(true);
    return result.meeting as ZoomMeetingState;
  };

  /** Puts another window in front and moves the mouse away from Zoom. */
  const lookAway = () => {
    const other = findWindowByTitle('Media Player - M');
    if (other) focusWindow(other);
    const [screen] = getScreens();
    setCursor((screen?.x ?? 0) + 5, (screen?.y ?? 0) + 5);
  };

  /** Whether Zoom's toolbar hides itself once nobody's looking at it. */
  const toolbarAutoHides = async () => {
    lookAway();
    const deadline = Date.now() + TOOLBAR_HIDE_TIMEOUT_MS;
    while (Date.now() < deadline) {
      if (!(await meeting()).toolbarVisible) return true;
      await sleep(1000);
    }
    return false;
  };

  const waitForHiddenToolbar = async () => {
    expect(await toolbarAutoHides(), 'Zoom hides its toolbar').toBe(true);
  };

  beforeAll(async () => {
    expect(await helper.start()).toEqual({ ok: true });
    await ensureMeeting(helper);
    meetingHandle = (await meeting()).handle ?? 0;
    originalBounds = getWindowRect(meetingHandle);
    fakeMediaWindow = openFakeMediaWindow();
    await sleep(2000);

    // The hidden-toolbar cases need Zoom's default auto-hiding toolbar.
    if (!(await toolbarAutoHides())) {
      print('  Switching Zoom to its auto-hiding toolbar for these tests');
      toggleZoomAlwaysShowControls(meetingHandle);
      switchedToAutoHide = true;
    }
  });

  afterAll(async () => {
    if (originalBounds) moveWindow(meetingHandle, originalBounds);
    // Leave the host as found by every test: in the meeting audio, video on.
    await helper.request({ type: 'join-audio' });
    if (titles.videoOnTitle) await helper.request(videoCommand(true));
    if (switchedToAutoHide) {
      toggleZoomAlwaysShowControls(meetingHandle);
      print('  Put Zoom\'s "Always show meeting controls" back on');
    }
    fakeMediaWindow?.kill();
    helper.stop();
  });

  it('finds the meeting while Zoom has hidden its toolbar, without touching the screen', async () => {
    await waitForHiddenToolbar();
    const cursor = getCursor();
    const foreground = getForegroundWindow();

    const state = await meeting();

    expect(state.found).toBe(true);
    expect(state.toolbarVisible).toBe(false);
    // Unknown rather than guessed while the toolbar is hidden.
    expect(state.audioJoined).toBeNull();
    expect(getCursor()).toEqual(cursor);
    expect(getForegroundWindow()).toBe(foreground);
  });

  it('reads the meeting through a hidden toolbar when asked to', async () => {
    await waitForHiddenToolbar();

    const state = await meeting(true);

    expect(state.toolbarVisible).toBe(true);
    expect(typeof state.audioJoined).toBe('boolean');
    expect(state.videoTitle).toBeTruthy();
  });

  it('leaves and rejoins computer audio starting from a hidden toolbar', async () => {
    await waitForHiddenToolbar();
    expect(await helper.request({ type: 'leave-audio' })).toEqual({
      changed: true,
      ok: true,
    });
    expect((await meeting(true)).audioJoined).toBe(false);

    await waitForHiddenToolbar();
    expect(await helper.request({ type: 'join-audio' })).toEqual({
      changed: true,
      ok: true,
    });
    expect((await meeting(true)).audioJoined).toBe(true);
  });

  it('never changes Zoom\'s "Always show meeting controls" setting', async () => {
    expect(await toolbarAutoHides()).toBe(true);

    await helper.request({ type: 'leave-audio' });
    await helper.request({ type: 'join-audio' });
    await helper.request({ type: 'video-title' });
    await helper.request({ type: 'share-entries' });
    await helper.request({ reveal: true, type: 'meeting' });

    expect(await toolbarAutoHides(), 'the toolbar still auto-hides').toBe(true);
  });

  it('puts the mouse and the focused window back after acting', async () => {
    lookAway();
    const [screen] = getScreens();
    const spot = { x: (screen?.x ?? 0) + 120, y: (screen?.y ?? 0) + 140 };
    setCursor(spot.x, spot.y);
    const foreground = getForegroundWindow();

    expect(await helper.request({ type: 'leave-audio' })).toMatchObject({
      ok: true,
    });
    expect(await helper.request({ type: 'join-audio' })).toMatchObject({
      ok: true,
    });

    expect(getCursor()).toEqual(spot);
    expect(getForegroundWindow()).toBe(foreground);
  });

  it('acts on a minimized Zoom window', async () => {
    minimizeWindow(meetingHandle);
    await sleep(1000);
    expect(isMinimized(meetingHandle)).toBe(true);
    expect((await meeting()).found).toBe(true);

    expect(await helper.request({ type: 'leave-audio' })).toEqual({
      changed: true,
      ok: true,
    });
    minimizeWindow(meetingHandle);
    await sleep(1000);
    expect(await helper.request({ type: 'join-audio' })).toEqual({
      changed: true,
      ok: true,
    });
    restoreWindow(meetingHandle);
  });

  it('reports nothing to do when Zoom is already in the requested state', async () => {
    await helper.request({ type: 'join-audio' });
    expect(await helper.request({ type: 'join-audio' })).toEqual({
      changed: false,
      ok: true,
    });
    expect(await helper.request({ type: 'stop-share' })).toEqual({
      changed: false,
      ok: true,
    });
    if (titles.videoOnTitle && titles.videoOffTitle) {
      await helper.request(videoCommand(true));
      expect(await helper.request(videoCommand(true))).toEqual({
        changed: false,
        ok: true,
      });
    }
  });

  it('refuses video titles that do not match Zoom, instead of guessing', async () => {
    const result = await helper.request({
      offTitle: 'Not a real title',
      on: false,
      onTitle: 'Another made-up title',
      type: 'set-video',
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/^video-title-unrecognized:/);
  });

  it('mutes everyone without anyone else in the meeting, without hanging', async () => {
    const startedAt = Date.now();
    const result = await helper.request({
      allowSelfUnmute: true,
      type: 'mute-all',
    });

    print(`    mute everyone, alone: ${JSON.stringify(result)}`);
    expect(Date.now() - startedAt).toBeLessThan(20_000);
    expect(result).toEqual({ changed: true, ok: true });
  });

  it('shares the media window and stops, on every monitor', async () => {
    const screens = getScreens();
    print(`    ${screens.length} monitor(s)`);
    for (const screen of screens) {
      moveWindow(meetingHandle, {
        height: Math.min(900, screen.height - 80),
        width: Math.min(1100, screen.width - 80),
        x: screen.x + 40,
        y: screen.y + 40,
      });
      focusWindow(meetingHandle);
      await sleep(1500);

      const started = await helper.request({
        shareButtonTitle: titles.shareButtonTitle,
        type: 'start-share',
        windowTitle: 'Media Player - M³',
      });
      expect(started, `start sharing on ${screen.name}`).toEqual({
        changed: true,
        ok: true,
      });
      expect((await meeting()).sharing).toBe(true);

      const stopped = await helper.request({ type: 'stop-share' });
      expect(stopped, `stop sharing on ${screen.name}`).toEqual({
        changed: true,
        ok: true,
      });
      await sleep(1000);
      expect((await meeting()).sharing).toBe(false);
    }
  });
});
