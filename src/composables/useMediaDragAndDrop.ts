import type { DynamicMediaObject } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { nextTick, ref, watch } from 'vue';

export function useMediaDragAndDrop(
  items: DynamicMediaObject[],
  onOrderChange: (newOrder: DynamicMediaObject[]) => void,
  sectionId?: string,
) {
  const isDragging = ref(false);
  const isInternalUpdate = ref(false);

  // Create debounced version of the order change callback
  const debouncedOrderChange = debounce(onOrderChange, 100);

  // Use the drag and drop composable with shared group for cross-section dragging
  const [dragDropContainer, sortableItems] = useDragAndDrop<DynamicMediaObject>(
    items,
    {
      disabled: false,
      dropZone: true,
      group: 'mediaList', // Shared group to allow cross-section dragging
      multiDrag: true,
      plugins: [animations()],
      selectedClass: 'sortable-selected',
    },
  );

  // Watch for changes in items and update sortable items only for external changes
  watch(
    () => items,
    (newItems, oldItems) => {
      // Skip update if this is an internal update from drag operations
      if (isInternalUpdate.value) {
        console.log(
          '🔄 Skipping sortableItems update (internal drag operation):',
          {
            itemCount: newItems.length,
            sectionId,
          },
        );
        return;
      }

      // Check if this is a meaningful external change
      const isExternalChange =
        !oldItems ||
        oldItems.length !== newItems.length ||
        !oldItems.every(
          (item, index) => item.uniqueId === newItems[index]?.uniqueId,
        );

      if (isExternalChange) {
        console.log('🔄 Updating sortableItems from external change:', {
          isDragging: isDragging.value,
          newItemCount: newItems.length,
          oldItemCount: oldItems?.length || 0,
          sectionId,
        });

        // Only update if not currently dragging
        if (!isDragging.value) {
          sortableItems.value = newItems;
        } else {
          console.log(
            '⏸️ Deferring sortableItems update (currently dragging):',
            {
              sectionId,
            },
          );
        }
      }
    },
    { immediate: true },
  );

  // Handle drag state
  state.on('dragStarted', () => {
    isDragging.value = true;
    isInternalUpdate.value = true;
    console.log('🎯 Drag started, marking as internal update:', { sectionId });
  });

  state.on('dragEnded', () => {
    isDragging.value = false;

    // Update order when drag is complete using debounced callback
    nextTick(() => {
      console.log('🎯 Drag ended, updating order:', {
        itemCount: sortableItems.value.length,
        items: sortableItems.value.map((item) => ({
          section: item.section,
          uniqueId: item.uniqueId,
        })),
        sectionId,
      });
      debouncedOrderChange(sortableItems.value);

      // Reset internal update flag after a short delay to allow for any reactive updates
      setTimeout(() => {
        isInternalUpdate.value = false;
        console.log('✅ Reset internal update flag:', { sectionId });
      }, 200);
    });
  });

  // Method to force update sortable items (for external operations like reset-sort)
  const forceUpdateSortableItems = (newItems: DynamicMediaObject[]) => {
    console.log('🔄 Force updating sortableItems:', {
      isDragging: isDragging.value,
      itemCount: newItems.length,
      sectionId,
    });

    if (!isDragging.value) {
      sortableItems.value = newItems;
    } else {
      console.log('⏸️ Cannot force update while dragging:', { sectionId });
    }
  };

  return {
    dragDropContainer,
    forceUpdateSortableItems,
    isDragging,
    sortableItems,
  };
}

function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
