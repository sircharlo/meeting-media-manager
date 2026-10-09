import type { MediaItem } from 'src/types';

import { resetState, state } from '@formkit/drag-and-drop';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

// Formkit's own per-node/per-parent listeners are exactly what crashes on a
// foreign drop (Sentry MMM-V2-3BG) when their internal drag state is absent
// - so real formkit internals are deliberately not exercised here. Mocking
// out useDragAndDrop keeps dragDropContainer a genuine DOM element (Vue's
// own template-ref system still populates it on mount) without formkit
// attaching any listeners of its own to it, so these tests can verify only
// this composable's own suppressForeignDrop guard in isolation.
vi.mock('@formkit/drag-and-drop/vue', () => ({
  useDragAndDrop: () => [ref(undefined), ref([])],
}));

const { useMediaDragAndDrop } = await import('../useMediaDragAndDrop');

const TestHost = defineComponent({
  setup() {
    const { dragDropContainer } = useMediaDragAndDrop([] as MediaItem[]);
    return () =>
      h('div', { ref: dragDropContainer }, [h('div', { class: 'child' })]);
  },
});

function dispatchDrop(target: Element) {
  target.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));
}

// What formkit's own dragstart handler leaves behind for a drag it started.
function startFormkitDrag() {
  Object.assign(state, { draggedNode: { el: document.createElement('div') } });
  state.emit('dragStarted', state);
}

describe('useMediaDragAndDrop - foreign drop suppression (MMM-V2-3BG)', () => {
  afterEach(() => {
    // formkit's drag state and isDraggingGlobal are module-level state
    // shared across tests - reset both the way a real drag end would.
    resetState();
    state.emit('dragEnded', state);
  });

  it('stops a drop that was never a validated formkit drag from reaching ancestors', async () => {
    const wrapper = mount(TestHost, { attachTo: document.body });
    await nextTick(); // let the watch() that attaches the guard listener flush
    const child = wrapper.element.querySelector('.child') as HTMLElement;
    const ancestorListener = vi.fn();
    document.body.addEventListener('drop', ancestorListener);

    expect(() => dispatchDrop(child)).not.toThrow();
    expect(ancestorListener).not.toHaveBeenCalled();

    document.body.removeEventListener('drop', ancestorListener);
    wrapper.unmount();
  });

  it('lets a drop through once a formkit drag has actually started', async () => {
    const wrapper = mount(TestHost, { attachTo: document.body });
    await nextTick();
    const child = wrapper.element.querySelector('.child') as HTMLElement;
    startFormkitDrag();

    const ancestorListener = vi.fn();
    document.body.addEventListener('drop', ancestorListener);

    dispatchDrop(child);
    expect(ancestorListener).toHaveBeenCalledTimes(1);

    document.body.removeEventListener('drop', ancestorListener);
    wrapper.unmount();
  });

  it('stops suppressing once a formkit drag has ended', async () => {
    const wrapper = mount(TestHost, { attachTo: document.body });
    await nextTick();
    const child = wrapper.element.querySelector('.child') as HTMLElement;
    startFormkitDrag();
    resetState();
    state.emit('dragEnded', state);

    const ancestorListener = vi.fn();
    document.body.addEventListener('drop', ancestorListener);

    dispatchDrop(child);
    expect(ancestorListener).not.toHaveBeenCalled();

    document.body.removeEventListener('drop', ancestorListener);
    wrapper.unmount();
  });

  // formkit's tearDown() (a list unmounting or re-initialising mid-drag)
  // resets its drag state without emitting dragEnded - the guard used to
  // trust a flag mirrored from those events and let the next drop crash.
  it('suppresses a drop after formkit resets its drag state without dragEnded', async () => {
    const wrapper = mount(TestHost, { attachTo: document.body });
    await nextTick();
    const child = wrapper.element.querySelector('.child') as HTMLElement;
    startFormkitDrag();
    resetState();

    const ancestorListener = vi.fn();
    document.body.addEventListener('drop', ancestorListener);

    dispatchDrop(child);
    expect(ancestorListener).not.toHaveBeenCalled();

    document.body.removeEventListener('drop', ancestorListener);
    wrapper.unmount();
  });

  // Asserted on the event itself: happy-dom also skips a target's remaining
  // listeners on plain stopPropagation(), but Chromium (per the DOM spec)
  // doesn't - so formkit's own listener on the container would still run.
  it('stops a foreign drop on the container itself from reaching its other listeners', async () => {
    const wrapper = mount(TestHost, { attachTo: document.body });
    await nextTick();
    const event = new Event('drop', { bubbles: true, cancelable: true });
    const stopImmediate = vi.spyOn(event, 'stopImmediatePropagation');

    wrapper.element.dispatchEvent(event);
    expect(stopImmediate).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('detaches its listener from a container that unmounts', async () => {
    const wrapper = mount(TestHost, { attachTo: document.body });
    await nextTick();
    const container = wrapper.element as HTMLElement;
    const removeSpy = vi.spyOn(container, 'removeEventListener');

    wrapper.unmount();

    expect(removeSpy).toHaveBeenCalledWith('drop', expect.any(Function), true);
  });
});
