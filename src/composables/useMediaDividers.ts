import type {
  MediaDivider,
  MediaItem,
  MediaSectionIdentifier,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { findMediaSection } from 'src/helpers/media-sections';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';

export function useMediaDividers(sectionId?: MediaSectionIdentifier) {
  const currentState = useCurrentStateStore();
  const { selectedDateObject } = storeToRefs(currentState);

  // Helper function to get sort order
  const getSortOrder = (item: MediaDivider | MediaItem): number => {
    return typeof item.sortOrderOriginal === 'number'
      ? item.sortOrderOriginal
      : 0;
  };

  // Get dividers for this section
  const sectionDividers = computed(() => {
    if (!sectionId || !selectedDateObject.value?.mediaSections) return [];
    const media = findMediaSection(
      selectedDateObject.value?.mediaSections,
      sectionId,
    )?.items;
    if (!media) return [];

    return media
      .filter((item) => item.type === 'divider')
      .map(
        (item) =>
          ({
            bgColor: item.bgColor,
            id: item.uniqueId,
            section: sectionId,
            sortOrderOriginal: item.sortOrderOriginal,
            textColor: item.textColor,
            title: item.title,
            uniqueId: item.uniqueId,
          }) as MediaDivider,
      )
      .sort((a, b) => getSortOrder(a) - getSortOrder(b));
  });

  // Get media items (excluding dividers) for this section
  const sectionMediaItems = computed(() => {
    if (!sectionId || !selectedDateObject.value?.mediaSections) return [];
    const media = findMediaSection(
      selectedDateObject.value?.mediaSections,
      sectionId,
    )?.items;
    if (!media) return [];

    return media
      .filter((item) => item.type !== 'divider')
      .sort((a, b) => getSortOrder(a) - getSortOrder(b));
  });

  // Create a new divider
  const addDivider = (title?: string, addToTop = true) => {
    if (!selectedDateObject.value?.mediaSections) return;
    if (!sectionId) return;

    // Get section-specific media items to determine proper position
    const sectionMedia = findMediaSection(
      selectedDateObject.value.mediaSections,
      sectionId,
    );
    if (!sectionMedia?.items) return;
    const sectionMediaCount = sectionMedia.items.length;

    console.log('🔍 Adding divider:', { addToTop, title }, sectionMediaCount);

    const newDivider: MediaItem = {
      sortOrderOriginal: addToTop ? 0 : sectionMediaCount,
      source: 'additional',
      title: title ?? '',
      type: 'divider',
      uniqueId: `divider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Add divider to the section
    if (!sectionMedia?.items) return;

    if (addToTop) {
      sectionMedia.items.unshift(newDivider);
    } else {
      sectionMedia.items.push(newDivider);
    }

    console.log('✅ Divider added:', {
      dividerId: newDivider.uniqueId,
      sectionId,
      title,
    });
  };

  // Update divider title
  const updateDividerTitle = (dividerId: string, newTitle: string) => {
    if (!sectionId || !selectedDateObject.value?.mediaSections || !dividerId)
      return;
    const media = findMediaSection(
      selectedDateObject.value?.mediaSections,
      sectionId,
    )?.items;
    if (!media) return;

    const divider = media.find(
      (item) => item.uniqueId === dividerId && item.type === 'divider',
    );

    if (!divider) return;

    divider.title = newTitle;
    console.log('✅ Divider title updated:', { dividerId, newTitle });
  };

  // Update divider colors
  const updateDividerColors = (
    dividerId: string,
    bgColor: string,
    textColor: string,
  ) => {
    if (!sectionId || !selectedDateObject.value?.mediaSections || !dividerId)
      return;
    const media = findMediaSection(
      selectedDateObject.value?.mediaSections,
      sectionId,
    )?.items;
    if (!media) return;

    const divider = media.find(
      (item) => item.uniqueId === dividerId && item.type === 'divider',
    );

    if (!divider) return;

    divider.bgColor = bgColor;
    divider.textColor = textColor;
    console.log('✅ Divider colors updated:', {
      bgColor,
      dividerId,
      textColor,
    });
  };

  // Delete divider
  const deleteDivider = (dividerId?: string) => {
    if (!sectionId || !selectedDateObject.value?.mediaSections || !dividerId)
      return;
    const media = findMediaSection(
      selectedDateObject.value?.mediaSections,
      sectionId,
    )?.items;
    if (!media) return;

    const index = media.findIndex(
      (item) => item.uniqueId === dividerId && item.type === 'divider',
    );

    if (index === -1) return;

    media.splice(index, 1);
    console.log('✅ Divider deleted:', { dividerId, sectionId });
  };

  // Move divider to new position
  const moveDivider = (dividerId: string, newPosition: number) => {
    if (!sectionId || !selectedDateObject.value?.mediaSections) return;
    const media = findMediaSection(
      selectedDateObject.value?.mediaSections,
      sectionId,
    )?.items;
    if (!media) return;

    const divider = media.find(
      (item) => item.uniqueId === dividerId && item.type === 'divider',
    );

    if (!divider) return;

    divider.sortOrderOriginal = newPosition;
    console.log('✅ Divider moved:', { dividerId, newPosition });
  };

  // // Get combined list of media items and dividers in order
  // const getOrderedItems = computed(() => {
  //   const mediaItems = sectionMediaItems.value;
  //   const dividers = sectionDividers.value;

  //   // Create a combined array and sort by sortOrder
  //   const allItems = [
  //     ...mediaItems.map(item => ({ ...item, itemType: 'media' as const })),
  //     ...dividers.map(divider => ({ ...divider, itemType: 'divider' as const }))
  //   ];

  //   return allItems.sort((a, b) => {
  //     const aOrder = typeof a.sortOrderOriginal === 'number' ? a.sortOrderOriginal : 0;
  //     const bOrder = typeof b.sortOrderOriginal === 'number' ? b.sortOrderOriginal : 0;
  //     return aOrder - bOrder;
  //   });
  // });

  return {
    addDivider,
    deleteDivider,
    // getOrderedItems,
    moveDivider,
    sectionDividers,
    sectionMediaItems,
    updateDividerColors,
    updateDividerTitle,
  };
}
