import { mount, type VueWrapper } from '@vue/test-utils';
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
