import type * as VueUse from '@vueuse/core';

import { mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { MEDIA_STOP_FADE_DURATION_SECONDS } from 'src/constants/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref, type Ref } from 'vue';

// The media window gets everything from the main window over
// BroadcastChannels: feed them directly instead.
const channels = new Map<string, Ref<unknown>>();
const channel = (name: string) => {
  if (!channels.has(name)) channels.set(name, ref());
  return channels.get(name) as Ref<unknown>;
};

vi.mock('@vueuse/core', async (importOriginal) => ({
  ...(await importOriginal<typeof VueUse>()),
  useBroadcastChannel: ({ name }: { name: string }) => ({
    data: channel(name),
    post: vi.fn(),
  }),
}));

vi.mock('src/helpers/fonts', () => ({
  getJwIconFromKeyword: () => '',
  loadYeartextFont: vi.fn(() => Promise.resolve('')),
  setElementFont: vi.fn(() => Promise.resolve(true)),
}));

installQuasarPlugin();
installPinia();

const FADE_MS = MEDIA_STOP_FADE_DURATION_SECONDS * 1000;

const FIRST = 'file:///C:/media/first.jpg';
const SECOND = 'file:///C:/media/second.jpg';

let wrapper: undefined | VueWrapper;

const layers = () =>
  wrapper?.findAll('.display-layer').map((layer) => layer.classes()) ?? [];

/**
 * Sends the media window a new URL, then lets the clock run until the layer
 * at `index` starts fading in (a picture first waits to be decoded, for up to
 * half a second), so each check happens at the start of the fade.
 */
const show = async (url: string, index: number) => {
  channel('media-url').value = url;
  for (let step = 0; step < 100; step++) {
    await vi.advanceTimersByTimeAsync(10);
    if (layers()[index]?.includes('is-live')) return;
  }
  throw new Error(
    `layer ${index} never went live: ${JSON.stringify(layers())}`,
  );
};

const mountShowing = async (url: string) => {
  const { default: MediaPlayerPage } = await import('../MediaPlayerPage.vue');
  wrapper = mount(MediaPlayerPage, {
    global: {
      // Outside a QLayout, QPageContainer renders nothing.
      stubs: { QPageContainer: { template: '<div><slot /></div>' } },
    },
  });
  await show(url, 0);
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  channels.clear();
  vi.useRealTimers();
});

describe('MediaPlayerPage crossfade between two pictures', () => {
  it('keeps the outgoing picture fully shown under the next one until that one has faded in', async () => {
    await mountShowing(FIRST);

    await show(SECOND, 1);
    // The second picture fades in over the first, which stays shown
    // underneath instead of fading out to the background at the same time.
    expect(layers()[0]).toContain('is-outgoing');
    expect(layers()[0]).not.toContain('is-live');

    await vi.advanceTimersByTimeAsync(FADE_MS);
    expect(layers()[0]).not.toContain('is-outgoing');
    expect(layers()[1]).toContain('is-live');
  });

  it('fades the picture out as usual when audio comes next, since audio shows nothing', async () => {
    await mountShowing(FIRST);

    await show('file:///C:/media/song.mp3', 1);
    expect(layers()[0]).not.toContain('is-live');
    expect(layers()[0]).not.toContain('is-outgoing');
  });

  it('lets go of the outgoing picture when the media is stopped mid-crossfade', async () => {
    await mountShowing(FIRST);
    await show(SECOND, 1);
    expect(layers()[0]).toContain('is-outgoing');

    // Stopped before the crossfade is over: both fade out together, instead
    // of the first picture showing again as the second one fades away.
    channel('media-url').value = '';
    await vi.advanceTimersByTimeAsync(0);
    expect(layers().some((classes) => classes.includes('is-outgoing'))).toBe(
      false,
    );
    expect(layers().some((classes) => classes.includes('is-live'))).toBe(false);
  });

  it('crossfades back to the first picture when it comes back mid-crossfade', async () => {
    await mountShowing(FIRST);
    await show(SECOND, 1);

    await show(FIRST, 0);
    expect(layers()[0]).not.toContain('is-outgoing');
    expect(layers()[1]).toContain('is-outgoing');

    await vi.advanceTimersByTimeAsync(FADE_MS);
    expect(layers()[0]).toContain('is-live');
    expect(layers()[1]).not.toContain('is-outgoing');
  });
});
