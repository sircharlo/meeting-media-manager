import type { MediaSection, MediaSectionIdentifier } from 'src/types';

import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';

export function useMediaSection(mediaList: MediaSection) {
  console.log('🎯 Initializing useMediaSection for:', {
    bgColor: mediaList.bgColor,
    label: mediaList.label,
    uniqueId: mediaList.uniqueId,
  });

  const currentState = useCurrentStateStore();
  const { selectedDateObject } = storeToRefs(currentState);

  // Core computed properties
  const isCustomSection = computed(() => {
    const result =
      mediaList.uniqueId === 'additional' ||
      mediaList.uniqueId?.startsWith('custom');
    return result;
  });

  const sectionItems = computed(() => {
    const items =
      selectedDateObject.value?.dynamicMedia?.filter(
        (m) => m.section === mediaList.uniqueId,
      ) || [];
    return items;
  });

  const visibleItems = computed(() => {
    const items = sectionItems.value.filter((m) => !m.hidden);
    return items;
  });

  const isEmpty = computed(() => {
    const result = sectionItems.value.length === 0;
    return result;
  });

  const isSongButton = computed(() => {
    const result =
      (mediaList.uniqueId === 'additional' &&
        selectedDateObject.value?.meeting === 'we') ||
      (mediaList.uniqueId === 'circuitOverseer' &&
        !sectionItems.value.some((m) => m.hidden));
    return result;
  });

  // Section ordering for custom sections
  const customSections = computed(
    () => selectedDateObject.value?.customSections || [],
  );
  const currentIndex = computed(() => {
    const index = customSections.value.findIndex(
      (s) => s.uniqueId === mediaList.uniqueId,
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
        sectionId: mediaList.uniqueId,
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
        sectionId: mediaList.uniqueId,
      });
    },
    { immediate: true },
  );

  // Actions
  const updateSectionLabel = (label: string) => {
    console.log('🏷️ Updating section label:', {
      hasCustomSections: !!selectedDateObject.value?.customSections,
      newLabel: label,
      sectionId: mediaList.uniqueId,
    });

    if (!selectedDateObject.value?.customSections) {
      // console.warn('⚠️ No custom sections found for label update');
      return;
    }

    const section = selectedDateObject.value.customSections.find(
      (s) => s.uniqueId === mediaList.uniqueId,
    );
    if (section) {
      const oldLabel = section.label;
      section.label = label;
      console.log('✅ Section label updated:', {
        newLabel: label,
        oldLabel,
        sectionId: mediaList.uniqueId,
      });
    } else {
      console.warn(
        '⚠️ Section not found for label update:',
        mediaList.uniqueId,
      );
    }
  };

  const updateSectionColor = (bgColor: string) => {
    console.log('🎨 Updating section color:', {
      hasCustomSections: !!selectedDateObject.value?.customSections,
      newColor: bgColor,
      sectionId: mediaList.uniqueId,
    });

    if (!selectedDateObject.value?.customSections) {
      console.warn('⚠️ No custom sections found for color update');
      return;
    }

    const section = selectedDateObject.value.customSections.find(
      (s) => s.uniqueId === mediaList.uniqueId,
    );
    if (section) {
      const oldColor = section.bgColor;
      section.bgColor = bgColor;
      console.log('✅ Section color updated:', {
        newColor: bgColor,
        oldColor,
        sectionId: mediaList.uniqueId,
      });
    } else {
      console.warn(
        '⚠️ Section not found for color update:',
        mediaList.uniqueId,
      );
    }
  };

  const moveSection = (direction: 'down' | 'up') => {
    console.log('📦 Moving section:', {
      currentIndex: currentIndex.value,
      direction,
      hasCustomSections: !!selectedDateObject.value?.customSections,
      sectionId: mediaList.uniqueId,
    });

    if (
      !selectedDateObject.value?.customSections ||
      currentIndex.value === -1
    ) {
      console.warn('⚠️ Cannot move section - invalid state:', {
        currentIndex: currentIndex.value,
        hasCustomSections: !!selectedDateObject.value?.customSections,
      });
      return;
    }

    const newIndex =
      direction === 'up' ? currentIndex.value - 1 : currentIndex.value + 1;
    if (newIndex < 0 || newIndex >= customSections.value.length) {
      console.warn('⚠️ Invalid new index for section move:', {
        newIndex,
        totalSections: customSections.value.length,
      });
      return;
    }

    const sections = [...customSections.value];
    const [movedSection] = sections.splice(currentIndex.value, 1);
    if (movedSection) {
      sections.splice(newIndex, 0, movedSection);
      selectedDateObject.value.customSections = sections;
      console.log('✅ Section moved successfully:', {
        fromIndex: currentIndex.value,
        sectionId: mediaList.uniqueId,
        toIndex: newIndex,
        totalSections: sections.length,
      });
    } else {
      console.error('❌ Failed to move section - section not found');
    }
  };

  const deleteSection = () => {
    console.log('🗑️ Deleting section:', {
      hasCustomSections: !!selectedDateObject.value?.customSections,
      hasDynamicMedia: !!selectedDateObject.value?.dynamicMedia,
      sectionId: mediaList.uniqueId,
    });

    if (!selectedDateObject.value?.customSections) {
      console.warn('⚠️ No custom sections found for deletion');
      return;
    }

    const sectionIndex = selectedDateObject.value.customSections.findIndex(
      (s) => s.uniqueId === mediaList.uniqueId,
    );

    if (sectionIndex === -1) {
      console.warn('⚠️ Section not found for deletion:', mediaList.uniqueId);
      return;
    }

    // Remove section
    const deletedSection = selectedDateObject.value.customSections.splice(
      sectionIndex,
      1,
    )[0];
    console.log('✅ Section removed from customSections:', {
      deletedSection,
      remainingSections: selectedDateObject.value.customSections.length,
      sectionId: mediaList.uniqueId,
    });

    // Move media items to additional section
    let movedItemsCount = 0;
    selectedDateObject.value.dynamicMedia?.forEach((m) => {
      if (m.section === mediaList.uniqueId) {
        const oldSection = m.section;
        m.section = 'additional';
        m.sectionOriginal = 'additional';
        movedItemsCount++;
        console.log('📋 Moved media item to additional section:', {
          itemId: m.uniqueId,
          newSection: 'additional',
          oldSection,
        });
      }
    });

    console.log('✅ Section deletion completed:', {
      movedItemsCount,
      sectionId: mediaList.uniqueId,
      totalDynamicMedia: selectedDateObject.value.dynamicMedia?.length || 0,
    });
  };

  const addSong = (section: MediaSectionIdentifier | undefined) => {
    console.log('🎵 Adding song to section:', {
      currentSectionId: mediaList.uniqueId,
      targetSection: section,
    });

    window.dispatchEvent(
      new CustomEvent('openSongPicker', {
        detail: { section },
      }),
    );

    console.log('✅ Song picker event dispatched');
  };

  console.log(
    '🎯 useMediaSection composable initialized for:',
    mediaList.uniqueId,
  );

  return {
    addSong,
    deleteSection,
    expandedGroups,
    // State
    isCustomSection,
    isEmpty,
    isFirst,
    isLast,
    isRenaming,
    isSongButton,
    moveSection,
    sectionItems,
    updateSectionColor,
    // Actions
    updateSectionLabel,
    visibleItems,
  };
}
