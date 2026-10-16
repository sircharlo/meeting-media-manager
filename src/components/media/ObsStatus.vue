<template>
  <q-btn
    v-if="currentSettings?.obsEnable"
    class="super-rounded"
    :class="classes"
    :color="color"
    rounded
    :text-color="textColor"
    unelevated
    @click="onClick"
    @mouseenter="
      currentSettings?.obsQuickToggle && obsConnectionState === 'connected'
        ? (obsPopup = true)
        : undefined
    "
  >
    <q-spinner v-if="busy" size="sm" />
    <q-icon v-else name="mmm-obs-studio" />
    <q-tooltip v-if="!obsPopup" :delay="1000" :offset="[14, 22]">
      {{ t(tooltipMessageKey) }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  type IslandButtonStatus,
  useIslandButton,
} from 'src/composables/useIslandButton';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { isTransientObsError, obsConnect } from 'src/helpers/obs';
import { log } from 'src/shared/vanilla';
import { sleep } from 'src/utils/general';
import { initObsWebSocket, obsWebSocketInfo } from 'src/utils/obs';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const currentState = useCurrentStateStore();
const { configuredScenesAreAllUUIDs, currentSettings } =
  storeToRefs(currentState);

const obsState = useObsStateStore();
const {
  currentScene,
  obsConnectionState,
  obsMessage,
  obsSceneListError,
  previousScene,
  scenes,
} = storeToRefs(obsState);
const { obsCloseHandler, obsErrorHandler, sceneExists } = obsState;

const obsPopup = defineModel<boolean>({ required: true });

// Scene list fetch failures don't mean the socket is disconnected (it's
// still identified and usable for recording/scene switching), so they only
// call for attention instead of overriding obsConnectionState.
const status = computed<IslandButtonStatus>(() => {
  if (obsConnectionState.value === 'disconnected') return 'error';
  if (obsConnectionState.value === 'connecting') return 'busy';
  if (obsConnectionState.value === 'connected' && !obsSceneListError.value) {
    return 'normal';
  }
  return 'attention';
});

const { busy, classes, color, textColor } = useIslandButton(status, obsPopup);

const tooltipMessageKey = computed(() =>
  obsConnectionState.value === 'connected' && obsSceneListError.value
    ? 'obs.scene-list-error'
    : (obsMessage.value ?? 'scene-selection'),
);

const onClick = () => {
  if (obsConnectionState.value === 'connected') {
    obsPopup.value = !obsPopup.value;
  } else if (obsConnectionState.value !== 'connecting') {
    void obsConnect();
  }
};

const fetchSceneList = async (retryInterval = 2000, maxRetries = 5) => {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const sceneList =
        await obsWebSocketInfo.obsWebSocket?.call('GetSceneList'); // NOSONAR: sequential - retry loop
      if (sceneList) {
        obsSceneListError.value = false;
        scenes.value = sceneList.scenes.reverse();
        const current =
          configuredScenesAreAllUUIDs.value && sceneList.currentProgramSceneUuid
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
      // No socket or an empty reply: there is nothing to retry, and going
      // round again without awaiting anything would spin the renderer.
      obsSceneListError.value = true;
      return;
    } catch (error) {
      attempts++;
      const isTransient = isTransientObsError(error);
      if (attempts < maxRetries && isTransient) {
        log(`Retrying... (${attempts}/${maxRetries})`, 'obs', 'log');
        await sleep(retryInterval); // NOSONAR: sequential - retry loop
      } else {
        obsSceneListError.value = true;
        // OBS still loading after every retry (big scene collections or
        // plugins can take longer), or the socket closing mid-way (the
        // reconnect flow fetches the list again): the scene-list warning
        // state above already tells the user, and neither is a bug
        // (MMM-V2-3FG).
        if (isTransient) {
          log('Could not fetch the OBS scene list yet', 'obs', 'warn', error);
        } else {
          errorCatcher(error, { contexts: { fn: { name: 'fetchSceneList' } } });
        }
      }
    }
  }
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

const initObsListeners = async () => {
  try {
    if (!currentSettings.value?.obsEnable) return;
    await initObsWebSocket();
    if (!obsWebSocketInfo.obsWebSocket) return;
    removeObsListeners();

    obsWebSocketInfo.obsWebSocket.on('ConnectionOpened', () => {
      obsConnectionState.value = 'connecting';
    });
    obsWebSocketInfo.obsWebSocket.on('ConnectionClosed', obsCloseHandler);
    obsWebSocketInfo.obsWebSocket.on('ConnectionError', obsErrorHandler);
    obsWebSocketInfo.obsWebSocket.on(
      'CurrentProgramSceneChanged',
      (data: { sceneName: string; sceneUuid: string }) => {
        const newScene =
          configuredScenesAreAllUUIDs.value && data.sceneUuid
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
    obsWebSocketInfo.obsWebSocket.on('Identified', async () => {
      obsConnectionState.value = 'connected';
      obsMessage.value = 'obs.connected';
      void fetchSceneList();
    });
    obsWebSocketInfo.obsWebSocket.on('SceneListChanged', (data) => {
      scenes.value = data.scenes.reverse();
    });
    void obsConnect();
  } catch (error) {
    errorCatcher(error);
  }
};

const removeObsListeners = () => {
  const events = [
    'ConnectionClosed',
    'ConnectionError',
    'ConnectionOpened',
    'CurrentProgramSceneChanged',
    'Identified',
    'SceneListChanged',
  ] as const;
  try {
    if (!obsWebSocketInfo.obsWebSocket) return;
    events.forEach((event) => {
      obsWebSocketInfo.obsWebSocket?.removeAllListeners(event);
    });
  } catch (error) {
    errorCatcher(error);
  }
};

onMounted(() => {
  void initObsListeners();
});

watch(
  () => currentSettings.value?.obsEnable,
  (val) => {
    if (val) {
      void initObsListeners();
    } else {
      removeObsListeners();
    }
  },
);

// FE-6 (full-audit-2026-09-04.md): obsCloseHandler only flipped the state to
// 'disconnected' - if OBS closed/crashed/restarted while M³ was running,
// nothing ever attempted to reconnect again on its own. obsConnect() already
// retries with backoff internally (and is a no-op while disabled, invalid,
// or already connecting/connected), so a single call here is enough; it's
// gated on obsEnable so a deliberate disable (which removes listeners before
// this could ever see a close) can't retrigger it.
watch(obsConnectionState, (newState) => {
  if (newState === 'disconnected' && currentSettings.value?.obsEnable) {
    void obsConnect();
  }
});

onUnmounted(() => {
  removeObsListeners();
});
</script>
