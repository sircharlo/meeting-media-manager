import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TextInput from '../TextInput.vue';

const { createTemporaryNotificationMock } = vi.hoisted(() => ({
  createTemporaryNotificationMock: vi.fn(),
}));

vi.mock('src/helpers/notifications', () => ({
  createTemporaryNotification: createTemporaryNotificationMock,
}));

installQuasarPlugin();
installPinia();

// FE-7 (full-audit-2026-09-04.md): a free-text setting (e.g. obsPort) wrote
// straight through to the persisted store on every keystroke, with nothing
// stopping an out-of-range value from being saved exactly as typed and
// staying that way indefinitely. No congregation/currentSettings setup is
// needed here - the 'portNumber' rule under test doesn't consult
// disableMediaFetching (only 'notEmpty' does).
describe('TextInput - revert on invalid focusout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reverts to the last valid value on focusout with an out-of-range port', async () => {
    const wrapper = mount(TextInput, {
      props: {
        modelValue: '4455',
        'onUpdate:modelValue': (value: null | string) => {
          void wrapper.setProps({ modelValue: value });
        },
        rules: ['portNumber'],
        settingId: 'obsPort',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('999999');
    await input.trigger('focusout');

    expect(wrapper.props('modelValue')).toBe('4455');
    expect(createTemporaryNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative' }),
    );
  });

  it('keeps a valid edit and does not notify', async () => {
    const wrapper = mount(TextInput, {
      props: {
        modelValue: '4455',
        'onUpdate:modelValue': (value: null | string) => {
          void wrapper.setProps({ modelValue: value });
        },
        rules: ['portNumber'],
        settingId: 'obsPort',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('8080');
    await input.trigger('focusout');

    expect(wrapper.props('modelValue')).toBe('8080');
    expect(createTemporaryNotificationMock).not.toHaveBeenCalled();
  });

  it('treats a newly-committed valid value as the new revert target', async () => {
    const wrapper = mount(TextInput, {
      props: {
        modelValue: '4455',
        'onUpdate:modelValue': (value: null | string) => {
          void wrapper.setProps({ modelValue: value });
        },
        rules: ['portNumber'],
        settingId: 'obsPort',
      },
    });

    const input = wrapper.find('input');
    await input.setValue('8080');
    await input.trigger('focusout');
    expect(wrapper.props('modelValue')).toBe('8080');

    await input.setValue('not-a-port');
    await input.trigger('focusout');

    expect(wrapper.props('modelValue')).toBe('8080');
  });

  it('does not revert or notify on focusout without having changed the value', async () => {
    const wrapper = mount(TextInput, {
      props: {
        modelValue: '4455',
        'onUpdate:modelValue': (value: null | string) => {
          void wrapper.setProps({ modelValue: value });
        },
        rules: ['portNumber'],
        settingId: 'obsPort',
      },
    });

    await wrapper.find('input').trigger('focusout');

    expect(wrapper.props('modelValue')).toBe('4455');
    expect(createTemporaryNotificationMock).not.toHaveBeenCalled();
  });
});
