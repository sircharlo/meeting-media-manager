import type { ObsSceneType } from 'src/types';

import OBSWebSocket from 'obs-websocket-js';

export let obsWebSocket: OBSWebSocket | undefined;

export const initObsWebSocket = async () => {
  if (!obsWebSocket) {
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
