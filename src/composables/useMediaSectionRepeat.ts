import type { DynamicMediaObject, MediaSectionIdentifier } from 'src/types';

import { useBroadcastChannel } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { nextTick, ref, watch } from 'vue';

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

  // Get all media items for a section
  const getSectionMediaItems = (
    sectionId: MediaSectionIdentifier,
  ): DynamicMediaObject[] => {
    console.log('🔄 [getSectionMediaItems] Starting for sectionId:', sectionId);

    if (!selectedDateObject.value?.dynamicMedia) {
      console.log(
        '❌ [getSectionMediaItems] No dynamicMedia found, returning empty array',
      );
      return [];
    }

    const allItems = selectedDateObject.value.dynamicMedia;
    console.log(
      '📊 [getSectionMediaItems] Total dynamicMedia items:',
      allItems.length,
    );

    const filteredItems = allItems.filter(
      (item) =>
        item.section === sectionId && !item.hidden && item.type !== 'divider',
    );

    console.log(
      '🔍 [getSectionMediaItems] Filtered items for section:',
      filteredItems.length,
    );
    console.log(
      '🔍 [getSectionMediaItems] Filtered items details:',
      filteredItems.map((item) => ({
        hidden: item.hidden,
        section: item.section,
        sortOrderOriginal: item.sortOrderOriginal,
        type: item.type,
        uniqueId: item.uniqueId,
      })),
    );

    const sortedItems = filteredItems.sort((a, b) => {
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

    console.log(
      '📋 [getSectionMediaItems] Final sorted items count:',
      sortedItems.length,
    );
    console.log(
      '📋 [getSectionMediaItems] Sorted items order:',
      sortedItems.map((item) => ({
        sortOrder: item.sortOrderOriginal,
        uniqueId: item.uniqueId,
      })),
    );

    return sortedItems;
  };

  // Get current item index from the section items
  const getCurrentItemIndex = (sectionId: MediaSectionIdentifier): number => {
    if (!currentRepeatingSection.value || !isRepeating.value) {
      console.log('❌ [getCurrentItemIndex] Not repeating, returning -1');
      return -1;
    }

    const sectionItems = getSectionMediaItems(sectionId);
    const currentPlayingUniqueId = mediaPlaying.value.uniqueId;

    console.log('🔍 [getCurrentItemIndex] Looking for current item:', {
      currentPlayingUniqueId,
      sectionItemsCount: sectionItems.length,
    });

    const currentIndex = sectionItems.findIndex(
      (item) => item.uniqueId === currentPlayingUniqueId,
    );

    console.log('📊 [getCurrentItemIndex] Found index:', currentIndex);
    return currentIndex;
  };

  // Get the current section's repeat settings
  const getSectionRepeatSettings = (sectionId: MediaSectionIdentifier) => {
    console.log(
      '⚙️ [getSectionRepeatSettings] Looking for settings for sectionId:',
      sectionId,
    );

    if (!selectedDateObject.value?.customSections) {
      console.log('❌ [getSectionRepeatSettings] No customSections found');
      return null;
    }

    const customSections = selectedDateObject.value.customSections;
    console.log(
      '📋 [getSectionRepeatSettings] Available customSections:',
      customSections.map((s) => s.uniqueId),
    );

    const sectionSettings = customSections.find(
      (section) => section.uniqueId === sectionId,
    );

    if (sectionSettings) {
      console.log('✅ [getSectionRepeatSettings] Found settings:', {
        repeat: sectionSettings.repeat,
        repeatInterval: sectionSettings.repeatInterval,
        uniqueId: sectionSettings.uniqueId,
      });
    } else {
      console.log(
        '❌ [getSectionRepeatSettings] No settings found for sectionId:',
        sectionId,
      );
    }

    return sectionSettings;
  };

  // Check if a section is a custom section
  const isCustomSection = (sectionId: MediaSectionIdentifier) => {
    console.log(
      '🔍 [isCustomSection] Checking if sectionId is custom:',
      sectionId,
    );

    if (!selectedDateObject.value?.customSections) {
      console.log(
        '❌ [isCustomSection] No customSections found, returning false',
      );
      return false;
    }

    const customSections = selectedDateObject.value.customSections;
    const isCustom = customSections.some(
      (section) => section.uniqueId === sectionId,
    );

    console.log(
      '🔍 [isCustomSection] Available custom sections:',
      customSections.map((s) => s.uniqueId),
    );
    console.log('🔍 [isCustomSection] Is custom section?', isCustom);

    return isCustom;
  };

  // Start repeating a section
  const startRepeatingSection = (sectionId: MediaSectionIdentifier) => {
    console.log(
      '🚀 [startRepeatingSection] Starting repeat for sectionId:',
      sectionId,
    );

    // Only allow custom sections to be repeated
    if (!isCustomSection(sectionId)) {
      console.warn(
        '⚠️ [startRepeatingSection] Only custom sections can be repeated:',
        sectionId,
      );
      return;
    }

    const sectionItems = getSectionMediaItems(sectionId);
    console.log(
      '📊 [startRepeatingSection] Section items count:',
      sectionItems.length,
    );

    if (sectionItems.length === 0) {
      console.log('❌ [startRepeatingSection] No items found, stopping');
      return;
    }

    // Check if the section has repeat enabled
    const sectionSettings = getSectionRepeatSettings(sectionId);
    if (!sectionSettings?.repeat) {
      console.warn(
        '⚠️ [startRepeatingSection] Section repeat not enabled for:',
        sectionId,
      );
      return;
    }

    console.log(
      '✅ [startRepeatingSection] All checks passed, starting repeat',
    );
    console.log('📊 [startRepeatingSection] Repeat settings:', {
      repeat: sectionSettings.repeat,
      repeatInterval: sectionSettings.repeatInterval,
    });

    currentRepeatingSection.value = sectionId;
    isRepeating.value = true;

    console.log('🔄 [startRepeatingSection] State updated:', {
      currentRepeatingSection: currentRepeatingSection.value,
      isRepeating: isRepeating.value,
    });

    // Notify other windows that section repeat has started
    console.log(
      '📡 [startRepeatingSection] Broadcasting start message to other windows',
    );
    postSectionRepeat({ action: 'start', sectionId });

    // Play the first item
    console.log('▶️ [startRepeatingSection] Playing first item');
    playCurrentItem();
  };

  // Stop repeating
  const stopRepeating = () => {
    console.log('🛑 [stopRepeating] Stopping repeat');
    console.log('📊 [stopRepeating] Current state before stop:', {
      currentRepeatingSection: currentRepeatingSection.value,
      hasImageTimer: !!imageDisplayTimer.value,
      isRepeating: isRepeating.value,
    });

    const wasRepeating = isRepeating.value;
    const wasSection = currentRepeatingSection.value;

    isRepeating.value = false;
    currentRepeatingSection.value = null;

    if (imageDisplayTimer.value) {
      console.log('⏰ [stopRepeating] Clearing image display timer');
      clearTimeout(imageDisplayTimer.value);
      imageDisplayTimer.value = null;
    }

    console.log('✅ [stopRepeating] State cleared');

    // Notify other windows that section repeat has stopped
    if (wasRepeating && wasSection) {
      console.log(
        '📡 [stopRepeating] Broadcasting stop message to other windows',
      );
      postSectionRepeat({ action: 'stop', sectionId: wasSection });
    }
  };

  // Play the current item in the section
  const playCurrentItem = () => {
    console.log('▶️ [playCurrentItem] Starting to play current item');
    console.log('📊 [playCurrentItem] Current state:', {
      currentRepeatingSection: currentRepeatingSection.value,
      isRepeating: isRepeating.value,
    });

    if (!currentRepeatingSection.value || !isRepeating.value) {
      console.log('❌ [playCurrentItem] Not repeating or no section, stopping');
      return;
    }

    const sectionItems = getSectionMediaItems(currentRepeatingSection.value);
    console.log(
      '📊 [playCurrentItem] Section items count:',
      sectionItems.length,
    );

    if (sectionItems.length === 0) {
      console.log('❌ [playCurrentItem] No section items, stopping repeat');
      stopRepeating();
      return;
    }

    // Get current index from the currently playing media
    const currentIndex = getCurrentItemIndex(currentRepeatingSection.value);
    let targetIndex = currentIndex;

    // If no current item is playing or current item is not in this section, start from beginning
    if (currentIndex === -1) {
      console.log(
        '🔄 [playCurrentItem] No current item playing, starting from index 0',
      );
      targetIndex = 0;
    }

    const currentItem = sectionItems[targetIndex];
    console.log(
      '📋 [playCurrentItem] Current item at index',
      targetIndex,
      ':',
      {
        fileUrl: currentItem?.fileUrl,
        isImage: currentItem?.isImage,
        streamUrl: currentItem?.streamUrl,
        type: currentItem?.type,
        uniqueId: currentItem?.uniqueId,
      },
    );

    if (!currentItem) {
      console.log(
        '❌ [playCurrentItem] No current item found, stopping repeat',
      );
      stopRepeating();
      return;
    }

    // Clear any existing image timer
    if (imageDisplayTimer.value) {
      console.log('⏰ [playCurrentItem] Clearing existing image display timer');
      clearTimeout(imageDisplayTimer.value);
      imageDisplayTimer.value = null;
    }

    // Set the media to play using existing broadcast channels
    console.log('🎵 [playCurrentItem] Setting media to play:', {
      subtitlesUrl: currentItem.subtitlesUrl || '',
      uniqueId: currentItem.uniqueId,
      url: currentItem.fileUrl || currentItem.streamUrl || '',
    });

    mediaPlaying.value.action = 'play';
    mediaPlaying.value.url = currentItem.fileUrl || currentItem.streamUrl || '';
    mediaPlaying.value.uniqueId = currentItem.uniqueId;
    mediaPlaying.value.subtitlesUrl = currentItem.subtitlesUrl || '';

    console.log('✅ [playCurrentItem] Media state updated successfully');

    // If this is an image, set up a timer to move to the next item
    if (currentItem.isImage) {
      const sectionSettings = getSectionRepeatSettings(
        currentRepeatingSection.value,
      );
      const interval = sectionSettings?.repeatInterval || 10;

      console.log(
        '⏰ [playCurrentItem] Setting image display timer for',
        interval,
        'seconds',
      );
      console.log('📊 [playCurrentItem] Timer settings:', {
        interval,
        sectionSettings: sectionSettings?.repeatInterval,
      });

      imageDisplayTimer.value = window.setTimeout(() => {
        console.log(
          '⏰ [playCurrentItem] Image display timer fired, moving to next item',
        );
        nextItem();
      }, interval * 1000);
    }
  };

  // Move to the next item in the section
  const nextItem = async () => {
    console.log('⏭️ [nextItem] Moving to next item');
    console.log('📊 [nextItem] Current state:', {
      currentRepeatingSection: currentRepeatingSection.value,
      isRepeating: isRepeating.value,
    });

    if (!currentRepeatingSection.value || !isRepeating.value) {
      console.log('❌ [nextItem] Not repeating or no section, stopping');
      return;
    }

    const sectionItems = getSectionMediaItems(currentRepeatingSection.value);
    console.log('📊 [nextItem] Section items count:', sectionItems.length);

    if (sectionItems.length === 0) {
      console.log('❌ [nextItem] No section items, stopping repeat');
      stopRepeating();
      return;
    }

    // Get current index from the currently playing media
    const currentIndex = getCurrentItemIndex(currentRepeatingSection.value);
    console.log('📊 [nextItem] Current index from media:', currentIndex);

    let nextIndex = 0; // Default to first item if no current item

    if (currentIndex >= 0) {
      nextIndex = currentIndex + 1;
      console.log(
        '📈 [nextItem] Index incremented:',
        currentIndex,
        '->',
        nextIndex,
      );
    } else {
      console.log('🔄 [nextItem] No current item found, starting from index 0');
    }

    // If we've reached the end of the section, start over
    if (nextIndex >= sectionItems.length) {
      console.log('🔄 [nextItem] Reached end of section, resetting to index 0');
      nextIndex = 0;
    }

    console.log('📋 [nextItem] Next item will be at index:', nextIndex);

    // Play the item at the next index
    const nextItemToPlay = sectionItems[nextIndex];
    if (!nextItemToPlay) {
      console.log('❌ [nextItem] No next item found, stopping repeat');
      stopRepeating();
      return;
    }

    console.log('🎵 [nextItem] Setting next media to play:', {
      subtitlesUrl: nextItemToPlay.subtitlesUrl || '',
      uniqueId: nextItemToPlay.uniqueId,
      url: nextItemToPlay.fileUrl || nextItemToPlay.streamUrl || '',
    });

    // Empty values before setting new values
    mediaPlaying.value.action = 'pause';
    mediaPlaying.value.url = '';
    mediaPlaying.value.uniqueId = '';
    mediaPlaying.value.subtitlesUrl = '';
    mediaPlaying.value.currentPosition = 0;

    await nextTick();

    mediaPlaying.value.action = 'play';
    mediaPlaying.value.url =
      nextItemToPlay.fileUrl || nextItemToPlay.streamUrl || '';
    mediaPlaying.value.uniqueId = nextItemToPlay.uniqueId;
    mediaPlaying.value.subtitlesUrl = nextItemToPlay.subtitlesUrl || '';

    console.log('✅ [nextItem] Next media state updated successfully');

    // Clear any existing image timer
    if (imageDisplayTimer.value) {
      console.log('⏰ [nextItem] Clearing existing image display timer');
      clearTimeout(imageDisplayTimer.value);
      imageDisplayTimer.value = null;
    }

    // If this is an image, set up a timer to move to the next item
    if (nextItemToPlay.isImage) {
      const sectionSettings = getSectionRepeatSettings(
        currentRepeatingSection.value,
      );
      const interval = sectionSettings?.repeatInterval || 10;

      console.log(
        '⏰ [nextItem] Setting image display timer for',
        interval,
        'seconds',
      );
      console.log('📊 [nextItem] Timer settings:', {
        interval,
        sectionSettings: sectionSettings?.repeatInterval,
      });

      imageDisplayTimer.value = window.setTimeout(() => {
        console.log(
          '⏰ [nextItem] Image display timer fired, moving to next item',
        );
        nextItem();
      }, interval * 1000);
    }
  };

  // Handle media ended event - this should only be called from the main window
  const handleSectionRepeat = () => {
    console.log('🎬 [handleSectionRepeat] Media ended event triggered');
    console.log('📊 [handleSectionRepeat] Current state:', {
      currentPlayingUniqueId: mediaPlaying.value.uniqueId,
      currentRepeatingSection: currentRepeatingSection.value,
      isRepeating: isRepeating.value,
    });

    // Only handle section repeat if we're actually repeating a section
    if (!currentRepeatingSection.value || !isRepeating.value) {
      console.log(
        '❌ [handleSectionRepeat] Not repeating or no section, ignoring',
      );
      return false;
    }

    // Get section items and find the current item
    const sectionItems = getSectionMediaItems(currentRepeatingSection.value);
    const currentPlayingUniqueId = mediaPlaying.value.uniqueId;

    // Try to find the current item by uniqueId first
    let currentItem = sectionItems.find(
      (item) => item.uniqueId === currentPlayingUniqueId,
    );
    let currentIndex = currentItem ? sectionItems.indexOf(currentItem) : -1;

    // If we can't find the exact item, try to find it by URL
    if (!currentItem && currentPlayingUniqueId) {
      const currentUrl = mediaPlaying.value.url;
      currentItem = sectionItems.find(
        (item) => item.fileUrl === currentUrl || item.streamUrl === currentUrl,
      );
      currentIndex = currentItem ? sectionItems.indexOf(currentItem) : -1;
    }

    console.log(
      '🔍 [handleSectionRepeat] Checking if ended media belongs to repeating section:',
      {
        currentIndex,
        currentItemUniqueId: currentItem?.uniqueId,
        currentPlayingUniqueId,
        matches: !!currentItem,
      },
    );

    // If we still can't find the item, but we're repeating, just move to the next item
    if (!currentItem) {
      console.log(
        '⚠️ [handleSectionRepeat] Could not find exact item match, but continuing with repeat logic',
      );
      // For videos/audio, move to next item immediately
      console.log('▶️ [handleSectionRepeat] Moving to next item immediately');
      nextItem();
      return true;
    }

    if (sectionItems.length === 0) {
      console.log('❌ [handleSectionRepeat] No section items, stopping repeat');
      stopRepeating();
      return false;
    }

    // Check if this is an image
    const isImage = currentItem.isImage;
    console.log('🖼️ [handleSectionRepeat] Current item is image?', isImage);

    if (isImage) {
      // For images, the timer should already be set in playCurrentItem
      // If we're here, it means the image timer fired or was cleared
      console.log(
        '⏰ [handleSectionRepeat] Image ended - timer should have been set in playCurrentItem',
      );
      // Move to next item immediately since the timer logic is handled in playCurrentItem
      nextItem();
      return true;
    } else {
      // For videos/audio, move to next item immediately
      console.log(
        '▶️ [handleSectionRepeat] Video/audio ended, moving to next item immediately',
      );
      nextItem();
      return true;
    }
  };

  // Check if a section is currently being repeated
  const isSectionRepeating = (sectionId: MediaSectionIdentifier) => {
    const isRepeatingSection =
      currentRepeatingSection.value === sectionId && isRepeating.value;
    console.log('🔍 [isSectionRepeating] Checking if section is repeating:', {
      currentRepeatingSection: currentRepeatingSection.value,
      isRepeating: isRepeating.value,
      result: isRepeatingSection,
      sectionId,
    });
    return isRepeatingSection;
  };

  // Toggle repeat for a section
  const toggleSectionRepeat = (sectionId: MediaSectionIdentifier) => {
    console.log(
      '🔄 [toggleSectionRepeat] Toggling repeat for sectionId:',
      sectionId,
    );

    if (isSectionRepeating(sectionId)) {
      console.log(
        '🛑 [toggleSectionRepeat] Section is currently repeating, stopping',
      );
      stopRepeating();
    } else {
      console.log(
        '🚀 [toggleSectionRepeat] Section is not repeating, attempting to start',
      );
      // Check if the section has repeat enabled before starting
      const sectionSettings = getSectionRepeatSettings(sectionId);
      console.log('⚙️ [toggleSectionRepeat] Section settings:', {
        hasSettings: !!sectionSettings,
        repeat: sectionSettings?.repeat,
      });

      if (sectionSettings?.repeat) {
        console.log(
          '✅ [toggleSectionRepeat] Repeat enabled, starting section',
        );
        startRepeatingSection(sectionId);
      } else {
        console.log('❌ [toggleSectionRepeat] Repeat not enabled for section');
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

    console.log('📡 [sectionRepeatData] Received broadcast message:', data);

    if (data.action === 'start') {
      console.log(
        '📡 [sectionRepeatData] Another window started repeating section:',
        data.sectionId,
      );
      // Another window started repeating this section
      if (currentRepeatingSection.value !== data.sectionId) {
        console.log('🔄 [sectionRepeatData] Updating local state to match');
        currentRepeatingSection.value = data.sectionId;
        isRepeating.value = true;
      } else {
        console.log(
          '📡 [sectionRepeatData] Already repeating this section, no change needed',
        );
      }
    } else if (data.action === 'stop') {
      console.log(
        '📡 [sectionRepeatData] Another window stopped repeating section:',
        data.sectionId,
      );
      // Another window stopped repeating
      if (currentRepeatingSection.value === data.sectionId) {
        console.log('🛑 [sectionRepeatData] Stopping local repeat to match');
        stopRepeating();
      } else {
        console.log(
          '📡 [sectionRepeatData] Not repeating this section locally, no action needed',
        );
      }
    }
  });

  // Watch for media state changes
  watch(
    () => mediaPlaying.value.action,
    (newAction) => {
      if (newAction === 'pause' || newAction === '') {
        console.log(
          '⏸️ [mediaPlayingAction] Media paused/stopped, clearing image timer',
        );
        // If media is paused or stopped, clear any image timer
        if (imageDisplayTimer.value) {
          console.log('⏰ [mediaPlayingAction] Clearing image display timer');
          clearTimeout(imageDisplayTimer.value);
          imageDisplayTimer.value = null;
        } else {
          console.log('⏰ [mediaPlayingAction] No image timer to clear');
        }
      }
    },
  );

  // Clean up on unmount
  const cleanup = () => {
    console.log('🧹 [cleanup] Cleaning up repeat logic');
    if (imageDisplayTimer.value) {
      console.log('⏰ [cleanup] Clearing image display timer');
      clearTimeout(imageDisplayTimer.value);
      imageDisplayTimer.value = null;
    }
    console.log('✅ [cleanup] Cleanup complete');
  };

  return {
    cleanup,
    currentRepeatingSection,
    getCurrentItemIndex,
    getSectionMediaItems,
    getSectionRepeatSettings,
    handleSectionRepeat,
    isCustomSection,
    isRepeating,
    isSectionRepeating,
    nextItem,
    playCurrentItem,
    startRepeatingSection,
    stopRepeating,
    toggleSectionRepeat,
  };
}
