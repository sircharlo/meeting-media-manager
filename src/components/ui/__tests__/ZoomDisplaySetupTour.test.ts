import { flushPromises, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import en from 'src/i18n/en.json';
import { useAttentionStore } from 'stores/attention';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomDisplaySetupStore } from 'stores/zoom-display-setup';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import DialogDisplayPopup from '../../dialog/DialogDisplayPopup.vue';
import MediaDisplayButton from '../../media/MediaDisplayButton.vue';
import ActionIsland from '../ActionIsland.vue';
import WizardSpotlight from '../WizardSpotlight.vue';
import ZoomDisplaySetupTour from '../ZoomDisplaySetupTour.vue';

installQuasarPlugin();
installPinia({ stubActions: false });

const store = () => useZoomDisplaySetupStore();

// By the button's label alone, in the card the tour teleports to the body.
const click = async (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (el) => el.querySelector('.block')?.textContent?.trim() === label,
  );
  if (!button) throw new Error(`No button labelled "${label}"`);
  button.click();
  await flushPromises();
};

const text = () => document.body.textContent ?? '';

// What clicking Hide or Show in the media display's menu ends up doing.
const setMediaDisplayVisible = async (visible: boolean) => {
  useCurrentStateStore().mediaWindowVisible = visible;
  await flushPromises();
};

beforeEach(() => {
  store().endTour();
  useCurrentStateStore().mediaWindowVisible = true;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ZoomDisplaySetupTour', () => {
  it('shows nothing until the setup starts it', async () => {
    const wrapper = mount(ZoomDisplaySetupTour, { attachTo: document.body });
    await flushPromises();
    expect(wrapper.findComponent(WizardSpotlight).exists()).toBe(false);
    wrapper.unmount();
  });

  it('points at the media display button, then at Hide and Show in its menu', async () => {
    const wrapper = mount(ZoomDisplaySetupTour, { attachTo: document.body });
    store().startTour();
    await flushPromises();

    const selector = () =>
      wrapper.findComponent(WizardSpotlight).props('selector');
    expect(selector()).toBe("[data-wizard-target='media-display-button']");
    expect(text()).toContain(en['zoom-display-tour-button-title']);

    await click('Next');
    expect(store().tourStep).toBe(1);
    expect(selector()).toBe("[data-wizard-target='media-display-toggle']");
    expect(text()).toContain(en['zoom-display-tour-hide-title']);

    await click('Next');
    expect(text()).toContain(en['zoom-display-tour-show-title']);

    await click('Close');
    expect(store().tourActive).toBe(false);
    expect(wrapper.findComponent(WizardSpotlight).exists()).toBe(false);
    wrapper.unmount();
  });

  it('moves on when the user clicks Hide, and ends when they click Show', async () => {
    const wrapper = mount(ZoomDisplaySetupTour, { attachTo: document.body });
    store().startTour();
    store().tourStep = 1;
    await flushPromises();

    await setMediaDisplayVisible(false);
    expect(store().tourStep).toBe(2);
    expect(text()).toContain(en['zoom-display-tour-show-title']);

    await setMediaDisplayVisible(true);
    expect(store().tourActive).toBe(false);
    wrapper.unmount();
  });

  it('stays put when the media display is hidden or shown at another step', async () => {
    const wrapper = mount(ZoomDisplaySetupTour, { attachTo: document.body });
    store().startTour();
    await flushPromises();

    await setMediaDisplayVisible(false);
    expect(store().tourStep).toBe(0);

    store().tourStep = 1;
    await setMediaDisplayVisible(true);
    expect(store().tourStep).toBe(1);
    wrapper.unmount();
  });

  // So that nothing opens on its own over it (see the attention store).
  it('holds the screen while it shows', async () => {
    const wrapper = mount(ZoomDisplaySetupTour, { attachTo: document.body });
    expect(useAttentionStore().isClaimed('zoom-display-tour')).toBe(false);

    store().startTour();
    await flushPromises();
    expect(useAttentionStore().isClaimed('zoom-display-tour')).toBe(true);

    await click('Skip tour');
    expect(useAttentionStore().isClaimed('zoom-display-tour')).toBe(false);
    wrapper.unmount();
  });

  it('ends at once on "Skip tour"', async () => {
    const wrapper = mount(ZoomDisplaySetupTour, { attachTo: document.body });
    store().startTour();
    await flushPromises();

    await click('Skip tour');

    expect(store().tourStep).toBeNull();
    wrapper.unmount();
  });
});

describe('ActionIsland during the tour', () => {
  // The island's own chip renders; its buttons and popups are stubs.
  const mountIsland = () =>
    mount(ActionIsland, {
      global: {
        stubs: Object.fromEntries(
          [
            'DialogBackgroundMusicPopup',
            'DialogDisplayPopup',
            'DialogDownloadsPopup',
            'DialogObsPopup',
            'DialogRecordingPopup',
            'DialogTimerPopup',
            'DialogZoomMeetingManagerPopup',
            'DownloadStatus',
            'MediaDisplayButton',
            'MusicButton',
            'ObsStatus',
            'RecordingStatus',
            'SubtitlesButton',
            'TimerButton',
            'ZoomMeetingManagerButton',
          ].map((name) => [name, true]),
        ),
      },
    });
  const displayMenuOpen = (wrapper: ReturnType<typeof mountIsland>) =>
    wrapper.findComponent(DialogDisplayPopup).props('modelValue');

  it('opens the media display menu for the steps pointing into it, and closes it after', async () => {
    const wrapper = mountIsland();
    store().startTour();
    await flushPromises();
    expect(displayMenuOpen(wrapper)).toBe(false);

    store().tourStep = 1;
    await flushPromises();
    expect(displayMenuOpen(wrapper)).toBe(true);

    store().endTour();
    await flushPromises();
    expect(displayMenuOpen(wrapper)).toBe(false);
    wrapper.unmount();
  });

  it('moves the tour on when the user opens the menu themselves', async () => {
    const wrapper = mountIsland();
    store().startTour();
    await flushPromises();

    wrapper
      .findComponent(MediaDisplayButton)
      .vm.$emit('update:modelValue', true);
    await flushPromises();

    expect(store().tourStep).toBe(1);
    expect(displayMenuOpen(wrapper)).toBe(true);
    wrapper.unmount();
  });

  it('leaves the menu alone when the tour never got to it', async () => {
    const wrapper = mountIsland();
    wrapper
      .findComponent(MediaDisplayButton)
      .vm.$emit('update:modelValue', true);
    await flushPromises();
    store().startTour();
    store().tourStep = 0;
    await flushPromises();

    store().endTour();
    await flushPromises();

    expect(displayMenuOpen(wrapper)).toBe(true);
    wrapper.unmount();
  });
});
