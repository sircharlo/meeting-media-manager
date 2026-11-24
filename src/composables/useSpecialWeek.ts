import type { SpecialDayRole, SpecialWeek } from 'src/types';

import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import {
  getSpecialDayRole,
  getSpecialWeek,
  isMovedMeetingDay,
} from 'src/helpers/special-weeks';
import {
  addToDate,
  dateFromString,
  formatDate,
  isInPast,
} from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed } from 'vue';

/**
 * What's different about the selected day when it falls in the circuit
 * overseer's visit or the Memorial week: for the header chip's tooltip, and
 * for the empty page of a day whose meeting moved or was replaced.
 */
export function useSpecialWeek() {
  const { dateLocale, formatDayMonthRange, formatWeekdayDate, t } = useLocale();
  const currentState = useCurrentStateStore();
  const { hiddenMediaNamesForSelectedDate, selectedDate } =
    storeToRefs(currentState);

  const selectedDay = computed(() =>
    selectedDate.value ? dateFromString(selectedDate.value) : undefined,
  );

  const specialWeek = computed(() => getSpecialWeek(selectedDay.value));

  const dayRole = computed<SpecialDayRole | undefined>(() =>
    selectedDay.value && specialWeek.value
      ? getSpecialDayRole(selectedDay.value, specialWeek.value)
      : undefined,
  );

  const title = computed(() => {
    if (!specialWeek.value) return '';
    return specialWeek.value.kind === 'co'
      ? t('special-week-co-title')
      : t('special-week-memorial-title');
  });

  const chipLabel = computed(() => {
    if (!specialWeek.value) return '';
    return specialWeek.value.kind === 'co'
      ? t('special-week-co-chip')
      : t('special-week-memorial-title');
  });

  const range = computed(() => {
    const monday = specialWeek.value?.monday;
    if (!monday) return '';
    return formatDayMonthRange(monday, addToDate(monday, { day: 6 }));
  });

  const memorialOtherDayLines = (week: SpecialWeek, date: string) => [
    isInPast(week.keyDate)
      ? t('special-week-memorial-past', { date })
      : t('special-week-memorial-upcoming', { date }),
    week.replacedMeeting === 'we'
      ? t('special-week-mw-as-usual')
      : t('special-week-we-as-usual'),
  ];

  const getRoleLines = (role: SpecialDayRole, week: SpecialWeek) => {
    const date = formatWeekdayDate(week.keyDate);
    switch (role) {
      case 'co-midweek':
        return [t('special-week-co-midweek')];
      case 'co-weekend':
        return [t('special-week-co-weekend')];
      case 'memorial':
        return [t('special-week-memorial-day')];
      case 'memorial-other':
        return memorialOtherDayLines(week, date);
      case 'memorial-replaced':
        return [
          week.replacedMeeting === 'we'
            ? t('no-weekend-meeting-this-week')
            : t('no-midweek-meeting-this-week'),
          t('special-week-memorial-replaced-explain', { date }),
        ];
      default:
        return [t('special-week-co-other', { date })];
    }
  };

  /** What's different on the selected day, one sentence per line. */
  const messageLines = computed(() =>
    dayRole.value && specialWeek.value
      ? getRoleLines(dayRole.value, specialWeek.value)
      : [],
  );

  /** On the CO's meeting days, the media M³ hid. */
  const hiddenNames = computed(() =>
    dayRole.value === 'co-midweek' || dayRole.value === 'co-weekend'
      ? hiddenMediaNamesForSelectedDate.value
      : [],
  );

  const isMovedDay = computed(() => isMovedMeetingDay(dayRole.value));

  const movedDayTitle = computed(() => {
    if (dayRole.value === 'co-moved') return t('no-midweek-meeting-today');
    return specialWeek.value?.replacedMeeting === 'we'
      ? t('no-weekend-meeting-this-week')
      : t('no-midweek-meeting-this-week');
  });

  const movedDayExplanation = computed(() => {
    if (!specialWeek.value) return '';
    const date = formatWeekdayDate(specialWeek.value.keyDate);
    return specialWeek.value.kind === 'co'
      ? t('special-week-co-moved-explain', { date })
      : t('special-week-memorial-replaced-explain', { date });
  });

  /** "Go to Tuesday" or "Go to the Memorial". */
  const goToLabel = computed(() => {
    const week = specialWeek.value;
    if (!week) return '';
    return week.kind === 'co'
      ? t('go-to-day', { day: dateLocale.value.days[week.keyDate.getDay()] })
      : t('go-to-the-memorial');
  });

  /** Selects the day the meeting moved to, or the Memorial. */
  const goToKeyDate = () => {
    if (!specialWeek.value) return;
    selectedDate.value = formatDate(specialWeek.value.keyDate, 'YYYY/MM/DD');
  };

  return {
    chipLabel,
    dayRole,
    goToKeyDate,
    goToLabel,
    hiddenNames,
    isMovedDay,
    messageLines,
    movedDayExplanation,
    movedDayTitle,
    range,
    specialWeek,
    title,
  };
}
