import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { useScreenClaim } from 'src/composables/useScreenClaim';
import { useAttentionStore } from 'stores/attention';
import { useCurrentStateStore } from 'stores/current-state';
import { useDialogStateStore } from 'stores/dialog-state';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

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
  const mountClaimer = (active: ReturnType<typeof ref<boolean>>) =>
    mount(
      defineComponent({
        setup() {
          useScreenClaim('some-tour', () => !!active.value);
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

  it('releases the screen when the component goes away', () => {
    const wrapper = mountClaimer(ref(true));
    expect(useAttentionStore().isClaimed('some-tour')).toBe(true);

    wrapper.unmount();
    expect(useAttentionStore().isScreenTaken).toBe(false);
  });
});
