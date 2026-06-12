import type { MediaItem } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { ref } from 'vue';

const isDragging = ref(false);
let dragStateListenersRegistered = false;

export function useMediaDragAndDrop(items: MediaItem[]) {
  registerDragStateListeners();

  const [dragDropContainer, reactiveItems] = useDragAndDrop<MediaItem>(items, {
    draggable: (child) => child.classList.contains('sortable-media__item'),
    group: 'mediaList',
    multiDrag: true,
    plugins: [animations()],
    // Don't use a selected class since we're handling selection independently with click events.
    selectedClass: undefined,
  });

  return {
    dragDropContainer,
    isDragging,
    sortableItems: reactiveItems,
  };
}

function registerDragStateListeners() {
  if (dragStateListenersRegistered) return;

  state.on('dragStarted', () => {
    isDragging.value = true;
  });

  state.on('dragEnded', () => {
    isDragging.value = false;
  });

  dragStateListenersRegistered = true;
}
