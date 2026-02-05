import type OBSWebSocket from 'obs-websocket-js';
import type { ObsSceneType } from 'src/types';

export const obsWebSocketInfo = {
  obsWebSocket: undefined as OBSWebSocket | undefined,
};

let { obsWebSocket } = obsWebSocketInfo;

export const initObsWebSocket = async () => {
  if (!obsWebSocket) {
    const { default: OBSWebSocket } = await import('obs-websocket-js');
    obsWebSocket = new OBSWebSocket();
  }
};

export const sendObsSceneEvent = (scene: ObsSceneType) => {
  if (!scene) return;
  globalThis.dispatchEvent(
    new CustomEvent<{ scene: ObsSceneType }>('obsSceneEvent', {
      detail: { scene },
    }),
  );
};
