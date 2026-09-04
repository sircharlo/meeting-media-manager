import { basePath } from 'app/test/vitest/mocks/electronApi';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { formatDate } from 'src/utils/date';
import { registerCachePathProvider } from 'src/utils/fs';
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
