import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { describe, expect, it, vi } from 'vitest';

import MeetingQuickActionsBeforePanel from '../MeetingQuickActionsBeforePanel.vue';

const MEETING_START = new Date(2026, 10, 12, 19, 30);
const MINUTE = 60 * 1000;

vi.mock('src/helpers/date', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  getTodaysMeetingStartDateTime: () => MEETING_START,
}));

vi.mock('stores/music', async () => {
  const { defineStore } = await import('pinia');
  const { ref } = await import('vue');
  return {
    useMusicStore: defineStore('music', () => ({
      formatClockTime: (date: Date) =>
        `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
      musicPlaying: ref(false),
      musicState: ref(''),
      requestMusicStart: vi.fn(),
      stopMusic: vi.fn(),
      timeUntilMusicStops: ref(''),
    })),
  };
});

vi.mock('stores/recording-state', async () => {
  const { defineStore } = await import('pinia');
  const { ref } = await import('vue');
  return {
    useRecordingStore: defineStore('recording', () => ({
      canStartRecording: ref(false),
      canStopRecording: ref(false),
      isRecording: ref(false),
      togglePending: ref(false),
      toggleRecording: vi.fn(),
    })),
  };
});

installQuasarPlugin();
installPinia({ stubActions: false });

const mountAt = (minutesBeforeStart: number) =>
  mount(MeetingQuickActionsBeforePanel, {
    global: { stubs: { MeetingQuickActionsChecklist: true } },
    props: { now: MEETING_START.getTime() - minutesBeforeStart * MINUTE },
  });

describe('MeetingQuickActionsBeforePanel - hourglass', () => {
  it('drains an hourglass over the last ten minutes before the meeting', () => {
    const wrapper = mountAt(5);

    expect(wrapper.find('.liquid-fill').exists()).toBe(true);
    expect(wrapper.classes()).not.toContain(
      'meeting-quick-actions-panel--last-minute',
    );
  });

  it.each([
    ['earlier than that', 30],
    ['once the meeting has started', -1],
  ])('shows no hourglass %s', (_, minutesBeforeStart) => {
    const wrapper = mountAt(minutesBeforeStart);

    expect(wrapper.find('.liquid-fill').exists()).toBe(false);
  });

  it('turns orange for the last minute', () => {
    const wrapper = mountAt(0.5);

    expect(wrapper.classes()).toContain(
      'meeting-quick-actions-panel--last-minute',
    );
  });
});
