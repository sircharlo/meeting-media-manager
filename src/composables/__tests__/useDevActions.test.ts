import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { updateLookupPeriod } from 'src/helpers/date';
import {
  devMainFaults,
  devMeetingOverride,
  devRendererFaults,
} from 'src/helpers/dev-state';
import { fetchMedia } from 'src/helpers/jw-media';
import { checkLowDiskSpaceAndNotify } from 'src/helpers/notifications';
import { formatDate } from 'src/utils/date';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import { type DevAction, useDevActions } from '../useDevActions';

// Today's meeting by the profile's real schedule.
const realMeeting = vi.hoisted(() => ({ type: null as 'mw' | 'we' | null }));

vi.mock('src/helpers/date', async (importOriginal) => {
  const actual = await importOriginal<object>();
  const { getDevMeetingOn } = await import('src/helpers/dev-state');
  const meetingType = (date?: Date) =>
    getDevMeetingOn(date)?.type ?? realMeeting.type;
  return {
    ...actual,
    isMwMeetingDay: (date?: Date) => meetingType(date) === 'mw',
    isWeMeetingDay: (date?: Date) => meetingType(date) === 'we',
    updateLookupPeriod: vi.fn(),
  };
});

vi.mock('src/helpers/jw-media', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  fetchMedia: vi.fn(),
}));

vi.mock('src/helpers/notifications', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  checkLowDiskSpaceAndNotify: vi.fn(),
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'dev-cong';
const MINUTE_MS = 60 * 1000;
// Thursday 26 November 2026, 14:00.
const NOW = new Date(2026, 10, 26, 14);

let actions: ReturnType<typeof useDevActions>;
let router: Router;
let wrapper: undefined | VueWrapper;

const mountActions = async () => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: { template: '<div />' },
        name: 'media-calendar',
        path: '/media-calendar/:typeOfLoad?',
      },
      {
        component: { template: '<div />' },
        name: 'settings',
        path: '/settings/:setting?',
      },
    ],
  });
  await router.push('/settings');
  wrapper = mount(
    defineComponent({
      setup() {
        actions = useDevActions();
        return () => null;
      },
    }),
    { global: { plugins: [router] } },
  );
};

const findAction = (label: string): DevAction => {
  const found = actions.groups.value
    .flatMap((group) => group.actions)
    .find((action) => action.label === label);
  if (!found) throw new Error(`No dev action labelled "${label}"`);
  return found;
};

const run = async (label: string) => {
  const action = findAction(label);
  if (action.kind !== 'button') throw new Error(`"${label}" is a switch`);
  await action.run();
  await flushPromises();
};

const flip = (label: string, on: boolean) => {
  const action = findAction(label);
  if (action.kind !== 'switch') throw new Error(`"${label}" is a button`);
  action.set(on);
};

describe('useDevActions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date', 'setInterval'] });
    vi.clearAllMocks();
    realMeeting.type = null;
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    devMeetingOverride.value = null;
    devRendererFaults.failFetches = false;
    devMainFaults.failDownloads = false;
    devMainFaults.lowDiskSpace = false;
    vi.useRealTimers();
  });

  it('starts a weekend meeting today in 10 minutes, and shows today', async () => {
    await mountActions();
    actions.meetingType.value = 'we';

    await run('Starts in 10 minutes');

    expect(devMeetingOverride.value).toEqual({
      startsAt: NOW.getTime() + 10 * MINUTE_MS,
      type: 'we',
    });
    expect(useCurrentStateStore().selectedDate).toBe(
      formatDate(NOW, 'YYYY/MM/DD'),
    );
    expect(router.currentRoute.value.name).toBe('media-calendar');
  });

  it("refetches the week on going back to the real schedule, when the fake meeting wasn't today's", async () => {
    await mountActions();
    await run('Started 2 minutes ago');

    await run('Back to the real schedule');

    expect(devMeetingOverride.value).toBeNull();
    expect(updateLookupPeriod).toHaveBeenCalledWith({
      onlyForWeekIncluding: formatDate(NOW, 'YYYY/MM/DD'),
      reset: true,
    });
    expect(fetchMedia).toHaveBeenCalled();
  });

  it("leaves today's media alone when only the start time was faked", async () => {
    realMeeting.type = 'mw';
    await mountActions();
    await run('Near its end');

    await run('Back to the real schedule');

    expect(devMeetingOverride.value).toBeNull();
    expect(updateLookupPeriod).not.toHaveBeenCalled();
  });

  it('fakes a failed download for the selected day', async () => {
    await mountActions();
    const currentState = useCurrentStateStore();
    currentState.selectedDate = formatDate(NOW, 'YYYY/MM/DD');

    await run('Fake a failed download');
    const [id, item] = Object.entries(currentState.downloadProgress)[0] ?? [];
    expect(item).toMatchObject({ loaded: 0 });

    vi.advanceTimersByTime(10_000);

    expect(currentState.downloadProgress[id ?? '']?.error).toBe(true);
    expect(currentState.downloadProgress[id ?? '']?.complete).toBeUndefined();

    await run('Remove fake downloads');
    expect(currentState.downloadProgress).toEqual({});
  });

  it('has the main process send its events through the real handlers', async () => {
    await mountActions();
    const devEmit = vi.spyOn(globalThis.electronApi, 'devEmit');

    await run('Graphics crashed');
    await run('Media window keeps stopping');

    expect(devEmit).toHaveBeenCalledWith('gpu-crash-detected', undefined);
    expect(devEmit).toHaveBeenCalledWith('media-window-renderer-gone', {
      reloading: false,
    });
  });

  it('warns about low disk space at once, and turns every faked failure off at the end', async () => {
    await mountActions();
    const setDevFault = vi.spyOn(globalThis.electronApi, 'setDevFault');

    flip('Disk space is low', true);
    flip('Requests fail', true);
    await run('Starts in 3 minutes');

    expect(setDevFault).toHaveBeenCalledWith('lowDiskSpace', true);
    expect(checkLowDiskSpaceAndNotify).toHaveBeenCalled();
    expect(actions.faked.value).toHaveLength(3);

    actions.stopFakingEverything();

    expect(setDevFault).toHaveBeenLastCalledWith('lowDiskSpace', false);
    expect(devRendererFaults.failFetches).toBe(false);
    expect(devMeetingOverride.value).toBeNull();
    expect(actions.faked.value).toEqual([]);
  });
});
