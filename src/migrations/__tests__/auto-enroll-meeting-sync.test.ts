import type { SettingsValues } from 'src/types';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';

import type { MigrationFunction } from '../types';

// Migrations get the app settings store; this one doesn't use it.
const appSettings = {} as Parameters<MigrationFunction>[0];

const mocks = vi.hoisted(() => ({
  errorCatcher: vi.fn(),
  fetchCongregationSuggestions: vi.fn(),
  fetchMeetingLocations: vi.fn(),
}));

// storeToRefs only picks up properties that are refs on the raw store, so
// the stores are reactive objects holding refs (see
// congregation-schedule.sync.test.ts).
const congregations = ref<Partial<Record<string, SettingsValues>>>({});
const lookupInProgress = ref(false);
const online = ref(true);
const currentStateStore = reactive({ lookupInProgress, online });
const congregationSettingsStore = reactive({ congregations });

vi.mock('src/stores/current-state', () => ({
  useCurrentStateStore: () => currentStateStore,
}));

vi.mock('stores/congregation-settings', () => ({
  useCongregationSettingsStore: () => congregationSettingsStore,
}));

vi.mock('src/helpers/congregation-schedule', () => ({
  fetchCongregationSuggestions: mocks.fetchCongregationSuggestions,
  fetchMeetingLocations: mocks.fetchMeetingLocations,
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: mocks.errorCatcher,
}));

const NAME = 'Springfield North';

describe('autoEnrollMeetingSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    congregations.value = {
      'cong-1': {
        congregationName: NAME,
        congregationNameModified: true,
      } as SettingsValues,
    };
    lookupInProgress.value = false;
    online.value = true;
    mocks.fetchCongregationSuggestions.mockResolvedValue([
      { congregationGuid: 'guid-1', formattedName: NAME, name: NAME },
    ]);
    mocks.fetchMeetingLocations.mockResolvedValue({
      items: [{ congregationMeetings: [{ name: NAME }] }],
    });
  });

  it('enables the sync of a profile named as on JW.org, and clears the lookup flag', async () => {
    const { autoEnrollMeetingSync } =
      await import('../auto-enroll-meeting-sync');

    expect(await autoEnrollMeetingSync(appSettings)).toBe(true);
    expect(congregations.value['cong-1']?.congregationNameModified).toBe(false);
    // Left on, it would hide renames by hand for the rest of the session.
    expect(lookupInProgress.value).toBe(false);
  });

  it('clears the lookup flag when a lookup fails, and tries again later', async () => {
    mocks.fetchCongregationSuggestions.mockRejectedValue(new Error('offline'));
    const { autoEnrollMeetingSync } =
      await import('../auto-enroll-meeting-sync');

    expect(await autoEnrollMeetingSync(appSettings)).toBe(true);
    expect(mocks.errorCatcher).toHaveBeenCalledOnce();
    expect(congregations.value['cong-1']?.congregationNameModified).toBe(true);
    expect(lookupInProgress.value).toBe(false);
  });

  it('waits while offline, without touching the lookup flag', async () => {
    online.value = false;
    const { autoEnrollMeetingSync } =
      await import('../auto-enroll-meeting-sync');

    expect(await autoEnrollMeetingSync(appSettings)).toBe(false);
    expect(mocks.fetchCongregationSuggestions).not.toHaveBeenCalled();
    expect(lookupInProgress.value).toBe(false);
  });
});
