import type { DateInfo } from 'src/types';

import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import DialogCustomSectionEdit from '../DialogCustomSectionEdit.vue';

installQuasarPlugin();
installPinia();

const CONGREGATION_ID = 'test-cong';

// UX-6 (full-audit-2026-09-04.md): reordering custom sections was
// previously drag-and-drop only (a pointer-driven handle with no
// tabindex/keyboard handler) - these buttons are the keyboard-accessible
// alternative.
describe('DialogCustomSectionEdit move-up/move-down', () => {
  beforeEach(() => {
    const currentState = useCurrentStateStore();
    currentState.currentCongregation = CONGREGATION_ID;
    currentState.selectedDate = '2026-08-17';

    const jwStore = useJwStore();
    jwStore.lookupPeriod[CONGREGATION_ID] = [
      {
        date: new Date('2026-08-17T00:00:00'),
        mediaSections: [
          { config: { label: 'Custom 1', uniqueId: 'custom-1' }, items: [] },
          { config: { label: 'Custom 2', uniqueId: 'custom-2' }, items: [] },
        ],
        status: 'complete',
      } as unknown as DateInfo,
    ];
  });

  // BaseDialog (q-dialog) teleports its content to document.body, outside
  // the mounted wrapper's own root - attach there to reach it, and clear it
  // between tests so one test's leftover portal content can't leak into
  // the next.
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('moves a custom section up and persists the new order', async () => {
    mount(DialogCustomSectionEdit, {
      attachTo: document.body,
      props: { dialogId: 'test-dialog', modelValue: true },
    });
    await nextTick();
    await nextTick();

    const moveDownButtons = [
      ...document.body.querySelectorAll<HTMLElement>(
        'button[aria-label="Move down"]',
      ),
    ];
    expect(moveDownButtons).toHaveLength(2);

    // Move the first section ("custom-1") down, swapping it with "custom-2".
    moveDownButtons[0]?.click();
    await nextTick();

    const currentState = useCurrentStateStore();
    const newOrder = currentState.selectedDateObject?.mediaSections.map(
      (section) => section.config.uniqueId,
    );
    expect(newOrder).toEqual(['custom-2', 'custom-1']);
  });

  it('disables move-up for the first section and move-down for the last', async () => {
    mount(DialogCustomSectionEdit, {
      attachTo: document.body,
      props: { dialogId: 'test-dialog', modelValue: true },
    });
    await nextTick();
    await nextTick();

    const moveUpButtons = [
      ...document.body.querySelectorAll<HTMLElement>(
        'button[aria-label="Move up"]',
      ),
    ];
    const moveDownButtons = [
      ...document.body.querySelectorAll<HTMLElement>(
        'button[aria-label="Move down"]',
      ),
    ];

    expect(moveUpButtons[0]?.hasAttribute('disabled')).toBe(true);
    expect(moveDownButtons[1]?.hasAttribute('disabled')).toBe(true);
    expect(moveUpButtons[1]?.hasAttribute('disabled')).toBe(false);
    expect(moveDownButtons[0]?.hasAttribute('disabled')).toBe(false);
  });
});
