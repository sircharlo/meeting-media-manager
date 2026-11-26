import type {
  DateInfo,
  MediaItem,
  MediaSectionIdentifier,
  MediaSectionWithConfig,
} from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import en from 'src/i18n/en.json';
import { formatDate } from 'src/utils/date';
import { useAttentionStore } from 'stores/attention';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { useJwStore } from 'stores/jw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DialogMeetingSongCheck from '../DialogMeetingSongCheck.vue';

// Today's meeting, as the tests set it.
const meeting = vi.hoisted(() => ({
  coWeek: false,
  start: null as Date | null,
  type: 'we' as 'mw' | 'we' | null,
}));

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getMeetingStartToday: () => meeting.start,
  isCoWeek: () => meeting.coWeek,
  isMwMeetingDay: () => meeting.type === 'mw',
  isWeMeetingDay: () => meeting.type === 'we',
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'songs-cong';
const MINUTE = 60 * 1000;

let wrapper: undefined | VueWrapper;
let nextId = 0;

const song = (number: number, extra: Partial<MediaItem> = {}): MediaItem => ({
  tag: { type: 'song', value: number },
  title: `Song ${number}`,
  type: 'media',
  uniqueId: `song-${number}-${nextId++}`,
  ...extra,
});

const section = (
  uniqueId: MediaSectionIdentifier,
  items: MediaItem[],
): MediaSectionWithConfig => ({ config: { uniqueId }, items });

// Today's media, as M³ has them once fetched.
const setToday = (
  sections: MediaSectionWithConfig[],
  status: DateInfo['status'] = 'complete',
) => {
  const today: DateInfo = {
    date: new Date(new Date().setHours(0, 0, 0, 0)),
    mediaSections: sections,
    status,
  };
  useJwStore().lookupPeriod = { [CONGREGATION_ID]: [today] };
  return () => useJwStore().lookupPeriod[CONGREGATION_ID]?.[0] as DateInfo;
};

const GOOD_WEEKEND = () => [
  section('pt', [song(20)]),
  section('wt', [song(30), song(31)]),
];

const mountScreen = async (path = '/media-calendar') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: { template: '<div />' },
        name: 'media-calendar',
        path: '/media-calendar',
      },
      {
        component: { template: '<div />' },
        name: 'settings',
        path: '/settings',
      },
    ],
  });
  await router.push(path);
  wrapper = mount(DialogMeetingSongCheck, {
    attachTo: document.body,
    global: { plugins: [router] },
  });
  await flushPromises();
  return router;
};

const text = () => document.body.textContent ?? '';

// By the button's label alone: an icon's name is in its text too.
const click = async (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (el) => el.querySelector('.block')?.textContent?.trim() === label,
  );
  if (!button) throw new Error(`No button labelled "${label}"`);
  button.click();
  await flushPromises();
};

const isShowing = () =>
  useDialogStateStore().isDialogOpen('meeting-song-check');

const duplicateText = (number: number) =>
  en['meeting-song-check-duplicate'].replace('{number}', String(number));

// Lets the screen's clock tick, as it does every 30 seconds.
const tick = async () => {
  vi.advanceTimersByTime(30_000);
  await flushPromises();
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  meeting.coWeek = false;
  meeting.start = new Date(Date.now() + 60 * MINUTE);
  meeting.type = 'we';
  useDialogStateStore().closeAllDialogs();
  useAttentionStore().claims.clear();
  useAttentionStore().waiting.clear();
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings },
  };
  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;
  currentState.mediaPlaying.url = '';
  currentState.selectedDate = '2000/01/01';
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DialogMeetingSongCheck', () => {
  it('stays away when nothing is wrong with the songs', async () => {
    setToday(GOOD_WEEKEND());
    await mountScreen();

    expect(isShowing()).toBe(false);
  });

  it('shows a song that is in the meeting twice, and remembers it is on purpose', async () => {
    meeting.type = 'mw';
    const today = setToday([
      section('tgw', [song(12)]),
      section('lac', [song(40), song(12)]),
    ]);
    await mountScreen();

    expect(isShowing()).toBe(true);
    expect(text()).toContain(en['meeting-song-check-title']);
    expect(text()).toContain(duplicateText(12));

    await click(en['meeting-song-check-on-purpose']);

    expect(today().songCheckOkays).toEqual(['duplicate:12']);
    expect(isShowing()).toBe(false);
  });

  it("shows today's media at the song when asked, and doesn't ask again", async () => {
    meeting.type = 'mw';
    setToday([section('lac', [song(40), song(40)])]);
    await mountScreen();
    const target = document.createElement('div');
    const firstId = useJwStore().lookupPeriod[CONGREGATION_ID]?.[0]
      ?.mediaSections[0]?.items?.[0]?.uniqueId as string;
    target.dataset.id = firstId;
    target.scrollIntoView = vi.fn();
    document.body.append(target);

    await click(en['meeting-song-check-show-me']);

    expect(isShowing()).toBe(false);
    expect(useCurrentStateStore().selectedDate).toBe(
      formatDate(new Date(), 'YYYY/MM/DD'),
    );
    expect(target.scrollIntoView).toHaveBeenCalled();
    await tick();
    expect(isShowing()).toBe(false);
  });

  it('opens the song picker for the public talk, on today', async () => {
    setToday([section('pt', []), section('wt', [song(30), song(31)])]);
    await mountScreen();
    expect(text()).toContain(en['meeting-song-check-no-pt-song']);
    const opened: unknown[] = [];
    const onOpen = (e: Event) => opened.push((e as CustomEvent).detail);
    globalThis.addEventListener('openSongPicker', onOpen);

    await click(en['meeting-song-check-add-song']);
    globalThis.removeEventListener('openSongPicker', onOpen);

    expect(opened).toEqual([{ section: 'pt' }]);
    expect(isShowing()).toBe(false);
    expect(useCurrentStateStore().selectedDate).toBe(
      formatDate(new Date(), 'YYYY/MM/DD'),
    );
  });

  it('remembers a weekend without a public talk', async () => {
    const today = setToday([section('wt', [song(30)])]);
    await mountScreen();

    await click(en['meeting-song-check-no-public-talk']);

    expect(today().songCheckOkays).toEqual(['no-pt-song']);
    expect(isShowing()).toBe(false);
  });

  it("asks for the circuit overseer's song, at the midweek meeting too", async () => {
    meeting.type = 'mw';
    meeting.coWeek = true;
    setToday([
      section('tgw', [song(5)]),
      section('lac', [song(6), song(7, { hidden: true })]),
      section('circuit-overseer', []),
    ]);
    await mountScreen();
    expect(text()).toContain(en['meeting-song-check-no-co-song']);
    // Only the public talk's can be skipped.
    expect(text()).not.toContain(en['meeting-song-check-no-public-talk']);
    const opened: unknown[] = [];
    const onOpen = (e: Event) => opened.push((e as CustomEvent).detail);
    globalThis.addEventListener('openSongPicker', onOpen);

    await click(en['meeting-song-check-add-song']);
    globalThis.removeEventListener('openSongPicker', onOpen);

    expect(opened).toEqual([{ section: 'circuit-overseer' }]);
  });

  it('lists every problem together, and stays once they are fixed some other way', async () => {
    meeting.coWeek = true;
    const today = setToday([section('pt', []), section('wt', [song(30)])]);
    await mountScreen();
    expect(text()).toContain(en['meeting-song-check-no-pt-song']);
    expect(text()).toContain(en['meeting-song-check-no-co-song']);

    // Fixed from elsewhere, e.g. a sync.
    today().mediaSections[0]?.items?.push(song(20));
    await flushPromises();
    expect(isShowing()).toBe(true);
    expect(text()).not.toContain(en['meeting-song-check-no-pt-song']);

    today().mediaSections.push(section('circuit-overseer', [song(50)]));
    await flushPromises();
    expect(isShowing()).toBe(true);
    expect(text()).toContain(en['meeting-song-check-all-set']);

    await click(en.close);
    expect(isShowing()).toBe(false);
  });

  it('closes once its last problem is answered', async () => {
    meeting.type = 'mw';
    setToday([section('lac', [song(40), song(40), song(41), song(41)])]);
    await mountScreen();

    await click(en['meeting-song-check-on-purpose']);
    expect(isShowing()).toBe(true);
    expect(text()).not.toContain(duplicateText(40));

    await click(en['meeting-song-check-on-purpose']);
    expect(isShowing()).toBe(false);
  });

  it("waits for today's media to come in", async () => {
    const today = setToday([section('wt', [song(30)])], null);
    await mountScreen();
    expect(isShowing()).toBe(false);

    today().status = 'complete';
    await flushPromises();

    expect(isShowing()).toBe(true);
  });

  it('checks again when the songs change', async () => {
    const today = setToday(GOOD_WEEKEND());
    await mountScreen();
    expect(isShowing()).toBe(false);

    today().mediaSections[1]?.items?.push(song(20));
    await flushPromises();

    expect(text()).toContain(duplicateText(20));
  });

  it("doesn't show once the meeting has started, but stays if it was showing", async () => {
    meeting.start = new Date(Date.now() - MINUTE);
    setToday([section('wt', [song(30)])]);
    await mountScreen();
    expect(isShowing()).toBe(false);

    wrapper?.unmount();
    meeting.start = new Date(Date.now() + 10 * MINUTE);
    await mountScreen();
    expect(isShowing()).toBe(true);

    meeting.start = new Date(Date.now() - MINUTE);
    await tick();
    expect(isShowing()).toBe(true);
    expect(text()).toContain(en['meeting-song-check-no-pt-song']);
  });

  it("doesn't show on a day without a meeting", async () => {
    meeting.type = null;
    meeting.start = null;
    setToday([section('wt', [song(30)])]);
    await mountScreen();

    expect(isShowing()).toBe(false);
  });

  it('waits for the media calendar, and for media to stop playing', async () => {
    setToday([section('wt', [song(30)])]);
    useCurrentStateStore().mediaPlaying.url = 'file:///video.mp4';
    const router = await mountScreen('/settings');
    expect(isShowing()).toBe(false);

    await router.push('/media-calendar');
    await flushPromises();
    expect(isShowing()).toBe(false);

    useCurrentStateStore().mediaPlaying.url = '';
    await flushPromises();
    expect(isShowing()).toBe(true);
  });

  it('waits for its turn behind another dialog', async () => {
    useDialogStateStore().openDialog('something-else', 'SomethingElse');
    setToday([section('wt', [song(30)])]);
    await mountScreen();
    expect(isShowing()).toBe(false);

    useDialogStateStore().closeDialog('something-else');
    await flushPromises();

    expect(isShowing()).toBe(true);
  });

  it('asks once more 5 minutes before the meeting, after Later', async () => {
    setToday([section('wt', [song(30)])]);
    await mountScreen();

    await click(en.later);
    expect(isShowing()).toBe(false);
    meeting.start = new Date(Date.now() + 6 * MINUTE);
    await tick();
    expect(isShowing()).toBe(false);

    meeting.start = new Date(Date.now() + 4 * MINUTE);
    await tick();
    expect(isShowing()).toBe(true);

    await click(en.later);
    await tick();
    expect(isShowing()).toBe(false);
  });

  it('asks about a new problem after Later', async () => {
    const today = setToday([section('wt', [song(30)])]);
    await mountScreen();
    await click(en.later);

    today().mediaSections[0]?.items?.push(song(30));
    await flushPromises();

    expect(isShowing()).toBe(true);
    expect(text()).toContain(duplicateText(30));
  });
});
