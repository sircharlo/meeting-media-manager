import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogSettingsPinReset from '../DialogSettingsPinReset.vue';

const { removeFile, writeFile } = vi.hoisted(() => ({
  removeFile: vi.fn(),
  writeFile: vi.fn(async () => 'C:\\Data\\M3'),
}));

vi.mock('src/utils/settings-pin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  createSettingsPinResetCode: () => '123456',
  removeSettingsPinResetFile: removeFile,
  writeSettingsPinResetFile: writeFile,
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

const settings = () =>
  useCongregationSettingsStore().congregations[CONGREGATION_ID];

const openDialog = async () => {
  wrapper = mount(DialogSettingsPinReset, {
    global: { stubs: { ConfirmDialog: ConfirmDialogStub } },
    props: { congregationId: CONGREGATION_ID, modelValue: false },
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();
};

const dialog = () => wrapper.findComponent({ name: 'ConfirmDialog' });

const confirmWith = async (code: string) => {
  await wrapper.find('input').setValue(code);
  dialog().vm.$emit('confirm');
  await flushPromises();
};

beforeEach(() => {
  vi.clearAllMocks();
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, settingsPin: 'stored-hash' },
  };
  useCurrentStateStore().settingsPinFailedAttempts = { [CONGREGATION_ID]: 3 };
});

afterEach(() => {
  wrapper.unmount();
});

describe('DialogSettingsPinReset', () => {
  it('shows the folder and who may do this, but not the file or a way to open it', async () => {
    await openDialog();

    expect(writeFile).toHaveBeenCalledOnce();
    expect(wrapper.text()).toContain('C:\\Data\\M3');
    expect(wrapper.text()).toContain('authorized');
    expect(wrapper.text()).not.toContain('.txt');
    expect(wrapper.text()).not.toContain('Open folder');
  });

  it('keeps the PIN when the code is wrong', async () => {
    await openDialog();

    await confirmWith('000000');

    expect(settings()?.settingsPin).toBe('stored-hash');
    expect(wrapper.text()).toContain("That code isn't right");
    expect(removeFile).not.toHaveBeenCalled();
  });

  it('removes the PIN and the file with the right code', async () => {
    await openDialog();

    await confirmWith('123456');

    expect(settings()?.settingsPin).toBeNull();
    expect(removeFile).toHaveBeenCalledOnce();
    expect(useCurrentStateStore().settingsPinFailedAttempts).toEqual({
      [CONGREGATION_ID]: 0,
    });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
  });

  it('removes the file when cancelled, and keeps the PIN', async () => {
    await openDialog();

    dialog().vm.$emit('cancel');
    await flushPromises();

    expect(removeFile).toHaveBeenCalledOnce();
    expect(settings()?.settingsPin).toBe('stored-hash');
  });
});
