import type { ZoomDiagnosis } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogZoomSetupAssistant from '../DialogZoomSetupAssistant.vue';

const zoom = vi.hoisted(() => ({
  diagnoseZoom: vi.fn(),
  getZoomMeetingState: vi.fn(),
  getZoomShareEntries: vi.fn(),
  learnZoomVideoTitles: vi.fn(),
  runZoomSelfTest: vi.fn(),
  testZoomShareEntry: vi.fn(),
}));

vi.mock('src/helpers/zoom', () => ({
  diagnoseZoom: zoom.diagnoseZoom,
  getZoomMeetingState: zoom.getZoomMeetingState,
  getZoomShareEntries: zoom.getZoomShareEntries,
  getZoomTitlesFromSettings: () => ({
    shareButtonTitle: null,
    videoOffTitle: 'Start Video',
    videoOnTitle: 'Stop Video',
  }),
  learnZoomVideoTitles: zoom.learnZoomVideoTitles,
  prepareMediaWindowForZoomTest: async () => () => undefined,
  testZoomShareEntry: zoom.testZoomShareEntry,
}));

vi.mock('src/helpers/zoom-self-test', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  runZoomSelfTest: zoom.runZoomSelfTest,
}));

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: vi.fn(),
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'test-cong';
const ALL_GOOD: ZoomDiagnosis = {
  hostControls: true,
  meeting: true,
  participantsPanel: true,
  toolbar: true,
  videoButton: true,
  videoShortcutDefault: true,
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
  zoom.testZoomShareEntry.mockResolvedValue({
    opened: true,
    windowListed: true,
    windowSelected: true,
  });
  zoom.getZoomShareEntries.mockResolvedValue({ more: [], toolbar: [] });
  zoom.runZoomSelfTest.mockResolvedValue([]);
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('DialogZoomSetupAssistant', () => {
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
    await click("Yes, it's on");
    await click('Continue');

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
    await click("Yes, it's on");
    await click('Continue');

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
    await click("Yes, it's on");
    await click('Continue');

    await click('Check sharing');
    expect(text()).toContain('Make sure your Zoom meeting is still open');
    expect(isDisabled(button('Check sharing'))).toBe(false);
  });

  it('turns automations and background music on, and tests only host-side actions', async () => {
    await mountAssistant({ enableMusicButton: false });
    await reachVideoStep();
    await click("Yes, it's on");
    await click('Continue');
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

  it('lets optional steps be skipped', async () => {
    await mountAssistant();
    await reachVideoStep();

    await click('Skip'); // camera
    expect(text()).toContain('Sharing the media window');
    await click('Skip'); // sharing
    expect(text()).toContain('What should M³ do?');
  });
});
