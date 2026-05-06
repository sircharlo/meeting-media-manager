import type { MediaItem, MediaSectionIdentifier } from 'src/types';

import { useBroadcastChannel } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { standardSections } from 'src/constants/media';
import { findMediaSection } from 'src/helpers/media-sections';
import { log } from 'src/shared/vanilla';
import { useCurrentStateStore } from 'stores/current-state';
import { ref, watch } from 'vue';

/**
 * Section Repeat Logic
 *
 * This composable implements section repeat functionality that works like a music player repeat button:
 *
 * 1. When a section has repeat enabled, clicking the repeat button will start playing the section
 * 2. The section will loop through all its media items in order
 * 3. When the last item finishes, it will automatically start from the first item again
 * 4. Images are displayed for a configurable interval (default 10 seconds)
 * 5. Videos/audio play normally and automatically advance to the next item when finished
 * 6. The repeat can be stopped at any time by clicking the repeat button again
 *
 * The repeat state is synchronized across all windows using broadcast channels.
 */
export function useMediaSectionRepeat() {
  const currentState = useCurrentStateStore();
  const { mediaPlaying, selectedDateObject } = storeToRefs(currentState);

  // Broadcast channel for section repeat control
  const { post: postSectionRepeat } = useBroadcastChannel<
    {
      action: 'start' | 'stop';
      sectionId: MediaSectionIdentifier;
    },
    {
      action: 'start' | 'stop';
      sectionId: MediaSectionIdentifier;
    }
  >({ name: 'section-repeat' });

  // Track the current section being repeated
  const currentRepeatingSection = ref<MediaSectionIdentifier | null>(null);
  const isRepeating = ref(false);
  const imageDisplayTimer = ref<null | number>(null);

  // Get all media items for a section (visible, non-divider items)
  const getSectionMediaItems = (
    sectionId: MediaSectionIdentifier,
  ): MediaItem[] => {
    if (!selectedDateObject.value?.mediaSections) {
      return [];
    }

    const section = findMediaSection(
      selectedDateObject.value.mediaSections,
      sectionId,
    );
    const sectionItems = section?.items || [];

    // Filter out hidden items and dividers
    const visibleItems = sectionItems.filter(
      (item) => !item.hidden && item.type !== 'divider',
    );

    // Sort by sortOrderOriginal
    return visibleItems.sort((a, b) => {
      const aOrder =
        typeof a.sortOrderOriginal === 'number'
          ? a.sortOrderOriginal
          : Number.parseInt(String(a.sortOrderOriginal)) || 0;
      const bOrder =
        typeof b.sortOrderOriginal === 'number'
          ? b.sortOrderOriginal
          : Number.parseInt(String(b.sortOrderOriginal)) || 0;
      return aOrder - bOrder;
    });
  };

  // Get the current section's repeat settings
  const getSectionRepeatSettings = (sectionId: MediaSectionIdentifier) => {
    if (!selectedDateObject.value?.mediaSections) {
      return null;
    }

    const sectionData = findMediaSection(
      selectedDateObject.value.mediaSections,
      sectionId,
    );
    return sectionData?.config || null;
  };

  // Check if a section is a custom section
  const isCustomSection = (sectionId: MediaSectionIdentifier) => {
    return !standardSections.includes(sectionId);
  };

  // Start repeating a section
  const startRepeatingSection = (sectionId: MediaSectionIdentifier) => {
    // Only allow custom sections to be repeated
    if (!isCustomSection(sectionId)) {
      log(
        'Only custom sections can be repeated:',
        'mediaSectionRepeat',
        'warn',
        sectionId,
      );
      return;
    }

    const sectionItems = getSectionMediaItems(sectionId);
    if (sectionItems.length === 0) {
      log(
        'No items found in section:',
        'mediaSectionRepeat',
        'warn',
        sectionId,
      );
      return;
    }

    // Check if the section has repeat enabled
    const sectionSettings = getSectionRepeatSettings(sectionId);
    if (!sectionSettings?.repeat) {
      log(
        'Section repeat not enabled for:',
        'mediaSectionRepeat',
        'warn',
        sectionId,
      );
      return;
    }

    currentRepeatingSection.value = sectionId;
    isRepeating.value = true;

    // Notify other windows that section repeat has started
    postSectionRepeat({ action: 'start', sectionId });

    // Play the first item
    // playNextItem();
  };

  // Stop repeating
  const stopRepeating = () => {
    const wasRepeating = isRepeating.value;
    const wasSection = currentRepeatingSection.value;

    isRepeating.value = false;
    currentRepeatingSection.value = null;

    if (imageDisplayTimer.value) {
      clearTimeout(imageDisplayTimer.value);
      imageDisplayTimer.value = null;
    }

    // Notify other windows that section repeat has stopped
    if (wasRepeating && wasSection) {
      postSectionRepeat({ action: 'stop', sectionId: wasSection });
    }
  };

  // Play the next item in the section
  const playNextItem = () => {
    if (!currentRepeatingSection.value || !isRepeating.value) {
      return;
    }

    const sectionItems = getSectionMediaItems(currentRepeatingSection.value);
    if (sectionItems.length === 0) {
      stopRepeating();
      return;
    }

    // Find the current item index
    const currentPlayingUniqueId = mediaPlaying.value.uniqueId;
    let currentIndex = sectionItems.findIndex(
      (item) => item.uniqueId === currentPlayingUniqueId,
    );

    // If current item not found or not in this section, start from beginning
    if (currentIndex === -1) {
      currentIndex = -1; // Will be incremented to 0
    }

    // Calculate next index
    let nextIndex = currentIndex + 1;
    if (nextIndex >= sectionItems.length) {
      nextIndex = 0; // Loop back to beginning
    }

    const nextItem = sectionItems[nextIndex];
    if (!nextItem) {
      stopRepeating();
      return;
    }

    const { post: postMediaRepeatNow } = useBroadcastChannel<number, number>({
      name: 'media-repeat-now',
    });

    const nextUrl = nextItem.fileUrl || nextItem.streamUrl || '';
    const isSameItem = mediaPlaying.value.url === nextUrl;

    log(
      '🔄 [playNextItem] Playing next item:',
      'mediaSectionRepeat',
      'log',
      nextItem,
      'isSameItem:',
      isSameItem,
    );

    // Clear any existing image timer
    if (imageDisplayTimer.value) {
      clearTimeout(imageDisplayTimer.value);
      imageDisplayTimer.value = null;
    }

    mediaPlaying.value = {
      action: 'play',
      currentPosition: 0,
      pan: {
        x: 0,
        y: 0,
      },
      seekTo: 0,
      subtitlesUrl: nextItem.subtitlesUrl || '',
      uniqueId: nextItem.uniqueId,
      url: nextUrl,
      zoom: 1,
    };

    if (isSameItem) {
      // Direct broadcast to MediaPlayerPage to ensure it replays the same video
      // without affecting OBS scenes or standard action flows
      postMediaRepeatNow(Date.now());
    }
  };

  // Handle media ended event - called when a media item finishes playing
  const handleMediaEnded = () => {
    log(
      '🔄 [handleMediaEnded] Handle media ended',
      'mediaSectionRepeat',
      'log',
      currentRepeatingSection.value,
      isRepeating.value,
    );
    if (!currentRepeatingSection.value || !isRepeating.value) {
      return false;
    }

    const sectionItems = getSectionMediaItems(currentRepeatingSection.value);
    const currentPlayingUniqueId = mediaPlaying.value.uniqueId;

    // Check if the ended media belongs to the repeating section
    const currentItem = sectionItems.find(
      (item) => item.uniqueId === currentPlayingUniqueId,
    );

    log(
      '🔄 [handleMediaEnded] Current item',
      'mediaSectionRepeat',
      'log',
      currentItem,
    );

    if (!currentItem) {
      return false;
    }

    log(
      '🔄 [handleMediaEnded] Current item is image',
      'mediaSectionRepeat',
      'log',
      currentItem.isImage,
    );

    playNextItem();
    return true;
  };

  // Check if a section is currently being repeated
  const isSectionRepeating = (sectionId: MediaSectionIdentifier) => {
    return currentRepeatingSection.value === sectionId && isRepeating.value;
  };

  // Toggle repeat for a section
  const toggleSectionRepeat = (sectionId: MediaSectionIdentifier) => {
    if (isSectionRepeating(sectionId)) {
      stopRepeating();
    } else {
      // Check if the section has repeat enabled before starting
      const sectionSettings = getSectionRepeatSettings(sectionId);
      if (sectionSettings?.repeat) {
        startRepeatingSection(sectionId);
      }
    }
  };

  // Update the repeat interval for a section
  const updateSectionRepeatInterval = (
    sectionId: MediaSectionIdentifier,
    interval: number,
  ) => {
    if (!selectedDateObject.value?.mediaSections) {
      return;
    }

    const section = findMediaSection(
      selectedDateObject.value.mediaSections,
      sectionId,
    );

    if (section?.config) {
      section.config.repeatInterval = interval;
      log(
        '🔄 [updateSectionRepeatInterval] Updated interval:',
        'mediaSectionRepeat',
        'log',
        interval,
        'for section:',
        sectionId,
      );
    }
  };

  // Listen for section repeat messages from other windows
  const { data: sectionRepeatData } = useBroadcastChannel<
    {
      action: 'start' | 'stop';
      sectionId: MediaSectionIdentifier;
    },
    {
      action: 'start' | 'stop';
      sectionId: MediaSectionIdentifier;
    }
  >({ name: 'section-repeat' });

  // Watch for section repeat messages
  watch(sectionRepeatData, (data) => {
    if (!data) return;

    if (data.action === 'start') {
      // Another window started repeating this section
      if (currentRepeatingSection.value !== data.sectionId) {
        currentRepeatingSection.value = data.sectionId;
        isRepeating.value = true;
      }
    } else if (data.action === 'stop') {
      // Another window stopped repeating
      if (currentRepeatingSection.value === data.sectionId) {
        stopRepeating();
      }
    }
  });

  // Watch for media state changes
  watch(
    () => mediaPlaying.value.action,
    (newAction) => {
      if (newAction === 'pause' || newAction === '') {
        // If media is paused or stopped, clear any image timer
        if (imageDisplayTimer.value) {
          clearTimeout(imageDisplayTimer.value);
          imageDisplayTimer.value = null;
        }
      }
    },
  );

  // Clean up on unmount
  const cleanup = () => {
    if (imageDisplayTimer.value) {
      clearTimeout(imageDisplayTimer.value);
      imageDisplayTimer.value = null;
    }
  };

  return {
    cleanup,
    currentRepeatingSection,
    getSectionMediaItems,
    getSectionRepeatSettings,
    handleMediaEnded,
    isCustomSection,
    isRepeating,
    isSectionRepeating,
    playNextItem,
    startRepeatingSection,
    stopRepeating,
    toggleSectionRepeat,
    updateSectionRepeatInterval,
  };
}
