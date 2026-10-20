import type { Display } from 'src/types';

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import ConfirmDialog from 'components/dialog/ConfirmDialog.vue';
import { defaultSettings } from 'src/constants/settings';
import { useAppSettingsStore } from 'stores/app-settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import DialogTimerPopup from '../DialogTimerPopup.vue';

const { handleTimerWindowVisibilityMock, resetAllPartTimingsMock } = vi.hoisted(
  () => ({
    handleTimerWindowVisibilityMock: vi.fn(),
    resetAllPartTimingsMock: vi.fn(),
  }),
);

// The popup only lays out what useTimer holds; the timer itself is tested in
// src/composables/__tests__.
vi.mock('src/composables/useTimer', async () => {
  const { ref } = await import('vue');
  const timer = {
    addCustomTimerPart: vi.fn(),
    ayfmPartsCount: ref(3),
    cbsCustomEndTime: ref(''),
    cbsEndTimeRules: [],
    currentPart: ref(null),
    customTimerParts: ref([]),
    getDuration: vi.fn(),
    getTimeString: vi.fn(),
    handleTimerWindowVisibility: handleTimerWindowVisibilityMock,
    hasAnyPartTimings: ref(true),
    lacPartsCount: ref(3),
    meetingPartsOptions: ref([]),
    moveCustomTimerPart: vi.fn(),
    partDurations: ref({}),
    partTimings: ref({}),
    removeCustomTimerPart: vi.fn(),
    resetAllPartTimings: resetAllPartTimingsMock,
    timerMode: ref('countdown'),
    timerRunning: ref(false),
    updateCustomTimerPart: vi.fn(),
    updateTimerWindow: vi.fn(),
    wtCustomEndTime: ref(''),
    wtEndTimeRules: [],
  };
  return { default: () => timer };
});

vi.mock('src/composables/useTimerAheadBehindText', async () => {
  const { computed } = await import('vue');
  return { useTimerAheadBehindText: () => computed(() => '') };
});

installQuasarPlugin();
installPinia();

const CONGREGATION_ID = 'test-cong';

const getAllScreensMock = vi.fn<() => Promise<Display[]>>();
const moveTimerWindowMock = vi.fn();

const makeScreens = (count: number): Display[] =>
  Array.from({ length: count }, (_, index) => ({
    bounds: { height: 1080, width: 1920, x: index * 1920, y: 0 },
    id: index,
    mainWindow: index === 0,
  })) as unknown as Display[];

let wrapper: undefined | VueWrapper;

const mountPopup = async ({
  screens = 1,
  settings = {},
}: {
  screens?: number;
  settings?: Partial<typeof defaultSettings>;
} = {}) => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, ...settings },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  getAllScreensMock.mockResolvedValue(makeScreens(screens));

  wrapper = mount(DialogTimerPopup, {
    global: {
      stubs: {
        ConfirmDialog: true,
        TimeInput: true,
        TimerPartsList: true,
        TimerQuickControls: true,
      },
    },
    props: { dialogId: 'timer-popup', modelValue: false },
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();
};

// QMenu teleports its content to document.body, outside the wrapper's tree.
const findButton = (label: string) => {
  const button = Array.from(document.querySelectorAll('button')).find((el) =>
    el.textContent?.includes(label),
  );
  if (!button) throw new Error(`No button found with label "${label}"`);
  return button;
};

const statusLine = () =>
  document.querySelector('.action-popup__status')?.textContent ?? '';

const scrollBody = () => {
  const body = document.querySelector('.action-popup__scroll');
  if (!body) throw new Error('No popup body found');
  return body;
};

const isSeparator = (el: Element | undefined) =>
  !!el?.classList.contains('q-separator');

// Separators only ever sit between two sections: never first or last in the
// body, and never two in a row.
const expectSeparatorsBetweenSectionsOnly = () => {
  const children = Array.from(scrollBody().children);
  expect(isSeparator(children[0])).toBe(false);
  expect(isSeparator(children.at(-1))).toBe(false);
  children.forEach((child, index) => {
    if (isSeparator(child)) {
      expect(isSeparator(children[index + 1])).toBe(false);
    }
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  globalThis.electronApi.getAllScreens = getAllScreensMock;
  globalThis.electronApi.moveTimerWindow = moveTimerWindowMock;
  useCurrentStateStore().timerWindowVisible = false;
  useCurrentStateStore().timerRemoteUrls = [];
  useAppSettingsStore().timerPreferences = {
    preferredScreenNumber: 0,
    preferWindowed: true,
  };
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = undefined;
  document.body.innerHTML = '';
});

describe('DialogTimerPopup', () => {
  it('says whether and where the timer display is shown, and shows or hides it from the footer', async () => {
    await mountPopup();

    expect(statusLine()).toContain('Inactive · Windowed');
    findButton('Show timer display').click();
    expect(handleTimerWindowVisibilityMock).toHaveBeenLastCalledWith(true);

    useCurrentStateStore().timerWindowVisible = true;
    await flushPromises();

    expect(statusLine()).toContain('Projecting · Windowed');
    findButton('Hide timer display').click();
    expect(handleTimerWindowVisibilityMock).toHaveBeenLastCalledWith(false);
  });

  it('keeps separators between sections when the window type is hidden', async () => {
    await mountPopup({ screens: 1 });

    expect(document.body.textContent).not.toContain('Window type');
    expectSeparatorsBetweenSectionsOnly();
  });

  it('keeps separators between sections with the window type and screen picker shown', async () => {
    await mountPopup({ screens: 4 });
    findButton('Full screen').click();
    await flushPromises();

    expect(moveTimerWindowMock).toHaveBeenLastCalledWith(1, true);
    expect(document.body.textContent).toContain('Window type');
    expect(findButton('Display 2')).toBeDefined();
    expectSeparatorsBetweenSectionsOnly();
  });

  it('shows the timer remote addresses at the end of the scrolling body', async () => {
    useCurrentStateStore().timerRemoteUrls = ['http://192.168.1.2:8080/'];
    await mountPopup({ settings: { timerRemoteEnable: true } });

    const body = scrollBody();
    expect(body.textContent).toContain('Timer remote');
    expect(body.lastElementChild?.textContent).toContain(
      'http://192.168.1.2:8080/',
    );
    expect(
      body.querySelector('button[aria-label="Copy address"]'),
    ).not.toBeNull();
    expectSeparatorsBetweenSectionsOnly();
  });

  it('asks before resetting all timings', async () => {
    await mountPopup();

    const confirm = wrapper?.findComponent(ConfirmDialog);
    expect(confirm?.props('modelValue')).toBe(false);

    findButton('Reset all timings for this day').click();
    await flushPromises();

    expect(confirm?.props('modelValue')).toBe(true);
    expect(resetAllPartTimingsMock).not.toHaveBeenCalled();

    confirm?.vm.$emit('confirm');
    expect(resetAllPartTimingsMock).toHaveBeenCalledOnce();
  });
});
