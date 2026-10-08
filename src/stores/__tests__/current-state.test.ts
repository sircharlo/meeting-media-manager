import { basePath } from 'app/test/vitest/mocks/electronApi';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { formatDate } from 'src/utils/date';
import { registerCachePathProvider } from 'src/utils/fs';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { describe, expect, it } from 'vitest';

import { useCurrentStateStore } from '../current-state';

// createTestingPinia stubs actions by default (they become no-op spies) -
// this store's method under test is an action, so the real implementation
// needs to actually run.
installPinia({ stubActions: false });

registerCachePathProvider(() => undefined);

describe('getDatedAdditionalMediaDirectory', () => {
  it('never returns an empty string, even with no selectedDate available', async () => {
    const store = useCurrentStateStore();
    store.currentCongregation = 'test-cong';
    store.selectedDate = '';

    const dir = await store.getDatedAdditionalMediaDirectory();

    // A bare relative filename joined onto '' would resolve against
    // process.cwd() - the app's own install directory in a packaged
    // build - instead of a real cache path. Guard against that regression.
    expect(dir).not.toBe('');
    expect(dir).toContain(basePath);
    expect(dir).toContain('test-cong');
  });

  it('defaults the date portion to today when no date is available', async () => {
    const store = useCurrentStateStore();
    store.currentCongregation = 'test-cong';
    store.selectedDate = '';

    const dir = await store.getDatedAdditionalMediaDirectory();

    expect(dir).toContain(formatDate(new Date(), 'YYYYMMDD'));
  });

  it('still uses an explicit destDate when one is passed', async () => {
    const store = useCurrentStateStore();
    store.currentCongregation = 'test-cong';
    store.selectedDate = '2026-01-01';

    const dir = await store.getDatedAdditionalMediaDirectory('2026-07-19');

    expect(dir).toContain(formatDate(new Date('2026-07-19'), 'YYYYMMDD'));
    expect(dir).not.toContain(formatDate(new Date('2026-01-01'), 'YYYYMMDD'));
  });
});

// BE-8 (full-audit-2026-09-04.md): extracted from hasActiveMediaWork so
// MainLayout.vue's periodic low-disk-space check can gate on "downloads
// specifically" rather than firing during a plain meeting-schedule check
// (no disk writes involved).
describe('hasActiveDownloads / hasActiveMediaWork', () => {
  it('is false with no download progress entries', () => {
    const store = useCurrentStateStore();
    store.downloadProgress = {};

    expect(store.hasActiveDownloads).toBe(false);
    expect(store.hasActiveMediaWork).toBe(false);
  });

  it('is true while a download is still in progress', () => {
    const store = useCurrentStateStore();
    store.downloadProgress = {
      'file.mp4': { filename: 'file.mp4', loaded: 1, total: 10 },
    };

    expect(store.hasActiveDownloads).toBe(true);
    expect(store.hasActiveMediaWork).toBe(true);
  });

  it('is false once every download is complete', () => {
    const store = useCurrentStateStore();
    store.downloadProgress = {
      'file.mp4': {
        complete: true,
        filename: 'file.mp4',
        loaded: 10,
        total: 10,
      },
    };

    expect(store.hasActiveDownloads).toBe(false);
  });

  it('is false for a download that ended in error, not just completion', () => {
    const store = useCurrentStateStore();
    store.downloadProgress = {
      'file.mp4': { error: true, filename: 'file.mp4' },
    };

    expect(store.hasActiveDownloads).toBe(false);
  });

  it('hasActiveMediaWork is true while a meeting check is running, even with no downloads', () => {
    const store = useCurrentStateStore();
    store.downloadProgress = {};
    store.meetingCheckStatus = { 'test-cong': 'checking' };

    expect(store.hasActiveDownloads).toBe(false);
    expect(store.hasActiveMediaWork).toBe(true);
  });
});

// UX-12 (full-audit-2026-09-05.md): getInvalidSettings() previously only
// checked `depends`, not `unless` - a setting hidden by `unless` (so there's
// no visible row anywhere for the user to fix it on) could still be counted
// invalid, driving a red badge on a Settings category with nothing to click.
describe('getInvalidSettings / isHiddenByUnless', () => {
  const CONGREGATION_ID = 'unless-test-cong';

  it('does not count a setting as invalid once it is hidden by an effective `unless`', () => {
    const congregationSettingsStore = useCongregationSettingsStore();
    const settings = {
      ...defaultSettings,
      disableMediaFetching: false,
      enableMediaAutoExport: true,
      enableMediaDisplayButton: true,
      mediaAutoExportFolder: '', // empty - rules: ['notEmpty'] makes this invalid
    };
    congregationSettingsStore.congregations = { [CONGREGATION_ID]: settings };

    const store = useCurrentStateStore();

    // Before disableMediaFetching is on: mediaAutoExportFolder is visible
    // and correctly flagged invalid.
    expect(store.getInvalidSettings(CONGREGATION_ID)).toContain(
      'mediaAutoExportFolder',
    );

    // disableMediaFetching's `unless` now hides mediaAutoExportFolder
    // entirely (per SettingsPage.vue's shouldShowSetting) - it must stop
    // counting as invalid, since there's no row left to fix it on.
    settings.disableMediaFetching = true;

    expect(store.getInvalidSettings(CONGREGATION_ID)).not.toContain(
      'mediaAutoExportFolder',
    );
  });
});

// FE-17 (full-audit-2026-09-05.md): setCongregation used to re-read
// this.currentCongregation (after its internal await) to compute its
// return value, instead of using the value it was actually called with -
// a second, later setCongregation call overwriting currentCongregation in
// between made an earlier call's result reflect the wrong congregation.
describe('setCongregation', () => {
  it('resolves against the congregation it was called with, not whichever is current once it wakes up', async () => {
    const congregationSettingsStore = useCongregationSettingsStore();
    congregationSettingsStore.congregations = {
      // disableMediaFetching hides every meeting-schedule field (mwDay,
      // weStartTime, etc.) via their `unless` - the only way for a
      // congregation with otherwise-untouched defaultSettings to have zero
      // invalid settings.
      'cong-a': {
        ...defaultSettings,
        congregationName: 'Cong A',
        disableMediaFetching: true,
      },
      'cong-b': {
        ...defaultSettings,
        congregationName: 'Cong B',
        disableMediaFetching: false,
        enableMediaAutoExport: true,
        enableMediaDisplayButton: true,
        mediaAutoExportFolder: '', // invalid: rules include ['notEmpty']
      },
    };

    const store = useCurrentStateStore();

    // Deliberately not awaited yet - simulates a second switch starting
    // while the first is still mid-flight.
    const pendingA = store.setCongregation('cong-a');
    const invalidB = await store.setCongregation('cong-b');
    const invalidA = await pendingA;

    expect(invalidA).toBe(false);
    expect(invalidB).toBe(true);
  });
});
