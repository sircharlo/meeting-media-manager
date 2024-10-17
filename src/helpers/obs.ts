import { storeToRefs } from 'pinia';
import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'src/stores/current-state';

const sendObsSceneEvent = (scene: string) => {
  if (!scene) return;
  window.dispatchEvent(
    new CustomEvent('obsSceneEvent', {
      detail: {
        scene,
      },
    }),
  );
};

const isUUID = (uuid: string) => {
  try {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

const configuredScenesAreAllUUIDs = () => {
  try {
    const currentState = useCurrentStateStore();
    const { currentSettings } = storeToRefs(currentState);
    const configuredScenes = [
      currentSettings?.value?.obsCameraScene,
      currentSettings?.value?.obsImageScene,
      currentSettings?.value?.obsMediaScene,
    ].filter(Boolean);
    if (!configuredScenes.length) return true;
    return configuredScenes.every((scene) => isUUID(scene));
  } catch (error) {
    errorCatcher(error);
    return false;
  }
};

export { configuredScenesAreAllUUIDs, isUUID, sendObsSceneEvent };
