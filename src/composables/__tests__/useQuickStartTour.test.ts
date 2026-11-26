import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { useQuickStartTour } from 'src/composables/useQuickStartTour';
import { defaultSettings } from 'src/constants/settings';
import { useAttentionStore } from 'stores/attention';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const NEW_PROFILE = 'new-cong';
const TOURED_PROFILE = 'toured-cong';

let pinia: ReturnType<typeof createTestingPinia>;

// The media calendar's side of it: asks for the tour, binds `visible`.
const mountCalendar = () => {
  let tour!: ReturnType<typeof useQuickStartTour>;
  mount(
    defineComponent({
      setup() {
        tour = useQuickStartTour();
        return () => h('div');
      },
    }),
    { global: { plugins: [pinia] } },
  );
  return tour;
};

const settings = () => useCongregationSettingsStore();

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
  setActivePinia(pinia);
  settings().congregations = {
    [NEW_PROFILE]: { ...defaultSettings, enableMediaDisplayButton: true },
    [TOURED_PROFILE]: { ...defaultSettings, enableMediaDisplayButton: true },
  };
  settings().quickStartTourSeen = { [TOURED_PROFILE]: true };
  useCurrentStateStore().currentCongregation = NEW_PROFILE;
});

describe('useQuickStartTour', () => {
  it('shows at once when the screen is free, and counts as seen once closed', async () => {
    const tour = mountCalendar();
    tour.requestQuickStartTour();
    await flushPromises();
    expect(tour.visible.value).toBe(true);
    expect(settings().quickStartTourSeen[NEW_PROFILE]).toBeFalsy();

    tour.visible.value = false;
    await flushPromises();
    expect(settings().quickStartTourSeen[NEW_PROFILE]).toBe(true);
  });

  it.each([
    ['a dialog', () => useDialogStateStore().openDialog('x', 'BaseDialog')],
    ['another tour', () => useAttentionStore().claim('zoom-display-tour')],
    [
      'the profile picker',
      () => {
        useCurrentStateStore().congregationSwitcherOpen = true;
      },
    ],
  ])('waits for %s to go', async (_, takeScreen) => {
    takeScreen();
    const tour = mountCalendar();
    tour.requestQuickStartTour();
    await flushPromises();
    expect(tour.visible.value).toBe(false);

    useDialogStateStore().closeDialog('x');
    useAttentionStore().release('zoom-display-tour');
    useCurrentStateStore().congregationSwitcherOpen = false;
    await flushPromises();
    expect(tour.visible.value).toBe(true);
  });

  it("isn't shown to a profile that has seen it, or has no footer button", async () => {
    useCurrentStateStore().currentCongregation = TOURED_PROFILE;
    const tour = mountCalendar();
    tour.requestQuickStartTour();
    await flushPromises();
    expect(tour.visible.value).toBe(false);

    const newProfile = settings().congregations[NEW_PROFILE];
    if (!newProfile) throw new Error('No new profile');
    newProfile.enableMediaDisplayButton = false;
    newProfile.enableMusicButton = false;
    useCurrentStateStore().currentCongregation = NEW_PROFILE;
    tour.requestQuickStartTour();
    await flushPromises();
    expect(tour.visible.value).toBe(false);
  });

  it('drops a request once its profile is left for one that has seen it', async () => {
    useAttentionStore().claim('zoom-display-tour');
    const tour = mountCalendar();
    tour.requestQuickStartTour();
    useCurrentStateStore().currentCongregation = TOURED_PROFILE;

    useAttentionStore().release('zoom-display-tour');
    await flushPromises();
    expect(tour.visible.value).toBe(false);
  });

  it('marks the profile it showed for, even after a switch', async () => {
    const tour = mountCalendar();
    tour.requestQuickStartTour();
    await flushPromises();
    useCurrentStateStore().currentCongregation = TOURED_PROFILE;

    tour.visible.value = false;
    await flushPromises();
    expect(settings().quickStartTourSeen[NEW_PROFILE]).toBe(true);
  });
});
