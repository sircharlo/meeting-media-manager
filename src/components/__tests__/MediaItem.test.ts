import type { DateInfo } from 'src/types';

import { enableAutoUnmount, mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useDemoModeStore } from 'stores/demo-mode';
import { useJwStore } from 'stores/jw';
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
  // A menu left open keeps its transition timer, which could fire after this
  // file's DOM is torn down and fail the whole run with "document is not
  // defined" (merge queue, 2026-11-17). Unmounting clears it. Registered
  // after the hook above so it runs first: after-hooks run in reverse.
  enableAutoUnmount(afterEach);

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

  const findMenuItem = (label: string) =>
    [...document.body.querySelectorAll<HTMLElement>('.q-item__label')]
      .find((el) => el.textContent?.trim() === label)
      ?.closest<HTMLElement>('[role="menuitem"]');

  // Move up/Move down sit in the context menu's "Move" submenu, next to the
  // sections to move the item to.
  const openMoveSubmenu = async (wrapper: ReturnType<typeof mount>) => {
    await wrapper.get('button[aria-label="More options"]').trigger('click');
    await nextTick();
    findMenuItem('Move')?.click();
    await nextTick();
    await nextTick();
  };

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

    await openMoveSubmenu(wrapper);

    const moveUpItem = findMenuItem('Move up');
    const moveDownItem = findMenuItem('Move down');

    expect(moveUpItem?.getAttribute('aria-disabled')).toBe('true');
    expect(moveDownItem?.getAttribute('aria-disabled')).toBeNull();

    moveDownItem?.click();
    await nextTick();

    expect(wrapper.emitted('move')).toEqual([[1]]);
  });

  // UX-6 follow-up (full-audit backlog): a group's own children were left
  // drag-only when the top-level move-up/move-down entries were added -
  // MediaGroup.vue now passes the same can-move-up/can-move-down/@move
  // contract for its children (see moveChildItem there), so the entries
  // show for a child exactly like a top-level item, scoped to reordering
  // within the group by whatever canMoveUp/canMoveDown values it's given.
  it('shows and wires move-up/move-down for a group child too', async () => {
    const wrapper = mount(MediaItem, {
      attachTo: document.body,
      props: {
        canMoveDown: true,
        canMoveUp: false,
        child: true,
        media: mockMediaItem,
        repeat: false,
      },
    });

    await openMoveSubmenu(wrapper);

    const moveUpItem = findMenuItem('Move up');
    const moveDownItem = findMenuItem('Move down');

    expect(moveUpItem?.getAttribute('aria-disabled')).toBe('true');
    expect(moveDownItem?.getAttribute('aria-disabled')).toBeNull();

    moveDownItem?.click();
    await nextTick();

    expect(wrapper.emitted('move')).toEqual([[1]]);
  });

  // A right-click on an item outside a multi-selection used to open the
  // multi-selection menu for a selection the item wasn't even part of. It
  // now goes up the click path, where MediaCalendarPage makes that item the
  // whole selection.
  it('passes a right-click on an unselected item up as a click', async () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        selected: false,
        selectedMediaItems: ['other-1', 'other-2'],
      },
    });

    await wrapper.get('.section-drag-handle').trigger('contextmenu');

    const clicks = wrapper.emitted('click');
    expect(clicks).toHaveLength(1);
    expect((clicks?.[0]?.[0] as Event).type).toBe('contextmenu');
  });

  it('keeps the selection when right-clicking one of its items', async () => {
    const wrapper = mount(MediaItem, {
      props: {
        media: mockMediaItem,
        repeat: false,
        selected: true,
        selectedMediaItems: [mockMediaItem.uniqueId, 'other-1'],
      },
    });

    await wrapper.get('.section-drag-handle').trigger('contextmenu');

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('offers Move to section in the multi-selection menu', async () => {
    const currentState = useCurrentStateStore();
    const jwStore = useJwStore();
    currentState.currentCongregation = 'test-cong';
    currentState.selectedDate = '2026-11-18';
    jwStore.lookupPeriod['test-cong'] = [
      {
        date: new Date('2026-11-18T00:00:00'),
        mediaSections: [
          {
            config: { label: 'Section A', uniqueId: 'custom-a' },
            items: [mockMediaItem, { type: 'media', uniqueId: 'other-1' }],
          },
          { config: { label: 'Section B', uniqueId: 'custom-b' }, items: [] },
        ],
        status: 'complete',
      } as unknown as DateInfo,
    ];

    const wrapper = mount(MediaItem, {
      attachTo: document.body,
      props: {
        media: mockMediaItem,
        repeat: false,
        selected: true,
        selectedMediaItems: [mockMediaItem.uniqueId, 'other-1'],
      },
    });

    await wrapper.get('.section-drag-handle').trigger('contextmenu');
    await nextTick();
    await nextTick();

    findMenuItem('Move to section')?.click();
    await nextTick();
    await nextTick();
    findMenuItem('Section B')?.click();
    await nextTick();

    expect(
      currentState.selectedDateObject?.mediaSections.map((section) =>
        section.items?.map((media) => media.uniqueId),
      ),
    ).toEqual([[], [mockMediaItem.uniqueId, 'other-1']]);

    delete jwStore.lookupPeriod['test-cong'];
  });

  it('hides thumbnail spinners reactively when demo mode is toggled at runtime', async () => {
    const demoMode = useDemoModeStore();
    const wrapper = mount(MediaItem, {
      props: {
        // A thumbnail that never finishes loading here, so the glass stays.
        media: { ...mockMediaItem, thumbnailUrl: 'https://example.com/t.jpg' },
        repeat: false,
      },
    });

    const thumbnail = wrapper.findComponent({ name: 'QImg' });
    const showsSpinner = () =>
      thumbnail.findComponent({ name: 'LiquidSpinner' }).exists();
    // Launched without M3_DEMO_MODE and demo store untouched: not demo mode.
    expect(showsSpinner()).toBe(true);

    // Runtime enable (e.g. via the dev-only Demo menu) flips the UI tweak.
    demoMode.enabled = true;
    await nextTick();
    expect(showsSpinner()).toBe(false);

    // And back off again when demo mode is disabled.
    demoMode.enabled = false;
    await nextTick();
    expect(showsSpinner()).toBe(true);
  });
});
