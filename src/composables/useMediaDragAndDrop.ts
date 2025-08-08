import type { MediaItem } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { onMounted, onUnmounted, ref } from 'vue';

export function useMediaDragAndDrop(items: MediaItem[], sectionId: string) {
  const isDragging = ref(false);

  // Use the drag and drop composable with shared group for cross-section dragging
  const [dragDropContainer, sortableItems] = useDragAndDrop<MediaItem>(items, {
    // disabled: false,
    // dropZone: true,
    group: 'mediaList', // Shared group to allow cross-section dragging
    multiDrag: true,
    plugins: [animations()],
    selectedClass: 'sortable-selected',
  });

  // Handle drag state
  state.on('dragStarted', () => {
    isDragging.value = true;
  });

  state.on('dragEnded', () => {
    isDragging.value = false;
  });

  const resetSortOrderHandler = () => {
    // Since items are already filtered by section, we can just use all items
    sortableItems.value = items;
    console.log('🔄 Reset sort order success for section', sectionId);
  };

  onMounted(() => {
    window.addEventListener('reset-sort-order', resetSortOrderHandler);
  });

  onUnmounted(() => {
    window.removeEventListener('reset-sort-order', resetSortOrderHandler);
  });

  return {
    dragDropContainer,
    isDragging,
    sortableItems,
  };
}
