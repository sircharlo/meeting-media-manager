import type {
  CustomTimerPart,
  MediaSectionIdentifier,
  MeetingPart,
  MeetingPartTimings,
  TimerData,
} from 'src/types';

import {
  useBroadcastChannel,
  useIntervalFn,
  watchImmediate,
} from '@vueuse/core';
import { storeToRefs } from 'pinia';
import {
  isCoWeek,
  isMeetingDay,
  isMwMeetingDay,
  isWeMeetingDay,
} from 'src/helpers/date';
import { errorCatcher } from 'src/helpers/error-catcher';
import { getJwIconFromKeyword } from 'src/helpers/fonts';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const useTimer = () => {
  const createCustomPartId = (): `custom-${string}` =>
    `custom-${Math.random().toString(36).slice(2, 10)}`;

  const timerRunning = ref(false);
  const timerPaused = ref(false);
  const timerStartTime = ref<null | number>(null);
  const timerPausedTime = ref<null | number>(null);
  const elapsedSeconds = ref(0);
  const countdownTarget = ref<number>(0);
  const timerMode = computed(
    () => currentState.currentSettings?.timerMode ?? 'countup',
  );
  const currentPart = ref<MeetingPart>('public-talk');
  const wtCustomEndTime = ref<string>('');
  const cbsCustomEndTime = ref('');
  const ayfmPartsCount = ref<number>(1);
  const lacPartsCount = ref<number>(1);

  const distributePartDurations = (
    prefix: 'ayfm' | 'lac',
    count: number,
    totalMinutes: number,
  ) => {
    const maxParts = prefix === 'ayfm' ? 5 : 3;
    const base = Math.floor(totalMinutes / count);
    const remainder = totalMinutes % count;

    for (let i = 1; i <= maxParts; i++) {
      const key = `${prefix}-${i}` as MeetingPart;
      if (i <= count) {
        partDurations.value[key] = base + (i <= remainder ? 1 : 0);
      } else {
        partDurations.value[key] = 0;
      }
    }
  };

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

  const customTimerParts = computed<CustomTimerPart[]>(() => {
    if (isMeetingDay(selectedDateObject.value?.date)) return [];
    return selectedDateObject.value?.timerParts ?? [];
  });

  const ensureNonMeetingTimerParts = () => {
    if (
      isMeetingDay(selectedDateObject.value?.date) ||
      !selectedDateObject.value
    )
      return;

    if (selectedDateObject.value.timerParts?.length) {
      selectedDateObject.value.timerParts.forEach((part) => {
        if (!(part.id in partDurations.value)) {
          partDurations.value[part.id] = part.duration;
        }
        if (!(part.id in partTimings.value)) {
          partTimings.value[part.id] = { endTime: null, startTime: null };
        }
      });
      return;
    }

    const sectionParts = (selectedDateObject.value.mediaSections ?? [])
      .filter(
        (section) => !!section.config?.label || !!section.config?.uniqueId,
      )
      .map((section, index) => ({
        duration: 5,
        id: createCustomPartId(),
        label: section.config?.label || `${t('meeting-part')} ${index + 1}`,
      }));

    selectedDateObject.value.timerParts = sectionParts.length
      ? sectionParts
      : [
          {
            duration: 5,
            id: createCustomPartId(),
            label: `${t('meeting-part')} 1`,
          },
        ];

    selectedDateObject.value.timerParts.forEach((part) => {
      partDurations.value[part.id] = part.duration;
      partTimings.value[part.id] = { endTime: null, startTime: null };
    });
  };

  const syncCustomTimerPartState = () => {
    customTimerParts.value.forEach((part, index) => {
      part.duration = Math.max(1, Number(part.duration) || 1);
      part.label ||= `${t('meeting-part')} ${index + 1}`;
      partDurations.value[part.id] = part.duration;
      partTimings.value[part.id] ??= { endTime: null, startTime: null };
    });
  };

  // Watch AYFM parts count to adjust durations
  watch(ayfmPartsCount, (newCount) => {
    distributePartDurations('ayfm', newCount, 15 - newCount);
  });

  // Watch LAC parts count to adjust durations
  watch(lacPartsCount, (newCount) => {
    distributePartDurations('lac', newCount, 15);
  });

  const meetingPartsOptions = computed<
    {
      icon?: string;
      label: string;
      section?: MediaSectionIdentifier;
      value: MeetingPart;
      warning?: boolean;
    }[]
  >(() => {
    const date = selectedDateObject.value?.date;
    if (isWeMeetingDay(date)) {
      const options: {
        icon?: string;
        label: string;
        section?: MediaSectionIdentifier;
        value: MeetingPart;
        warning?: boolean;
      }[] = [
        {
          icon: getJwIconFromKeyword('public-talk'),
          label: t('public-talk'),
          section: 'pt',
          value: 'public-talk',
        },
        {
          icon: getJwIconFromKeyword('wt'),
          label: t('wt'),
          section: 'wt',
          value: 'wt',
        },
      ];

      if (isCoWeek(date)) {
        options.push({
          icon: getJwIconFromKeyword('co-final-talk'),
          label: t('co-final-talk'),
          section: 'co',
          value: 'co-final-talk',
        });
      }

      return options;
    } else if (isMwMeetingDay(date)) {
      const isCo = isCoWeek(date);
      const options: {
        icon?: string;
        label: string;
        section?: MediaSectionIdentifier;
        value: MeetingPart;
        warning?: boolean;
      }[] = [
        {
          icon: getJwIconFromKeyword('introduction'),
          label: t('introduction'),
          value: 'introduction',
        },
        {
          icon: getJwIconFromKeyword('treasures'),
          label: t('treasures-talk'),
          section: 'tgw',
          value: 'treasures',
        },
        {
          icon: getJwIconFromKeyword('gems'),
          label: t('gems'),
          section: 'tgw',
          value: 'gems',
        },
        {
          icon: getJwIconFromKeyword('bible-reading'),
          label: t('bible-reading'),
          section: 'tgw',
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
          icon: getJwIconFromKeyword('ayfm-part'),
          label: t('ayfm-part', { duration: dur, part: i }),
          section: 'ayfm',
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
          icon: getJwIconFromKeyword('lac-part'),
          label: t('lac-part', { duration: dur, part: i }),
          section: 'lac',
          value: `lac-${i}` as MeetingPart,
          warning,
        });
      }
      if (isCo) {
        options.push({
          icon: getJwIconFromKeyword('co-service-talk'),
          label: t('co-service-talk'),
          section: 'co',
          value: 'co-service-talk',
        });
      } else {
        options.push({
          icon: getJwIconFromKeyword('cbs'),
          label: t('cbs'),
          section: 'lac',
          value: 'cbs',
        });
      }
      options.push({
        icon: getJwIconFromKeyword('concluding-comments'),
        label: t('concluding-comments'),
        value: 'concluding-comments',
      });
      return options;
    }

    ensureNonMeetingTimerParts();

    return customTimerParts.value.map((part) => ({
      label: `${part.label} (${part.duration} min.)`,
      value: part.id,
    }));
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

  const { toggleTimerWindow } = globalThis.electronApi;

  const currentState = useCurrentStateStore();
  const { currentSettings, selectedDateObject } = storeToRefs(currentState);

  const addCustomTimerPart = () => {
    ensureNonMeetingTimerParts();
    if (!selectedDateObject.value) return;

    const nextIndex = (selectedDateObject.value.timerParts?.length ?? 0) + 1;
    const newPart: CustomTimerPart = {
      duration: 5,
      id: createCustomPartId(),
      label: `${t('meeting-part')} ${nextIndex}`,
    };

    selectedDateObject.value.timerParts ??= [];
    selectedDateObject.value.timerParts.push(newPart);
    partDurations.value[newPart.id] = newPart.duration;
    partTimings.value[newPart.id] = { endTime: null, startTime: null };

    if (currentPart.value.startsWith('custom-')) {
      currentPart.value = newPart.id;
    }
  };

  const moveCustomTimerPart = (fromIndex: number, toIndex: number) => {
    const parts = selectedDateObject.value?.timerParts;
    if (
      !parts ||
      toIndex < 0 ||
      toIndex >= parts.length ||
      fromIndex === toIndex
    )
      return;

    const [movedPart] = parts.splice(fromIndex, 1);
    if (!movedPart) return;
    parts.splice(toIndex, 0, movedPart);
  };

  const removeCustomTimerPart = (partId: MeetingPart) => {
    const parts = selectedDateObject.value?.timerParts;
    if (!parts) return;

    if (parts.length <= 1) return;

    selectedDateObject.value.timerParts = parts.filter(
      (part) => part.id !== partId,
    );

    if (currentPart.value === partId) {
      currentPart.value =
        selectedDateObject.value.timerParts[0]?.id ?? currentPart.value;
    }
  };

  const handleTimerWindowVisibility = (visible: boolean) => {
    toggleTimerWindow(visible);
    currentState.setTimerWindowVisible(visible);
    if (visible) {
      // Broadcast initial timer settings
      safePostTimerData({
        aheadBehindMinutes: calculateAheadBehindMinutes(),
        mode: 'countup',
        mwDay: currentSettings.value?.mwDay,
        mwStartTime: currentSettings.value?.mwStartTime,
        paused: false,
        running: false,
        time: '',
        timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
        timerEnableMeetingCountdown:
          currentSettings.value?.timerEnableMeetingCountdown,
        timerMeetingCountdownMinutes:
          currentSettings.value?.timerMeetingCountdownMinutes,
        timerOvertimeAnimation: currentSettings.value?.timerOvertimeAnimation,
        timerOvertimeBackgroundColor:
          currentSettings.value?.timerOvertimeBackgroundColor,
        timerOvertimeIndicator: currentSettings.value?.timerOvertimeIndicator,
        timerOvertimeShowAmountOnly:
          currentSettings.value?.timerOvertimeShowAmountOnly,
        timerOvertimeTextColor: currentSettings.value?.timerOvertimeTextColor,
        timerTextColor: currentSettings.value?.timerTextColor,
        timerTextSize: currentSettings.value?.timerTextSize,
        weDay: currentSettings.value?.weDay,
        weStartTime: currentSettings.value?.weStartTime,
      });
    }
  };

  const calculateCountdownTarget = () => {
    if (!selectedDateObject.value || timerMode.value === 'countup') return 0;

    if (!isMeetingDay(selectedDateObject.value?.date)) {
      return (partDurations.value[currentPart.value] || 0) * 60;
    }

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
            Number.parseInt(startHour),
            Number.parseInt(startMinute),
            0,
            0,
          );
          const parts = wtCustomEndTime.value.split(':');
          const h = Number(parts[0]);
          const m = Number(parts[1]);
          const endTime = new Date(meetingStartTime);
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
        return (partDurations.value[currentPart.value] || 0) * 60;
      } else if (currentPart.value.startsWith('lac-')) {
        return (partDurations.value[currentPart.value] || 0) * 60;
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
            Number.parseInt(startHour),
            Number.parseInt(startMinute),
            0,
            0,
          );
          const parts = cbsCustomEndTime.value.split(':');
          const h = Number(parts[0]);
          const m = Number(parts[1]);
          const endTime = new Date(meetingStartTime);
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
    if (!isMeetingDay(selectedDateObject.value?.date)) {
      ensureNonMeetingTimerParts();
      const firstCustomPart = customTimerParts.value[0];
      if (!currentPart.value.startsWith('custom-') && firstCustomPart) {
        currentPart.value = firstCustomPart.id;
      }
    }

    if (timerMode.value === 'countdown') {
      countdownTarget.value = calculateCountdownTarget();
    }

    timerRunning.value = true;
    timerPaused.value = false;
    timerStartTime.value = Date.now() - elapsedSeconds.value * 1000;
    timerPausedTime.value = null;

    // Log the start time for the current part
    partTimings.value[currentPart.value] = {
      ...(partTimings.value[currentPart.value] ?? {
        endTime: null,
        startTime: null,
      }),
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
    safePostTimerData({
      mode: timerMode.value,
      paused: false,
      running: false,
      time: '',
      timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
      timerOvertimeAnimation: currentSettings.value?.timerOvertimeAnimation,
      timerOvertimeBackgroundColor:
        currentSettings.value?.timerOvertimeBackgroundColor,
      timerOvertimeIndicator: currentSettings.value?.timerOvertimeIndicator,
      timerOvertimeShowAmountOnly:
        currentSettings.value?.timerOvertimeShowAmountOnly,
      timerOvertimeTextColor: currentSettings.value?.timerOvertimeTextColor,
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
      ...(partTimings.value[currentPart.value] ?? {
        endTime: null,
        startTime: null,
      }),
      endTime: Date.now(),
    };

    updateTimerWindow();
  };

  const formattedTime = computed(() => {
    const isCountup = timerMode.value === 'countup';
    let isOvertime: boolean;
    let totalSeconds: number;

    if (isCountup) {
      // 0 means no limit defined
      const partMaxSeconds = (partDurations.value[currentPart.value] || 0) * 60;
      isOvertime = partMaxSeconds > 0 && elapsedSeconds.value > partMaxSeconds;

      if (isOvertime && currentSettings.value?.timerOvertimeShowAmountOnly) {
        totalSeconds = elapsedSeconds.value - partMaxSeconds;
      } else {
        totalSeconds = elapsedSeconds.value;
      }
    } else {
      const remaining = countdownTarget.value - elapsedSeconds.value;
      isOvertime = remaining < 0;
      totalSeconds = Math.abs(remaining);
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

  const safePostTimerData = (timerData: TimerData) => {
    try {
      postTimerData(timerData);
    } catch (error) {
      void errorCatcher(error, {
        contexts: { timer: { action: 'postTimerData' } },
      });
    }
  };

  const updateTimerWindow = () => {
    // Send timer data to the timer window via broadcast channel
    const timerData = {
      aheadBehindMinutes: calculateAheadBehindMinutes(),
      mode: timerMode.value,
      mwDay: currentSettings.value?.mwDay,
      mwStartTime: currentSettings.value?.mwStartTime,
      paused: timerPaused.value,
      running: timerRunning.value,
      time: timerRunning.value ? formattedTime.value : '',
      timerBackgroundColor: currentSettings.value?.timerBackgroundColor,
      timerEnableMeetingCountdown:
        currentSettings.value?.timerEnableMeetingCountdown,
      timerMeetingCountdownMinutes:
        currentSettings.value?.timerMeetingCountdownMinutes,
      timerOvertimeAnimation: currentSettings.value?.timerOvertimeAnimation,
      timerOvertimeBackgroundColor:
        currentSettings.value?.timerOvertimeBackgroundColor,
      timerOvertimeIndicator: currentSettings.value?.timerOvertimeIndicator,
      timerOvertimeShowAmountOnly:
        currentSettings.value?.timerOvertimeShowAmountOnly,
      timerOvertimeTextColor: currentSettings.value?.timerOvertimeTextColor,
      timerTextColor: currentSettings.value?.timerTextColor,
      timerTextSize: currentSettings.value?.timerTextSize,
      weDay: currentSettings.value?.weDay,
      weStartTime: currentSettings.value?.weStartTime,
    };

    safePostTimerData(timerData);
  };

  const sequence = computed(() => {
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
        ...(isCoWeek(date)
          ? (['concluding-comments', 'co-service-talk'] as MeetingPart[])
          : (['cbs', 'concluding-comments'] as MeetingPart[])),
        'song-and-optional-prayer',
      ];
    } else {
      sequence = [];
    }

    return sequence;
  });

  // Calculate ahead/behind minutes
  const calculateAheadBehindMinutes = (): null | number => {
    if (!currentSettings.value?.timerEnableMeetingAheadBehind) {
      return null;
    }

    const currentPartIndex = sequence.value.indexOf(currentPart.value);
    if (currentPartIndex === -1) return null;

    const currentPartInfo = sequence.value[currentPartIndex];
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
    if (!date) return null;

    if (!isWeMeetingDay(date) && !isMwMeetingDay(date)) {
      const parts = customTimerParts.value;
      const index = parts.findIndex((customPart) => customPart.id === part);
      if (index === -1) return null;

      const anchorPart = parts.find(
        (customPart) => partTimings.value[customPart.id]?.startTime,
      );
      const anchorStartTime = anchorPart
        ? partTimings.value[anchorPart.id]?.startTime
        : null;

      if (!anchorPart || !anchorStartTime) return null;

      const anchorIndex = parts.findIndex(
        (customPart) => customPart.id === anchorPart.id,
      );

      let offsetMinutes = 0;
      if (index >= anchorIndex) {
        for (let i = anchorIndex; i < index; i++) {
          offsetMinutes += parts[i]?.duration ?? 0;
        }
        return anchorStartTime + offsetMinutes * 60 * 1000;
      }

      for (let i = index; i < anchorIndex; i++) {
        offsetMinutes += parts[i]?.duration ?? 0;
      }
      return anchorStartTime - offsetMinutes * 60 * 1000;
    }

    const meetingStart = meetingStartTime.value?.getTime();
    if (!meetingStart) return null;

    const index = sequence.value.indexOf(part);
    if (index === -1) return null;

    let offset = 0;
    for (let i = 0; i < index; i++) {
      const prevPart = sequence.value[i];
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
          maxTime:
            maxTime.getHours().toString().padStart(2, '0') +
            ':' +
            maxTime.getMinutes().toString().padStart(2, '0'),
          minTime:
            minTime.getHours().toString().padStart(2, '0') +
            ':' +
            minTime.getMinutes().toString().padStart(2, '0'),
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
    ensureNonMeetingTimerParts();
    syncCustomTimerPartState();

    if (!isMeetingDay(selectedDateObject.value?.date)) {
      const firstCustomPart = customTimerParts.value[0];
      if (firstCustomPart) {
        currentPart.value = firstCustomPart.id;
      }
    }
  });

  watch(
    customTimerParts,
    () => {
      syncCustomTimerPartState();
    },
    { deep: true },
  );

  return {
    addCustomTimerPart,
    ayfmPartsCount,
    cbsCustomEndTime,
    cbsEndTimeRules,
    currentPart,
    customTimerParts,
    elapsedSeconds,
    formattedTime,
    getDuration,
    getPlannedStartTime,
    getTimeString,
    handleTimerWindowVisibility,
    lacPartsCount,
    meetingPartsOptions,
    moveCustomTimerPart,
    partDurations,
    partTimings, // Expose partTimings
    pauseTimer,
    removeCustomTimerPart,
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
