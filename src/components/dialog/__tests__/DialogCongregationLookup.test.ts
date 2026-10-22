import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { watch, type WatchStopHandle } from 'vue';

import DialogCongregationLookup from '../DialogCongregationLookup.vue';

const OFFICIAL_NAME = 'Springfield North';

const schedule = vi.hoisted(() => ({
  fetchCongregationSuggestions: vi.fn(),
  fetchMeetingLocations: vi.fn(),
}));

vi.mock('src/helpers/congregation-schedule', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  fetchCongregationSuggestions: schedule.fetchCongregationSuggestions,
  fetchMeetingLocations: schedule.fetchMeetingLocations,
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'test-cong';

let wrapper: undefined | VueWrapper;
let stopWatching: undefined | WatchStopHandle;

const settings = () => {
  const current = useCurrentStateStore().currentSettings;
  if (!current) throw new Error('No congregation settings');
  return current;
};

afterEach(() => {
  stopWatching?.();
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
});

describe('DialogCongregationLookup', () => {
  it('links a profile named otherwise in one go', async () => {
    // A profile renamed by hand: what "Enable schedule sync" is offered for.
    useCongregationSettingsStore().congregations = {
      [CONGREGATION_ID]: {
        ...defaultSettings,
        congregationName: 'Springfield',
        congregationNameModified: true,
      },
    };
    useCurrentStateStore().currentCongregation = CONGREGATION_ID;
    schedule.fetchCongregationSuggestions.mockResolvedValue([
      {
        congregationGuid: 'guid-1',
        formattedName: OFFICIAL_NAME,
        name: OFFICIAL_NAME,
      },
    ]);
    schedule.fetchMeetingLocations.mockResolvedValue({
      items: [
        {
          congregationMeetings: [
            {
              languageGuid: null,
              midweekMeetingDay: 3,
              midweekMeetingTime: '19:00:00',
              name: OFFICIAL_NAME,
              weekendMeetingDay: 0,
              weekendMeetingTime: '10:00:00',
            },
          ],
        },
      ],
    });
    // MainLayout.vue's name watcher: a new name means a rename by hand,
    // unless a lookup is writing it.
    stopWatching = watch(
      () => settings().congregationName,
      (newName, oldName) => {
        if (!oldName || newName === oldName) return;
        if (useCurrentStateStore().lookupInProgress) return;
        settings().congregationNameModified = true;
      },
    );

    wrapper = mount(DialogCongregationLookup, {
      props: { dialogId: 'congregation-lookup', modelValue: false },
    });
    await wrapper.setProps({ modelValue: true });
    // The search runs once typing pauses (500 ms).
    const result = await vi.waitFor(
      () => {
        const item = Array.from(document.querySelectorAll('.q-item')).find(
          (el) => el.textContent?.includes(OFFICIAL_NAME),
        );
        if (!item) throw new Error('No result yet');
        return item as HTMLElement;
      },
      { timeout: 2000 },
    );
    result.click();
    await vi.waitFor(() =>
      expect(useCurrentStateStore().lookupInProgress).toBe(false),
    );
    await flushPromises();

    expect(settings().congregationName).toBe(OFFICIAL_NAME);
    expect(settings().congregationNameModified).toBe(false);
    expect(wrapper.emitted('applied')).toHaveLength(1);
  });
});
