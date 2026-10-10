import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useHandAlertStore } from 'stores/hand-alert';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __testables,
  HAND_NO_MEETING_INTERVAL_MS,
  HAND_POLL_INTERVAL_MS,
  handleRaisedHands,
  isZoomHandAlertEnabled,
  startZoomHandAlertWatcher,
  stopZoomHandAlertWatcher,
} from '../zoom-hand-alert';

const { createTemporaryNotification, getZoomRaisedHands, updateTimerWindow } =
  vi.hoisted(() => ({
    createTemporaryNotification: vi.fn(),
    getZoomRaisedHands: vi.fn<() => Promise<null | string[]>>(),
    updateTimerWindow: vi.fn(),
  }));

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      t: (key: string, named?: Record<string, unknown>) =>
        named?.name ? `${key}:${named.name}` : key,
    },
  },
}));

vi.mock('src/helpers/notifications', () => ({ createTemporaryNotification }));

vi.mock('src/helpers/zoom', () => ({
  getZoomRaisedHands,
  pressZoomParticipantMic: vi.fn(),
}));

vi.mock('src/helpers/fs', () => ({ getRendererPlatform: () => 'win32' }));

vi.mock('src/composables/useTimer', () => ({
  default: () => ({ updateTimerWindow }),
}));

const enableHandAlert = (phrase: null | string = 'Hand raised') => {
  useCongregationSettingsStore().congregations['cong'] = {
    ...defaultSettings,
    zoomHandRaisedPhrase: phrase,
    zoomMeetingManagerEnable: true,
    zoomMeetingManagerHandAlert: true,
  };
  useCurrentStateStore().currentCongregation = 'cong';
};

beforeEach(() => {
  vi.useFakeTimers();
  setActivePinia(createPinia());
  __testables.reset();
  createTemporaryNotification.mockReset();
  getZoomRaisedHands.mockReset();
  updateTimerWindow.mockReset();
});

afterEach(() => {
  stopZoomHandAlertWatcher();
  vi.useRealTimers();
});

describe('isZoomHandAlertEnabled', () => {
  it('needs the manager, the alert and a learned phrase', () => {
    expect(isZoomHandAlertEnabled()).toBe(false);
    enableHandAlert(null);
    expect(isZoomHandAlertEnabled()).toBe(false);
    enableHandAlert();
    expect(isZoomHandAlertEnabled()).toBe(true);
  });
});

describe('handleRaisedHands', () => {
  it('shows the hand alert and tells the operator about each new hand only', () => {
    const store = useHandAlertStore();

    handleRaisedHands(['Ann', 'Bob']);
    expect(store.active).toBe(true);
    expect(store.raisedHands).toEqual(['Ann', 'Bob']);
    expect(createTemporaryNotification).toHaveBeenCalledTimes(2);
    expect(createTemporaryNotification).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'zoom-hand-raised:Ann' }),
    );

    handleRaisedHands(['Bob', 'Cid']);
    expect(store.raisedHands).toEqual(['Bob', 'Cid']);
    expect(createTemporaryNotification).toHaveBeenCalledTimes(3);
    expect(createTemporaryNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: 'zoom-hand-raised:Cid' }),
    );

    handleRaisedHands([]);
    expect(store.active).toBe(false);
  });

  it('leaves a manually switched-on alert alone', () => {
    const store = useHandAlertStore();
    store.toggleManual();
    handleRaisedHands([]);
    expect(store.active).toBe(true);
  });
});

describe('the watcher', () => {
  it('does not start unless the alert is set up', () => {
    startZoomHandAlertWatcher();
    vi.advanceTimersByTime(HAND_POLL_INTERVAL_MS);
    expect(getZoomRaisedHands).not.toHaveBeenCalled();
  });

  it('polls Zoom during a meeting and backs off while there is none', async () => {
    enableHandAlert();
    getZoomRaisedHands.mockResolvedValueOnce(['Ann']);
    startZoomHandAlertWatcher();

    await vi.advanceTimersByTimeAsync(0);
    expect(getZoomRaisedHands).toHaveBeenCalledTimes(1);
    expect(useHandAlertStore().raisedHands).toEqual(['Ann']);

    getZoomRaisedHands.mockResolvedValueOnce(null);
    await vi.advanceTimersByTimeAsync(HAND_POLL_INTERVAL_MS);
    expect(getZoomRaisedHands).toHaveBeenCalledTimes(2);
    expect(useHandAlertStore().raisedHands).toEqual([]);

    // No meeting: the next look comes later.
    getZoomRaisedHands.mockResolvedValueOnce([]);
    await vi.advanceTimersByTimeAsync(HAND_POLL_INTERVAL_MS);
    expect(getZoomRaisedHands).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(
      HAND_NO_MEETING_INTERVAL_MS - HAND_POLL_INTERVAL_MS,
    );
    expect(getZoomRaisedHands).toHaveBeenCalledTimes(3);
  });

  it('stops, clearing the hands, when the alert is turned off', async () => {
    enableHandAlert();
    getZoomRaisedHands.mockResolvedValue(['Ann']);
    startZoomHandAlertWatcher();
    await vi.advanceTimersByTimeAsync(0);
    expect(useHandAlertStore().raisedHands).toEqual(['Ann']);

    stopZoomHandAlertWatcher();
    expect(useHandAlertStore().raisedHands).toEqual([]);
    await vi.advanceTimersByTimeAsync(HAND_POLL_INTERVAL_MS * 3);
    expect(getZoomRaisedHands).toHaveBeenCalledTimes(1);
  });
});
