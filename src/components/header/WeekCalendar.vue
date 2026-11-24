<template>
  <fieldset
    ref="root"
    :aria-label="t('select-a-date')"
    class="week-calendar"
    @keydown="onKeydown"
  >
    <div class="week-calendar__grid">
      <div aria-hidden="true" class="week-calendar__row">
        <span></span>
        <span
          v-for="weekday in weekdayNames"
          :key="weekday"
          class="week-calendar__weekday"
        >
          {{ weekday }}
        </span>
      </div>
      <div
        v-for="week in weeks"
        :key="week.key"
        class="week-calendar__row"
        :class="{ 'week-calendar__row--current': week.offset === 0 }"
      >
        <div class="week-calendar__label">
          <div class="week-calendar__label-title">{{ week.title }}</div>
          <div class="week-calendar__label-range">{{ week.range }}</div>
        </div>
        <button
          v-for="day in week.days"
          :key="day.key"
          :aria-current="day.isToday ? 'date' : undefined"
          :aria-label="day.label"
          :aria-pressed="day.key === model"
          class="week-calendar__day"
          :class="dayClasses(day)"
          :data-autofocus="day.key === activeKey ? '' : undefined"
          :data-date="day.key"
          :disabled="!day.enabled"
          :tabindex="day.key === activeKey ? 0 : -1"
          type="button"
          @click="select(day.key)"
        >
          {{ day.number }}
        </button>
      </div>
    </div>
    <div class="week-calendar__legend">
      <span
        v-for="status in STATUS_ORDER"
        :key="status"
        class="week-calendar__legend-item"
      >
        <span
          aria-hidden="true"
          class="week-calendar__swatch"
          :class="`week-calendar__status--${status}`"
        ></span>
        {{ statusLabels[status] }}
      </span>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import type { CalendarDayStatus } from 'src/types';

import { storeToRefs } from 'pinia';
import { useLocale } from 'src/composables/useLocale';
import { WEEKS_TO_FETCH } from 'src/constants/date';
import {
  addToDate,
  dateFromString,
  datesAreSame,
  formatDate,
  getDateDiff,
  getLocalDate,
  getSpecificWeekday,
} from 'src/utils/date';
import { useCurrentStateStore } from 'stores/current-state';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { useI18n } from 'vue-i18n';

interface CalendarDay {
  enabled: boolean;
  isToday: boolean;
  key: string;
  label: string;
  number: number;
  status?: CalendarDayStatus;
}

const DATE_KEY_MASK = 'YYYY/MM/DD';
const DAYS_IN_WEEK = 7;
const ARROW_STEPS: Partial<Record<string, number>> = {
  ArrowDown: DAYS_IN_WEEK,
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -DAYS_IN_WEEK,
};
const STATUS_ORDER: CalendarDayStatus[] = [
  'ready',
  'pending',
  'error',
  'added',
];

const props = defineProps<{
  /** Status of each day that has one, keyed by `YYYY/MM/DD`. */
  dayStatuses?: Partial<Record<string, CalendarDayStatus>>;
  /** Last selectable day. Defaults to the end of the fetched weeks. */
  max?: Date;
  /** First selectable day. Defaults to this week's Monday. */
  min?: Date;
}>();

/** The selected day, as `YYYY/MM/DD`. */
const model = defineModel<string>({ required: true });

const { locale, t } = useI18n();
const { dateLocale } = useLocale();
const { currentSettings } = storeToRefs(useCurrentStateStore());

const root = useTemplateRef<HTMLElement>('root');
const focusKey = ref<string>();

// The popup creates this component each time it opens, so "today" is fresh
// for every opening without having to watch the clock.
const today = new Date();
const thisMonday = getSpecificWeekday(today, 0);

const toKey = (date: Date) => formatDate(date, DATE_KEY_MASK);

const bounds = computed(() => ({
  max:
    props.max ??
    addToDate(thisMonday, { day: WEEKS_TO_FETCH * DAYS_IN_WEEK - 1 }),
  min: props.min ?? thisMonday,
}));

const isInBounds = (date: Date) =>
  getDateDiff(date, bounds.value.min, 'days') >= 0 &&
  getDateDiff(date, bounds.value.max, 'days') <= 0;

const statusLabels = computed<Record<CalendarDayStatus, string>>(() => ({
  added: t('imported-media'),
  error: t('error'),
  pending: t('calendar-status-pending'),
  ready: t('calendar-status-ready'),
}));

// Meeting weeks always run Monday to Sunday, whatever the first-day-of-week
// setting says: rows line up with the weeks M³ fetches.
const weekdayNames = computed(() => {
  const [sunday, ...others] = dateLocale.value.daysShort;
  return [...others, sunday];
});

const dayMonthFormatter = computed(() => {
  try {
    // Only trust Intl when it knows the UI language: otherwise it would
    // silently fall back to another language's month names.
    if (!Intl.DateTimeFormat.supportedLocalesOf(locale.value).length) {
      return undefined;
    }
    return new Intl.DateTimeFormat(locale.value, {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    // An invalid language tag: use the app's own month names instead.
    return undefined;
  }
});

const formatRange = (start: Date, end: Date) => {
  const formatter = dayMonthFormatter.value;
  // formatRange shortens "Nov 23 – Nov 29" to "Nov 23 – 29", but adds both
  // years to a week that spans New Year, too wide for a row label.
  if (formatter && start.getFullYear() === end.getFullYear()) {
    return formatter.formatRange(start, end);
  }
  const format = (date: Date) =>
    formatter?.format(date) ?? formatDate(date, 'D MMM', dateLocale.value);
  return `${format(start)} – ${format(end)}`;
};

const weekTitle = (offset: number) =>
  offset < 0 ? t('weeks-ago', -offset) : t('weeks-from-now', offset);

const buildDay = (date: Date): CalendarDay => {
  const key = toKey(date);
  const enabled = isInBounds(date);
  const status = enabled ? props.dayStatuses?.[key] : undefined;
  const dateLabel = getLocalDate(
    date,
    dateLocale.value,
    currentSettings.value?.localDateFormat,
  );
  return {
    enabled,
    isToday: datesAreSame(date, today),
    key,
    label: status ? `${dateLabel}, ${statusLabels.value[status]}` : dateLabel,
    number: date.getDate(),
    status,
  };
};

const weeks = computed(() => {
  const firstMonday = getSpecificWeekday(bounds.value.min, 0);
  const weekCount =
    Math.floor(
      getDateDiff(bounds.value.max, firstMonday, 'days') / DAYS_IN_WEEK,
    ) + 1;
  return Array.from({ length: Math.max(weekCount, 0) }, (_, index) => {
    const monday = addToDate(firstMonday, { day: index * DAYS_IN_WEEK });
    const offset = Math.round(
      getDateDiff(monday, thisMonday, 'days') / DAYS_IN_WEEK,
    );
    return {
      days: Array.from({ length: DAYS_IN_WEEK }, (_, day) =>
        buildDay(addToDate(monday, { day })),
      ),
      key: toKey(monday),
      offset,
      range: formatRange(monday, addToDate(monday, { day: DAYS_IN_WEEK - 1 })),
      title: weekTitle(offset),
    };
  });
});

const enabledKeys = computed(() =>
  weeks.value.flatMap((week) =>
    week.days.filter((day) => day.enabled).map((day) => day.key),
  ),
);

// The one day reachable with Tab (arrow keys move between days): the day
// last moved to, else the selected day, else today, else the first day.
const activeKey = computed(() => {
  const candidates = [focusKey.value, model.value, toKey(today)];
  return (
    candidates.find((key) => !!key && enabledKeys.value.includes(key)) ??
    enabledKeys.value[0]
  );
});

const dayClasses = (day: CalendarDay) => ({
  [`week-calendar__status--${day.status}`]: !!day.status,
  'week-calendar__day--has-status': !!day.status,
  'week-calendar__day--selected': day.key === model.value,
  'week-calendar__day--today': day.isToday,
});

const select = (key: string) => {
  focusKey.value = key;
  model.value = key;
};

const onKeydown = (event: KeyboardEvent) => {
  const step = ARROW_STEPS[event.key];
  const currentKey = (event.target as HTMLElement | null)?.dataset?.date;
  if (!step || !currentKey) return;
  event.preventDefault();
  const nextKey = toKey(addToDate(dateFromString(currentKey), { day: step }));
  if (!enabledKeys.value.includes(nextKey)) return;
  focusKey.value = nextKey;
  void nextTick(() => {
    root.value
      ?.querySelector<HTMLButtonElement>(`[data-date="${nextKey}"]`)
      ?.focus();
  });
};
</script>

<style lang="scss" scoped>
.week-calendar {
  // Its own background: below Quasar's popup breakpoint, q-popup-proxy shows
  // this in a dialog, which has none.
  background: white;
  border: 0;
  border-radius: $generic-border-radius;
  margin: 0;
  min-inline-size: 0;
  padding: 8px 10px 10px;
  user-select: none;
  // As wide as the grid: the legend wraps under it rather than widening it.
  width: min-content;
  --status-tint: 18%;
}

body.body--dark .week-calendar {
  background: $dark;
  --status-tint: 28%;
}

.week-calendar__grid {
  display: grid;
  grid-template-columns: auto repeat(7, 34px);
}

.week-calendar__row {
  align-items: center;
  border-radius: $generic-border-radius;
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  padding: 1px 0;

  & + & {
    margin-top: 2px;
  }
}

.week-calendar__row--current {
  background: color-mix(in srgb, var(--q-primary) 9%, transparent);
}

.week-calendar__weekday {
  font-size: 12px;
  opacity: 0.7;
  padding: 4px 0;
  text-align: center;
}

.week-calendar__label {
  line-height: 1.25;
  padding: 0 12px 0 6px;
  white-space: nowrap;
}

.week-calendar__label-title {
  font-size: 12px;
  font-weight: 600;
}

.week-calendar__label-range {
  font-size: 11px;
  opacity: 0.7;
}

.week-calendar__day {
  background: transparent;
  border: 0;
  border-radius: $generic-border-radius;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  height: 30px;
  justify-self: center;
  padding: 0;
  width: 32px;

  &:hover:not(:disabled, .week-calendar__day--selected) {
    background: color-mix(in srgb, currentColor 10%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--q-primary);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: default;
    opacity: 0.38;
  }
}

.week-calendar__day--today:not(.week-calendar__day--selected) {
  box-shadow: inset 0 0 0 1px currentColor;
}

.week-calendar__day--has-status {
  background: color-mix(
    in srgb,
    var(--status-color) var(--status-tint),
    transparent
  );
  font-weight: 600;

  &:hover:not(:disabled, .week-calendar__day--selected) {
    background: color-mix(in srgb, var(--status-color) 40%, transparent);
  }
}

.week-calendar__day--selected {
  background: var(--q-primary);
  color: white;
}

.week-calendar__status--ready {
  --status-color: #{$positive};
}

.week-calendar__status--pending {
  --status-color: #{$warning};
}

.week-calendar__status--error {
  --status-color: #{$negative};
}

.week-calendar__status--added {
  --status-color: #{$additional};
}

.week-calendar__legend {
  border-top: 1px solid rgba(128, 128, 128, 0.25);
  display: flex;
  flex-wrap: wrap;
  font-size: 11.5px;
  gap: 4px 14px;
  margin-top: 8px;
  opacity: 0.8;
  padding: 8px 4px 0;
}

.week-calendar__legend-item {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.week-calendar__swatch {
  background: color-mix(in srgb, var(--status-color) 70%, transparent);
  border-radius: 3px;
  height: 10px;
  width: 10px;
}
</style>
