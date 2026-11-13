import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import {
  answerZoomCheckPrompt,
  askBeforeCheckingZoom,
} from 'src/helpers/zoom-check-prompt';
import { useZoomStateStore } from 'stores/zoom-state';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import DialogZoomCheckPrompt from '../DialogZoomCheckPrompt.vue';

installQuasarPlugin();
// The store's actions are what closes the question, so they must really run.
installPinia({ stubActions: false });

// The Quasar dialog itself is not what is under test here: the question's
// visibility and the answer it produces are.
const BaseDialogStub = {
  name: 'BaseDialog',
  props: ['modelValue'],
  template: '<div class="base-dialog-stub"><slot /></div>',
};

let wrapper: VueWrapper;

const zoomState = () => useZoomStateStore();

const dialogs = () =>
  wrapper.findAllComponents({ name: 'ConfirmDialog' }).map((dialog) => ({
    id: dialog.props('dialogId') as string,
    open: dialog.props('modelValue') as boolean,
  }));

const dialog = (id: string) =>
  wrapper
    .findAllComponents({ name: 'ConfirmDialog' })
    .find((candidate) => candidate.props('dialogId') === id);

const mountPrompt = async () => {
  wrapper = mount(DialogZoomCheckPrompt, {
    global: { stubs: { BaseDialog: BaseDialogStub } },
  });
  await flushPromises();
};

beforeEach(() => {
  zoomState().closeCheckPrompt();
});

afterEach(() => {
  // Leaves no question waiting for the next test.
  answerZoomCheckPrompt('skip');
  wrapper.unmount();
});

describe('DialogZoomCheckPrompt', () => {
  it('closes and runs the check when the user says yes', async () => {
    await mountPrompt();
    const answer = askBeforeCheckingZoom(60_000);
    await flushPromises();
    expect(dialog('zoom-check-prompt')?.props('modelValue')).toBe(true);

    dialog('zoom-check-prompt')?.vm.$emit('confirm');
    await flushPromises();

    expect(dialog('zoom-check-prompt')?.props('modelValue')).toBe(false);
    expect(await answer).toBe('run');
  });

  it('closes even when nothing is waiting for the answer', async () => {
    await mountPrompt();
    // Shown without a pending ask, e.g. left over from a question that already
    // timed out: the button must still dismiss it.
    zoomState().promptForCheck();
    await flushPromises();

    dialog('zoom-check-prompt')?.vm.$emit('confirm');
    await flushPromises();

    expect(dialogs().find((d) => d.id === 'zoom-check-prompt')?.open).toBe(
      false,
    );
  });

  it('asks before turning the automations off, then turns them off', async () => {
    await mountPrompt();
    const answer = askBeforeCheckingZoom(60_000);
    await flushPromises();

    dialog('zoom-check-prompt')?.vm.$emit('cancel');
    await flushPromises();
    expect(dialog('zoom-check-skip-confirm')?.props('modelValue')).toBe(true);
    // The question underneath stays up until it is answered.
    expect(dialog('zoom-check-prompt')?.props('modelValue')).toBe(true);

    dialog('zoom-check-skip-confirm')?.vm.$emit('confirm');
    await flushPromises();

    expect(await answer).toBe('skip');
    expect(dialogs().every((d) => !d.open)).toBe(true);
  });

  it('closes, with the skip confirmation, when Test again answers it', async () => {
    await mountPrompt();
    const answer = askBeforeCheckingZoom(60_000);
    await flushPromises();
    dialog('zoom-check-prompt')?.vm.$emit('cancel');
    await flushPromises();
    expect(dialog('zoom-check-skip-confirm')?.props('modelValue')).toBe(true);

    // Test again, from a notification above the question: the go-ahead (see
    // runZoomStartupCheck).
    answerZoomCheckPrompt('run');
    await flushPromises();

    expect(dialogs().every((d) => !d.open)).toBe(true);
    expect(await answer).toBe('run');
  });

  it('goes back to the question when the user keeps the automations on', async () => {
    await mountPrompt();
    const answer = askBeforeCheckingZoom(60_000);
    await flushPromises();

    dialog('zoom-check-prompt')?.vm.$emit('cancel');
    await flushPromises();
    expect(dialog('zoom-check-skip-confirm')?.props('modelValue')).toBe(true);

    dialog('zoom-check-skip-confirm')?.vm.$emit('cancel');
    await flushPromises();

    // Back to the question, still waiting to be answered.
    expect(dialog('zoom-check-skip-confirm')?.props('modelValue')).toBe(false);
    expect(dialog('zoom-check-prompt')?.props('modelValue')).toBe(true);
    expect(zoomState().checkPrompt).toBe(true);
    answerZoomCheckPrompt('run');
    expect(await answer).toBe('run');
  });
});
