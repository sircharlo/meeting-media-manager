import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import DialogFileImport from '../DialogFileImport.vue';

installQuasarPlugin();
installPinia({ stubActions: false });

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const mountDialog = async (totalFiles = 0) => {
  const wrapper = mount(DialogFileImport, {
    attachTo: document.body,
    props: {
      currentFile: 0,
      dialogId: 'file-import-test',
      modelValue: true,
      section: undefined,
      totalFiles,
    },
  });
  await nextTick();
  await nextTick();
  return wrapper;
};

const findDropArea = () =>
  document.querySelector<HTMLElement>('.dashed-border.bg-accent-100');

// The drop zone's "click to browse" used to be mouse-only: a keyboard user
// opening "Import media" could not reach the file picker from this dialog.
describe('DialogFileImport - keyboard browsing', () => {
  it('exposes the idle drop zone as a focusable button that browses on Enter/Space', async () => {
    const openFileDialog = vi
      .spyOn(globalThis.electronApi, 'openFileDialog')
      .mockResolvedValue({ canceled: true, filePaths: [] });
    const wrapper = await mountDialog();

    const dropArea = findDropArea();
    expect(dropArea).not.toBeNull();
    expect(dropArea?.getAttribute('role')).toBe('button');
    expect(dropArea?.getAttribute('tabindex')).toBe('0');

    dropArea?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    dropArea?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: ' ' }),
    );
    expect(openFileDialog).toHaveBeenCalledTimes(2);

    wrapper.unmount();
  });

  it('is not a button (and does not browse) while showing import progress', async () => {
    const openFileDialog = vi
      .spyOn(globalThis.electronApi, 'openFileDialog')
      .mockResolvedValue({ canceled: true, filePaths: [] });
    const wrapper = await mountDialog(3);

    const dropArea = findDropArea();
    expect(dropArea).not.toBeNull();
    expect(dropArea?.hasAttribute('role')).toBe(false);
    expect(dropArea?.hasAttribute('tabindex')).toBe(false);

    dropArea?.dispatchEvent(
      new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }),
    );
    dropArea?.click();
    expect(openFileDialog).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
