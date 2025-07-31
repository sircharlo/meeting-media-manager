import type {
  DynamicMediaObject,
  MediaDivider,
  MediaSectionIdentifier,
} from 'src/types';

import { storeToRefs } from 'pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';

export function useMediaDividers(sectionId: MediaSectionIdentifier) {
  const currentState = useCurrentStateStore();
  const { selectedDateObject } = storeToRefs(currentState);

  // Helper function to get sort order
  const getSortOrder = (item: DynamicMediaObject | MediaDivider): number => {
    return typeof item.sortOrderOriginal === 'number'
      ? item.sortOrderOriginal
      : 0;
  };

  // Get dividers for this section
  const sectionDividers = computed(() => {
    const media = selectedDateObject.value?.dynamicMedia;
    if (!media) return [];

    return media
      .filter((item) => item.section === sectionId && item.type === 'divider')
      .map(
        (item) =>
          ({
            bgColor: item.bgColor,
            id: item.uniqueId,
            section: item.section,
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
    const media = selectedDateObject.value?.dynamicMedia;
    if (!media) return [];

    return media
      .filter((item) => item.section === sectionId && item.type !== 'divider')
      .sort((a, b) => getSortOrder(a) - getSortOrder(b));
  });

  // Create a new divider
  const addDivider = (title: string, position?: number) => {
    const media = selectedDateObject.value?.dynamicMedia;
    if (!media) return;

    const newDivider: DynamicMediaObject = {
      section: sectionId,
      sectionOriginal: sectionId,
      sortOrderOriginal: position ?? media.length,
      source: 'additional',
      title,
      type: 'divider',
      uniqueId: `divider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    media.unshift(newDivider);

    console.log('✅ Divider added:', {
      dividerId: newDivider.uniqueId,
      position,
      sectionId,
      title,
    });
  };

  // Update divider title
  const updateDividerTitle = (dividerId: string, newTitle: string) => {
    const media = selectedDateObject.value?.dynamicMedia;
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
    const media = selectedDateObject.value?.dynamicMedia;
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
  const deleteDivider = (dividerId: string) => {
    const media = selectedDateObject.value?.dynamicMedia;
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
    const media = selectedDateObject.value?.dynamicMedia;
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
