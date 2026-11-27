import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { useScreenClaim } from 'src/composables/useScreenClaim';
import { SCREEN_PRIORITY, useAttentionStore } from 'stores/attention';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

let pinia: ReturnType<typeof createTestingPinia>;

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
  setActivePinia(pinia);
});

describe('attention store', () => {
  it('leaves the screen free with nothing on it', () => {
    expect(useAttentionStore().isScreenTaken).toBe(false);
  });

  it('counts an open dialog as taking the screen', () => {
    const dialogs = useDialogStateStore();
    dialogs.openDialog('some-dialog', 'BaseDialog');
    expect(useAttentionStore().isScreenTaken).toBe(true);

    dialogs.closeDialog('some-dialog');
    expect(useAttentionStore().isScreenTaken).toBe(false);
  });

  // It can pick a profile by itself, without showing any dialog.
  it('counts the profile picker as taking the screen', () => {
    useCurrentStateStore().congregationSwitcherOpen = true;
    expect(useAttentionStore().isScreenTaken).toBe(true);
  });

  it('stays taken until every claim is released', () => {
    const attention = useAttentionStore();
    attention.claim('quick-start-tour');
    attention.claim('setup-wizard');

    attention.release('quick-start-tour');
    expect(attention.isScreenTaken).toBe(true);
    expect(attention.isClaimed('setup-wizard')).toBe(true);

    attention.release('setup-wizard');
    expect(attention.isScreenTaken).toBe(false);
  });
});

describe('useScreenClaim', () => {
  const mountClaimer = (
    active: ReturnType<typeof ref<boolean>>,
    options: { takeover?: boolean } = {},
  ) =>
    mount(
      defineComponent({
        setup() {
          useScreenClaim('some-tour', () => !!active.value, options);
          return () => h('div');
        },
      }),
      { global: { plugins: [pinia] } },
    );

  it('claims the screen while active, and releases it when not', async () => {
    const active = ref(false);
    const wrapper = mountClaimer(active);
    const attention = useAttentionStore();
    expect(attention.isClaimed('some-tour')).toBe(false);

    active.value = true;
    await wrapper.vm.$nextTick();
    expect(attention.isClaimed('some-tour')).toBe(true);

    active.value = false;
    await wrapper.vm.$nextTick();
    expect(attention.isClaimed('some-tour')).toBe(false);
    wrapper.unmount();
  });

  // A tour: notifications wait for it (see holdsNotifications).
  it('claims it as covering the window when asked to', () => {
    const wrapper = mountClaimer(ref(true), { takeover: true });
    expect(useAttentionStore().holdsNotifications).toBe(true);

    wrapper.unmount();
    expect(useAttentionStore().holdsNotifications).toBe(false);
  });

  it('releases the screen when the component goes away', () => {
    const wrapper = mountClaimer(ref(true));
    expect(useAttentionStore().isClaimed('some-tour')).toBe(true);

    wrapper.unmount();
    expect(useAttentionStore().isScreenTaken).toBe(false);
  });
});

describe('attention queue', () => {
  // What a request opens: a dialog, which then holds the screen.
  const opener = (name: string, opened: string[]) => (): undefined => {
    opened.push(name);
    useDialogStateStore().openDialog(name, 'BaseDialog');
  };

  it('opens a request at once when the screen is free', () => {
    const opened: string[] = [];
    useAttentionStore().request('feature-tip', {
      open: opener('feature-tip', opened),
      priority: SCREEN_PRIORITY.featureTip,
    });
    expect(opened).toEqual(['feature-tip']);
  });

  it('waits for the screen, then opens the most important first, one at a time', async () => {
    const attention = useAttentionStore();
    const dialogs = useDialogStateStore();
    const opened: string[] = [];
    dialogs.openDialog('something-else', 'BaseDialog');
    attention.request('feature-tip', {
      open: opener('feature-tip', opened),
      priority: SCREEN_PRIORITY.featureTip,
    });
    attention.request('zoom-check-prompt', {
      open: opener('zoom-check-prompt', opened),
      priority: SCREEN_PRIORITY.zoomCheckPrompt,
    });
    expect(opened).toEqual([]);

    dialogs.closeDialog('something-else');
    await flushPromises();
    expect(opened).toEqual(['zoom-check-prompt']);
    expect(attention.isWaiting('feature-tip')).toBe(true);

    dialogs.closeDialog('zoom-check-prompt');
    await flushPromises();
    expect(opened).toEqual(['zoom-check-prompt', 'feature-tip']);
  });

  it('gives the turn to the next one when a request no longer wants it', async () => {
    const opened: string[] = [];
    useAttentionStore().claim('setup-wizard');
    useAttentionStore().request('missing-dates', {
      open: () => false,
      priority: SCREEN_PRIORITY.missingDates,
    });
    useAttentionStore().request('feature-tip', {
      open: opener('feature-tip', opened),
      priority: SCREEN_PRIORITY.featureTip,
    });

    useAttentionStore().release('setup-wizard');
    await nextTick();

    expect(opened).toEqual(['feature-tip']);
    expect(useAttentionStore().isWaiting('missing-dates')).toBe(false);
  });

  it('holds the screen until what it opened shows', async () => {
    const attention = useAttentionStore();
    // It opens something that registers only later.
    attention.request('quick-start-tour', {
      open: () => undefined,
      priority: SCREEN_PRIORITY.quickStartTour,
    });
    const opened: string[] = [];
    attention.request('feature-tip', {
      open: opener('feature-tip', opened),
      priority: SCREEN_PRIORITY.featureTip,
    });
    expect(opened).toEqual([]);

    // By Vue's next update, what it opened shows or it never will.
    await flushPromises();
    expect(opened).toEqual(['feature-tip']);
  });

  it('makes what comes after a kept place wait for it, and lets it go once released', async () => {
    const attention = useAttentionStore();
    const opened: string[] = [];
    attention.keepPlace(
      'zoom-display-question',
      SCREEN_PRIORITY.zoomDisplayQuestion,
    );
    attention.request('meeting-song-check', {
      open: opener('meeting-song-check', opened),
      priority: SCREEN_PRIORITY.meetingSongCheck,
    });
    expect(opened).toEqual([]);
    expect(attention.isWaiting('meeting-song-check')).toBe(true);

    attention.releasePlace('zoom-display-question');
    await nextTick();
    expect(opened).toEqual(['meeting-song-check']);
  });

  it('opens what comes before a kept place, or is what kept it', () => {
    const attention = useAttentionStore();
    const opened: string[] = [];
    attention.keepPlace('zoom-meeting-day', SCREEN_PRIORITY.zoomCheckPrompt);

    attention.request('zoom-check-prompt', {
      open: opener('zoom-check-prompt', opened),
      priority: SCREEN_PRIORITY.zoomCheckPrompt,
    });

    expect(opened).toEqual(['zoom-check-prompt']);
    expect(attention.isPlaceKept('zoom-meeting-day')).toBe(true);
  });

  it('forgets a withdrawn request', () => {
    const attention = useAttentionStore();
    attention.claim('setup-wizard');
    const opened: string[] = [];
    attention.request('feature-tip', {
      open: opener('feature-tip', opened),
      priority: SCREEN_PRIORITY.featureTip,
    });

    attention.withdraw('feature-tip');
    attention.release('setup-wizard');

    expect(opened).toEqual([]);
  });
});

describe('holdsNotifications', () => {
  it('lets notifications show with nothing on the screen', () => {
    expect(useAttentionStore().holdsNotifications).toBe(false);
  });

  it('holds them while a dialog covers the whole window, not an ordinary one', () => {
    const attention = useAttentionStore();
    const dialogs = useDialogStateStore();
    dialogs.openDialog('song-picker', 'BaseDialog');
    expect(attention.holdsNotifications).toBe(false);

    dialogs.openDialog('meeting-song-check', 'BaseDialog', undefined, {
      takeover: true,
    });
    expect(attention.holdsNotifications).toBe(true);

    dialogs.closeDialog('meeting-song-check');
    expect(attention.holdsNotifications).toBe(false);
  });

  it('holds them during a tour, not in the setup wizard', () => {
    const attention = useAttentionStore();
    attention.claim('setup-wizard');
    expect(attention.holdsNotifications).toBe(false);

    attention.claim('quick-start-tour', { takeover: true });
    expect(attention.holdsNotifications).toBe(true);

    attention.release('quick-start-tour');
    expect(attention.holdsNotifications).toBe(false);
  });

  // The next screen may cover the window: the free moment in between isn't
  // one for a notification to slip into.
  it('holds them while something is given its turn', async () => {
    const attention = useAttentionStore();
    attention.request('quick-start-tour', {
      open: () => undefined,
      priority: SCREEN_PRIORITY.quickStartTour,
    });
    expect(attention.holdsNotifications).toBe(true);

    await flushPromises();
    expect(attention.holdsNotifications).toBe(false);
  });

  it('lets them show while what waits has to wait for a kept place', () => {
    const attention = useAttentionStore();
    attention.keepPlace('zoom-meeting-day', SCREEN_PRIORITY.zoomCheckPrompt);
    attention.request('meeting-song-check', {
      open: () => undefined,
      priority: SCREEN_PRIORITY.meetingSongCheck,
    });

    expect(attention.isWaiting('meeting-song-check')).toBe(true);
    expect(attention.holdsNotifications).toBe(false);
  });
});
