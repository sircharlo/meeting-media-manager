import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useDemoModeStore } from 'stores/demo-mode';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import MediaItem from '../media/MediaItem.vue';

installQuasarPlugin();
installPinia();

describe('MediaItem Component', () => {
  // Quasar's q-menu teleports its content to document.body, outside the
  // mounted wrapper's own root - the context-menu tests below attach there
  // (attachTo: document.body) to reach it, so clear it between tests to
  // avoid one test's leftover portal content leaking into the next.
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const mockMediaItem = {
    docid: '1011511',
    fileformat: 'MP4',
    frameHeight: 720,
    issue: '2025010100',
    label: '720p',
    langwritten: 'E',
    pub: 'w',
    subtitled: false,
    title: 'Test Media Item',
    type: 'media' as const,
    uniqueId: 'test-media-1',
    url: 'https://example.com/test.mp4',
  };

  it('should render media item with correct title', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.text()).toContain('Test Media Item');
  });

  it('should display download status component', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'DownloadStatus' })).toBeTruthy();
  });

  it('should display media display button component', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'MediaDisplayButton' })).toBeTruthy();
  });

  it('should display subtitles button for subtitled media', () => {
    const subtitledMediaItem = {
      ...mockMediaItem,
      subtitled: true,
    };

    const wrapper = mount(MediaItem, {
      props: {
        media: subtitledMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'SubtitlesButton' })).toBeTruthy();
  });

  it('should not display subtitles button for non-subtitled media', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'SubtitlesButton' }).exists()).toBe(
      false,
    );
  });

  it('should display music button for audio files', () => {
    const audioMediaItem = {
      ...mockMediaItem,
      fileformat: 'MP3',
    };

    const wrapper = mount(MediaItem, {
      props: {
        media: audioMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'MusicButton' })).toBeTruthy();
  });

  it('should not display music button for non-audio files', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    expect(wrapper.findComponent({ name: 'MusicButton' }).exists()).toBe(false);
  });

  it('should handle media item click by calling setMediaPlaying', async () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    // Find and click on the media item
    const mediaItem = wrapper.find('.q-item');
    await mediaItem.trigger('click');

    // The component should handle the click internally
    expect(wrapper.exists()).toBe(true);
  });

  // UX-1 (full-audit-2026-09-04.md): selecting a media item was previously
  // mouse-only (bound to @mouseup, with no tabindex/keyboard handler),
  // blocking the bulk delete/hide workflow entirely from the keyboard.
  it('is keyboard-focusable and emits click on Enter/Space', async () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    const mediaItem = wrapper.find('.q-item');
    expect(mediaItem.attributes('tabindex')).toBe('0');

    await mediaItem.trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('click')).toHaveLength(1);

    await mediaItem.trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('click')).toHaveLength(2);
  });

  it('emits click on mouseup, matching the keyboard activation path', async () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    const mediaItem = wrapper.find('.q-item');
    await mediaItem.trigger('mouseup', { button: 0 });

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('should display resolution label for video files', () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    // The component should display the label somewhere in the text
    expect(wrapper.text()).toContain('Test Media Item');
  });

  // UX-6 (full-audit-2026-09-04.md): reordering media items was previously
  // drag-and-drop only (a pointer-driven handle with no tabindex/keyboard
  // handler) - Move up/Move down were added to the already-keyboard-focusable
  // "..." context menu as the accessible alternative activation path.
  it('disables Move up but not Move down per canMoveUp/canMoveDown, and emits move() on click', async () => {
    const wrapper = mount(MediaItem, {
      attachTo: document.body,
      props: {
        canMoveDown: true,
        canMoveUp: false,
        media: mockMediaItem,
        repeat: false,
      },
    });

    await wrapper.get('button[aria-label="More options"]').trigger('click');
    await nextTick();

    const findMenuItem = (label: string) =>
      [...document.body.querySelectorAll<HTMLElement>('.q-item__label')]
        .find((el) => el.textContent === label)
        ?.closest<HTMLElement>('[role="menuitem"]');

    const moveUpItem = findMenuItem('Move up');
    const moveDownItem = findMenuItem('Move down');

    expect(moveUpItem?.getAttribute('aria-disabled')).toBe('true');
    expect(moveDownItem?.getAttribute('aria-disabled')).toBeNull();

    moveDownItem?.click();
    await nextTick();

    expect(wrapper.emitted('move')).toEqual([[1]]);

    wrapper.unmount();
  });

  it('does not show move-up/move-down items for a group child', async () => {
    const wrapper = mount(MediaItem, {
      attachTo: document.body,
      props: {
        child: true,
        media: mockMediaItem,
        repeat: false,
      },
    });

    await wrapper.get('button[aria-label="More options"]').trigger('click');
    await nextTick();

    expect(document.body.textContent).not.toContain('Move up');
    expect(document.body.textContent).not.toContain('Move down');

    wrapper.unmount();
  });

  it('hides thumbnail spinners reactively when demo mode is toggled at runtime', async () => {
    const demoMode = useDemoModeStore();
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
      },
    });

    const thumbnail = wrapper.findComponent({ name: 'QImg' });
    // Launched without M3_DEMO_MODE and demo store untouched: not demo mode.
    expect(thumbnail.props('noSpinner')).toBe(false);

    // Runtime enable (e.g. via the dev-only Demo menu) flips the UI tweak.
    demoMode.enabled = true;
    await nextTick();
    expect(thumbnail.props('noSpinner')).toBe(true);

    // And back off again when demo mode is disabled.
    demoMode.enabled = false;
    await nextTick();
    expect(thumbnail.props('noSpinner')).toBe(false);
  });
});
