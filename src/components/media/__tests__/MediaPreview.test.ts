import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { type CaptureSizeBounds, getCaptureSizeBounds } from 'src/utils/media';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import MediaPreview from '../MediaPreview.vue';

vi.mock('src/helpers/error-catcher', () => ({ errorCatcher: vi.fn() }));

installQuasarPlugin();
installPinia();

const CONG_ID = '00000000-0000-4000-8000-000000000001';
const VIDEO_URL = 'file:///tmp/preview-test.mp4';
const IMAGE_URL = 'file:///tmp/preview-test.jpg';

// Every instance registers window-level listeners (resize, pointer, keydown)
// and may hold a live capture stream; left mounted, instances from earlier
// tests keep reacting to later tests' events (e.g. a resize re-acquiring
// their own streams through the current test's getUserMedia mock).
const mounted: VueWrapper[] = [];
const mountPreview = () => {
  const wrapper = mount(MediaPreview);
  mounted.push(wrapper);
  return wrapper;
};
afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
});

const seedStores = () => {
  const currentState = useCurrentStateStore();
  const congregationSettings = useCongregationSettingsStore();
  congregationSettings.congregations = {
    [CONG_ID]: {
      ...defaultSettings,
      enableMediaDisplayButton: true,
      enableMediaPreview: true,
    },
  };
  currentState.currentCongregation = CONG_ID;
  currentState.mediaPlaying = {
    action: 'play',
    currentPosition: 100,
    currentPositionUpdatedAt: 0,
    duration: 400,
    pan: {},
    playbackConfirmedToken: 1,
    playbackRate: 1,
    playToken: 1,
    seekTo: 0,
    shouldLoop: false,
    slideshowAudioUrl: '',
    subtitlesUrl: '',
    uniqueId: 'preview-test',
    url: VIDEO_URL,
    zoom: 1,
  };
  return currentState;
};

// Drive one syncVideos run via the template's own @canplay handler, with the
// (fake) video element lagging 10s behind the reported position so the run
// registers exactly one drift correction. The first run seeds the element to
// the reported position instead (the element starts paused), so corrections
// land from the second run onward - five corrections in total trip the
// fallback or the disable.
const registerDrift = async (wrapper: VueWrapper): Promise<boolean> => {
  const video = wrapper.find('video');
  if (!video.exists()) return false;
  (video.element as HTMLVideoElement).currentTime = 90;
  await video.trigger('canplay');
  await nextTick();
  await nextTick();
  return true;
};

describe('MediaPreview drift handling', () => {
  beforeEach(() => {
    // Dev/test builds default to video mode unless localStorage opts into
    // canvas mode; make sure no previous test's opt-in leaks over.
    localStorage.removeItem('mediaPreviewRenderMode');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('falls back to the video element instead of disabling the preview after repeated drift in canvas mode', async () => {
    // Canvas mode is the production default; in dev/test builds the
    // component starts in video mode unless localStorage opts into canvas.
    localStorage.setItem('mediaPreviewRenderMode', 'canvas');
    const currentState = seedStores();

    const wrapper = mountPreview();
    await nextTick();

    expect(wrapper.find('canvas').exists()).toBe(true);

    // Six runs: the first seeds the element, the next five register drift
    // corrections and trip the fallback.
    for (let i = 0; i < 6; i++) {
      await registerDrift(wrapper);
    }

    // The preview stays on and switched to the cheap video-element path
    // instead of being turned off (MMM-V2-3EY regression).
    expect(currentState.currentSettings?.enableMediaPreview).toBe(true);
    expect(wrapper.find('canvas').exists()).toBe(false);

    // Drift persisting even in video mode still disables the preview.
    for (let i = 0; i < 5; i++) {
      await registerDrift(wrapper);
    }
    await nextTick();

    expect(currentState.currentSettings?.enableMediaPreview).toBe(false);
  });

  it('does not flag a synced preview as drifting at high playback rates when the position report is stale', async () => {
    // Canvas mode is the production default; in dev/test builds the
    // component starts in video mode unless localStorage opts into canvas.
    localStorage.setItem('mediaPreviewRenderMode', 'canvas');
    const currentState = seedStores();
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      // The last position report is ~300ms old (the media window's real-time
      // report cadence), so the extrapolated expected position covers ~3s
      // of media time at 10.5x - a perfectly synced preview sits within
      // that extrapolation uncertainty.
      currentPositionUpdatedAt: Date.now() - 300,
      playbackRate: 10.5,
    };

    const wrapper = mountPreview();
    await nextTick();

    const videoElement = wrapper.get('video').element as HTMLVideoElement;
    // Seed the element to the expected position (the first sync does this).
    await wrapper.get('video').trigger('canplay');
    await nextTick();

    // Lag 2.6s behind the extrapolated position: over the old flat
    // tolerance (0.2 * 10.5 = 2.1s) but under the report-age-aware one
    // (2.1s + 0.3 * 10.5 = 5.25s), so this used to be flagged as drifting
    // on every check and eventually disabled the preview.
    videoElement.currentTime = 100 + 0.3 * 10.5 - 2.6;

    for (let i = 0; i < 8; i++) {
      await wrapper.get('video').trigger('canplay');
      await nextTick();
      await nextTick();
    }

    // No drift corrections accumulated, so no fallback and no disable.
    expect(currentState.currentSettings?.enableMediaPreview).toBe(true);
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  it('does not jump the preview on a paused scrub when the reported position moved less than the high-rate tolerance', async () => {
    // Canvas mode is the production default; in dev/test builds the
    // component starts in video mode unless localStorage opts into canvas.
    localStorage.setItem('mediaPreviewRenderMode', 'canvas');
    const currentState = seedStores();
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      action: 'pause',
      // ~300ms-old report, matching the media window's real-time cadence.
      currentPositionUpdatedAt: Date.now() - 300,
      playbackRate: 10.5,
    };

    const wrapper = mountPreview();
    await nextTick();

    const videoElement = wrapper.get('video').element as HTMLVideoElement;
    videoElement.currentTime = 100;

    // A scrub 2.6s away: over the old zero tolerance (any difference
    // re-seeked the preview) but under the rate-aware one
    // (0.2 * 10.5 + 0.3 * 10.5 = 5.25s), so the preview should not jump.
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      currentPosition: 102.6,
    };
    await nextTick();
    await nextTick();

    expect(videoElement.currentTime).toBe(100);

    // A real scrub farther than the tolerance still follows immediately.
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      currentPosition: 130,
    };
    await nextTick();
    await nextTick();

    expect(videoElement.currentTime).toBe(130);
  });

  it('holds the preview instead of chasing a position report the media window stopped sending', async () => {
    const currentState = seedStores();
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      // MMM-V2-3EY: the media window stopped reporting 3.6s before the end
      // of a 266s song, and the preview was opened 32 minutes later.
      currentPosition: 262.24,
      currentPositionUpdatedAt: Date.now() - 32 * 60 * 1000,
      duration: 265.856,
    };

    const wrapper = mountPreview();
    await nextTick();

    const videoElement = wrapper.get('video').element as HTMLVideoElement;
    for (let i = 0; i < 12; i++) {
      await wrapper.get('video').trigger('canplay');
      await nextTick();
      await nextTick();
    }

    // No seeking, no playing, and so no drift corrections piling up into
    // the fallback and the auto-disable.
    expect(videoElement.currentTime).toBe(0);
    expect(videoElement.paused).toBe(true);
    expect(currentState.currentSettings?.enableMediaPreview).toBe(true);
  });

  it('never extrapolates the expected position past the end of the media', async () => {
    const currentState = seedStores();
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      // A 2s-old report 0.5s before the end extrapolates 1.5s past it.
      currentPosition: 399.5,
      currentPositionUpdatedAt: Date.now() - 2000,
      duration: 400,
    };

    const wrapper = mountPreview();
    await nextTick();

    // The first run seeds the paused element to the expected position.
    await wrapper.get('video').trigger('canplay');
    await nextTick();

    expect((wrapper.get('video').element as HTMLVideoElement).currentTime).toBe(
      400,
    );
  });

  it('disables the preview entirely when drift repeats in video mode', async () => {
    // Dev/test default is video mode - no localStorage opt-in needed.
    const currentState = seedStores();

    const wrapper = mountPreview();
    await nextTick();

    for (let i = 0; i < 6; i++) {
      await registerDrift(wrapper);
    }

    expect(currentState.currentSettings?.enableMediaPreview).toBe(false);
  });
});

// The dev/test build always runs with import.meta.env.DEV === true, where
// capture mode is manual-only (via the on-screen toggle) - the production
// auto-attempt/auto-fallback-to-canvas path (maybeAttemptCapture) is gated
// behind !isDev and isn't reachable from this harness. These tests cover the
// underlying capture-acquisition mechanics (acquireCaptureStream) through
// that manual toggle, which is the same code the automatic path calls.
describe('MediaPreview capture mode (dev toggle)', () => {
  // happy-dom's HTMLMediaElement.srcObject setter throws unless the value is
  // a real `instanceof MediaStream` - a plain fake object won't do. Canvas
  // captureStream() is happy-dom's own public way to obtain a genuine
  // MediaStream with a real MediaStreamTrack (whose constructor is otherwise
  // gated behind an unexported "illegal constructor" symbol).
  const createCaptureStream = () =>
    document.createElement('canvas').captureStream();

  const mockCaptureSuccess = () => {
    const stream = createCaptureStream();
    vi.spyOn(
      globalThis.electronApi,
      'getMediaWindowCaptureSourceId',
    ).mockResolvedValue('media-window-source-1');
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    return { getUserMedia, stream };
  };

  // The `mandatory` constraints of a getUserMedia call (the last by default).
  const getMandatory = (getUserMedia: ReturnType<typeof vi.fn>, call = -1) =>
    (
      getUserMedia.mock.calls.at(call)?.[0] as
        | undefined
        | {
            video: {
              mandatory: CaptureSizeBounds & {
                chromeMediaSource: string;
                chromeMediaSourceId: string;
                maxFrameRate: number;
              };
            };
          }
    )?.video.mandatory;

  // The zoomed-in preview's box: 90% of the window, 16:9 (see the
  // .media-preview--fullscreen CSS).
  const getZoomedInBounds = (
    viewportWidth = globalThis.innerWidth,
    viewportHeight = globalThis.innerHeight,
  ) => {
    const width = Math.min(
      viewportWidth * 0.9,
      viewportHeight * 0.9 * (16 / 9),
    );
    return getCaptureSizeBounds(
      width,
      width * (9 / 16),
      globalThis.devicePixelRatio || 1,
    );
  };

  const startCapture = async () => {
    const wrapper = mountPreview();
    await nextTick();
    await wrapper.get('.media-preview-mode-toggle').trigger('click');
    await flushPromises();
    return wrapper;
  };

  beforeEach(() => {
    localStorage.removeItem('mediaPreviewRenderMode');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'mediaDevices');
  });

  it('cycles the toggle through video, capture, canvas, and back to video', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    mockCaptureSuccess();
    seedStores();

    const wrapper = mountPreview();
    await nextTick();
    const toggle = wrapper.get('.media-preview-mode-toggle');
    expect(toggle.text()).toBe('video');

    await toggle.trigger('click');
    await flushPromises();
    expect(wrapper.get('.media-preview-mode-toggle').text()).toBe('capture');

    await wrapper.get('.media-preview-mode-toggle').trigger('click');
    await flushPromises();
    expect(wrapper.get('.media-preview-mode-toggle').text()).toBe('canvas');

    await wrapper.get('.media-preview-mode-toggle').trigger('click');
    await flushPromises();
    expect(wrapper.get('.media-preview-mode-toggle').text()).toBe('video');
  });

  it('shows the captured stream as it is, sized for the collapsed preview at up to 30 frames a second', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { getUserMedia, stream } = mockCaptureSuccess();
    seedStores();

    const wrapper = await startCapture();

    expect(getMandatory(getUserMedia)).toMatchObject({
      chromeMediaSource: 'tab',
      chromeMediaSourceId: 'media-window-source-1',
      maxFrameRate: 30,
      // The bounds also keep Chromium off its tab-capture default of a
      // fixed frame sized from the largest dimensions across all displays,
      // which letterboxes the media window with black bars baked into every
      // frame. Their own invariants are covered by getCaptureSizeBounds'
      // unit tests.
      minHeight: 2,
      minWidth: 2,
    });
    // No bigger than the collapsed preview can be (520 CSS px wide), rather
    // than the whole window.
    expect(getMandatory(getUserMedia)?.maxWidth).toBeLessThanOrEqual(
      520 * (globalThis.devicePixelRatio || 1),
    );
    const captureVideo = wrapper.get('video').element as HTMLVideoElement;
    expect(captureVideo.srcObject).toBe(stream);
    // The frames already arrive at the preview's size, so the capture
    // <video> is what's shown, with no canvas redrawing it.
    expect(
      captureVideo.classList.contains('media-preview-content--source'),
    ).toBe(false);
    expect(wrapper.find('canvas').exists()).toBe(false);
  });

  it('re-acquires at the zoomed-in size while the preview is zoomed in, and back', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { getUserMedia } = mockCaptureSuccess();
    seedStores();

    const wrapper = await startCapture();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    const collapsed = getMandatory(getUserMedia);

    await wrapper.get('.media-preview').trigger('click');
    await flushPromises();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    expect(getMandatory(getUserMedia)).toMatchObject({
      ...getZoomedInBounds(),
      maxFrameRate: 30,
    });

    await wrapper.get('.media-preview').trigger('click');
    await flushPromises();
    expect(getUserMedia).toHaveBeenCalledTimes(3);
    expect(getMandatory(getUserMedia)).toEqual(collapsed);
  });

  it('stops the running capture before asking for another, one request at a time', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { getUserMedia, stream } = mockCaptureSuccess();
    seedStores();

    const wrapper = await startCapture();
    const collapsed = getMandatory(getUserMedia);
    const captureVideo = wrapper.get('video').element as HTMLVideoElement;
    const pause = vi.spyOn(captureVideo, 'pause');

    // Chromium answers a capture of a window that's already being captured
    // with that running capture, at its size, whatever the new one asks for.
    // So: how many captures are running at each request?
    const handedOut = [stream];
    const runningAtRequest: number[] = [];
    const pending: ((stream: MediaStream) => void)[] = [];
    getUserMedia.mockImplementation(() => {
      runningAtRequest.push(
        handedOut.filter((s) => s.getVideoTracks()[0]?.readyState === 'live')
          .length,
      );
      return new Promise<MediaStream>((resolve) => {
        pending.push((next) => {
          handedOut.push(next);
          resolve(next);
        });
      });
    });

    // Zoomed in: the running capture stops first, its last frame held
    // (a paused <video>) rather than cleared to black.
    await wrapper.get('.media-preview').trigger('click');
    await flushPromises();
    expect(runningAtRequest).toEqual([0]);
    expect(pause).toHaveBeenCalled();
    expect(captureVideo.srcObject).toBe(stream);

    // Straight back out, while that request is still pending: the next one
    // waits for it.
    await wrapper.get('.media-preview').trigger('click');
    await flushPromises();
    expect(pending).toHaveLength(1);

    pending.shift()?.(createCaptureStream());
    await flushPromises();
    expect(runningAtRequest).toEqual([0, 0]);
    expect(getMandatory(getUserMedia)).toEqual(collapsed);

    const last = createCaptureStream();
    pending.shift()?.(last);
    await flushPromises();
    expect(captureVideo.srcObject).toBe(last);
  });

  it('never asks for frames bigger than the media window itself', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { getUserMedia } = mockCaptureSuccess();
    vi.spyOn(
      globalThis.electronApi,
      'getMediaWindowCaptureSize',
    ).mockResolvedValue({ height: 360, width: 640 });
    seedStores();

    const wrapper = await startCapture();
    await wrapper.get('.media-preview').trigger('click');
    await flushPromises();

    // The zoomed-in preview is bigger than that, but asking for more than
    // the media window's size makes Chromium render the media window itself
    // bigger for as long as the capture runs.
    expect(getZoomedInBounds().maxWidth).toBeGreaterThan(640);
    expect(getMandatory(getUserMedia)).toMatchObject(
      getCaptureSizeBounds(640, 360),
    );
  });

  it('stops capturing while the preview is hidden and starts again when it comes back', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { getUserMedia, stream } = mockCaptureSuccess();
    const currentState = seedStores();

    const wrapper = await startCapture();
    expect(stream.getVideoTracks()[0]?.readyState).toBe('live');

    // The media item ends: nothing to preview, so nothing to capture.
    currentState.mediaPlaying = { ...currentState.mediaPlaying, url: '' };
    await flushPromises();
    expect(wrapper.find('video').exists()).toBe(false);
    expect(stream.getVideoTracks()[0]?.readyState).toBe('ended');

    // The next one starts: capturing again, still in capture mode.
    const nextStream = createCaptureStream();
    getUserMedia.mockResolvedValueOnce(nextStream);
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      url: VIDEO_URL,
    };
    await flushPromises();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
    const captureVideo = wrapper.get('video').element as HTMLVideoElement;
    expect(captureVideo.srcObject).toBe(nextStream);
    expect(wrapper.get('.media-preview-mode-toggle').text()).toBe('capture');
  });

  it('drops a capture that finishes starting after the preview has gone', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { getUserMedia } = mockCaptureSuccess();
    let finishStarting: (stream: MediaStream) => void = () => undefined;
    getUserMedia.mockImplementationOnce(
      () =>
        new Promise<MediaStream>((resolve) => {
          finishStarting = resolve;
        }),
    );
    const currentState = seedStores();

    await startCapture();
    currentState.mediaPlaying = { ...currentState.mediaPlaying, url: '' };
    await flushPromises();

    const lateStream = createCaptureStream();
    finishStarting(lateStream);
    await flushPromises();
    expect(lateStream.getVideoTracks()[0]?.readyState).toBe('ended');

    // And it doesn't count as running: the preview coming back starts one.
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      url: VIDEO_URL,
    };
    await flushPromises();
    expect(getUserMedia).toHaveBeenCalledTimes(2);
  });

  it('shows progress in capture mode from mediaPlaying.duration, not a local video element', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    mockCaptureSuccess();
    seedStores();

    const wrapper = mountPreview();
    await nextTick();
    await wrapper.get('.media-preview-mode-toggle').trigger('click');
    await flushPromises();
    // Progress only renders in the fullscreen modal view.
    await wrapper.get('.media-preview').trigger('click');
    await nextTick();

    // seedStores() sets currentPosition: 100, duration: 400 -> 25%.
    const bar = wrapper.get('.media-preview-progress__bar')
      .element as HTMLElement;
    expect(bar.style.transform).toBe('scaleX(0.25)');
  });

  it('mirrors an image item in capture mode too, instead of the plain <img> fallback', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { stream } = mockCaptureSuccess();
    const currentState = seedStores();
    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      url: IMAGE_URL,
    };

    const wrapper = mountPreview();
    await nextTick();
    await wrapper.get('.media-preview-mode-toggle').trigger('click');
    await flushPromises();

    expect(wrapper.find('img').exists()).toBe(false);
    const captureVideo = wrapper.get('video').element as HTMLVideoElement;
    expect(captureVideo.srcObject).toBe(stream);
  });

  it('handles a failed capture acquisition without crashing, leaving no stream attached', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    vi.spyOn(
      globalThis.electronApi,
      'getMediaWindowCaptureSourceId',
    ).mockResolvedValue(null);
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    seedStores();

    const wrapper = mountPreview();
    await nextTick();
    await wrapper.get('.media-preview-mode-toggle').trigger('click');
    await flushPromises();

    // Dev's manual toggle sets the mode unconditionally (best-effort) -
    // unlike the production auto-attempt path, it doesn't fall back to
    // canvas on failure, since the developer explicitly asked for this mode.
    expect(wrapper.get('.media-preview-mode-toggle').text()).toBe('capture');
    expect(getUserMedia).not.toHaveBeenCalled();
    const captureVideo = wrapper.get('video').element as HTMLVideoElement;
    expect(captureVideo.srcObject).toBeNull();
  });

  it('tears down the stream when its track ends, without auto-switching modes in dev', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { stream } = mockCaptureSuccess();
    seedStores();

    const wrapper = mountPreview();
    await nextTick();
    await wrapper.get('.media-preview-mode-toggle').trigger('click');
    await flushPromises();

    const captureVideo = wrapper.get('video').element as HTMLVideoElement;
    expect(captureVideo.srcObject).toBe(stream);

    stream.getVideoTracks()[0]?.onended?.(new Event('ended'));
    await nextTick();

    expect(captureVideo.srcObject).toBeNull();
    // Dev is manual-only - the mode label stays on 'capture' rather than
    // silently reverting, so the developer sees the black frame and knows
    // to re-toggle rather than being auto-switched without any signal.
    expect(wrapper.get('.media-preview-mode-toggle').text()).toBe('capture');
  });

  it("re-acquires the zoomed-in preview's stream only after the main window changes size substantially", async () => {
    vi.useFakeTimers();
    const original = {
      height: globalThis.innerHeight,
      width: globalThis.innerWidth,
    };
    const setViewport = (width: number, height: number) => {
      Object.defineProperty(globalThis, 'innerWidth', {
        configurable: true,
        value: width,
      });
      Object.defineProperty(globalThis, 'innerHeight', {
        configurable: true,
        value: height,
      });
    };
    const resize = async () => {
      globalThis.dispatchEvent(new Event('resize'));
      // Past the re-acquire debounce.
      await vi.advanceTimersByTimeAsync(1000);
      await flushPromises();
    };

    try {
      localStorage.setItem('mediaPreviewRenderMode', 'video');
      const { getUserMedia } = mockCaptureSuccess();
      seedStores();

      const wrapper = await startCapture();
      await wrapper.get('.media-preview').trigger('click');
      await flushPromises();
      expect(getUserMedia).toHaveBeenCalledTimes(2);

      // A small nudge isn't worth a new stream...
      setViewport(
        Math.round(original.width * 1.1),
        Math.round(original.height * 1.1),
      );
      await resize();
      expect(getUserMedia).toHaveBeenCalledTimes(2);

      // ...doubling is, and the new request fits the new zoomed-in box.
      setViewport(original.width * 2, original.height * 2);
      await resize();
      expect(getUserMedia).toHaveBeenCalledTimes(3);
      expect(getMandatory(getUserMedia)).toMatchObject({
        ...getZoomedInBounds(original.width * 2, original.height * 2),
        maxFrameRate: 30,
      });
    } finally {
      setViewport(original.width, original.height);
      vi.useRealTimers();
    }
  });
});

describe('MediaPreview canvas frame geometry', () => {
  beforeEach(() => {
    localStorage.removeItem('mediaPreviewRenderMode');
    vi.restoreAllMocks();
  });

  // Canvas mode while paused is the one path that draws synchronously from a
  // template event, so it's the one driven here.
  it('draws a frame whose shape differs from the canvas centered with its aspect ratio kept, not stretched', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'canvas');
    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    const currentState = seedStores();
    currentState.mediaPlaying.action = 'pause';

    const wrapper = mountPreview();
    await nextTick();

    const video = wrapper.get('video').element as HTMLVideoElement;
    // A 4:3 source frame...
    Object.defineProperty(video, 'videoWidth', {
      configurable: true,
      value: 1440,
    });
    Object.defineProperty(video, 'videoHeight', {
      configurable: true,
      value: 1080,
    });
    // ...into a 16:9 canvas box (happy-dom lays nothing out, so the CSS box
    // size has to be provided; devicePixelRatio is 1 here).
    const canvas = wrapper.get('canvas').element as HTMLCanvasElement;
    Object.defineProperty(canvas, 'clientWidth', {
      configurable: true,
      value: 320,
    });
    Object.defineProperty(canvas, 'clientHeight', {
      configurable: true,
      value: 180,
    });

    await wrapper.get('video').trigger('canplay');
    await flushPromises();

    expect(canvas.width).toBe(320);
    expect(canvas.height).toBe(180);
    expect(context.drawImage).toHaveBeenLastCalledWith(video, 40, 0, 240, 180);
    // The pillarbox bars aren't overdrawn, so the canvas must be cleared
    // first rather than keeping whatever an earlier frame left there.
    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 320, 180);
  });
});

describe('MediaPreview fullscreen backdrop', () => {
  it('closes the fullscreen preview from a backdrop button kept out of the tab order', async () => {
    const currentState = seedStores();
    currentState.mediaPlaying.url = IMAGE_URL;
    const wrapper = mountPreview();
    await flushPromises();

    await wrapper.find('button.media-preview').trigger('click');
    const backdrop = wrapper.find('.media-preview-backdrop');
    expect(backdrop.element.tagName).toBe('BUTTON');
    expect(backdrop.attributes('tabindex')).toBe('-1');
    expect(backdrop.attributes('aria-label')).toBeTruthy();

    await backdrop.trigger('click');
    expect(wrapper.find('.media-preview-backdrop').exists()).toBe(false);
  });
});
