import type { MediaItem } from 'src/types';

import { state } from '@formkit/drag-and-drop';
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

describe('useMediaDragAndDrop - foreign drop suppression (MMM-V2-3BG)', () => {
  afterEach(() => {
    // isDraggingGlobal is module-level state shared across tests - reset it
    // the same way a real drag end would.
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
    state.emit('dragStarted', state);

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
    state.emit('dragStarted', state);
    state.emit('dragEnded', state);

    const ancestorListener = vi.fn();
    document.body.addEventListener('drop', ancestorListener);

    dispatchDrop(child);
    expect(ancestorListener).not.toHaveBeenCalled();

    document.body.removeEventListener('drop', ancestorListener);
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
