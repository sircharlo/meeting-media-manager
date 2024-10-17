<template>
  <q-btn
    v-if="currentSettings.obsEnable"
    :color="
      obsConnectionState === 'connected'
        ? 'white-transparent'
        : obsConnectionState === 'disconnected'
          ? 'negative'
          : 'warning'
    "
    :disable="obsConnectionState !== 'connected'"
    class="super-rounded"
    rounded
    unelevated
    @click="scenePicker = true"
  >
    <q-icon size="sm">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M25,2C12.317,2,2,12.317,2,25s10.317,23,23,23s23-10.317,23-23S37.683,2,25,2z M43.765,34.373 c1.267-3.719-0.131-8.03-3.567-10.23c-4.024-2.576-9.374-1.401-11.95,2.623h0c-1.854,2.896-1.756,6.474-0.061,9.215 c-1.009,1.556-2.369,2.917-4.07,3.931c-5.4,3.22-12.356,1.952-16.225-2.779c-0.186-0.262-0.367-0.527-0.541-0.797 c2.62,3.273,7.404,4.213,11.166,2.09c4.161-2.348,5.631-7.625,3.283-11.786v0c-1.618-2.867-4.627-4.456-7.703-4.399 c-0.994-1.792-1.563-3.852-1.563-6.047c0-5.482,3.537-10.119,8.448-11.8c0.36-0.07,0.728-0.116,1.094-0.168 c-3.321,1.208-5.698,4.384-5.698,8.123c0,4.778,3.873,8.651,8.651,8.651c3.179,0,5.949-1.719,7.453-4.274 c2.197,0.015,4.417,0.594,6.427,1.825c5.056,3.094,7.173,9.294,5.39,14.713C44.137,33.643,43.948,34.007,43.765,34.373z"
        />
      </svg>
    </q-icon>
    <q-tooltip v-if="!scenePicker" :delay="1000" :offset="[14, 22]">
      {{ $t(obsMessage ?? 'scene-selection') }}
    </q-tooltip>
    <!-- <q-popup-proxy
      :offset="[0, 8]"
      @before-hide="scenePicker = false"
      @before-show="scenePicker = true"
      anchor="top middle"
      class="round-card"
      flat
      self="bottom middle"
    > -->
    <q-dialog v-model="scenePicker" position="bottom">
      <q-card flat style="min-width: 50vw">
        <q-card-section>
          <div class="card-title">
            {{ $t('scene-selection') }}
          </div>
          <div>
            <p class="card-section-title text-dark-grey">
              {{ $t('main-scenes') }}
            </p>
          </div>
          <div class="row items-center q-col-gutter-sm">
            <template
              v-for="scene in [
                currentSettings?.obsCameraScene,
                currentSettings?.obsMediaScene,
                currentSettings?.obsImageScene,
              ].filter(Boolean)"
              :key="scene"
            >
              <div class="col">
                <q-btn
                  :color="sceneExists(scene) ? 'primary' : 'negative'"
                  :outline="scene !== currentScene"
                  class="full-width"
                  unelevated
                  @click="setObsScene(undefined, scene)"
                >
                  <q-icon
                    :name="
                      scene === currentSettings?.obsCameraScene
                        ? 'mmm-lectern'
                        : scene === currentSettings?.obsMediaScene
                          ? 'mmm-stream-now'
                          : 'mmm-picture-in-picture'
                    "
                    class="q-mr-sm"
                    size="xs"
                  />
                  {{
                    scene === currentSettings?.obsCameraScene
                      ? $t('speaker')
                      : scene === currentSettings?.obsMediaScene
                        ? $t('media-only')
                        : $t('picture-in-picture')
                  }}
                </q-btn>
              </div>
            </template>
          </div>
          <template v-if="additionalScenes.length > 0">
            <q-separator class="bg-accent-200 q-my-md" />
            <div>
              <p class="card-section-title text-dark-grey">
                {{ $t('additional-scenes') }}
              </p>
            </div>
            <div class="row items-center q-col-gutter-sm q-mb-md">
              <template v-for="scene in additionalScenes" :key="scene">
                <div class="col-4">
                  <q-btn
                    :outline="scene !== currentScene"
                    class="full-width"
                    color="primary"
                    unelevated
                    @click="setObsScene(undefined, scene as string)"
                  >
                    {{
                      isUUID(scene)
                        ? scenes.find((s) => s.sceneUuid === scene)?.sceneName
                        : scene
                    }}
                  </q-btn>
                </div>
              </template>
            </div>
          </template>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-btn>
</template>

<script setup lang="ts">
import type { JsonObject } from 'obs-websocket-js/node_modules/type-fest';

import { OBSWebSocketError } from 'obs-websocket-js';
import { storeToRefs } from 'pinia';
import { obsWebSocket } from 'src/boot/globals';
import { errorCatcher } from 'src/helpers/error-catcher';
import { isImage } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { configuredScenesAreAllUUIDs, isUUID } from 'src/helpers/obs';
import { portNumberValidator } from 'src/helpers/settings';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useObsStateStore } from 'src/stores/obs-state';
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { currentSettings, mediaPlayingUrl } = storeToRefs(currentState);

const obsState = useObsStateStore();
const {
  additionalScenes,
  currentScene,
  currentSceneType,
  obsConnectionState,
  obsMessage,
  scenes,
} = storeToRefs(obsState);

const scenePicker = ref(false);
const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const obsCloseHandler = () => {
  obsConnectionState.value = 'disconnected';
  obsMessage.value = 'obs.disconnected';
};

const obsErrorHandler = (err: OBSWebSocketError) => {
  obsMessage.value = 'obs.error';
  if (err?.code && ![-1, 1001, 1006, 4009].includes(err.code))
    errorCatcher(err);
};

const obsConnect = async (setup?: boolean) => {
  try {
    if (!currentSettings.value?.obsEnable) {
      await obsWebSocket?.disconnect();
      return;
    }

    const obsPort = (currentSettings.value?.obsPort as string) || '';
    if (!portNumberValidator(obsPort)) return;

    const obsPassword = (currentSettings.value?.obsPassword as string) || '';
    if (obsPassword?.length === 0) return;

    obsConnectionState.value = 'connecting';
    obsMessage.value = 'obs.connecting';

    let attempt = 0;
    const maxAttempts = setup ? 1 : 12;
    const timeBetweenAttempts = 5000;
    while (attempt < maxAttempts && obsConnectionState.value !== 'connected') {
      try {
        const connection = await obsWebSocket?.connect(
          'ws://127.0.0.1:' + obsPort,
          obsPassword,
        );
        if (
          connection?.negotiatedRpcVersion &&
          connection?.obsWebSocketVersion
        ) {
          break;
        }
      } catch (err) {
        obsErrorHandler(err);
      } finally {
        attempt++;
        if (attempt < maxAttempts) {
          await sleep(timeBetweenAttempts);
        }
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const sceneExists = (sceneToCheck: string) => {
  if (!scenes.value || !sceneToCheck) return false;
  const matchScene = isUUID(sceneToCheck)
    ? (scene: JsonObject) => scene.sceneUuid === sceneToCheck
    : (scene: JsonObject) => scene.sceneName === sceneToCheck;
  return scenes.value?.some(matchScene);
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

const setObsScene = async (
  sceneType: 'camera' | 'media' | undefined,
  desiredScene?: string,
) => {
  try {
    if (!obsConnectionState.value?.startsWith('connect')) await obsConnect();
    if (obsConnectionState.value !== 'connected') return;
    let newProgramScene: string | undefined = desiredScene;
    if (!desiredScene && sceneType) {
      const mediaScene = currentSettings.value?.obsMediaScene as string;
      const imageScene = currentSettings.value?.obsImageScene as string;
      const cameraScene = currentSettings.value?.obsCameraScene as string;
      newProgramScene = mediaScene;
      if (isImage(mediaPlayingUrl.value) && imageScene)
        newProgramScene = imageScene;
      currentSceneType.value = sceneType;
      if (sceneType === 'camera') newProgramScene = cameraScene;
    }
    if (newProgramScene) {
      const hasSceneUuid = scenes.value?.every((scene) => 'sceneUuid' in scene);
      const currentScenesAreUuids = configuredScenesAreAllUUIDs();

      if (sceneExists(newProgramScene)) {
        obsWebSocket?.call('SetCurrentProgramScene', {
          ...(hasSceneUuid &&
            currentScenesAreUuids && { sceneUuid: newProgramScene }),
          ...((!hasSceneUuid || !currentScenesAreUuids) && {
            sceneName: newProgramScene,
          }),
        });
      } else {
        notifySceneNotFound();
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const setObsSceneListener = (event: CustomEventInit) => {
  try {
    setObsScene(event.detail.scene);
  } catch (error) {
    errorCatcher(error);
  }
};

const obsSettingsConnect = () => obsConnect(true);

const fetchSceneList = async (retryInterval = 2000, maxRetries = 5) => {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const sceneList = await obsWebSocket?.call('GetSceneList');
      if (sceneList) {
        scenes.value = sceneList.scenes.reverse();
        currentScene.value =
          configuredScenesAreAllUUIDs() && sceneList.currentProgramSceneUuid
            ? sceneList.currentProgramSceneUuid
            : sceneList.currentProgramSceneName;
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

onMounted(() => {
  try {
    window.addEventListener('obsConnectFromSettings', obsSettingsConnect);
    window.addEventListener('obsSceneEvent', setObsSceneListener);
    obsWebSocket.on('ConnectionOpened', () => {
      obsConnectionState.value = 'connecting';
    });
    obsWebSocket.on('ConnectionClosed', obsCloseHandler);
    obsWebSocket.on('ConnectionError', obsErrorHandler);
    obsWebSocket.on(
      'CurrentProgramSceneChanged',
      (data: { sceneName: string; sceneUuid: string }) => {
        currentScene.value =
          configuredScenesAreAllUUIDs() && data.sceneUuid
            ? data.sceneUuid
            : data.sceneName;
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
  } catch (error) {
    errorCatcher(error);
  }
});

onUnmounted(() => {
  try {
    window.removeEventListener('obsConnectFromSettings', obsSettingsConnect);
    window.removeEventListener('obsSceneEvent', setObsSceneListener);
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
