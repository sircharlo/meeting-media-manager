import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import en from 'src/i18n/en.json';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogZoomCheckResult from '../DialogZoomCheckResult.vue';

const check = vi.hoisted(() => ({ run: vi.fn() }));

vi.mock('src/helpers/zoom-startup-check', () => ({
  runZoomStartupCheck: check.run,
}));

installQuasarPlugin();
installPinia({ stubActions: false });

const CAPTION = "M³ checked Zoom and this didn't work: muting everyone.";

let wrapper: undefined | VueWrapper;

const text = () => document.body.textContent ?? '';

// By the button's label alone: an icon's name is in its text too.
const click = async (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (el) => el.querySelector('.block')?.textContent?.trim() === label,
  );
  if (!button) {
    const labels = Array.from(document.querySelectorAll('button')).map(
      (el) => el.textContent,
    );
    throw new Error(
      `No button labelled "${label}" in ${JSON.stringify(labels)}`,
    );
  }
  button.click();
  await flushPromises();
};

const showResult = async (relearn = false) => {
  wrapper = mount(DialogZoomCheckResult, { attachTo: document.body });
  useZoomStateStore().showFailedCheck({ caption: CAPTION, relearn });
  await flushPromises();
};

beforeEach(() => {
  useZoomStateStore().closeFailedCheck();
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('DialogZoomCheckResult', () => {
  it('says what failed, and tests again on "Test again"', async () => {
    await showResult();
    expect(text()).toContain('Zoom automations paused');
    expect(text()).toContain(CAPTION);

    await click('Test again');

    expect(check.run).toHaveBeenCalledWith({ manual: true });
    expect(useZoomStateStore().failedCheck).toBeNull();
  });

  // Zoom's buttons no longer read as learned: testing again wouldn't help.
  it('opens the setup assistant when Zoom changed', async () => {
    const dispatch = vi.spyOn(globalThis, 'dispatchEvent');
    await showResult(true);

    await click('Open setup assistant');

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'openZoomSetupAssistant' }),
    );
    expect(check.run).not.toHaveBeenCalled();
    expect(useZoomStateStore().failedCheck).toBeNull();
  });

  // It changes today's meeting: whoever runs Zoom does it all by hand.
  it('leaves Zoom to the user, once confirmed', async () => {
    await showResult();

    await click(en['zoom-check-result-by-hand']);
    expect(text()).toContain(en['zoom-check-skip-confirm-title']);
    expect(useZoomStateStore().failedCheck).not.toBeNull();

    await click(en['zoom-check-skip-confirm-action']);

    expect(check.run).not.toHaveBeenCalled();
    expect(useZoomStateStore().failedCheck).toBeNull();
  });

  it('keeps the result on "Keep them on"', async () => {
    await showResult();
    await click(en['zoom-check-result-by-hand']);

    await click(en['zoom-check-skip-confirm-cancel']);

    expect(useZoomStateStore().failedCheck).not.toBeNull();
    expect(text()).toContain(en['zoom-check-test-again']);
  });

  it('closes the confirmation along with the result', async () => {
    await showResult();
    await click(en['zoom-check-result-by-hand']);

    // The setup assistant opening, or a newer check.
    useZoomStateStore().closeFailedCheck();
    await flushPromises();
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    expect(text()).not.toContain(en['zoom-check-skip-confirm-title']);
  });
});
