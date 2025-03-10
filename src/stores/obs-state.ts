import type { JsonObject } from 'app/node_modules/obs-websocket-js/node_modules/type-fest';
import type { OBSWebSocketError } from 'obs-websocket-js';
import type { ObsConnectionState, ObsSceneType } from 'src/types';

import { defineStore } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { isUUID } from 'src/utils/general';

interface Store {
  currentScene: string;
  currentSceneType: ObsSceneType;
  obsConnectionState: ObsConnectionState;
  obsMessage: string;
  previousScene: string;
  scenes: JsonObject[];
}

export const useObsStateStore = defineStore('obs-state', {
  actions: {
    obsCloseHandler() {
      this.obsConnectionState = 'disconnected';
      this.obsMessage = 'obs.disconnected';
    },
    obsErrorHandler(err: OBSWebSocketError) {
      this.obsMessage = 'obs.error';
      if (err?.code && ![-1, 1001, 1006, 4009].includes(err.code))
        errorCatcher(err);
    },
    sceneExists(sceneToCheck?: string) {
      if (!this.scenes || !sceneToCheck) return false;
      const matchScene = isUUID(sceneToCheck)
        ? (scene: JsonObject) => scene.sceneUuid === sceneToCheck
        : (scene: JsonObject) => scene.sceneName === sceneToCheck;
      return this.scenes.some(matchScene);
    },
  },
  getters: {},
  state: (): Store => {
    return {
      currentScene: '',
      currentSceneType: 'camera',
      obsConnectionState: 'notConnected',
      obsMessage: '',
      previousScene: '',
      scenes: [],
    };
  },
});
