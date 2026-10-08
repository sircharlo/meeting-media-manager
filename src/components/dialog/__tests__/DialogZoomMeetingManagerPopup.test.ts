import type { ZoomUIElement } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DialogZoomMeetingManagerPopup from '../DialogZoomMeetingManagerPopup.vue';

const { automateMeetingMock, automatePostMeetingMock } = vi.hoisted(() => ({
  automateMeetingMock: vi.fn(async () => undefined),
  automatePostMeetingMock: vi.fn(async () => undefined),
}));

vi.mock('src/helpers/zoom', () => ({
  automateZoomMeetingSettings: automateMeetingMock,
  automateZoomPostMeetingSettings: automatePostMeetingMock,
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'test-cong';

const MAIN_ZOOM_WINDOW = {
  class_name: 'ConfMultiTabContentWndClass',
  handle: 1234,
  main_zoom_window: true,
  title: 'Zoom Meeting',
} as unknown as ZoomUIElement;

let wrapper: undefined | VueWrapper;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const mountPopup = async ({
  settings = {},
  windows = [],
}: {
  settings?: Partial<typeof defaultSettings>;
  windows?: ZoomUIElement[];
} = {}) => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      zoomMeetingManagerEnable: true,
      ...settings,
    },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;

  vi.spyOn(globalThis.electronApi, 'listZoomWindows').mockResolvedValue(
    windows,
  );

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
      settings: { zoomMeetingManagerAutomateMeetingAudioSettings: true },
      windows: [MAIN_ZOOM_WINDOW],
    });

    expect(document.body.textContent).toContain('Zoom meeting window detected');

    const button = findButton('Apply meeting settings');
    expect(isDisabled(button)).toBe(false);
    button.click();
    await flushPromises();

    expect(automateMeetingMock).toHaveBeenCalledOnce();
    expect(automatePostMeetingMock).not.toHaveBeenCalled();
  });

  it('only offers the automations that are turned on in settings', async () => {
    await mountPopup({ windows: [MAIN_ZOOM_WINDOW] });

    expect(document.body.textContent).not.toContain('Meeting settings');
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
});
