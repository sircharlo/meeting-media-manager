import type OBSWebSocket from 'obs-websocket-js';
import type { ObsSceneType } from 'src/types';

export const obsWebSocketInfo = {
  obsWebSocket: undefined as OBSWebSocket | undefined,
};

export const initObsWebSocket = async () => {
  if (!obsWebSocketInfo.obsWebSocket) {
    const { default: OBSWebSocket } = await import('obs-websocket-js');
    obsWebSocketInfo.obsWebSocket = new OBSWebSocket();
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
