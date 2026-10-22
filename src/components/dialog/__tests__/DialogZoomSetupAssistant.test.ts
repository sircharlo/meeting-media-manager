import type { ZoomSelfTestStep } from 'src/helpers/zoom-self-test';
import type { ZoomDiagnosis } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogZoomSetupAssistant from '../DialogZoomSetupAssistant.vue';

const zoom = vi.hoisted(() => ({
  diagnoseZoom: vi.fn(),
  getZoomMeetingState: vi.fn(),
  getZoomPanelEntries: vi.fn(),
  getZoomShareEntries: vi.fn(),
  getZoomShareToolbarEntries: vi.fn(),
  joinZoomAudioForSetup: vi.fn(),
  learnZoomHandRaisedPhrase: vi.fn(),
  learnZoomMicTitles: vi.fn(),
  learnZoomVideoTitles: vi.fn(),
  runZoomSelfTest: vi.fn(),
  testZoomShareEntry: vi.fn(),
  tryZoomMuteAllEntry: vi.fn(),
  tryZoomParticipantsEntry: vi.fn(),
  tryZoomStopShareEntry: vi.fn(),
}));

vi.mock('src/helpers/zoom', () => ({
  diagnoseZoom: zoom.diagnoseZoom,
  getZoomMeetingState: zoom.getZoomMeetingState,
  getZoomPanelEntries: zoom.getZoomPanelEntries,
  getZoomShareEntries: zoom.getZoomShareEntries,
  getZoomShareToolbarEntries: zoom.getZoomShareToolbarEntries,
  getZoomTitlesFromSettings: () => ({
    micOffTitle: 'Unmute',
    micOnTitle: 'Mute',
    shareButtonTitle: null,
    videoOffTitle: 'Start Video',
    videoOnTitle: 'Stop Video',
  }),
  isZoomReactButtonMissing: (result: { error?: string }) =>
    result.error === 'react-button-not-found',
  joinZoomAudioForSetup: zoom.joinZoomAudioForSetup,
  learnZoomHandRaisedPhrase: zoom.learnZoomHandRaisedPhrase,
  learnZoomMicTitles: zoom.learnZoomMicTitles,
  learnZoomVideoTitles: zoom.learnZoomVideoTitles,
  prepareMediaWindowForZoomTest: async () => () => undefined,
  rememberZoomVersion: vi.fn(),
  testZoomShareEntry: zoom.testZoomShareEntry,
  tryZoomMuteAllEntry: zoom.tryZoomMuteAllEntry,
  tryZoomParticipantsEntry: zoom.tryZoomParticipantsEntry,
  tryZoomStopShareEntry: zoom.tryZoomStopShareEntry,
  withoutZoomFeedback: (run: () => unknown) => run(),
}));

vi.mock('src/helpers/zoom-self-test', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  runZoomSelfTest: zoom.runZoomSelfTest,
}));

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: vi.fn(),
}));

const startupCheck = vi.hoisted(() => ({
  dismissFailedZoomCheckNotice: vi.fn(),
}));
vi.mock('src/helpers/zoom-startup-check', () => startupCheck);

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'test-cong';
const ALL_GOOD: ZoomDiagnosis = {
  hostControls: true,
  meeting: true,
  participantsPanel: true,
  toolbar: true,
  videoButton: true,
};

let wrapper: undefined | VueWrapper;

const settings = () => {
  const current = useCurrentStateStore().currentSettings;
  if (!current) throw new Error('No congregation settings');
  return current;
};

const mountAssistant = async (
  overrides: Partial<typeof defaultSettings> = {},
) => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, ...overrides },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  wrapper = mount(DialogZoomSetupAssistant, { props: { modelValue: true } });
  await flushPromises();
};

const text = () => document.body.textContent ?? '';

// QDialog teleports its content to document.body. A button's text also
// includes its icon's ligature name, so match its label span first.
const button = (label: string) => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const found =
    buttons.find((el) =>
      Array.from(el.querySelectorAll('.block')).some(
        (span) => span.textContent?.trim() === label,
      ),
    ) ?? buttons.find((el) => el.textContent?.includes(label));
  if (!found) throw new Error(`No button labeled "${label}"`);
  return found;
};

const isDisabled = (el: HTMLButtonElement) =>
  el.disabled || el.classList.contains('disabled');

const click = async (label: string) => {
  button(label).click();
  await flushPromises();
};

const typeMeetingId = async (value: string) => {
  const input = document.querySelector('input') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await flushPromises();
};

/** Goes through the first three steps with everything working. */
const reachVideoStep = async () => {
  await click('Continue'); // welcome
  await typeMeetingId('987 654 3210');
  await vi.waitFor(() =>
    expect(text()).toContain('Connected to your Zoom meeting'),
  );
  await click('Continue'); // meeting
  await vi.waitFor(() => expect(isDisabled(button('Continue'))).toBe(false));
  await click('Continue'); // checks
};

/** Answers the camera and microphone questions and learns the raised hand, reaching the Share step. */
const learnButtons = async () => {
  await click("Yes, it's on"); // camera
  await click('Continue');
  await click("Yes, it's on"); // microphone
  await click('Continue');
  await click('Raise and lower my hand'); // raised hands
  await click('Continue');
};

/** From the Share step: checks sharing, runs the test and finishes. */
const testAndFinish = async () => {
  await click('Check sharing');
  await click('Continue'); // sharing
  await click('Continue'); // automations
  await click('Run the test');
  await click('Continue');
  await click('Finish');
};

// Names learned in French, before Zoom's language was changed.
const FRENCH_NAMES = {
  zoomHandRaisedPhrase: 'Main levée',
  zoomMicOffTitle: 'Rétablir le son',
  zoomMicOnTitle: 'Couper le son',
  zoomVideoOffTitle: 'Démarrer ma vidéo',
  zoomVideoOnTitle: 'Arrêter ma vidéo',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(globalThis.electronApi, 'startZoomHelper').mockResolvedValue({
    ok: true,
  });
  vi.spyOn(globalThis.electronApi, 'launchZoomMeeting').mockImplementation(
    () => undefined,
  );
  zoom.getZoomMeetingState.mockResolvedValue({ found: true, sharing: false });
  zoom.diagnoseZoom.mockResolvedValue(ALL_GOOD);
  zoom.learnZoomVideoTitles.mockImplementation(async () => {
    settings().zoomVideoOnTitle = 'Stop Video';
    settings().zoomVideoOffTitle = 'Start Video';
    return { ok: true };
  });
  zoom.joinZoomAudioForSetup.mockResolvedValue('joined');
  zoom.learnZoomMicTitles.mockImplementation(async () => {
    settings().zoomMicOnTitle = 'Mute';
    settings().zoomMicOffTitle = 'Unmute';
    return { ok: true };
  });
  zoom.learnZoomHandRaisedPhrase.mockImplementation(async () => {
    settings().zoomHandRaisedPhrase = 'Hand raised';
    return { ok: true, phrase: 'Hand raised' };
  });
  zoom.testZoomShareEntry.mockResolvedValue({
    opened: true,
    windowListed: true,
    windowSelected: true,
  });
  zoom.getZoomShareEntries.mockResolvedValue({ more: [], toolbar: [] });
  zoom.getZoomPanelEntries.mockResolvedValue([]);
  zoom.getZoomShareToolbarEntries.mockResolvedValue([]);
  zoom.runZoomSelfTest.mockResolvedValue([]);
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('DialogZoomSetupAssistant', () => {
  it("closes a failed check's notification as it opens", async () => {
    await mountAssistant();

    expect(startupCheck.dismissFailedZoomCheckNotice).toHaveBeenCalledOnce();
  });

  it('waits for the Zoom helper, and explains why it could not start', async () => {
    vi.mocked(globalThis.electronApi.startZoomHelper).mockResolvedValueOnce({
      error: 'powershell-restricted',
      ok: false,
    });
    await mountAssistant();

    expect(text()).toContain('Windows PowerShell is restricted');
    expect(isDisabled(button('Continue'))).toBe(true);

    await click('Try again');
    expect(text()).toContain('Ready');
    expect(isDisabled(button('Continue'))).toBe(false);
  });

  it('accepts a pasted invitation link, refuses a bad ID, and opens the meeting', async () => {
    zoom.getZoomMeetingState.mockResolvedValue({
      found: false,
      sharing: false,
    });
    await mountAssistant();
    await click('Continue');

    await typeMeetingId('12345');
    expect(text()).toContain("doesn't look like a Zoom meeting ID");
    expect(isDisabled(button('Open the meeting in Zoom'))).toBe(true);

    await typeMeetingId('https://us02web.zoom.us/j/12345678901?pwd=abc');
    await click('Open the meeting in Zoom');
    expect(globalThis.electronApi.launchZoomMeeting).toHaveBeenCalledWith(
      '12345678901',
    );
    // Not found yet: can't go on.
    expect(text()).toContain('Waiting for your Zoom meeting');
    expect(isDisabled(button('Continue'))).toBe(true);

    zoom.getZoomMeetingState.mockResolvedValue({ found: true, sharing: false });
    await vi.waitFor(
      () => expect(text()).toContain('Connected to your Zoom meeting'),
      { timeout: 5000 },
    );
    await click('Continue');
    expect(settings().zoomMeetingManagerMeetingId).toBe('12345678901');
  });

  it('says what to fix when a check fails, and still lets the user go on', async () => {
    zoom.diagnoseZoom.mockResolvedValue({ ...ALL_GOOD, hostControls: false });
    await mountAssistant();
    await click('Continue');
    await vi.waitFor(() => expect(isDisabled(button('Continue'))).toBe(false));
    await click('Continue');

    await vi.waitFor(() =>
      expect(text()).toContain("Only the meeting's host or a co-host"),
    );
    expect(isDisabled(button('Continue'))).toBe(true);

    zoom.diagnoseZoom.mockResolvedValue(ALL_GOOD);
    await click('Check again');
    await vi.waitFor(() => expect(isDisabled(button('Continue'))).toBe(false));
    expect(zoom.diagnoseZoom).toHaveBeenCalledTimes(2);
  });

  it('learns the camera button from one answer', async () => {
    await mountAssistant();
    await reachVideoStep();

    expect(isDisabled(button('Continue'))).toBe(true);
    await click("Yes, it's on");

    expect(zoom.learnZoomVideoTitles).toHaveBeenCalledWith(true);
    expect(text()).toContain("“Stop Video” while it's on");
    expect(isDisabled(button('Continue'))).toBe(false);
  });

  it('joins computer audio, then learns the microphone button from one answer', async () => {
    await mountAssistant();
    await reachVideoStep();
    await click("Yes, it's on"); // camera
    await click('Continue');

    expect(zoom.joinZoomAudioForSetup).toHaveBeenCalledOnce();
    expect(text()).toContain('Is your microphone on');
    expect(isDisabled(button('Continue'))).toBe(true);
    await click("No, it's muted");

    expect(zoom.learnZoomMicTitles).toHaveBeenCalledWith(false, false);
    expect(text()).toContain("“Mute” while it's on");
    expect(isDisabled(button('Continue'))).toBe(false);
  });

  it('only asks about the microphone once computer audio is joined', async () => {
    zoom.joinZoomAudioForSetup.mockResolvedValueOnce('failed');
    await mountAssistant();
    await reachVideoStep();
    await click("Yes, it's on"); // camera
    await click('Continue');

    expect(text()).toContain("M³ couldn't join computer audio");
    expect(text()).not.toContain('Is your microphone on');

    await click('Try again');
    expect(text()).toContain('Is your microphone on');
  });

  it("asks whether computer audio is joined when M³ can't tell, and learns the microphone on that word", async () => {
    zoom.joinZoomAudioForSetup.mockResolvedValueOnce('unknown');
    await mountAssistant();
    await reachVideoStep();
    await click("Yes, it's on"); // camera
    await click('Continue');

    expect(text()).toContain("M³ can't tell whether computer audio is joined");
    expect(text()).not.toContain('Is your microphone on');

    await click('Computer audio is joined');
    expect(text()).toContain('Is your microphone on');
    await click("Yes, it's on");

    expect(zoom.learnZoomMicTitles).toHaveBeenCalledWith(true, true);
    expect(isDisabled(button('Continue'))).toBe(false);
  });

  it('learns how Zoom marks a raised hand', async () => {
    await mountAssistant();
    await reachVideoStep();
    await click("Yes, it's on"); // camera
    await click('Continue');
    await click("Yes, it's on"); // microphone
    await click('Continue');

    expect(text()).toContain('Raised hands');
    expect(isDisabled(button('Continue'))).toBe(true);
    await click('Raise and lower my hand');

    expect(zoom.learnZoomHandRaisedPhrase).toHaveBeenCalledOnce();
    expect(text()).toContain('recognizes raised hands (“Hand raised”)');
    expect(isDisabled(button('Continue'))).toBe(false);
  });

  it("lets the user pick the Participants entry when M³ can't find Zoom's Participants button", async () => {
    zoom.diagnoseZoom.mockResolvedValue({
      ...ALL_GOOD,
      hostControls: false,
      participantsButtonMissing: true,
      participantsPanel: false,
    });
    zoom.getZoomShareEntries.mockResolvedValue({
      more: ['Participants', 'Enregistrer'],
      toolbar: ['Partager'],
    });
    zoom.tryZoomParticipantsEntry
      .mockResolvedValueOnce(false)
      .mockImplementationOnce(async () => {
        zoom.diagnoseZoom.mockResolvedValue(ALL_GOOD);
        return true;
      });
    await mountAssistant();
    await click('Continue'); // welcome
    await typeMeetingId('987 654 3210');
    await vi.waitFor(() =>
      expect(text()).toContain('Connected to your Zoom meeting'),
    );
    await click('Continue'); // meeting: the checks run

    await vi.waitFor(() =>
      expect(text()).toContain('find the one that opens the participants list'),
    );
    expect(text()).toContain('Which of these opens the participants list');
    expect(isDisabled(button('Continue'))).toBe(true);

    const pick = async (label: string) => {
      const option = Array.from(document.querySelectorAll('.q-radio')).find(
        (el) => el.textContent?.includes(label),
      ) as HTMLElement;
      option.click();
      await flushPromises();
      await click('Try this one');
    };

    await pick('Partager');
    expect(zoom.tryZoomParticipantsEntry).toHaveBeenLastCalledWith('Partager');
    expect(text()).toContain("That didn't open the participants list");

    await pick('Participants');
    expect(zoom.tryZoomParticipantsEntry).toHaveBeenLastCalledWith(
      'Participants',
    );
    // The checks ran again with the panel open and all passed.
    await vi.waitFor(() => expect(isDisabled(button('Continue'))).toBe(false));
    expect(text()).not.toContain('Which of these opens the participants list');
  });

  it('lets the host point out the "Mute all" button when M³ doesn\'t recognize it', async () => {
    zoom.diagnoseZoom.mockResolvedValue({
      ...ALL_GOOD,
      hostControls: false,
      muteAllButtonMissing: true,
    });
    zoom.getZoomPanelEntries.mockResolvedValue([
      'Inviter',
      'Désactiver tous les sons',
    ]);
    zoom.tryZoomMuteAllEntry
      .mockResolvedValueOnce(false)
      .mockImplementationOnce(async () => {
        zoom.diagnoseZoom.mockResolvedValue(ALL_GOOD);
        return true;
      });
    await mountAssistant();
    await click('Continue'); // welcome
    await typeMeetingId('987 654 3210');
    await vi.waitFor(() =>
      expect(text()).toContain('Connected to your Zoom meeting'),
    );
    await click('Continue'); // meeting: the checks run

    await vi.waitFor(() =>
      expect(text()).toContain(
        "didn't recognize the button that mutes everyone",
      ),
    );
    expect(text()).toContain("Under Zoom's participants list");
    expect(isDisabled(button('Continue'))).toBe(true);

    const pick = async (label: string) => {
      const option = Array.from(document.querySelectorAll('.q-radio')).find(
        (el) => el.textContent?.includes(label),
      ) as HTMLElement;
      option.click();
      await flushPromises();
      await click('Try this one');
    };

    await pick('Inviter');
    expect(zoom.tryZoomMuteAllEntry).toHaveBeenLastCalledWith('Inviter');
    expect(text()).toContain("That didn't ask to confirm muting everyone");

    await pick('Désactiver tous les sons');
    await vi.waitFor(() => expect(isDisabled(button('Continue'))).toBe(false));
    expect(text()).not.toContain('Which of these mutes everyone?');
  });

  it('lets the user point out the "Stop share" button when the test could not stop sharing', async () => {
    const failedStop: ZoomSelfTestStep[] = [
      { id: 'share-start', status: 'passed' },
      { id: 'share-stop', status: 'failed' },
    ];
    zoom.runZoomSelfTest
      .mockResolvedValueOnce(failedStop)
      .mockResolvedValueOnce([
        { id: 'share-start', status: 'passed' },
        { id: 'share-stop', status: 'passed' },
      ]);
    zoom.getZoomMeetingState.mockResolvedValue({ found: true, sharing: true });
    zoom.getZoomShareToolbarEntries.mockResolvedValue([
      'Mettre le partage en pause',
      'Arrêter le partage',
    ]);
    zoom.tryZoomStopShareEntry
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    await mountAssistant();
    await reachVideoStep();
    await learnButtons();
    await click('Check sharing');
    await click('Continue'); // share
    await click('Continue'); // automations

    await click('Run the test');
    await vi.waitFor(() =>
      expect(text()).toContain("didn't recognize the button that stops it"),
    );
    expect(text()).toContain("In Zoom's sharing toolbar");

    const pick = async (label: string) => {
      const option = Array.from(document.querySelectorAll('.q-radio')).find(
        (el) => el.textContent?.includes(label),
      ) as HTMLElement;
      option.click();
      await flushPromises();
      await click('Try this one');
    };

    await pick('Mettre le partage en pause');
    expect(text()).toContain("That didn't stop sharing");

    await pick('Arrêter le partage');
    expect(zoom.tryZoomStopShareEntry).toHaveBeenLastCalledWith(
      'Arrêter le partage',
    );
    // Sharing stopped through that button: the test ran again and passed.
    await vi.waitFor(() =>
      expect(zoom.runZoomSelfTest).toHaveBeenCalledTimes(2),
    );
    await vi.waitFor(() =>
      expect(text()).not.toContain("In Zoom's sharing toolbar"),
    );
  });

  it("lets the user pick the React entry when M³ can't find Zoom's React button", async () => {
    zoom.learnZoomHandRaisedPhrase
      .mockResolvedValueOnce({ error: 'react-button-not-found', ok: false })
      .mockResolvedValueOnce({ error: 'react-button-not-found', ok: false })
      .mockImplementationOnce(async () => {
        settings().zoomHandRaisedPhrase = 'Main levée';
        return { ok: true, phrase: 'Main levée', reactButtonTitle: 'Réagir' };
      });
    zoom.getZoomShareEntries.mockResolvedValue({
      more: ['Réagir', 'Enregistrer'],
      toolbar: ['Partager'],
    });
    await mountAssistant();
    await reachVideoStep();
    await click("Yes, it's on"); // camera
    await click('Continue');
    await click("Yes, it's on"); // microphone
    await click('Continue');

    await click('Raise and lower my hand');
    expect(zoom.learnZoomHandRaisedPhrase).toHaveBeenLastCalledWith(undefined);
    // Asking is expected, not reported as an error.
    expect(text()).toContain('M³ needs your help to find its React button');
    expect(text()).not.toContain("That didn't open Zoom's reactions");
    expect(text()).toContain("Which of these opens Zoom's reactions?");
    // React is asked for once Zoom has moved it into "More": listed first.
    expect(text().indexOf('In Zoom\'s "More" menu')).toBeLessThan(
      text().indexOf("In Zoom's toolbar"),
    );
    expect(isDisabled(button('Continue'))).toBe(true);

    const pick = async (label: string) => {
      const option = Array.from(document.querySelectorAll('.q-radio')).find(
        (el) => el.textContent?.includes(label),
      ) as HTMLElement;
      option.click();
      await flushPromises();
      await click('Try this one');
    };

    await pick('Partager');
    expect(zoom.learnZoomHandRaisedPhrase).toHaveBeenLastCalledWith('Partager');
    expect(text()).toContain("That didn't open Zoom's reactions");

    await pick('Réagir');
    expect(zoom.learnZoomHandRaisedPhrase).toHaveBeenLastCalledWith('Réagir');
    expect(text()).toContain('recognizes raised hands (“Main levée”)');
    expect(text()).not.toContain("Which of these opens Zoom's reactions?");
    expect(isDisabled(button('Continue'))).toBe(false);
  });

  it("lets the user pick the Share entry when Zoom's default does not open sharing", async () => {
    zoom.testZoomShareEntry
      .mockResolvedValueOnce({
        opened: false,
        windowListed: false,
        windowSelected: false,
      })
      .mockResolvedValueOnce({
        opened: false,
        windowListed: false,
        windowSelected: false,
      })
      .mockResolvedValueOnce({
        opened: true,
        windowListed: true,
        windowSelected: true,
      });
    zoom.getZoomShareEntries.mockResolvedValue({
      more: ['Enregistrer'],
      toolbar: ['Réagir', 'Partager'],
    });
    await mountAssistant();
    await reachVideoStep();
    await learnButtons();

    await click('Check sharing');
    expect(zoom.testZoomShareEntry).toHaveBeenCalledWith(null);
    // M³'s own guess failing is expected, not reported as an error.
    expect(text()).toContain('M³ needs your help to find the one');
    expect(text()).not.toContain("That didn't open Zoom's share window");
    expect(text()).toContain('Which of these starts screen sharing');
    expect(text()).toContain("In Zoom's toolbar");
    expect(text()).toContain('In Zoom\'s "More" menu');

    const pick = async (label: string) => {
      const option = Array.from(document.querySelectorAll('.q-radio')).find(
        (el) => el.textContent?.includes(label),
      ) as HTMLElement;
      option.click();
      await flushPromises();
      await click('Try this one');
    };

    await pick('Réagir');
    expect(zoom.testZoomShareEntry).toHaveBeenLastCalledWith('Réagir');
    expect(text()).toContain("That didn't open Zoom's share window");
    expect(settings().zoomShareButtonTitle).toBeNull();

    await pick('Partager');
    expect(zoom.testZoomShareEntry).toHaveBeenLastCalledWith('Partager');
    expect(settings().zoomShareButtonTitle).toBe('Partager');
    expect(text()).toContain('offers the media window');
  });

  it("doesn't ask for the Share button when Zoom's share window opens without the media window", async () => {
    zoom.testZoomShareEntry
      .mockResolvedValueOnce({
        opened: true,
        windowListed: false,
        windowSelected: false,
      })
      .mockResolvedValueOnce({
        opened: true,
        windowListed: true,
        windowSelected: false,
      })
      .mockResolvedValueOnce({
        opened: true,
        windowListed: true,
        windowSelected: true,
      });
    await mountAssistant();
    await reachVideoStep();
    await learnButtons();

    await click('Check sharing');
    expect(text()).toContain("the media window wasn't in it");
    expect(zoom.getZoomShareEntries).not.toHaveBeenCalled();
    expect(text()).not.toContain('Which of these starts screen sharing');

    // Listed, but something in front of Zoom's share window kept M³ from
    // selecting it: sharing would not pick it either.
    await click('Check sharing');
    expect(text()).toContain("M³ couldn't select it");

    await click('Check sharing');
    expect(text()).toContain('offers the media window');
  });

  it('asks to check the meeting when there is nothing to pick the Share button from', async () => {
    zoom.testZoomShareEntry.mockResolvedValue({
      opened: false,
      windowListed: false,
      windowSelected: false,
    });
    await mountAssistant();
    await reachVideoStep();
    await learnButtons();

    await click('Check sharing');
    expect(text()).toContain('Make sure your Zoom meeting is still open');
    expect(isDisabled(button('Check sharing'))).toBe(false);
  });

  it('turns automations and background music on, and tests only host-side actions', async () => {
    await mountAssistant({ enableMusicButton: false });
    await reachVideoStep();
    await learnButtons();
    await click('Check sharing');
    await click('Continue');

    expect(text()).toContain(
      'triggered by background music, which is turned off',
    );
    await click('Turn on background music');
    expect(settings().enableMusicButton).toBe(true);

    await click('Continue');
    await click('Run the test');
    expect(zoom.runZoomSelfTest).toHaveBeenCalledWith(
      expect.objectContaining({
        steps: expect.not.arrayContaining([
          'mute-all-locked',
          'meeting-sequence',
        ]),
      }),
    );
    expect(text()).toContain('Everything works.');

    await click('Continue');
    expect(text()).toContain("You're all set!");
    await click('Finish');
    expect(settings().zoomMeetingManagerEnable).toBe(true);
  });

  // With a media scene, OBS Studio already shows the media in Zoom, so Zoom
  // mustn't share it too
  it('leaves media sharing off while OBS Studio has a media scene, and offers to switch', async () => {
    await mountAssistant({
      obsCameraScene: 'Camera',
      obsEnable: true,
      obsImageScene: 'Images',
      obsMediaScene: 'Media',
      obsPassword: 'secret',
      obsPort: '4455',
    });
    await reachVideoStep();
    await learnButtons();
    await click('Check sharing');
    await click('Continue');

    expect(settings().zoomMeetingManagerAutomateMediaSharing).toBe(false);
    expect(settings().zoomMeetingManagerAutomateMeetingAudioSettings).toBe(
      true,
    );
    expect(text()).toContain(
      "Zoom can't share the media window while OBS Studio has a media scene set",
    );

    await click('Let Zoom share media instead');
    expect(settings().obsMediaScene).toBeNull();
    expect(settings().obsImageScene).toBeNull();
    // The rest of the OBS Studio integration stays on
    expect(settings().obsEnable).toBe(true);
    expect(settings().obsCameraScene).toBe('Camera');
    expect(settings().zoomMeetingManagerAutomateMediaSharing).toBe(true);
    expect(text()).not.toContain("Zoom can't share the media window");
  });

  it('preselects media sharing when OBS Studio has no media scene', async () => {
    await mountAssistant({
      obsCameraScene: 'Camera',
      obsEnable: true,
      obsPassword: 'secret',
      obsPort: '4455',
    });
    await reachVideoStep();
    await learnButtons();
    await click('Check sharing');
    await click('Continue');

    expect(settings().zoomMeetingManagerAutomateMediaSharing).toBe(true);
    expect(text()).not.toContain("Zoom can't share the media window");
  });

  it("learns every name again when Zoom's names changed, then resumes the paused automations", async () => {
    const zoomState = useZoomStateStore();
    zoomState.pauseAutomations(CONGREGATION_ID, ['x'], true);
    await mountAssistant(FRENCH_NAMES);

    expect(text()).toContain("Zoom's language was changed or Zoom was updated");
    await reachVideoStep();
    // Asked again, rather than shown as done with the old names.
    expect(isDisabled(button('Continue'))).toBe(true);
    await learnButtons();
    expect(settings()).toMatchObject({
      zoomHandRaisedPhrase: 'Hand raised',
      zoomMicOnTitle: 'Mute',
      zoomVideoOnTitle: 'Stop Video',
    });

    await testAndFinish();
    expect(zoomState.automationsPaused).toBe(false);
  });

  it('keeps the names it knows, and the automations paused, unless its test passed', async () => {
    const zoomState = useZoomStateStore();
    zoomState.pauseAutomations(CONGREGATION_ID, ['x']);
    zoom.runZoomSelfTest.mockResolvedValue([
      { id: 'video-off', status: 'failed' },
    ]);
    await mountAssistant(FRENCH_NAMES);

    expect(text()).not.toContain("Zoom's language was changed");
    await reachVideoStep();
    // Already learned: shown as done.
    expect(isDisabled(button('Continue'))).toBe(false);
    await click('Continue'); // camera
    await click('Continue'); // microphone
    await click('Continue'); // raised hands
    expect(settings().zoomVideoOnTitle).toBe('Arrêter ma vidéo');

    await testAndFinish();
    expect(zoomState.automationsPaused).toBe(true);
  });

  it('lets optional steps be skipped', async () => {
    await mountAssistant();
    await reachVideoStep();

    await click('Skip'); // camera
    expect(text()).toContain('Your microphone');
    await click('Skip'); // microphone
    expect(text()).toContain('Raised hands');
    await click('Skip'); // raised hands
    expect(text()).toContain('Sharing the media window');
    await click('Skip'); // sharing
    expect(text()).toContain('What should M³ do?');
  });
});
