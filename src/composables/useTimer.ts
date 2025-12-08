import type { MeetingPart, MeetingPartTimings, TimerData } from 'src/types';

import {
  useBroadcastChannel,
  useIntervalFn,
  watchImmediate,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { jwIcons } from 'src/constants/jw-icons';
import {
  isCoWeek,
  isMeetingDay,
  isMwMeetingDay,
  isWeMeetingDay,
} from 'src/helpers/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const useTimer = () => {
  const timerRunning = ref(false);
  const timerPaused = ref(false);
  const timerStartTime = ref<null | number>(null);
  const timerPausedTime = ref<null | number>(null);
  const elapsedSeconds = ref(0);
  const countdownTarget = ref<number>(0);
  const timerMode = ref<'countdown' | 'countup'>('countup');
  const currentPart = ref<MeetingPart>('public-talk');
  const wtCustomEndTime = ref<string>('');
  const cbsCustomEndTime = ref('');
  const ayfmPartsCount = ref<number>(1);
  const lacPartsCount = ref<number>(1);

  const getTimeString = (timestamp: null | number, seconds = false): string => {
    try {
      return timestamp
        ? new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            hour12: false,
            minute: '2-digit',
            second: seconds ? '2-digit' : undefined,
          })
        : '';
    } catch {
      return '';
    }
  };

  const initialPartTimings: Record<MeetingPart, MeetingPartTimings> = {
    'abbreviated-wt': { endTime: null, startTime: null },
    'ayfm-1': { endTime: null, startTime: null },
    'ayfm-2': { endTime: null, startTime: null },
    'ayfm-3': { endTime: null, startTime: null },
    'ayfm-4': { endTime: null, startTime: null },
    'ayfm-5': { endTime: null, startTime: null },
    'bible-reading': { endTime: null, startTime: null },
    cbs: { endTime: null, startTime: null },
    'co-final-talk': { endTime: null, startTime: null },
    'co-service-talk': { endTime: null, startTime: null },
    'concluding-comments': { endTime: null, startTime: null },
    gems: { endTime: null, startTime: null },
    introduction: { endTime: null, startTime: null },
    'lac-1': { endTime: null, startTime: null },
    'lac-2': { endTime: null, startTime: null },
    'lac-3': { endTime: null, startTime: null },
    'public-talk': { endTime: null, startTime: null },
    'song-and-optional-prayer': { endTime: null, startTime: null },
    treasures: { endTime: null, startTime: null },
    wt: { endTime: null, startTime: null },
  };

  const partTimings =
    ref<Record<MeetingPart, MeetingPartTimings>>(initialPartTimings);

  const { t } = useI18n();

  // Watch AYFM parts count to adjust durations
  watch(ayfmPartsCount, (newCount) => {
    const totalMinutes = 15 - newCount; // 15 minutes total, minus number of parts for 1 min of counsel each
    const base = Math.floor(totalMinutes / newCount);
    const remainder = totalMinutes % newCount;
    for (let i = 1; i <= 5; i++) {
      if (i <= newCount) {
        const dur = base + (i <= remainder ? 1 : 0);
        partDurations.value[`ayfm-${i}` as MeetingPart] = dur;
      } else {
        partDurations.value[`ayfm-${i}` as MeetingPart] = 0;
      }
    }
  });

  // Watch LAC parts count to adjust durations
  watch(lacPartsCount, (newCount) => {
    const totalMinutes = 15;
    const base = Math.floor(totalMinutes / newCount);
    const remainder = totalMinutes % newCount;
    for (let i = 1; i <= 3; i++) {
      if (i <= newCount) {
        const dur = base + (i <= remainder ? 1 : 0);
        partDurations.value[`lac-${i}` as MeetingPart] = dur;
      } else {
        partDurations.value[`lac-${i}` as MeetingPart] = 0;
      }
    }
  });

  const meetingPartsOptions = computed<
    {
      icon?: string;
      label: string;
      value: MeetingPart;
      warning?: boolean;
    }[]
  >(() => {
    const date = selectedDateObject.value?.date;
    if (isWeMeetingDay(date)) {
      const options: {
        icon?: string;
        label: string;
        value: MeetingPart;
        warning?: boolean;
      }[] = [
        {
          icon: jwIcons['pt'],
          label: t('public-talk'),
          value: 'public-talk',
        },
        {
          icon: jwIcons['wt'],
          label: t('wt'),
          value: 'wt',
        },
      ];

      if (isCoWeek(date)) {
        options.push({
          icon: jwIcons['circuit-overseer'],
          label: t('co-final-talk'),
          value: 'co-final-talk',
        });
      }

      return options;
    } else if (isMwMeetingDay(date)) {
      const isCo = isCoWeek(date);
      const options: {
        icon?: string;
        label: string;
        value: MeetingPart;
        warning?: boolean;
      }[] = [
        {
          icon: jwIcons['introduction'],
          label: t('introduction'),
          value: 'introduction',
        },
        {
          icon: jwIcons['tgw'],
          label: t('treasures-talk'),
          value: 'treasures',
        },
        {
          icon: jwIcons['gems'],
          label: t('gems'),
          value: 'gems',
        },
        {
          icon: jwIcons['bible-reading'],
          label: t('bible-reading'),
          value: 'bible-reading',
        },
      ];
      // Add AYFM parts
      for (let i = 1; i <= ayfmPartsCount.value; i++) {
        const totalDuration = Array.from(
          { length: ayfmPartsCount.value },
          (_, idx) =>
            partDurations.value[`ayfm-${idx + 1}` as MeetingPart] || 0,
        ).reduce((a, b) => a + b, 0);
        const warning = totalDuration !== 15 - ayfmPartsCount.value;
        const dur = partDurations.value[`ayfm-${i}` as MeetingPart] || 14;
        options.push({
          icon: jwIcons['ayfm-part'],
          label: t('ayfm-part', { duration: dur, part: i }),
          value: `ayfm-${i}` as MeetingPart,
          warning,
        });
      }
      // Add LAC parts
      for (let i = 1; i <= lacPartsCount.value; i++) {
        const totalDuration = Array.from(
          { length: lacPartsCount.value },
          (_, idx) => partDurations.value[`lac-${idx + 1}` as MeetingPart] || 0,
        ).reduce((a, b) => a + b, 0);
        const warning = totalDuration !== 15;
        const dur = partDurations.value[`lac-${i}` as MeetingPart] || 15;
        options.push({
          icon: jwIcons['lac-part'],
          label: t('lac-part', { duration: dur, part: i }),
          value: `lac-${i}` as MeetingPart,
          warning,
        });
      }
      if (isCo) {
        options.push({
          icon: jwIcons['circuit-overseer'],
          label: t('co-service-talk'),
          value: 'co-service-talk',
        });
      } else {
        options.push({
          icon: jwIcons['cbs'],
          label: t('cbs'),
          value: 'cbs',
        });
      }
      options.push({
        icon: jwIcons['concluding-comments'],
        label: t('concluding-comments'),
        value: 'concluding-comments',
      });
      return options;
    }
    return [];
  });

  // Part durations in minutes (reactive)
  const partDurations = ref<Record<MeetingPart, number>>({
    'abbreviated-wt': 30,
    'ayfm-1': 14, // 15 minutes total, minus 1 minute for counsel
    'ayfm-2': 0,
    'ayfm-3': 0,
    'ayfm-4': 0,
    'ayfm-5': 0,
    'bible-reading': 4,
    cbs: 30,
    'co-final-talk': 30,
    'co-service-talk': 30,
    'concluding-comments': 3,
    gems: 10,
    introduction: 1,
    'lac-1': 15, // 15 minutes total
    'lac-2': 0,
    'lac-3': 0,
    'public-talk': 30,
    'song-and-optional-prayer': 5,
    treasures: 10,
    wt: 60,
  });

  const { toggleTimerWindow } = window.electronApi;

  const currentState = useCurrentStateStore();
  const { currentSettings, selectedDateObject } = storeToRefs(currentState);

  const handleTimerWindowVisibility = (visible: boolean) => {
    toggleTimerWindow(visible);
    currentState.setTimerWindowVisible(visible);
    if (visible) {
      // Broadcast initial timer settings
      postTimerData({
        aheadBehindMinutes: calculateAheadBehindMinutes(),
        enableMeetingCountdown: currentSettings.value?.enableMeetingCountdown,
        meetingCountdownMinutes: currentSettings.value?.meetingCountdownMinutes,
        mode: 'countup',
        mwDay: currentSettings.value?.mwDay,
        mwStartTime: currentSettings.value?.mwStartTime,
        paused: false,
        running: false,
        time: '',
        timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
        timerTextColor: currentSettings.value?.timerTextColor,
        timerTextSize: currentSettings.value?.timerTextSize,
        weDay: currentSettings.value?.weDay,
        weStartTime: currentSettings.value?.weStartTime,
      });
    }
  };

  const calculateCountdownTarget = () => {
    console.log('Calculating countdown target...', {
      currentPart: currentPart.value,
      selectedDate: selectedDateObject.value,
      timerMode: timerMode.value,
    });
    if (
      !selectedDateObject.value ||
      !isMeetingDay(selectedDateObject.value?.date) ||
      timerMode.value === 'countup'
    )
      return 0;

    if (isWeMeetingDay(selectedDateObject.value?.date)) {
      if (currentPart.value === 'public-talk') {
        return partDurations.value['public-talk'] * 60;
      } else if (currentPart.value === 'wt') {
        const isCo = isCoWeek(selectedDateObject.value?.date);
        const wtMaxDuration =
          (isCo
            ? partDurations.value['abbreviated-wt']
            : partDurations.value.wt) * 60;
        if (wtCustomEndTime.value) {
          // Custom end time
          const configuredMeetingStartTime = currentSettings.value?.weStartTime;
          if (!configuredMeetingStartTime) return 0;
          const [startHour, startMinute] =
            configuredMeetingStartTime.split(':');
          const meetingStartTime = new Date(selectedDateObject.value.date);
          if (!startHour || !startMinute) return 0;
          meetingStartTime.setHours(
            parseInt(startHour),
            parseInt(startMinute),
            0,
            0,
          );
          const parts = wtCustomEndTime.value.split(':');
          const h = Number(parts[0]);
          const m = Number(parts[1]);
          const endTime = new Date(meetingStartTime.getTime());
          endTime.setHours(h, m, 0, 0);
          const now = new Date();
          const remaining =
            Math.max(0, endTime.getTime() - now.getTime()) / 1000;
          const remainingWholeSeconds = Math.floor(remaining);
          return Math.min(remainingWholeSeconds, wtMaxDuration);
        } else {
          return wtMaxDuration;
        }
      } else if (currentPart.value === 'co-final-talk') {
        return partDurations.value['co-final-talk'] * 60;
      } else if (currentPart.value === 'co-service-talk') {
        return partDurations.value['co-service-talk'] * 60;
      }
    } else if (isMwMeetingDay(selectedDateObject.value?.date)) {
      if (currentPart.value === 'introduction') {
        return partDurations.value.introduction * 60;
      } else if (currentPart.value === 'treasures') {
        return partDurations.value.treasures * 60;
      } else if (currentPart.value === 'gems') {
        return partDurations.value.gems * 60;
      } else if (currentPart.value === 'bible-reading') {
        return partDurations.value['bible-reading'] * 60;
      } else if (currentPart.value.startsWith('ayfm-')) {
        return partDurations.value[currentPart.value] * 60;
      } else if (currentPart.value.startsWith('lac-')) {
        return partDurations.value[currentPart.value] * 60;
      } else if (currentPart.value === 'co-service-talk') {
        return partDurations.value['co-service-talk'] * 60;
      } else if (currentPart.value === 'cbs') {
        const cbsMaxDuration = partDurations.value.cbs * 60;
        if (cbsCustomEndTime.value) {
          // Custom end time
          const configuredMeetingStartTime = currentSettings.value?.mwStartTime;
          if (!configuredMeetingStartTime) return 0;
          const [startHour, startMinute] =
            configuredMeetingStartTime.split(':');
          const meetingStartTime = new Date(selectedDateObject.value.date);
          if (!startHour || !startMinute) return 0;
          meetingStartTime.setHours(
            parseInt(startHour),
            parseInt(startMinute),
            0,
            0,
          );
          const parts = cbsCustomEndTime.value.split(':');
          const h = Number(parts[0]);
          const m = Number(parts[1]);
          const endTime = new Date(meetingStartTime.getTime());
          endTime.setHours(h, m, 0, 0);
          const now = new Date();
          const remaining =
            Math.max(0, endTime.getTime() - now.getTime()) / 1000;
          const remainingWholeSeconds = Math.floor(remaining);
          return Math.min(remainingWholeSeconds, cbsMaxDuration);
        } else {
          return cbsMaxDuration;
        }
      } else if (currentPart.value === 'concluding-comments') {
        return partDurations.value['concluding-comments'] * 60;
      }
    }

    return 0;
  };

  const startTimer = () => {
    if (timerMode.value === 'countdown') {
      countdownTarget.value = calculateCountdownTarget();
    }

    timerRunning.value = true;
    timerPaused.value = false;
    timerStartTime.value = Date.now() - elapsedSeconds.value * 1000;
    timerPausedTime.value = null;

    // Log the start time for the current part
    partTimings.value[currentPart.value] = {
      ...partTimings.value[currentPart.value],
      startTime: Date.now(),
    };

    resumeInterval();
    updateTimerWindow();
  };

  const pauseTimer = () => {
    timerPaused.value = true;
    timerPausedTime.value = Date.now();
    pauseInterval();
    updateTimerWindow();
  };

  const resumeTimer = () => {
    const pauseDuration = Date.now() - (timerPausedTime.value || 0);
    if (timerStartTime.value !== null) {
      timerStartTime.value += pauseDuration;
    }
    timerPaused.value = false;
    timerPausedTime.value = null;
    resumeInterval();
    updateTimerWindow();
  };

  const stopTimer = () => {
    pauseInterval();
    // Immediately send cleared timer data to external window
    postTimerData({
      mode: timerMode.value,
      paused: false,
      running: false,
      time: '',
      timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
      timerTextColor: currentSettings.value?.timerTextColor,
      timerTextSize: currentSettings.value?.timerTextSize,
    });
    timerRunning.value = false;
    timerPaused.value = false;
    elapsedSeconds.value = 0;
    timerStartTime.value = null;
    timerPausedTime.value = null;
    countdownTarget.value = 0;

    // Log the end time for the current part
    partTimings.value[currentPart.value] = {
      ...partTimings.value[currentPart.value],
      endTime: Date.now(),
    };

    updateTimerWindow();
  };

  const formattedTime = computed(() => {
    let totalSeconds = 0;
    let isOvertime = false;

    if (timerMode.value === 'countup') {
      totalSeconds = elapsedSeconds.value;
    } else {
      const remaining = countdownTarget.value - elapsedSeconds.value;
      if (remaining < 0) {
        isOvertime = true;
        totalSeconds = Math.abs(remaining);
      } else {
        totalSeconds = remaining;
      }
    }

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const sign = isOvertime ? '-' : '';
    return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  const getDuration = (
    timings: MeetingPartTimings | null,
    duration?: number,
  ): string => {
    let formattedDuration = '';
    if (timings?.startTime && timings?.endTime) {
      const diffSeconds = Math.floor(
        (timings.endTime - timings.startTime) / 1000,
      );
      const minutes = Math.floor(diffSeconds / 60);
      const seconds = diffSeconds % 60;
      formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (duration) {
      // If no actual start/end time, use the planned duration
      formattedDuration = `${duration.toString().padStart(2, '0')}:00`;
    }
    return formattedDuration;
  };

  // Timer logic
  const { pause: pauseInterval, resume: resumeInterval } = useIntervalFn(() => {
    if (timerRunning.value && !timerPaused.value) {
      const now = Date.now();
      const startTime = timerStartTime.value;
      if (startTime) {
        elapsedSeconds.value = Math.floor((now - startTime) / 1000);
        updateTimerWindow(); // Update the timer window with new time
      }
    }
  }, 500);

  // Broadcast channel for timer data
  const { post: postTimerData } = useBroadcastChannel<TimerData, TimerData>({
    name: 'timer-display-data',
  });

  const updateTimerWindow = () => {
    // Send timer data to the timer window via broadcast channel
    const timerData = {
      aheadBehindMinutes: calculateAheadBehindMinutes(),
      enableMeetingCountdown: currentSettings.value?.enableMeetingCountdown,
      meetingCountdownMinutes: currentSettings.value?.meetingCountdownMinutes,
      mode: timerMode.value,
      mwDay: currentSettings.value?.mwDay,
      mwStartTime: currentSettings.value?.mwStartTime,
      paused: timerPaused.value,
      running: timerRunning.value,
      time: timerRunning.value ? formattedTime.value : '',
      timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
      timerTextColor: currentSettings.value?.timerTextColor,
      timerTextSize: currentSettings.value?.timerTextSize,
      weDay: currentSettings.value?.weDay,
      weStartTime: currentSettings.value?.weStartTime,
    };

    postTimerData(timerData);
  };

  // Calculate ahead/behind minutes
  const calculateAheadBehindMinutes = (): null | number => {
    if (!currentSettings.value?.enableMeetingAheadBehind) {
      return null;
    }

    const date = selectedDateObject.value?.date;

    let sequence: MeetingPart[];
    if (isWeMeetingDay(date)) {
      const isCo = isCoWeek(date);
      sequence = isCo
        ? [
            'song-and-optional-prayer',
            'public-talk',
            'song-and-optional-prayer',
            'abbreviated-wt',
            'co-final-talk',
            'song-and-optional-prayer',
          ]
        : [
            'song-and-optional-prayer',
            'public-talk',
            'song-and-optional-prayer',
            'wt',
            'song-and-optional-prayer',
          ];
    } else if (isMwMeetingDay(date)) {
      sequence = [
        'song-and-optional-prayer',
        'introduction',
        'treasures',
        'gems',
        'bible-reading',
        'ayfm-1',
        'ayfm-2',
        'ayfm-3',
        'ayfm-4',
        'ayfm-5',
        'song-and-optional-prayer',
        'lac-1',
        'lac-2',
        'lac-3',
        isCoWeek(date) ? 'co-service-talk' : 'cbs',
        'concluding-comments',
        'song-and-optional-prayer',
      ];
    } else {
      sequence = [];
    }

    const currentPartIndex = sequence.indexOf(currentPart.value);
    if (currentPartIndex === -1) return null;

    const currentPartInfo = sequence[currentPartIndex];
    if (!currentPartInfo) return null;

    const actualStartTime = partTimings.value[currentPart.value]?.startTime;
    if (!actualStartTime) return null;

    const plannedStartTime = getPlannedStartTime(currentPartInfo);
    if (!plannedStartTime) return null;

    // Return difference in minutes (positive = behind, negative = ahead)
    const diffMinutes = (actualStartTime - plannedStartTime) / (1000 * 60);
    return diffMinutes;
  };

  // Get planned start time for a meeting part
  const getPlannedStartTime = (part: MeetingPart): null | number => {
    const date = selectedDateObject.value?.date;
    if (!date || (!isWeMeetingDay(date) && !isMwMeetingDay(date))) return null;

    const meetingStart = meetingStartTime.value?.getTime();
    if (!meetingStart) return null;

    let sequence: MeetingPart[];
    if (isWeMeetingDay(date)) {
      const isCo = isCoWeek(date);
      sequence = isCo
        ? [
            'song-and-optional-prayer',
            'public-talk',
            'song-and-optional-prayer',
            'abbreviated-wt',
            'co-final-talk',
            'song-and-optional-prayer',
          ]
        : [
            'song-and-optional-prayer',
            'public-talk',
            'song-and-optional-prayer',
            'wt',
            'song-and-optional-prayer',
          ];
    } else if (isMwMeetingDay(date)) {
      const isCo = isCoWeek(date);
      sequence = [
        'song-and-optional-prayer',
        'introduction',
        'treasures',
        'gems',
        'bible-reading',
        'ayfm-1',
        'ayfm-2',
        'ayfm-3',
        'ayfm-4',
        'ayfm-5',
        'song-and-optional-prayer',
        'lac-1',
        'lac-2',
        'lac-3',
        isCo ? 'co-service-talk' : 'cbs',
        'concluding-comments',
        'song-and-optional-prayer',
      ];
    } else {
      return null;
    }

    const index = sequence.indexOf(part);
    if (index === -1) return null;

    let offset = 0;
    for (let i = 0; i < index; i++) {
      const prevPart = sequence[i];
      if (!prevPart) continue;
      const dur = partDurations.value[prevPart] ?? 0;
      offset += dur;
      // Add 1 minute for counsel after each non-zero Bible reading or AYFM part
      if (
        (prevPart === 'bible-reading' || prevPart.startsWith('ayfm-')) &&
        dur > 0
      ) {
        offset += 1;
      }
    }

    return meetingStart + offset * 60 * 1000;
  };

  const meetingStartTime = computed(() => {
    const date = selectedDateObject.value?.date;
    if (!date || (!isWeMeetingDay(date) && !isMwMeetingDay(date))) return null;
    const startTimeStr = isMwMeetingDay(date)
      ? currentSettings.value?.mwStartTime
      : currentSettings.value?.weStartTime;
    if (!startTimeStr) return null;
    const parts = startTimeStr.split(':');
    const hour = Number(parts[0]);
    const min = Number(parts[1]);
    const start = new Date(date);
    start.setHours(hour, min, 0, 0);
    return start;
  });

  const cbsAdaptiveDefaultEndTime = computed(() => {
    const startTime = getPlannedStartTime('cbs');
    if (!startTime) return '';
    const duration = partDurations.value.cbs * 60 * 1000;
    const endTime = new Date(startTime + duration);
    return endTime.toTimeString().slice(0, 5); // hh:mm
  });

  const wtAdaptiveDefaultEndTime = computed(() => {
    const startTime = getPlannedStartTime('wt');
    if (!startTime) return '';
    const date = selectedDateObject.value?.date;
    const isCo = date ? isCoWeek(date) : false;
    const durationKey = isCo ? 'abbreviated-wt' : 'wt';
    const duration = partDurations.value[durationKey] * 60 * 1000;
    const endTime = new Date(startTime + duration);
    return endTime.toTimeString().slice(0, 5); // hh:mm
  });

  const cbsEndTimeRules = [
    (val: string) => !!val || t('required'),
    (val: string) => {
      const parts = val.split(':');
      const h = Number(parts[0]);
      const m = Number(parts[1]);
      const endTime = new Date(meetingStartTime.value?.getTime() || 0);
      endTime.setHours(h, m, 0, 0);
      const minTime = new Date(
        (meetingStartTime.value?.getTime() || 0) + 68 * 60 * 1000,
      );
      const maxTime = new Date(
        (meetingStartTime.value?.getTime() || 0) + 97 * 60 * 1000,
      );
      return (
        (endTime >= minTime && endTime <= maxTime) ||
        t('time-must-be-between', {
          maxTime: maxTime.getHours() + ':' + maxTime.getMinutes(),
          minTime: minTime.getHours() + ':' + minTime.getMinutes(),
        })
      );
    },
  ];
  const wtEndTimeRules = [
    (val: string) => !!val || t('required'),
    (val: string) => {
      const parts = val.split(':');
      const h = Number(parts[0]);
      const m = Number(parts[1]);
      const endTime = new Date(meetingStartTime.value?.getTime() || 0);
      endTime.setHours(h, m, 0, 0);
      const minTime = new Date(
        (meetingStartTime.value?.getTime() || 0) + 36 * 60 * 1000,
      );
      const maxTime = new Date(
        (meetingStartTime.value?.getTime() || 0) + 100 * 60 * 1000,
      );
      return (
        (endTime >= minTime && endTime <= maxTime) ||
        t('time-must-be-between', {
          maxTime: maxTime.getHours() + ':' + maxTime.getMinutes(),
          minTime: minTime.getHours() + ':' + minTime.getMinutes(),
        })
      );
    },
  ];

  // Watch selected date to set default adaptive end times
  watchImmediate(selectedDateObject, () => {
    cbsCustomEndTime.value = cbsAdaptiveDefaultEndTime.value;
    wtCustomEndTime.value = wtAdaptiveDefaultEndTime.value;
  });

  return {
    ayfmPartsCount,
    cbsCustomEndTime,
    cbsEndTimeRules,
    currentPart,
    elapsedSeconds,
    formattedTime,
    getDuration,
    getPlannedStartTime,
    getTimeString,
    handleTimerWindowVisibility,
    lacPartsCount,
    meetingPartsOptions,
    partDurations,
    partTimings, // Expose partTimings
    pauseTimer,
    resumeTimer,
    startTimer,
    stopTimer,
    timerMode,
    timerPaused,
    timerPausedTime,
    timerRunning,
    timerStartTime,
    updateTimerWindow,
    wtCustomEndTime,
    wtEndTimeRules,
  };
};

export default useTimer;
