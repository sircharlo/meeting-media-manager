import type { MediaItem } from 'src/types';

import {
  animations,
  isDragState,
  type NodeRecord,
  type ParentRecord,
  state,
} from '@formkit/drag-and-drop';
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
  // Returns the uniqueIds of the media items currently selected (highlighted)
  // in the calendar. When given, dragging a selected item carries every other
  // highlighted item of the same list along with it - see getDraggedNodes.
  getSelectedIds?: () => readonly string[] | undefined;
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
    getSelectedIds,
    group = 'mediaList',
    multiDrag = true,
  } = options;

  // Which items a drag carries. formkit's default takes them from its own
  // selection, which it builds only from the ctrl/shift pointerdowns it sees
  // within one list - but what the user sees highlighted is the calendar's
  // own selection (selectedMediaItems), which can also come from the
  // keyboard (Ctrl+A, Shift+arrows) or a Shift-click range spanning
  // sections, and the two drift apart easily (a plain click on an item
  // formkit already has selected even clears formkit's selection outright).
  // So derive the dragged set from the calendar's selection instead: just
  // the pressed item if it isn't selected, otherwise every highlighted item
  // of this same list, in list order. Hidden items and dividers can land in
  // a Shift-click range without ever being highlighted, so they stay put,
  // as do selected items in other lists - one drag only moves one list's
  // items.
  const getDraggedNodes = ({
    node,
    parent,
  }: {
    node: NodeRecord<MediaItem>;
    parent: ParentRecord<MediaItem>;
  }) => {
    const selectedIds = getSelectedIds?.();
    if (!selectedIds?.includes(node.data.value.uniqueId)) return [node];

    return parent.data.enabledNodes.filter(
      ({ data: { value }, el }) =>
        el === node.el ||
        (!value.hidden &&
          value.type !== 'divider' &&
          selectedIds.includes(value.uniqueId)),
    );
  };

  const [dragDropContainer, reactiveItems] = useDragAndDrop<MediaItem>(items, {
    draggedNodes: getDraggedNodes,
    dragHandle,
    group,
    // formkit's default blur handler, which it registers in the capture
    // phase on every sortable node, resets the pressed node's `draggable`
    // to `!dragHandle` - i.e. false, since we always use a handle -
    // whenever anything inside ANY node loses focus. Quasar's clickable
    // QItem moves focus into its own .q-focus-helper child on every click,
    // so once an item has been clicked (which is exactly how a ctrl/shift
    // multi-selection gets built), the next drag's mousedown blurs that
    // helper and turns off the `draggable` formkit had just turned on in
    // its pointerdown handler, so Chromium never starts the drag and
    // nothing moves. With a drag handle, `draggable` is only ever enabled
    // during a validated pointerdown and reset on pointerup anyway, so the
    // blur "restore" has nothing legitimate left to do.
    handleNodeBlur: () => undefined,
    multiDrag,
    plugins: [animations()],
    // Don't use a selected class since we're handling selection independently with click events
    selectedClass: undefined,
  });

  // formkit's own per-node/per-parent drop handlers assume a drag it
  // validated itself - dropping something it never saw start (an OS file
  // drag, a drag from another window) leaves its internal drag state absent
  // and crashes inside its own handler ("Cannot read properties of
  // undefined (reading 'map')", Sentry MMM-V2-3BG).
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
  //
  // This reads formkit's live drag state rather than isDraggingGlobal:
  // formkit can reset that state without emitting dragEnded (its tearDown(),
  // when a list unmounts or re-initialises mid-drag, e.g. as imported items
  // land in it), which left the mirrored flag stuck on and let the next drop
  // through to crash. And stopImmediatePropagation, not stopPropagation: a
  // drop directly on the container must not reach formkit's own listener on
  // that same element either.
  const suppressForeignDrop = (event: DragEvent) => {
    if (!isDragState(state)) {
      event.stopImmediatePropagation();
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
