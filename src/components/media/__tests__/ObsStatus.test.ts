import type * as ObsHelpers from 'src/helpers/obs';

import { mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { obsConnect } from 'src/helpers/obs';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ObsStatus from '../ObsStatus.vue';

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

vi.mock('src/helpers/obs', async (importOriginal) => ({
  isTransientObsError: (await importOriginal<typeof ObsHelpers>())
    .isTransientObsError,
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

// Every condition below is awaited rather than given a fixed delay, so a
// slow machine (e.g. a full parallel test run) can't make a test check too
// early. The waits are generous: they only matter when something is wrong.
const WAIT_OPTIONS = { timeout: 5000 };

const setupObsSettings = () => {
  const congregationSettingsStore = useCongregationSettingsStore();
  congregationSettingsStore.congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, obsEnable: true },
  };

  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;

  return useObsStateStore();
};

let wrapper: undefined | VueWrapper;

/** Mounts ObsStatus and waits until it has registered its OBS listeners
 * (initObsListeners runs asynchronously from onMounted). */
const mountObsStatus = async () => {
  wrapper = mount(ObsStatus, { props: { modelValue: false } });
  await vi.waitFor(() => {
    expect(onMock).toHaveBeenCalledWith('Identified', expect.any(Function));
  }, WAIT_OPTIONS);
};

/** Finds and invokes the handler ObsStatus registered for `event` via the
 * mocked `obsWebSocket.on(event, handler)`. */
const triggerObsEvent = (event: string, ...args: unknown[]) => {
  const call = onMock.mock.calls.find(([name]) => name === event);
  if (!call) throw new Error(`No handler registered for "${event}"`);
  return (call[1] as (...a: unknown[]) => unknown)(...args);
};

// The pinia and the mocked socket are shared by every test in this file:
// unmount the previous component (so its watchers can't react to the next
// test's state), drop queued one-off socket replies a test didn't consume,
// and start each test from the store's initial state.
beforeEach(() => {
  vi.clearAllMocks();
  callMock.mockReset();
  useObsStateStore().$reset();
  document.body.innerHTML = '';
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
});

describe('ObsStatus - scene list retry', () => {
  it('retries instead of reporting when the socket drops mid-handshake ("Not connected")', async () => {
    const obsState = setupObsSettings();
    callMock
      .mockRejectedValueOnce(new Error('Not connected'))
      .mockResolvedValueOnce({
        currentProgramSceneName: 'Camera',
        scenes: [{ sceneName: 'Camera' }],
      });

    await mountObsStatus();

    await triggerObsEvent('Identified');
    // The retry comes after fetchSceneList's 2 s back-off.
    await vi.waitFor(() => {
      expect(obsState.currentScene).toBe('Camera');
    }, WAIT_OPTIONS);

    expect(callMock).toHaveBeenCalledTimes(2);
    expect(errorCatcherMock).not.toHaveBeenCalled();
  }, 10_000);

  it('gives up on an empty scene list reply instead of looping on it', async () => {
    const obsState = setupObsSettings();
    // An empty reply used to restart the loop without counting an attempt
    // or waiting, spinning the renderer forever. Fail after a few calls so a
    // regression shows up as extra calls rather than a hung test.
    callMock.mockImplementation(async () => {
      if (callMock.mock.calls.length > 10) throw new Error('still looping');
      return undefined;
    });

    await mountObsStatus();
    expect(obsState.obsSceneListError).toBe(false);

    await triggerObsEvent('Identified');
    // Looping on the empty reply would flag the error too (once the mock
    // starts throwing), but only after many more calls than this one.
    await vi.waitFor(() => {
      expect(obsState.obsSceneListError).toBe(true);
    }, WAIT_OPTIONS);

    expect(callMock).toHaveBeenCalledTimes(1);
    expect(errorCatcherMock).not.toHaveBeenCalled();
  });

  it('still reports a genuine failure', async () => {
    setupObsSettings();
    const error = new Error('boom');
    callMock.mockRejectedValue(error);

    await mountObsStatus();

    await triggerObsEvent('Identified');

    await vi.waitFor(() => {
      expect(errorCatcherMock).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          contexts: { fn: { name: 'fetchSceneList' } },
        }),
      );
    }, WAIT_OPTIONS);
    // A genuine failure isn't retried: one request, one report (the extra
    // iterations would have run in microtasks right after the rejection).
    expect(callMock).toHaveBeenCalledTimes(1);
    expect(errorCatcherMock).toHaveBeenCalledTimes(1);
  });
});

// FE-6 (full-audit-2026-09-04.md): obsCloseHandler previously only flipped
// obsConnectionState to 'disconnected' - nothing ever attempted to
// reconnect on its own after OBS closed/crashed/restarted while M³ was
// running.
describe('ObsStatus - auto-reconnect on unexpected disconnect', () => {
  it('calls obsConnect again once the connection drops while OBS integration is still enabled', async () => {
    const obsState = setupObsSettings();

    await mountObsStatus();
    // Mount already triggers an initial obsConnect() via initObsListeners() -
    // clear it so only the reconnect-on-drop call below is being asserted.
    expect(obsConnect).toHaveBeenCalled();
    vi.mocked(obsConnect).mockClear();

    // createTestingPinia stubs actions by default (obsCloseHandler becomes a
    // no-op spy) - set the state it would have set directly, since what's
    // under test here is ObsStatus.vue's own reaction to that state change,
    // not obsCloseHandler's own implementation.
    obsState.obsConnectionState = 'disconnected';

    await vi.waitFor(() => {
      expect(obsConnect).toHaveBeenCalled();
    }, WAIT_OPTIONS);
  });

  it('does not reconnect once OBS integration has been disabled', async () => {
    const obsState = setupObsSettings();

    await mountObsStatus();
    vi.mocked(obsConnect).mockClear();
    fakeObsWebSocket.removeAllListeners.mockClear();

    const congregationSettingsStore = useCongregationSettingsStore();
    congregationSettingsStore.congregations[CONGREGATION_ID] = {
      ...defaultSettings,
      obsEnable: false,
    };
    obsState.obsConnectionState = 'disconnected';

    // Disabling OBS removes the socket listeners from the same watcher flush
    // that would reconnect on the drop, so once that has happened the
    // reconnect watcher has had its chance to (wrongly) call obsConnect.
    await vi.waitFor(() => {
      expect(fakeObsWebSocket.removeAllListeners).toHaveBeenCalled();
    }, WAIT_OPTIONS);

    expect(obsConnect).not.toHaveBeenCalled();
  });
});
