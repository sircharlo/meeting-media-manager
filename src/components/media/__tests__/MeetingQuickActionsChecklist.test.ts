import type { ZoomChecklistNotice } from 'src/helpers/zoom-checklist';

import { mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useMeetingQuickActionsStore } from 'stores/meeting-quick-actions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import MeetingQuickActionsChecklist from '../MeetingQuickActionsChecklist.vue';

const { noticeMock } = vi.hoisted(() => ({
  noticeMock: vi.fn<() => null | ZoomChecklistNotice>(),
}));

vi.mock('src/helpers/zoom-checklist', () => ({
  getZoomChecklistNotice: noticeMock,
}));

vi.mock('stores/music', async () => {
  const { defineStore } = await import('pinia');
  return {
    useMusicStore: defineStore('music', () => ({
      formatClockTime: (date: Date) =>
        `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
    })),
  };
});

installQuasarPlugin();
installPinia({ stubActions: false });

const ITEM_ID = 'quick-actions-checklist-unmute-kh-audio';
const ITEM_LABEL = 'Unmute the Kingdom Hall audio in Zoom';

let wrapper: undefined | VueWrapper;

beforeEach(() => {
  useCongregationSettingsStore().congregations = {
    'test-cong': { ...structuredClone(defaultSettings) },
  };
  useCurrentStateStore().currentCongregation = 'test-cong';
  // installPinia shares one Pinia across the file.
  useMeetingQuickActionsStore().resetCurrentScope();
  noticeMock.mockReturnValue(null);
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

const mountChecklist = async () => {
  wrapper = mount(MeetingQuickActionsChecklist, {
    attachTo: document.body,
    props: { mode: 'before' },
  });
  await nextTick();
  return wrapper;
};

const clickItem = async (checklist: VueWrapper) => {
  const item = checklist
    .findAll('.quick-actions-checklist__item')
    .find((button) => button.text().includes(ITEM_LABEL));
  if (!item) throw new Error(`No "${ITEM_LABEL}" item`);
  await item.trigger('click');
  await nextTick();
};

// The confirm dialog is teleported to document.body.
const dialogText = () =>
  document.querySelector('.modal-confirm')?.textContent ?? '';

const clickDialogButton = async (label: string) => {
  const button = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.modal-confirm button'),
  ).find((candidate) => candidate.textContent?.trim() === label);
  if (!button) throw new Error(`No "${label}" button in: ${dialogText()}`);
  button.click();
  await nextTick();
  return button;
};

const isChecked = () => useMeetingQuickActionsStore().isItemChecked(ITEM_ID);

describe('MeetingQuickActionsChecklist - tasks the Zoom Meeting Manager does', () => {
  it('ticks a task straight away when M³ has nothing to say about it', async () => {
    const checklist = await mountChecklist();

    await clickItem(checklist);

    expect(isChecked()).toBe(true);
    expect(document.querySelector('.modal-confirm')).toBeNull();
    expect(noticeMock).toHaveBeenCalledWith(
      ITEM_ID,
      'before',
      expect.any(Date),
    );
  });

  it('asks first when M³ will do it as the music stops, and ticks it once confirmed', async () => {
    noticeMock.mockReturnValue({
      at: new Date(2099, 0, 1, 19, 29).getTime(),
      kind: 'music-stop',
    });
    const checklist = await mountChecklist();

    await clickItem(checklist);
    expect(isChecked()).toBe(false);
    expect(dialogText()).toContain('M³ will do this in Zoom');
    expect(dialogText()).toContain(
      'M³ will do it in Zoom at 19:29, when background music stops before the meeting',
    );

    const confirm = await clickDialogButton('Mark as done anyway');
    expect(isChecked()).toBe(true);
    // A second click as the dialog fades out doesn't untick it again.
    confirm.click();
    await nextTick();
    expect(isChecked()).toBe(true);
  });

  it('leaves the task unticked when the user cancels', async () => {
    noticeMock.mockReturnValue({ kind: 'music-start' });
    const checklist = await mountChecklist();

    await clickItem(checklist);
    expect(dialogText()).toContain(
      'M³ will do it in Zoom when you start background music after the meeting',
    );
    await clickDialogButton('Cancel');

    expect(isChecked()).toBe(false);
  });

  it('says M³ is at it once the music has stopped', async () => {
    noticeMock.mockReturnValue({
      at: Date.now() - 10 * 1000,
      kind: 'music-stop',
    });
    const checklist = await mountChecklist();

    await clickItem(checklist);

    expect(dialogText()).toContain(
      'M³ is taking care of it in Zoom now, as the meeting starts',
    );
  });

  it('asks first before unticking a task M³ already did in Zoom', async () => {
    useMeetingQuickActionsStore().setItemCheckedAutomatically(ITEM_ID, true);
    noticeMock.mockReturnValue({ kind: 'done' });
    const checklist = await mountChecklist();

    await clickItem(checklist);
    expect(isChecked()).toBe(true);
    expect(dialogText()).toContain('Already done in Zoom');
    expect(dialogText()).toContain("won't change anything in Zoom");

    await clickDialogButton('Mark as not done anyway');
    expect(isChecked()).toBe(false);
  });
});
