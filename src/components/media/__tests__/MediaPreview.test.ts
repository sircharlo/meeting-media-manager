import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import MediaPreview from '../MediaPreview.vue';

installQuasarPlugin();
installPinia();

const CONG_ID = '00000000-0000-4000-8000-000000000001';
const VIDEO_URL = 'file:///tmp/preview-test.mp4';
const IMAGE_URL = 'file:///tmp/preview-test.jpg';

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

    const wrapper = mount(MediaPreview);
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

    const wrapper = mount(MediaPreview);
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

    const wrapper = mount(MediaPreview);
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

  it('disables the preview entirely when drift repeats in video mode', async () => {
    // Dev/test default is video mode - no localStorage opt-in needed.
    const currentState = seedStores();

    const wrapper = mount(MediaPreview);
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

    const wrapper = mount(MediaPreview);
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

  it('attaches the captured stream to the hidden source video and draws it through the smoothed canvas', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    const { getUserMedia, stream } = mockCaptureSuccess();
    seedStores();

    const wrapper = mount(MediaPreview);
    await nextTick();
    await wrapper.get('.media-preview-mode-toggle').trigger('click');
    await flushPromises();

    expect(getUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({
          mandatory: expect.objectContaining({
            chromeMediaSource: 'tab',
            chromeMediaSourceId: 'media-window-source-1',
          }),
        }),
      }),
    );
    const captureVideo = wrapper.get('video').element as HTMLVideoElement;
    expect(captureVideo.srcObject).toBe(stream);
    // The raw capture <video> is the hidden frame source; the canvas is what's
    // actually shown, matching canvas mode's existing antialiasing.
    expect(
      captureVideo.classList.contains('media-preview-content--source'),
    ).toBe(true);
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  it('shows progress in capture mode from mediaPlaying.duration, not a local video element', async () => {
    localStorage.setItem('mediaPreviewRenderMode', 'video');
    mockCaptureSuccess();
    seedStores();

    const wrapper = mount(MediaPreview);
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

    const wrapper = mount(MediaPreview);
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

    const wrapper = mount(MediaPreview);
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

    const wrapper = mount(MediaPreview);
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
});
