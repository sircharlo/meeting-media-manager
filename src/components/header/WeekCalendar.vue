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
          <div
            v-if="week.special"
            class="week-calendar__label-special"
            :class="`week-calendar__label-special--${week.special}`"
          >
            {{ specialCaptions[week.special] }}
          </div>
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
        v-for="status in legendStatuses"
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
import type { CalendarDayStatus, SpecialWeekKind } from 'src/types';

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
const SPECIAL_WEEK_KINDS: SpecialWeekKind[] = ['co', 'memorial'];

const props = defineProps<{
  /** Status of each day that has one, keyed by `YYYY/MM/DD`. */
  dayStatuses?: Partial<Record<string, CalendarDayStatus>>;
  /** Last selectable day. Defaults to the end of the fetched weeks. */
  max?: Date;
  /** First selectable day. Defaults to this week's Monday. */
  min?: Date;
  /** The circuit overseer's visit or the Memorial, keyed by its Monday. */
  specialWeeks?: Partial<Record<string, SpecialWeekKind>>;
}>();

/** The selected day, as `YYYY/MM/DD`. */
const model = defineModel<string>({ required: true });

const { t } = useI18n();
const { dateLocale, formatDayMonthRange } = useLocale();
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
  co: t('special-week-co-title'),
  error: t('error'),
  memorial: t('special-week-memorial-title'),
  pending: t('calendar-status-pending'),
  ready: t('calendar-status-ready'),
}));

const specialCaptions = computed<Record<SpecialWeekKind, string>>(() => ({
  co: t('special-week-co-chip'),
  memorial: t('special-week-memorial-title'),
}));

// Meeting weeks always run Monday to Sunday, whatever the first-day-of-week
// setting says: rows line up with the weeks M³ fetches.
const weekdayNames = computed(() => {
  const [sunday, ...others] = dateLocale.value.daysShort;
  return [...others, sunday];
});

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
    const key = toKey(monday);
    return {
      days: Array.from({ length: DAYS_IN_WEEK }, (_, day) =>
        buildDay(addToDate(monday, { day })),
      ),
      key,
      offset,
      range: formatDayMonthRange(
        monday,
        addToDate(monday, { day: DAYS_IN_WEEK - 1 }),
      ),
      special: props.specialWeeks?.[key],
      title: weekTitle(offset),
    };
  });
});

// The usual statuses, then a special week's colour while one is in view.
const legendStatuses = computed<CalendarDayStatus[]>(() => {
  const shownKinds = new Set(
    weeks.value.map((week) => week.special).filter((kind) => !!kind),
  );
  return [
    ...STATUS_ORDER,
    ...SPECIAL_WEEK_KINDS.filter((kind) => shownKinds.has(kind)),
  ];
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
  // As wide as the grid at its natural width. The legend doesn't count (see
  // below), so it wraps under the grid rather than widening it.
  width: max-content;
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

// Some languages have no short name for a special week (Russian's is about
// 30 characters). Past this width the caption wraps instead of widening the
// label column, and so the whole popup.
.week-calendar__label-special {
  font-size: 11px;
  font-weight: 600;
  max-width: 8.5rem;
  white-space: normal;
}

.week-calendar__label-special--co {
  color: $co-week-strong;
}

.week-calendar__label-special--memorial {
  color: $memorial-week-strong;
}

body.body--dark .week-calendar__label-special--co {
  color: $co-week-strong-dark;
}

body.body--dark .week-calendar__label-special--memorial {
  color: $memorial-week-strong-dark;
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

.week-calendar__status--co {
  --status-color: #{$co-week};
}

.week-calendar__status--memorial {
  --status-color: #{$memorial-week};
}

body.body--dark .week-calendar__status--memorial {
  --status-color: #{$memorial-week-dark};
}

.week-calendar__legend {
  border-top: 1px solid rgba(128, 128, 128, 0.25);
  // Takes the grid's width instead of setting the popup's.
  contain: inline-size;
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
