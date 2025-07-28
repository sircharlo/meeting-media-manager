<template>
  <q-menu
    v-model="open"
    anchor="top middle"
    no-parent-event
    :offset="[0, 8]"
    self="bottom middle"
    transition-hide="jump-down"
    transition-show="jump-up"
  >
    <div
      :class="{
        column: true,
        'action-popup': true,
        'fit-snugly': sceneList.length > 28, // hacky for now
        'q-py-md': true,
      }"
    >
      <div class="card-title col-shrink full-width q-px-md q-mb-none">
        {{ t('scene-selection') }}
      </div>
      <div class="overflow-auto col full-width q-px-md">
        <div class="row q-col-gutter-xs">
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
                  {{
                    scene === currentSettings?.obsCameraScene
                      ? t('stage')
                      : scene === currentSettings?.obsMediaScene
                        ? t('media-only')
                        : scene === currentSettings?.obsImageScene
                          ? t('picture-in-picture')
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
      </div>
    </div>
  </q-menu>
</template>

<script setup lang="ts">
import type { ObsSceneType } from 'src/types';

import { useEventListener } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { obsConnect } from 'src/helpers/obs';
import { isUUID } from 'src/utils/general';
import { isImage } from 'src/utils/media';
import { obsWebSocket } from 'src/utils/obs';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const open = defineModel<boolean>({ default: false });

const currentState = useCurrentStateStore();
const {
  additionalScenes,
  configuredScenesAreAllUUIDs,
  currentSettings,
  mediaPlayingUrl,
} = storeToRefs(currentState);

const obsState = useObsStateStore();
const {
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

const resolvedScene = computed(() => {
  if (!currentSettings.value) return currentScene.value;
  return currentSettings.value.obsSwitchSceneAfterMedia
    ? currentSettings.value.obsRememberPreviouslyUsedScene
      ? previousScene.value
      : currentSettings.value.obsCameraScene
    : currentSettings.value.obsCameraScene;
});

const setObsScene = async (sceneType?: ObsSceneType, desiredScene?: string) => {
  try {
    if (!obsConnectionState.value?.startsWith('connect')) await obsConnect();
    if (obsConnectionState.value !== 'connected') return;
    let newProgramScene: string | undefined = desiredScene;
    if (!desiredScene && sceneType) {
      const mediaScene = currentSettings.value?.obsMediaScene || undefined;
      const imageScene = currentSettings.value?.obsImageScene || undefined;
      const cameraScene = currentSettings.value?.obsCameraScene || undefined;
      newProgramScene = mediaScene ?? undefined;
      if (isImage(mediaPlayingUrl.value) && imageScene) {
        newProgramScene = imageScene;
      }
      currentSceneType.value = sceneType;
      if (sceneType === 'camera') {
        newProgramScene = currentSettings.value?.obsRememberPreviouslyUsedScene
          ? previousScene.value || cameraScene
          : cameraScene;
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

      if (sceneExists(newProgramScene)) {
        obsWebSocket?.call('SetCurrentProgramScene', {
          ...(hasSceneUuid &&
            configuredScenesAreAllUUIDs.value && {
              sceneUuid: newProgramScene,
            }),
          ...((!hasSceneUuid || !configuredScenesAreAllUUIDs.value) && {
            sceneName: newProgramScene,
          }),
        });
        // open.value = false;
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

const getSceneIcon = (scene: null | string | undefined) => {
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
    sceneList.value.findIndex((s) => s === scene) + 1 - baseScenesLength.value;
  if (sceneIndex <= 10) {
    return `mmm-numeric-${sceneIndex}-box-outline`;
  }
  return 'play-box-outline';
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

useEventListener(window, 'obsConnectFromSettings', obsSettingsConnect, {
  passive: true,
});
useEventListener(window, 'obsSceneEvent', setObsSceneListener, {
  passive: true,
});
</script>
