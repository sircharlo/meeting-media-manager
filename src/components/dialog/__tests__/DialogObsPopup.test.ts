import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { useRecordingStore } from 'stores/recording-state';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DialogObsPopup from '../DialogObsPopup.vue';

const { callMock, errorCatcherMock, fakeObsWebSocket } = vi.hoisted(() => {
  const call = vi.fn();
  return {
    callMock: call,
    errorCatcherMock: vi.fn(),
    fakeObsWebSocket: { call, off: vi.fn(), on: vi.fn() },
  };
});

const obsGetRecordingStateMock = vi.hoisted(() =>
  vi.fn<() => Promise<boolean>>(async () => false),
);

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: errorCatcherMock,
}));

vi.mock('src/helpers/obs', () => ({
  obsConnect: vi.fn(),
  obsGetRecordingDirectory: vi.fn(async () => null),
  obsGetRecordingState: obsGetRecordingStateMock,
  obsStartRecording: vi.fn(),
  obsStopRecording: vi.fn(),
}));

vi.mock('src/utils/obs', () => ({
  initObsWebSocket: vi.fn(async () => undefined),
  obsWebSocketInfo: {
    obsWebSocket: fakeObsWebSocket,
  },
}));

installQuasarPlugin();
// createTestingPinia stubs actions by default (they become no-op spies) -
// sceneExists (an action) needs to actually run for the scene-switch tests.
installPinia({ stubActions: false });

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

const CONGREGATION_ID = 'test-cong';

// Only the scene-highlighting logic under test reads these settings; the
// rest of the object just needs to satisfy SettingsValues.
const setupObsSettings = (overrides: Partial<typeof defaultSettings> = {}) => {
  const congregationSettingsStore = useCongregationSettingsStore();
  congregationSettingsStore.congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      obsCameraScene: 'Camera',
      obsEnable: true,
      obsImageScene: null,
      obsMediaScene: 'Media',
      obsSwitchSceneAfterMedia: false,
      ...overrides,
    },
  };

  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;

  return useObsStateStore();
};

/** Finds the scene q-btn whose label matches `text` and reports whether it's
 * rendered as the active (filled, non-outline) button. QMenu teleports its
 * content straight to document.body, outside the mounted wrapper's tree, so
 * this queries the DOM directly rather than going through `wrapper.find`. */
const isActiveSceneButton = (text: string) => {
  // The button's icon is rendered as an <i> sibling whose own text content
  // is the (non-visible) icon ligature name, so matching on the button's
  // full textContent would also have to account for that. The scene label
  // itself always lives in its own `.ellipsis` div, so match on that instead.
  const label = Array.from(document.querySelectorAll('button .ellipsis')).find(
    (el) => el.textContent?.trim() === text,
  );
  const button = label?.closest('button');
  if (!button) throw new Error(`No scene button found with text "${text}"`);
  return !button.classList.contains('q-btn--outline');
};

describe('DialogObsPopup - active scene highlighting', () => {
  it('follows the live OBS scene when "switch scene after media" is off', async () => {
    const obsState = setupObsSettings({ obsSwitchSceneAfterMedia: false });
    // Simulate OBS having switched to the media scene (e.g. because the
    // user clicked the "Media only" button, which changes OBS's actual
    // program scene via the websocket).
    obsState.currentScene = 'Media';

    mount(DialogObsPopup, {
      props: { modelValue: true },
    });
    await Promise.resolve();

    expect(isActiveSceneButton('Media only')).toBe(true);
    expect(isActiveSceneButton('Stage')).toBe(false);
  });

  it('moves the highlight back to Stage once OBS reports the camera scene again', async () => {
    const obsState = setupObsSettings({ obsSwitchSceneAfterMedia: false });
    obsState.currentScene = 'Camera';

    mount(DialogObsPopup, {
      props: { modelValue: true },
    });
    await Promise.resolve();

    expect(isActiveSceneButton('Stage')).toBe(true);
    expect(isActiveSceneButton('Media only')).toBe(false);
  });
});

/** Clicks the scene q-btn whose label matches `text` (see isActiveSceneButton
 * for why this queries the DOM directly rather than going through
 * `wrapper.find`). */
const clickSceneButton = (text: string) => {
  const label = Array.from(document.querySelectorAll('button .ellipsis')).find(
    (el) => el.textContent?.trim() === text,
  );
  const button = label?.closest('button');
  if (!button) throw new Error(`No scene button found with text "${text}"`);
  (button as HTMLButtonElement).click();
};

describe('DialogObsPopup - scene switch error handling', () => {
  it('reports a rejected SetCurrentProgramScene call instead of letting it become an unhandled rejection', async () => {
    const obsState = setupObsSettings({ obsSwitchSceneAfterMedia: false });
    obsState.obsConnectionState = 'connected';
    obsState.scenes = [{ sceneName: 'Camera' }, { sceneName: 'Media' }];

    const rejection = new Error('OBS is not ready to perform the request.');
    callMock.mockRejectedValueOnce(rejection);

    mount(DialogObsPopup, {
      props: { modelValue: true },
    });
    await Promise.resolve();

    clickSceneButton('Stage');
    await flushPromises();

    expect(callMock).toHaveBeenCalledWith('SetCurrentProgramScene', {
      sceneName: 'Camera',
    });
    // Regression check: setObsScene's call to obsWebSocket.call(...) must be
    // awaited so its own try/catch can route a rejection through
    // errorCatcher, rather than it escaping as an unhandled promise
    // rejection (MMM-V2-3G0).
    expect(errorCatcherMock).toHaveBeenCalledWith(
      rejection,
      expect.objectContaining({
        contexts: {
          fn: expect.objectContaining({
            desiredScene: 'Camera',
            name: 'setObsScene',
          }),
        },
      }),
    );
  });
});

// FE-15 (full-audit-2026-09-05.md): isRecording was only ever reconciled
// against OBS's actual state once, on the first successful connection - a
// later disconnect/reconnect cycle (e.g. OBS crashing mid-meeting, then
// FE-6's auto-reconnect succeeding) never re-queried the real state, so a
// stale isRecording could keep showing "recording" (or not) after OBS came
// back with a different actual state.
describe('DialogObsPopup - recording-state resync on reconnect', () => {
  it('re-queries the real recording state on every transition to connected, not just the first', async () => {
    // The watcher's object-literal getter source makes Vue re-run its
    // callback on every dependency re-evaluation (a new object reference
    // each time), not just on a genuine value change - so obsGetRecordingState
    // can legitimately be called more than once per transition. Rather than
    // asserting an exact call count, have every call consistently reflect
    // the current "real OBS" truth via a plain closure variable, so the
    // assertion holds regardless of how many times it fires.
    let obsIsActuallyRecording = false;
    obsGetRecordingStateMock.mockImplementation(
      async () => obsIsActuallyRecording,
    );

    const obsState = setupObsSettings({ obsEnableRecordingControls: true });
    obsState.obsConnectionState = 'connected';

    mount(DialogObsPopup, {
      props: { modelValue: true },
    });
    await flushPromises();

    const recording = useRecordingStore();
    expect(recording.isRecording).toBe(false);

    // OBS crashes/closes, then FE-6's auto-reconnect succeeds - this time
    // OBS itself was actually recording (e.g. started from a different
    // control surface while M³ was disconnected).
    obsState.obsConnectionState = 'disconnected';
    await flushPromises();
    obsIsActuallyRecording = true;
    obsState.obsConnectionState = 'connected';
    await flushPromises();

    expect(recording.isRecording).toBe(true);
  });
});
