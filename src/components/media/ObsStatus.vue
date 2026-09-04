<template>
  <q-btn
    v-if="currentSettings?.obsEnable"
    class="super-rounded"
    :color="
      obsPopup
        ? 'white'
        : obsStatusVariant === 'connected'
          ? 'white-transparent'
          : obsStatusVariant === 'disconnected'
            ? 'negative'
            : 'warning'
    "
    :disable="obsConnectionState === 'connecting'"
    rounded
    :text-color="
      obsPopup
        ? obsStatusVariant === 'connected'
          ? 'primary'
          : obsStatusVariant === 'disconnected'
            ? 'negative'
            : 'warning'
        : ''
    "
    unelevated
    @click="onClick"
    @mouseenter="
      currentSettings?.obsQuickToggle && obsConnectionState === 'connected'
        ? (obsPopup = true)
        : undefined
    "
  >
    <q-spinner v-if="obsConnectionState === 'connecting'" size="sm" />
    <template v-else>
      <q-icon name="mmm-obs-studio" />
      <q-tooltip v-if="!obsPopup" :delay="1000" :offset="[14, 22]">
        {{ t(tooltipMessageKey) }}
      </q-tooltip>
    </template>
  </q-btn>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { obsConnect } from 'src/helpers/obs';
import { log } from 'src/shared/vanilla';
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
// still identified and usable for recording/scene switching), so they get
// their own warning state instead of overriding obsConnectionState.
const obsStatusVariant = computed(() => {
  if (obsConnectionState.value === 'disconnected') return 'disconnected';
  if (obsConnectionState.value === 'connected')
    return obsSceneListError.value ? 'warning' : 'connected';
  return 'warning';
});

const tooltipMessageKey = computed(() =>
  obsConnectionState.value === 'connected' && obsSceneListError.value
    ? 'obs.scene-list-error'
    : (obsMessage.value ?? 'scene-selection'),
);

const onClick = () => {
  if (obsConnectionState.value === 'connected') {
    obsPopup.value = !obsPopup.value;
  } else if (obsConnectionState.value !== 'connecting') {
    obsConnect();
  }
};

const fetchSceneList = async (retryInterval = 2000, maxRetries = 5) => {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      const sceneList =
        await obsWebSocketInfo.obsWebSocket?.call('GetSceneList');
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
    } catch (error) {
      attempts++;
      const { OBSWebSocketError } = await import('obs-websocket-js');
      // Both mean OBS isn't ready to answer yet, not a real failure: "OBS
      // is not ready" during the handshake, or "Not connected" when the
      // socket drops between the 'Identified' event firing and this call
      // going out.
      const isTransient =
        (error instanceof OBSWebSocketError &&
          error.message.includes('OBS is not ready')) ||
        (error instanceof Error && error.message === 'Not connected');
      if (attempts < maxRetries && isTransient) {
        log(`Retrying... (${attempts}/${maxRetries})`, 'obs', 'log');
        await new Promise((resolve) => {
          setTimeout(resolve, retryInterval);
        });
      } else {
        obsSceneListError.value = true;
        errorCatcher(error);
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
      fetchSceneList();
    });
    obsWebSocketInfo.obsWebSocket.on('SceneListChanged', (data) => {
      scenes.value = data.scenes.reverse();
    });
    obsConnect();
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
  initObsListeners();
});

watch(
  () => currentSettings.value?.obsEnable,
  (val) => {
    if (val) {
      initObsListeners();
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
    obsConnect();
  }
});

onUnmounted(() => {
  removeObsListeners();
});
</script>
