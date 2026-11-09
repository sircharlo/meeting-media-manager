import type { UpdateVersionInfo } from 'src/types/general';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import * as api from 'src/utils/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AnnouncementBanner from './../AnnouncementBanner.vue';
import UpdateProgressToast from './../UpdateProgressToast.vue';

installQuasarPlugin();
installPinia();

const noUpdate = { phase: null, progress: null, versionInfo: null };

// The main process runs the update check at startup, concurrently with the
// renderer booting, so update events can be emitted and dropped before the
// banner mounts. It must then catch up via getUpdaterState() and still show
// the downloading/downloaded toast.
describe('AnnouncementBanner - updater catch-up', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mountBanner = async () => {
    vi.spyOn(api, 'fetchAnnouncements').mockResolvedValueOnce([]);
    vi.spyOn(api, 'fetchLatestVersion').mockResolvedValueOnce('1.2.3');
    const wrapper = mount(AnnouncementBanner, {
      global: { stubs: { teleport: true } },
    });
    await flushPromises();
    return wrapper;
  };

  it('shows the downloaded toast when the update finished before mount', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue({
      phase: 'downloaded',
      progress: null,
      versionInfo: { isDowngrade: false, version: '1.2.3' },
    });

    const wrapper = await mountBanner();
    const toast = wrapper.getComponent(UpdateProgressToast);

    expect(toast.props('phase')).toBe('downloaded');
    expect(toast.text()).toContain('Update ready to install');
  });

  it('shows the downloading toast with progress when the download was missed', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue({
      phase: 'downloading',
      progress: {
        bytesPerSecond: 10,
        delta: 0,
        percent: 42,
        total: 100,
        transferred: 42,
      },
      versionInfo: { isDowngrade: false, version: '1.2.3' },
    });

    const wrapper = await mountBanner();
    const toast = wrapper.getComponent(UpdateProgressToast);

    expect(toast.text()).toContain('Downloading update');
    expect(toast.find('progress').attributes('value')).toBe('42');
  });

  it('shows the downloaded toast when update-downloaded fires without update-available', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue(
      noUpdate,
    );

    // Capture the callback registered by the banner so we can invoke it
    // directly, simulating electron-updater firing update-downloaded
    // without a preceding update-available.
    let downloadedCallback: ((args: UpdateVersionInfo) => void) | undefined;
    vi.spyOn(globalThis.electronApi, 'onUpdateDownloaded').mockImplementation(
      (cb) => {
        downloadedCallback = cb;
      },
    );

    const wrapper = await mountBanner();

    expect(downloadedCallback).toBeDefined();
    downloadedCallback?.({ isDowngrade: false, version: '1.2.3' });
    await flushPromises();

    expect(wrapper.getComponent(UpdateProgressToast).text()).toContain(
      'Update ready to install',
    );
  });

  it('shows no update toast when no update is in progress', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue(
      noUpdate,
    );

    const wrapper = await mountBanner();

    expect(wrapper.findComponent(UpdateProgressToast).exists()).toBe(false);
  });

  it('keeps a dismissed toast closed when the download then finishes', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue(
      noUpdate,
    );

    const versionInfo = { isDowngrade: false, version: '1.2.3' };
    let availableCallback: ((args: UpdateVersionInfo) => void) | undefined;
    let downloadedCallback: ((args: UpdateVersionInfo) => void) | undefined;
    vi.spyOn(globalThis.electronApi, 'onUpdateAvailable').mockImplementation(
      (cb) => {
        availableCallback = cb;
      },
    );
    vi.spyOn(globalThis.electronApi, 'onUpdateDownloaded').mockImplementation(
      (cb) => {
        downloadedCallback = cb;
      },
    );

    const wrapper = await mountBanner();

    availableCallback?.(versionInfo);
    await flushPromises();
    wrapper.getComponent(UpdateProgressToast).vm.$emit('dismiss');
    await flushPromises();
    expect(wrapper.findComponent(UpdateProgressToast).exists()).toBe(false);

    downloadedCallback?.(versionInfo);
    await flushPromises();
    expect(wrapper.findComponent(UpdateProgressToast).exists()).toBe(false);
  });

  it('installs the update when the toast asks to', async () => {
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue({
      phase: 'downloaded',
      progress: null,
      versionInfo: { isDowngrade: false, version: '1.2.3' },
    });
    const quitAndInstall = vi
      .spyOn(globalThis.electronApi, 'quitAndInstall')
      .mockImplementation(() => undefined);

    const wrapper = await mountBanner();
    wrapper.getComponent(UpdateProgressToast).vm.$emit('install');

    expect(quitAndInstall).toHaveBeenCalledOnce();
  });
});
