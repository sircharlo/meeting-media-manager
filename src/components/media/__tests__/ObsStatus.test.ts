import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { callMock, errorCatcherMock, fakeObsWebSocket, onMock } = vi.hoisted(
  () => {
    const call = vi.fn();
    const on = vi.fn();
    return {
      callMock: call,
      errorCatcherMock: vi.fn(),
      fakeObsWebSocket: { call, on, removeAllListeners: vi.fn() },
      onMock: on,
    };
  },
);

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
}));

vi.mock('src/helpers/obs', () => ({
  obsConnect: vi.fn(),
}));

vi.mock('src/utils/obs', () => ({
  initObsWebSocket: vi.fn(async () => undefined),
  obsWebSocketInfo: {
    obsWebSocket: fakeObsWebSocket,
  },
}));

installQuasarPlugin();
installPinia();

const CONGREGATION_ID = 'test-cong';

const setupObsSettings = () => {
  const congregationSettingsStore = useCongregationSettingsStore();
  congregationSettingsStore.congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, obsEnable: true },
  };

  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;

  return useObsStateStore();
};

/** Finds and invokes the handler ObsStatus registered for `event` via the
 * mocked `obsWebSocket.on(event, handler)`. */
const triggerObsEvent = (event: string, ...args: unknown[]) => {
  const call = onMock.mock.calls.find(([name]) => name === event);
  if (!call) throw new Error(`No handler registered for "${event}"`);
  return (call[1] as (...a: unknown[]) => unknown)(...args);
};

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe('ObsStatus - scene list retry', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    // Pre-warm the dynamic `import('obs-websocket-js')` the retry logic
    // does on every catch, so it resolves instantly during the test instead
    // of racing the fixed waits below.
    await import('obs-websocket-js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('retries instead of reporting when the socket drops mid-handshake ("Not connected")', async () => {
    const obsState = setupObsSettings();
    callMock
      .mockRejectedValueOnce(new Error('Not connected'))
      .mockResolvedValueOnce({
        currentProgramSceneName: 'Camera',
        scenes: [{ sceneName: 'Camera' }],
      });

    const { default: ObsStatus } = await import('../ObsStatus.vue');
    mount(ObsStatus, { props: { modelValue: false } });
    await wait(50);

    await triggerObsEvent('Identified');
    await wait(2200);

    expect(callMock).toHaveBeenCalledTimes(2);
    expect(errorCatcherMock).not.toHaveBeenCalled();
    expect(obsState.currentScene).toBe('Camera');
  }, 10000);

  it('still reports a genuine failure', async () => {
    setupObsSettings();
    const error = new Error('boom');
    callMock.mockRejectedValue(error);

    const { default: ObsStatus } = await import('../ObsStatus.vue');
    mount(ObsStatus, { props: { modelValue: false } });
    await wait(50);

    await triggerObsEvent('Identified');
    await wait(50);

    expect(errorCatcherMock).toHaveBeenCalledWith(error);
  });
});

// FE-6 (full-audit-2026-09-04.md): obsCloseHandler previously only flipped
// obsConnectionState to 'disconnected' - nothing ever attempted to
// reconnect on its own after OBS closed/crashed/restarted while M³ was
// running.
describe('ObsStatus - auto-reconnect on unexpected disconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('calls obsConnect again once the connection drops while OBS integration is still enabled', async () => {
    const obsState = setupObsSettings();
    const { obsConnect } = await import('src/helpers/obs');

    const { default: ObsStatus } = await import('../ObsStatus.vue');
    mount(ObsStatus, { props: { modelValue: false } });
    await wait(50);
    // Mount already triggers an initial obsConnect() via initObsListeners() -
    // clear it so only the reconnect-on-drop call below is being asserted.
    vi.mocked(obsConnect).mockClear();

    // createTestingPinia stubs actions by default (obsCloseHandler becomes a
    // no-op spy) - set the state it would have set directly, since what's
    // under test here is ObsStatus.vue's own reaction to that state change,
    // not obsCloseHandler's own implementation.
    obsState.obsConnectionState = 'disconnected';
    await wait(10);

    expect(obsConnect).toHaveBeenCalled();
  });

  it('does not reconnect once OBS integration has been disabled', async () => {
    const obsState = setupObsSettings();
    const { obsConnect } = await import('src/helpers/obs');

    const { default: ObsStatus } = await import('../ObsStatus.vue');
    mount(ObsStatus, { props: { modelValue: false } });
    await wait(50);
    vi.mocked(obsConnect).mockClear();

    const congregationSettingsStore = useCongregationSettingsStore();
    congregationSettingsStore.congregations[CONGREGATION_ID] = {
      ...defaultSettings,
      obsEnable: false,
    };
    obsState.obsConnectionState = 'disconnected';
    await wait(10);

    expect(obsConnect).not.toHaveBeenCalled();
  });
});
