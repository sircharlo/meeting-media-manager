import type { SettingsValues } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { Platform } from 'quasar';
import { defaultSettings } from 'src/constants/settings';
import {
  markSetUpThisSession,
  resetFeatureNudgeSession,
} from 'src/helpers/feature-nudges';
import { createTemporaryNotification } from 'src/helpers/notifications';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import DialogFeatureNudge from '../DialogFeatureNudge.vue';

const meeting = vi.hoisted(() => ({ start: null as Date | null }));

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getMeetingStartToday: () => meeting.start,
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'nudge-cong';
const FIRST_TRY_MS = 45 * 1000;
const RETRY_MS = 60 * 1000;

let wrapper: undefined | VueWrapper;
let router: Router;

const answers = () =>
  useCongregationSettingsStore().featureNudges[CONGREGATION_ID];

/**
 * Mounts the dialog for a profile whose only eligible suggestion is OBS
 * Studio (on Linux, with schedule sync and the like not applicable), unless
 * `windows` makes the Zoom Meeting Manager the first one.
 */
const mountNudge = async ({
  route = '/media-calendar',
  settings = {},
  windows = false,
}: {
  route?: string;
  settings?: Partial<SettingsValues>;
  windows?: boolean;
} = {}) => {
  Platform.is.win = windows;
  Platform.is.mac = false;
  const congregationSettings = useCongregationSettingsStore();
  congregationSettings.congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      congregationNameModified: false,
      ...settings,
    },
  };
  congregationSettings.quickStartTourSeen = { [CONGREGATION_ID]: true };
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: { template: '<div />' },
        name: 'media-calendar',
        path: '/media-calendar/:typeOfLoad?',
      },
      {
        component: { template: '<div />' },
        name: 'settings',
        path: '/settings/:setting?',
      },
    ],
  });
  await router.push(route);
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  wrapper = mount(DialogFeatureNudge, {
    attachTo: document.body,
    global: { plugins: [router] },
  });
  await flushPromises();
};

const wait = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
  await flushPromises();
};

const text = () => document.body.textContent ?? '';

const click = async (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (el) =>
      el.textContent?.trim() === label ||
      el.getAttribute('aria-label') === label,
  );
  if (!button) throw new Error(`No button labelled "${label}"`);
  button.click();
  await wait(1000); // lets the dialog finish closing
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  vi.setSystemTime(new Date('2026-10-20T10:00:00'));
  meeting.start = null;
  resetFeatureNudgeSession();
  // installPinia shares one Pinia across the file
  useCongregationSettingsStore().featureNudges = {};
  useDialogStateStore().closeAllDialogs();
  useCurrentStateStore().currentCongregation = '';
  vi.spyOn(globalThis.electronApi, 'getAllScreens').mockResolvedValue([]);
  vi.spyOn(globalThis.electronApi, 'getLowDiskSpaceStatus').mockResolvedValue(
    false,
  );
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('DialogFeatureNudge', () => {
  it('suggests a feature once the media calendar has been open for 45 seconds', async () => {
    await mountNudge();
    await wait(FIRST_TRY_MS - 1000);
    expect(text()).not.toContain('Did you know?');

    await wait(1000);
    expect(text()).toContain('Did you know?');
    expect(text()).toContain('Using OBS Studio for Zoom?');
  });

  it('opens the matching setting and remembers the answer', async () => {
    await mountNudge();
    await wait(FIRST_TRY_MS);

    await click('Show me');

    expect(router.currentRoute.value.fullPath).toBe('/settings/obsEnable');
    expect(answers()?.responses.obs?.response).toBe('accepted');
  });

  it('snoozes it with "Remind me later"', async () => {
    await mountNudge();
    await wait(FIRST_TRY_MS);

    await click('Remind me later');

    expect(answers()?.responses.obs?.response).toBe('snoozed');
    expect(createTemporaryNotification).toHaveBeenCalledWith({
      message: 'No problem, M³ will remind you about this later.',
    });
    expect(text()).not.toContain('Did you know?');
  });

  it('snoozes it when closed without an answer', async () => {
    await mountNudge();
    await wait(FIRST_TRY_MS);

    await click('Close');

    expect(answers()?.responses.obs?.response).toBe('snoozed');
  });

  it('declines it with "No thanks"', async () => {
    await mountNudge();
    await wait(FIRST_TRY_MS);

    await click('No thanks');

    expect(answers()?.responses.obs?.response).toBe('declined');
    expect(createTemporaryNotification).toHaveBeenCalledWith({
      message: "Got it, M³ won't suggest this again.",
    });
  });

  it('stops all suggestions for the profile', async () => {
    await mountNudge();
    await wait(FIRST_TRY_MS);

    await click('Stop suggesting features');

    expect(answers()?.stopped).toBe(true);
    expect(answers()?.responses.obs).toBeUndefined();
  });

  it('opens the Zoom setup assistant from a beta suggestion', async () => {
    const onOpen = vi.fn();
    globalThis.addEventListener('openZoomSetupAssistant', onOpen);
    await mountNudge({ windows: true });
    await wait(FIRST_TRY_MS);

    expect(text()).toContain('Let M³ take care of Zoom');
    expect(text()).toContain('Beta');
    await click('Set it up');

    expect(onOpen).toHaveBeenCalled();
    expect(answers()?.responses.zoom?.response).toBe('accepted');
    globalThis.removeEventListener('openZoomSetupAssistant', onOpen);
  });

  it('waits until the media calendar is shown', async () => {
    await mountNudge({ route: '/settings' });
    await wait(FIRST_TRY_MS);
    expect(text()).not.toContain('Did you know?');

    await router.push('/media-calendar');
    await wait(RETRY_MS);
    expect(text()).toContain('Did you know?');
  });

  it('waits while another dialog is open', async () => {
    await mountNudge();
    useDialogStateStore().openDialog('other', 'OtherDialog');
    await wait(FIRST_TRY_MS);
    expect(text()).not.toContain('Did you know?');

    useDialogStateStore().closeDialog('other');
    await wait(RETRY_MS);
    expect(text()).toContain('Did you know?');
  });

  // Notifications sit above dialogs and would cover the suggestion
  it('waits while a notification is showing', async () => {
    await mountNudge();
    const toast = document.createElement('div');
    toast.className = 'q-notification';
    document.body.append(toast);
    await wait(FIRST_TRY_MS);
    expect(text()).not.toContain('Did you know?');

    toast.remove();
    await wait(RETRY_MS);
    expect(text()).toContain('Did you know?');
  });

  it('holds off from 15 minutes before the meeting', async () => {
    meeting.start = new Date('2026-10-20T10:10:00');
    await mountNudge();
    await wait(FIRST_TRY_MS + 5 * RETRY_MS);

    expect(text()).not.toContain('Did you know?');
  });

  it('suggests nothing in the session the profile was set up in', async () => {
    markSetUpThisSession(CONGREGATION_ID);
    await mountNudge();
    await wait(FIRST_TRY_MS + RETRY_MS);

    expect(text()).not.toContain('Did you know?');
  });

  it('suggests at most one feature per profile in a session', async () => {
    await mountNudge();
    await wait(FIRST_TRY_MS);
    await click('No thanks');

    // Switching away and back to the profile doesn't suggest another one
    const currentState = useCurrentStateStore();
    currentState.currentCongregation = '';
    await flushPromises();
    currentState.currentCongregation = CONGREGATION_ID;
    await wait(FIRST_TRY_MS + RETRY_MS);

    expect(text()).not.toContain('Did you know?');
  });
});
