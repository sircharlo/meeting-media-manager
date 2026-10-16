<template>
  <ActionPopup
    v-model="open"
    :status-color="statusColor"
    :status-icon="statusIcon"
    :status-text="statusText"
    :title="t('scene-selection')"
  >
    <div class="row q-px-md q-pb-sm q-col-gutter-xs">
      <template v-for="scene in sceneList.concat([])" :key="scene">
        <div :class="sceneColumnClass">
          <q-btn
            class="full-width"
            :color="sceneExists(scene) ? 'primary' : 'negative'"
            :icon="getSceneIcon(scene)"
            :outline="scene !== resolvedScene"
            :size="currentSettings?.obsHideIcons ? 'md' : 'sm'"
            unelevated
            @click="setObsScene(undefined, scene)"
          >
            <div class="ellipsis full-width">
              {{ getSceneLabel(scene) }}
            </div>
          </q-btn>
        </div>
      </template>
    </div>

    <template v-if="currentSettings?.obsEnableRecordingControls" #footer>
      <q-btn
        class="full-width"
        :color="isRecording ? 'negative' : 'primary'"
        :icon="isRecording ? 'mmm-stop' : 'mmm-record'"
        :label="isRecording ? t('stop-recording') : t('start-recording')"
        unelevated
        @click="toggleRecording()"
      />
    </template>
    <template
      v-if="currentSettings?.obsEnableRecordingControls && obsRecordingFolder"
      #footer-secondary
    >
      <q-btn
        class="col btn-tonal"
        color="secondary"
        flat
        icon="mmm-folder-open"
        :label="t('open-recording-folder')"
        no-caps
        @click="openObsRecordingFolder"
      />
    </template>
  </ActionPopup>
</template>

<script setup lang="ts">
import type { ObsSceneType } from 'src/types';

import { useEventListener, watchImmediate } from '@vueuse/core';
import ActionPopup from 'components/ui/ActionPopup.vue';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  obsConnect,
  obsGetRecordingDirectory,
  obsGetRecordingState,
} from 'src/helpers/obs';
import { log } from 'src/shared/vanilla';
import { isUUID } from 'src/utils/general';
import { isImage } from 'src/utils/media';
import { obsWebSocketInfo } from 'src/utils/obs';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { useRecordingStore } from 'stores/recording-state';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const {
  additionalScenes,
  configuredScenesAreAllUUIDs,
  currentSettings,
  mediaPlaying,
} = storeToRefs(currentState);
const obsState = useObsStateStore();
const {
  currentScene,
  currentSceneType,
  obsConnectionState,
  obsSceneListError,
  previousScene,
  scenes,
} = storeToRefs(obsState);
const { sceneExists } = obsState;
const obsSettingsConnect = () => {
  void obsConnect(true);
};

const recording = useRecordingStore();
const { isRecording } = storeToRefs(recording);
const { syncObsRecordingState, toggleRecording } = recording;

const { t } = useI18n();

// Connected (the popup only opens then), but the scene list may have failed
// to load: say so, as the OBS button's tooltip does.
const statusText = computed(() =>
  obsSceneListError.value ? t('obs.scene-list-error') : t('obs.connected'),
);

const statusIcon = computed(() =>
  obsSceneListError.value ? 'mmm-warning' : 'mmm-check',
);

const statusColor = computed(() =>
  obsSceneListError.value ? 'warning' : 'positive',
);

// OBS-specific recording folder (not in the store since it's OBS-only)
const obsRecordingFolder = ref<null | string>(null);

const { openFolder } = globalThis.electronApi;

const notifySceneNotFound = () =>
  createTemporaryNotification({
    caption: t('scene-not-found-explain'),
    group: 'scene-not-found',
    icon: 'mmm-obs-studio',
    message: t('scene-not-found'),
    timeout: 10_000,
    type: 'negative',
  });

const openObsRecordingFolder = () => {
  if (obsRecordingFolder.value) {
    void openFolder(obsRecordingFolder.value);
  }
};

const resolvedScene = computed(() => {
  if (!currentSettings.value) return currentScene.value;
  if (currentSettings.value.obsSwitchSceneAfterMedia) {
    if (currentSettings.value.obsRememberPreviouslyUsedScene) {
      return previousScene.value;
    }
    return currentSettings.value.obsCameraScene;
  }
  return currentScene.value;
});

const ensureObsConnected = async () => {
  if (!obsConnectionState.value?.startsWith('connect')) {
    await obsConnect();
  }
  return obsConnectionState.value === 'connected';
};

const getProgramSceneFromType = (sceneType: ObsSceneType) => {
  const settings = currentSettings.value;
  const mediaScene = settings?.obsMediaScene || undefined; // NOSONAR: '' means not set
  const imageScene = settings?.obsImageScene || undefined; // NOSONAR: '' means not set
  const cameraScene = settings?.obsCameraScene || undefined; // NOSONAR: '' means not set

  let scene = mediaScene;

  if (isImage(mediaPlaying.value.url) && imageScene) {
    scene = imageScene;
  }

  currentSceneType.value = sceneType;

  if (sceneType === 'camera') {
    scene = settings?.obsRememberPreviouslyUsedScene
      ? previousScene.value || cameraScene
      : cameraScene;
  }

  return scene;
};

const getSetSceneArguments = (newProgramScene: string) => {
  const hasSceneUuid = scenes.value?.every((scene) => 'sceneUuid' in scene);
  const useUuid = hasSceneUuid && configuredScenesAreAllUUIDs.value;

  if (isUUID(newProgramScene) && !useUuid) {
    log('OBS scene UUID would be sent as sceneName', 'obs', 'warn', {
      configuredScenesAreAllUUIDs: configuredScenesAreAllUUIDs.value,
      hasSceneUuid,
      newProgramScene,
      obsCameraScene: currentSettings.value?.obsCameraScene,
      obsImageScene: currentSettings.value?.obsImageScene,
      obsMediaScene: currentSettings.value?.obsMediaScene,
      sampleScenes: scenes.value?.slice(0, 3),
      scenesCount: scenes.value?.length,
      useUuid,
    });
  }

  return {
    ...(useUuid
      ? { sceneUuid: newProgramScene }
      : { sceneName: newProgramScene }),
  };
};

const setObsScene = async (sceneType?: ObsSceneType, desiredScene?: string) => {
  try {
    if (!(await ensureObsConnected())) return;

    let newProgramScene: string | undefined = desiredScene;

    if (!desiredScene && sceneType) {
      newProgramScene = getProgramSceneFromType(sceneType);
    } else if (
      desiredScene &&
      currentSceneType.value === 'media' &&
      currentSettings.value?.obsSwitchSceneAfterMedia
    ) {
      previousScene.value = desiredScene;
      newProgramScene = undefined;
    }

    if (!newProgramScene) return;

    if (sceneExists(newProgramScene)) {
      const args = getSetSceneArguments(newProgramScene);

      // A UUID value must always be sent as sceneUuid, never sceneName.
      // If configuredScenesAreAllUUIDs was momentarily false (e.g. during
      // store rehydration, congregation switch, or settings save),
      // getSetSceneArguments could incorrectly return { sceneName: uuid }.
      // Force the correct key when the value is unmistakably a UUID.
      if (isUUID(newProgramScene) && 'sceneName' in args) {
        await obsWebSocketInfo.obsWebSocket?.call('SetCurrentProgramScene', {
          sceneUuid: newProgramScene,
        });
      } else {
        await obsWebSocketInfo.obsWebSocket?.call(
          'SetCurrentProgramScene',
          args,
        );
      }
    } else {
      notifySceneNotFound();
    }
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: { desiredScene, name: 'setObsScene', sceneType },
      },
    });
  }
};

// setObsScene reports its own errors, so it can't reject.
const setObsSceneListener = (event: CustomEvent<{ scene: ObsSceneType }>) => {
  void setObsScene(event.detail.scene);
};

const sceneList = computed(() =>
  [currentSettings.value?.obsCameraScene]
    .concat(
      currentSettings.value?.obsSwitchSceneAfterMedia
        ? []
        : [
            currentSettings.value?.obsMediaScene,
            currentSettings.value?.obsImageScene,
          ],
    )
    .concat(additionalScenes.value || [])
    .filter((s): s is string => !!s),
);

const baseScenesLength = computed(
  () =>
    [currentSettings.value?.obsCameraScene]
      .concat(
        currentSettings.value?.obsSwitchSceneAfterMedia
          ? []
          : [
              currentSettings.value?.obsMediaScene,
              currentSettings.value?.obsImageScene,
            ],
      )
      .filter(Boolean).length,
);

const getSceneIcon = (scene: null | string | undefined) => {
  if (scene && !sceneExists(scene)) {
    return 'mmm-warning';
  }
  if (currentSettings.value?.obsHideIcons) {
    return undefined;
  }
  if (!scene) {
    return 'play-box-outline';
  } else if (scene === currentSettings.value?.obsCameraScene) {
    return 'mmm-stage-scene';
  } else if (scene === currentSettings.value?.obsMediaScene) {
    return 'mmm-media-scene';
  } else if (scene === currentSettings.value?.obsImageScene) {
    return 'mmm-pip-scene';
  }
  const sceneIndex =
    sceneList.value.indexOf(scene) + 1 - baseScenesLength.value;
  if (sceneIndex <= 10) {
    return `mmm-numeric-${sceneIndex}-box-outline`;
  }
  return 'play-box-outline';
};

const getSceneLabel = (scene: string) => {
  const settings = currentSettings.value;
  if (scene === settings?.obsCameraScene) return t('stage');
  if (scene === settings?.obsMediaScene) return t('media-only');
  if (scene === settings?.obsImageScene) return t('picture-in-picture');
  if (!isUUID(scene)) return scene;
  return (
    scenes.value.find((s) => s.sceneUuid === scene)?.sceneName ??
    t('unknown-scene')
  );
};

const sceneColumnClass = computed(() => {
  const sceneCount = sceneList.value.length;
  if (sceneCount === 1) {
    return 'col-12';
  } else if (sceneCount === 2) {
    return 'col-6';
  } else if (currentSettings.value?.obsHideIcons) {
    return 'col-4';
  }
  return sceneCount >= 4 ? 'col-3' : 'col-4';
});

useEventListener(globalThis, 'obsConnectFromSettings', obsSettingsConnect, {
  passive: true,
});

useEventListener(globalThis, 'obsSceneEvent', setObsSceneListener, {
  passive: true,
});

const handleRecordStateChanged = (data: { outputActive: boolean }) => {
  log('RecordStateChanged', 'obs', 'log', data);
  syncObsRecordingState(data.outputActive);
};

// FE-15 (full-audit-2026-09-05.md): keyed on obsConnectionState too (not
// just the settings values) so every transition to 'connected' - including
// FE-6's auto-reconnect after OBS crashes/closes/restarts, not just the
// very first successful connection - re-attaches the RecordStateChanged
// listener and re-queries the actual recording state. obsWebSocketInfo's
// OBSWebSocket instance persists across reconnects (reused, not recreated -
// see FE-6), so checking only its truthiness never re-triggered this on a
// reconnect; without this, isRecording could keep showing a stale
// "recording in progress" (or vice versa) after OBS reconnects mid-session.
watchImmediate(
  () => ({
    connectionState: obsConnectionState.value,
    enabled: currentSettings.value?.obsEnable,
    recordingControls: currentSettings.value?.obsEnableRecordingControls,
  }),
  async ({ connectionState, enabled, recordingControls }, _, onCleanup) => {
    if (!enabled || !obsWebSocketInfo.obsWebSocket) return;
    if (!recordingControls) return;
    if (connectionState !== 'connected') return;

    obsWebSocketInfo.obsWebSocket.on(
      'RecordStateChanged',
      handleRecordStateChanged,
    );

    onCleanup(() => {
      obsWebSocketInfo.obsWebSocket?.off(
        'RecordStateChanged',
        handleRecordStateChanged,
      );
    });

    const status = await obsGetRecordingState();
    if (status !== null) {
      syncObsRecordingState(status);
    }

    const folder = await obsGetRecordingDirectory();
    obsRecordingFolder.value = folder;
  },
);
</script>
