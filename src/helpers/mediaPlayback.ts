import { errorCatcher } from 'src/helpers/error-catcher';
import { useCurrentStateStore } from 'stores/current-state';

const { toggleMediaWindow } = globalThis.electronApi;

export const toggleMediaWindowVisibility = (state?: boolean) => {
  try {
    const currentState = useCurrentStateStore();

    // Use provided state, or toggle current state if not provided
    const newState = state ?? !currentState.mediaWindowVisible;

    currentState.mediaWindowVisible = newState;

    toggleMediaWindow(
      newState,
      currentState.currentSettings?.enableMediaWindowFadeTransitions,
    );
  } catch (error) {
    errorCatcher(error, {
      contexts: {
        fn: {
          args: {
            state,
          },
          name: 'toggleMediaWindowVisibility',
        },
      },
    });
  }
};
