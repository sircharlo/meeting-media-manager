import { OBSWebSocketError } from 'obs-websocket-js';
import { storeToRefs } from 'pinia';
import { obsWebSocket } from 'src/boot/globals';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useObsStateStore } from 'src/stores/obs-state';

import { portNumberValidator } from './settings';

const sendObsSceneEvent = (scene: string) => {
  if (!scene) return;
  window.dispatchEvent(
    new CustomEvent('obsSceneEvent', {
      detail: {
        scene,
      },
    }),
  );
};

const isUUID = (uuid?: string) => {
  if (!uuid) return false;
  try {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const configuredScenesAreAllUUIDs = () => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    const configuredScenes = [
      currentSettings.value?.obsCameraScene,
      currentSettings.value?.obsImageScene,
      currentSettings.value?.obsMediaScene,
    ].filter((s): s is string => !!s);
    if (!configuredScenes.length) return true;
    return configuredScenes.every((scene) => isUUID(scene));
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const obsErrorHandler = (err: OBSWebSocketError) => {
  const obsState = useObsStateStore();
  const { obsMessage } = storeToRefs(obsState);
  obsMessage.value = 'obs.error';
  if (err?.code && ![-1, 1001, 1006, 4009].includes(err.code))
    errorCatcher(err);
};

const obsCloseHandler = () => {
  const obsState = useObsStateStore();
  const { obsConnectionState, obsMessage } = storeToRefs(obsState);
  obsConnectionState.value = 'disconnected';
  obsMessage.value = 'obs.disconnected';
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const obsConnect = async (setup?: boolean) => {
  const currentState = useCurrentStateStore();
  const { currentSettings } = storeToRefs(currentState);
  const obsState = useObsStateStore();
  const { obsConnectionState, obsMessage } = storeToRefs(obsState);
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
        if (err instanceof OBSWebSocketError) obsErrorHandler(err);
        else errorCatcher(err);
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

export {
  configuredScenesAreAllUUIDs,
  isUUID,
  obsCloseHandler,
  obsConnect,
  obsErrorHandler,
  sendObsSceneEvent,
};
