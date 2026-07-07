import type { MediaItem } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { ref } from 'vue';

export function useMediaDragAndDrop(items: MediaItem[]) {
  const isDragging = ref(false);

  // Use the drag and drop composable with shared group for cross-section dragging
  const [dragDropContainer, reactiveItems] = useDragAndDrop<MediaItem>(items, {
    // The empty-state placeholder is rendered inside the drop container so it
    // can act as a drop target, but it isn't a sortable value - exclude it or
    // its node count won't match the (possibly empty) items array.
    draggable: (child) => !Object.hasOwn(child.dataset, 'nonDraggable'),
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
