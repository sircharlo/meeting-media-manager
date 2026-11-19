import type * as Notifications from 'src/helpers/notifications';

import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import {
  createTemporaryNotification,
  notifyUpdateDiskFull,
} from 'src/helpers/notifications';
import * as api from 'src/utils/api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnnouncementBanner from './../AnnouncementBanner.vue';

vi.mock('src/helpers/notifications', async (importOriginal) => ({
  ...(await importOriginal<typeof Notifications>()),
  createTemporaryNotification: vi.fn(),
  notifyUpdateDiskFull: vi.fn(),
}));

installQuasarPlugin();
installPinia();
enableAutoUnmount(afterEach);

// What the user is told when M³ can't install an update.
describe('AnnouncementBanner - update errors', () => {
  let updateError:
    ((reason: 'disk-full' | 'read-only-volume') => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    updateError = undefined;
    vi.spyOn(globalThis.electronApi, 'onUpdateError').mockImplementation(
      (callback) => {
        updateError = callback;
      },
    );
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue({
      phase: null,
      progress: null,
      versionInfo: null,
    });
    vi.spyOn(api, 'fetchAnnouncements').mockResolvedValue([]);
    vi.spyOn(api, 'fetchLatestVersion').mockResolvedValue('1.2.3');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mountBanner = async () => {
    mount(AnnouncementBanner, { global: { stubs: { teleport: true } } });
    await flushPromises();
  };

  // MMM-V2-3P8: the update couldn't be unpacked on a full disk.
  it("says the update couldn't be installed for want of disk space", async () => {
    await mountBanner();

    updateError?.('disk-full');

    expect(notifyUpdateDiskFull).toHaveBeenCalledOnce();
    expect(createTemporaryNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ caption: 'Update failed' }),
    );
  });

  it('still says M³ sits on a read-only volume', async () => {
    await mountBanner();

    updateError?.('read-only-volume');

    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: 'Update failed',
        message:
          'M³ could not be updated because it is stored in a directory that is read-only. Please move M³ to a different location, such as the Applications folder.',
      }),
    );
    expect(notifyUpdateDiskFull).not.toHaveBeenCalled();
  });
});
