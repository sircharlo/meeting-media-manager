import { useIntervalFn } from '@vueuse/core';
import { defineStore, storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { sendKeyboardShortcut } from 'src/helpers/keyboard-shortcuts';
import { obsStartRecording, obsStopRecording } from 'src/helpers/obs';
import { log } from 'src/shared/vanilla';
import { formatTime } from 'src/utils/time';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { computed, ref } from 'vue';

type RecordingBackend = 'generic' | 'obs';

export const useRecordingStore = defineStore('recording', () => {
  const currentState = useCurrentStateStore();
  const { currentSettings } = storeToRefs(currentState);
  const obsState = useObsStateStore();
  const { obsConnectionState } = storeToRefs(obsState);

  const isRecording = ref(false);
  const recordingStartedAt = ref<null | number>(null);
  const recordingDurationMs = ref(0);
  // Which backend the CURRENT recording actually started through - stop
  // must keep using this, not re-derive the backend from live settings,
  // or toggling obsEnableRecordingControls mid-recording would route the
  // stop call to the wrong backend entirely (see startRecording/stopRecording).
  const activeBackend = ref<null | RecordingBackend>(null);
  let togglePending = false;

  const { pause: pauseTimer, resume: resumeTimer } = useIntervalFn(
    () => {
      if (recordingStartedAt.value) {
        recordingDurationMs.value = Date.now() - recordingStartedAt.value;
      }
    },
    500,
    { immediate: false },
  );

  // Which backend controls recording is a settings decision - it must match
  // the mutual-exclusion rule the rest of the app already applies (e.g.
  // RecordingStatus.vue's own v-if), not live connection state. Otherwise a
  // momentary OBS disconnect would silently reroute "start recording" to
  // the generic keyboard-shortcut path instead (wrong backend entirely, not
  // just a failed action) whenever a shortcut also happens to be configured.
  const usesObs = computed(
    () =>
      !!(
        currentSettings.value?.obsEnable &&
        currentSettings.value?.obsEnableRecordingControls
      ),
  );

  // Starting genuinely needs a live OBS socket, so gating on connection
  // state here is correct.
  const canStartRecording = computed(() => {
    if (usesObs.value) return obsConnectionState.value === 'connected';
    return !!(
      currentSettings.value?.recordingEnable &&
      currentSettings.value?.recordingStartShortcut
    );
  });

  // Stopping must NOT be blocked by a momentary connection blip - the user
  // needs to always be able to attempt to stop an in-progress recording,
  // and obsStopRecording() already fails safely on its own if the socket
  // really is unreachable.
  const canStopRecording = computed(() => isRecording.value);

  const formattedDuration = computed(() =>
    isRecording.value
      ? formatTime(Math.floor(recordingDurationMs.value / 1000))
      : '',
  );

  const markRecordingStarted = (backend: RecordingBackend) => {
    activeBackend.value = backend;
    isRecording.value = true;
    recordingStartedAt.value = Date.now();
    recordingDurationMs.value = 0;
    resumeTimer();
  };

  const markRecordingStopped = () => {
    activeBackend.value = null;
    isRecording.value = false;
    recordingStartedAt.value = null;
    recordingDurationMs.value = 0;
    pauseTimer();
  };

  const startRecording = async () => {
    if (isRecording.value || togglePending) return;
    togglePending = true;
    try {
      if (usesObs.value) {
        const success = await obsStartRecording();
        if (success) markRecordingStarted('obs');
        return;
      }

      // Generic shortcut-driven recording
      const startShortcut = currentSettings.value?.recordingStartShortcut;
      if (startShortcut) {
        sendKeyboardShortcut(startShortcut, 'Recording');
        markRecordingStarted('generic');
      }
    } catch (error) {
      errorCatcher(error, {
        contexts: { fn: { name: 'startRecording' } },
      });
    } finally {
      togglePending = false;
    }
  };

  const stopRecording = async () => {
    if (!isRecording.value || togglePending) return;
    togglePending = true;
    try {
      // Falls back to the current settings-derived backend only if a
      // recording was somehow already in progress without ever going
      // through startRecording()/syncObsRecordingState() (e.g. state
      // restored some other way) - the normal path always has
      // activeBackend already set from when the recording started.
      const backend =
        activeBackend.value ?? (usesObs.value ? 'obs' : 'generic');

      if (backend === 'obs') {
        const success = await obsStopRecording();
        if (success) markRecordingStopped();
        return;
      }

      // Generic shortcut-driven recording
      const stopShortcut =
        currentSettings.value?.recordingStopShortcut ||
        currentSettings.value?.recordingStartShortcut;
      if (stopShortcut) {
        sendKeyboardShortcut(stopShortcut, 'Recording');
        markRecordingStopped();
      }
    } catch (error) {
      errorCatcher(error, {
        contexts: { fn: { name: 'stopRecording' } },
      });
    } finally {
      togglePending = false;
    }
  };

  const toggleRecording = async () => {
    if (isRecording.value) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  // Sync OBS recording state from DialogObsPopup's RecordStateChanged listener.
  // Called externally (from DialogObsPopup) when RecordStateChanged fires.
  const syncObsRecordingState = (recordingActive: boolean) => {
    if (!usesObs.value) return;
    log('syncObsRecordingState', 'recording', 'log', { recordingActive });
    const wasRecording = isRecording.value;
    if (recordingActive && !wasRecording) {
      markRecordingStarted('obs');
    } else if (!recordingActive && wasRecording) {
      markRecordingStopped();
    }
  };

  return {
    canStartRecording,
    canStopRecording,
    formattedDuration,
    isRecording,
    recordingDurationMs,
    recordingStartedAt,
    startRecording,
    stopRecording,
    syncObsRecordingState,
    toggleRecording,
  };
});
