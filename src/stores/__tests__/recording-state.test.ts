import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecordingStore } from '../recording-state';

const { obsStartRecordingMock, obsStopRecordingMock } = vi.hoisted(() => ({
  obsStartRecordingMock: vi.fn(),
  obsStopRecordingMock: vi.fn(),
}));

vi.mock('src/helpers/obs', () => ({
  obsStartRecording: obsStartRecordingMock,
  obsStopRecording: obsStopRecordingMock,
}));

const useObsRecording = () => {
  useCongregationSettingsStore().congregations['test-cong'] = {
    ...defaultSettings,
    obsEnable: true,
    obsEnableRecordingControls: true,
  };
  useCurrentStateStore().currentCongregation = 'test-cong';
  useObsStateStore().obsConnectionState = 'connected';
};

beforeEach(() => {
  vi.clearAllMocks();
  setActivePinia(createPinia());
  useObsRecording();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('recording store with OBS', () => {
  it('is pending while OBS confirms the recording, then counts it', async () => {
    let confirm: (started: boolean) => void = () => undefined;
    obsStartRecordingMock.mockReturnValue(
      new Promise<boolean>((resolve) => {
        confirm = resolve;
      }),
    );
    const recording = useRecordingStore();

    const starting = recording.startRecording();
    expect(recording.togglePending).toBe(true);
    expect(recording.isRecording).toBe(false);

    confirm(true);
    await starting;

    expect(recording.togglePending).toBe(false);
    expect(recording.isRecording).toBe(true);
  });

  // MMM-V2-3MA: a recording OBS never started must not be shown as running.
  it('does not count a recording OBS did not start', async () => {
    obsStartRecordingMock.mockResolvedValue(false);
    const recording = useRecordingStore();

    await recording.startRecording();

    expect(recording.isRecording).toBe(false);
  });

  it("keeps the start time from OBS's own event while waiting for confirmation", async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1000);
    const recording = useRecordingStore();
    obsStartRecordingMock.mockImplementation(async () => {
      // RecordStateChanged arrives before OBS's status confirms it.
      recording.syncObsRecordingState(true);
      vi.setSystemTime(1500);
      return true;
    });

    await recording.startRecording();

    expect(recording.isRecording).toBe(true);
    expect(recording.recordingStartedAt).toBe(1000);
  });

  it('stops counting once OBS reports nothing left to stop', async () => {
    obsStartRecordingMock.mockResolvedValue(true);
    obsStopRecordingMock.mockResolvedValue(true);
    const recording = useRecordingStore();
    await recording.startRecording();

    await recording.stopRecording();

    expect(recording.isRecording).toBe(false);
  });
});
