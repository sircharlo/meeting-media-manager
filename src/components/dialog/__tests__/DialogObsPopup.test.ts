import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useObsStateStore } from 'stores/obs-state';
import { afterEach, describe, expect, it } from 'vitest';

import DialogObsPopup from '../DialogObsPopup.vue';

installQuasarPlugin();
installPinia();

afterEach(() => {
  document.body.innerHTML = '';
});

const CONGREGATION_ID = 'test-cong';

// Only the scene-highlighting logic under test reads these settings; the
// rest of the object just needs to satisfy SettingsValues.
const setupObsSettings = (overrides: Partial<typeof defaultSettings> = {}) => {
  const congregationSettingsStore = useCongregationSettingsStore();
  congregationSettingsStore.congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      obsCameraScene: 'Camera',
      obsEnable: true,
      obsImageScene: null,
      obsMediaScene: 'Media',
      obsSwitchSceneAfterMedia: false,
      ...overrides,
    },
  };

  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;

  return useObsStateStore();
};

/** Finds the scene q-btn whose label matches `text` and reports whether it's
 * rendered as the active (filled, non-outline) button. QMenu teleports its
 * content straight to document.body, outside the mounted wrapper's tree, so
 * this queries the DOM directly rather than going through `wrapper.find`. */
const isActiveSceneButton = (text: string) => {
  // The button's icon is rendered as an <i> sibling whose own text content
  // is the (non-visible) icon ligature name, so matching on the button's
  // full textContent would also have to account for that. The scene label
  // itself always lives in its own `.ellipsis` div, so match on that instead.
  const label = Array.from(document.querySelectorAll('button .ellipsis')).find(
    (el) => el.textContent?.trim() === text,
  );
  const button = label?.closest('button');
  if (!button) throw new Error(`No scene button found with text "${text}"`);
  return !button.classList.contains('q-btn--outline');
};

describe('DialogObsPopup - active scene highlighting', () => {
  it('follows the live OBS scene when "switch scene after media" is off', async () => {
    const obsState = setupObsSettings({ obsSwitchSceneAfterMedia: false });
    // Simulate OBS having switched to the media scene (e.g. because the
    // user clicked the "Media only" button, which changes OBS's actual
    // program scene via the websocket).
    obsState.currentScene = 'Media';

    mount(DialogObsPopup, {
      props: { modelValue: true },
    });
    await Promise.resolve();

    expect(isActiveSceneButton('Media only')).toBe(true);
    expect(isActiveSceneButton('Stage')).toBe(false);
  });

  it('moves the highlight back to Stage once OBS reports the camera scene again', async () => {
    const obsState = setupObsSettings({ obsSwitchSceneAfterMedia: false });
    obsState.currentScene = 'Camera';

    mount(DialogObsPopup, {
      props: { modelValue: true },
    });
    await Promise.resolve();

    expect(isActiveSceneButton('Stage')).toBe(true);
    expect(isActiveSceneButton('Media only')).toBe(false);
  });
});
