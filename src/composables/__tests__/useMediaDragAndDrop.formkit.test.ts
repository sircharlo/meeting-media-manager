import type { MediaItem } from 'src/types';

import { isDragState, resetState, state } from '@formkit/drag-and-drop';
import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, type PropType } from 'vue';

import { useMediaDragAndDrop } from '../useMediaDragAndDrop';

// Unlike useMediaDragAndDrop.test.ts, this exercises formkit's real
// per-node listeners. Each item mirrors MediaItem's clickable QItem - a
// focusable root (the sortable node), a row-wide drag handle, and the
// .q-focus-helper child that QItem moves focus into on every click.
const TestHost = defineComponent({
  props: {
    items: { required: true, type: Array as PropType<Partial<MediaItem>[]> },
    selectedIds: { default: () => [], type: Array as PropType<string[]> },
  },
  setup(props) {
    const { dragDropContainer, sortableItems } = useMediaDragAndDrop(
      props.items as MediaItem[],
      { getSelectedIds: () => props.selectedIds },
    );
    return () =>
      h(
        'div',
        { ref: dragDropContainer },
        sortableItems.value.map((item) =>
          h(
            'div',
            { 'data-id': item.uniqueId, key: item.uniqueId, tabindex: 0 },
            [
              h('div', { class: 'section-drag-handle' }, item.uniqueId),
              h('div', { class: 'q-focus-helper', tabindex: -1 }),
            ],
          ),
        ),
      );
  },
});

const mediaItems = (...ids: string[]): Partial<MediaItem>[] =>
  ids.map((uniqueId) => ({ type: 'media', uniqueId }));

async function mountHost(items: Partial<MediaItem>[], selectedIds?: string[]) {
  const wrapper = mount(TestHost, {
    attachTo: document.body,
    props: { items, selectedIds },
  });
  await nextTick(); // formkit initialises once the container ref is set
  return wrapper;
}

const itemEl = (wrapper: VueWrapper, id: string) =>
  wrapper.element.querySelector(`[data-id="${id}"]`) as HTMLElement;

const handleEl = (wrapper: VueWrapper, id: string) =>
  itemEl(wrapper, id).querySelector('.section-drag-handle') as HTMLElement;

function click(wrapper: VueWrapper, id: string, ctrlKey = false) {
  press(wrapper, id, ctrlKey);
  handleEl(wrapper, id).dispatchEvent(
    new PointerEvent('pointerup', { bubbles: true, ctrlKey }),
  );
}

function press(wrapper: VueWrapper, id: string, ctrlKey = false) {
  handleEl(wrapper, id).dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, ctrlKey }),
  );
}

// Presses an item and starts dragging it, returning the ids of every item
// the drag carries. No dataTransfer, so formkit skips building a drag image.
function startDrag(wrapper: VueWrapper, id: string) {
  press(wrapper, id);
  handleEl(wrapper, id).dispatchEvent(
    new Event('dragstart', { bubbles: true }),
  );
  if (!isDragState(state)) throw new Error('drag did not start');
  return state.draggedNodes.map(
    (node) => (node.data.value as MediaItem).uniqueId,
  );
}

afterEach(() => {
  // formkit's drag state and the composable's isDragging are module-level
  // state shared across tests - reset both the way a real drag end would.
  resetState();
  state.emit('dragEnded', state);
});

describe('useMediaDragAndDrop - drag start after clicking an item', () => {
  // Building a multi-selection means clicking items first, which leaves
  // focus on the last-clicked item's focus helper. The next drag's
  // mousedown moves focus off it, and formkit's default blur handler used
  // to turn the pressed item's `draggable` back off right after its own
  // pointerdown handler had turned it on - so no drag ever started.
  it.each([
    ['another item', 'a'],
    ['the same item', 'b'],
  ])(
    'keeps the pressed item draggable when focus leaves %s',
    async (_label, clickedId) => {
      const wrapper = await mountHost(mediaItems('a', 'b'));

      itemEl(wrapper, clickedId)
        .querySelector<HTMLElement>('.q-focus-helper')
        ?.focus();

      press(wrapper, 'b');
      expect(itemEl(wrapper, 'b').draggable).toBe(true);

      // mousedown's default action: focus moves to the pressed item.
      itemEl(wrapper, 'b').focus();
      expect(itemEl(wrapper, 'b').draggable).toBe(true);

      wrapper.unmount();
    },
  );
});

describe('useMediaDragAndDrop - which items a drag carries', () => {
  // formkit's own selection drifts from the highlighted one: a plain click
  // on an item it already has selected clears its selection outright, so
  // re-selecting A then Ctrl+B left formkit holding only B and dragging A
  // moved A alone, despite both being highlighted.
  it('drags every highlighted item even when formkit tracked a different selection', async () => {
    const wrapper = await mountHost(mediaItems('a', 'b', 'c'), ['a', 'b']);
    click(wrapper, 'a');
    click(wrapper, 'b', true);
    click(wrapper, 'a');
    click(wrapper, 'b', true);

    expect(startDrag(wrapper, 'a')).toEqual(['a', 'b']);

    wrapper.unmount();
  });

  // Ctrl+A / Shift+arrows never go through formkit at all, and a
  // Shift-click range can include items in other sections.
  it('drags this list’s highlighted items in list order, whichever is grabbed', async () => {
    const wrapper = await mountHost(mediaItems('a', 'b', 'c', 'd'), [
      'd',
      'other-section-item',
      'b',
    ]);

    expect(startDrag(wrapper, 'd')).toEqual(['b', 'd']);

    wrapper.unmount();
  });

  it('drags only the grabbed item when it is not highlighted', async () => {
    const wrapper = await mountHost(mediaItems('a', 'b', 'c'), ['a', 'b']);

    expect(startDrag(wrapper, 'c')).toEqual(['c']);

    wrapper.unmount();
  });

  it('leaves hidden items and dividers from a selected range behind', async () => {
    const wrapper = await mountHost(
      [
        { type: 'media', uniqueId: 'a' },
        { hidden: true, type: 'media', uniqueId: 'hidden' },
        { type: 'divider', uniqueId: 'divider' },
        { type: 'media', uniqueId: 'b' },
      ],
      ['a', 'hidden', 'divider', 'b'],
    );

    expect(startDrag(wrapper, 'a')).toEqual(['a', 'b']);

    wrapper.unmount();
  });
});
