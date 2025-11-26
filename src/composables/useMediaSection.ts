import type { MediaSectionIdentifier, MediaSectionWithConfig } from 'src/types';

import { standardSections } from 'src/constants/media';
import {
  findMediaSection,
  getOrCreateMediaSection,
} from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, ref, watch } from 'vue';

export const defaultAdditionalSection = {
  config: {
    bgColor: 'rgb(148, 94, 181)',
    uniqueId: 'imported-media',
  },
  items: [],
};

export function useMediaSection(mediaList: MediaSectionWithConfig) {
  const currentStateStore = useCurrentStateStore();
  const selectedDateObject = computed(
    () => currentStateStore.selectedDateObject,
  );

  const sectionData = ref<MediaSectionWithConfig>();

  // Watch for changes in selectedDateObject or mediaList.config.uniqueId to update sectionData
  watch(
    [selectedDateObject, () => mediaList.config?.uniqueId],
    ([newSelectedDateObject, newUniqueId]) => {
      if (newSelectedDateObject?.mediaSections && newUniqueId) {
        sectionData.value = findMediaSection(
          newSelectedDateObject.mediaSections,
          newUniqueId,
        );
      }
    },
    { immediate: true },
  );

  // Get visible items (filtered out hidden items)
  const visibleItems = computed(() => {
    return sectionData.value?.items?.filter((item) => !item.hidden) || [];
  });

  const someItemsAreHidden = computed(() => {
    return sectionData.value?.items?.some((item) => item.hidden) || false;
  });

  const allItemsAreHidden = computed(() => {
    const items = sectionData.value?.items;
    return !!items?.length && items.every((item) => item.hidden);
  });

  // Check if section is empty
  const isEmpty = computed(() => {
    return (sectionData.value?.items?.length || 0) === 0;
  });

  const hasAddMediaButton = computed(() => {
    return (
      mediaList.config?.uniqueId === 'imported-media' ||
      mediaList.config?.uniqueId.startsWith('custom-') ||
      mediaList.config?.uniqueId === 'pt' ||
      mediaList.config?.uniqueId === 'circuit-overseer' ||
      mediaList.config?.uniqueId === 'lac'
    );
  });

  // Check if this is a song button section
  const isSongButton = computed(() => {
    if (!mediaList.config) return false;
    if (someItemsAreHidden.value) return false;
    const isCircuitOverseerSection =
      mediaList.config.uniqueId === 'circuit-overseer';
    return (
      (!sectionContainsSongs.value && mediaList.config.uniqueId === 'pt') ||
      isCircuitOverseerSection
    );
  });

  // Get section config from the new structure
  const sectionConfig = computed(() => {
    return sectionData.value?.config || null;
  });

  // Check if this is a custom section (not a standard meeting section)
  const isCustomSection = computed(() => {
    return !standardSections.includes(mediaList.config?.uniqueId || '');
  });

  // Check if section contains songs
  const sectionContainsSongs = computed(() => {
    const currentSongbook = currentStateStore.currentSongbook;
    if (!currentSongbook?.pub) return false;

    return visibleItems.value.some(
      (m) =>
        m.streamUrl?.includes(currentSongbook?.pub) ||
        m.fileUrl?.includes(currentSongbook?.pub),
    );
  });

  // Check if this is a public talk or circuit overseer section without songs
  const isPublicTalkOrCircuitOverseerWithoutSongs = computed(() => {
    const isPublicTalkSection = mediaList.config?.uniqueId === 'pt';
    const isCircuitOverseerSection =
      mediaList.config?.uniqueId === 'circuit-overseer';
    const sectionContainsAtLeastOneSong = visibleItems.value.some(
      (m) => m.streamUrl?.includes('sjj') || m.fileUrl?.includes('sjj'),
    );
    const result =
      (isPublicTalkSection || isCircuitOverseerSection) &&
      !sectionContainsAtLeastOneSong;
    return result;
  });

  // Get all custom sections for ordering
  const customSections = computed(() => {
    if (!selectedDateObject.value?.mediaSections) return [];
    return selectedDateObject.value.mediaSections
      .filter((section) => {
        return !standardSections.includes(section.config.uniqueId);
      })
      .map((section) => ({
        config: section.config,
        items: section.items,
        uniqueId: section.config.uniqueId,
      }));
  });

  const currentIndex = computed(() => {
    const index = customSections.value.findIndex(
      (s) => s.uniqueId === mediaList.config?.uniqueId,
    );
    return index;
  });

  const isFirst = computed(() => {
    const result = currentIndex.value === 0;
    return result;
  });

  const isLast = computed(() => {
    const result = currentIndex.value === customSections.value.length - 1;
    return result;
  });

  // UI state
  const isRenaming = ref(false);
  const expandedGroups = ref<Record<string, boolean>>({});

  // Initialize expanded groups
  watch(
    () => [sectionData.value?.items, selectedDateObject.value?.date], // Use sectionData.value?.items
    (newValues, oldValues) => {
      const [items, newDate] = newValues || [];
      const [, oldDate] = oldValues || [];

      if (newDate === oldDate || !Array.isArray(items)) return;

      console.log('🔄 Updating expanded groups for section:', {
        itemCount: items.length,
        sectionId: mediaList.config?.uniqueId,
      });

      expandedGroups.value = items.reduce(
        (acc, item) => {
          if (item.children?.length && item.extractCaption) {
            acc[item.uniqueId] = !!item.cbs;
            console.log('📂 Setting expanded state for group:', {
              expanded: !!item.cbs,
              hasChildren: !!item.children?.length,
              hasExtractCaption: !!item.extractCaption,
              uniqueId: item.uniqueId,
            });
          }
          return acc;
        },
        {} as Record<string, boolean>,
      );

      console.log('✅ Expanded groups updated:', {
        expandedGroups: expandedGroups.value,
        sectionId: mediaList.config?.uniqueId,
      });
    },
    { immediate: true },
  );

  // Actions
  const updateSectionLabel = (label: string) => {
    console.log('🏷️ Updating section label:', {
      hasCustomSections: !!selectedDateObject.value?.mediaSections,
      newLabel: label,
      sectionId: mediaList.config?.uniqueId,
    });

    if (!sectionData.value?.config || !isCustomSection.value) {
      // Use sectionData.value?.config
      console.warn('⚠️ No custom sections found for label update');
      return;
    }

    const oldLabel = sectionData.value.config.label;
    sectionData.value.config.label = label;
    console.log('✅ Section label updated:', {
      newLabel: label,
      oldLabel,
      sectionId: mediaList.config?.uniqueId,
    });
  };

  const updateSectionColor = (bgColor: string) => {
    console.log('🎨 Updating section color:', {
      hasCustomSections: !!selectedDateObject.value?.mediaSections,
      newColor: bgColor,
      sectionId: mediaList.config?.uniqueId,
    });

    if (!sectionData.value?.config || !isCustomSection.value) {
      // Use sectionData.value?.config
      console.warn('⚠️ No custom sections found for color update');
      return;
    }

    const oldColor = sectionData.value.config.bgColor;
    sectionData.value.config.bgColor = bgColor;
    console.log('✅ Section color updated:', {
      newColor: bgColor,
      oldColor,
      sectionId: mediaList.config?.uniqueId,
    });
  };

  const updateSectionRepeat = (repeat: boolean, interval?: number) => {
    console.log('🔄 Updating section repeat:', {
      hasCustomSections: !!selectedDateObject.value?.mediaSections,
      newInterval: interval,
      newRepeat: repeat,
      sectionId: mediaList.config?.uniqueId,
    });

    if (!sectionData.value?.config || !isCustomSection.value) {
      // Use sectionData.value?.config
      console.warn(
        '⚠️ No custom sections found for repeat update',
        selectedDateObject.value?.mediaSections,
        isCustomSection.value,
      );
      return;
    }

    const oldRepeat = sectionData.value.config.repeat;
    const oldInterval = sectionData.value.config.repeatInterval;
    sectionData.value.config.repeat = repeat;
    if (interval !== undefined) {
      sectionData.value.config.repeatInterval = interval;
    }
    console.log('✅ Section repeat updated:', {
      newInterval: interval,
      newRepeat: repeat,
      oldInterval,
      oldRepeat,
      sectionId: mediaList.config?.uniqueId,
    });
  };

  const moveSection = (direction: 'down' | 'up') => {
    console.log('📦 Moving section:', {
      direction,
      hasCustomSections: !!selectedDateObject.value?.mediaSections,
      sectionId: mediaList.config?.uniqueId,
    });

    if (!selectedDateObject.value?.mediaSections || !isCustomSection.value) {
      console.warn('⚠️ No custom sections found for move');
      return;
    }

    const sections = customSections.value;
    const currentIndex = sections.findIndex(
      (s) => s.uniqueId === mediaList.config?.uniqueId,
    );

    if (currentIndex === -1) {
      console.warn(
        '⚠️ Section not found for move:',
        mediaList.config?.uniqueId,
      );
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= sections.length) {
      console.warn('⚠️ Cannot move section: out of bounds');
      return;
    }

    // Find standard and custom sections
    const standardSectionsList = selectedDateObject.value.mediaSections.filter(
      (section) => standardSections.includes(section.config.uniqueId),
    );

    const customSectionsList = selectedDateObject.value.mediaSections.filter(
      (section) => !standardSections.includes(section.config.uniqueId),
    );

    // Reorder custom sections
    const reorderedCustomSections = [...customSectionsList];
    const [movedSection] = reorderedCustomSections.splice(currentIndex, 1);
    if (movedSection) {
      reorderedCustomSections.splice(newIndex, 0, movedSection);
    }

    // Rebuild mediaSections with new order (standard sections first, then custom)
    selectedDateObject.value.mediaSections = [
      ...standardSectionsList,
      ...reorderedCustomSections,
    ];

    console.log('✅ Section moved:', {
      direction,
      fromIndex: currentIndex,
      sectionId: mediaList.config?.uniqueId,
      toIndex: newIndex,
    });
  };

  const deleteSection = () => {
    console.log('🗑️ Deleting section:', {
      hasCustomSections: !!selectedDateObject.value?.mediaSections,
      sectionId: mediaList.config?.uniqueId,
    });

    if (!selectedDateObject.value?.mediaSections || !isCustomSection.value) {
      console.warn('⚠️ No custom sections found for deletion');
      return;
    }

    if (sectionData.value) {
      // Use sectionData.value
      // Move all items to additional section
      const itemsToMove = sectionData.value.items;
      if (!itemsToMove) return;
      const additionalSection = getOrCreateMediaSection(
        selectedDateObject.value.mediaSections,
        'imported-media',
      );
      additionalSection.items ??= [];
      additionalSection.items.push(...itemsToMove);

      // Empty the section
      if (sectionData.value.items) {
        sectionData.value.items = [];
      }

      // Remove the section from mediaSections
      const index = selectedDateObject.value.mediaSections.findIndex(
        (s) => s.config.uniqueId === mediaList.config?.uniqueId,
      );
      if (index > -1) {
        selectedDateObject.value.mediaSections.splice(index, 1);
      }

      console.log('✅ Section deleted:', {
        itemsMoved: itemsToMove.length,
        sectionId: mediaList.config?.uniqueId,
      });
    } else {
      console.warn(
        '⚠️ Section not found for deletion:',
        mediaList.config?.uniqueId,
      );
    }
  };

  const addSong = (section: MediaSectionIdentifier | undefined) => {
    console.log('🎵 Adding song to section:', {
      section,
      sectionId: mediaList.config?.uniqueId,
    });

    if (!section) {
      console.warn('⚠️ No section specified for song addition');
      return;
    }

    // Dispatch a custom event to open the song picker dialog
    // This will be handled by HeaderCalendar.vue which has the DialogSongPicker component
    window.dispatchEvent(
      new CustomEvent('openSongPicker', {
        detail: { section },
      }),
    );
  };

  return {
    addSong,
    allItemsAreHidden,
    currentIndex,
    customSections,
    deleteSection,
    expandedGroups,
    hasAddMediaButton,
    isCustomSection,
    isEmpty,
    isFirst,
    isLast,
    isPublicTalkOrCircuitOverseerWithoutSongs,
    isRenaming,
    isSongButton,
    moveSection,
    sectionConfig,
    sectionContainsSongs,
    sectionData,
    someItemsAreHidden,
    updateSectionColor,
    updateSectionLabel,
    updateSectionRepeat,
    visibleItems,
  };
}
