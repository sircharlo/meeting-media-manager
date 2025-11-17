import type { MediaItem } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { ref } from 'vue';

export function useMediaDragAndDrop(items: MediaItem[]) {
  const isDragging = ref(false);

  // Use the drag and drop composable with shared group for cross-section dragging
  const [dragDropContainer, reactiveItems] = useDragAndDrop<MediaItem>(items, {
    group: 'mediaList', // Shared group to allow cross-section dragging
    multiDrag: true,
    plugins: [animations()],
    // Don't use a selected class since we're handling selection independently with click events
    selectedClass: undefined,
  });

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
    sortableItems: reactiveItems,
  };
}
