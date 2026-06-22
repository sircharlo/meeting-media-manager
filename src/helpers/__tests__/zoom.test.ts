import { beforeEach, describe, expect, it, vi } from 'vitest';

const currentSettings = {
  zoomMeetingManagerAutomateMeetingAudioSettings: false,
  zoomMeetingManagerAutomatePostMeetingAudioSettings: false,
};

const listZoomWindowsMock = vi.fn();

vi.mock('stores/current-state', () => ({
  useCurrentStateStore: () => ({
    currentSettings,
  }),
}));

vi.mock('quasar', () => ({
  Dialog: {
    create: vi.fn(() => ({ onOk: vi.fn() })),
  },
}));

vi.mock('src/helpers/error-catcher', () => ({
  errorCatcher: vi.fn(),
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

vi.mock('src/helpers/keyboard-shortcuts', () => ({
  sendKeyboardShortcut: vi.fn(),
}));

describe('Zoom automation settings', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    currentSettings.zoomMeetingManagerAutomateMeetingAudioSettings = false;
    currentSettings.zoomMeetingManagerAutomatePostMeetingAudioSettings = false;

    vi.stubGlobal('electronApi', {
      clickZoomElement: vi.fn(),
      focusMediaWindow: vi.fn(),
      getZoomDialogChildren: vi.fn(),
      getZoomElementState: vi.fn(),
      getZoomElementTitle: vi.fn(),
      launchZoomMeeting: vi.fn(),
      listZoomWindows: listZoomWindowsMock,
    });
  });

  it('uses the post-meeting setting for post-meeting automation', async () => {
    listZoomWindowsMock.mockResolvedValue([]);
    currentSettings.zoomMeetingManagerAutomatePostMeetingAudioSettings = true;

    const { automateZoomPostMeetingSettings } = await import('../zoom');

    await automateZoomPostMeetingSettings();

    expect(listZoomWindowsMock).toHaveBeenCalledOnce();
  });

  it('does not run post-meeting automation when only meeting-start automation is enabled', async () => {
    currentSettings.zoomMeetingManagerAutomateMeetingAudioSettings = true;

    const { automateZoomPostMeetingSettings } = await import('../zoom');

    await automateZoomPostMeetingSettings();

    expect(listZoomWindowsMock).not.toHaveBeenCalled();
  });
});
