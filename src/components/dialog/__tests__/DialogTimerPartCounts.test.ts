import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import useTimer from 'src/composables/useTimer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogTimerPartCounts from '../DialogTimerPartCounts.vue';

// The question only shows what useTimer is waiting for and hands the answer
// back; the timer itself is tested in src/composables/__tests__.
vi.mock('src/composables/useTimer', async () => {
  const { ref } = await import('vue');
  const timer = {
    ayfmPartsCount: ref(3),
    cancelPendingPartStart: vi.fn(),
    confirmPartCounts: vi.fn(),
    lacPartsCount: ref(2),
    pendingPartStart: ref<null | { part: string; requestedAt: number }>(null),
  };
  return { default: () => timer };
});

installQuasarPlugin();
installPinia();

// The Quasar dialog itself is not what is under test here: the question's
// visibility and the answer it produces are.
const BaseDialogStub = {
  name: 'BaseDialog',
  props: ['modelValue'],
  template: '<div class="base-dialog-stub"><slot /></div>',
};

let wrapper: VueWrapper;

const timer = () => useTimer();

const confirmDialog = () => wrapper.findComponent({ name: 'ConfirmDialog' });

// The toggle's buttons, by section (0: Apply Yourself, 1: Living as Christians).
const toggleButtons = (section: number) =>
  wrapper.findAll('.q-btn-toggle')[section]?.findAll('button') ?? [];

const ask = async () => {
  timer().pendingPartStart.value = {
    part: 'introduction',
    requestedAt: 1000,
  };
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  timer().pendingPartStart.value = null;
  timer().ayfmPartsCount.value = 3;
  timer().lacPartsCount.value = 2;
  wrapper = mount(DialogTimerPartCounts, {
    global: { stubs: { BaseDialog: BaseDialogStub } },
  });
});

afterEach(() => {
  wrapper.unmount();
});

describe('DialogTimerPartCounts', () => {
  it('opens only while a part waits for the number of parts', async () => {
    expect(confirmDialog().props('modelValue')).toBe(false);

    await ask();

    expect(confirmDialog().props('modelValue')).toBe(true);
    expect(wrapper.text()).toContain('How many parts does this meeting have?');
  });

  it('offers 1 to 5 Apply Yourself parts and 1 to 3 Living as Christians parts', async () => {
    await ask();

    expect(toggleButtons(0).map((button) => button.text())).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
    ]);
    expect(toggleButtons(1).map((button) => button.text())).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('hands back the counts chosen, starting from the current ones', async () => {
    timer().ayfmPartsCount.value = 2;
    await ask();

    await toggleButtons(1)[0]?.trigger('click');
    confirmDialog().vm.$emit('confirm');

    expect(timer().confirmPartCounts).toHaveBeenCalledWith({ ayfm: 2, lac: 1 });
  });

  it('starts nothing when cancelled', async () => {
    await ask();

    confirmDialog().vm.$emit('cancel');

    expect(timer().cancelPendingPartStart).toHaveBeenCalledOnce();
    expect(timer().confirmPartCounts).not.toHaveBeenCalled();
  });
});
