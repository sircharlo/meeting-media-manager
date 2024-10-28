<template>
  <q-btn
    v-if="currentSettings.obsEnable"
    :color="
      obsConnectionState === 'connected'
        ? localObsPopup
          ? 'white'
          : 'white-transparent'
        : obsConnectionState === 'disconnected'
          ? 'negative'
          : 'warning'
    "
    :disable="obsConnectionState !== 'connected'"
    :outline="localObsPopup"
    class="super-rounded"
    rounded
    unelevated
    @click="localObsPopup = !localObsPopup"
  >
    <q-icon size="sm">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M43.765,34.373 c1.267-3.719-0.131-8.03-3.567-10.23c-4.024-2.576-9.374-1.401-11.95,2.623h0c-1.854,2.896-1.756,6.474-0.061,9.215 c-1.009,1.556-2.369,2.917-4.07,3.931c-5.4,3.22-12.356,1.952-16.225-2.779c-0.186-0.262-0.367-0.527-0.541-0.797 c2.62,3.273,7.404,4.213,11.166,2.09c4.161-2.348,5.631-7.625,3.283-11.786v0c-1.618-2.867-4.627-4.456-7.703-4.399 c-0.994-1.792-1.563-3.852-1.563-6.047c0-5.482,3.537-10.119,8.448-11.8c0.36-0.07,0.728-0.116,1.094-0.168 c-3.321,1.208-5.698,4.384-5.698,8.123c0,4.778,3.873,8.651,8.651,8.651c3.179,0,5.949-1.719,7.453-4.274 c2.197,0.015,4.417,0.594,6.427,1.825c5.056,3.094,7.173,9.294,5.39,14.713C44.137,33.643,43.948,34.007,43.765,34.373z"
        />
      </svg>
    </q-icon>
    <q-tooltip v-if="!localObsPopup" :delay="1000" :offset="[14, 22]">
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
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings } = storeToRefs(currentState);

const obsState = useObsStateStore();
const { currentScene, obsConnectionState, obsMessage, previousScene, scenes } =
  storeToRefs(obsState);
const { sceneExists } = obsState;

const props = defineProps<{
  obs: boolean;
}>();

const localObsPopup = ref(props.obs);

const emit = defineEmits(['update:obs']);

watch(localObsPopup, (newValue) => {
  emit('update:obs', newValue);
});

watch(
  () => props.obs,
  (newValue) => {
    localObsPopup.value = newValue;
  },
);

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

        if (
          current !== currentSettings.value?.obsMediaScene &&
          current !== currentSettings.value?.obsImageScene
        ) {
          previousScene.value = current;
        }

        [
          currentSettings.value?.obsCameraScene,
          currentSettings.value?.obsMediaScene,
          currentSettings.value?.obsImageScene,
        ]
          .filter(Boolean)
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
