import type {
  CongregationMeeting,
  CongregationSearchResult,
  MeetingSearchResponse,
  SettingsValues,
} from 'src/types';

import { fetchJson } from 'src/utils/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref } from 'vue';

// UX-2 (full-audit-2026-09-04.md): the manual "Refresh meeting schedule"
// settings button previously gave no feedback at all unless the schedule
// actually changed. These tests exercise syncMeetingScheduleManually's three
// outcomes end to end (through the real fetchCongregationSuggestions /
// fetchMeetingLocations / applyScheduleToSettings call chain), and confirm
// syncMeetingSchedule's own boolean contract (relied on by MainLayout.vue to
// decide whether it needs to call updateLookupPeriod itself) is unchanged.
const errorCatcherMock = vi.fn();
const createTemporaryNotificationMock = vi.fn();
const tMock = vi.fn((key: string) => key);
const updateLookupPeriodMock = vi.fn();
const fetchMediaMock = vi.fn();

// congregation-schedule.ts reads some fields via storeToRefs(useCurrentStateStore())
// and others via direct property access (e.g. useCurrentStateStore().online).
// Pinia's storeToRefs only picks up properties whose RAW value is an actual
// Ref/reactive/computed (see pinia's storeToRefs source: `for (key in
// toRaw(store))`, `if (isRef(value) || isReactive(value)) ...`) - a plain
// mock object with primitive/plain-object properties is silently excluded,
// so this uses Vue's "ref unwrapping in reactive objects" feature to satisfy
// both access patterns with the same object: reading/writing
// `currentStateStore.currentSettings` behaves like a plain property, while
// `toRaw(currentStateStore).currentSettings` (what storeToRefs actually
// inspects) is the real underlying ref.
const currentSettingsRef = ref<Partial<SettingsValues>>({});
const onlineRef = ref(true);
const currentStateStore = reactive({
  currentSettings: currentSettingsRef,
  online: onlineRef,
});

vi.mock('boot/i18n', () => ({
  i18n: { global: { t: tMock } },
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: createTemporaryNotificationMock,
}));

vi.mock('src/helpers/date', () => ({
  updateLookupPeriod: updateLookupPeriodMock,
}));

vi.mock('src/helpers/jw-media', () => ({
  fetchMedia: fetchMediaMock,
}));

vi.mock('src/utils/api', () => ({
  fetchJson: vi.fn(),
}));

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => currentStateStore,
}));

const congregationName = 'Test Congregation';

const suggestion: CongregationSearchResult = {
  congregationGuid: 'guid-1',
  formattedName: congregationName,
  name: congregationName,
};

const onlineMeeting: CongregationMeeting = {
  address: '',
  groupMeetings: [],
  id: 'meeting-1',
  isPrivateHome: false,
  languageGuid: '',
  midweekMeetingDay: 2, // Tuesday
  midweekMeetingTime: '19:00:00',
  name: congregationName,
  phoneNumber: '',
  weekendMeetingDay: 7, // Sunday
  weekendMeetingTime: '10:00:00',
};

const meetingSearchResponse: MeetingSearchResponse = {
  hasResultsOutsideViewport: false,
  items: [
    {
      assemblies: [],
      congregationGroupMeetings: [],
      congregationMeetings: [onlineMeeting],
      conventions: [],
      id: 'cong-1',
      latitude: 0,
    } as unknown as MeetingSearchResponse['items'][number],
  ],
};

// Matches what onlineMeeting normalizes to (mwDay/weDay are 0-indexed:
// weekday - 1).
const alreadyCurrentSettings: Partial<SettingsValues> = {
  congregationName,
  congregationNameModified: false,
  mwDay: '1',
  mwStartTime: '19:00',
  weDay: '6',
  weStartTime: '10:00',
};

describe('syncMeetingScheduleManually', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentStateStore.online = true;
    currentStateStore.currentSettings = { ...alreadyCurrentSettings };

    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes('/congregations')) return [suggestion];
      if (url.includes('/meeting-search')) return meetingSearchResponse;
      return null;
    });
  });

  it('notifies "already up to date" when nothing changed', async () => {
    const { syncMeetingScheduleManually } =
      await import('../congregation-schedule');

    await syncMeetingScheduleManually();

    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'meeting-schedule-already-up-to-date',
        type: 'info',
      }),
    );
  });

  it('does not send its own notification when the schedule changed (handleScheduleSyncChanges already did)', async () => {
    currentStateStore.currentSettings = {
      ...alreadyCurrentSettings,
      mwStartTime: '18:00', // differs from onlineMeeting's 19:00
    };
    const { syncMeetingScheduleManually } =
      await import('../congregation-schedule');

    await syncMeetingScheduleManually();

    expect(createTemporaryNotificationMock).toHaveBeenCalledTimes(1);
    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'meeting-current-schedule-updated' }),
    );
    expect(updateLookupPeriodMock).toHaveBeenCalledWith({ reset: true });
    expect(fetchMediaMock).toHaveBeenCalled();
  });

  it('notifies an actionable warning when offline instead of staying silent', async () => {
    currentStateStore.online = false;
    const { syncMeetingScheduleManually } =
      await import('../congregation-schedule');

    await syncMeetingScheduleManually();

    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'meeting-schedule-sync-unavailable',
        type: 'warning',
      }),
    );
  });

  it('notifies the same actionable warning when the congregation name has no exact match', async () => {
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes('/congregations')) return [];
      return null;
    });
    const { syncMeetingScheduleManually } =
      await import('../congregation-schedule');

    await syncMeetingScheduleManually();

    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'meeting-schedule-sync-unavailable',
        type: 'warning',
      }),
    );
  });

  it('notifies the actionable warning and reports the error when the fetch throws', async () => {
    vi.mocked(fetchJson).mockRejectedValue(new Error('network exploded'));
    const { syncMeetingScheduleManually } =
      await import('../congregation-schedule');

    await syncMeetingScheduleManually();

    expect(errorCatcherMock).toHaveBeenCalled();
    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'meeting-schedule-sync-unavailable',
        type: 'warning',
      }),
    );
  });
});

describe('syncMeetingSchedule (automatic sync, boolean contract preserved)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentStateStore.online = true;
    currentStateStore.currentSettings = {
      ...alreadyCurrentSettings,
      enableAutomaticMeetingScheduleUpdates: true,
    };

    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes('/congregations')) return [suggestion];
      if (url.includes('/meeting-search')) return meetingSearchResponse;
      return null;
    });
  });

  it('resolves false and sends no notification when nothing changed', async () => {
    const { syncMeetingSchedule } = await import('../congregation-schedule');

    await expect(syncMeetingSchedule()).resolves.toBe(false);
    expect(createTemporaryNotificationMock).not.toHaveBeenCalled();
  });

  it('resolves true when the schedule changed', async () => {
    currentStateStore.currentSettings = {
      ...currentStateStore.currentSettings,
      mwStartTime: '18:00',
    };
    const { syncMeetingSchedule } = await import('../congregation-schedule');

    await expect(syncMeetingSchedule()).resolves.toBe(true);
  });

  it('resolves false (not a thrown error) when offline', async () => {
    currentStateStore.online = false;
    const { syncMeetingSchedule } = await import('../congregation-schedule');

    await expect(syncMeetingSchedule()).resolves.toBe(false);
    expect(createTemporaryNotificationMock).not.toHaveBeenCalled();
  });
});
