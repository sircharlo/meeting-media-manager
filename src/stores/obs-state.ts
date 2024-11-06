import type { JsonObject } from 'obs-websocket-js/node_modules/type-fest';

import { defineStore } from 'pinia';
import { configuredScenesAreAllUUIDs, isUUID } from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';

interface Store {
  currentScene: string;
  currentSceneType: 'camera' | 'media';
  obsConnectionState:
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'notConnected';
  obsMessage: string;
  previousScene: string;
  scenes: JsonObject[];
}

export const useObsStateStore = defineStore('obs-state', {
  actions: {
    sceneExists(sceneToCheck?: string) {
      if (!this.scenes || !sceneToCheck) return false;
      const matchScene = isUUID(sceneToCheck)
        ? (scene: JsonObject) => scene.sceneUuid === sceneToCheck
        : (scene: JsonObject) => scene.sceneName === sceneToCheck;
      return this.scenes.some(matchScene);
    },
  },
  getters: {
    additionalScenes: (state): string[] => {
      const currentState = useCurrentStateStore();
      const { currentSettings } = currentState;
      return state.scenes
        .filter(
          (scene) =>
            ![
              currentSettings?.obsCameraScene,
              currentSettings?.obsMediaScene,
              currentSettings?.obsImageScene,
            ]
              .filter((s): s is string => !!s)
              .includes(
                scene.sceneUuid?.toString() ||
                  scene.sceneName?.toString() ||
                  '',
              ),
        )
        .map((scene): string =>
          configuredScenesAreAllUUIDs() && scene.sceneUuid
            ? scene.sceneUuid.toString()
            : scene.sceneName?.toString() || '',
        )
        .filter(Boolean);
    },
  },
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
