import type { DynamicMediaObject } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { ref } from 'vue';

export function useMediaDragAndDrop(items: DynamicMediaObject[]) {
  const isDragging = ref(false);

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

  // Handle drag state
  state.on('dragStarted', () => {
    isDragging.value = true;
  });

  state.on('dragEnded', () => {
    isDragging.value = false;
  });

  return {
    dragDropContainer,
    isDragging,
    sortableItems,
  };
}
