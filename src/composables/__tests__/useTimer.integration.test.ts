import type { DateInfo } from 'src/types';

import { createPinia, setActivePinia } from 'pinia';
import { defaultSettings } from 'src/constants/settings';
import { formatDate } from 'src/utils/date';
import { useCongregationSettingsStore } from 'stores/congregation-settings';
import { useCurrentStateStore } from 'stores/current-state';
import { useJwStore } from 'stores/jw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import useTimer, { __resetTimerForTests } from '../useTimer';

vi.mock('boot/i18n', () => ({
  i18n: {
    global: {
      locale: { value: 'en' },
      t: (key: string, named?: Record<string, unknown>) =>
        named && 'part' in named
          ? `${key} ${named.part} (${named.duration})`
          : key,
    },
  },
}));

// 2026-10-13 is a Tuesday (midweek meeting), 2026-10-11 a Sunday (weekend
// meeting) and 2026-10-14 a Wednesday (no meeting).
const MIDWEEK = new Date(2026, 9, 13, 12, 0, 0);
const WEEKEND = new Date(2026, 9, 11, 12, 0, 0);
const NO_MEETING = new Date(2026, 9, 14, 12, 0, 0);

const createDay = (date: Date): DateInfo => ({
  date,
  mediaSections: [],
  status: 'complete',
});

const selectDay = async (date: Date) => {
  useCurrentStateStore().selectedDate = formatDate(date, 'YYYY/MM/DD');
  await nextTick();
};

const day = (date: Date) =>
  useJwStore().lookupPeriod['cong']?.find(
    (d) => d.date.getTime() === date.getTime(),
  );

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(MIDWEEK);
  setActivePinia(createPinia());
  __resetTimerForTests();

  useCongregationSettingsStore().congregations['cong'] = {
    ...defaultSettings,
    enableTimerDisplay: true,
    mwDay: '1',
    mwStartTime: '19:00',
    timerEnableMeetingAheadBehind: true,
    weDay: '6',
    weStartTime: '10:00',
  };
  const currentState = useCurrentStateStore();
  currentState.currentCongregation = 'cong';
  useJwStore().lookupPeriod['cong'] = [
    createDay(WEEKEND),
    createDay(MIDWEEK),
    createDay(NO_MEETING),
  ];
  await selectDay(MIDWEEK);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useTimer part durations', () => {
  it('starts a midweek meeting with the default part counts and durations', () => {
    const timer = useTimer();
    expect(timer.ayfmPartsCount.value).toBe(3);
    expect(timer.lacPartsCount.value).toBe(2);
    const values = timer.meetingPartsOptions.value.map((o) => o.value);
    expect(values).toEqual([
      'introduction',
      'treasures',
      'gems',
      'bible-reading',
      'ayfm-1',
      'ayfm-2',
      'ayfm-3',
      'lac-1',
      'lac-2',
      'cbs',
      'concluding-comments',
    ]);
    expect(timer.meetingPartsOptions.value.some((o) => o.warning)).toBe(false);
  });

  it('keeps whatever duration the user sets, 0 included, and only warns', () => {
    const timer = useTimer();

    timer.setPartDuration('lac-1', 20);
    timer.setPartDuration('ayfm-2', 0);
    timer.adjustPartDuration('ayfm-3', 1);

    expect(timer.partDurations.value['lac-1']).toBe(20);
    expect(timer.partDurations.value['lac-2']).toBe(7);
    expect(timer.partDurations.value['ayfm-2']).toBe(0);
    expect(timer.partDurations.value['ayfm-3']).toBe(5);
    expect(day(MIDWEEK)?.timerPartDurations).toEqual({
      'ayfm-2': 0,
      'ayfm-3': 5,
      'lac-1': 20,
    });

    const lac1 = timer.meetingPartsOptions.value.find(
      (o) => o.value === 'lac-1',
    );
    const ayfm2 = timer.meetingPartsOptions.value.find(
      (o) => o.value === 'ayfm-2',
    );
    expect(lac1?.warning).toBe(true);
    expect(ayfm2?.warning).toBe(true);
    expect(ayfm2?.label).toBe('ayfm-part 2 (0)');
  });

  it('never goes below 0', () => {
    const timer = useTimer();
    timer.setPartDuration('ayfm-1', 0);
    timer.adjustPartDuration('ayfm-1', -1);
    expect(timer.partDurations.value['ayfm-1']).toBe(0);
  });

  it('shares a section out again when its number of parts changes', () => {
    const timer = useTimer();

    timer.ayfmPartsCount.value = 2;
    timer.lacPartsCount.value = 1;

    expect(timer.partDurations.value).toMatchObject({
      'ayfm-1': 7,
      'ayfm-2': 6,
      'ayfm-3': 0,
      'lac-1': 15,
      'lac-2': 0,
    });
    expect(day(MIDWEEK)?.timerPartCounts).toEqual({ ayfm: 2, lac: 1 });
    const values = timer.meetingPartsOptions.value.map((o) => o.value);
    expect(values).toContain('ayfm-2');
    expect(values).not.toContain('ayfm-3');
    expect(values).not.toContain('lac-2');
  });

  it('keeps each day its own durations and counts', async () => {
    const timer = useTimer();
    timer.setPartDuration('public-talk', 30);
    timer.lacPartsCount.value = 3;

    await selectDay(WEEKEND);
    timer.setPartDuration('public-talk', 25);
    expect(timer.partDurations.value['public-talk']).toBe(25);

    await selectDay(MIDWEEK);
    expect(timer.partDurations.value['public-talk']).toBe(30);
    expect(timer.lacPartsCount.value).toBe(3);
  });
});

describe('useTimer timings', () => {
  it('records when a part was started and stopped, on its day', () => {
    const timer = useTimer();

    timer.selectPart('treasures');
    expect(timer.timerRunning.value).toBe(true);
    expect(timer.currentPart.value).toBe('treasures');
    expect(day(MIDWEEK)?.timerPartTimings?.treasures?.startTime).toBe(
      MIDWEEK.getTime(),
    );

    vi.advanceTimersByTime(90_000);
    expect(timer.formattedTime.value).toBe('01:30');

    timer.stopTimer();
    expect(timer.timerRunning.value).toBe(false);
    expect(day(MIDWEEK)?.timerPartTimings?.treasures).toEqual({
      endTime: MIDWEEK.getTime() + 90_000,
      startTime: MIDWEEK.getTime(),
    });
  });

  it('moves straight from one part to the next', () => {
    const timer = useTimer();
    timer.selectPart('introduction');
    vi.advanceTimersByTime(60_000);

    expect(timer.nextPart.value?.value).toBe('treasures');
    timer.startNextPart();

    expect(timer.currentPart.value).toBe('treasures');
    expect(timer.partTimings.value.introduction?.endTime).toBe(
      MIDWEEK.getTime() + 60_000,
    );
    expect(timer.partTimings.value.treasures?.startTime).toBe(
      MIDWEEK.getTime() + 60_000,
    );
  });

  it('stops a running part when the user moves to another day, recording it on the day it started', async () => {
    const timer = useTimer();
    timer.selectPart('gems');
    vi.advanceTimersByTime(30_000);

    await selectDay(WEEKEND);

    expect(timer.timerRunning.value).toBe(false);
    expect(day(MIDWEEK)?.timerPartTimings?.gems?.endTime).toBe(
      MIDWEEK.getTime() + 30_000,
    );
    expect(day(WEEKEND)?.timerPartTimings).toBeUndefined();
    expect(timer.partTimings.value.gems).toBeUndefined();

    await selectDay(MIDWEEK);
    expect(timer.partTimings.value.gems?.startTime).toBe(MIDWEEK.getTime());
  });

  it('clears one part or every part of the day', () => {
    const timer = useTimer();
    timer.selectPart('introduction');
    timer.stopTimer();
    timer.selectPart('treasures');
    timer.stopTimer();
    expect(timer.hasAnyPartTimings.value).toBe(true);

    timer.resetPartTiming('introduction');
    expect(timer.partTimings.value.introduction).toBeUndefined();
    expect(timer.partTimings.value.treasures).toBeDefined();

    timer.resetAllPartTimings();
    expect(timer.hasAnyPartTimings.value).toBe(false);
  });

  it('judges ahead/behind by the planned start of the current part', () => {
    const timer = useTimer();
    // Introduction is planned 5 minutes after the 19:00 start (opening song).
    vi.setSystemTime(new Date(2026, 9, 13, 19, 7, 0));
    timer.selectPart('introduction');
    expect(timer.aheadBehindMinutes.value).toBe(2);
  });
});

describe('useTimer custom parts', () => {
  it('adds custom parts to a meeting day, after the regular parts', () => {
    const timer = useTimer();
    const part = timer.addCustomTimerPart();

    const options = timer.meetingPartsOptions.value;
    expect(options.at(-1)).toMatchObject({
      section: 'custom-timer-parts',
      value: part.id,
    });
    expect(timer.partDurations.value[part.id]).toBe(5);

    timer.updateCustomTimerPart(part.id, { duration: 12, label: 'GB update' });
    expect(timer.partDurations.value[part.id]).toBe(12);
    expect(options.at(-1)?.label).toBe('meeting-part 1 (5 min.)');
    expect(timer.meetingPartsOptions.value.at(-1)?.label).toBe(
      'GB update (12 min.)',
    );
    expect(day(MIDWEEK)?.timerParts).toHaveLength(1);
  });

  it('seeds a day without a meeting with one custom part and keeps at least one', async () => {
    const timer = useTimer();
    await selectDay(NO_MEETING);

    expect(timer.customTimerParts.value).toHaveLength(1);
    const only = timer.customTimerParts.value[0];
    expect(timer.currentPart.value).toBe(only?.id);
    expect(timer.meetingPartsOptions.value[0]?.section).toBeUndefined();

    timer.removeCustomTimerPart(only?.id ?? 'custom-x');
    expect(timer.customTimerParts.value).toHaveLength(1);
  });

  it('works out ahead/behind for custom parts from the first one started', async () => {
    const timer = useTimer();
    await selectDay(NO_MEETING);
    const first = timer.customTimerParts.value[0];
    const second = timer.addCustomTimerPart();
    timer.updateCustomTimerPart(first?.id ?? 'custom-x', { duration: 10 });

    timer.selectPart(first?.id ?? 'custom-x');
    vi.advanceTimersByTime(12 * 60_000);
    timer.selectPart(second.id);

    expect(timer.aheadBehindMinutes.value).toBe(2);
  });
});
