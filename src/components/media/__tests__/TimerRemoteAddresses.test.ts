import type {
  TimerRemoteFirewallAllowResult,
  TimerRemoteFirewallState,
} from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import TimerRemoteAddresses from '../TimerRemoteAddresses.vue';

const { errorCatcherMock, notifyMock, platform } = vi.hoisted(() => ({
  errorCatcherMock: vi.fn(),
  notifyMock: vi.fn(),
  platform: { value: 'win32' },
}));

vi.mock('src/helpers/fs', () => ({
  getRendererPlatform: () => platform.value,
}));
vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: notifyMock,
}));
vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
}));

installQuasarPlugin();
installPinia();

const CONGREGATION_ID = 'test-cong';
const ALLOW = 'Allow in Windows Firewall';

const getStatusMock =
  vi.fn<(port: number) => Promise<{ state: TimerRemoteFirewallState }>>();
const allowMock =
  vi.fn<(port: number) => Promise<TimerRemoteFirewallAllowResult>>();

let wrapper: undefined | VueWrapper;

const mountAddresses = async (state: TimerRemoteFirewallState) => {
  getStatusMock.mockResolvedValue({ state });
  wrapper = mount(TimerRemoteAddresses);
  await flushPromises();
};

const allowButton = () =>
  wrapper?.findAll('button').find((button) => button.text().includes(ALLOW));

beforeEach(() => {
  vi.clearAllMocks();
  platform.value = 'win32';
  globalThis.electronApi.getTimerRemoteFirewallStatus = getStatusMock;
  globalThis.electronApi.allowTimerRemoteThroughFirewall = allowMock;
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      enableTimerDisplay: true,
      timerRemoteEnable: true,
      timerRemotePort: '8787',
    },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  useCurrentStateStore().timerRemoteUrls = ['http://192.168.1.2:8787/'];
});

afterEach(() => {
  vi.useRealTimers();
  wrapper?.unmount();
  wrapper = undefined;
});

describe('TimerRemoteAddresses', () => {
  it('lists the addresses, with a copy button', async () => {
    await mountAddresses('allowed');

    expect(wrapper?.text()).toContain('http://192.168.1.2:8787/');
    expect(wrapper?.find('button[aria-label="Copy address"]').exists()).toBe(
      true,
    );
    expect(allowButton()).toBeUndefined();
  });

  it.each(['not-allowed', 'blocked'] as const)(
    'warns on Windows when the firewall is %s, with a button to allow it',
    async (state) => {
      await mountAddresses(state);

      expect(getStatusMock).toHaveBeenCalledWith(8787);
      expect(wrapper?.text()).toContain(
        'Windows Firewall may keep other devices from opening this page',
      );
      expect(allowButton()).toBeDefined();
    },
  );

  it.each(['darwin', 'linux'])(
    "doesn't check the firewall or show the button on %s",
    async (value) => {
      platform.value = value;
      await mountAddresses('not-allowed');

      expect(getStatusMock).not.toHaveBeenCalled();
      expect(wrapper?.text()).not.toContain('Windows Firewall');
      expect(allowButton()).toBeUndefined();
    },
  );

  it("says what to do when the firewall blocks everything, as a rule can't help", async () => {
    await mountAddresses('blocks-all');

    expect(wrapper?.text()).toContain('blocks all incoming connections');
    expect(allowButton()).toBeUndefined();
  });

  it('allows it and says so, and the warning goes', async () => {
    await mountAddresses('not-allowed');
    allowMock.mockResolvedValue({
      outcome: 'allowed',
      status: { state: 'allowed' },
    });

    await allowButton()?.trigger('click');
    await flushPromises();

    expect(allowMock).toHaveBeenCalledWith(8787);
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Windows Firewall now lets other devices open the timer page.',
        type: 'positive',
      }),
    );
    expect(allowButton()).toBeUndefined();
  });

  it.each([
    [
      'still-blocked',
      'warning',
      'Windows Firewall still blocks the timer page',
    ],
    ['failed', 'negative', "M³ couldn't change Windows Firewall's settings."],
  ] as const)('warns when it %s afterwards', async (outcome, type, message) => {
    await mountAddresses('not-allowed');
    allowMock.mockResolvedValue({
      outcome,
      status: { state: 'blocked' },
    });

    await allowButton()?.trigger('click');
    await flushPromises();

    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(message),
        type,
      }),
    );
    expect(allowButton()).toBeDefined();
  });

  it('says nothing more when the permission is refused', async () => {
    await mountAddresses('not-allowed');
    allowMock.mockResolvedValue({
      outcome: 'cancelled',
      status: { state: 'not-allowed' },
    });

    await allowButton()?.trigger('click');
    await flushPromises();

    expect(notifyMock).not.toHaveBeenCalled();
    expect(allowButton()).toBeDefined();
  });

  it('warns, and reports it, when allowing throws', async () => {
    await mountAddresses('not-allowed');
    allowMock.mockRejectedValue(new Error('IPC failed'));

    await allowButton()?.trigger('click');
    await flushPromises();

    expect(errorCatcherMock).toHaveBeenCalled();
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "M³ couldn't change Windows Firewall's settings.",
        type: 'negative',
      }),
    );
  });

  it("doesn't check the firewall without an address to open", async () => {
    useCurrentStateStore().timerRemoteUrls = [];
    await mountAddresses('not-allowed');

    expect(getStatusMock).not.toHaveBeenCalled();
    expect(wrapper?.text()).toContain('No network connection was found');
  });

  it('checks again a second after the port stops changing, not on each keystroke', async () => {
    await mountAddresses('allowed');
    expect(getStatusMock).toHaveBeenCalledTimes(1);
    vi.useFakeTimers();

    const settings = useCongregationSettingsStore().congregations[
      CONGREGATION_ID
    ] as typeof defaultSettings;
    for (const value of ['1', '10', '102', '1025', '10250']) {
      settings.timerRemotePort = value;
      await nextTick();
    }
    await vi.advanceTimersByTimeAsync(999);
    expect(getStatusMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(getStatusMock).toHaveBeenCalledTimes(2);
    expect(getStatusMock).toHaveBeenLastCalledWith(10_250);
  });
});
