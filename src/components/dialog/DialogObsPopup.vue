<template>
  <q-menu
    v-model="open"
    anchor="top middle"
    class="custom-scroll"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <q-card flat style="min-width: 50vw">
      <q-card-section>
        <div class="card-title">
          {{ $t('scene-selection') }}
        </div>
        <!-- <div>
          <p class="card-section-title text-dark-grey">
            {{ $t('main-scenes') }}
          </p>
        </div> -->
        <div class="row items-center q-col-gutter-sm">
          <template v-for="scene in sceneList" :key="scene">
            <div
              :class="
                'col-' +
                (sceneList.length === 2
                  ? 6
                  : sceneList.length === 3
                    ? 4
                    : sceneList.length >= 4
                      ? 3
                      : 12)
              "
            >
              <q-btn
                class="full-width"
                :color="sceneExists(scene) ? 'primary' : 'negative'"
                :icon="
                  scene === currentSettings?.obsCameraScene
                    ? 'mmm-stage-scene'
                    : scene === currentSettings?.obsMediaScene
                      ? 'mmm-media-scene'
                      : scene === currentSettings?.obsImageScene
                        ? 'mmm-pip-scene'
                        : sceneList.findIndex((s) => s === scene) +
                              1 -
                              baseScenesLength <=
                            10
                          ? 'mmm-numeric-' +
                            (sceneList.findIndex((s) => s === scene) +
                              1 -
                              baseScenesLength) +
                            '-box-outline'
                          : 'play-box-outline'
                "
                :outline="
                  scene !==
                  (currentSettings?.obsSwitchSceneAfterMedia
                    ? previousScene
                    : currentScene)
                "
                size="sm"
                stack
                unelevated
                @click="setObsScene(undefined, scene)"
              >
                <div class="ellipsis full-width">
                  {{
                    scene === currentSettings?.obsCameraScene
                      ? $t('stage')
                      : scene === currentSettings?.obsMediaScene
                        ? $t('media-only')
                        : scene === currentSettings?.obsImageScene
                          ? $t('picture-in-picture')
                          : isUUID(scene)
                            ? scenes.find((s) => s.sceneUuid === scene)
                                ?.sceneName
                            : scene
                  }}
                </div>
              </q-btn>
            </div>
          </template>
        </div>
        <!-- <template v-if="additionalScenes.length > 0">
          <q-separator class="bg-accent-200 q-my-md" />
          <div>
            <p class="card-section-title text-dark-grey">
              {{ $t('additional-scenes') }}
            </p>
          </div>
          <div class="row items-center q-col-gutter-sm q-mb-md">
            <template v-for="scene in additionalScenes" :key="scene">
              <div
                :class="
                  additionalScenes.length === 1
                    ? 'col-12'
                    : additionalScenes.length === 2
                      ? 'col-6'
                      : 'col-4'
                "
              >
                <q-btn
                  :outline="scene !== currentScene"
                  class="full-width"
                  color="primary"
                  unelevated
                  @click="setObsScene(undefined, scene)"
                >
                  <div class="ellipsis">
                    {{
                      isUUID(scene)
                        ? scenes.find((s) => s.sceneUuid === scene)?.sceneName
                        : scene
                    }}
                  </div>
                </q-btn>
              </div>
            </template>
          </div>
        </template> -->
      </q-card-section>
    </q-card>
  </q-menu>
</template>

<script setup lang="ts">
import type { ObsSceneType } from 'src/types';

import { useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { obsWebSocket } from 'src/boot/globals';
import { errorCatcher } from 'src/helpers/error-catcher';
import { isImage } from 'src/helpers/mediaPlayback';
import { createTemporaryNotification } from 'src/helpers/notifications';
import {
  configuredScenesAreAllUUIDs,
  isUUID,
  obsConnect,
} from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useObsStateStore } from 'src/stores/obs-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const { currentSettings, mediaPlayingUrl } = storeToRefs(currentState);

const obsState = useObsStateStore();
const {
  additionalScenes,
  currentScene,
  currentSceneType,
  obsConnectionState,
  previousScene,
  scenes,
} = storeToRefs(obsState);
const { sceneExists } = obsState;
const obsSettingsConnect = () => obsConnect(true);

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

const setObsScene = async (sceneType?: ObsSceneType, desiredScene?: string) => {
  try {
    if (!obsConnectionState.value?.startsWith('connect')) await obsConnect();
    if (obsConnectionState.value !== 'connected') return;
    let newProgramScene: string | undefined = desiredScene;
    if (!desiredScene && sceneType) {
      const mediaScene = currentSettings.value?.obsMediaScene;
      const imageScene = currentSettings.value?.obsImageScene;
      const cameraScene = currentSettings.value?.obsCameraScene;
      newProgramScene = mediaScene ?? undefined;
      if (isImage(mediaPlayingUrl.value) && imageScene) {
        newProgramScene = imageScene;
      }
      currentSceneType.value = sceneType;
      if (sceneType === 'camera') {
        newProgramScene = previousScene.value || cameraScene || undefined;
      }
    } else if (
      desiredScene &&
      currentSceneType.value === 'media' &&
      currentSettings.value?.obsSwitchSceneAfterMedia
    ) {
      previousScene.value = desiredScene;
      newProgramScene = undefined;
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
        open.value = false;
      } else {
        notifySceneNotFound();
      }
    }
  } catch (error) {
    errorCatcher(error);
  }
};

const setObsSceneListener = (event: CustomEvent<{ scene: ObsSceneType }>) => {
  try {
    setObsScene(event.detail.scene);
  } catch (error) {
    errorCatcher(error);
  }
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

useEventListener(window, 'obsConnectFromSettings', obsSettingsConnect);
useEventListener(window, 'obsSceneEvent', setObsSceneListener);
</script>
