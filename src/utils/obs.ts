import type OBSWebSocket from 'obs-websocket-js';
import type { ObsSceneType } from 'src/types';

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
