import type { MediaItem } from 'src/types';

import { animations, state } from '@formkit/drag-and-drop';
import { useDragAndDrop } from '@formkit/drag-and-drop/vue';
import { onScopeDispose, ref, watch } from 'vue';

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

  // formkit's own per-node/per-parent drop handlers assume a drag it
  // validated itself (see isDraggingGlobal above) - dropping something it
  // never saw start (an OS file drag, a drag from another window) leaves its
  // internal drag state absent and crashes inside its own handler ("Cannot
  // read properties of undefined (reading 'map')", Sentry MMM-V2-3BG).
  // formkit's root-level `document` listener guards against this correctly,
  // but the listeners it registers directly on the sortable container and
  // its children don't. Intercept in the capture phase - which, for an
  // ancestor of the actual drop target, always runs before the target's own
  // listeners - and stop the event right there for any drop formkit didn't
  // start. This is deliberately scoped to just this container rather than
  // window/document: a foreign file dropped on this container is exactly
  // the crash case, but a foreign file dropped anywhere else (in particular
  // MediaCalendarPage.vue's own drag-and-drop-to-import feature, which
  // shows a separate dialog to receive the drop) must be left alone.
  const suppressForeignDrop = (event: DragEvent) => {
    if (!isDraggingGlobal.value) {
      event.stopPropagation();
    }
  };

  // Tracked separately from dragDropContainer.value itself: Vue nulls a root
  // element's template ref as the very first step of unmounting it (before
  // this component's own onUnmounted/onScopeDispose callbacks run, and
  // before the watch() below's queued reaction is guaranteed to still fire -
  // its effect can already be stopped by the time that pre-flush job would
  // execute). Reading dragDropContainer.value from a cleanup hook is
  // therefore not reliable; this plain variable, set the moment a container
  // is actually assigned, is.
  let attachedContainer: HTMLElement | undefined;

  watch(dragDropContainer, (container, previousContainer) => {
    previousContainer?.removeEventListener('drop', suppressForeignDrop, true);
    container?.addEventListener('drop', suppressForeignDrop, true);
    attachedContainer = container;
  });

  onScopeDispose(() => {
    attachedContainer?.removeEventListener('drop', suppressForeignDrop, true);
  });

  return {
    dragDropContainer,
    isDragging: isDraggingGlobal,
    sortableItems: reactiveItems,
  };
}
