import type { JsonObject } from 'obs-websocket-js/node_modules/type-fest';

import { defineStore } from 'pinia';
import { configuredScenesAreAllUUIDs } from 'src/helpers/obs';
import { useCurrentStateStore } from 'src/stores/current-state';

export const useObsStateStore = defineStore('obs-state', {
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
      scenes: [] as JsonObject[],
    };
  },
});
