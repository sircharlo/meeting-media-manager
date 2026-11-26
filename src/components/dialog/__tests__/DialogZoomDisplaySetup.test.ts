import type * as ZoomDisplaySetup from 'src/helpers/zoom-display-setup';
import type { SettingsValues } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { __testables } from 'src/helpers/zoom-display-setup';
import { useAttentionStore } from 'stores/attention';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { useZoomDisplaySetupStore } from 'stores/zoom-display-setup';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DialogZoomDisplaySetup from '../DialogZoomDisplaySetup.vue';

const meeting = vi.hoisted(() => ({
  midweek: true,
  start: null as Date | null,
}));

const zoom = vi.hoisted(() => ({
  canPlace: false,
  // What the setup did to the media window and to Zoom, in order.
  events: [] as string[],
  mediaOnItsOwnScreen: true,
  placements: [] as string[],
}));

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getMeetingStartToday: () => meeting.start,
  isMwMeetingDay: () => meeting.midweek,
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: vi.fn(),
}));

vi.mock('src/helpers/mediaPlayback', () => ({
  toggleMediaWindowVisibility: (visible: boolean) => {
    zoom.events.push(visible ? 'media shown' : 'media hidden');
  },
}));

// Zoom itself is the helper's business (see zoom-display-setup.test.ts):
// here, what M³ found there is scripted.
vi.mock('src/helpers/zoom-display-setup', async (importOriginal) => {
  const original = await importOriginal<typeof ZoomDisplaySetup>();
  const nextPlacement = () => {
    zoom.events.push('zoom placed');
    return zoom.placements.shift() ?? 'full-screen';
  };
  return {
    ...original,
    canPlaceZoomForDisplaySetup: () => zoom.canPlace,
    isMediaOnItsOwnScreen: async () => zoom.mediaOnItsOwnScreen,
    retryZoomDisplayPlacement: async () => nextPlacement(),
    revealZoomForDisplaySetup: async () => {
      // Hides the media display (the Zoom Meeting Manager is off here).
      await original.revealZoomForDisplaySetup();
      return zoom.canPlace ? nextPlacement() : null;
    },
  };
});

installQuasarPlugin();
installPinia({ stubActions: false });

const CONGREGATION_ID = 'zoom-display-cong';
const FIRST_TRY_MS = 15 * 1000;
const TRY_INTERVAL_MS = 30 * 1000;
// How long the last screen stays, and the fade that takes it away.
const FINALE_MS = 5000;
const TRANSITION_MS = 500;
const READY = "Everything's ready!";
const LATER = "That's it for now";
// Thursday's meeting, at 19:30.
const MEETING_START = new Date(2026, 9, 15, 19, 30);

let wrapper: undefined | VueWrapper;

const mountSetup = async ({
  route = '/media-calendar',
  settings = {},
}: { route?: string; settings?: Partial<SettingsValues> } = {}) => {
  const congregationSettings = useCongregationSettingsStore();
  congregationSettings.congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      enableMediaDisplayButton: true,
      ...settings,
    },
  };
  congregationSettings.quickStartTourSeen = { [CONGREGATION_ID]: true };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        component: { template: '<div />' },
        name: 'media-calendar',
        path: '/media-calendar',
      },
      {
        component: { template: '<div />' },
        name: 'settings',
        path: '/settings',
      },
    ],
  });
  await router.push(route);
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  wrapper = mount(DialogZoomDisplaySetup, {
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

// By the button's label alone: an icon's name is in its text too.
const click = async (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (el) => el.querySelector('.block')?.textContent?.trim() === label,
  );
  if (!button) throw new Error(`No button labelled "${label}"`);
  button.click();
  await wait(1000); // lets the dialog finish its transitions
};

/** Mounts the dialog and waits for its question. */
const askQuestion = async (settings: Partial<SettingsValues> = {}) => {
  await mountSetup({ settings });
  await wait(FIRST_TRY_MS);
};

const store = () => useZoomDisplaySetupStore();

/** Answers yes up to the setup's last step, Zoom being full screen. */
const reachTheEnd = async () => {
  await askQuestion();
  await click('Yes');
  await click('Hide the media display');
  await click('Yes');
};

// However the tour ends (its last step, "Skip tour", the Show button).
const endTour = async () => {
  store().endTour();
  await flushPromises();
};

const questionTurnedOn = () =>
  useCongregationSettingsStore().congregations[CONGREGATION_ID]
    ?.zoomDisplaySetupHelp;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  // Half an hour before the meeting.
  vi.setSystemTime(MEETING_START.getTime() - 30 * 60 * 1000);
  meeting.start = MEETING_START;
  meeting.midweek = true;
  zoom.canPlace = false;
  zoom.events.length = 0;
  zoom.mediaOnItsOwnScreen = true;
  zoom.placements.length = 0;
  __testables.reset();
  store().close();
  store().endTour();
  useDialogStateStore().closeAllDialogs();
  useAttentionStore().claims.clear();
  useCurrentStateStore().congregationSwitcherOpen = false;
  useCurrentStateStore().currentCongregation = '';
  useCurrentStateStore().mediaWindowVisible = true;
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('DialogZoomDisplaySetup: when it asks', () => {
  it('asks about the midweek meeting once startup has settled', async () => {
    await mountSetup();
    await wait(FIRST_TRY_MS - 1000);
    expect(text()).not.toContain('on Zoom');

    await wait(1000);
    expect(text()).toContain(
      "Will any of today's parts be presented by someone on Zoom?",
    );
  });

  it('asks about the speaker before a weekend meeting', async () => {
    meeting.midweek = false;
    await askQuestion();
    expect(text()).toContain('Will the speaker be on Zoom today?');
  });

  it('waits for another dialog to close', async () => {
    useDialogStateStore().openDialog('something-else', 'BaseDialog');
    await mountSetup();
    await wait(FIRST_TRY_MS);
    expect(store().meeting).toBeNull();

    useDialogStateStore().closeDialog('something-else');
    await wait(TRY_INTERVAL_MS);
    expect(store().meeting).toBe('mw');
  });

  // A tour or the setup wizard, which aren't dialogs (see the attention store).
  it('waits while something else holds the screen', async () => {
    useAttentionStore().claim('quick-start-tour');
    await mountSetup();
    await wait(FIRST_TRY_MS);
    expect(store().meeting).toBeNull();

    useAttentionStore().release('quick-start-tour');
    await wait(TRY_INTERVAL_MS);
    expect(store().meeting).toBe('mw');
  });

  it.each([
    ['away from the media calendar', { route: '/settings' }],
    ['when it is turned off', { settings: { zoomDisplaySetupHelp: false } }],
  ])('never asks %s', async (_, options) => {
    await mountSetup(options);
    await wait(FIRST_TRY_MS + TRY_INTERVAL_MS);
    expect(store().meeting).toBeNull();
  });

  it('never asks without a TV for the media window', async () => {
    zoom.mediaOnItsOwnScreen = false;
    await askQuestion();
    expect(store().meeting).toBeNull();

    // Asked once the media window fills a screen of its own.
    zoom.mediaOnItsOwnScreen = true;
    await wait(TRY_INTERVAL_MS);
    expect(store().meeting).toBe('mw');
  });

  it('makes way for the meeting when nobody answered by then', async () => {
    await askQuestion();
    expect(store().meeting).toBe('mw');

    await wait(30 * 60 * 1000);

    expect(store().meeting).toBeNull();
    expect(zoom.events).toEqual([]);
    expect(text()).not.toContain(READY);
  });
});

describe('DialogZoomDisplaySetup: the answers', () => {
  it('closes on "No", leaving everything as it was', async () => {
    await askQuestion();
    await click('No');

    expect(store().meeting).toBeNull();
    expect(store().tourActive).toBe(false);
    expect(zoom.events).toEqual([]);
    // Nothing was set up, so there's nothing to confirm.
    expect(text()).not.toContain(READY);
  });

  it('turns the question off on "Don\'t ask me again", once confirmed', async () => {
    await askQuestion();
    await click("Don't ask me again");
    expect(text()).toContain('Turn off this question permanently?');
    expect(questionTurnedOn()).toBe(true);

    await click('Turn it off');

    expect(questionTurnedOn()).toBe(false);
    expect(store().meeting).toBeNull();
    expect(text()).not.toContain('Turn off this question permanently?');
  });

  it('keeps asking when the user changes their mind', async () => {
    await askQuestion();
    await click("Don't ask me again");

    await click('Keep asking');

    expect(questionTurnedOn()).toBe(true);
    expect(store().meeting).toBe('mw');
    expect(text()).not.toContain('Turn off this question permanently?');
    expect(text()).toContain(
      "Will any of today's parts be presented by someone on Zoom?",
    );
  });

  it('closes the confirmation along with the question at meeting time', async () => {
    await askQuestion();
    await click("Don't ask me again");

    await wait(30 * 60 * 1000);

    expect(store().meeting).toBeNull();
    expect(text()).not.toContain('Turn off this question permanently?');
    expect(questionTurnedOn()).toBe(true);
  });

  it('walks through setting up Zoom by hand, then starts the tour', async () => {
    await askQuestion();
    await click('Yes');
    expect(text()).toContain("Let's check the TV");
    expect(text()).toContain('make sure Zoom');

    await click('Hide the media display');
    expect(zoom.events).toEqual(['media hidden']);
    expect(text()).toContain("Is Zoom's window full screen on the TV?");
    expect(text()).toContain('Have a look at the TV');

    await click('No');
    expect(text()).toContain('Double-click the middle');
    expect(text()).not.toContain('Let M³ try again');

    await click('Done');
    expect(zoom.events).toEqual(['media hidden', 'media shown']);
    expect(text()).toContain("Great, you're all set!");

    await click('Show me');
    expect(store().meeting).toBeNull();
    expect(store().tourStep).toBe(0);
  });

  it('goes back to the question from the explanation', async () => {
    await askQuestion();
    await click('Yes');
    await click('Back');
    expect(text()).toContain(
      "Will any of today's parts be presented by someone on Zoom?",
    );
  });

  it('starts the tour after "Skip for now" too, then says what is left', async () => {
    await askQuestion();
    await click('Yes');
    await click('Hide the media display');
    await click('No');

    await click('Skip for now');

    expect(store().meeting).toBeNull();
    expect(store().tourStep).toBe(0);
    expect(zoom.events).toEqual(['media hidden', 'media shown']);

    await endTour();
    expect(text()).toContain(LATER);
    expect(text()).toContain('Remember to make the Zoom window full screen');
    expect(text()).not.toContain(READY);
  });

  it('says everything is ready once the tour is over, then goes by itself', async () => {
    await reachTheEnd();
    await click('Show me');
    expect(text()).not.toContain(READY);

    await endTour();
    expect(text()).toContain(READY);
    expect(text()).toContain('Enjoy the meeting!');

    await wait(FINALE_MS - 1000);
    expect(text()).toContain(READY);

    await wait(1000 + TRANSITION_MS);
    expect(text()).not.toContain(READY);
    expect(store().meeting).toBeNull();
  });

  it('closes the last screen sooner on "Close"', async () => {
    await reachTheEnd();
    await click('Show me');
    await endTour();

    await click('Close');

    expect(text()).not.toContain(READY);
  });

  it('says everything is ready right away when the tour is declined', async () => {
    await reachTheEnd();
    await click('Close');

    expect(store().meeting).toBeNull();
    expect(store().tourActive).toBe(false);
    expect(text()).toContain(READY);

    await wait(FINALE_MS + TRANSITION_MS);
    expect(text()).not.toContain(READY);
  });

  it('starts over from the question the next time it opens', async () => {
    await reachTheEnd();
    await click('Close');
    await wait(FINALE_MS + TRANSITION_MS);

    store().open('we');
    await wait(1000);

    expect(text()).toContain('Will the speaker be on Zoom today?');
    expect(text()).not.toContain("Great, you're all set!");
  });
});

describe('DialogZoomDisplaySetup: with the Zoom Meeting Manager', () => {
  it('says what M³ did, and tries again once Zoom is ready', async () => {
    zoom.canPlace = true;
    zoom.placements.push('no-second-window', 'full-screen');
    await askQuestion();
    await click('Yes');
    expect(text()).toContain("put Zoom's second window full screen on the TV");

    await click('Hide the media display');
    expect(text()).toContain('Zoom shows the meeting in a single window');

    await click('Try again');
    expect(zoom.events).toEqual(['media hidden', 'zoom placed', 'zoom placed']);
    expect(text()).toContain(
      "M³ made sure Zoom's second window is full screen on the TV",
    );
    expect(text()).not.toContain('Try again');

    await click('Yes');
    expect(text()).toContain("Great, you're all set!");
  });

  it('lets M³ try again when Zoom is not full screen', async () => {
    zoom.canPlace = true;
    await askQuestion();
    await click('Yes');
    await click('Hide the media display');
    await click('No');

    await click('Let M³ try again');

    expect(zoom.events).toEqual(['media hidden', 'zoom placed', 'zoom placed']);
    expect(text()).toContain("Is Zoom's window full screen on the TV?");
  });
});
