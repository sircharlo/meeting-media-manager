import type { OBSWebSocket, OBSWebSocketError } from 'obs-websocket-js';
import type { ObsSceneType } from 'src/types';

import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';
import { useObsStateStore } from 'src/stores/obs-state';
import { isUUID } from 'src/utils/general';

import { portNumberValidator } from './settings';

export let obsWebSocket: OBSWebSocket | undefined;

export const initObsWebSocket = async () => {
  if (!obsWebSocket) {
    const { default: OBSWebSocket } = await import('obs-websocket-js');
    obsWebSocket = new OBSWebSocket();
  }
};

export const sendObsSceneEvent = (scene: ObsSceneType) => {
  if (!scene) return;
  window.dispatchEvent(
    new CustomEvent<{ scene: ObsSceneType }>('obsSceneEvent', {
      detail: { scene },
    }),
  );
};

export const configuredScenesAreAllUUIDs = () => {
  try {
    const currentState = useCurrentStateStore();
    const configuredScenes = [
      currentState.currentSettings?.obsCameraScene,
      currentState.currentSettings?.obsImageScene,
      currentState.currentSettings?.obsMediaScene,
    ].filter((s): s is string => !!s);
    if (!configuredScenes.length) return true;
    return configuredScenes.every((scene) => isUUID(scene));
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export const obsErrorHandler = (err: OBSWebSocketError) => {
  const obsState = useObsStateStore();
  obsState.obsMessage = 'obs.error';
  if (err?.code && ![-1, 1001, 1006, 4009].includes(err.code))
    errorCatcher(err);
};

export const obsCloseHandler = () => {
  const obsState = useObsStateStore();
  obsState.obsConnectionState = 'disconnected';
  obsState.obsMessage = 'obs.disconnected';
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const obsConnect = async (setup?: boolean) => {
  const currentState = useCurrentStateStore();
  const obsState = useObsStateStore();
  try {
    if (!currentState.currentSettings?.obsEnable) {
      await obsWebSocket?.disconnect();
      return;
    }

    const obsPort = currentState.currentSettings?.obsPort || '';
    if (!portNumberValidator(obsPort)) return;

    const obsPassword = currentState.currentSettings?.obsPassword || '';
    if (obsPassword?.length === 0) return;

    obsState.obsConnectionState = 'connecting';
    obsState.obsMessage = 'obs.connecting';

    let attempt = 0;
    const maxAttempts = setup ? 1 : 12;
    const timeBetweenAttempts = 5000;
    while (
      attempt < maxAttempts &&
      // @ts-expect-error connecting and connected have no overlap
      obsState.obsConnectionState !== 'connected'
    ) {
      try {
        await initObsWebSocket();
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
        const { OBSWebSocketError } = await import('obs-websocket-js');
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
