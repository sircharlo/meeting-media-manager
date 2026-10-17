import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import DialogPdfPageSelection from '../DialogPdfPageSelection.vue';

installQuasarPlugin();
installPinia({ stubActions: false });

const TOTAL_PAGES = 10; // above PAGE_PROMPT_THRESHOLD, so the grid actually opens

vi.mock('src/utils/converters', () => ({
  getNrOfPdfPages: vi.fn(async () => TOTAL_PAGES),
  openPdfThumbnailSession: vi.fn(async () => ({
    destroy: vi.fn(),
    getThumbnail: vi.fn(async () => null),
  })),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// UX-18 (full-audit-2026-09-05.md): page tiles were a plain <div v-ripple
// @click> with no tabindex/role/keyboard handler - a keyboard-only or
// screen-reader user could not select/deselect a single PDF page at all.
describe('DialogPdfPageSelection - keyboard page selection', () => {
  it('makes each page tile a native toggle button that exposes its state via aria-pressed', async () => {
    const wrapper = mount(DialogPdfPageSelection, {
      attachTo: document.body,
      props: { dialogId: 'pdf-page-selection-test' },
    });

    void (
      wrapper.vm as unknown as {
        selectPdfPages: (path: string) => Promise<null | Set<number>>;
      }
    ).selectPdfPages('/fake/publication.pdf');
    // getNrOfPdfPages() is async - let its resolution flip promptOpen/render
    // the grid before interacting with it.
    await nextTick();
    await nextTick();
    await nextTick();

    const pageThumbs = document.querySelectorAll('.pdf-page-thumb');
    expect(pageThumbs).toHaveLength(TOTAL_PAGES);

    const firstPage = pageThumbs[0] as HTMLElement;
    // Every page starts selected (selectPdfPages() defaults to "all"), so
    // this is a deselect.
    expect(firstPage.getAttribute('aria-pressed')).toBe('true');
    // A native button: reachable with Tab, and the browser turns Enter and
    // Space into the click below.
    expect(firstPage.tagName).toBe('BUTTON');
    expect(firstPage.getAttribute('type')).toBe('button');

    firstPage.click();
    await nextTick();
    expect(firstPage.getAttribute('aria-pressed')).toBe('false');
    expect(firstPage.classList.contains('pdf-page-thumb--selected')).toBe(
      false,
    );

    firstPage.click();
    await nextTick();
    expect(firstPage.getAttribute('aria-pressed')).toBe('true');
    expect(firstPage.classList.contains('pdf-page-thumb--selected')).toBe(true);

    wrapper.unmount();
  });
});
