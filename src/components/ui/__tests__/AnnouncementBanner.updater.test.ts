import type * as NotificationsModule from 'src/helpers/notifications';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { createTemporaryNotification } from 'src/helpers/notifications';
import * as api from 'src/utils/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AnnouncementBanner from './../AnnouncementBanner.vue';

// Mock the notification helper so assertions can target the updater
// notification lifecycle without fighting Quasar's Notify DOM (which mounts
// a shared #q-notify container per test file). The returned dismiss handle
// is a vi.fn so the "update in place" calls can be asserted too.
vi.mock('src/helpers/notifications', async (importOriginal) => {
  const mod = await importOriginal<typeof NotificationsModule>();
  return {
    ...mod,
    createTemporaryNotification: vi.fn(() => vi.fn()),
  };
});

installQuasarPlugin();
installPinia();

// The main process runs the update check at startup, concurrently with the
// renderer booting, so update events can be emitted and dropped before the
// banner mounts. It must then catch up via getUpdaterState() and still show
// the downloading/downloaded notification.
describe('AnnouncementBanner - updater catch-up', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mountBanner = async () => {
    vi.spyOn(api, 'fetchAnnouncements').mockResolvedValueOnce([]);
    vi.spyOn(api, 'fetchLatestVersion').mockResolvedValueOnce('1.2.3');
    const wrapper = mount(AnnouncementBanner, {});
    await flushPromises();
    return wrapper;
  };

  it('shows the downloaded notification when the update finished before mount', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue({
      phase: 'downloaded',
      progress: null,
    });
    const dismiss = vi.fn();
    vi.mocked(createTemporaryNotification).mockReturnValue(dismiss);

    await mountBanner();

    // The catch-up first builds the base notification (downloading), then
    // transforms it in place into the downloaded state.
    expect(dismiss).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('ready to be installed'),
      }),
    );
  });

  it('shows the downloading notification with progress when the download was missed', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue({
      phase: 'downloading',
      progress: {
        bytesPerSecond: 10,
        delta: 0,
        percent: 42,
        total: 100,
        transferred: 42,
      },
    });
    const dismiss = vi.fn();
    vi.mocked(createTemporaryNotification).mockReturnValue(dismiss);

    await mountBanner();

    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('available and downloading'),
      }),
    );
    expect(dismiss).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: expect.stringContaining('42%'),
      }),
    );
  });

  it('creates the downloaded notification when update-downloaded fires without update-available', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue({
      phase: null,
      progress: null,
    });
    const dismiss = vi.fn();
    vi.mocked(createTemporaryNotification).mockReturnValue(dismiss);

    // Capture the callback registered by the banner so we can invoke it
    // directly, simulating electron-updater firing update-downloaded
    // without a preceding update-available.
    let downloadedCallback: (() => void) | undefined;
    vi.spyOn(globalThis.electronApi, 'onUpdateDownloaded').mockImplementation(
      (cb) => {
        downloadedCallback = cb as () => void;
      },
    );

    mount(AnnouncementBanner, {});
    await flushPromises();

    // Invoke the callback the banner registered.
    expect(downloadedCallback).toBeDefined();
    downloadedCallback?.();
    await flushPromises();

    // Should have created a new notification (not tried to update a
    // non-existent one), because updateNotify was undefined.
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('ready to be installed'),
      }),
    );
  });

  it('shows no update notification when no update is in progress', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue({
      phase: null,
      progress: null,
    });

    await mountBanner();

    const messages = vi
      .mocked(createTemporaryNotification)
      .mock.calls.map(([props]) => props?.message ?? '');
    expect(
      messages.some((message) => message.includes('ready to be installed')),
    ).toBe(false);
    expect(
      messages.some((message) => message.includes('available and downloading')),
    ).toBe(false);
  });
});
