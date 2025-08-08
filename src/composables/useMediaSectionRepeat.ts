import type { MediaItem, MediaSectionIdentifier } from 'src/types';

import { useBroadcastChannel } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { standardSections } from 'src/constants/media';
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

    const sectionItems =
      selectedDateObject.value.mediaSections[sectionId]?.items || [];

    // Filter out hidden items and dividers
    const visibleItems = sectionItems.filter(
      (item) => !item.hidden && item.type !== 'divider',
    );

    // Sort by sortOrderOriginal
    return visibleItems.sort((a, b) => {
      const aOrder =
        typeof a.sortOrderOriginal === 'number'
          ? a.sortOrderOriginal
          : parseInt(String(a.sortOrderOriginal)) || 0;
      const bOrder =
        typeof b.sortOrderOriginal === 'number'
          ? b.sortOrderOriginal
          : parseInt(String(b.sortOrderOriginal)) || 0;
      return aOrder - bOrder;
    });
  };

  // Get the current section's repeat settings
  const getSectionRepeatSettings = (sectionId: MediaSectionIdentifier) => {
    if (!selectedDateObject.value?.mediaSections) {
      return null;
    }

    const sectionData = selectedDateObject.value.mediaSections[sectionId];
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
      console.warn('Only custom sections can be repeated:', sectionId);
      return;
    }

    const sectionItems = getSectionMediaItems(sectionId);
    if (sectionItems.length === 0) {
      console.warn('No items found in section:', sectionId);
      return;
    }

    // Check if the section has repeat enabled
    const sectionSettings = getSectionRepeatSettings(sectionId);
    if (!sectionSettings?.repeat) {
      console.warn('Section repeat not enabled for:', sectionId);
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

    console.log('🔄 [playNextItem] Playing next item:', nextItem);

    // Clear any existing image timer
    if (imageDisplayTimer.value) {
      clearTimeout(imageDisplayTimer.value);
      imageDisplayTimer.value = null;
    }

    // mediaPlaying.value.url = nextItem.fileUrl || nextItem.streamUrl || '';
    // mediaPlaying.value.uniqueId = nextItem.uniqueId;
    // mediaPlaying.value.subtitlesUrl = nextItem.subtitlesUrl || '';
    // // Set the media to play
    // mediaPlaying.value.action = '';
    // nextTick(() => {
    //   mediaPlaying.value.action = 'play';
    // });
    mediaPlaying.value = {
      action: 'play',
      currentPosition: 0,
      panzoom: {
        scale: 1,
        x: 0,
        y: 0,
      },
      seekTo: 0,
      subtitlesUrl: nextItem.subtitlesUrl || '',
      uniqueId: nextItem.uniqueId,
      url: nextItem.fileUrl || nextItem.streamUrl || '',
    };

    // If this is an image, set up a timer to move to the next item
    if (nextItem.isImage) {
      const sectionSettings = getSectionRepeatSettings(
        currentRepeatingSection.value,
      );
      const interval = sectionSettings?.repeatInterval || 10;

      imageDisplayTimer.value = window.setTimeout(() => {
        playNextItem();
      }, interval * 1000);
    }
  };

  // Handle media ended event - called when a media item finishes playing
  const handleMediaEnded = () => {
    console.log(
      '🔄 [handleMediaEnded] Handle media ended',
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

    console.log('🔄 [handleMediaEnded] Current item', currentItem);

    if (!currentItem) {
      return false;
    }

    console.log(
      '🔄 [handleMediaEnded] Current item is image',
      currentItem.isImage,
    );

    // For videos/audio, move to next item immediately
    // For images, the timer should handle the transition
    if (!currentItem.isImage) {
      playNextItem();
      return true;
    }

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
  };
}
