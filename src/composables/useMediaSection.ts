import type {
  DynamicMediaObject,
  MediaSection,
  MediaSectionIdentifier,
} from 'src/types';

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
    console.log('🔍 isCustomSection computed:', {
      result,
      uniqueId: mediaList.uniqueId,
    });
    return result;
  });

  const sectionItems = computed(() => {
    const items =
      selectedDateObject.value?.dynamicMedia?.filter(
        (m) => m.section === mediaList.uniqueId,
      ) || [];
    console.log('📋 sectionItems computed:', {
      itemCount: items.length,
      items: items.map((item) => ({
        title: item.title,
        uniqueId: item.uniqueId,
      })),
      sectionId: mediaList.uniqueId,
    });
    return items;
  });

  const visibleItems = computed(() => {
    const items = sectionItems.value.filter((m) => !m.hidden);
    console.log('👁️ visibleItems computed:', {
      hiddenCount: sectionItems.value.length - items.length,
      sectionId: mediaList.uniqueId,
      totalItems: sectionItems.value.length,
      visibleCount: items.length,
    });
    return items;
  });

  const isEmpty = computed(() => {
    const result = sectionItems.value.length === 0;
    console.log('📭 isEmpty computed:', {
      isEmpty: result,
      itemCount: sectionItems.value.length,
      sectionId: mediaList.uniqueId,
    });
    return result;
  });

  const isSongButton = computed(() => {
    const result =
      (mediaList.uniqueId === 'additional' &&
        selectedDateObject.value?.meeting === 'we') ||
      (mediaList.uniqueId === 'circuitOverseer' &&
        !sectionItems.value.some((m) => m.hidden));
    console.log('🎵 isSongButton computed:', {
      hasHiddenItems: sectionItems.value.some((m) => m.hidden),
      meeting: selectedDateObject.value?.meeting,
      result,
      sectionId: mediaList.uniqueId,
    });
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
    console.log('📍 currentIndex computed:', {
      currentIndex: index,
      customSectionsCount: customSections.value.length,
      sectionId: mediaList.uniqueId,
    });
    return index;
  });
  const isFirst = computed(() => {
    const result = currentIndex.value === 0;
    console.log('🥇 isFirst computed:', {
      currentIndex: currentIndex.value,
      isFirst: result,
      sectionId: mediaList.uniqueId,
    });
    return result;
  });
  const isLast = computed(() => {
    const result = currentIndex.value === customSections.value.length - 1;
    console.log('🥉 isLast computed:', {
      currentIndex: currentIndex.value,
      isLast: result,
      sectionId: mediaList.uniqueId,
      totalSections: customSections.value.length,
    });
    return result;
  });

  // UI state
  const isRenaming = ref(false);
  const expandedGroups = ref<Record<string, boolean>>({});

  // Initialize expanded groups
  watch(
    () => sectionItems.value,
    (items) => {
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

  // Call tracking to prevent duplicate calls
  let lastUpdateTime = 0;
  let lastUpdateHash = '';

  const updateMediaOrder = (newOrder: DynamicMediaObject[]) => {
    const now = Date.now();
    const newOrderHash = JSON.stringify(newOrder.map((item) => item.uniqueId));

    // Prevent duplicate calls within 50ms
    if (now - lastUpdateTime < 50) {
      console.log(
        '⏭️ Skipping duplicate updateMediaOrder call (time threshold):',
        {
          sectionId: mediaList.uniqueId,
          timeSinceLastCall: now - lastUpdateTime,
        },
      );
      return;
    }

    // Prevent duplicate calls with same order
    if (newOrderHash === lastUpdateHash) {
      console.log('⏭️ Skipping duplicate updateMediaOrder call (same order):', {
        sectionId: mediaList.uniqueId,
      });
      return;
    }

    lastUpdateTime = now;
    lastUpdateHash = newOrderHash;

    console.log('🔄 Updating media order:', {
      newOrderItems: newOrder.map((item) => ({
        section: item.section,
        title: item.title,
        uniqueId: item.uniqueId,
      })),
      newOrderLength: newOrder.length,
      sectionId: mediaList.uniqueId,
    });

    if (!selectedDateObject.value?.dynamicMedia) {
      console.warn('⚠️ No dynamic media found for order update');
      return;
    }

    // SAFETY CHECK: Ensure all items in newOrder exist in the store
    const storeItemIds = new Set(
      selectedDateObject.value.dynamicMedia.map((item) => item.uniqueId),
    );
    const newOrderItemIdsSet = new Set(newOrder.map((item) => item.uniqueId));

    // Check for missing items (items in newOrder that don't exist in store)
    const missingItems = [...newOrderItemIdsSet].filter(
      (id) => !storeItemIds.has(id),
    );
    if (missingItems.length > 0) {
      console.error(
        '❌ SAFETY VIOLATION: Items in newOrder not found in store:',
        {
          missingItems,
          sectionId: mediaList.uniqueId,
        },
      );
      return; // Abort the operation
    }

    // Check for duplicate items in newOrder
    const duplicateItems = newOrder.filter(
      (item, index) =>
        newOrder.findIndex((other) => other.uniqueId === item.uniqueId) !==
        index,
    );
    if (duplicateItems.length > 0) {
      console.error('❌ SAFETY VIOLATION: Duplicate items in newOrder:', {
        duplicateItems: duplicateItems.map((item) => item.uniqueId),
        sectionId: mediaList.uniqueId,
      });
      return; // Abort the operation
    }

    // Get current section items from store
    const currentSectionStoreItems = selectedDateObject.value.dynamicMedia
      .filter((item) => item.section === mediaList.uniqueId)
      .map((item) => item.uniqueId);

    // Get new order for current section
    const newOrderItemIds = newOrder.map((item) => item.uniqueId);

    console.log('🔍 Current section comparison:', {
      allStoreItems: selectedDateObject.value.dynamicMedia.map((item) => ({
        section: item.section,
        uniqueId: item.uniqueId,
      })),
      newOrderItems: newOrderItemIds,
      sectionId: mediaList.uniqueId,
      storeItems: currentSectionStoreItems,
    });

    // Check if order changed for this section
    const orderChanged =
      currentSectionStoreItems.length !== newOrderItemIds.length ||
      !currentSectionStoreItems.every(
        (id, index) => id === newOrderItemIds[index],
      );

    if (!orderChanged) {
      console.log('✅ No changes needed for section:', mediaList.uniqueId);
      return;
    }

    console.log('🔄 Order changed for section:', {
      newOrder: newOrderItemIds,
      oldOrder: currentSectionStoreItems,
      sectionId: mediaList.uniqueId,
    });

    // Step 1: Update sections for items that are being moved between sections
    console.log('🔍 newOrder items with sections:', {
      newOrderItems: newOrder.map((item) => ({
        section: item.section,
        uniqueId: item.uniqueId,
      })),
      sectionId: mediaList.uniqueId,
    });

    let updatedDynamicMedia = selectedDateObject.value.dynamicMedia.map(
      (item) => {
        const newOrderItem = newOrder.find(
          (orderItem) => orderItem.uniqueId === item.uniqueId,
        );
        console.warn('🔍 newOrderItem:', newOrderItem);
        if (newOrderItem && newOrderItem.section !== mediaList.uniqueId) {
          // This item is being moved to a different section
          console.log('🔄 Moving item between sections:', {
            fromSection: newOrderItem.section,
            itemId: item.uniqueId,
            toSection: mediaList.uniqueId,
          });
          return { ...item, section: mediaList.uniqueId };
        }
        return item;
      },
    );

    // Step 2: Create the final array with correct order
    const finalItems: DynamicMediaObject[] = [];

    // Add items from other sections first (unchanged)
    updatedDynamicMedia.forEach((item) => {
      if (item.section !== mediaList.uniqueId) {
        finalItems.push(item);
      }
    });

    // Add items from the current section in the new order
    newOrder.forEach((orderItem) => {
      const item = updatedDynamicMedia.find(
        (item) => item.uniqueId === orderItem.uniqueId,
      );
      if (item) {
        finalItems.push(item);
      }
    });

    updatedDynamicMedia = finalItems;

    // SAFETY CHECK: Ensure we have all items from the original store
    const originalItemIds = new Set(
      selectedDateObject.value.dynamicMedia.map((item) => item.uniqueId),
    );
    const updatedItemIds = new Set(
      updatedDynamicMedia.map((item) => item.uniqueId),
    );

    if (originalItemIds.size !== updatedItemIds.size) {
      console.error('❌ SAFETY VIOLATION: Item count mismatch:', {
        extraItems: [...updatedItemIds].filter(
          (id) => !originalItemIds.has(id),
        ),
        missingItems: [...originalItemIds].filter(
          (id) => !updatedItemIds.has(id),
        ),
        originalCount: originalItemIds.size,
        sectionId: mediaList.uniqueId,
        updatedCount: updatedItemIds.size,
      });
      return; // Abort the operation
    }

    // SAFETY CHECK: Ensure we have the same number of items
    if (
      updatedDynamicMedia.length !==
      selectedDateObject.value.dynamicMedia.length
    ) {
      console.error(
        '❌ SAFETY VIOLATION: Updated media count does not match original:',
        {
          originalCount: selectedDateObject.value.dynamicMedia.length,
          sectionId: mediaList.uniqueId,
          updatedCount: updatedDynamicMedia.length,
        },
      );
      return; // Abort the operation
    }

    console.log('🔄 Applying changes to store:', {
      sectionId: mediaList.uniqueId,
      updatedItems: updatedDynamicMedia.map((item) => ({
        section: item.section,
        uniqueId: item.uniqueId,
      })),
    });

    selectedDateObject.value.dynamicMedia = updatedDynamicMedia;

    // Dispatch event to notify other sections
    window.dispatchEvent(
      new CustomEvent('dragCompleted', {
        detail: {
          sectionId: mediaList.uniqueId,
          updatedItems: updatedDynamicMedia.length,
        },
      }),
    );
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
    updateMediaOrder,
    updateSectionColor,
    // Actions
    updateSectionLabel,
    visibleItems,
  };
}
