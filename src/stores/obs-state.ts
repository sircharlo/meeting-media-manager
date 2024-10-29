import type { JsonObject } from 'obs-websocket-js/node_modules/type-fest';

import { defineStore } from 'pinia';
import { configuredScenesAreAllUUIDs, isUUID } from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';

export const useObsStateStore = defineStore('obs-state', {
  actions: {
    sceneExists(sceneToCheck: string) {
      if (!this.scenes || !sceneToCheck) return false;
      const matchScene = isUUID(sceneToCheck)
        ? (scene: JsonObject) => scene.sceneUuid === sceneToCheck
        : (scene: JsonObject) => scene.sceneName === sceneToCheck;
      return this.scenes.some(matchScene);
    },
  },
  getters: {
    additionalScenes: (state) => {
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
              .filter(Boolean)
              .includes(
                (scene.sceneUuid as string) || (scene.sceneName as string),
              ),
        )
        .map(
          (scene) =>
            (configuredScenesAreAllUUIDs() && scene.sceneUuid
              ? scene.sceneUuid
              : scene.sceneName) as string,
        );
    },
  },
  state: () => {
    return {
      currentScene: '',
      currentSceneType: '' as 'camera' | 'media',
      obsConnectionState: 'notConnected',
      obsMessage: '',
      previousScene: '',
      scenes: [] as JsonObject[],
    };
  },
});
