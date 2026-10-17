import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VueZoomable from 'vue-zoomable';

import MediaItem from '../media/MediaItem.vue';

installQuasarPlugin();
installPinia();

// happy-dom does no layout, so every element reports a 0x0 box - and the pan
// bounds are derived from the thumbnail's size.
const THUMBNAIL_WIDTH = 160;
const THUMBNAIL_HEIGHT = 90;

let mountedItems: VueWrapper[] = [];
// A thumbnail's zoom outlives its row (see thumbnail-zoom-pan.ts), so each
// test gets its own media item.
let testMediaId = '';
let testCount = 0;

beforeEach(() => {
  testMediaId = `zoomable-image-${++testCount}`;
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
    THUMBNAIL_WIDTH,
  );
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(
    THUMBNAIL_HEIGHT,
  );
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    bottom: THUMBNAIL_HEIGHT,
    height: THUMBNAIL_HEIGHT,
    left: 0,
    right: THUMBNAIL_WIDTH,
    top: 0,
    width: THUMBNAIL_WIDTH,
    x: 0,
    y: 0,
  } as DOMRect);
});

afterEach(() => {
  for (const item of mountedItems) item.unmount();
  mountedItems = [];
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

const mountImageItem = () => {
  const item = mount(MediaItem, {
    attachTo: document.body,
    props: {
      media: {
        fileUrl: 'file:///C:/media/image.jpg',
        isImage: true,
        title: 'Zoomable image',
        type: 'media',
        uniqueId: testMediaId,
      },
      repeat: false,
    },
  });
  mountedItems.push(item);
  return item;
};

// What vue-zoomable emits for a Ctrl/Shift + double-click zoom.
const zoomTo = async (item: VueWrapper, zoom: number, pan = { x: 0, y: 0 }) => {
  item.findComponent(VueZoomable).vm.$emit('zoom', { pan, zoom });
  await flushPromises();
};

// The row itself (the component has several root nodes, so not
// wrapper.element) - where the drag-and-drop library listens for the press
// that arms a reorder drag.
const rowOf = (item: VueWrapper) =>
  item.find(`[data-id="${testMediaId}"]`).element;

const viewportOf = (item: VueWrapper) =>
  item.find('.thumbnail-pan-viewport').element as HTMLElement;

const imageTransformOf = (item: VueWrapper) =>
  (item.find('.media-image-container').element as HTMLElement).style.transform;

const zoomPanOf = (item: VueWrapper) => {
  const [, x, y, zoom] =
    /^translate\((\S+)px, (\S+)px\) scale\((\S+)\)$/.exec(
      imageTransformOf(item),
    ) ?? [];
  return { x: Number(x), y: Number(y), zoom: Number(zoom) };
};

const dispatchPointer = async (
  target: Element,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
  clientY: number,
) => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      button: 0,
      cancelable: true,
      clientX,
      clientY,
      isPrimary: true,
      pointerId: 1,
    }),
  );
  await flushPromises();
};

const dragViewport = async (
  item: VueWrapper,
  from: [number, number],
  to: [number, number],
) => {
  const viewport = viewportOf(item);
  await dispatchPointer(viewport, 'pointerdown', ...from);
  await dispatchPointer(viewport, 'pointermove', ...to);
  await dispatchPointer(viewport, 'pointerup', ...to);
};

const dispatchWheel = async (item: VueWrapper, init: WheelEventInit) => {
  const { clientX, clientY, ctrlKey, shiftKey, ...wheelInit } = init;
  const event = new WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    ...wheelInit,
  });
  // happy-dom's WheelEvent drops the MouseEvent fields it should inherit.
  Object.defineProperties(event, {
    clientX: { value: clientX ?? THUMBNAIL_WIDTH / 2 },
    clientY: { value: clientY ?? THUMBNAIL_HEIGHT / 2 },
    ctrlKey: { value: !!ctrlKey },
    shiftKey: { value: !!shiftKey },
  });
  viewportOf(item).dispatchEvent(event);
  await flushPromises();
  return event;
};

// Chromium turns each step of a touchpad pinch into a Ctrl + wheel event
// with deltaY = -100 * ln(scale), without any Ctrl key actually held.
const pinch = (item: VueWrapper, scale: number) =>
  dispatchWheel(item, { ctrlKey: true, deltaY: -100 * Math.log(scale) });

const showHoverControls = async (item: VueWrapper) => {
  rowOf(item).dispatchEvent(new MouseEvent('mouseenter'));
  await vi.waitFor(() => {
    expect(item.findAll('.thumbnail-zoom-control .q-badge')).toHaveLength(2);
  });
};

describe('MediaItem image zoom and pan', () => {
  it('pans a zoomed-in image by dragging it, without going past its edges', async () => {
    const item = mountImageItem();
    await zoomTo(item, 2);

    const viewport = viewportOf(item);
    await dispatchPointer(viewport, 'pointerdown', 100, 100);
    await dispatchPointer(viewport, 'pointermove', 130, 110);
    expect(imageTransformOf(item)).toBe('translate(30px, 10px) scale(2)');

    // At zoom 2, the image overflows by half its size on each side.
    await dispatchPointer(viewport, 'pointermove', 1000, -1000);
    expect(imageTransformOf(item)).toBe(
      `translate(${THUMBNAIL_WIDTH / 2}px, ${-THUMBNAIL_HEIGHT / 2}px) scale(2)`,
    );
    await dispatchPointer(viewport, 'pointerup', 1000, -1000);
  });

  it('leaves the thumbnail as the reorder drag handle until the image is zoomed in', async () => {
    const item = mountImageItem();
    const rowPointerdown = vi.fn();
    rowOf(item).addEventListener('pointerdown', rowPointerdown);

    await dispatchPointer(viewportOf(item), 'pointerdown', 10, 10);
    await dispatchPointer(viewportOf(item), 'pointerup', 10, 10);
    expect(rowPointerdown).toHaveBeenCalledTimes(1);

    // Once zoomed in, the press pans instead and never reaches the row, where
    // the drag-and-drop library would arm a reorder drag.
    await zoomTo(item, 2);
    await dragViewport(item, [10, 10], [40, 40]);
    expect(rowPointerdown).toHaveBeenCalledTimes(1);
  });

  it('still selects the item on a plain click of a zoomed-in image, but not after a pan', async () => {
    const item = mountImageItem();
    await zoomTo(item, 2);

    await dragViewport(item, [50, 50], [50, 50]);
    expect(item.emitted('click')).toHaveLength(1);

    await dragViewport(item, [50, 50], [70, 60]);
    expect(item.emitted('click')).toHaveLength(1);
  });

  it('zooms with a touchpad pinch, following the fingers', async () => {
    const item = mountImageItem();

    for (let i = 0; i < 4; i++) await pinch(item, 1.05);
    expect(zoomPanOf(item).zoom).toBeCloseTo(1.05 ** 4);

    await pinch(item, 1 / 1.05);
    expect(zoomPanOf(item).zoom).toBeCloseTo(1.05 ** 3);
  });

  it('zooms by about 10% per Ctrl/Shift + mouse wheel notch, toward the pointer', async () => {
    const item = mountImageItem();

    // Pointer on the right edge: that edge stays put, so the image grows
    // leftward - as far as it can go at that zoom.
    const event = await dispatchWheel(item, {
      clientX: THUMBNAIL_WIDTH,
      ctrlKey: true,
      deltaY: -100,
    });
    expect(event.defaultPrevented).toBe(true);
    const zoomed = zoomPanOf(item);
    expect(zoomed.zoom).toBeCloseTo(Math.exp(0.1));
    expect(zoomed.x).toBeCloseTo((-THUMBNAIL_WIDTH * (zoomed.zoom - 1)) / 2);
    expect(zoomed.y).toBe(0);

    // Shift + wheel, which some setups turn into a horizontal scroll.
    await dispatchWheel(item, { deltaX: -100, shiftKey: true });
    expect(zoomPanOf(item).zoom).toBeCloseTo(Math.exp(0.2));
  });

  it('leaves a plain mouse wheel or two-finger scroll to scroll the list', async () => {
    const item = mountImageItem();

    const event = await dispatchWheel(item, { deltaY: -100 });
    expect(event.defaultPrevented).toBe(false);
    expect(zoomPanOf(item).zoom).toBe(1);
  });

  it('pulls the image back inside its edges when zooming out', async () => {
    const item = mountImageItem();
    await zoomTo(item, 3);
    await dragViewport(item, [0, 0], [1000, 1000]);
    expect(imageTransformOf(item)).toBe(
      `translate(${THUMBNAIL_WIDTH}px, ${THUMBNAIL_HEIGHT}px) scale(3)`,
    );

    // Zoom-out button: 3 / 1.2 = 2.5, which allows 0.75 of the size either way.
    await showHoverControls(item);
    const zoomOut = item.findAll('.thumbnail-zoom-control .q-badge')[0];
    await zoomOut?.trigger('mousedown');
    await zoomOut?.trigger('mouseup');
    expect(imageTransformOf(item)).toBe(
      `translate(${THUMBNAIL_WIDTH * 0.75}px, ${THUMBNAIL_HEIGHT * 0.75}px) scale(2.5)`,
    );

    // Wheel and pinch zoom-out.
    await dispatchWheel(item, { ctrlKey: true, deltaY: 100 });
    const zoomedOut = zoomPanOf(item);
    expect(zoomedOut.x).toBeCloseTo(
      (THUMBNAIL_WIDTH * (zoomedOut.zoom - 1)) / 2,
    );
    expect(zoomedOut.y).toBeCloseTo(
      (THUMBNAIL_HEIGHT * (zoomedOut.zoom - 1)) / 2,
    );

    for (let i = 0; i < 20; i++) await pinch(item, 0.8);
    expect(imageTransformOf(item)).toBe('translate(0px, 0px) scale(1)');
  });

  it("keeps an image's zoom when its row is rebuilt, as on a move to another section", async () => {
    const first = mountImageItem();
    await zoomTo(first, 2);
    await dragViewport(first, [0, 0], [30, 10]);
    first.unmount();
    mountedItems = [];

    const rebuilt = mountImageItem();
    await flushPromises();
    expect(imageTransformOf(rebuilt)).toBe('translate(30px, 10px) scale(2)');
    const reset = rebuilt.find('.thumbnail-zoom-control');
    expect(reset.exists()).toBe(true);

    await reset.trigger('click');
    rebuilt.unmount();
    mountedItems = [];
    expect(imageTransformOf(mountImageItem())).toBe(
      'translate(0px, 0px) scale(1)',
    );
  });

  it('keeps a press on the zoom controls from starting a reorder drag', async () => {
    const item = mountImageItem();
    await zoomTo(item, 2);
    const rowPointerdown = vi.fn();
    rowOf(item).addEventListener('pointerdown', rowPointerdown);

    await showHoverControls(item);
    for (const control of item.findAll('.thumbnail-zoom-control')) {
      await dispatchPointer(control.element, 'pointerdown', 0, 0);
      await dispatchPointer(control.element, 'pointerup', 0, 0);
    }

    // The reset button and the zoom out/in pair.
    expect(item.findAll('.thumbnail-zoom-control')).toHaveLength(2);
    expect(rowPointerdown).not.toHaveBeenCalled();
  });
});
