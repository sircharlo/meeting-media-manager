import type { ChildProcess } from 'node:child_process';

import { MEDIA_WINDOW_TITLE } from 'src/constants/zoom';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  canRunLive,
  createHelper,
  ensureMeeting,
  openFakeMediaWindow,
  print,
  sleep,
  titles,
} from './support';
import {
  findWindowByTitle,
  getVisibleWindowRects,
  getWindowRect,
} from './windows';

// Only the share part of the Zoom helper, live: what happens between
// pressing Share in Zoom's picker and M³ saying "Sharing started". The
// notification waits for the helper's answer, so how long the answer takes
// is what the user feels; and Zoom's annotation layer, read apart from the
// helper, tells whether the media window really is what Zoom shares.
// Needs only the host in the meeting (`yarn test:zoom-share`).

// The helper's own timing line (see StartShare in ZoomHelper.cs).
const TIMING_LINE =
  /start-share clicked at (\d+) ms, sharing at (\d+) ms, window (\w+) at (\d+) ms$/;

// How long the window check may take once Zoom shares. It gets about a
// second to watch the annotation layer move over what's shared
// (ShareWindowGraceMs), then stops waiting for it rather than waiting out
// the whole timeout, as it used to for four seconds.
const MAX_AFTER_CLICK_MS = 2500;

type Rect = ReturnType<typeof getWindowRect>;

/** Whether a window sits over another one, within a few pixels. */
const covers = (window: Rect, other: Rect) =>
  Math.abs(window.x - other.x) < 20 &&
  Math.abs(window.y - other.y) < 20 &&
  Math.abs(window.width - other.width) < 30 &&
  Math.abs(window.height - other.height) < 30;

describe.skipIf(!canRunLive)('Zoom helper, live share', () => {
  const logs: string[] = [];
  const helper = createHelper({ onLog: (line) => logs.push(line) });
  let fakeMediaWindow: ChildProcess | undefined;

  const sharing = async () => {
    const result = await helper.request({ type: 'meeting' });
    expect(result.ok).toBe(true);
    return result.meeting?.sharing === true;
  };

  const startShare = () =>
    helper.request({
      shareButtonTitle: titles.shareButtonTitle,
      type: 'start-share',
      windowTitle: MEDIA_WINDOW_TITLE,
    });

  const stopShare = () => helper.request({ type: 'stop-share' });

  /** How the helper timed the share started last, in its own words. */
  const lastShareTiming = () => {
    const line = [...logs].reverse().find((entry) => TIMING_LINE.test(entry));
    expect(line, 'the helper logs how long the share took').toBeTruthy();
    const [, clicked, sharingAt, verdict, total] =
      (line ?? '').match(TIMING_LINE) ?? [];
    return {
      afterClickMs: Number(total) - Number(clicked),
      sharingMs: Number(sharingAt) - Number(clicked),
      verdict,
    };
  };

  /** Zoom's annotation layer over the media window, found apart from the helper. */
  const annotationOverMedia = async () => {
    const media = getWindowRect(findWindowByTitle('Media Player - M'));
    for (let attempt = 0; attempt < 10; attempt++) {
      const layer = getVisibleWindowRects('ZoomAnnoWindowWndClass').find(
        (rect) => rect.width > 50 && covers(rect, media),
      );
      if (layer) return layer;
      await sleep(500);
    }
    return null;
  };

  beforeAll(async () => {
    expect(await helper.start()).toEqual({ ok: true });
    await ensureMeeting(helper);
    // Whatever the previous test left behind, and no share before the first.
    await stopShare();
    fakeMediaWindow = openFakeMediaWindow();
    await sleep(2000);
    expect(
      findWindowByTitle('Media Player - M'),
      'the stand-in media window',
    ).not.toBe(0);
  });

  afterAll(async () => {
    await stopShare();
    fakeMediaWindow?.kill();
    helper.stop();
  });

  it('shares the media window, and answers as soon as Zoom shares it', async () => {
    const startedAt = Date.now();
    const started = await startShare();
    const requestMs = Date.now() - startedAt;
    expect(started).toMatchObject({ changed: true, ok: true });

    const timing = lastShareTiming();
    print(
      `    start-share: ${requestMs} ms in all, sharing after ${timing.sharingMs} ms, ` +
        `"${timing.verdict}" ${timing.afterClickMs} ms after the click`,
    );
    expect(timing.afterClickMs).toBeLessThanOrEqual(MAX_AFTER_CLICK_MS);
    expect(await sharing()).toBe(true);

    // Checked apart from the helper: Zoom lays its annotation layer over
    // whatever it shares, so this is the media window and not another one.
    expect(
      await annotationOverMedia(),
      'the annotation layer covers the media window',
    ).not.toBeNull();

    expect(await stopShare()).toMatchObject({ changed: true, ok: true });
    await sleep(1000);
    expect(await sharing()).toBe(false);
  });

  it('starts again as quickly as the first time', async () => {
    expect(await startShare()).toMatchObject({ changed: true, ok: true });
    const timing = lastShareTiming();
    print(
      `    start-share again: "${timing.verdict}" ${timing.afterClickMs} ms after the click`,
    );
    expect(timing.afterClickMs).toBeLessThanOrEqual(MAX_AFTER_CLICK_MS);

    expect(await stopShare()).toMatchObject({ changed: true, ok: true });
    await sleep(1000);
    expect(await sharing()).toBe(false);
  });

  it('reports nothing to do when it is already sharing, or not sharing at all', async () => {
    expect(await startShare()).toMatchObject({ changed: true, ok: true });

    const startedAt = Date.now();
    expect(await startShare()).toMatchObject({ changed: false, ok: true });
    print(`    start-share while sharing: ${Date.now() - startedAt} ms`);
    expect(Date.now() - startedAt).toBeLessThan(3000);

    expect(await stopShare()).toMatchObject({ changed: true, ok: true });
    await sleep(1000);
    expect(await stopShare()).toMatchObject({ changed: false, ok: true });
  });
});
