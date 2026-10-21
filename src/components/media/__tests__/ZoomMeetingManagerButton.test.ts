import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { defaultSettings } from 'src/constants/settings';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useZoomStateStore } from 'stores/zoom-state';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

const { zoomMocks } = vi.hoisted(() => ({
  zoomMocks: {
    getZoomMeetingState: vi.fn(async () => null),
    isAroundMeetingTime: vi.fn(() => false),
  },
}));

vi.mock('src/helpers/zoom', () => zoomMocks);
vi.mock('src/helpers/fs', () => ({ getRendererPlatform: () => 'win32' }));

installQuasarPlugin();
installPinia();

const CONGREGATION_ID = 'test-cong';

const mountButton = async () => {
  useCongregationSettingsStore().congregations = {
    [CONGREGATION_ID]: { ...defaultSettings, zoomMeetingManagerEnable: true },
  };
  useCurrentStateStore().currentCongregation = CONGREGATION_ID;
  const { default: ZoomMeetingManagerButton } =
    await import('../ZoomMeetingManagerButton.vue');
  const wrapper = mount(ZoomMeetingManagerButton, {
    props: { modelValue: false },
  });
  await nextTick();
  return wrapper.find('.q-btn');
};

describe('ZoomMeetingManagerButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    zoomMocks.isAroundMeetingTime.mockReturnValue(false);
    const zoomState = useZoomStateStore();
    zoomState.meeting = null;
    zoomState.pause = null;
    zoomState.checkRunning = false;
  });

  it('is faded with no meeting now and no Zoom meeting open', async () => {
    const button = await mountButton();

    expect(button.classes()).toContain('island-btn--off');
    expect(button.classes()).toContain('bg-white-transparent');
  });

  it('looks at Zoom without moving anything, to know', async () => {
    await mountButton();
    expect(zoomMocks.getZoomMeetingState).toHaveBeenCalledWith();
  });

  it('turns to a warning at meeting time with no Zoom meeting open', async () => {
    zoomMocks.isAroundMeetingTime.mockReturnValue(true);
    const button = await mountButton();

    expect(button.classes()).toContain('bg-warning');
    expect(button.classes()).not.toContain('island-btn--off');
  });

  it('looks as usual while a Zoom meeting is open', async () => {
    useZoomStateStore().meeting = { found: true, sharing: false };
    const button = await mountButton();

    expect(button.classes()).toContain('bg-white-transparent');
    expect(button.classes()).not.toContain('island-btn--off');
  });

  it('shows a spinner while the startup check runs', async () => {
    useZoomStateStore().checkRunning = true;
    const button = await mountButton();

    expect(button.find('.q-spinner').exists()).toBe(true);
    expect(button.classes()).toContain('bg-white-transparent');
  });

  it('turns red, rather than showing a badge, once the automations are paused', async () => {
    zoomMocks.isAroundMeetingTime.mockReturnValue(true);
    const zoomState = useZoomStateStore();
    zoomState.meeting = { found: true, sharing: false };
    zoomState.pause = {
      congregationId: CONGREGATION_ID,
      namesChanged: false,
      problems: [],
    };
    const button = await mountButton();

    expect(button.classes()).toContain('bg-negative');
    expect(button.find('.q-badge').exists()).toBe(false);
  });
});
