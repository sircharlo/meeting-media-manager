import { mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useSettingsPinAttempts } from 'src/composables/useSettingsPinAttempts';
import { defaultSettings } from 'src/constants/settings';
import { hashSettingsPin } from 'src/utils/settings-pin';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import SettingsPinGate from '../SettingsPinGate.vue';

installQuasarPlugin();
installPinia();

const CONGREGATION_ID = 'test-cong';
const FORGOT = 'Forgot the PIN?';

let wrapper: VueWrapper;
let storedPin = '';

const mountGate = () => {
  wrapper = mount(SettingsPinGate, {
    global: { stubs: { DialogSettingsPinReset: true } },
  });
};

const settings = () => useCurrentStateStore().currentSettings;

const submitPin = async (pin: string) => {
  await wrapper.find('form input').setValue(pin);
  await wrapper.find('form').trigger('submit');
};

const failOnce = async () => {
  await submitPin('0000');
  await vi.waitFor(() =>
    expect(wrapper.text()).toContain("That PIN isn't right"),
  );
  // The next wrong try shows the same message, so wait for this one to end.
  await vi.waitFor(() =>
    expect(wrapper.find('form input').element).toHaveProperty('value', ''),
  );
};

beforeEach(async () => {
  storedPin = await hashSettingsPin('4321');
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, settingsPin: storedPin },
  };
  const state = useCurrentStateStore();
  state.currentCongregation = CONGREGATION_ID;
  state.settingsPinFailedAttempts = {};
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

    await failOnce();

    expect(useCurrentStateStore().settingsLocked).toBe(true);
  });

  it('only offers resetting the PIN after three wrong tries', async () => {
    mountGate();
    expect(wrapper.text()).not.toContain(FORGOT);

    await failOnce();
    await failOnce();
    expect(wrapper.text()).not.toContain(FORGOT);

    await failOnce();
    await vi.waitFor(() => expect(wrapper.text()).toContain(FORGOT));
  });

  it('counts wrong tries made elsewhere, such as when deleting the profile', async () => {
    mountGate();
    const elsewhere = useSettingsPinAttempts(CONGREGATION_ID);

    await elsewhere.checkPin('0000', storedPin);
    await elsewhere.checkPin('1111', storedPin);
    await elsewhere.checkPin('2222', storedPin);
    await nextTick();

    expect(wrapper.text()).toContain(FORGOT);
  });

  it('starts counting again after the right PIN', async () => {
    const attempts = useSettingsPinAttempts(CONGREGATION_ID);

    await attempts.checkPin('0000', storedPin);
    await attempts.checkPin('1111', storedPin);
    await attempts.checkPin('4321', storedPin);
    await attempts.checkPin('2222', storedPin);

    expect(attempts.canReset.value).toBe(false);
    mountGate();
  });

  it('keeps the count of each profile apart', async () => {
    const other = useSettingsPinAttempts('other-cong');

    await other.checkPin('0000', storedPin);
    await other.checkPin('1111', storedPin);
    await other.checkPin('2222', storedPin);

    expect(other.canReset.value).toBe(true);
    expect(useSettingsPinAttempts(CONGREGATION_ID).canReset.value).toBe(false);
    mountGate();
  });
});
