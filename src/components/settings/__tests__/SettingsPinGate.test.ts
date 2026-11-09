import { mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { hashSettingsPin } from 'src/utils/settings-pin';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SettingsPinGate from '../SettingsPinGate.vue';

vi.mock('src/utils/settings-pin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createSettingsPinResetCode: () => '123456',
  openSettingsPinResetFolder: vi.fn(),
  removeSettingsPinResetFile: vi.fn(),
  writeSettingsPinResetFile: vi.fn(async () => 'reset.txt'),
}));

installQuasarPlugin();
installPinia();

const CONGREGATION_ID = 'test-cong';
const ConfirmDialogStub = {
  emits: ['cancel', 'confirm'],
  name: 'ConfirmDialog',
  props: ['modelValue'],
  template: '<div class="confirm-stub"><slot /></div>',
};

let wrapper: VueWrapper;

const mountGate = () => {
  wrapper = mount(SettingsPinGate, {
    global: { stubs: { ConfirmDialog: ConfirmDialogStub } },
  });
};

const settings = () => useCurrentStateStore().currentSettings;

const submitPin = async (pin: string) => {
  await wrapper.find('form input').setValue(pin);
  await wrapper.find('form').trigger('submit');
};

const clickForgot = async () => {
  const forgot = wrapper
    .findAll('button')
    .find((button) => button.text().includes('Forgot the PIN?'));
  await forgot?.trigger('click');
  await vi.waitFor(() => expect(wrapper.text()).toContain('reset.txt'));
};

const confirmReset = async (code: string) => {
  await wrapper.find('.confirm-stub input').setValue(code);
  wrapper.findComponent({ name: 'ConfirmDialog' }).vm.$emit('confirm');
  await wrapper.vm.$nextTick();
};

beforeEach(async () => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      settingsPin: await hashSettingsPin('4321'),
    },
  };
  const state = useCurrentStateStore();
  state.currentCongregation = CONGREGATION_ID;
  state.settingsUnlocked = false;
});

afterEach(() => {
  wrapper.unmount();
});

describe('SettingsPinGate', () => {
  it('locks a profile that has a PIN, and not one that has none', () => {
    mountGate();
    expect(useCurrentStateStore().settingsLocked).toBe(true);

    const current = settings();
    if (current) current.settingsPin = null;

    expect(useCurrentStateStore().settingsLocked).toBe(false);
  });

  it('unlocks with the right PIN', async () => {
    mountGate();

    await submitPin('4321');

    await vi.waitFor(() =>
      expect(useCurrentStateStore().settingsUnlocked).toBe(true),
    );
    expect(useCurrentStateStore().settingsLocked).toBe(false);
  });

  it('stays locked with the wrong PIN and says so', async () => {
    mountGate();

    await submitPin('0000');

    await vi.waitFor(() =>
      expect(wrapper.text()).toContain("That PIN isn't right"),
    );
    expect(useCurrentStateStore().settingsLocked).toBe(true);
  });

  it('keeps the PIN when the reset code is wrong', async () => {
    mountGate();
    await clickForgot();

    await confirmReset('000000');

    expect(settings()?.settingsPin).toBeTruthy();
    expect(useCurrentStateStore().settingsLocked).toBe(true);
    expect(wrapper.text()).toContain("That code isn't right");
  });

  it('removes the PIN with the code from the reset file', async () => {
    mountGate();
    await clickForgot();

    await confirmReset('123456');

    expect(settings()?.settingsPin).toBeNull();
    expect(useCurrentStateStore().settingsLocked).toBe(false);
  });
});
