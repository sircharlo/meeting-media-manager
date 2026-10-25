import { mount } from '@vue/test-utils';
import { installQuasarPlugin } from 'app/test/vitest/helpers/install-quasar-plugin';
import { installPinia } from 'app/test/vitest/mocks/pinia';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MeetingQuickActionsAfterPanel from '../MeetingQuickActionsAfterPanel.vue';

const SCHEDULED_END = new Date(2026, 9, 25, 20, 45);

const { scheduledEndMock } = vi.hoisted(() => ({
  scheduledEndMock: vi.fn<() => Date | null>(),
}));

vi.mock('src/helpers/meeting-quick-actions', () => ({
  getTodaysScheduledMeetingEndDateTime: scheduledEndMock,
  // No last song playing: the panel goes by the planned end time.
  predictLastSongEndDateTime: () => null,
}));

vi.mock('stores/music', async () => {
  const { defineStore } = await import('pinia');
  const { ref } = await import('vue');
  return {
    useMusicStore: defineStore('music', () => ({
      formatClockTime: (date: Date) =>
        `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
      mediaIsActivelyPlaying: ref(false),
      musicPlaying: ref(false),
      musicState: ref(''),
      requestMusicStart: vi.fn(),
      stopMusic: vi.fn(),
    })),
  };
});

vi.mock('stores/recording-state', async () => {
  const { defineStore } = await import('pinia');
  const { ref } = await import('vue');
  return {
    useRecordingStore: defineStore('recording', () => ({
      canStopRecording: ref(false),
      isRecording: ref(false),
      stopRecording: vi.fn(),
      togglePending: ref(false),
    })),
  };
});

installQuasarPlugin();
// The faked music store's formatClockTime has to run, not be stubbed.
installPinia({ stubActions: false });

afterEach(() => {
  vi.clearAllMocks();
});

const mountAt = (now: number) =>
  mount(MeetingQuickActionsAfterPanel, {
    global: { stubs: { MeetingQuickActionsChecklist: true } },
    props: { now },
  });

describe('MeetingQuickActionsAfterPanel - planned end time', () => {
  it('counts down to the planned end while it is ahead', () => {
    scheduledEndMock.mockReturnValue(SCHEDULED_END);

    const wrapper = mountAt(SCHEDULED_END.getTime() - 10 * 60 * 1000);

    expect(wrapper.text()).toContain('Meeting is scheduled to end at 20:45');
    expect(wrapper.text()).toContain('10:00');
  });

  // M³ opened hours after the meeting: the countdown used to sit at 00:00
  // under "Meeting is scheduled to end at ...".
  it('says when the meeting was planned to end once that time has passed', () => {
    scheduledEndMock.mockReturnValue(SCHEDULED_END);

    const wrapper = mountAt(SCHEDULED_END.getTime() + 3 * 3600 * 1000);

    expect(wrapper.text()).toContain('Meeting was scheduled to end at 20:45');
    expect(wrapper.text()).not.toContain('Meeting is scheduled to end');
    expect(wrapper.text()).not.toContain('00:00');
  });
});
