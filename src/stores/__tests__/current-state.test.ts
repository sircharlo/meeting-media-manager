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
