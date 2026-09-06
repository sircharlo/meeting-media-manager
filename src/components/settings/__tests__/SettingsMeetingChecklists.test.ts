import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, describe, expect, it } from 'vitest';

import SettingsMeetingChecklists from '../SettingsMeetingChecklists.vue';

installQuasarPlugin();
installPinia({ stubActions: false });

afterEach(() => {
  document.body.innerHTML = '';
});

const CONGREGATION_ID = 'test-cong';

const setupChecklistSettings = () => {
  const congregationSettingsStore = useCongregationSettingsStore();
  congregationSettingsStore.congregations = {
    [CONGREGATION_ID]: {
      ...defaultSettings,
      enableMeetingQuickActions: true,
      meetingQuickActionsCategoriesBefore: [
        {
          enabled: true,
          id: 'cat-1',
          isDefault: false,
          label: 'Custom category',
        },
      ],
      meetingQuickActionsChecklistBefore: [
        {
          categoryId: 'cat-1',
          enabled: true,
          id: 'item-1',
          isDefault: false,
          label: 'Custom task',
        },
      ],
    },
  };

  const currentState = useCurrentStateStore();
  currentState.currentCongregation = CONGREGATION_ID;

  return congregationSettingsStore;
};

// UX-14 (full-audit-2026-09-05.md): both deletions used to happen
// immediately on click - no confirmation, and a category delete silently
// cascaded into deleting every item assigned to it too.
describe('SettingsMeetingChecklists - delete confirmation', () => {
  it('does not delete a custom category until the confirm dialog is accepted, and cascades to its items', async () => {
    const congregationSettingsStore = setupChecklistSettings();

    const wrapper = mount(SettingsMeetingChecklists, {
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();

    const deleteButton = wrapper.get('button[aria-label="Delete"]');
    await deleteButton.trigger('click');

    const settingsBeforeConfirm =
      congregationSettingsStore.congregations[CONGREGATION_ID];
    expect(
      settingsBeforeConfirm?.meetingQuickActionsCategoriesBefore,
    ).toHaveLength(1);

    // The confirm dialog is teleported to document.body - find its Delete
    // button directly rather than through the wrapper's own tree.
    const confirmButtons = Array.from(
      document.querySelectorAll('.modal-confirm button'),
    );
    const confirmButton = confirmButtons.find(
      (button) => button.textContent?.trim() === 'Delete',
    );
    expect(confirmButton).toBeTruthy();
    (confirmButton as HTMLButtonElement).click();
    await wrapper.vm.$nextTick();

    const settingsAfterConfirm =
      congregationSettingsStore.congregations[CONGREGATION_ID];
    expect(
      settingsAfterConfirm?.meetingQuickActionsCategoriesBefore,
    ).toHaveLength(0);
    // Cascade: the category's own item must be gone too.
    expect(
      settingsAfterConfirm?.meetingQuickActionsChecklistBefore,
    ).toHaveLength(0);
  });

  it('keeps the category and its items when the confirm dialog is cancelled', async () => {
    const congregationSettingsStore = setupChecklistSettings();

    const wrapper = mount(SettingsMeetingChecklists, {
      attachTo: document.body,
    });
    await wrapper.vm.$nextTick();

    const deleteButton = wrapper.get('button[aria-label="Delete"]');
    await deleteButton.trigger('click');

    const cancelButtons = Array.from(
      document.querySelectorAll('.modal-confirm button'),
    );
    const cancelButton = cancelButtons.find(
      (button) => button.textContent?.trim() === 'Cancel',
    );
    expect(cancelButton).toBeTruthy();
    (cancelButton as HTMLButtonElement).click();
    await wrapper.vm.$nextTick();

    const settings = congregationSettingsStore.congregations[CONGREGATION_ID];
    expect(settings?.meetingQuickActionsCategoriesBefore).toHaveLength(1);
    expect(settings?.meetingQuickActionsChecklistBefore).toHaveLength(1);
  });
});
