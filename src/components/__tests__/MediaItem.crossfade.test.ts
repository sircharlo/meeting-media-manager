import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { basePath } from 'app/test/vitest/mocks/electronApi';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { ensureFile, writeFile } from 'fs-extra';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { join } from 'upath';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { watch } from 'vue';

import MediaItem from '../media/MediaItem.vue';

installQuasarPlugin();
installPinia();

afterEach(() => {
  document.body.innerHTML = '';
});

const CONGREGATION_ID = 'crossfade-test-cong';

describe('MediaItem switching from one picture to another', () => {
  // The media window crossfades when the URL it gets goes straight from one
  // picture to the next. If it goes through no media at all on the way, the
  // first picture fades out to the yeartext (or the custom background)
  // before the next one fades in.
  it('hands the media window the next picture directly, never no media in between', async () => {
    useCongregationSettingsStore().congregations = {
      [CONGREGATION_ID]: { ...defaultSettings, enableMediaDisplayButton: true },
    };
    const currentState = useCurrentStateStore();
    currentState.currentCongregation = CONGREGATION_ID;

    const filePath = join(basePath, 'media-item-crossfade', 'second.jpg');
    const contents = Buffer.from('z'.repeat(1024));
    await ensureFile(filePath);
    await writeFile(filePath, contents);

    const media = {
      filesize: contents.byteLength,
      fileUrl: `file://${filePath.replaceAll('\\', '/')}`,
      isImage: true,
      title: 'Second picture',
      type: 'media' as const,
      uniqueId: 'crossfade-second-picture',
    };

    currentState.mediaPlaying = {
      ...currentState.mediaPlaying,
      action: 'play',
      uniqueId: 'crossfade-first-picture',
      url: 'file:///C:/media/first.jpg',
    };

    const wrapper = mount(MediaItem, { props: { media, repeat: false } });
    // The play button turns ready once the file is found on disk.
    await vi.waitFor(() => {
      expect(wrapper.find('button.bg-primary').exists()).toBe(true);
    });

    const urls: string[] = [];
    const stopWatching = watch(
      () => currentState.mediaPlaying.url,
      (url) => urls.push(url),
      { flush: 'sync' },
    );

    await wrapper.find('button.bg-primary').trigger('click');
    await vi.waitFor(() => {
      expect(currentState.mediaPlaying.url).toBe(media.fileUrl);
    });

    expect(urls).toEqual([media.fileUrl]);

    stopWatching();
    wrapper.unmount();
  });
});
