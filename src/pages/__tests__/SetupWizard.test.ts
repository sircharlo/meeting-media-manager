import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { Platform } from 'quasar';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import SetupWizard from '../SetupWizard.vue';

// Its singleton needs an active Pinia as soon as it's imported (through
// the wizard's shortcut input), before the test installs one.
vi.mock('src/utils/dialog-plugin', () => ({
  closeAllDialogs: vi.fn(),
  getOpenDialogCount: () => 0,
  isAnyDialogOpen: () => false,
  openDialog: vi.fn(),
}));

// What getRendererPlatform reads.
const setPlatform = (windows: boolean) => {
  Platform.is.win = windows;
  Platform.is.mac = !windows;
};

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'wizard-cong';
// The wizard's Zoom question, reached after the congregation's details.
const ZOOM_STEP = 200;

let wrapper: undefined | VueWrapper;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const settings = () => {
  const found = useCongregationSettingsStore().congregations[CONGREGATION_ID];
  if (!found) throw new Error('No settings for the congregation');
  return found;
};

const goToStep = async (step: number) => {
  if (!wrapper) throw new Error('The wizard is not mounted');
  (wrapper.vm as unknown as { step: number }).step = step;
  await nextTick();
  await flushPromises();
};

const mountWizard = async ({ windows = true } = {}) => {
  setPlatform(windows);
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ component: SetupWizard, path: '/' }],
  });
  await router.push('/');
  wrapper = mount(SetupWizard, {
    attachTo: document.body,
    global: { plugins: [router] },
  });
  await goToStep(ZOOM_STEP);
};

const text = () => document.body.textContent ?? '';

const click = async (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).findLast(
    (el) => el.textContent?.trim() === label,
  );
  if (!button) throw new Error(`No button labelled "${label}"`);
  button.click();
  await flushPromises();
};

describe('SetupWizard, Zoom', () => {
  it('offers the Zoom Meeting Manager on Windows, with its setup assistant', async () => {
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');
    await mountWizard();

    expect(text()).toContain('take care of Zoom around each meeting');
    await click('Yes');

    expect(settings().zoomMeetingManagerEnable).toBe(true);
    expect(settings().zoomEnable).toBe(false);
    expect(text()).toContain('The Zoom setup assistant checks your Zoom');
    // No keyboard shortcut to enter, unlike the older integration.
    expect(text()).not.toContain('Zoom screen sharing shortcut');

    await click('Open setup assistant');
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'openZoomSetupAssistant' }),
    );

    // What the assistant saves once it has learned the camera button...
    settings().zoomVideoOnTitle = 'Stop Video';
    settings().zoomVideoOffTitle = 'Start Video';
    await flushPromises();
    expect(text()).not.toContain('The Zoom Meeting Manager is set up.');

    // ...and the microphone button.
    settings().zoomMicOnTitle = 'Mute';
    settings().zoomMicOffTitle = 'Unmute';
    await flushPromises();
    expect(text()).toContain('The Zoom Meeting Manager is set up.');
  });

  it('lets Zoom be set up later, and turns it off when the answer is no', async () => {
    await mountWizard();
    await click('Yes');
    await click('Set up later');
    expect(text()).toContain('M³ is now ready to be used');
    expect(settings().zoomMeetingManagerEnable).toBe(true);

    await goToStep(ZOOM_STEP);
    await click('No');
    expect(settings().zoomMeetingManagerEnable).toBe(false);
  });

  it('keeps the screen-sharing shortcut integration where the Manager is unavailable', async () => {
    await mountWizard({ windows: false });

    expect(text()).not.toContain('take care of Zoom around each meeting');
    await click('Yes');

    expect(settings().zoomEnable).toBe(true);
    expect(settings().zoomMeetingManagerEnable).toBe(false);
    expect(text()).toContain('Zoom screen sharing shortcut');
  });
});

describe('SetupWizard, OBS Studio', () => {
  // The wizard's "does the Kingdom Hall use OBS Studio?" question.
  const OBS_STEP = 103;

  it('turns Zoom media sharing off once OBS Studio gets a media scene', async () => {
    await mountWizard();
    Object.assign(settings(), {
      zoomMeetingManagerAutomateMediaSharing: true,
      zoomMeetingManagerEnable: true,
    });
    await goToStep(OBS_STEP);
    await click('Yes'); // uses OBS Studio

    expect(text()).toContain(
      "If you choose a media scene for OBS Studio, OBS Studio will show the media in Zoom instead, and Zoom's media sharing will be turned off.",
    );
    await click('Yes'); // integrate M³ with it
    expect(settings().obsEnable).toBe(true);
    // Integrating alone doesn't show media in Zoom yet
    expect(settings().zoomMeetingManagerAutomateMediaSharing).toBe(true);

    settings().obsMediaScene = 'Media'; // as picked on the scenes step
    await flushPromises();

    expect(settings().zoomMeetingManagerAutomateMediaSharing).toBe(false);
    // The Meeting Manager's other automations still work with OBS Studio
    expect(settings().zoomMeetingManagerEnable).toBe(true);
  });

  it("doesn't mention Zoom when it isn't sharing the media", async () => {
    await mountWizard();
    await goToStep(OBS_STEP);
    await click('Yes');

    expect(text()).not.toContain("Zoom's media sharing will be turned off");
  });
});

describe('SetupWizard, shared folder', () => {
  const SHARED_FOLDER_STEP = 11;
  const SHARED_FOLDER = 'C:/Users/me/Dropbox/Meeting media';

  const goToSharedFolderQuestion = async () => {
    await mountWizard();
    (wrapper?.vm as unknown as { regularProfile: boolean }).regularProfile =
      true;
    await goToStep(SHARED_FOLDER_STEP);
  };

  it('goes straight to the end of the setup when no shared folder is used', async () => {
    await goToSharedFolderQuestion();
    expect(text()).toContain('Do you keep files for meetings in an app');

    await click('No');
    expect(settings().enableFolderWatcher).toBe(false);
    expect(text()).toContain("We'll start fetching media");

    await click('Back');
    expect(text()).toContain('Do you keep files for meetings in an app');
  });

  it('asks for the folder, then explains how it works', async () => {
    vi.spyOn(globalThis.electronApi, 'openFolderDialog').mockResolvedValue({
      canceled: false,
      filePaths: [SHARED_FOLDER],
    });
    // Tomorrow's weekday, numbered from Monday like the meeting day settings.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');

    await goToSharedFolderQuestion();
    settings().mwDay = `${(tomorrow.getDay() + 6) % 7}`;
    await click('Yes');
    expect(settings().enableFolderWatcher).toBe(true);

    const continueButton = () =>
      Array.from(document.querySelectorAll('button')).findLast(
        (el) => el.textContent?.trim() === 'Continue',
      );
    expect(continueButton()?.disabled).toBe(true);

    document
      .querySelector<HTMLElement>('.q-stepper__step-content .q-field')
      ?.click();
    await flushPromises();
    expect(settings().folderToWatch).toBe(SHARED_FOLDER);
    expect(continueButton()?.disabled).toBe(false);

    await click('Continue');
    expect(text()).toContain('How the shared folder works');
    expect(text()).toContain('Meeting media');
    expect(text()).toContain(
      `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`,
    );
    // Past folders are deleted by default, as they always were.
    expect(settings().deletePastWatchedFolders).toBe(true);

    await click('Continue');
    expect(text()).toContain("We'll start fetching media");

    await click('Back');
    expect(text()).toContain('How the shared folder works');
  });
});
