import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DialogSongPicker from '../DialogSongPicker.vue';

const { getJwMediaInfoMock, getPubMediaLinksMock } = vi.hoisted(() => ({
  getJwMediaInfoMock: vi.fn(),
  getPubMediaLinksMock: vi.fn(),
}));

vi.mock('src/helpers/jw-media', () => ({
  getJwMediaInfo: getJwMediaInfoMock,
  getPubMediaLinks: getPubMediaLinksMock,
}));

installQuasarPlugin();
installPinia();

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

const CACHED_SONG = {
  file: { url: 'https://cdn/sjjm_E_005.mp4' },
  filesize: 1234,
  title: 'Cached Song 5',
  track: 5,
};

const CONGREGATION_ID = 'test-cong';

const setupStores = () => {
  const congregationSettingsStore = useCongregationSettingsStore();
  congregationSettingsStore.congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      lang: 'E',
      maxRes: '720p',
    },
  };

  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;

  // currentSongbook (a getter) resolves to the non-sign-language default
  // (pub: 'sjjm') as long as jwLanguages has no sign-language entry for
  // 'E', which is already true of the store's own initial state.
  const jwStore = useJwStore();
  jwStore.jwSongs = {
    E: { list: [CACHED_SONG], updated: new Date() },
  } as typeof jwStore.jwSongs;

  return { currentState, jwStore };
};

/** DialogSongPicker renders one q-btn per song, labeled with the track
 * number - click the one matching `track` to trigger addSong(track). */
const clickSongButton = async (track: number) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (el) => el.textContent?.trim() === String(track),
  );
  if (!button) throw new Error(`No song button found for track ${track}`);
  (button as HTMLButtonElement).click();
  await flushPromises();
};

describe('DialogSongPicker edge cases', () => {
  it('falls back to the cached song when the live fetch returns nothing', async () => {
    setupStores();
    getPubMediaLinksMock.mockResolvedValue({ files: { E: { MP4: [] } } });
    getJwMediaInfoMock.mockResolvedValue({ thumbnail: '', title: '' });

    const wrapper = mount(DialogSongPicker, {
      props: { dialogId: 'song-picker', modelValue: true, section: undefined },
    });
    await flushPromises();

    await clickSongButton(5);

    const emitted = wrapper.emitted('import');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toMatchObject({
      files: [CACHED_SONG],
      songTrack: 5,
    });
  });

  it('emits an empty files list when nothing is cached for that track either', async () => {
    setupStores();
    getPubMediaLinksMock.mockResolvedValue({ files: { E: { MP4: [] } } });
    getJwMediaInfoMock.mockResolvedValue({ thumbnail: '', title: '' });

    const wrapper = mount(DialogSongPicker, {
      props: { dialogId: 'song-picker', modelValue: true, section: undefined },
    });
    await flushPromises();

    // Track 5 is the only cached song; click it but simulate a track that
    // has no cache match by asserting on the real (only) rendered button
    // instead - so directly verify the "nothing to fall back to" shape by
    // clearing the cache before clicking.
    useJwStore().jwSongs = { E: { list: [], updated: new Date() } } as never;

    await clickSongButton(5);

    const emitted = wrapper.emitted('import');
    expect(emitted?.[0]?.[0]).toMatchObject({ files: [], songTrack: 5 });
  });

  it('prefers the live result over the cache when the live fetch succeeds', async () => {
    setupStores();
    getPubMediaLinksMock.mockResolvedValue({
      files: {
        E: {
          MP4: [
            {
              file: { url: 'https://cdn/live.mp4' },
              filesize: 999,
              title: 'Live song',
              track: 5,
            },
          ],
        },
      },
    });
    getJwMediaInfoMock.mockResolvedValue({
      thumbnail: 'https://cdn/live-thumb.jpg',
      title: 'Live song',
    });

    const wrapper = mount(DialogSongPicker, {
      props: { dialogId: 'song-picker', modelValue: true, section: undefined },
    });
    await flushPromises();

    await clickSongButton(5);

    const emitted = wrapper.emitted('import');
    expect(emitted?.[0]?.[0]).toMatchObject({
      files: [
        expect.objectContaining({ file: { url: 'https://cdn/live.mp4' } }),
      ],
      thumbnail: 'https://cdn/live-thumb.jpg',
    });
  });
});
