import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __testables,
  parseTimerRemotePort,
  syncTimerRemote,
} from '../timer-remote';

const { createTemporaryNotification, electronApi, updateTimerWindow } =
  vi.hoisted(() => ({
    createTemporaryNotification: vi.fn(),
    electronApi: {
      startTimerRemote: vi.fn(),
      stopTimerRemote: vi.fn(),
      timerRemoteText: vi.fn(),
    },
    updateTimerWindow: vi.fn(),
  }));

vi.mock('boot/i18n', () => ({
  i18n: { global: { locale: { value: 'en' }, t: (key: string) => key } },
}));
vi.mock('src/helpers/notifications', () => ({ createTemporaryNotification }));
vi.mock('src/composables/useTimer', () => ({
  default: () => ({ updateTimerWindow }),
}));

const configure = (changes: Partial<typeof defaultSettings>) => {
  useCongregationSettingsStore().congregations['cong'] = {
    ...defaultSettings,
    enableTimerDisplay: true,
    ...changes,
  };
  useCurrentStateStore().currentCongregation = 'cong';
};

beforeEach(() => {
  setActivePinia(createPinia());
  __testables.reset();
  vi.stubGlobal('electronApi', {
    ...globalThis.electronApi,
    ...electronApi,
  });
  electronApi.startTimerRemote.mockReset();
  electronApi.stopTimerRemote.mockReset();
  electronApi.timerRemoteText.mockReset();
  createTemporaryNotification.mockReset();
  updateTimerWindow.mockReset();
});

describe('parseTimerRemotePort', () => {
  it('accepts unprivileged ports only', () => {
    expect(parseTimerRemotePort('8787')).toBe(8787);
    expect(parseTimerRemotePort(' 9000 ')).toBe(9000);
    expect(parseTimerRemotePort('80')).toBeNull();
    expect(parseTimerRemotePort('abc')).toBeNull();
    expect(parseTimerRemotePort(null)).toBeNull();
  });
});

describe('syncTimerRemote', () => {
  it('does nothing while the remote is off', async () => {
    configure({ timerRemoteEnable: false });
    await syncTimerRemote();
    expect(electronApi.startTimerRemote).not.toHaveBeenCalled();
    expect(electronApi.stopTimerRemote).not.toHaveBeenCalled();
  });

  it('starts the remote, publishes its addresses and pushes the current state', async () => {
    configure({ timerRemoteEnable: true, timerRemotePort: '8787' });
    electronApi.startTimerRemote.mockResolvedValue({
      running: true,
      urls: ['http://192.168.1.10:8787/'],
    });

    await syncTimerRemote();

    expect(electronApi.timerRemoteText).toHaveBeenCalledWith(
      expect.objectContaining({
        lang: 'en',
        meetingStartsIn: 'meeting-starts-in',
      }),
    );
    expect(electronApi.startTimerRemote).toHaveBeenCalledWith(8787);
    expect(useCurrentStateStore().timerRemoteUrls).toEqual([
      'http://192.168.1.10:8787/',
    ]);
    expect(updateTimerWindow).toHaveBeenCalled();

    // Same settings again: nothing to restart.
    await syncTimerRemote();
    expect(electronApi.startTimerRemote).toHaveBeenCalledTimes(1);
  });

  it('restarts on a new port and stops when turned off', async () => {
    configure({ timerRemoteEnable: true, timerRemotePort: '8787' });
    electronApi.startTimerRemote.mockResolvedValue({ running: true, urls: [] });
    await syncTimerRemote();

    configure({ timerRemoteEnable: true, timerRemotePort: '9000' });
    await syncTimerRemote();
    expect(electronApi.startTimerRemote).toHaveBeenLastCalledWith(9000);

    configure({ timerRemoteEnable: false });
    await syncTimerRemote();
    expect(electronApi.stopTimerRemote).toHaveBeenCalledTimes(1);
    expect(useCurrentStateStore().timerRemoteUrls).toEqual([]);
  });

  it('tells the user when the port is taken', async () => {
    configure({ timerRemoteEnable: true, timerRemotePort: '8787' });
    electronApi.startTimerRemote.mockResolvedValue({
      error: 'port-in-use',
      running: false,
      urls: [],
    });
    await syncTimerRemote();
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'timer-remote-port-in-use' }),
    );
  });
});
