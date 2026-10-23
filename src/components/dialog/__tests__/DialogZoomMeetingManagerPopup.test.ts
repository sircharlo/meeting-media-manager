import type { ZoomMeetingState } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import DialogZoomMeetingManagerPopup from '../DialogZoomMeetingManagerPopup.vue';

const {
  getMeetingStateMock,
  meetingSequenceMock,
  notificationMock,
  postMeetingSequenceMock,
  runSelfTestMock,
  startupCheckMock,
} = vi.hoisted(() => ({
  getMeetingStateMock: vi.fn<() => Promise<null | ZoomMeetingState>>(),
  meetingSequenceMock: vi.fn(async () => ({ failedSteps: [], ok: true })),
  notificationMock: vi.fn(),
  postMeetingSequenceMock: vi.fn(async () => ({ failedSteps: [], ok: true })),
  runSelfTestMock: vi.fn(),
  startupCheckMock: vi.fn(async () => 'passed'),
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: notificationMock,
}));

vi.mock('src/helpers/zoom-startup-check', () => ({
  runZoomStartupCheck: startupCheckMock,
}));

vi.mock('src/helpers/zoom', () => ({
  getZoomMeetingState: getMeetingStateMock,
  getZoomTitlesFromSettings: () => ({
    shareButtonTitle: null,
    videoOffTitle: null,
    videoOnTitle: null,
  }),
  isZoomSetupNeeded: () => false,
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
let router: Router;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  useAppSettingsStore().zoomLayout.enabled = false;
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
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { component: { template: '<div />' }, path: '/' },
      {
        component: { template: '<div />' },
        name: 'settings',
        path: '/settings/:setting?',
      },
    ],
  });
  await router.push('/');

  wrapper = mount(DialogZoomMeetingManagerPopup, {
    global: { plugins: [router] },
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

// Opens the footer's "More options" menu and returns one of its items.
const openMenuItem = async (label: string) => {
  document
    .querySelector<HTMLButtonElement>('button[aria-label="More options"]')
    ?.click();
  await flushPromises();
  const item = Array.from(
    document.querySelectorAll<HTMLElement>('[role="menu"] .q-item'),
  ).find((el) => el.textContent?.includes(label));
  if (!item) throw new Error(`No menu item found with label "${label}"`);
  return item;
};

describe('DialogZoomMeetingManagerPopup', () => {
  it('says when a failed check paused the automations, and tests again', async () => {
    await mountPopup({ meeting: MEETING });
    useZoomStateStore().pauseAutomations(CONGREGATION_ID, [
      'zoom-self-test-step-video-off',
      'zoom-setup-check-host',
    ]);
    await flushPromises();

    expect(document.body.textContent).toContain('Zoom automations paused');
    expect(document.body.textContent).toContain('Turn the host video off');

    findButton('Test again').click();
    expect(startupCheckMock).toHaveBeenCalledWith({ manual: true });
  });

  it("offers the setup assistant instead when Zoom's names changed", async () => {
    await mountPopup({ meeting: MEETING });
    useZoomStateStore().pauseAutomations(
      CONGREGATION_ID,
      ['zoom-self-test-step-video-off'],
      true,
    );
    await flushPromises();
    const dispatch = vi.spyOn(globalThis, 'dispatchEvent');

    const banner = document.querySelector('.action-popup__banner--negative');
    expect(banner?.textContent).toContain(
      "Zoom's language was changed or Zoom was updated",
    );
    expect(banner?.textContent).not.toContain('Test again');
    banner?.querySelector('button')?.click();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'openZoomSetupAssistant' }),
    );
    expect(startupCheckMock).not.toHaveBeenCalled();
  });

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

  it('opens the setup assistant from the "More options" menu', async () => {
    await mountPopup({ meeting: MEETING });
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');

    (await openMenuItem('Setup assistant')).click();

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'openZoomSetupAssistant' }),
    );
  });

  it("goes to the Zoom Meeting Manager's settings from the menu", async () => {
    await mountPopup({ meeting: MEETING });

    (await openMenuItem('Go to Settings')).click();
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe(
      '/settings/zoomMeetingManagerEnable',
    );
  });

  it("says when restarting M³'s connection to Zoom fails", async () => {
    vi.spyOn(globalThis.electronApi, 'restartZoomHelper').mockResolvedValue({
      error: 'powershell-restricted',
      ok: false,
    });
    await mountPopup({ meeting: MEETING });

    (await openMenuItem("Restart M³'s connection to Zoom")).click();
    await flushPromises();

    expect(notificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        caption: expect.stringContaining('Windows PowerShell is restricted'),
        message: "The Zoom Meeting Manager couldn't start.",
        type: 'negative',
      }),
    );
  });

  it('only shows the helper logs once they are asked for', async () => {
    useCurrentStateStore().zoomHelperLogs = ['[Zoom Helper] Process started'];
    await mountPopup({ meeting: MEETING });
    expect(document.querySelector('.zoom-helper-logs')).toBeNull();

    (await openMenuItem('Zoom helper logs')).click();
    await flushPromises();

    expect(document.querySelector('.zoom-helper-logs')?.textContent).toContain(
      'Process started',
    );
  });

  it('warns when a Zoom dialog is open and may be in the way', async () => {
    await mountPopup({
      meeting: { dialogs: ['InviteToJoinWndCls'], found: true, sharing: false },
    });

    expect(document.body.textContent).toContain("may be in M³'s way");
  });

  it('launches the configured meeting when no Zoom meeting window is open', async () => {
    const launchSpy = vi.spyOn(globalThis.electronApi, 'launchZoomMeeting');
    launchSpy.mockImplementation(() => undefined);

    await mountPopup({ settings: { zoomMeetingManagerMeetingId: ' 123 ' } });
    findButton('Launch Zoom meeting').click();

    expect(launchSpy).toHaveBeenCalledWith('123');
  });

  it('sends to the meeting ID setting when none is set', async () => {
    await mountPopup();

    expect(() => findButton('Launch Zoom meeting')).toThrow();
    expect(document.body.textContent).toContain(
      'Set a Zoom meeting ID in the settings',
    );
    findButton('Go to Settings').click();
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe(
      '/settings/zoomMeetingManagerMeetingId',
    );
  });

  it('arranges the windows instead once the meeting window is found', async () => {
    useAppSettingsStore().zoomLayout.enabled = true;
    await mountPopup({
      meeting: MEETING,
      settings: { zoomMeetingManagerMeetingId: '123' },
    });

    expect(() => findButton('Launch Zoom meeting')).toThrow();
    expect(isDisabled(findButton('Arrange windows'))).toBe(false);
  });

  it('offers to choose the layout when the meeting window is found without one', async () => {
    await mountPopup({ meeting: MEETING });
    const dispatchSpy = vi.spyOn(globalThis, 'dispatchEvent');

    expect(() => findButton('Arrange windows')).toThrow();
    findButton('Choose the layout').click();

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { step: 'layout' },
        type: 'openZoomSetupAssistant',
      }),
    );
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
