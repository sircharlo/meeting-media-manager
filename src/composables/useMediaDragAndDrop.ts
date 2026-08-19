import type { MediaItem } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { ref } from 'vue';

interface UseMediaDragAndDropOptions {
  // Selector for what starts a drag - defaults to the top-level handle.
  // A group's children list passes its own ('.group-child-drag-handle') so
  // the two drag zones can never respond to the same pointerdown: searching
  // "at any depth" inside a group's own sortable node would otherwise also
  // match its children's handles, and dragging a child would move the
  // whole group again (the exact bug the handle split was meant to fix).
  dragHandle?: string;
  // Cross-container group name - containers sharing the same name can drag
  // items between each other. Defaults to the shared top-level group name
  // so sections can still exchange items as before. A group's children list
  // passes its own unique value (there's exactly one children list per
  // group, so its own uniqueId-derived name is never shared by anything
  // else) to keep it fully self-contained: children can be reordered within
  // their own group but never dragged out into another group or the
  // top-level list, which isn't part of what was asked for here and would
  // need its own persistence handling.
  group?: string;
  multiDrag?: boolean;
}

// @formkit/drag-and-drop's `state` is a single object shared by every
// drag-and-drop instance on the page (there's only ever one active native
// drag at a time), and its `.on()` has no matching `.off()`/unsubscribe —
// every listener added is kept forever in a shared internal Map. Since this
// composable used to call `state.on(...)` once per call (i.e. once per
// mounted MediaList/MediaGroup instance), every remount — e.g. every
// calendar-day switch — permanently added another pair of listeners closing
// over that instance's stale refs. Because all of those listeners already
// fired for the exact same global drag events regardless of which
// list/group triggered them, every instance's own isDragging ref was always
// in lock-step anyway — so registering the listeners exactly once here,
// against one shared ref, removes the leak with no observable behavior
// change.
const isDraggingGlobal = ref(false);
state.on('dragStarted', () => {
  isDraggingGlobal.value = true;
});
state.on('dragEnded', () => {
  isDraggingGlobal.value = false;
});

export function useMediaDragAndDrop(
  items: MediaItem[],
  options: UseMediaDragAndDropOptions = {},
) {
  const {
    dragHandle = '.section-drag-handle',
    group = 'mediaList',
    multiDrag = true,
  } = options;

  const [dragDropContainer, reactiveItems] = useDragAndDrop<MediaItem>(items, {
    dragHandle,
    group,
    multiDrag,
    plugins: [animations()],
    // Don't use a selected class since we're handling selection independently with click events
    selectedClass: undefined,
  });

  return {
    dragDropContainer,
    isDragging: isDraggingGlobal,
    sortableItems: reactiveItems,
  };
}
