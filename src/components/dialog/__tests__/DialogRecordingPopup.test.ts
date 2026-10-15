import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useRecordingStore } from 'stores/recording-state';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DialogRecordingPopup from '../DialogRecordingPopup.vue';

installQuasarPlugin();
// Actions stay stubbed: clicking start/stop only has to reach the store.
installPinia();

const CONGREGATION_ID = 'test-cong';

let wrapper: undefined | VueWrapper;

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  useRecordingStore().isRecording = false;
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const mountPopup = async (settings: Partial<typeof defaultSettings> = {}) => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, ...settings },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;

  wrapper = mount(DialogRecordingPopup, {
    props: { modelValue: true },
  });
  await flushPromises();
};

// QMenu teleports its content to document.body, outside the wrapper's tree.
const getStatus = () => document.querySelector('.action-popup__status');
const getFooter = () => document.querySelector('.action-popup__footer');

describe('DialogRecordingPopup', () => {
  it('says when nothing is being recorded, and offers to start', async () => {
    await mountPopup();

    expect(getStatus()?.textContent).toContain('Not recording');
    expect(getStatus()?.querySelector('.text-grey')).not.toBeNull();

    const mainAction = getFooter()?.firstElementChild as HTMLButtonElement;
    expect(mainAction.textContent).toContain('Start Recording');
    mainAction.click();
    expect(useRecordingStore().toggleRecording).toHaveBeenCalledOnce();
  });

  it('shows how long the recording has run, and offers to stop', async () => {
    const recording = useRecordingStore();
    recording.isRecording = true;
    recording.recordingDurationMs = 724_000;

    await mountPopup();

    expect(getStatus()?.textContent).toContain('Recording · 12:04');
    expect(getStatus()?.querySelector('.text-negative')).not.toBeNull();
    expect(getFooter()?.firstElementChild?.textContent).toContain(
      'Stop Recording',
    );
  });

  it('only offers the recording folder when one is set, under the main action', async () => {
    await mountPopup();
    expect(document.querySelector('.action-popup__footer-row')).toBeNull();
    wrapper?.unmount();
    document.body.innerHTML = '';

    const openFolderSpy = vi
      .spyOn(globalThis.electronApi, 'openFolder')
      .mockResolvedValue('');
    await mountPopup({ recordingFolder: 'C:/Recordings' });

    const folderButton = getFooter()?.querySelector<HTMLButtonElement>(
      '.action-popup__footer-row button',
    );
    expect(folderButton?.textContent).toContain('Open recording folder');
    folderButton?.click();
    expect(openFolderSpy).toHaveBeenCalledWith('C:/Recordings');
  });
});
