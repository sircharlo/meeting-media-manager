import type { MediaSectionIdentifier, MediaSectionWithConfig } from 'src/types';

import { standardSections } from 'src/constants/media';
import { useCurrentStateStore } from 'src/stores/current-state';
import { computed, ref, watch } from 'vue';

export const defaultAdditionalSection = {
  config: {
    bgColor: 'rgb(148, 94, 181)',
    extraMediaShortcut: true,
    mmmIcon: 'mmm-additional-media',
    uniqueId: 'imported-media',
  },
  items: [],
};

export function useMediaSection(mediaList: MediaSectionWithConfig) {
  const currentStateStore = useCurrentStateStore();
  const selectedDateObject = computed(
    () => currentStateStore.selectedDateObject,
  );

  // Get section items from the new structure
  const sectionItems = computed(() => {
    if (!selectedDateObject.value?.mediaSections) return [];
    return (
      selectedDateObject.value.mediaSections[mediaList.config?.uniqueId || '']
        ?.items || []
    );
  });

  // Get visible items (filtered out hidden items)
  const visibleItems = computed(() => {
    return sectionItems.value.filter((item) => !item.hidden);
  });

  // Check if section is empty
  const isEmpty = computed(() => {
    return sectionItems.value.length === 0;
  });

  // Check if this is a song button section
  const isSongButton = computed(() => {
    if (!mediaList.config) return false;
    const isCircuitOverseerSection =
      mediaList.config.uniqueId === 'circuit-overseer' &&
      !sectionItems.value.some((m) => m.hidden);
    return (
      (!sectionContainsSongs.value && mediaList.config.uniqueId === 'pt') ||
      isCircuitOverseerSection
    );
  });

  // Get section config from the new structure
  const sectionConfig = computed(() => {
    if (!selectedDateObject.value?.mediaSections) return null;
    return (
      selectedDateObject.value.mediaSections[mediaList.config?.uniqueId || '']
        ?.config || null
    );
  });

  // Check if this is a custom section (not a standard meeting section)
  const isCustomSection = computed(() => {
    return !standardSections.includes(mediaList.config?.uniqueId || '');
  });

  // Check if section contains songs
  const sectionContainsSongs = computed(() => {
    const currentSongbook = currentStateStore.currentSongbook;
    if (!currentSongbook?.pub) return false;

    return sectionItems.value.some(
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
    const sectionContainsAtLeastOneSong = sectionItems.value.some(
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
    return Object.entries(selectedDateObject.value.mediaSections)
      .filter(([sectionId]) => {
        return !standardSections.includes(sectionId);
      })
      .map(([sectionId, sectionData]) => ({
        config: sectionData.config,
        items: sectionData.items,
        uniqueId: sectionId,
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
    () => [sectionItems.value, selectedDateObject.value?.date],
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

    if (!selectedDateObject.value?.mediaSections || !isCustomSection.value) {
      console.warn('⚠️ No custom sections found for label update');
      return;
    }

    const sectionData =
      selectedDateObject.value.mediaSections[mediaList.config?.uniqueId || ''];
    if (sectionData && sectionData.config) {
      const oldLabel = sectionData.config.label;
      sectionData.config.label = label;
      console.log('✅ Section label updated:', {
        newLabel: label,
        oldLabel,
        sectionId: mediaList.config?.uniqueId,
      });
    } else {
      console.warn(
        '⚠️ Section not found for label update:',
        mediaList.config?.uniqueId,
      );
    }
  };

  const updateSectionColor = (bgColor: string) => {
    console.log('🎨 Updating section color:', {
      hasCustomSections: !!selectedDateObject.value?.mediaSections,
      newColor: bgColor,
      sectionId: mediaList.config?.uniqueId,
    });

    if (!selectedDateObject.value?.mediaSections || !isCustomSection.value) {
      console.warn('⚠️ No custom sections found for color update');
      return;
    }

    const sectionData =
      selectedDateObject.value.mediaSections[mediaList.config?.uniqueId || ''];
    if (sectionData && sectionData.config) {
      const oldColor = sectionData.config.bgColor;
      sectionData.config.bgColor = bgColor;
      console.log('✅ Section color updated:', {
        newColor: bgColor,
        oldColor,
        sectionId: mediaList.config?.uniqueId,
      });
    } else {
      console.warn(
        '⚠️ Section not found for color update:',
        mediaList.config?.uniqueId,
      );
    }
  };

  const updateSectionRepeat = (repeat: boolean, interval?: number) => {
    console.log('🔄 Updating section repeat:', {
      hasCustomSections: !!selectedDateObject.value?.mediaSections,
      newInterval: interval,
      newRepeat: repeat,
      sectionId: mediaList.config?.uniqueId,
    });

    if (!selectedDateObject.value?.mediaSections || !isCustomSection.value) {
      console.warn(
        '⚠️ No custom sections found for repeat update',
        selectedDateObject.value?.mediaSections,
        isCustomSection.value,
      );
      return;
    }

    const sectionData =
      selectedDateObject.value.mediaSections[mediaList.config?.uniqueId || ''];
    if (sectionData && sectionData.config) {
      const oldRepeat = sectionData.config.repeat;
      const oldInterval = sectionData.config.repeatInterval;
      sectionData.config.repeat = repeat;
      if (interval !== undefined) {
        sectionData.config.repeatInterval = interval;
      }
      console.log('✅ Section repeat updated:', {
        newInterval: interval,
        newRepeat: repeat,
        oldInterval,
        oldRepeat,
        sectionId: mediaList.config?.uniqueId,
      });
    } else {
      console.warn(
        '⚠️ Section not found for repeat update:',
        mediaList.config?.uniqueId,
      );
    }
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

    // Reorder the sections in mediaSections
    const sectionEntries = Object.entries(
      selectedDateObject.value.mediaSections,
    );
    const customSectionEntries = sectionEntries.filter(([sectionId]) => {
      return !standardSections.includes(sectionId);
    });

    const standardSectionEntries = sectionEntries.filter(([sectionId]) => {
      return standardSections.includes(sectionId);
    });

    // Reorder custom sections
    const reorderedCustomSections = [...customSectionEntries];
    const [movedSection] = reorderedCustomSections.splice(currentIndex, 1);
    if (movedSection) {
      reorderedCustomSections.splice(newIndex, 0, movedSection);
    }

    // Rebuild mediaSections with new order
    const newMediaSections: Record<
      MediaSectionIdentifier,
      MediaSectionWithConfig
    > = {};

    // Add standard sections first
    standardSectionEntries.forEach(([sectionId, sectionData]) => {
      newMediaSections[sectionId] = sectionData;
    });

    // Add custom sections in new order
    reorderedCustomSections.forEach(([sectionId, sectionData]) => {
      newMediaSections[sectionId] = sectionData;
    });

    selectedDateObject.value.mediaSections = newMediaSections;

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

    const sectionData =
      selectedDateObject.value.mediaSections[mediaList.config?.uniqueId || ''];
    if (sectionData) {
      // Move all items to additional section
      const itemsToMove = sectionData.items;
      if (!itemsToMove) return;
      selectedDateObject.value.mediaSections['imported-media'] ??=
        defaultAdditionalSection;
      selectedDateObject.value.mediaSections['imported-media'].items ??= [];
      selectedDateObject.value.mediaSections['imported-media'].items.push(
        ...itemsToMove,
      );

      // Empty the section
      if (sectionData.items) {
        sectionData.items = [];
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
    currentIndex,
    customSections,
    deleteSection,
    expandedGroups,
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
    // State
    sectionItems,
    updateSectionColor,
    // Actions
    updateSectionLabel,
    updateSectionRepeat,
    visibleItems,
  };
}
