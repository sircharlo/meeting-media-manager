<template>
  <q-btn
    v-if="currentSettings?.obsEnable"
    class="super-rounded"
    :color="
      obsPopup
        ? 'white'
        : obsConnectionState === 'connected'
          ? 'white-transparent'
          : obsConnectionState === 'disconnected'
            ? 'negative'
            : 'warning'
    "
    :disable="obsConnectionState !== 'connected'"
    rounded
    :text-color="
      obsPopup
        ? obsConnectionState === 'connected'
          ? 'primary'
          : obsConnectionState === 'disconnected'
            ? 'negative'
            : 'warning'
        : ''
    "
    unelevated
    @click="(obsPopup = !obsPopup)"
    @mouseenter="
      currentSettings?.obsQuickToggle && obsConnectionState === 'connected'
        ? (obsPopup = true)
        : undefined
    "
  >
    <q-icon name="mmm-obs-studio" />
    <q-tooltip v-if="!obsPopup" :delay="1000" :offset="[14, 22]">
      {{ $t(obsMessage ?? 'scene-selection') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { OBSWebSocketError } from 'obs-websocket-js';
import { storeToRefs } from 'pinia';
import { obsWebSocket } from 'src/boot/globals';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  configuredScenesAreAllUUIDs,
  obsCloseHandler,
  obsConnect,
  obsErrorHandler,
} from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useObsStateStore } from 'src/stores/obs-state';
import { onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const obsState = useObsStateStore();
const { currentScene, obsConnectionState, obsMessage, previousScene, scenes } =
  storeToRefs(obsState);
const { sceneExists } = obsState;

const obsPopup = defineModel<boolean>({ required: true });

const fetchSceneList = async (retryInterval = 2000, maxRetries = 5) => {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const sceneList = await obsWebSocket?.call('GetSceneList');
      if (sceneList) {
        scenes.value = sceneList.scenes.reverse();
        const current =
          configuredScenesAreAllUUIDs() && sceneList.currentProgramSceneUuid
            ? sceneList.currentProgramSceneUuid
            : sceneList.currentProgramSceneName;

        currentScene.value = current;

        [
          currentSettings.value?.obsCameraScene,
          currentSettings.value?.obsMediaScene,
          currentSettings.value?.obsImageScene,
        ]
          .filter((s): s is string => !!s)
          .forEach((scene) => {
            if (!sceneExists(scene)) notifySceneNotFound();
          });
        return;
      }
    } catch (error) {
      attempts++;
      if (
        error instanceof OBSWebSocketError &&
        error.message.includes('OBS is not ready')
      ) {
        console.log(`Retrying... (${attempts}/${maxRetries})`);
        await new Promise((resolve) => {
          setTimeout(resolve, retryInterval);
        });
      } else {
        errorCatcher(error);
      }
    }
  }
  errorCatcher('OBS Error: Max retries reached. Could not fetch scene list.');
};

const { t } = useI18n();

const notifySceneNotFound = () =>
  createTemporaryNotification({
    caption: t('scene-not-found-explain'),
    group: 'scene-not-found',
    icon: 'mmm-obs-studio',
    message: t('scene-not-found'),
    timeout: 10000,
    type: 'negative',
  });

onMounted(() => {
  try {
    obsWebSocket.on('ConnectionOpened', () => {
      obsConnectionState.value = 'connecting';
    });
    obsWebSocket.on('ConnectionClosed', obsCloseHandler);
    obsWebSocket.on('ConnectionError', obsErrorHandler);
    obsWebSocket.on(
      'CurrentProgramSceneChanged',
      (data: { sceneName: string; sceneUuid: string }) => {
        const newScene =
          configuredScenesAreAllUUIDs() && data.sceneUuid
            ? data.sceneUuid
            : data.sceneName;

        currentScene.value = newScene;

        if (
          newScene !== currentSettings.value?.obsMediaScene &&
          newScene !== currentSettings.value?.obsImageScene
        ) {
          previousScene.value = newScene;
        }
      },
    );
    obsWebSocket.on('Identified', async () => {
      obsConnectionState.value = 'connected';
      obsMessage.value = 'obs.connected';
      fetchSceneList();
    });
    obsWebSocket.on('SceneListChanged', (data) => {
      scenes.value = data.scenes;
    });
    obsConnect();
  } catch (error) {
    errorCatcher(error);
  }
});

onUnmounted(() => {
  try {
    obsWebSocket.removeAllListeners('ConnectionClosed');
    obsWebSocket.removeAllListeners('ConnectionError');
    obsWebSocket.removeAllListeners('ConnectionOpened');
    obsWebSocket.removeAllListeners('CurrentProgramSceneChanged');
    obsWebSocket.removeAllListeners('Identified');
    obsWebSocket.removeAllListeners('SceneListChanged');
  } catch (error) {
    errorCatcher(error);
  }
});
</script>
