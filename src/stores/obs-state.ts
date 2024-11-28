import type { JsonObject } from 'obs-websocket-js/node_modules/type-fest';
import type { ObsConnectionState, ObsSceneType } from 'src/types';

import { defineStore } from 'pinia';
import { useCurrentStateStore } from 'src/stores/current-state';
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
      const configuredScenes = [
        currentSettings?.obsCameraScene,
        currentSettings?.obsMediaScene,
        currentSettings?.obsImageScene,
      ].filter((s): s is string => !!s);

      const scenesAreUUIDS = configuredScenes.every(isUUID);
      return state.scenes
        .filter(
          (scene) =>
            !configuredScenes.includes(
              (scenesAreUUIDS && scene.sceneUuid
                ? scene.sceneUuid.toString()
                : scene.sceneName?.toString()) || '',
            ),
        )
        .map(
          (scene): string =>
            (scenesAreUUIDS && scene.sceneUuid
              ? scene.sceneUuid.toString()
              : scene.sceneName?.toString()) || '',
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
