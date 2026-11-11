import type { UpdateVersionInfo } from 'src/types/general';

import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import * as dateHelpers from 'src/helpers/date';
import * as api from 'src/utils/api';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

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

// On Windows, an update downloaded in an earlier session installs when M³
// opens again, instead of when it quits (where a shutdown could kill the
// installer halfway): after a countdown, and only at a good moment.
describe('AnnouncementBanner - installing an update on launch', () => {
  const dueUpdate: UpdateVersionInfo = {
    installOnLaunch: true,
    isDowngrade: false,
    version: '1.2.3',
  };
  const MINUTE = 60_000;

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    useCurrentStateStore().mediaPlaying.url = '';
  });

  // Mounts the banner and hands back the update-downloaded listener it
  // registers. Timers are faked only afterwards, once mounting has settled.
  const mountForDownload = async () => {
    vi.spyOn(api, 'fetchAnnouncements').mockResolvedValueOnce([]);
    vi.spyOn(api, 'fetchLatestVersion').mockResolvedValueOnce('1.2.3');
    vi.spyOn(globalThis.electronApi, 'getUpdaterState').mockResolvedValue(
      noUpdate,
    );
    let downloadedCallback: ((args: UpdateVersionInfo) => void) | undefined;
    vi.spyOn(globalThis.electronApi, 'onUpdateDownloaded').mockImplementation(
      (cb) => {
        downloadedCallback = cb;
      },
    );
    const quitAndInstall = vi
      .spyOn(globalThis.electronApi, 'quitAndInstall')
      .mockImplementation(() => undefined);

    const wrapper = mount(AnnouncementBanner, {
      global: { stubs: { teleport: true } },
    });
    await flushPromises();
    vi.useFakeTimers();

    const download = async (versionInfo: UpdateVersionInfo) => {
      downloadedCallback?.(versionInfo);
      await nextTick();
    };
    const toast = () => wrapper.getComponent(UpdateProgressToast);

    return { download, quitAndInstall, toast };
  };

  it('installs it once the countdown ends', async () => {
    const { download, quitAndInstall, toast } = await mountForDownload();

    await download(dueUpdate);
    expect(toast().text()).toContain('install it in 15 s');

    await vi.advanceTimersByTimeAsync(14_000);
    expect(toast().text()).toContain('install it in 1 s');
    expect(quitAndInstall).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(quitAndInstall).toHaveBeenCalledOnce();
  });

  it('installs it right away from the install now button', async () => {
    const { download, quitAndInstall, toast } = await mountForDownload();

    await download(dueUpdate);
    toast().vm.$emit('install');
    await vi.advanceTimersByTimeAsync(30_000);

    expect(quitAndInstall).toHaveBeenCalledOnce();
  });

  it('keeps it for later when put off', async () => {
    const { download, quitAndInstall, toast } = await mountForDownload();

    await download(dueUpdate);
    toast().vm.$emit('postpone');
    await vi.advanceTimersByTimeAsync(30_000);

    expect(quitAndInstall).not.toHaveBeenCalled();
    expect(toast().text()).toContain('Quit and install');
    expect(toast().text()).not.toContain('restart');
  });

  it('does not install it once the toast is closed', async () => {
    const { download, quitAndInstall, toast } = await mountForDownload();

    await download(dueUpdate);
    toast().vm.$emit('dismiss');
    await vi.advanceTimersByTimeAsync(30_000);

    expect(quitAndInstall).not.toHaveBeenCalled();
  });

  it('does not count down for an update downloaded in this session', async () => {
    const { download, quitAndInstall, toast } = await mountForDownload();

    await download({ ...dueUpdate, installOnLaunch: false });
    await vi.advanceTimersByTimeAsync(30_000);

    expect(toast().text()).not.toContain('restart');
    expect(quitAndInstall).not.toHaveBeenCalled();
  });

  it('waits while media is shown', async () => {
    useCurrentStateStore().mediaPlaying.url = 'file:///media/picture.jpg';
    const { download, quitAndInstall, toast } = await mountForDownload();

    await download(dueUpdate);
    await vi.advanceTimersByTimeAsync(30_000);

    expect(toast().text()).not.toContain('restart');
    expect(quitAndInstall).not.toHaveBeenCalled();
  });

  it.each([
    { countsDown: false, minutesUntilStart: 10, when: '10 minutes before' },
    { countsDown: false, minutesUntilStart: -60, when: 'an hour into' },
    { countsDown: true, minutesUntilStart: 30, when: '30 minutes before' },
    { countsDown: true, minutesUntilStart: -150, when: '2.5 hours after' },
  ])(
    'counts down $when the meeting: $countsDown',
    async ({ countsDown, minutesUntilStart }) => {
      const { download, toast } = await mountForDownload();
      vi.spyOn(dateHelpers, 'getMeetingStartToday').mockReturnValue(
        new Date(Date.now() + minutesUntilStart * MINUTE),
      );

      await download(dueUpdate);

      expect(toast().text().includes('restart')).toBe(countsDown);
    },
  );
});
