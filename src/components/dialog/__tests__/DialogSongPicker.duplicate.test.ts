import type { DateInfo } from 'src/types';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import en from 'src/i18n/en.json';
import { formatDate } from 'src/utils/date';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const CONGREGATION_ID = 'picker-cong';
const SONGS = [5, 12].map((track) => ({
  file: { url: `https://cdn/sjjm_E_${track}.mp4` },
  filesize: 1234,
  title: `Song ${track}`,
  track,
}));

let day: DateInfo;

// A weekday as the settings count them: 0 is Monday.
const weekDay = (offset = 0) =>
  String((new Date().getDay() + 6 + offset) % 7) as '0';

// Today is the midweek meeting's day, unless `meetingToday` is false.
const setMeetingDays = (meetingToday = true) => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      lang: 'E',
      maxRes: '720p',
      mwDay: weekDay(meetingToday ? 0 : 2),
      weDay: weekDay(4),
    },
  };
};

beforeEach(() => {
  setMeetingDays();
  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;
  currentState.selectedDate = formatDate(new Date(), 'YYYY/MM/DD');
  const jwStore = useJwStore();
  jwStore.jwSongs = {
    E: { list: SONGS, updated: new Date() },
  } as typeof jwStore.jwSongs;
  day = {
    date: new Date(new Date().setHours(0, 0, 0, 0)),
    mediaSections: [
      {
        config: { uniqueId: 'lac' },
        items: [
          {
            tag: { type: 'song', value: 12 },
            title: 'Song 12',
            type: 'media',
            uniqueId: 'song-12',
          },
        ],
      },
    ],
    status: 'complete',
  };
  jwStore.lookupPeriod = { [CONGREGATION_ID]: [day] };
  getPubMediaLinksMock.mockResolvedValue({ files: { E: { MP4: [] } } });
  getJwMediaInfoMock.mockResolvedValue({ thumbnail: '', title: '' });
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

const mountPicker = async () => {
  const wrapper = mount(DialogSongPicker, {
    attachTo: document.body,
    props: { dialogId: 'song-picker', modelValue: true, section: 'lac' },
  });
  await flushPromises();
  return wrapper;
};

const clickButton = async (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (el) => el.textContent?.trim() === label,
  );
  if (!button) throw new Error(`No button labelled "${label}"`);
  button.click();
  await flushPromises();
};

const confirmTitle = () =>
  document.body.textContent?.includes(en['song-already-in-meeting-title']);

const imported = (wrapper: Awaited<ReturnType<typeof mountPicker>>) =>
  (wrapper.emitted('import') ?? []).map(
    ([data]) => (data as { songTrack: number }).songTrack,
  );

describe('DialogSongPicker, a song already in the meeting', () => {
  it('adds a song the meeting does not have yet at once', async () => {
    const wrapper = await mountPicker();

    await clickButton('5');

    expect(confirmTitle()).toBe(false);
    expect(imported(wrapper)).toEqual([5]);
  });

  it('asks first, then adds it again and stops the song check asking', async () => {
    const wrapper = await mountPicker();

    await clickButton('12');
    expect(confirmTitle()).toBe(true);
    expect(document.body.textContent).toContain(
      en['song-already-in-meeting-message'].replace('{number}', '12'),
    );
    expect(imported(wrapper)).toEqual([]);

    await clickButton(en['song-already-in-meeting-confirm']);

    expect(imported(wrapper)).toEqual([12]);
    expect(day.songCheckOkays).toEqual(['duplicate:12']);
  });

  it('adds nothing when cancelled', async () => {
    const wrapper = await mountPicker();

    await clickButton('12');
    const cancelButtons = Array.from(
      document.querySelectorAll('button'),
    ).filter((el) => el.textContent?.trim() === en.cancel);
    // The confirmation's, opened over the picker.
    cancelButtons.at(-1)?.click();
    await flushPromises();

    expect(imported(wrapper)).toEqual([]);
    expect(day.songCheckOkays).toBeUndefined();
  });

  it("doesn't ask on a day without a meeting", async () => {
    setMeetingDays(false);
    const wrapper = await mountPicker();

    await clickButton('12');

    expect(confirmTitle()).toBe(false);
    expect(imported(wrapper)).toEqual([12]);
  });
});
