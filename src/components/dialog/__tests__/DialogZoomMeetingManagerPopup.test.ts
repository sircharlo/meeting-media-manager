import type { ZoomMeetingState } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DialogZoomMeetingManagerPopup from '../DialogZoomMeetingManagerPopup.vue';

const {
  getMeetingStateMock,
  meetingSequenceMock,
  postMeetingSequenceMock,
  runSelfTestMock,
} = vi.hoisted(() => ({
  getMeetingStateMock: vi.fn<() => Promise<null | ZoomMeetingState>>(),
  meetingSequenceMock: vi.fn(async () => ({ failedSteps: [], ok: true })),
  postMeetingSequenceMock: vi.fn(async () => ({ failedSteps: [], ok: true })),
  runSelfTestMock: vi.fn(),
}));

vi.mock('src/helpers/zoom', () => ({
  getZoomMeetingState: getMeetingStateMock,
  getZoomTitlesFromSettings: () => ({
    shareButtonTitle: null,
    videoOffTitle: null,
    videoOnTitle: null,
  }),
  runZoomMeetingSequence: meetingSequenceMock,
  runZoomPostMeetingSequence: postMeetingSequenceMock,
}));

vi.mock('src/helpers/zoom-self-test', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  runZoomSelfTest: runSelfTestMock,
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'test-cong';

const MEETING: ZoomMeetingState = {
  audioJoined: true,
  found: true,
  sharing: false,
  title: 'Zoom Meeting',
};

let wrapper: undefined | VueWrapper;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const mountPopup = async ({
  meeting = null,
  settings = {},
}: {
  meeting?: null | ZoomMeetingState;
  settings?: Partial<typeof defaultSettings>;
} = {}) => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      zoomMeetingManagerEnable: true,
      ...settings,
    },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  getMeetingStateMock.mockResolvedValue(meeting);

  wrapper = mount(DialogZoomMeetingManagerPopup, {
    props: { modelValue: true },
  });
  await flushPromises();
};

// QMenu teleports its content to document.body, outside the wrapper's tree.
const findButton = (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find((el) =>
    el.textContent?.includes(label),
  );
  if (!button) throw new Error(`No button found with label "${label}"`);
  return button;
};

const isDisabled = (button: HTMLButtonElement) =>
  button.classList.contains('disabled') || button.disabled;

describe('DialogZoomMeetingManagerPopup', () => {
  it('reports a missing Zoom window and disables the automation buttons', async () => {
    await mountPopup({
      settings: {
        zoomMeetingManagerAutomateMeetingAudioSettings: true,
        zoomMeetingManagerAutomatePostMeetingAudioSettings: true,
      },
    });

    expect(document.body.textContent).toContain(
      'No Zoom meeting window detected',
    );
    expect(isDisabled(findButton('Apply meeting settings'))).toBe(true);
    expect(isDisabled(findButton('Apply before/after-meeting settings'))).toBe(
      true,
    );
  });

  it('runs the meeting automation against a detected Zoom window', async () => {
    await mountPopup({
      meeting: MEETING,
      settings: { zoomMeetingManagerAutomateMeetingAudioSettings: true },
    });

    expect(document.body.textContent).toContain('Zoom meeting window detected');

    const button = findButton('Apply meeting settings');
    expect(isDisabled(button)).toBe(false);
    button.click();
    await flushPromises();

    expect(meetingSequenceMock).toHaveBeenCalledOnce();
    expect(postMeetingSequenceMock).not.toHaveBeenCalled();
  });

  it('only offers the automations that are turned on in settings', async () => {
    await mountPopup({ meeting: MEETING });

    expect(() => findButton('Apply meeting settings')).toThrow();
    expect(() => findButton('Apply before/after-meeting settings')).toThrow();
  });

  it('launches the configured meeting, and only when an ID is set', async () => {
    const launchSpy = vi.spyOn(globalThis.electronApi, 'launchZoomMeeting');
    launchSpy.mockImplementation(() => undefined);

    await mountPopup();
    expect(isDisabled(findButton('Launch Zoom meeting'))).toBe(true);
    wrapper?.unmount();
    document.body.innerHTML = '';

    await mountPopup({ settings: { zoomMeetingManagerMeetingId: ' 123 ' } });
    findButton('Launch Zoom meeting').click();

    expect(launchSpy).toHaveBeenCalledWith('123');
  });

  it('runs the developer self-test with test participants, then lets them go', async () => {
    const participantsSpy = vi
      .spyOn(globalThis.electronApi, 'zoomTestParticipants')
      .mockResolvedValue({ meetingId: '5550001', ok: true, participants: [] });
    runSelfTestMock.mockImplementation(async ({ onProgress, participants }) => {
      expect(participants).toBeDefined();
      onProgress([
        { id: 'meeting', status: 'passed' },
        {
          detail: 'Zoom turned them away',
          id: 'participants-join',
          status: 'failed',
        },
      ]);
    });
    await mountPopup({ meeting: MEETING });

    findButton('Run test').click();
    await flushPromises();

    expect(participantsSpy).toHaveBeenCalledWith({ count: 3, type: 'start' });
    expect(runSelfTestMock).toHaveBeenCalledOnce();
    expect(participantsSpy).toHaveBeenLastCalledWith({ type: 'stop' });
    expect(document.body.textContent).toContain('Find the Zoom meeting window');
    expect(document.body.textContent).toContain('Zoom turned them away');
    expect(document.body.textContent).toContain(
      '1 passed, 1 failed, 0 skipped',
    );
    expect(document.body.textContent).toContain('meeting 5550001');
  });
});
